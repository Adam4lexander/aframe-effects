/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(1)
	__webpack_require__(2)

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	// Copyright 2017 Yannis Gravezas <wizgrav@gmail.com> MIT licensed

	AFRAME.registerSystem("effects", {
	    schema: { type: "array", default: [] },

	    init: function () {
	        this.effects = {};
	        this.enabled = {};
	        this.passes = [];
	        this._passes = [];
	        this.cameras = [];
	        this.setupPostState();
	        this.needsOverride = true;
	    },

	    update: function () {
	        this.needsUpdate = true;
	    },
	    
	    setupPostState: function () {
	        this.renderTarget = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
	        this.renderTarget.texture.generateMipmaps = false;
	        this.renderTarget.depthBuffer = true;
	        this.renderTarget.depthTexture = new THREE.DepthTexture();
	        this.renderTarget.depthTexture.type = THREE.UnsignedShortType;
	        this.renderTarget.depthTexture.minFilter = THREE.LinearFilter;
	        this.renderTarget.stencilBuffer = false;
	        this.scene = new THREE.Scene();
	        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	        this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
	        this.quad.frustumCulled = false;
	        this.scene.add(this.quad);
	        this.sceneLeft = new THREE.Scene();
	        this.quadLeft = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
	        this.quadLeft.geometry.attributes.uv.array.set([0, 1, 0.5, 1, 0, 0, 0.5, 0]);
	        this.quadLeft.frustumCulled = false;
	        this.sceneLeft.add(this.quadLeft);
	        this.sceneRight = new THREE.Scene();
	        this.quadRight = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
	        this.quadRight.geometry.attributes.uv.array.set([0.5, 1, 1, 1, 0.5, 0, 1, 0]);
	        this.quadRight.frustumCulled = false;
	        this.sceneRight.add(this.quadRight);
	        this.targets = [
	            new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }),
	            new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat })
	        ];
	        
	        this.tDiffuse = {type: "t", value: null};
	        this.tDepth = {type: "t", value: this.renderTarget.depthTexture};
	        this.cameraFar = {type: "f", value: 0};
	        this.cameraNear = {type: "f", value: 0};
	        this.time = { type: "f", value: 0 };
	        this.timeDelta = { type: "f", value: 0 };
	        this.uvClamp = { type: "v2", value: this.uvBoth };
	        this.resolution = { type: "v4", value: new THREE.Vector4() };

	    },

	    vertexShader: [
	        '#include <common>',
	        'varying vec2 vUv;',
	        'void main() {',
	        '   vUv = uv;',
	        '   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
	        '}'
	    ].join('\n'),

	    uvLeft: new THREE.Vector2(0, 0.5),
	    uvRight: new THREE.Vector2(0.5, 1),
	    uvBoth: new THREE.Vector2(0, 1),

	    renderPass: function (material, renderTarget, viewCb, forceClear){
	        var renderer = this.sceneEl.renderer;
	        this.quad.material = material;
	        var isFn = typeof viewCb === "function";
	        var s = renderTarget || renderer.getSize();
	        this.resolution.value.set(s.width, s.height, 1/s.width, 1/s.height);
	        var oldClear = renderer.autoClear;
	        renderer.autoClear = false;
	        if (viewCb) {
	            if (this.cameras.length > 1){
	                this.quadLeft.material = material;
	                this.uvClamp.value = this.uvLeft;
	                setView(0, 0, Math.round(s.width * 0.5), s.height);
	                if (isFn) viewCb(material, this.cameras[0], -1);
				    renderer.render(this.sceneLeft, this.camera, renderTarget, oldClear || forceClear);        
	                
	                this.quadRight.material = material;
	                this.uvClamp.value = this.uvRight;
	                setView(Math.round(s.width * 0.5), 0, Math.round(s.width * 0.5), s.height);
	                if (isFn) viewCb(material, this.cameras[1], 1);
	                renderer.render( this.sceneRight, this.camera, renderTarget);

	                this.uvClamp.value = this.uvBoth;
	                setView(0, 0, s.width, s.height);
	            } else {
	                setView(0, 0, s.width, s.height);
	                if (isFn) viewCb(material, this.sceneEl.camera, 0);
	                renderer.render( this.scene, this.camera, renderTarget, oldClear || forceClear);
	            }
	        } else {
	            setView(0, 0, s.width, s.height);
	            renderer.render(this.scene, this.camera, renderTarget, oldClear || forceClear);
	        }
	        renderer.autoClear = oldClear;
	        function setView(x,y,w,h) {
	            if (renderTarget) {
	                renderTarget.viewport.set( x, y, w, h );
					renderTarget.scissor.set( x, y, w, h );
	            } else {
	                renderer.setViewport( x, y, w, h );
					renderer.setScissor( x, y, w, h );
	            }
	        }
	    },

	    materialize: function (m) {
	        var fs = [
	            "uniform vec2 uvClamp;",
	            "vec4 textureVR( sampler2D sampler, vec2 uv ) {",
	            " return texture2D(sampler, vec2(clamp(uv.x, uvClamp.x, uvClamp.y), uv.y));",
	            "} ",
	            m.fragmentShader            
	        ].join("\n");
	        
	        m.uniforms.uvClamp = this.uvClamp;
	        
	        return new THREE.ShaderMaterial({
	            uniforms: m.uniforms,
	            vertexShader: m.vertexShader || this.vertexShader,
	            fragmentShader: fs,
	            depthWrite: false,
	            depthTest: false,
	            blending: THREE.NoBlending,
	            fog: false,
	            extensions: {
	                derivatives: true
	            },
	            defines: m.defines || {}
	        });
	    },

	    fuse: function (temp, alpha, objs) {
	        if (!temp.length) return;
	        var self = this;
	        var chunks = [], stack = {}, head = [], main = [], includes = {}, 
	            needsDepth = false, needsDiffuse = false, k; 
	        var uniforms = {
	            time: this.time,
	            resolution: this.resolution
	        };
	        temp.forEach(function (obj) {
	            var callMain = true;
	            if (typeof obj === "string") {
	                callMain = obj[obj.length-1] !== "!";
	                obj = obj.replace("!", "");
	                var temp = {};
	                if(obj[0] === "#") {
	                    var el = document.querySelector(obj);
	                    if(!el) return;
	                    obj = {
	                        attrName: obj.replace("#", "script_"),
	                        fragment: el.textContent,
	                        depth: el.dataset.depth !== undefined,
	                        diffuse: el.dataset.diffuse !== undefined,
	                        includes: el.dataset.includes ? el.dataset.includes.split(" ") : null
	                    };
	                } else if (obj[0] === "$"){
	                    k = obj.replace("$", "color_");
	                    main.push(k + " = color;");
	                    stack[k] = true;
	                    return;
	                } else if (obj[0] === "&"){
	                    k = obj.replace("&", "color_");
	                    main.push("color = " + k + ";");
	                    stack[k] = true;
	                    return;
	                } else if (obj[0] === "%"){
	                    k = obj.replace("%", "color_");
	                    main.push("origColor = " + k + ";");
	                    stack[k] = true;
	                    return;
	                } else if (obj[0] === "@" && objs){
	                    k = obj.replace("@", "");
	                    obj = objs[k];
	                    if (!obj) return;
	                } else {
	                    obj = self.effects[obj];
	                    if (!obj) return;
	                }
	            }
	            var prefix = obj.attrName + "_";
	            if (obj.diffuse) { needsDiffuse = true; }
	            if (obj.depth) { needsDepth = true; }
	            if (obj.fragment) { chunks.push(obj.fragment.replace(/\$/g, prefix)); }
	            if (obj.uniforms) {
	                for (var u in obj.uniforms) {
	                    uniforms[prefix + u] = obj.uniforms[u];
	                }
	            };
	            if (obj.includes) {
	                obj.includes.forEach(function (inc) {
	                    includes[inc] = true;
	                });
	            }
	            if (callMain) {
	                main.push("  " + obj.attrName + "_main(color, origColor, vUv, depth);");
	            }
	        });
	        var t2u = { "i": "int", "f": "float", "t": "sampler2D",
	            "v2": "vec2", "v3": "vec3", "c": "vec3","v4": "vec4", "b": "bool" };
	        for(k in includes) { head.push("#include <" + k + ">"); }
	        var premain = [
	            "void main () {", 
	        ];
	        uniforms["tDiffuse"] = this.tDiffuse;
	             
	        if (needsDiffuse){
	             premain.push("  vec4 color = texture2D(tDiffuse, vUv);"); 
	        } else {
	             premain.push("  vec4 color = vec4(0.0);"); 
	        }
	        premain.push("  vec4 origColor = color;");
	        for (k in stack) {
	            premain.push("  vec4 " + k + " = color;");
	        }
	        uniforms["tDepth"] = this.tDepth;
	        uniforms["cameraFar"] = this.cameraFar;
	        uniforms["cameraNear"] = this.cameraNear;
	            
	        if (needsDepth){
	            premain.push("  float depth = texture2D(tDepth, vUv).x;");
	        } else {
	            premain.push("  float depth = 0.0;");
	        }
	        
	        for(k in uniforms) {
	            var u = uniforms[k];
	            head.push(["uniform", t2u[u.type], k, ";"].join(" "));
	        }
	        
	        head.push("varying vec2 vUv;");
	        var source = [
	            head.join("\n"), chunks.join("\n"), "\n",
	                premain.join("\n"), main.join("\n"), 
	                alpha ? "  gl_FragColor = color;" : "  gl_FragColor = vec4(color.rgb, 1.0);", "}"
	        ].join("\n");
	        var material = this.materialize({
	            fragmentShader: source, 
	            uniforms: uniforms
	        });
	        console.log(source, material);
	        return material;
	    },

	    rebuild: function () {
	        var self = this, passes = [], temp = [];
	        this.passes.forEach(function(pass){
	            if (pass.dispose) pass.dispose();
	        });
	        this.enabled = {};
	        this.data.forEach(function (k) {
	            var obj, name;
	            name = k.replace("!", "");
	            obj = self.effects[name];
	            if (!obj){
	                temp.push(k);
	                return;
	            } else {
	                self.enabled[k] = true;
	            }
	            if (obj.pass) {
	                pickup();
	                passes.push({ pass: pass, behavior: obj } );
	            } else if (obj.material){
	                pickup();
	                passes.push({ pass: makepass(obj.material, false, obj.vr), behavior: obj });
	            } else {
	                temp.push(obj);
	            }          
	        });

	        function pickup () {
	            if (!temp.length) return;
	            passes.push({ pass: makepass(self.fuse(temp), true)});
	            temp = [];
	        }

	        function makepass (material, dispose, viewCb) {
	            return {
	                render: function(renderer, writeBuffer, readBuffer){
	                    self.renderPass(material, writeBuffer, viewCb);
	                },

	                dispose: function () {
	                    if (dispose) material.dispose();
	                }
	            }
	        }

	        pickup();

	        this.needsUpdate = false;
	        this.passes = passes;
	    },

	    isActive: function (behavior, resize) {
	        var scene = this.sceneEl;
	        var isEnabled = scene.renderTarget && this.enabled[behavior.attrName] === true ? true : false;
	        if (!isEnabled) return false;
	        if (resize && (this.needsResize || behavior.needsResize) && behavior.setSize) {
	            var size = scene.renderer.getSize();
	            behavior.setSize(size.width, size.height);
	            delete behavior.needsResize;
	        }
	        return true;
	    },

	    isEnabled: function (behavior) {
	        return this.enabled[behavior.attrName] === true ? true : false;
	    },

	    register: function (behavior) {
	        this.effects[behavior.attrName] = behavior;
	        this.needsUpdate = true;
	    },

	    unregister: function (behavior) {
	        delete this.effects[behavior.attrName];
	        this.needsUpdate = true;
	    },

	    tick: function (time, timeDelta) {
	        var self = this, sceneEl = this.sceneEl, renderer = sceneEl.renderer, effect = sceneEl.effect, 
	            rt = this.renderTarget, rts = this.targets;
	        if(!rt || !renderer) { return; }
	        if (this.needsOverride) {
	            var rendererRender = renderer.render;
	            renderer.render = function (scene, camera, renderTarget, forceClear) {
	                if (renderTarget === rt) {
	                    var size = renderer.getSize();
	                    if (size.width !== rt.width || size.height !== rt.height) {
	                        rt.setSize(size.width, size.height);
	                        rts[0].setSize(size.width, size.height);
	                        rts[1].setSize(size.width, size.height);
	                        self.resolution.value.set(size.width, size.height, 1/size.width, 1/size.height);
	                        self.needsResize = true;
	                    }
	                    self.cameras.push(camera);
	                }
	                rendererRender.call(renderer, scene, camera, renderTarget, forceClear);
	            }
	            this.needsOverride = false;
	        }
	        this.cameras = [];
	        this.time.value = time / 1000;
	        this.timeDelta.value = timeDelta;

	        if (this.needsUpdate === true) { this.rebuild(); }

	        var arr = [];
	        this.passes.forEach(function (p) {
	            if (p.behavior && p.behavior.bypass === true) return;
	            arr.push(p);
	        });
	        this.sceneEl.renderTarget = arr.length ? rt : null;
	        this._passes = arr;

	        this.tDiffuse.value = this.renderTarget.texture;
	        this.tDepth.value = this.renderTarget.depthTexture;
	        var camera = this.sceneEl.camera;
	        this.cameraFar.value = camera.far;
	        this.cameraNear.value = camera.near;                
	    },

	    tock: function () {
	        var scene = this.sceneEl, renderer = scene.renderer, self = this;
	        if(!scene.renderTarget) { return; }
	        
	        var rt = scene.renderTarget, rts = this.targets;
	        
	        this._passes.forEach(function (pass, i) {
	            var r = i ? rts[i & 1] : rt;
	            self.tDiffuse.value = r.texture;   
	            if (pass.behavior && pass.behavior.resize) self.isActive(pass.behavior, true);
	            pass.pass.render(renderer, i < self._passes.length - 1 ? rts[(i+1) & 1] : null, r);
	        });

	        this.needsResize = false;
	    }
	});

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(3);
	__webpack_require__(4);
	__webpack_require__(5);
	__webpack_require__(7);
	__webpack_require__(9);
	__webpack_require__(10);
	//require("./ssao");
	//require("./godrays");
	//require("./tonemap");


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	AFRAME.registerComponent("outline", {
		multiple: true,

	    schema: {
	        color: { type: "color", default: "#000000" },
			width: { type: "vec2", default: new THREE.Vector2(1,1) },
			range: { type: "vec2", default: new THREE.Vector2(0,1000) },
			strength: {type: "number", default: 1},
			ratio: { type: "number", default: 0.5 },
			sobel: { default: false },
			smooth: { default: false }  
		},

	    init: function () {
	        this.system = this.el.sceneEl.systems.effects;
			var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
	        this.renderTarget = new THREE.WebGLRenderTarget( 1, 1, pars );
			this.blurTarget = new THREE.WebGLRenderTarget( 1, 1, pars );
			this.needsResize = true;
			this.resolution = { type: "v4", value: new THREE.Vector4()};
			this.tockUniforms = {
				resolution: this.resolution,
	            color: { type: "v3", value: new THREE.Color() },
				width: { type: "v2", value: null },
				range: { type: "v2", value: null },
				strength: { type: "f", value: 1 }
	        };

			this.materialSobel = this.system.fuse([{
				fragment: this.sobel,
				uniforms: this.tockUniforms,
				includes: ["packing"],
				depth: true
			}], true);

			this.materialFreichen = this.system.fuse([{
				fragment: this.freichen,
				uniforms: this.tockUniforms,
				includes: ["packing"],
				depth: true
			}], true);
			
			this.blurDirection = { type: "v2", value: new THREE.Vector2()};
			
			this.blurMaterial = this.system.fuse([{
				fragment: this.blur,
				uniforms: { resolution: this.resolution, direction: this.blurDirection },
				diffuse: true
			}], true);

			this.uniforms = {
				texture: { type: "t", value: this.renderTarget.texture }
			}
			
			this.system.register(this);
	    },

	    update: function (oldData) {
	        this.tockUniforms.color.value.set(this.data.color);
			this.tockUniforms.width.value = this.data.width;
			this.tockUniforms.range.value = this.data.range;
			this.tockUniforms.strength.value = 1 / this.data.strength;
			this.currentMaterial = this.data.sobel ? this.materialSobel : this.materialFreichen;
	    },

		setSize: function(w, h) {
			w = Math.round(w * this.data.ratio);
			h = Math.round(h * this.data.ratio);
			this.renderTarget.setSize(w,h);
			this.blurTarget.setSize(w,h);
			this.resolution.value.set(w, h, 1/w, 1/h);
		},

		tock: function () {
			if (!this.system.isActive(this, true)) return;
			this.system.renderPass(this.currentMaterial, this.renderTarget);
			this.system.tDiffuse.value = this.renderTarget;
			if (!this.data.smooth) return;
			this.blurDirection.value.set(1,0);
			this.system.renderPass(this.blurMaterial, this.blurTarget);
			this.system.tDiffuse.value = this.blurTarget;
			this.blurDirection.value.set(0,1);
			this.system.renderPass(this.blurMaterial, this.renderTarget);
		},

	    remove: function () {
	        this.system.unregister(this);
	    },

	    diffuse: true,

	    sobel: [
			"mat3 G[2];",

			"const mat3 g0 = mat3( 1.0, 2.0, 1.0, 0.0, 0.0, 0.0, -1.0, -2.0, -1.0 );",
			"const mat3 g1 = mat3( 1.0, 0.0, -1.0, 2.0, 0.0, -2.0, 1.0, 0.0, -1.0 );",


			"void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth) {",
			
				"mat3 I;",
				"float cnv[2];",
				"float d;",

				"G[0] = g0;",
				"G[1] = g1;",

				"for (float i=0.0; i<3.0; i++)",
				"for (float j=0.0; j<3.0; j++) {",
			"           d = texture2D(tDepth, uv + resolution.zw * vec2(i-1.0,j-1.0) ).x;",
	        "           d = perspectiveDepthToViewZ(d, cameraNear, cameraFar); ",
			"			I[int(i)][int(j)] = viewZToOrthographicDepth(d, cameraNear, cameraFar);",
				"}",

				"for (int i=0; i<2; i++) {",
					"float dp3 = dot(G[i][0], I[0]) + dot(G[i][1], I[1]) + dot(G[i][2], I[2]);",
					"cnv[i] = dp3 * dp3; ",
				"}",
				"color = vec4($color, sqrt(cnv[0]*cnv[0]+cnv[1]*cnv[1]));",
			"} "
		].join("\n"),

	    freichen: [
	        "mat3 $G[9];",

			// hard coded matrix values!!!! as suggested in https://github.com/neilmendoza/ofxPostProcessing/blob/master/src/EdgePass.cpp#L45

			"const mat3 $g0 = mat3( 0.3535533845424652, 0, -0.3535533845424652, 0.5, 0, -0.5, 0.3535533845424652, 0, -0.3535533845424652 );",
			"const mat3 $g1 = mat3( 0.3535533845424652, 0.5, 0.3535533845424652, 0, 0, 0, -0.3535533845424652, -0.5, -0.3535533845424652 );",
			"const mat3 $g2 = mat3( 0, 0.3535533845424652, -0.5, -0.3535533845424652, 0, 0.3535533845424652, 0.5, -0.3535533845424652, 0 );",
			"const mat3 $g3 = mat3( 0.5, -0.3535533845424652, 0, -0.3535533845424652, 0, 0.3535533845424652, 0, 0.3535533845424652, -0.5 );",
			"const mat3 $g4 = mat3( 0, -0.5, 0, 0.5, 0, 0.5, 0, -0.5, 0 );",
			"const mat3 $g5 = mat3( -0.5, 0, 0.5, 0, 0, 0, 0.5, 0, -0.5 );",
			"const mat3 $g6 = mat3( 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.6666666865348816, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204 );",
			"const mat3 $g7 = mat3( -0.3333333432674408, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, 0.6666666865348816, 0.1666666716337204, -0.3333333432674408, 0.1666666716337204, -0.3333333432674408 );",
			"const mat3 $g8 = mat3( 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408, 0.3333333432674408 );",

			"void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth) {",
	        
			"	$G[0] = $g0,",
			"	$G[1] = $g1,",
			"	$G[2] = $g2,",
			"	$G[3] = $g3,",
			"	$G[4] = $g4,",
			"	$G[5] = $g5,",
			"	$G[6] = $g6,",
			"	$G[7] = $g7,",
			"	$G[8] = $g8;",

			"	mat3 I;",
			"	float cnv[9];",
			"	float d = texture2D(tDepth, uv).x;",
			"   d = perspectiveDepthToViewZ(d, cameraNear, cameraFar); ",
			"	float att = mix($width.x, $width.y, smoothstep($range.x, $range.y, -d));",
			"	d = viewZToOrthographicDepth(d, cameraNear, cameraFar);",
			"	I[1][1] = d;",
			"	for (float i=0.0; i<3.0; i++) {",
			"		for (float j=0.0; j<3.0; j++) {",
			"			if (j == 1.0 && i == 1.0) continue;",
	        "           d = texture2D(tDepth, uv + att * resolution.zw * vec2(i-1.0,j-1.0) ).x;",
	        "           d = perspectiveDepthToViewZ(d, cameraNear, cameraFar); ",
			"			I[int(i)][int(j)] = viewZToOrthographicDepth(d, cameraNear, cameraFar);",
			"		}",
			"	}",

			"	for (int i=0; i<9; i++) {",
			"		float dp3 = dot($G[i][0], I[0]) + dot($G[i][1], I[1]) + dot($G[i][2], I[2]);",
			"		cnv[i] = dp3 * dp3;",
			"	}",

			"	float M = (cnv[0] + cnv[1]) + (cnv[2] + cnv[3]);",
			"	float S = (cnv[4] + cnv[5]) + (cnv[6] + cnv[7]) + (cnv[8] + M);",
	        "   float v = smoothstep(0., $strength, sqrt(M/S));",
			"	color = vec4($color, v);",
	      	"}"

		].join( "\n" ),

		blur: [
			"void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth){",
			"color.a *= 0.44198;",
			"color.a += texture2D(tDiffuse, uv + ($direction * $resolution.zw )).a * 0.27901;",
			"color.a += texture2D(tDiffuse, uv - ($direction * $resolution.zw )).a * 0.27901;",
			"}"
		].join("\n"),

		fragment: [
	        "void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth){",
	        "	vec4 texel = texture2D($texture, uv);",
			"   color.rgb = mix(color.rgb, texel.rgb, smoothstep(0.1,0.3,texel.a));",
	        "}"
	    ].join("\n")
	});

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	AFRAME.registerComponent("film", {
	    multiple: true,

	    schema: {
	        "speed":       { default: 1.0 },
	        "nIntensity": { default: 0.5 },
	        "sIntensity": { default: 0.05 },
	        "sCount":     { default: 4096 }
		},

	    init: function () {
	        this.uniforms = {
	            "speed":       { type: "f", value: 0.0 },
	            "nIntensity": { type: "f", value: 0.5 },
	            "sIntensity": { type: "f", value: 0.05 },
	            "sCount":     { type: "f", value: 4096 }
		    };
	        this.system = this.el.sceneEl.systems.effects;
	        this.system.register(this);
	    },

	    update: function () {
	        var d = this.data, us =  this.uniforms;
	        for(var u in us) {
	            if(d[u]) us[u].value = d[u]; 
	        }
	    },

	    remove: function () {
	        this.system.unregister(this);
	    },

	    includes: ["common"],

	    diffuse: true,

	    fragment: [
			"void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth) {",
			"   vec4 cTextureScreen = color;",
			"   float dx = rand( uv + mod(time, 3.14) * $speed );",
			"   vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx, 0.0, 1.0 );",
			"   vec2 sc = vec2( sin( uv.y * $sCount ), cos( uv.y * $sCount ) );",
			"   cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * $sIntensity;",
	        "   cResult = cTextureScreen.rgb + clamp( $nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );",
			"   color.rgb =  cResult; //cResult;",
			"}"
		].join( "\n" )
	});

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	var FXAAShader = __webpack_require__(6);

	AFRAME.registerComponent("fxaa", {
	    schema: { default: true },

	    init: function () {
	        this.system = this.el.sceneEl.systems.effects;
	        this.material = new THREE.ShaderMaterial({
	            fragmentShader: FXAAShader.fragmentShader,
	            vertexShader: FXAAShader.vertexShader,
	            uniforms: {
	                tDiffuse: this.system.tDiffuse,
	                resolution: { type: 'v2', value: new THREE.Vector2() }
	            }
	        });
	        this.system.register(this);
	        this.needsResize = true;
	    },

	    update: function () {
	        this.bypass = !this.data;
	    },

	    setSize: function (w, h) {
	        this.material.uniforms.resolution.value.set(w, h);
	    },

	    resize: true,

	    remove: function () {
	        this.material.dispose();
	        this.system.unregister(this);
	    }
	});

/***/ }),
/* 6 */
/***/ (function(module, exports) {

	
	// Adapted from https://github.com/mattdesl/three-shader-fxaa
	module.exports =  {
	  uniforms: {
	    tDiffuse: { type: 't', value: null },
	    resolution: { type: 'v2', value: new THREE.Vector2() }
	  },
	  vertexShader: "#define GLSLIFY 1\nvarying vec2 vUv;\n\nvarying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\nuniform vec2 resolution;\n\nvoid main() {\n  vUv = uv;\n  vec2 fragCoord = uv * resolution;\n  vec2 inverseVP = 1.0 / resolution.xy;\n  v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;\n  v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;\n  v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;\n  v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;\n  v_rgbM = vec2(fragCoord * inverseVP);\n\n  gl_Position = projectionMatrix *\n              modelViewMatrix *\n              vec4(position,1.0);\n}\n",
	  fragmentShader: "#define GLSLIFY 1\nvarying vec2 vUv;\n\n//texcoords computed in vertex step\n//to avoid dependent texture reads\nvarying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\n//make sure to have a resolution uniform set to the screen size\nuniform vec2 resolution;\nuniform sampler2D tDiffuse;\n\n/**\nBasic FXAA implementation based on the code on geeks3d.com with the\nmodification that the texture2DLod stuff was removed since it's\nunsupported by WebGL.\n\n--\n\nFrom:\nhttps://github.com/mitsuhiko/webgl-meincraft\n\nCopyright (c) 2011 by Armin Ronacher.\n\nSome rights reserved.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are\nmet:\n\n    * Redistributions of source code must retain the above copyright\n      notice, this list of conditions and the following disclaimer.\n\n    * Redistributions in binary form must reproduce the above\n      copyright notice, this list of conditions and the following\n      disclaimer in the documentation and/or other materials provided\n      with the distribution.\n\n    * The names of the contributors may not be used to endorse or\n      promote products derived from this software without specific\n      prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n\"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\nLIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\nA PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\nOWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\nSPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\nLIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\nDATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\nTHEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\nOF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n*/\n\n#ifndef FXAA_REDUCE_MIN\n    #define FXAA_REDUCE_MIN   (1.0/ 128.0)\n#endif\n#ifndef FXAA_REDUCE_MUL\n    #define FXAA_REDUCE_MUL   (1.0 / 8.0)\n#endif\n#ifndef FXAA_SPAN_MAX\n    #define FXAA_SPAN_MAX     8.0\n#endif\n\n//optimized version for mobile, where dependent \n//texture reads can be a bottleneck\nvec4 fxaa_1540259130(sampler2D tex, vec2 fragCoord, vec2 resolution,\n            vec2 v_rgbNW, vec2 v_rgbNE, \n            vec2 v_rgbSW, vec2 v_rgbSE, \n            vec2 v_rgbM) {\n    vec4 color;\n    mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);\n    vec3 rgbNW = texture2D(tex, v_rgbNW).xyz;\n    vec3 rgbNE = texture2D(tex, v_rgbNE).xyz;\n    vec3 rgbSW = texture2D(tex, v_rgbSW).xyz;\n    vec3 rgbSE = texture2D(tex, v_rgbSE).xyz;\n    vec4 texColor = texture2D(tex, v_rgbM);\n    vec3 rgbM  = texColor.xyz;\n    vec3 luma = vec3(0.299, 0.587, 0.114);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n    \n    mediump vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n    \n    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *\n                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n    \n    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\n              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n              dir * rcpDirMin)) * inverseVP;\n    \n    vec3 rgbA = 0.5 * (\n        texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +\n        texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);\n    vec3 rgbB = rgbA * 0.5 + 0.25 * (\n        texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +\n        texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);\n\n    float lumaB = dot(rgbB, luma);\n    if ((lumaB < lumaMin) || (lumaB > lumaMax))\n        color = vec4(rgbA, texColor.a);\n    else\n        color = vec4(rgbB, texColor.a);\n    return color;\n}\n\nvoid main() {\n  vec2 fragCoord = vUv * resolution;   \n  gl_FragColor = fxaa_1540259130(tDiffuse, fragCoord, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n}\n"
	}



/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	// Adapted from spidersharma UnrealBloomPass
	var LuminosityHighPassShader = __webpack_require__(8);

	var BlurDirectionX = new THREE.Vector2( 1.0, 0.0 );
	var BlurDirectionY = new THREE.Vector2( 0.0, 1.0 );

	AFRAME.registerComponent("bloom", {
		multiple: true,

	    schema: {
	        strength: { default: 1 },
	        radius: { default: 0.4 },
	        threshold: { default: 0.8 },
			filter: { type: "array", default: ["@default"] }
	    },

	    init: function () {
	        this.system = this.el.sceneEl.systems.effects;
	        var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
	        this.renderTargetsHorizontal = [];
	        this.renderTargetsVertical = [];
	        this.nMips = 5;
	        
	        this.renderTargetBright = new THREE.WebGLRenderTarget( 1, 1, pars );
	        this.renderTargetBright.texture.name = "UnrealBloomPass.bright";
	        this.renderTargetBright.texture.generateMipmaps = false;

	        for( var i=0; i<this.nMips; i++) {

	            var renderTarget = new THREE.WebGLRenderTarget( 1, 1, pars );

	            renderTarget.texture.name = "UnrealBloomPass.h" + i;
	            renderTarget.texture.generateMipmaps = false;

	            this.renderTargetsHorizontal.push(renderTarget);

	            var renderTarget = new THREE.WebGLRenderTarget( 1, 1, pars );

	            renderTarget.texture.name = "UnrealBloomPass.v" + i;
	            renderTarget.texture.generateMipmaps = false;

	            this.renderTargetsVertical.push(renderTarget);

	        }

	        // luminosity high pass material as @default
			this.filters = {
				default: {
					uniforms: {
						"luminosityThreshold": { type: "f", value: 1.0 },
						"smoothWidth": { type: "f", value: 0.01 },
						"defaultColor": { type: "c", value: new THREE.Color( 0x000000 ) },
						"defaultOpacity":  { type: "f", value: 1.0 }
					},
					diffuse: true,
					fragment: [
						"void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth) {",
							"vec4 texel = color;",
							"float v = dot( texel.xyz, vec3( 0.299, 0.587, 0.114 ) );",
							"vec4 outputColor = vec4( $defaultColor.rgb, $defaultOpacity );",
							"float alpha = smoothstep( $luminosityThreshold, $luminosityThreshold + $smoothWidth, v );",
							"color = mix( outputColor, texel, alpha );",
						"}"
					].join("\n")
				}
			}

	        this.materialHighPassFilter = null;
	        // Gaussian Blur Materials
	        this.separableBlurMaterials = [];
	        var kernelSizeArray = [3, 5, 7, 9, 11];
	        
	        for( var i=0; i<this.nMips; i++) {

	            this.separableBlurMaterials.push(this.getSeperableBlurMaterial(kernelSizeArray[i]));

	            this.separableBlurMaterials[i].uniforms[ "texSize" ].value = new THREE.Vector2(1, 1);

	        }

	        // Composite material
	        this.compositeMaterial = this.getCompositeMaterial(this.nMips);
	        this.compositeMaterial.uniforms["blurTexture1"].value = this.renderTargetsVertical[0].texture;
	        this.compositeMaterial.uniforms["blurTexture2"].value = this.renderTargetsVertical[1].texture;
	        this.compositeMaterial.uniforms["blurTexture3"].value = this.renderTargetsVertical[2].texture;
	        this.compositeMaterial.uniforms["blurTexture4"].value = this.renderTargetsVertical[3].texture;
	        this.compositeMaterial.uniforms["blurTexture5"].value = this.renderTargetsVertical[4].texture;
	        this.compositeMaterial.needsUpdate = true;

	        var bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
	        this.compositeMaterial.uniforms["bloomFactors"].value = bloomFactors;
	        this.bloomTintColors = [new THREE.Vector3(1,1,1), new THREE.Vector3(1,1,1), new THREE.Vector3(1,1,1)
	                                                    ,new THREE.Vector3(1,1,1), new THREE.Vector3(1,1,1)];
	        this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;
			this.oldClearColor = new THREE.Color();
	        this.uniforms = {
	            "texture": { type: "t", value: this.renderTargetsHorizontal[0] }
	        }
	        this.needsResize = true;
	        this.system.register(this);
	    },

		update: function (oldData) {
			if (oldData.filter !== this.data.filter) {
				if (this.materialHighPassFilter) this.materialHighPassFilter.dispose();
				this.materialHighPassFilter = this.system.fuse(this.data.filter, false, this.filters);
			}
		},

	    tock: function (time) {
	        if (!this.system.isActive(this, true)) return;
			var scene = this.el.sceneEl;
			var renderer = scene.renderer;
	        var readBuffer = scene.renderTarget;
	        this.oldClearColor.copy( renderer.getClearColor() );
			this.oldClearAlpha = renderer.getClearAlpha();
			var oldAutoClear = renderer.autoClear;
			renderer.autoClear = false;

			renderer.setClearColor( new THREE.Color( 0, 0, 0 ), 0 );

			// 1. Extract Bright Areas
			this.system.tDiffuse.value = readBuffer.texture;
			this.filters.default.uniforms[ "luminosityThreshold" ].value = this.data.threshold;
			this.system.renderPass(this.materialHighPassFilter, this.renderTargetBright, null, false);

			// 2. Blur All the mips progressively
			var inputRenderTarget = this.renderTargetBright;

			for(var i=0; i<this.nMips; i++) {
		
				this.separableBlurMaterials[i].uniforms[ "colorTexture" ].value = inputRenderTarget.texture;

				this.separableBlurMaterials[i].uniforms[ "direction" ].value = BlurDirectionX;

	            this.system.renderPass(this.separableBlurMaterials[i], this.renderTargetsHorizontal[i], true);

				this.separableBlurMaterials[i].uniforms[ "colorTexture" ].value = this.renderTargetsHorizontal[i].texture;

				this.separableBlurMaterials[i].uniforms[ "direction" ].value = BlurDirectionY;

				this.system.renderPass(this.separableBlurMaterials[i], this.renderTargetsVertical[i], true);

				inputRenderTarget = this.renderTargetsVertical[i];
			}

			// Composite All the mips
			this.compositeMaterial.uniforms["bloomStrength"].value = this.data.strength;
			this.compositeMaterial.uniforms["bloomRadius"].value = this.data.radius;
			this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;
	        this.system.renderPass(this.compositeMaterial, this.renderTargetsHorizontal[0], null);

			renderer.setClearColor( this.oldClearColor, this.oldClearAlpha );
			renderer.autoClear = oldAutoClear;
		},

	    setSize: function ( width, height ) {

			var resx = Math.round(width/2);
			var resy = Math.round(height/2);

			this.renderTargetBright.setSize(resx, resy);

			for( var i=0; i<this.nMips; i++) {

				this.renderTargetsHorizontal[i].setSize(resx, resy);
				this.renderTargetsVertical[i].setSize(resx, resy);

				this.separableBlurMaterials[i].uniforms[ "texSize" ].value = new THREE.Vector2(resx, resy);

				resx = Math.round(resx/2);
				resy = Math.round(resy/2);
			}
		},

	    remove: function () {
	        this.system.unregister(this);
	        for( var i=0; i< this.renderTargetsHorizontal.length(); i++) {
				this.renderTargetsHorizontal[i].dispose();
			}
			for( var i=0; i< this.renderTargetsVertical.length(); i++) {
				this.renderTargetsVertical[i].dispose();
			}
			this.renderTargetBright.dispose();
	    },

	    getSeperableBlurMaterial: function(kernelRadius) {

			return this.system.materialize( {

				defines: {
					"KERNEL_RADIUS" : kernelRadius,
					"SIGMA" : kernelRadius
				},

				uniforms: {
					"colorTexture": { value: null },
					"texSize": 				{ value: new THREE.Vector2( 0.5, 0.5 ) },
					"direction": 				{ value: new THREE.Vector2( 0.5, 0.5 ) }
				},

				vertexShader:
					"varying vec2 vUv;\n\
					void main() {\n\
						vUv = uv;\n\
						gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
					}",

				fragmentShader:
					"#include <common>\
					varying vec2 vUv;\n\
					uniform sampler2D colorTexture;\n\
					uniform vec2 texSize;\
					uniform vec2 direction;\
					float gaussianPdf(in float x, in float sigma) {\
						return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\
					}\
					void main() {\n\
						vec2 invSize = 1.0 / texSize;\
						float fSigma = float(SIGMA);\
						float weightSum = gaussianPdf(0.0, fSigma);\
						vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;\
						for( int i = 1; i < KERNEL_RADIUS; i ++ ) {\
							float x = float(i);\
							float w = gaussianPdf(x, fSigma);\
							vec2 uvOffset = direction * invSize * x;\
							vec3 sample1 = textureVR( colorTexture, vUv + uvOffset).rgb;\
							vec3 sample2 = textureVR( colorTexture, vUv - uvOffset).rgb;\
							diffuseSum += (sample1 + sample2) * w;\
							weightSum += 2.0 * w;\
						}\
						gl_FragColor = vec4(diffuseSum/weightSum, 1.0);\n\
					}"
			} );
		},

		getCompositeMaterial: function(nMips) {

			return new THREE.ShaderMaterial( {

				defines:{
					"NUM_MIPS" : nMips
				},

				uniforms: {
					"blurTexture1": { value: null },
					"blurTexture2": { value: null },
					"blurTexture3": { value: null },
					"blurTexture4": { value: null },
					"blurTexture5": { value: null },
					"bloomStrength" : { value: 1.0 },
					"bloomFactors" : { value: null },
					"bloomTintColors" : { value: null },
					"bloomRadius" : { value: 0.0 }
				},

				vertexShader:
					"varying vec2 vUv;\n\
					void main() {\n\
						vUv = uv;\n\
						gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
					}",

				fragmentShader:
					"varying vec2 vUv;\
					uniform sampler2D blurTexture1;\
					uniform sampler2D blurTexture2;\
					uniform sampler2D blurTexture3;\
					uniform sampler2D blurTexture4;\
					uniform sampler2D blurTexture5;\
					uniform float bloomStrength;\
					uniform float bloomRadius;\
					uniform float bloomFactors[NUM_MIPS];\
					uniform vec3 bloomTintColors[NUM_MIPS];\
					\
					float lerpBloomFactor(const in float factor) { \
						float mirrorFactor = 1.2 - factor;\
						return mix(factor, mirrorFactor, bloomRadius);\
					}\
					\
					void main() {\
						gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) + \
						 							 lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) + \
													 lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) + \
													 lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) + \
													 lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );\
					}"
			} );
		},

		diffuse: true,

	    fragment: [
	        "void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth){",
	        "   color.rgb += texture2D($texture, uv).rgb;",
	        "}"
	    ].join("\n")
	});

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	/**
	 * @author bhouston / http://clara.io/
	 *
	 * Luminosity
	 * http://en.wikipedia.org/wiki/Luminosity
	 */

	module.exports = {

	  shaderID: "luminosityHighPass",

		uniforms: {

			"tDiffuse": { type: "t", value: null },
			"luminosityThreshold": { type: "f", value: 1.0 },
			"smoothWidth": { type: "f", value: 1.0 },
			"defaultColor": { type: "c", value: new THREE.Color( 0x000000 ) },
			"defaultOpacity":  { type: "f", value: 0.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = uv;",

				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D tDiffuse;",
			"uniform vec3 defaultColor;",
			"uniform float defaultOpacity;",
			"uniform float luminosityThreshold;",
			"uniform float smoothWidth;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 texel = texture2D( tDiffuse, vUv );",

				"vec3 luma = vec3( 0.299, 0.587, 0.114 );",

				"float v = dot( texel.xyz, luma );",

				"vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );",

				"float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );",

				"gl_FragColor = mix( outputColor, texel, alpha );",

			"}"

		].join("\n")

	};


/***/ }),
/* 9 */
/***/ (function(module, exports) {

	AFRAME.registerComponent("colors", {
	    multiple: true,

	    schema: {
	        "mode": { default: "map" },
	        "lut": { type: "selector"},
	        "lutClamp": { default: false },
	        "lutFlip": { default: false },
	        "add": { type: "vec3", default: new THREE.Vector3(0,0,0) },
	        "mul": { type: "vec3", default: new THREE.Vector3(1,1,1) },
	        "pow": { type: "vec3", default: new THREE.Vector3(1,1,1) },
	        "left": { type: "vec3", default: new THREE.Vector3(0,0,0) },
	        "right": { type: "vec3", default: new THREE.Vector3(1,1,1) },
	        "min": { type: "vec3", default: new THREE.Vector3(0,0,0) },
	        "max": { type: "vec3", default: new THREE.Vector3(1,1,1) },
	        "quant": { type: "vec3", default: new THREE.Vector3(0.2,0.2,0.2) },
	        "orig": { type: "vec3", default: new THREE.Vector3(1,1,1) },
	        "red": { type: "vec3", default: new THREE.Vector3(1,0,0) },
	        "green": { type: "vec3", default: new THREE.Vector3(0,0.5,0.5) },
	        "blue": { type: "vec3", default: new THREE.Vector3(0,0.5,0.5) },
	    },

	    init: function () {
	        this.system = this.el.sceneEl.systems.effects;
	        this.uniforms = {
	            "add": { type: "v3", value: null },
	            "mul": { type: "v3", value: null },
	            "pow": { type: "v3", value: null },
	            "left": { type: "v3", value: null },
	            "right": { type: "v3", value: null },
	            "min": { type: "v3", value: null },
	            "max": { type: "v3", value: null },
	            "quant": { type: "v3", value: null },
	            "orig": { type: "v3", value: null },
	            "red": { type: "v3", value: null },
	            "green": { type: "v3", value: null },
	            "blue": { type: "v3", value: null },
	            "texture": { type: "t", value: null}
	        }
	        
	        this.rebuild();
	    
	        this.system.register(this);
	    },

	    update: function (oldData) {
	        var d = this.data, us =  this.uniforms, needsRebuild = false;
	        
	        for(var u in us) {
	            if(d[u] !== undefined) us[u].value = d[u]; 
	        }
	        []
	        if(this.data.lutFlip !== oldData.lutFlip || this.data.lutClamp !== oldData.lutClamp || this.data.mode != oldData.mode) {
	            this.rebuild();
	        }

	        if(this.data.lut !== oldData.lut) {
	            if(this.uniforms.texture.value) this.uniforms.texture.value.dispose();
	            this.uniforms.texture.value = new THREE.Texture(this.data.lut);
	        }
	    },

	    remove: function () {
	        this.system.unregister(this);
	    },

	    rebuild: function () {
	        var arr = [], m = this.data.mode;
	        for(var i=0; i < m.length; i++){
	            var op = this.ops[m[i]];
	            if(op) arr.push(op);
	        }
	        
	        this.fragment = [
	            this.data.lutClamp ? "" : "#define $LUT_NO_CLAMP 1",
	            this.data.lutFlip ? "#define $LUT_FLIP_Y 1" : "",
	            this.preFragment, 
	            arr.join("\n"), 
	            "}"
	        ].join("\n");

	        if(this.system && this.system.isEnabled(this)) this.system.needsUpdate = true;
	    },

	    ops: {
	        "m": "color.rgb *= $mul;",
	        "a": "color.rgb += $add;",
	        "p": "color.rgb = pow(color.rgb, $pow);",
	        "h": "color.rgb = $rgb2hsv(color.rgb);",
	        "r": "color.rgb = $hsv2rgb(color.rgb);",
	        "s": "color.rgb = smoothstep($left, $right, color.rgb);",
	        "l": "color.rgb = $lut(color).rgb;",
	        "q": "color.rgb = floor(color.rgb / $quant) * $quant;",
	        "c": "color.rgb = clamp(color.rgb, $min, $max);",
	        "g": "color.rgb = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));",
	        "o": "color.rgb = mix(color.rgb, orig.rgb, $orig);",
	        "t": "color.rgb = vec3(dot(color.rgb, $red), dot(color.rgb, $green), dot(color.rgb, $blue));",
	    },

	    diffuse: true,

	    preFragment: [
	        // Lut from https://github.com/mattdesl/glsl-lut
	        "vec4 $lut(vec4 textureColor) {",
	        "    #ifndef $LUT_NO_CLAMP",
	        "        textureColor = clamp(textureColor, 0.0, 1.0);",
	        "    #endif",

	        "    mediump float blueColor = textureColor.b * 63.0;",

	        "    mediump vec2 quad1;",
	        "    quad1.y = floor(floor(blueColor) / 8.0);",
	        "    quad1.x = floor(blueColor) - (quad1.y * 8.0);",

	        "    mediump vec2 quad2;",
	        "    quad2.y = floor(ceil(blueColor) / 8.0);",
	        "    quad2.x = ceil(blueColor) - (quad2.y * 8.0);",

	        "    highp vec2 texPos1;",
	        "    texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);",
	        "    texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);",

	        "    #ifdef $LUT_FLIP_Y",
	        "        texPos1.y = 1.0-texPos1.y;",
	        "    #endif",

	        "    highp vec2 texPos2;",
	        "    texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);",
	        "    texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);",

	        "    #ifdef $LUT_FLIP_Y",
	        "        texPos2.y = 1.0-texPos2.y;",
	        "    #endif",

	        "    lowp vec4 newColor1 = texture2D($texture, texPos1);",
	        "    lowp vec4 newColor2 = texture2D($texture, texPos2);",

	        "    lowp vec4 newColor = mix(newColor1, newColor2, fract(blueColor));",
	        "    return newColor;",
	        "}",

	        "vec3 $rgb2hsv(vec3 c){",
	        
	        "    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);",
	        "    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));",
	        "    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));",

	        "    float d = q.x - min(q.w, q.y);",
	        "    float e = 1.0e-10;",
	        "    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);",
	        "}",

	        "vec3 $hsv2rgb(vec3 c)",
	        "{",
	        "    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);",
	        "    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);",
	        "    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);",
	        "}",

	        "void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth){",
	        "vec3 orig = color.rgb;",
	    ].join("\n")
	});

/***/ }),
/* 10 */
/***/ (function(module, exports) {

	// Ported from three's glitch pass/shader and added VR support

	AFRAME.registerComponent("glitch", {
	    schema: { default: true },

	    init: function () {
	        this.system = this.el.sceneEl.systems.effects;

	        this.uniforms = {
	            "tDisp":		{ type: "t", value: this.generateHeightmap( 64 ) },
	            "amount":		{ type: "f", value: 0.08 },
	            "angle":		{ type: "f", value: 0.02 },
	            "seed":			{ type: "f", value: 0.02 },
	            "seed_x":		{ type: "f", value: 0.02 },//-1,1
	            "seed_y":		{ type: "f", value: 0.02 },//-1,1
	            "distortion_x":	{ type: "f", value: 0.5 },
	            "distortion_y":	{ type: "f", value: 0.6 },
	            "col_s":		{ type: "f", value: 0.05 }
		    };
	        
	        // by declaring a .material property we set this component to take a whole pass of it's own
	        this.material = this.system.fuse([
	            {
	                fragment: this.fragment,
	                uniforms: this.uniforms
	            }
	        ]);

	        this.system.register(this);
	    },

	    vr: true,

	    update: function () {
	        this.bypass = !this.data;
	        this.curF = 0;
	        this.generateTrigger();
	    },

	    remove: function () {
	        this.system.unregister(this);
	    },

	    tock: function () {
	        this.uniforms[ 'seed' ].value = Math.random();//default seeding
			
			if ( this.curF % this.randX == 0) {

				this.uniforms[ 'amount' ].value = Math.random() / 30;
				this.uniforms[ 'angle' ].value = THREE.Math.randFloat( - Math.PI, Math.PI );
				this.uniforms[ 'seed_x' ].value = THREE.Math.randFloat( - 1, 1 );
				this.uniforms[ 'seed_y' ].value = THREE.Math.randFloat( - 1, 1 );
				this.uniforms[ 'distortion_x' ].value = THREE.Math.randFloat( 0, 1 );
				this.uniforms[ 'distortion_y' ].value = THREE.Math.randFloat( 0, 1 );
				this.curF = 0;
				this.generateTrigger();

			} else if ( this.curF % this.randX < this.randX / 5 ) {

				this.uniforms[ 'amount' ].value = Math.random() / 90;
				this.uniforms[ 'angle' ].value = THREE.Math.randFloat( - Math.PI, Math.PI );
				this.uniforms[ 'distortion_x' ].value = THREE.Math.randFloat( 0, 1 );
				this.uniforms[ 'distortion_y' ].value = THREE.Math.randFloat( 0, 1 );
				this.uniforms[ 'seed_x' ].value = THREE.Math.randFloat( - 0.3, 0.3 );
				this.uniforms[ 'seed_y' ].value = THREE.Math.randFloat( - 0.3, 0.3 );

			} 

			this.curF ++;
	    },

	    generateTrigger: function() {

			this.randX = THREE.Math.randInt( 120, 240 );

		},

		generateHeightmap: function( dt_size ) {

			var data_arr = new Float32Array( dt_size * dt_size * 3 );
			var length = dt_size * dt_size;

			for ( var i = 0; i < length; i ++ ) {

				var val = THREE.Math.randFloat( 0, 1 );
				data_arr[ i * 3 + 0 ] = val;
				data_arr[ i * 3 + 1 ] = val;
				data_arr[ i * 3 + 2 ] = val;

			}

			var texture = new THREE.DataTexture( data_arr, dt_size, dt_size, THREE.RGBFormat, THREE.FloatType );
			texture.needsUpdate = true;
			return texture;

		},

	    fragment: [
			"float $rand(vec2 co){",
				"return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);",
			"}",
					
			"void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth) {",
					"vec2 p = uv;",
	                "vec2 p2 = vec2( smoothstep(uvClamp.x, uvClamp.y, p.x),p.y);",
					"float xs = floor(gl_FragCoord.x / 0.5);",
					"float ys = floor(gl_FragCoord.y / 0.5);",
					//based on staffantans glitch shader for unity https://github.com/staffantan/unityglitch
					"vec4 normal = texture2D ($tDisp, p2 * $seed * $seed);",
					"if(p2.y < $distortion_x + $col_s && p2.y > $distortion_x - $col_s * $seed) {",
						"if($seed_x>0.){",
							"p.y = 1. - (p.y + $distortion_y);",
						"}",
						"else {",
							"p.y = $distortion_y;",
						"}",
					"}",
					"if(p2.x < $distortion_y + $col_s && p2.x > $distortion_y - $col_s * $seed) {",
						"if( $seed_y > 0.){",
							"p.x = $distortion_x;",
						"}",
						"else {",
							"p.x = 1. - (p.x + $distortion_x);",
						"}",
					"}",
					"p.x+=normal.x* $seed_x * ($seed/5.);",
					"p.y+=normal.y* $seed_y * ($seed/5.);",
					//base from RGB shift shader
					"vec2 offset = $amount * vec2( cos($angle), sin($angle));",
					"vec4 cr = textureVR(tDiffuse, p + offset);",
					"vec4 cga = textureVR(tDiffuse, p);",
					"vec4 cb = textureVR(tDiffuse, p - offset);",
					"color = vec4(cr.r, cga.g, cb.b, cga.a);",
					//add noise
					"vec4 snow = 200.*$amount*vec4($rand(vec2(xs * $seed,ys * $seed*50.))*0.2);",
					"color = color+ snow;",
			"}"
		].join( "\n" )
	});

/***/ })
/******/ ]);