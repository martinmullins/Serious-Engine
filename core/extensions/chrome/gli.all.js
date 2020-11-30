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

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	;;

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(27)], __WEBPACK_AMD_DEFINE_RESULT__ = function (captureContext, HostUI) {

	    window.gli = window.gli || {};
	    window.gli.host = window.gli.host || {};
	    window.gli.host.inspectContext = captureContext.inspectContext.bind(captureContext);
	    window.gli.host.HostUI = HostUI;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(3), __webpack_require__(4), __webpack_require__(5), __webpack_require__(6), __webpack_require__(7), __webpack_require__(10), __webpack_require__(9), __webpack_require__(11), __webpack_require__(13), __webpack_require__(14), __webpack_require__(26)], __WEBPACK_AMD_DEFINE_RESULT__ = function (printStackTrace, base, extensions, EventSource, hacks, info, settings, util, Frame, Notifier, ResourceCache, Statistics) {
	    var api = {};

	    var dynamicContextProperties = {
	        drawingBufferWidth: true,
	        drawingBufferHeight: true
	    };

	    function errorBreak() {
	        throw "WebGL error!";
	    };

	    function startCapturing(context) {
	        context.ignoreErrors();
	        context.captureFrame = true;
	        //context.notifier.postMessage("capturing frame " + context.frameNumber + "...");
	    };

	    function stopCapturing(context) {
	        context.notifier.postMessage("captured frame " + (context.frameNumber - 1));
	        context.captureFrame = false;
	        context.ignoreErrors();

	        var frame = context.currentFrame;

	        context.markFrame(null); // mark end

	        // Fire off callback (if present)
	        if (context.captureCallback) {
	            context.captureCallback(context, frame);
	        }
	    };

	    function frameEnded(context) {
	        if (context.inFrame) {
	            context.inFrame = false;
	            context.statistics.endFrame();
	            context.frameCompleted.fire();
	            context.ignoreErrors();
	        }
	    };

	    function frameSeparator(context) {
	        context.frameNumber++;

	        // Start or stop capturing
	        if (context.captureFrame) {
	            if (context.captureFrameEnd == context.frameNumber) {
	                stopCapturing(context);
	            }
	        } else {
	            if (context.captureFrameStart == context.frameNumber) {
	                startCapturing(context);
	            }
	        }

	        if (context.captureFrame) {
	            context.markFrame(context.frameNumber);
	        }

	        context.statistics.beginFrame();

	        // Even though we are watching most timing methods, we can't be too safe
	        original_setTimeout(function () {
	            api.frameTerminator.fire();
	        }, 0);
	    };

	    function wrapFunction(context, functionName) {
	        var originalFunction = context.rawgl[functionName];
	        var statistics = context.statistics;
	        var callsPerFrame = statistics.callsPerFrame;
	        return function () {
	            var gl = context.rawgl;

	            var stack = null;
	            function generateStack() {
	                // Generate stack trace
	                var stackResult = printStackTrace();
	                // ignore garbage
	                stackResult = stackResult.slice(4);
	                // Fix up our type
	                stackResult[0] = stackResult[0].replace("[object Object].", "gl.");
	                return stackResult;
	            };

	            if (context.inFrame == false) {
	                // First call of a new frame!
	                context.inFrame = true;
	                frameSeparator(context);
	            }

	            // PRE:
	            var call = null;
	            if (context.captureFrame) {
	                // NOTE: for timing purposes this should be the last thing before the actual call is made
	                stack = stack || (context.options.resourceStacks ? generateStack() : null);
	                call = context.currentFrame.allocateCall(functionName, arguments);
	            }

	            callsPerFrame.value++;

	            if (context.captureFrame) {
	                // Ignore all errors before this call is made
	                gl.ignoreErrors();
	            }

	            // Call real function
	            var result = originalFunction.apply(context.rawgl, arguments);

	            // Get error state after real call - if we don't do this here, tracing/capture calls could mess things up
	            var error = context.NO_ERROR;
	            if (!context.options.ignoreErrors || context.captureFrame) {
	                error = gl.getError();
	            }

	            // POST:
	            if (context.captureFrame) {
	                if (error != context.NO_ERROR) {
	                    stack = stack || generateStack();
	                }
	                call.complete(result, error, stack);
	            }

	            if (error != context.NO_ERROR) {
	                context.errorMap[error] = true;

	                if (context.options.breakOnError) {
	                    // TODO: backtrace?
	                    errorBreak();
	                }
	            }

	            // If this is the frame separator then handle it
	            if (context.options.frameSeparators.indexOf(functionName) >= 0) {
	                frameEnded(context);
	            }

	            return result;
	        };
	    };

	    function wrapProperty(context, propertyName) {
	        Object.defineProperty(context, propertyName, {
	            configurable: false,
	            enumerable: true,
	            get: function get() {
	                return context.rawgl[propertyName];
	            }
	        });
	    };

	    var CaptureContext = function CaptureContext(canvas, rawgl, options) {
	        var defaultOptions = {
	            ignoreErrors: true,
	            breakOnError: false,
	            resourceStacks: false,
	            callStacks: false,
	            frameSeparators: settings.global.captureOn
	        };
	        options = options || defaultOptions;
	        for (var n in defaultOptions) {
	            if (options[n] === undefined) {
	                options[n] = defaultOptions[n];
	            }
	        }

	        this.options = options;
	        this.canvas = canvas;
	        this.rawgl = rawgl;
	        this.isWrapped = true;

	        this.notifier = new Notifier(api);

	        this.rawgl.canvas = canvas;
	        info.initialize(this.rawgl);

	        this.attributes = rawgl.getContextAttributes ? rawgl.getContextAttributes() : {};

	        this.statistics = new Statistics();

	        this.frameNumber = 0;
	        this.inFrame = false;

	        // Function to call when capture completes
	        this.captureCallback = null;
	        // Frame range to capture (inclusive) - if inside a capture window, captureFrame == true
	        this.captureFrameStart = null;
	        this.captureFrameEnd = null;
	        this.captureFrame = false;
	        this.currentFrame = null;

	        this.errorMap = {};

	        this.enabledExtensions = [];

	        this.frameCompleted = new EventSource("frameCompleted");
	        this.frameCompleted.addListener(this, function () {
	            frameSeparator(this);
	        });

	        // NOTE: this should happen ASAP so that we make sure to wrap the faked function, not the real-REAL one
	        hacks.installAll(rawgl);

	        // NOTE: this should also happen really early, but after hacks
	        extensions.installExtensions(rawgl);

	        // Listen for inferred frame termination and extension termination
	        function frameEndedWrapper() {
	            frameEnded(this);
	        };
	        api.frameTerminator.addListener(this, frameEndedWrapper);
	        var ext = rawgl.getExtension("GLI_frame_terminator");
	        ext.frameEvent.addListener(this, frameEndedWrapper);

	        // Clone all properties in context and wrap all functions
	        for (var propertyName in rawgl) {
	            if (typeof rawgl[propertyName] == 'function') {
	                // Functions
	                this[propertyName] = wrapFunction(this, propertyName, rawgl[propertyName]);
	            } else if (propertyName in dynamicContextProperties) {
	                // Enums/constants/etc
	                wrapProperty(this, propertyName);
	            } else {
	                this[propertyName] = rawgl[propertyName];
	            }
	        }

	        // Rewrite getError so that it uses our version instead
	        this.getError = function () {
	            for (var error in this.errorMap) {
	                if (this.errorMap[error]) {
	                    this.errorMap[error] = false;
	                    return error;
	                }
	            }
	            return this.NO_ERROR;
	        };

	        // Unlogged pass-through of getContextAttributes and isContextLost
	        this.isContextLost = function () {
	            return rawgl.isContextLost();
	        };
	        this.getContextAttributes = function () {
	            return rawgl.getContextAttributes();
	        };

	        // Capture all extension requests
	        // We only support a few right now, so filter
	        // New extensions that add tokens will needs to have support added in
	        // the proper places, such as Info.js for enum values and the resource
	        // system for new resources
	        var validExts = ['GLI_frame_terminator', 'OES_texture_float', 'OES_texture_half_float', 'OES_texture_float_linear', 'OES_texture_half_float_linear', 'OES_standard_derivatives', 'OES_element_index_uint', 'EXT_texture_filter_anisotropic', 'EXT_shader_texture_lod', 'OES_depth_texture', 'WEBGL_depth_texture', 'WEBGL_compressed_texture_s3tc'];
	        for (var n = 0, l = validExts.length; n < l; n++) {
	            validExts.push('MOZ_' + validExts[n]);
	            validExts.push('WEBKIT_' + validExts[n]);
	        }
	        function containsInsensitive(list, name) {
	            name = name.toLowerCase();
	            for (var n = 0, len = list.length; n < len; ++n) {
	                if (list[n].toLowerCase() === name) return true;
	            }
	            return false;
	        };
	        var original_getSupportedExtensions = this.getSupportedExtensions;
	        this.getSupportedExtensions = function () {
	            var exts = original_getSupportedExtensions.call(this);
	            var usableExts = [];
	            for (var n = 0; n < exts.length; n++) {
	                if (containsInsensitive(validExts, exts[n])) {
	                    usableExts.push(exts[n]);
	                }
	            }
	            return usableExts;
	        };
	        var original_getExtension = this.getExtension;
	        this.getExtension = function (name) {
	            if (!containsInsensitive(validExts, name)) {
	                return null;
	            }
	            var result = original_getExtension.apply(this, arguments);
	            if (result) {
	                // Nasty, but I never wrote this to support new constants properly
	                switch (name.toLowerCase()) {
	                    case 'oes_texture_half_float':
	                        this['HALF_FLOAT_OES'] = 0x8D61;
	                        break;
	                    case 'oes_standard_derivatives':
	                        this['FRAGMENT_SHADER_DERIVATIVE_HINT_OES'] = 0x8B8B;
	                        break;
	                    case 'ext_texture_filter_anisotropic':
	                    case 'moz_ext_texture_filter_anisotropic':
	                    case 'webkit_ext_texture_filter_anisotropic':
	                        this['TEXTURE_MAX_ANISOTROPY_EXT'] = 0x84FE;
	                        this['MAX_TEXTURE_MAX_ANISOTROPY_EXT'] = 0x84FF;
	                        break;
	                    case 'webgl_compressed_texture_s3tc':
	                    case 'moz_webgl_compressed_texture_s3tc':
	                    case 'webkit_webgl_compressed_texture_s3tc':
	                        this['COMPRESSED_RGB_S3TC_DXT1_EXT'] = 0x83F0;
	                        this['COMPRESSED_RGBA_S3TC_DXT1_EXT'] = 0x83F1;
	                        this['COMPRESSED_RGBA_S3TC_DXT3_EXT'] = 0x83F2;
	                        this['COMPRESSED_RGBA_S3TC_DXT5_EXT'] = 0x83F3;
	                        break;
	                }

	                this.enabledExtensions.push(name);
	            }
	            return result;
	        };

	        // Add a few helper methods
	        this.ignoreErrors = rawgl.ignoreErrors = function () {
	            while (this.getError() != this.NO_ERROR) {}
	        };

	        // Add debug methods
	        this.mark = function () {
	            if (context.captureFrame) {
	                context.currentFrame.mark(arguments);
	            }
	        };

	        // TODO: before or after we wrap? if we do it here (after), then timings won't be affected by our captures
	        this.resources = new ResourceCache(this);
	    };

	    CaptureContext.prototype.markFrame = function (frameNumber) {
	        if (this.currentFrame) {
	            // Close the previous frame
	            this.currentFrame.end(this.rawgl);
	            this.currentFrame = null;
	        }

	        if (frameNumber == null) {
	            // Abort if not a real frame
	            return;
	        }

	        this.currentFrame = new Frame(this.canvas, this.rawgl, frameNumber, this.resources);
	    };

	    CaptureContext.prototype.requestCapture = function (callback) {
	        this.captureCallback = callback;
	        this.captureFrameStart = this.frameNumber + 1;
	        this.captureFrameEnd = this.captureFrameStart + 1;
	        this.captureFrame = false;
	    };

	    api.frameTerminator = new EventSource("frameTerminator");

	    // This replaces setTimeout/setInterval with versions that, after the user code is called, try to end the frame
	    // This should be a reliable way to bracket frame captures, unless the user is doing something crazy (like
	    // rendering in mouse event handlers)
	    var timerHijacking = {
	        value: 0, // 0 = normal, N = ms between frames, Infinity = stopped
	        activeIntervals: [],
	        activeTimeouts: []
	    };

	    function hijackedDelay(delay) {
	        var maxDelay = Math.max(isNaN(delay) ? 0 : delay, timerHijacking.value);
	        if (!isFinite(maxDelay)) {
	            maxDelay = 999999999;
	        }
	        return maxDelay;
	    }

	    CaptureContext.setFrameControl = function (value) {
	        timerHijacking.value = value;

	        // Reset all intervals
	        var intervals = timerHijacking.activeIntervals;
	        for (var n = 0; n < intervals.length; n++) {
	            var interval = intervals[n];
	            original_clearInterval(interval.currentId);
	            var maxDelay = hijackedDelay(interval.delay);
	            interval.currentId = original_setInterval(interval.wrappedCode, maxDelay);
	        }

	        // Reset all timeouts
	        var timeouts = timerHijacking.activeTimeouts;
	        for (var n = 0; n < timeouts.length; n++) {
	            var timeout = timeouts[n];
	            original_clearTimeout(timeout.originalId);
	            var maxDelay = hijackedDelay(timeout.delay);
	            timeout.currentId = original_setTimeout(timeout.wrappedCode, maxDelay);
	        }
	    };

	    function wrapCode(code, args) {
	        args = args ? Array.prototype.slice.call(args, 2) : [];
	        return function () {
	            if (code) {
	                if (base.typename(code) == "String") {
	                    original_setInterval(code, 0);
	                    original_setInterval(api.frameTerminator.fire.bind(api.frameTerminator), 0);
	                } else {
	                    try {
	                        code.apply(window, args);
	                    } finally {
	                        api.frameTerminator.fire();
	                    }
	                }
	            }
	        };
	    };

	    var original_setInterval = window.setInterval;
	    window.setInterval = function (code, delay) {
	        var maxDelay = hijackedDelay(delay);
	        var wrappedCode = wrapCode(code, arguments);
	        var intervalId = original_setInterval.apply(window, [wrappedCode, maxDelay]);
	        timerHijacking.activeIntervals.push({
	            originalId: intervalId,
	            currentId: intervalId,
	            code: code,
	            wrappedCode: wrappedCode,
	            delay: delay
	        });
	        return intervalId;
	    };
	    var original_clearInterval = window.clearInterval;
	    window.clearInterval = function (intervalId) {
	        for (var n = 0; n < timerHijacking.activeIntervals.length; n++) {
	            if (timerHijacking.activeIntervals[n].originalId == intervalId) {
	                var interval = timerHijacking.activeIntervals[n];
	                timerHijacking.activeIntervals.splice(n, 1);
	                return original_clearInterval.apply(window, [interval.currentId]);
	            }
	        }
	        return original_clearInterval.apply(window, arguments);
	    };
	    var original_setTimeout = window.setTimeout;
	    window.setTimeout = function (code, delay) {
	        var maxDelay = hijackedDelay(delay);
	        var wrappedCode = wrapCode(code, arguments);
	        var cleanupCode = function cleanupCode() {
	            // Need to remove from the active timeout list
	            window.clearTimeout(timeoutId); // why is this here?
	            wrappedCode();
	        };
	        var timeoutId = original_setTimeout.apply(window, [cleanupCode, maxDelay]);
	        timerHijacking.activeTimeouts.push({
	            originalId: timeoutId,
	            currentId: timeoutId,
	            code: code,
	            wrappedCode: wrappedCode,
	            delay: delay
	        });
	        return timeoutId;
	    };
	    var original_clearTimeout = window.clearTimeout;
	    window.clearTimeout = function (timeoutId) {
	        for (var n = 0; n < timerHijacking.activeTimeouts.length; n++) {
	            if (timerHijacking.activeTimeouts[n].originalId == timeoutId) {
	                var timeout = timerHijacking.activeTimeouts[n];
	                timerHijacking.activeTimeouts.splice(n, 1);
	                return original_clearTimeout.apply(window, [timeout.currentId]);
	            }
	        }
	        return original_clearTimeout.apply(window, arguments);
	    };

	    // Some apps, like q3bsp, use the postMessage hack - because of that, we listen in and try to use it too
	    // Note that there is a race condition here such that we may fire in BEFORE the app message, but oh well
	    window.addEventListener("message", function () {
	        api.frameTerminator.fire();
	    }, false);

	    // Support for requestAnimationFrame-like APIs
	    var requestAnimationFrameNames = ["requestAnimationFrame", "webkitRequestAnimationFrame", "mozRequestAnimationFrame", "operaRequestAnimationFrame", "msAnimationFrame"];
	    for (var n = 0, len = requestAnimationFrameNames.length; n < len; ++n) {
	        var name = requestAnimationFrameNames[n];
	        if (window[name]) {
	            (function (name) {
	                var originalFn = window[name];
	                var lastFrameTime = new Date();
	                window[name] = function (callback, element) {
	                    var time = new Date();
	                    var delta = time - lastFrameTime;
	                    if (delta > timerHijacking.value) {
	                        lastFrameTime = time;
	                        var wrappedCallback = function wrappedCallback() {
	                            try {
	                                callback.apply(window, arguments);
	                            } finally {
	                                api.frameTerminator.fire();
	                            }
	                        };
	                        return originalFn.call(window, wrappedCallback, element);
	                    } else {
	                        window.setTimeout(function () {
	                            callback(Date.now());
	                        }, delta);
	                        return null;
	                    }
	                };
	            })(name);
	        }
	    }

	    // Everything in the inspector should use these instead of the global values
	    api.setInterval = function () {
	        return original_setInterval.apply(window, arguments);
	    };
	    api.clearInterval = function () {
	        return original_clearInterval.apply(window, arguments);
	    };
	    api.setTimeout = function () {
	        return original_setTimeout.apply(window, arguments);
	    };
	    api.clearTimeout = function () {
	        return original_clearTimeout.apply(window, arguments);
	    };

	    // options: {
	    //     ignoreErrors: bool - ignore errors on calls (can drastically speed things up)
	    //     breakOnError: bool - break on gl error
	    //     resourceStacks: bool - collect resource creation/deletion callstacks
	    //     callStacks: bool - collect callstacks for each call
	    //     frameSeparators: ['finish'] / etc
	    // }
	    api.inspectContext = function (canvas, rawgl, options) {
	        // Ignore if we have already wrapped the context
	        if (rawgl.isWrapped) {
	            // NOTE: if options differ we may want to unwrap and re-wrap
	            return rawgl;
	        }

	        util.setWebGLVersion(rawgl);
	        var wrapped = new CaptureContext(canvas, rawgl, options);

	        return wrapped;
	    };

	    api.setFrameControl = CaptureContext.setFrameControl;

	    EventSource.setSetTimeoutFn(api.setTimeout);

	    return api;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	'use strict';

	// Domain Public by Eric Wendelin http://eriwen.com/ (2008)
	//                  Luke Smith http://lucassmith.name/ (2008)
	//                  Loic Dachary <loic@dachary.org> (2008)
	//                  Johan Euphrosine <proppy@aminche.com> (2008)
	//                  �yvind Sean Kinsey http://kinsey.no/blog (2010)
	//
	// Information and discussions
	// http://jspoker.pokersource.info/skin/test-printstacktrace.html
	// http://eriwen.com/javascript/js-stack-trace/
	// http://eriwen.com/javascript/stacktrace-update/
	// http://pastie.org/253058
	//
	// guessFunctionNameFromLines comes from firebug
	//
	// Software License Agreement (BSD License)
	//
	// Copyright (c) 2007, Parakey Inc.
	// All rights reserved.
	//
	// Redistribution and use of this software in source and binary forms, with or without modification,
	// are permitted provided that the following conditions are met:
	//
	// * Redistributions of source code must retain the above
	//   copyright notice, this list of conditions and the
	//   following disclaimer.
	//
	// * Redistributions in binary form must reproduce the above
	//   copyright notice, this list of conditions and the
	//   following disclaimer in the documentation and/or other
	//   materials provided with the distribution.
	//
	// * Neither the name of Parakey Inc. nor the names of its
	//   contributors may be used to endorse or promote products
	//   derived from this software without specific prior
	//   written permission of Parakey Inc.
	//
	// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
	// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
	// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
	// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
	// IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
	// OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

	/**
	* Main function giving a function stack trace with a forced or passed in Error 
	*
	* @cfg {Error} e The error to create a stacktrace from (optional)
	* @cfg {Boolean} guess If we should try to resolve the names of anonymous functions
	* @return {Array} of Strings with functions, lines, files, and arguments where possible 
	*/
	function printStackTrace(options) {
	    var ex = options && options.e ? options.e : null;
	    var guess = options ? !!options.guess : true;

	    var p = printStackTrace.cachedImpl || new printStackTrace.implementation();
	    printStackTrace.cachedImpl = p;
	    var result = p.run(ex);
	    return guess ? p.guessFunctions(result) : result;
	}

	printStackTrace.implementation = function () {};

	printStackTrace.implementation.prototype = {

	    // CHANGE: cache all regular expressions
	    regex: {
	        chromeReplaces: [[/^[^\n]*\n/, ''], [/^[^\n]*\n/, ''], [/^[^\(]+?[\n$]/gm, ''], [/^\s+at\s+/gm, ''], [/^Object.<anonymous>\s*\(/gm, '{anonymous}()@']],
	        firefoxReplaces: [[/^[^\n]*\n/, ''], [/(?:\n@:0)?\s+$/m, ''], [/^\(/gm, '{anonymous}(']],
	        fnRE: /function\s*([\w\-$]+)?\s*\(/i,
	        reStack: /\{anonymous\}\(.*\)@(\w+:\/\/([\-\w\.]+)+(:\d+)?[^:]+):(\d+):?(\d+)?/,
	        reFunctionArgNames: /function ([^(]*)\(([^)]*)\)/,
	        reGuessFunction: /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*(function|eval|new Function)/
	    },

	    run: function run(ex) {
	        // Use either the stored mode, or resolve it
	        var mode = this._mode || this.mode();
	        if (mode === 'other') {
	            return this.other(arguments.callee);
	        } else {
	            ex = ex || function () {
	                try {
	                    var _err = __undef__ << 1;
	                } catch (e) {
	                    return e;
	                }
	            }();
	            return this[mode](ex);
	        }
	    },

	    /**
	    * @return {String} mode of operation for the environment in question.
	    */
	    mode: function mode() {
	        try {
	            var _err = __undef__ << 1;
	        } catch (e) {
	            if (e['arguments']) {
	                return this._mode = 'chrome';
	            } else if (window.opera && e.stacktrace) {
	                return this._mode = 'opera10';
	            } else if (e.stack) {
	                return this._mode = 'firefox';
	            } else if (window.opera && !('stacktrace' in e)) {
	                //Opera 9-
	                return this._mode = 'opera';
	            }
	        }
	        return this._mode = 'other';
	    },

	    /**
	    * Given a context, function name, and callback function, overwrite it so that it calls
	    * printStackTrace() first with a callback and then runs the rest of the body.
	    * 
	    * @param {Object} context of execution (e.g. window)
	    * @param {String} functionName to instrument
	    * @param {Function} function to call with a stack trace on invocation
	    */
	    instrumentFunction: function instrumentFunction(context, functionName, callback) {
	        context = context || window;
	        context['_old' + functionName] = context[functionName];
	        context[functionName] = function () {
	            callback.call(this, printStackTrace());
	            return context['_old' + functionName].apply(this, arguments);
	        };
	        context[functionName]._instrumented = true;
	    },

	    /**
	    * Given a context and function name of a function that has been
	    * instrumented, revert the function to it's original (non-instrumented)
	    * state.
	    *
	    * @param {Object} context of execution (e.g. window)
	    * @param {String} functionName to de-instrument
	    */
	    deinstrumentFunction: function deinstrumentFunction(context, functionName) {
	        if (context[functionName].constructor === Function && context[functionName]._instrumented && context['_old' + functionName].constructor === Function) {
	            context[functionName] = context['_old' + functionName];
	        }
	    },

	    /**
	    * Given an Error object, return a formatted Array based on Chrome's stack string.
	    * 
	    * @param e - Error object to inspect
	    * @return Array<String> of function calls, files and line numbers
	    */
	    chrome: function chrome(e) {
	        // CHANGE: use replacement list
	        var chromeReplaces = this.regex.chromeReplaces;
	        var x = e.stack;
	        for (var n = 0; n < chromeReplaces.length; n++) {
	            x = x.replace(chromeReplaces[n][0], chromeReplaces[n][1]);
	        }
	        return x.split('\n');
	        //return e.stack.replace(/^[^\n]*\n/, '').replace(/^[^\n]*\n/, '').replace(/^[^\(]+?[\n$]/gm, '').replace(/^\s+at\s+/gm, '').replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@').split('\n');
	    },

	    /**
	    * Given an Error object, return a formatted Array based on Firefox's stack string.
	    * 
	    * @param e - Error object to inspect
	    * @return Array<String> of function calls, files and line numbers
	    */
	    firefox: function firefox(e) {
	        // CHANGE: use replacement list
	        var firefoxReplaces = this.regex.firefoxReplaces;
	        var x = e.stack;
	        for (var n = 0; n < firefoxReplaces.length; n++) {
	            x = x.replace(firefoxReplaces[n][0], firefoxReplaces[n][1]);
	        }
	        return x.split('\n');
	        //return e.stack.replace(/^[^\n]*\n/, '').replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anonymous}(').split('\n');
	    },

	    /**
	    * Given an Error object, return a formatted Array based on Opera 10's stacktrace string.
	    * 
	    * @param e - Error object to inspect
	    * @return Array<String> of function calls, files and line numbers
	    */
	    opera10: function opera10(e) {
	        var stack = e.stacktrace;
	        var lines = stack.split('\n'),
	            ANON = '{anonymous}',
	            lineRE = /.*line (\d+), column (\d+) in ((<anonymous function\:?\s*(\S+))|([^\(]+)\([^\)]*\))(?: in )?(.*)\s*$/i,
	            i,
	            j,
	            len;
	        for (i = 2, j = 0, len = lines.length; i < len - 2; i++) {
	            if (lineRE.test(lines[i])) {
	                var location = RegExp.$6 + ':' + RegExp.$1 + ':' + RegExp.$2;
	                var fnName = RegExp.$3;
	                fnName = fnName.replace(/<anonymous function\s?(\S+)?>/g, ANON);
	                lines[j++] = fnName + '@' + location;
	            }
	        }

	        lines.splice(j, lines.length - j);
	        return lines;
	    },

	    // Opera 7.x-9.x only!
	    opera: function opera(e) {
	        var lines = e.message.split('\n'),
	            ANON = '{anonymous}',
	            lineRE = /Line\s+(\d+).*script\s+(http\S+)(?:.*in\s+function\s+(\S+))?/i,
	            i,
	            j,
	            len;

	        for (i = 4, j = 0, len = lines.length; i < len; i += 2) {
	            //TODO: RegExp.exec() would probably be cleaner here
	            if (lineRE.test(lines[i])) {
	                lines[j++] = (RegExp.$3 ? RegExp.$3 + '()@' + RegExp.$2 + RegExp.$1 : ANON + '()@' + RegExp.$2 + ':' + RegExp.$1) + ' -- ' + lines[i + 1].replace(/^\s+/, '');
	            }
	        }

	        lines.splice(j, lines.length - j);
	        return lines;
	    },

	    // Safari, IE, and others
	    other: function other(curr) {
	        var ANON = '{anonymous}',
	            fnRE = this.regex.fnRE,
	            stack = [],
	            j = 0,
	            fn,
	            args;

	        var maxStackSize = 10;
	        while (curr && stack.length < maxStackSize) {
	            fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
	            args = Array.prototype.slice.call(curr['arguments']);
	            stack[j++] = fn + '(' + this.stringifyArguments(args) + ')';
	            curr = curr.caller;
	        }
	        return stack;
	    },

	    /**
	    * Given arguments array as a String, subsituting type names for non-string types.
	    *
	    * @param {Arguments} object
	    * @return {Array} of Strings with stringified arguments
	    */
	    stringifyArguments: function stringifyArguments(args) {
	        for (var i = 0; i < args.length; ++i) {
	            var arg = args[i];
	            if (arg === undefined) {
	                args[i] = 'undefined';
	            } else if (arg === null) {
	                args[i] = 'null';
	            } else if (arg.constructor) {
	                if (arg.constructor === Array) {
	                    if (arg.length < 3) {
	                        args[i] = '[' + this.stringifyArguments(arg) + ']';
	                    } else {
	                        args[i] = '[' + this.stringifyArguments(Array.prototype.slice.call(arg, 0, 1)) + '...' + this.stringifyArguments(Array.prototype.slice.call(arg, -1)) + ']';
	                    }
	                } else if (arg.constructor === Object) {
	                    args[i] = '#object';
	                } else if (arg.constructor === Function) {
	                    args[i] = '#function';
	                } else if (arg.constructor === String) {
	                    args[i] = '"' + arg + '"';
	                }
	            }
	        }
	        return args.join(',');
	    },

	    sourceCache: {},

	    /**
	    * @return the text from a given URL.
	    */
	    ajax: function ajax(url) {
	        var req = this.createXMLHTTPObject();
	        if (!req) {
	            return;
	        }
	        req.open('GET', url, false);
	        req.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
	        req.send('');
	        return req.responseText;
	    },

	    /**
	    * Try XHR methods in order and store XHR factory.
	    *
	    * @return <Function> XHR function or equivalent
	    */
	    createXMLHTTPObject: function createXMLHTTPObject() {
	        var xmlhttp,
	            XMLHttpFactories = [function () {
	            return new XMLHttpRequest();
	        }, function () {
	            return new ActiveXObject('Msxml2.XMLHTTP');
	        }, function () {
	            return new ActiveXObject('Msxml3.XMLHTTP');
	        }, function () {
	            return new ActiveXObject('Microsoft.XMLHTTP');
	        }];
	        for (var i = 0; i < XMLHttpFactories.length; i++) {
	            try {
	                xmlhttp = XMLHttpFactories[i]();
	                // Use memoization to cache the factory
	                this.createXMLHTTPObject = XMLHttpFactories[i];
	                return xmlhttp;
	            } catch (e) {}
	        }
	    },

	    /**
	    * Given a URL, check if it is in the same domain (so we can get the source
	    * via Ajax).
	    *
	    * @param url <String> source url
	    * @return False if we need a cross-domain request
	    */
	    isSameDomain: function isSameDomain(url) {
	        return url.indexOf(location.hostname) !== -1;
	    },

	    /**
	    * Get source code from given URL if in the same domain.
	    *
	    * @param url <String> JS source URL
	    * @return <String> Source code
	    */
	    getSource: function getSource(url) {
	        if (!(url in this.sourceCache)) {
	            this.sourceCache[url] = this.ajax(url).split('\n');
	        }
	        return this.sourceCache[url];
	    },

	    guessFunctions: function guessFunctions(stack) {
	        for (var i = 0; i < stack.length; ++i) {
	            var reStack = this.regex.reStack;
	            var frame = stack[i],
	                m = reStack.exec(frame);
	            if (m) {
	                var file = m[1],
	                    lineno = m[4]; //m[7] is character position in Chrome
	                if (file && this.isSameDomain(file) && lineno) {
	                    var functionName = this.guessFunctionName(file, lineno);
	                    stack[i] = frame.replace('{anonymous}', functionName);
	                }
	            }
	        }
	        return stack;
	    },

	    guessFunctionName: function guessFunctionName(url, lineNo) {
	        try {
	            return this.guessFunctionNameFromLines(lineNo, this.getSource(url));
	        } catch (e) {
	            return 'getSource failed with url: ' + url + ', exception: ' + e.toString();
	        }
	    },

	    guessFunctionNameFromLines: function guessFunctionNameFromLines(lineNo, source) {
	        var reFunctionArgNames = this.regex.reFunctionArgNames;
	        var reGuessFunction = this.regex.reGuessFunction;
	        // Walk backwards from the first line in the function until we find the line which
	        // matches the pattern above, which is the function definition
	        var line = "",
	            maxLines = 10;
	        for (var i = 0; i < maxLines; ++i) {
	            line = source[lineNo - i] + line;
	            if (line !== undefined) {
	                var m = reGuessFunction.exec(line);
	                if (m && m[1]) {
	                    return m[1];
	                } else {
	                    m = reFunctionArgNames.exec(line);
	                    if (m && m[1]) {
	                        return m[1];
	                    }
	                }
	            }
	        }
	        return '(?)';
	    }
	};

	/*** EXPORTS FROM exports-loader ***/
	module.exports = printStackTrace;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	    function subclass(parent, child, args) {
	        parent.apply(child, args);

	        // TODO: this sucks - do it right

	        for (var propertyName in parent.prototype) {
	            if (propertyName == "constructor") {
	                continue;
	            }
	            if (!child.__proto__[propertyName]) {
	                child.__proto__[propertyName] = parent.prototype[propertyName];
	            }
	        }

	        for (var propertyName in parent) {
	            child[propertyName] = parent[propertyName];
	        }
	    };

	    function typename(value) {
	        function stripConstructor(value) {
	            if (value) {
	                return value.replace("Constructor", "");
	            } else {
	                return value;
	            }
	        };
	        if (value) {
	            var mangled = value.constructor.toString();
	            if (mangled) {
	                var matches = mangled.match(/function (.+)\(/);
	                if (matches) {
	                    // ...function Foo()...
	                    if (matches[1] == "Object") {
	                        // Hrm that's likely not right...
	                        // constructor may be fubar
	                        mangled = value.toString();
	                    } else {
	                        return stripConstructor(matches[1]);
	                    }
	                }

	                // [object Foo]
	                matches = mangled.match(/\[object (.+)\]/);
	                if (matches) {
	                    return stripConstructor(matches[1]);
	                }
	            }
	        }
	        return null;
	    };

	    function scrollIntoViewIfNeeded(el) {
	        if (el.scrollIntoViewIfNeeded) {
	            el.scrollIntoViewIfNeeded();
	        } else if (el.offsetParent) {
	            // TODO: determine if el is in the current view of the parent
	            var scrollTop = el.offsetParent.scrollTop;
	            var scrollBottom = el.offsetParent.scrollTop + el.offsetParent.clientHeight;
	            var elTop = el.offsetTop;
	            var elBottom = el.offsetTop + el.offsetHeight;
	            if (elTop < scrollTop || elTop > scrollBottom) {
	                el.scrollIntoView();
	            }
	        }
	    };

	    return {
	        subclass: subclass,
	        typename: typename,
	        scrollIntoViewIfNeeded: scrollIntoViewIfNeeded
	    };
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5)], __WEBPACK_AMD_DEFINE_RESULT__ = function (EventSource) {

	    function installFrameTerminatorExtension(gl) {
	        var ext = {};

	        ext.frameEvent = new EventSource("frameEvent");

	        ext.frameTerminator = function () {
	            ext.frameEvent.fire();
	        };

	        return {
	            name: "GLI_frame_terminator",
	            object: ext
	        };
	    };

	    function installExtensions(gl) {
	        var extensionStrings = [];
	        var extensionObjects = {};

	        // Setup extensions
	        var frameTerminatorExt = installFrameTerminatorExtension(gl);
	        extensionStrings.push(frameTerminatorExt.name);
	        extensionObjects[frameTerminatorExt.name] = frameTerminatorExt.object;

	        // Patch in new extensions
	        var original_getSupportedExtensions = gl.getSupportedExtensions;
	        gl.getSupportedExtensions = function () {
	            var supportedExtensions = original_getSupportedExtensions.apply(gl);
	            for (var n = 0; n < extensionStrings.length; n++) {
	                supportedExtensions.push(extensionStrings[n]);
	            }
	            return supportedExtensions;
	        };
	        var original_getExtension = gl.getExtension;
	        gl.getExtension = function (name) {
	            var ext = extensionObjects[name];
	            if (ext) {
	                return ext;
	            } else {
	                return original_getExtension.apply(gl, arguments);
	            }
	        };
	    };

	    function enableAllExtensions(gl) {
	        if (!gl.getSupportedExtensions) {
	            return;
	        }

	        gl.getSupportedExtensions().forEach(function (ext) {
	            if (ext.substr(0, 3) !== "MOZ") gl.getExtension(ext);
	        });
	    };

	    return {
	        enableAllExtensions: enableAllExtensions,
	        installExtensions: installExtensions
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	    var setTimeout = window.setTimeout.bind(window);

	    var EventSource = function EventSource(name) {
	        this.name = name;
	        this.listeners = [];
	    };

	    EventSource.prototype.addListener = function (target, callback) {
	        this.listeners.push({
	            target: target,
	            callback: callback
	        });
	    };

	    EventSource.prototype.removeListener = function (target, callback) {
	        for (var n = 0; n < this.listeners.length; n++) {
	            var listener = this.listeners[n];
	            if (listener.target === target) {
	                if (callback) {
	                    if (listener.callback === callback) {
	                        this.listeners.splice(n, 1);
	                        break;
	                    }
	                } else {
	                    this.listeners.splice(n, 1);
	                }
	            }
	        }
	    };

	    EventSource.prototype.fire = function () {
	        for (var n = 0; n < this.listeners.length; n++) {
	            var listener = this.listeners[n];
	            //try {
	            listener.callback.apply(listener.target, arguments);
	            //} catch (e) {
	            //    console.log("exception thrown in target of event " + this.name + ": " + e);
	            //}
	        }
	    };

	    EventSource.prototype.fireDeferred = function () {
	        var self = this;
	        var args = arguments;
	        setTimeout(function () {
	            self.fire.apply(self, args);
	        }, 0);
	    };

	    EventSource.setSetTimeoutFn = function (fn) {
	        setTimeout = fn;
	    };

	    return EventSource;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	    return {
	        installAll: function installAll(gl) {
	            if (gl.__hasHacksInstalled) {
	                return;
	            }
	            gl.__hasHacksInstalled = true;
	        }
	    };
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(8), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function (glc, util) {

	    var info = {};

	    var UIType = {
	        ENUM: 0, // a specific enum
	        ARRAY: 1, // array of values (tightly packed)
	        BOOL: 2,
	        LONG: 3,
	        ULONG: 4,
	        COLORMASK: 5, // 4 bools
	        OBJECT: 6, // some WebGL object (texture/program/etc)
	        WH: 7, // width x height (array with 2 values)
	        RECT: 8, // x, y, w, h (array with 4 values)
	        STRING: 9, // some arbitrary string
	        COLOR: 10, // 4 floats
	        FLOAT: 11,
	        BITMASK: 12, // 32bit boolean mask
	        RANGE: 13, // 2 floats
	        MATRIX: 14 // 2x2, 3x3, or 4x4 matrix
	    };

	    var UIInfo = function UIInfo(type, values) {
	        this.type = type;
	        this.values = values;
	    };

	    var FunctionType = {
	        GENERIC: 0,
	        DRAW: 1
	    };

	    var FunctionInfo = function FunctionInfo(staticgl, name, returnType, args, type) {
	        this.name = name;
	        this.returnType = returnType;
	        this.args = args;
	        this.type = type;
	    };
	    FunctionInfo.prototype.getArgs = function (call) {
	        return this.args;
	    };

	    var FunctionParam = function FunctionParam(staticgl, name, ui) {
	        this.name = name;
	        this.ui = ui;
	    };

	    var textureTypes = new UIInfo(UIType.ENUM, ["BYTE", "FLOAT", "FLOAT_32_UNSIGNED_INT_24_8_REV", "HALF_FLOAT", "INT", "SHORT", "UNSIGNED_BYTE", "UNSIGNED_INT", "UNSIGNED_INT_10F_11F_11F_REV", "UNSIGNED_INT_24_8", "UNSIGNED_INT_2_10_10_10_REV", "UNSIGNED_INT_5_9_9_9_REV", "UNSIGNED_SHORT", "UNSIGNED_INT", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1", "UNSIGNED_SHORT_5_6_5"]);

	    var unsizedColorTextureFormats = ["RGB", "RGBA", "LUMINANCE_ALPHA", "LUMINANCE", "ALPHA"];

	    var sizedColorTextureFormats = ["RED", "RED_INTEGER", "RG", "RG_INTEGER", "RGB", "RGB_INTEGER", "RGBA", "RGBA_INTEGER"];

	    var sizedDepthTextureFormats = ["DEPTH_COMPONENT", "DEPTH_STENCIL"];

	    var textureFormats = [].concat(unsizedColorTextureFormats, sizedColorTextureFormats, sizedDepthTextureFormats);

	    var drawModes = ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLES", "TRIANGLE_STRIP", "TRIANGLE_FAN"];
	    var elementTypes = ["UNSIGNED_BYTE", "UNSIGNED_SHORT", "UNSIGNED_INT"];
	    var texParamNames = ["TEXTURE_BASE_LEVEL", "TEXTURE_COMPARE_FUNC", "TEXTURE_COMPARE_MODE", "TEXTURE_MIN_FILTER", "TEXTURE_MAG_FILTER", "TEXTURE_MIN_LOD", "TEXTURE_MAX_LOD", "TEXTURE_MAX_LEVEL", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_WRAP_R", "TEXTURE_MAX_ANISOTROPY_EXT"];

	    var samplerParamNames = ["TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_WRAP_R", "TEXTURE_MIN_FILTER", "TEXTURE_MAG_FILTER", "TEXTURE_MIN_LOD", "TEXTURE_MAX_LOD", "TEXTURE_COMPARE_MODE", "TEXTURE_COMPARE_FUNC"];
	    var bufferTargets = ["ARRAY_BUFFER", "COPY_READ_BUFFER", "COPY_WRITE_BUFFER", "ELEMENT_ARRAY_BUFFER", "PIXEL_PACK_BUFFER", "PIXEL_UNPACK_BUFFER", "TRANSFORM_FEEDBACK_BUFFER", "UNIFORM_BUFFER"];
	    var framebufferTargets = ["DRAW_FRAMEBUFFER", "READ_FRAMEBUFFER", "FRAMEBUFFER"];
	    var texture2DTargets = ["TEXTURE_2D", "TEXTURE_CUBE_MAP"];
	    var texture3DTargets = ["TEXTURE_3D", "TEXTURE_2D_ARRAY"];
	    var bindTextureTargets = [].concat(texture2DTargets, texture3DTargets);
	    var faceTextureTargets = ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"];
	    var colorAttachments = ["COLOR_ATTACHMENT0", "COLOR_ATTACHMENT1", "COLOR_ATTACHMENT2", "COLOR_ATTACHMENT3", "COLOR_ATTACHMENT4", "COLOR_ATTACHMENT5", "COLOR_ATTACHMENT6", "COLOR_ATTACHMENT7", "COLOR_ATTACHMENT8", "COLOR_ATTACHMENT9", "COLOR_ATTACHMENT10", "COLOR_ATTACHMENT11", "COLOR_ATTACHMENT12", "COLOR_ATTACHMENT13", "COLOR_ATTACHMENT14", "COLOR_ATTACHMENT15"];
	    var attachments = [].concat(colorAttachments, ["DEPTH_ATTACHMENT", "STENCIL_ATTACHMENT", "DEPTH_STENCIL_ATTACHMENT"]);
	    var colorRenderableFormats = ["R8", "R8UI", "R8I", "R16UI", "R16I", "R32UI", "R32I", "RG8", "RG8UI", "RG8I", "RG16UI", "RG16I", "RG32UI", "RG32I", "RGB8", "RGB565", "RGBA8", "SRGB8_ALPHA8", "RGB5_A1", "RGBA4", "RGB10_A2", "RGBA8UI", "RGBA8I", "RGB10_A2UI", "RGBA16UI", "RGBA16I", "RGBA32I", "RGBA32UI"];
	    var depthRenderableFormats = ["DEPTH_COMPONENT16", "DEPTH_COMPONENT24", "DEPTH_COMPONENT32F"];
	    var stencilRenderableFormats = ["DEPTH24_STENCIL8", "DEPTH32F_STENCIL8", "STENCIL_INDEX8"];
	    var renderableFormats = [].concat(colorRenderableFormats, depthRenderableFormats, stencilRenderableFormats);

	    var unsizedColorTextureInternalFormats = ["RGB", "RGBA", "LUMINANCE_ALPHA", "LUMINANCE", "ALPHA"];

	    var sizedColorTextureInternalFormats = ["R8", "R8_SNORM", "R16F", "R32F", "R8UI", "R8I", "R16UI", "R16I", "R32UI", "R32I", "RG8", "RG8_SNORM", "RG16F", "RG32F", "RG8UI", "RG8I", "RG16UI", "RG16I", "RG32UI", "RG32I", "RGB8", "SRGB8", "RGB565", "RGB8_SNORM", "R11F_G11F_B10F", "RGB9_E5", "RGB16F", "RGB32F", "RGB8UI", "RGB8I", "RGB16UI", "RGB16I", "RGB32UI", "RGB32I", "RGBA8", "SRGB8_ALPHA8", "RGBA8_SNORM", "RGB5_A1", "RGBA4", "RGB10_A2", "RGBA16F", "RGBA32F", "RGBA8UI", "RGBA8I", "RGB10_A2UI", "RGBA16UI", "RGBA16I", "RGBA32I", "RGBA32UI"];
	    var depthTextureInternalFormats = ["DEPTH_COMPONENT16", "DEPTH_COMPONENT24", "DEPTH_COMPONENT32F", "DEPTH24_STENCIL8", "DEPTH32F_STENCIL8"];
	    var compressedTextureInternalFormats = ["COMPRESSED_R11_EAC", "COMPRESSED_SIGNED_R11_EAC", "COMPRESSED_RG11_EAC", "COMPRESSED_SIGNED_RG11_EAC", "COMPRESSED_RGB8_ETC2", "COMPRESSED_SRGB8_ETC2", "COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2", "COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2", "COMPRESSED_RGBA8_ETC2_EAC", "COMPRESSED_SRGB8_ALPHA8_ETC2_EAC"];
	    var sizedTextureInternalFormats = [].concat(sizedColorTextureInternalFormats, depthTextureInternalFormats, compressedTextureInternalFormats);
	    var allUncompressedTextureInternalFormats = [].concat(unsizedColorTextureInternalFormats, sizedColorTextureInternalFormats, depthTextureInternalFormats);
	    var allTextureInternalFormats = [].concat(unsizedColorTextureInternalFormats, sizedColorTextureInternalFormats, depthTextureInternalFormats);

	    var queryTargets = ["ANY_SAMPLES_PASSED", "ANY_SAMPLES_PASSED_CONSERVATIVE", "TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN"];

	    var readBufferEnums = ["BACK", "NONE"].concat(colorAttachments);

	    var textureUnits = ["TEXTURE0", "TEXTURE1", "TEXTURE2", "TEXTURE3", "TEXTURE4", "TEXTURE5", "TEXTURE6", "TEXTURE7", "TEXTURE8", "TEXTURE9", "TEXTURE10", "TEXTURE11", "TEXTURE12", "TEXTURE13", "TEXTURE14", "TEXTURE15", "TEXTURE16", "TEXTURE17", "TEXTURE18", "TEXTURE19", "TEXTURE20", "TEXTURE21", "TEXTURE22", "TEXTURE23", "TEXTURE24", "TEXTURE25", "TEXTURE26", "TEXTURE27", "TEXTURE28", "TEXTURE29", "TEXTURE30", "TEXTURE31"];

	    var blendEquations = ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT", "MIN", "MAX"];

	    var capabilities = ["BLEND", "CULL_FACE", "DEPTH_TEST", "DITHER", "POLYGON_OFFSET_FILL", "PRIMITIVE_RESTART_FIXED_INDEX", "RASTERIZER_DISCARD", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"];

	    function setupFunctionInfos(gl) {
	        if (info.functions) {
	            return;
	        }

	        var functionInfos = [new FunctionInfo(gl, "activeTexture", null, [new FunctionParam(gl, "texture", new UIInfo(UIType.ENUM, textureUnits))]), new FunctionInfo(gl, "attachShader", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "bindAttribLocation", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "index", new UIInfo(UIType.LONG)), new FunctionParam(gl, "name", new UIInfo(UIType.STRING))]), new FunctionInfo(gl, "bindBuffer", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bufferTargets)), new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "bindFramebuffer", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, framebufferTargets)), new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "bindRenderbuffer", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])), new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "bindTexture", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bindTextureTargets)), new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "blendColor", null, new UIInfo(UIType.COLOR)), new FunctionInfo(gl, "blendEquation", null, [new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, blendEquations))]), new FunctionInfo(gl, "blendEquationSeparate", null, [new FunctionParam(gl, "modeRGB", new UIInfo(UIType.ENUM, blendEquations)), new FunctionParam(gl, "modeAlpha", new UIInfo(UIType.ENUM, blendEquations))]), new FunctionInfo(gl, "blendFunc", null, [new FunctionParam(gl, "sfactor", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])), new FunctionParam(gl, "dfactor", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"]))]), new FunctionInfo(gl, "blendFuncSeparate", null, [new FunctionParam(gl, "srcRGB", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])), new FunctionParam(gl, "dstRGB", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])), new FunctionParam(gl, "srcAlpha", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])), new FunctionParam(gl, "dstAlpha", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"]))]), new FunctionInfo(gl, "bufferData", null, null), // handled specially below
	        new FunctionInfo(gl, "bufferSubData", null, null), // handled specially below
	        new FunctionInfo(gl, "checkFramebufferStatus", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, framebufferTargets))]), new FunctionInfo(gl, "clear", null, [new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK, ["COLOR_BUFFER_BIT", "DEPTH_BUFFER_BIT", "STENCIL_BUFFER_BIT"]))]), new FunctionInfo(gl, "clearColor", null, new UIInfo(UIType.COLOR)), new FunctionInfo(gl, "clearDepth", null, [new FunctionParam(gl, "depth", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "clearStencil", null, [new FunctionParam(gl, "s", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "colorMask", null, new UIInfo(UIType.COLORMASK)), new FunctionInfo(gl, "compileShader", null, [new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "copyBufferSubData", null, [new FunctionParam(gl, "readTarget", new UIInfo(UIType.ENUM, bufferTargets)), new FunctionParam(gl, "writeTarget", new UIInfo(UIType.ENUM, bufferTargets)), new FunctionParam(gl, "readOffset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "writeOffset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "size", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "copyTexImage2D", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, faceTextureTargets)), new FunctionParam(gl, "level", new UIInfo(UIType.LONG)), new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA", "R8", "RG8", "RGB565", "RGB8", "RGBA4", "RGB5_A1", "RGBA8", "RGB10_A2", "SRGB8", "SRGB8_ALPHA8", "R8I", "R8UI", "R16I", "R16UI", "R32I", "R32UI", "RG8I", "RG8UI", "RG16I", "RG16UI", "RG32I", "RG32UI", "RGBA8I", "RGBA8UI", "RGB10_A2UI", "RGBA16I", "RGBA16UI", "RGBA32I", "RGBA32UI"])), new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG)), new FunctionParam(gl, "border", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "copyTexSubImage2D", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, faceTextureTargets)), new FunctionParam(gl, "level", new UIInfo(UIType.LONG)), new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "createBuffer", null, []), new FunctionInfo(gl, "createFramebuffer", null, []), new FunctionInfo(gl, "createProgram", null, []), new FunctionInfo(gl, "createRenderbuffer", null, []), new FunctionInfo(gl, "createShader", null, [new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["VERTEX_SHADER", "FRAGMENT_SHADER"]))]), new FunctionInfo(gl, "createTexture", null, []), new FunctionInfo(gl, "cullFace", null, [new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"]))]), new FunctionInfo(gl, "deleteBuffer", null, [new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "deleteFramebuffer", null, [new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "deleteProgram", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "deleteRenderbuffer", null, [new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "deleteShader", null, [new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "deleteTexture", null, [new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "depthFunc", null, [new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"]))]), new FunctionInfo(gl, "depthMask", null, [new FunctionParam(gl, "flag", new UIInfo(UIType.BOOL))]), new FunctionInfo(gl, "depthRange", null, [new FunctionParam(gl, "zNear", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "zFar", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "detachShader", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "disable", null, [new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, capabilities))]), new FunctionInfo(gl, "disableVertexAttribArray", null, [new FunctionParam(gl, "index", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "drawArrays", null, [new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, drawModes)), new FunctionParam(gl, "first", new UIInfo(UIType.LONG)), new FunctionParam(gl, "count", new UIInfo(UIType.LONG))], FunctionType.DRAW), new FunctionInfo(gl, "drawElements", null, [new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, drawModes)), new FunctionParam(gl, "count", new UIInfo(UIType.LONG)), new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, elementTypes)), new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))], FunctionType.DRAW), new FunctionInfo(gl, "enable", null, [new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, capabilities))]), new FunctionInfo(gl, "enableVertexAttribArray", null, [new FunctionParam(gl, "index", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "finish", null, []), new FunctionInfo(gl, "flush", null, []), new FunctionInfo(gl, "framebufferRenderbuffer", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, framebufferTargets)), new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, attachments)), new FunctionParam(gl, "renderbuffertarget", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])), new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "framebufferTexture2D", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, framebufferTargets)), new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, attachments)), new FunctionParam(gl, "textarget", new UIInfo(UIType.ENUM, faceTextureTargets)), new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "level", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "frontFace", null, [new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["CW", "CCW"]))]), new FunctionInfo(gl, "generateMipmap", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bindTextureTargets))]), new FunctionInfo(gl, "getActiveAttrib", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "index", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "getActiveUniform", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "index", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "getAttachedShaders", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "getAttribLocation", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "name", new UIInfo(UIType.STRING))]), new FunctionInfo(gl, "getParameter", null, [new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["ACTIVE_TEXTURE", "ALIASED_LINE_WIDTH_RANGE", "ALIASED_POINT_SIZE_RANGE", "ALPHA_BITS", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "BLUE_BITS", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "COMPRESSED_TEXTURE_FORMATS", "COPY_READ_BUFFER_BINDING", "COPY_WRITE_BUFFER_BINDING", "CULL_FACE", "CULL_FACE_MODE", "CURRENT_PROGRAM", "DEPTH_BITS", "DEPTH_CLEAR_VALUE", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_TEST", "DEPTH_WRITEMASK", "DITHER", "DRAW_BUFFER0", "DRAW_BUFFER1", "DRAW_BUFFER2", "DRAW_BUFFER3", "DRAW_BUFFER4", "DRAW_BUFFER5", "DRAW_BUFFER6", "DRAW_BUFFER7", "DRAW_BUFFER8", "DRAW_BUFFER9", "DRAW_BUFFER10", "DRAW_BUFFER11", "DRAW_BUFFER12", "DRAW_BUFFER13", "DRAW_BUFFER14", "DRAW_BUFFER15", "DRAW_FRAMEBUFFER_BINDING", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAGMENT_SHADER_DERIVATIVE_HINT", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "GREEN_BITS", "IMPLEMENTATION_COLOR_READ_FORMAT", "IMPLEMENTATION_COLOR_READ_TYPE", "LINE_WIDTH", "MAJOR_VERSION", "MAX_3D_TEXTURE_SIZE", "MAX_ARRAY_TEXTURE_LAYERS", "MAX_COLOR_ATTACHMENTS", "MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS", "MAX_COMBINED_TEXTURE_IMAGE_UNITS", "MAX_COMBINED_UNIFORM_BLOCKS", "MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS", "MAX_CUBE_MAP_TEXTURE_SIZE", "MAX_DRAW_BUFFERS", "MAX_ELEMENT_INDEX", "MAX_ELEMENTS_INDICES", "MAX_ELEMENTS_VERTICES", "MAX_FRAGMENT_INPUT_COMPONENTS", "MAX_FRAGMENT_UNIFORM_BLOCKS", "MAX_FRAGMENT_UNIFORM_COMPONENTS", "MAX_FRAGMENT_UNIFORM_VECTORS", "MAX_PROGRAM_TEXEL_OFFSET", "MAX_RENDERBUFFER_SIZE", "MAX_SAMPLES", "MAX_SERVER_WAIT_TIMEOUT", "MAX_TEXTURE_IMAGE_UNITS", "MAX_TEXTURE_LOD_BIAS", "MAX_TEXTURE_SIZE", "MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS", "MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS", "MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS", "MAX_UNIFORM_BLOCK_SIZE", "MAX_UNIFORM_BUFFER_BINDINGS", "MAX_VARYING_COMPONENTS", "MAX_VARYING_VECTORS", "MAX_VERTEX_ATTRIBS", "MAX_VERTEX_TEXTURE_IMAGE_UNITS", "MAX_VERTEX_OUTPUT_COMPONENTS", "MAX_VERTEX_UNIFORM_BLOCKS", "MAX_VERTEX_UNIFORM_COMPONENTS", "MAX_VERTEX_UNIFORM_VECTORS", "MAX_VIEWPORT_DIMS", "MIN_PROGRAM_TEXEL_OFFSET", "MINOR_VERSION", "NUM_COMPRESSED_TEXTURE_FORMATS", "NUM_EXTENSIONS", "NUM_PROGRAM_BINARY_FORMATS", "NUM_SHADER_BINARY_FORMATS", "PACK_ALIGNMENT", "PACK_ROW_LENGTH", "PACK_SKIP_PIXELS", "PACK_SKIP_ROWS", "PIXEL_PACK_BUFFER_BINDING", "PIXEL_UNPACK_BUFFER_BINDING", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "PRIMITIVE_RESTART_FIXED_INDEX", "PROGRAM_BINARY_FORMATS", "RASTERIZER_DISCARD", "READ_BUFFER", "READ_FRAMEBUFFER_BINDING", "RED_BITS", "RENDERBUFFER_BINDING", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_BUFFERS", "SAMPLE_COVERAGE", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SAMPLER_BINDING", "SAMPLES", "SCISSOR_BOX", "SCISSOR_TEST", "SHADER_BINARY_FORMATS", "SHADER_COMPILER", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_BITS", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "SUBPIXEL_BITS", "TEXTURE_BINDING_2D", "TEXTURE_BINDING_2D_ARRAY", "TEXTURE_BINDING_3D", "TEXTURE_BINDING_CUBE_MAP", "TRANSFORM_FEEDBACK_BINDING", "TRANSFORM_FEEDBACK_ACTIVE", "TRANSFORM_FEEDBACK_BUFFER_BINDING", "TRANSFORM_FEEDBACK_PAUSED", "UNIFORM_BUFFER_BINDING", "UNIFORM_BUFFER_START", "UNPACK_ROW_LENGTH", "UNPACK_SKIP_ROWS", "VERTEX_ARRAY_BINDING"]))]), new FunctionInfo(gl, "getBufferParameter", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bufferTargets)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["BUFFER_ACCESS_FLAGS", "BUFFER_MAPPED", "BUFFER_MAP_LENGTH", "BUFFER_MAP_OFFSET", "BUFFER_SIZE", "BUFFER_USAGE"]))]), new FunctionInfo(gl, "getBufferSubData", null, null), // handled specially below
	        new FunctionInfo(gl, "getError", null, []), new FunctionInfo(gl, "getSupportedExtensions", null, []), new FunctionInfo(gl, "getExtension", null, [new FunctionParam(gl, "name", new UIInfo(UIType.STRING))]), new FunctionInfo(gl, "getFramebufferAttachmentParameter", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, framebufferTargets)), new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, attachments)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE", "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME", "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL", "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE"]))]), new FunctionInfo(gl, "getProgramParameter", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["ACTIVE_ATTRIBUTES", "ACTIVE_ATTRIBUTE_MAX_LENGTH", "ACTIVE_UNIFORMS", "ACTIVE_UNIFORM_BLOCKS", "ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH", "ACTIVE_UNIFORM_MAX_LENGTH", "ATTACHED_SHADERS", "DELETE_STATUS", "INFO_LOG_LENGTH", "LINK_STATUS", "PROGRAM_BINARY_RETRIEVABLE_HINT", "TRANSFORM_FEEDBACK_BUFFER_MODE", "TRANSFORM_FEEDBACK_VARYINGS", "TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH", "VALIDATE_STATUS"]))]), new FunctionInfo(gl, "getProgramInfoLog", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "getRenderbufferParameter", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["RENDERBUFFER_WIDTH", "RENDERBUFFER_HEIGHT", "RENDERBUFFER_INTERNAL_FORMAT", "RENDERBUFFER_RED_SIZE", "RENDERBUFFER_GREEN_SIZE", "RENDERBUFFER_BLUE_SIZE", "RENDERBUFFER_ALPHA_SIZE", "RENDERBUFFER_DEPTH_SIZE", "RENDERBUFFER_STENCIL_SIZE"]))]), new FunctionInfo(gl, "getShaderParameter", null, [new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["SHADER_TYPE", "DELETE_STATUS", "COMPILE_STATUS", "INFO_LOG_LENGTH", "SHADER_SOURCE_LENGTH"]))]), new FunctionInfo(gl, "getShaderInfoLog", null, [new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "getShaderSource", null, [new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "getTexParameter", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bindTextureTargets)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, texParamNames))]), new FunctionInfo(gl, "getUniform", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)) // TODO: find a way to treat this as an integer? browsers don't like this...
	        ]), new FunctionInfo(gl, "getUniformLocation", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "name", new UIInfo(UIType.STRING))]), new FunctionInfo(gl, "getVertexAttrib", null, [new FunctionParam(gl, "index", new UIInfo(UIType.LONG)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING", "VERTEX_ATTRIB_ARRAY_ENABLED", "VERTEX_ATTRIB_ARRAY_SIZE", "VERTEX_ATTRIB_ARRAY_STRIDE", "VERTEX_ATTRIB_ARRAY_TYPE", "VERTEX_ATTRIB_ARRAY_NORMALIZED", "CURRENT_VERTEX_ATTRIB"]))]), new FunctionInfo(gl, "getVertexAttribOffset", null, [new FunctionParam(gl, "index", new UIInfo(UIType.LONG)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["VERTEX_ATTRIB_ARRAY_POINTER"]))]), new FunctionInfo(gl, "hint", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["GENERATE_MIPMAP_HINT", "FRAGMENT_SHADER_DERIVATIVE_HINT_OES"])), new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["FASTEST", "NICEST", "DONT_CARE"]))]), new FunctionInfo(gl, "isBuffer", null, [new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "isEnabled", null, [new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, capabilities))]), new FunctionInfo(gl, "isFramebuffer", null, [new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "isProgram", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "isRenderbuffer", null, [new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "isShader", null, [new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "isTexture", null, [new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "lineWidth", null, [new FunctionParam(gl, "width", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "linkProgram", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "pixelStorei", null, [new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["PACK_ALIGNMENT", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "PACK_ROW_LENGTH", "PACK_SKIP_PIXELS", "PACK_SKIP_ROWS", "UNPACK_IMAGE_HEIGHT", "UNPACK_ROW_LENGTH", "UNPACK_SKIP_IMAGES", "UNPACK_SKIP_PIXELS", "UNPACK_SKIP_ROWS"])), new FunctionParam(gl, "param", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "polygonOffset", null, [new FunctionParam(gl, "factor", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "units", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "readPixels", null, null), // handled specially below[
	        new FunctionInfo(gl, "renderbufferStorage", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])), new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, renderableFormats)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "sampleCoverage", null, [new FunctionParam(gl, "value", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "invert", new UIInfo(UIType.BOOL))]), new FunctionInfo(gl, "scissor", null, [new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "shaderSource", null, [new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "source", new UIInfo(UIType.STRING))]), new FunctionInfo(gl, "stencilFunc", null, [new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])), new FunctionParam(gl, "ref", new UIInfo(UIType.LONG)), new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))]), new FunctionInfo(gl, "stencilFuncSeparate", null, [new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])), new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])), new FunctionParam(gl, "ref", new UIInfo(UIType.LONG)), new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))]), new FunctionInfo(gl, "stencilMask", null, [new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))]), new FunctionInfo(gl, "stencilMaskSeparate", null, [new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])), new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))]), new FunctionInfo(gl, "stencilOp", null, [new FunctionParam(gl, "fail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new FunctionParam(gl, "zfail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new FunctionParam(gl, "zpass", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"]))]), new FunctionInfo(gl, "stencilOpSeparate", null, [new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])), new FunctionParam(gl, "fail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new FunctionParam(gl, "zfail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new FunctionParam(gl, "zpass", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"]))]), new FunctionInfo(gl, "texImage2D", null, null), // handled specially below
	        new FunctionInfo(gl, "texParameterf", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bindTextureTargets)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, texParamNames)), new FunctionParam(gl, "param", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "texParameteri", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bindTextureTargets)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, texParamNames)), new FunctionParam(gl, "param", new UIInfo(UIType.ENUM, ["NEAREST", "LINEAR", "NEAREST_MIPMAP_NEAREST", "LINEAR_MIPMAP_NEAREST", "NEAREST_MIPMAP_LINEAR", "LINEAR_MIPMAP_LINEAR", "CLAMP_TO_EDGE", "MIRRORED_REPEAT", "REPEAT", "COMPARE_REF_TO_TEXTURE", "LEQUAL", "GEQUAL", "LESS", "GREATER", "EQUAL", "NOTEQUAL", "ALWAYS", "NEVER", "RED", "GREEN", "BLUE", "ALPHA", "ZERO", "ONE"]))]), new FunctionInfo(gl, "texSubImage2D", null, null), // handled specially below
	        new FunctionInfo(gl, "compressedTexImage2D", null, null), // handled specially below
	        new FunctionInfo(gl, "compressedTexSubImage2D", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform1f", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "uniform1fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform1i", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "x", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "uniform1iv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform2f", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "uniform2fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform2i", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "uniform2iv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform3f", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "uniform3fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform3i", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "z", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "uniform3iv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform4f", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "w", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "uniform4fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform4i", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "z", new UIInfo(UIType.LONG)), new FunctionParam(gl, "w", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "uniform4iv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix2fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix3fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix4fv", null, null), // handled specially below
	        new FunctionInfo(gl, "useProgram", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "validateProgram", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "vertexAttrib1f", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "vertexAttrib1fv", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "vertexAttrib2f", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "vertexAttrib2fv", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "vertexAttrib3f", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "vertexAttrib3fv", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "vertexAttrib4f", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "w", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "vertexAttrib4fv", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "vertexAttribPointer", null, [new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)), new FunctionParam(gl, "size", new UIInfo(UIType.LONG)), new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["BYTE", "UNSIGNED_BYTE", "SHORT", "UNSIGNED_SHORT", "FIXED", "FLOAT"])), new FunctionParam(gl, "normalized", new UIInfo(UIType.BOOL)), new FunctionParam(gl, "stride", new UIInfo(UIType.LONG)), new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "viewport", null, [new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "blitFramebuffer", null, [new FunctionParam(gl, "srcX0", new UIInfo(UIType.LONG)), new FunctionParam(gl, "srcY0", new UIInfo(UIType.LONG)), new FunctionParam(gl, "srcX1", new UIInfo(UIType.LONG)), new FunctionParam(gl, "srcY1", new UIInfo(UIType.LONG)), new FunctionParam(gl, "dstX0", new UIInfo(UIType.LONG)), new FunctionParam(gl, "dstY0", new UIInfo(UIType.LONG)), new FunctionParam(gl, "dstX1", new UIInfo(UIType.LONG)), new FunctionParam(gl, "dstY1", new UIInfo(UIType.LONG)), new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK, ["COLOR_BUFFER_BIT", "DEPTH_BUFFER_BIT", "STENCIL_BUFFER_BIT"])), new FunctionParam(gl, "filter", new UIInfo(UIType.ENUM, ["NEAREST", "LINEAR"]))]), new FunctionInfo(gl, "framebufferTextureLayer", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, framebufferTargets)), new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, attachments)), new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "level", new UIInfo(UIType.LONG)), new FunctionParam(gl, "layer", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "invalidateFramebuffer", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, framebufferTargets)), new FunctionParam(gl, "attachments", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "invalidateSubFramebuffer", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, framebufferTargets)), new FunctionParam(gl, "attachments", new UIInfo(UIType.ARRAY)), new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "readBuffer", null, [new FunctionParam(gl, "src", new UIInfo(UIType.ENUM, readBufferEnums))]),
	        /* Renderbuffer objects */
	        new FunctionInfo(gl, "getInternalformatParameter", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])), new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, renderableFormats)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["NUM_SAMPLE_COUNTS", "SAMPLES"]))]), new FunctionInfo(gl, "renderbufferStorageMultisample", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])), new FunctionParam(gl, "samples", new UIInfo(UIType.LONG)), new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, renderableFormats)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG))]),

	        /* Texture objects */
	        new FunctionInfo(gl, "texStorage2D", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, texture2DTargets)), new FunctionParam(gl, "levels", new UIInfo(UIType.LONG)), new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, sizedTextureInternalFormats)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "texStorage3D", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, texture3DTargets)), new FunctionParam(gl, "levels", new UIInfo(UIType.LONG)), new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, sizedTextureInternalFormats)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG)), new FunctionParam(gl, "depth", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "copyTexSubImage3D", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, texture3DTargets)), new FunctionParam(gl, "level", new UIInfo(UIType.LONG)), new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "zoffset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "width", new UIInfo(UIType.LONG)), new FunctionParam(gl, "height", new UIInfo(UIType.LONG))]),

	        /* Programs and shaders */
	        new FunctionInfo(gl, "GLint getFragDataLocation", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "name", new UIInfo(UIType.STRING))]), new FunctionInfo(gl, "uniform1ui", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "v0", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "uniform2ui", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "v0", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "v1", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "uniform3ui", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "v0", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "v1", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "v2", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "uniform4ui", null, [new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "v0", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "v1", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "v2", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "v3", new UIInfo(UIType.ULONG))]),

	        /* Vertex attribs */
	        new FunctionInfo(gl, "vertexAttribI4i", null, [new FunctionParam(gl, "index", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "x", new UIInfo(UIType.LONG)), new FunctionParam(gl, "y", new UIInfo(UIType.LONG)), new FunctionParam(gl, "z", new UIInfo(UIType.LONG)), new FunctionParam(gl, "w", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "vertexAttribI4iv", null, [new FunctionParam(gl, "index", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "vertexAttribI4ui", null, [new FunctionParam(gl, "index", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "x", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "y", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "z", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "w", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "vertexAttribI4uiv", null, [new FunctionParam(gl, "index", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "vertexAttribIPointer", null, [new FunctionParam(gl, "index", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "size", new UIInfo(UIType.LONG)), new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["BYTE", "UNSIGNED_BYTE", "SHORT", "UNSIGNED_SHORT", "INT", "UNSIGNED_INT"])), new FunctionParam(gl, "stride", new UIInfo(UIType.LONG)), new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))]),

	        /* Writing to the drawing buffer */
	        new FunctionInfo(gl, "vertexAttribDivisor", null, [new FunctionParam(gl, "index", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "divisor", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "drawArraysInstanced", null, [new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, drawModes)), new FunctionParam(gl, "first", new UIInfo(UIType.LONG)), new FunctionParam(gl, "count", new UIInfo(UIType.LONG)), new FunctionParam(gl, "instanceCount", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "drawElementsInstanced", null, [new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, drawModes)), new FunctionParam(gl, "count", new UIInfo(UIType.LONG)), new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, elementTypes)), new FunctionParam(gl, "offset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "instanceCount", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "drawRangeElements", null, [new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, drawModes)), new FunctionParam(gl, "start", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "end", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "count", new UIInfo(UIType.LONG)), new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, elementTypes)), new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))]),

	        /* Multiple Render Targets */
	        new FunctionInfo(gl, "drawBuffers", null, [new FunctionParam(gl, "buffers", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "clearBufferfi", null, [new FunctionParam(gl, "buffer", new UIInfo(UIType.ENUM, ["DEPTH_STENCIL"])), new FunctionParam(gl, "drawbuffer", new UIInfo(UIType.LONG)), new FunctionParam(gl, "depth", new UIInfo(UIType.FLOAT)), new FunctionParam(gl, "stencil", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "clearBufferfv", null, null), // handled specially below
	        new FunctionInfo(gl, "clearBufferiv", null, null), // handled specially below
	        new FunctionInfo(gl, "clearBufferuiv", null, null), // handled specially below
	        /* Query Objects */
	        new FunctionInfo(gl, "createQuery", null, [,]), new FunctionInfo(gl, "deleteQuery", null, [new FunctionParam(gl, "query", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "GLboolean isQuery", null, [new FunctionParam(gl, "query", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "beginQuery", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, queryTargets)), new FunctionParam(gl, "query", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "endQuery", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, queryTargets))]), new FunctionInfo(gl, "getQuery", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, queryTargets)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["CURRENT_QUERY"]))]), new FunctionInfo(gl, "getQueryParameter", null, [new FunctionParam(gl, "query", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["QUERY_RESULT", "QUERY_RESULT_AVAILABLE"]))]),

	        /* Sampler Objects */
	        new FunctionInfo(gl, "createSampler", null, [,]), new FunctionInfo(gl, "deleteSampler", null, [new FunctionParam(gl, "sampler", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "GLboolean isSampler", null, [new FunctionParam(gl, "sampler", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "bindSampler", null, [new FunctionParam(gl, "unit", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "sampler", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "samplerParameteri", null, [new FunctionParam(gl, "sampler", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, samplerParamNames)), new FunctionParam(gl, "param", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "samplerParameterf", null, [new FunctionParam(gl, "sampler", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, samplerParamNames)), new FunctionParam(gl, "param", new UIInfo(UIType.FLOAT))]), new FunctionInfo(gl, "getSamplerParameter", null, [new FunctionParam(gl, "sampler", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, samplerParamNames))]),

	        /* Sync objects */
	        new FunctionInfo(gl, "fenceSync", null, [new FunctionParam(gl, "condition", new UIInfo(UIType.ENUM, ["SYNC_GPU_COMMANDS_COMPLETE"])), new FunctionParam(gl, "flags", new UIInfo(UIType.BITMASK, []))]), new FunctionInfo(gl, "GLboolean isSync", null, [new FunctionParam(gl, "sync", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "deleteSync", null, [new FunctionParam(gl, "sync", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "clientWaitSync", null, [new FunctionParam(gl, "sync", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "flags", new UIInfo(UIType.BITMASK, ["SYNC_FLUSH_COMMANDS_BIT"])), new FunctionParam(gl, "timeout", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "waitSync", null, [new FunctionParam(gl, "sync", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "flags", new UIInfo(UIType.BITMASK, [])), new FunctionParam(gl, "timeout", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "getSyncParameter", null, [new FunctionParam(gl, "sync", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["OBJECT_TYPE", "SYNC_STATUS", "SYNC_CONDITION", "SYNC_FLAGS"]))]),

	        /* Transform Feedback */
	        new FunctionInfo(gl, "createTransformFeedback", null, [,]), new FunctionInfo(gl, "deleteTransformFeedback", null, [new FunctionParam(gl, "tf", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "isTransformFeedback", null, [new FunctionParam(gl, "tf", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "bindTransformFeedback ", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TRANSFORM_FEEDBACK"])), new FunctionParam(gl, "tf", new UIInfo(UIType.Object))]), new FunctionInfo(gl, "beginTransformFeedback", null, [new FunctionParam(gl, "primitiveMode", new UIInfo(UIType.ENUM, ["POINTS", "LINES", "TRIANGLES"]))]), new FunctionInfo(gl, "endTransformFeedback", null, [,]), new FunctionInfo(gl, "transformFeedbackVaryings", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "varyings", new UIInfo(UIType.ARRAY)), new FunctionParam(gl, "bufferMode", new UIInfo(UIType.ENUM, ["INTERLEAVED_ATTRIBS", "SEPARATE_ATTRIBS"]))]), new FunctionInfo(gl, "getTransformFeedbackVarying", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "index", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "pauseTransformFeedback", null, [,]), new FunctionInfo(gl, "resumeTransformFeedback", null, [,]),

	        /* Uniform Buffer Objects and Transform Feedback Buffers */
	        new FunctionInfo(gl, "bindBufferBase", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TRANSFORM_FEEDBACK_BUFFER", "UNIFORM_BUFFER"])), new FunctionParam(gl, "index", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "bindBufferRange", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TRANSFORM_FEEDBACK_BUFFER", "UNIFORM_BUFFER"])), new FunctionParam(gl, "index", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "offset", new UIInfo(UIType.LONG)), new FunctionParam(gl, "size", new UIInfo(UIType.LONG))]), new FunctionInfo(gl, "getIndexedParameter", null, [new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TRANSFORM_FEEDBACK_BUFFER_BINDING", "TRANSFORM_FEEDBACK_BUFFER_SIZE", "TRANSFORM_FEEDBACK_BUFFER_START", "UNIFORM_BUFFER_BINDING", "UNIFORM_BUFFER_SIZE", "UNIFORM_BUFFER_START"])), new FunctionParam(gl, "index", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "getUniformIndices", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "uniformNames", new UIInfo(UIType.ARRAY))]), new FunctionInfo(gl, "getActiveUniforms", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "uniformIndices", new UIInfo(UIType.ARRAY)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["UNIFORM_TYPE", "UNIFORM_SIZE", "UNIFORM_NAME_LENGTH", "UNIFORM_BLOCK_INDEX", "UNIFORM_ARRAY_STRIDE", "UNIFORM_MATRIX_STRIDE", "UNIFORM_IS_ROW_MAJOR"]))]), new FunctionInfo(gl, "getUniformBlockIndex", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "uniformBlockName", new UIInfo(UIType.STRING))]), new FunctionInfo(gl, "getActiveUniformBlockParameter", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "uniformBlockIndex", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["UNIFORM_BLOCK_BINDING", "UNIFORM_BLOCK_DATA_SIZE", "UNIFORM_BLOCK_NAME_LENGTH", "UNIFORM_BLOCK_ACTIVE_UNIFORMS", "UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES", "UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER", "UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER"]))]), new FunctionInfo(gl, "getActiveUniformBlockName", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "uniformBlockIndex", new UIInfo(UIType.ULONG))]), new FunctionInfo(gl, "uniformBlockBinding", null, [new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)), new FunctionParam(gl, "uniformBlockIndex", new UIInfo(UIType.ULONG)), new FunctionParam(gl, "uniformBlockBinding", new UIInfo(UIType.ULONG))]),

	        /* Vertex Array Objects */
	        new FunctionInfo(gl, "createVertexArray", null, [,]), new FunctionInfo(gl, "deleteVertexArray", null, [new FunctionParam(gl, "vertexArray", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "GLboolean isVertexArray", null, [new FunctionParam(gl, "vertexArray", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "bindVertexArray", null, [new FunctionParam(gl, "vertexArray", new UIInfo(UIType.OBJECT))]), new FunctionInfo(gl, "texImage3D", null, null), // handled specially below
	        new FunctionInfo(gl, "texSubImage3D", null, null), // handled specially below
	        new FunctionInfo(gl, "compressedTexImage3D", null, null), // handled specially below
	        new FunctionInfo(gl, "compressedTexSubImage3D", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform1uiv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform2uiv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform3uiv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniform4uiv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix3x2fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix4x2fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix2x3fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix4x3fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix2x4fv", null, null), // handled specially below
	        new FunctionInfo(gl, "uniformMatrix3x4fv", null, null), // handled specially below
	        new FunctionInfo(gl, "readPixels", null, null), // handled specially below
	        new FunctionInfo(gl, "getBufferSubData", null, null), // handled specially below
	        new FunctionInfo(gl, "texImage2D", null, null), // handled specially below
	        new FunctionInfo(gl, "texSubImage2D", null, null)];

	        // Build lookup
	        for (var n = 0; n < functionInfos.length; n++) {
	            functionInfos[functionInfos[n].name] = functionInfos[n];
	        }

	        functionInfos["clearBufferfv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "buffer", new UIInfo(UIType.ENUM, [])));
	            args.push(new FunctionParam(gl, "drawbuffer", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY)));

	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["clearBufferiv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "buffer", new UIInfo(UIType.ENUM, [])));
	            args.push(new FunctionParam(gl, "drawbuffer", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["clearBufferuiv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "buffer", new UIInfo(UIType.ENUM, [])));
	            args.push(new FunctionParam(gl, "drawbuffer", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY)));

	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };

	        functionInfos["texImage3D"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, texture3DTargets)));
	            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, allUncompressedTextureInternalFormats)));
	            args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "depth", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "border", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, textureFormats)));
	            args.push(new FunctionParam(gl, "type", textureTypes));
	            if (typeof call.args[9] === "number") {
	                args.push(new FunctionParam(gl, "pboOffset", new UIInfo(UIType.LONG)));
	            } else if (util.isTypedArray(call.args[9])) {
	                args.push(new FunctionParam(gl, "srcData", new UIInfo(UIType.ARRAY)));
	                if (call.args.length >= 11) {
	                    args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	                }
	            } else {
	                args.push(new FunctionParam(gl, "source", new UIInfo(UIType.ARRAY)));
	            }
	            return args;
	        };
	        functionInfos["texSubImage3D"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, texture3DTargets)));
	            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "zoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "depth", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, textureFormats)));
	            args.push(new FunctionParam(gl, "type", textureTypes));
	            if (typeof call.args[10] === "number") {
	                args.push(new FunctionParam(gl, "pboOffset", new UIInfo(UIType.LONG)));
	            } else if (util.isTypedArray(call.args[10])) {
	                args.push(new FunctionParam(gl, "srcData", new UIInfo(UIType.ARRAY)));
	                if (call.args.length >= 12) {
	                    args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	                }
	            } else {
	                args.push(new FunctionParam(gl, "source", new UIInfo(UIType.OBJECT)));
	            }
	            return args;
	        };
	        functionInfos["compressedTexImage2D"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, faceTextureTargets)));
	            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, compressedTextureInternalFormats)));
	            args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "border", new UIInfo(UIType.LONG)));
	            if (typeof call.args[6] === "number") {
	                args.push(new FunctionParam(gl, "offset", new UIInfo(UIType.LONG)));
	            } else {
	                args.push(new FunctionParam(gl, "srcData", new UIInfo(UIType.ARRAY)));
	                if (call.args.length >= 7) {
	                    args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	                }
	                if (call.args.length >= 8) {
	                    args.push(new FunctionParam(gl, "srcLengthOverride", new UIInfo(UIType.ULONG)));
	                }
	            }
	            return args;
	        };
	        functionInfos["compressedTexImage3D"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, texture3DTargets)));
	            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, compressedTextureInternalFormats)));
	            args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "depth", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "border", new UIInfo(UIType.LONG)));
	            if (typeof call.args[7] === "number") {
	                args.push(new FunctionParam(gl, "offset", new UIInfo(UIType.LONG)));
	            } else {
	                args.push(new FunctionParam(gl, "srcData", new UIInfo(UIType.OBJECT)));
	                if (call.args.length >= 8) {
	                    args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	                }
	                if (call.args.length >= 9) {
	                    args.push(new FunctionParam(gl, "srcLengthOverride", new UIInfo(UIType.ULONG)));
	                }
	            }
	            return args;
	        };
	        functionInfos["compressedTexSubImage2D"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, texture2DTargets)));
	            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, compressedTextureInternalFormats)));
	            if (typeof call.args[7] === "number") {
	                args.push(new FunctionParam(gl, "offset", new UIInfo(UIType.LONG)));
	            } else {
	                args.push(new FunctionParam(gl, "srcData", new UIInfo(UIType.OBJECT)));
	                if (call.args.length >= 8) {
	                    args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	                }
	                if (call.args.length >= 9) {
	                    args.push(new FunctionParam(gl, "srcLengthOverride", new UIInfo(UIType.ULONG)));
	                }
	            }
	            return args;
	        };
	        functionInfos["compressedTexSubImage3D"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, texture3DTargets)));
	            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "zoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "depth", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, compressedTextureInternalFormats)));
	            if (typeof call.args[9] === "number") {
	                args.push(new FunctionParam(gl, "offset", new UIInfo(UIType.LONG)));
	            } else {
	                args.push(new FunctionParam(gl, "srcData", new UIInfo(UIType.OBJECT)));
	                if (call.args.length >= 10) {
	                    args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	                }
	                if (call.args.length >= 11) {
	                    args.push(new FunctionParam(gl, "srcLengthOverride", new UIInfo(UIType.ULONG)));
	                }
	            }
	            return args;
	        };
	        functionInfos["uniform1fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform2fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform3fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform4fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform1iv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform2iv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform3iv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform4iv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform1uiv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform2uiv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform3uiv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniform4uiv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 3) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix2fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix3x2fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix4x2fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix2x3fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix3fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix4x3fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix2x4fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix3x4fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        functionInfos["uniformMatrix4fv"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)));
	            args.push(new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.ARRAY)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "srcLength", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };
	        /* Reading back pixels */
	        // WebGL1:
	        functionInfos["readPixels"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "x", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "y", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["RED", "RED_INTEGER", "RG", "RG_INTEGER", "RGB", "RGB_INTEGER", "RGBA", "RGBA_INTEGER", "LUMINANCE_ALPHA", "LUMINANCE", "ALPHA"])));
	            args.push(new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "BYTE", "HALF_FLOAT", "FLOAT", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1", "UNSIGNED_INT_2_10_10_10_REV", "UNSIGNED_INT_10F_11F_11F_REV", "UNSIGNED_INT_5_9_9_9_REV"])));
	            if (typeof call.args[6] === "number") {
	                args.push(new FunctionParam(gl, "offset", new UIInfo(UIType.LONG)));
	            } else {
	                args.push(new FunctionParam(gl, "dstData", new UIInfo(UIType.OBJECT)));
	            }
	            if (call.args.length === 7) {
	                args.push(new FunctionParam(gl, "dstOffset", new UIInfo(UIType.ULONG)));
	            }
	            return args;
	        };

	        functionInfos["bufferData"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bufferTargets)));
	            if (typeof call.args[1] === "number") {
	                args.push(new FunctionParam(gl, "size", new UIInfo(UIType.LONG)));
	            } else {
	                args.push(new FunctionParam(gl, "data", new UIInfo(UIType.OBJECT)));
	            }
	            args.push(new FunctionParam(gl, "usage", new UIInfo(UIType.ENUM, ["STREAM_DRAW", "STREAM_READ", "STREAM_COPY", "STATIC_DRAW", "STATIC_READ", "STATIC_COPY", "DYNAMIC_DRAW", "DYNAMIC_READ", "DYNAMIC_COPY"])));
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "length", new UIInfo(UIType.LONG)));
	            }
	            return args;
	        };
	        functionInfos["bufferSubData"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bufferTargets)));
	            args.push(new FunctionParam(gl, "offset", new UIInfo(UIType.ULONG)));
	            args.push(new FunctionParam(gl, "data", new UIInfo(UIType.OBJECT)));
	            if (call.args.length === 4) {
	                args.push(new FunctionParam(gl, "length", new UIInfo(UIType.LONG)));
	            }
	            return args;
	        };
	        functionInfos["getBufferSubData"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, bufferTargets)));
	            args.push(new FunctionParam(gl, "srcByteOffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "dstBuffer", new UIInfo(UIType.OBJECT)));
	            if (call.args.length >= 4) {
	                args.push(new FunctionParam(gl, "dstOffset", new UIInfo(UIType.LONG)));
	            }
	            if (call.args.length === 5) {
	                args.push(new FunctionParam(gl, "length", new UIInfo(UIType.LONG)));
	            }
	            return args;
	        };

	        functionInfos["texImage2D"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, faceTextureTargets)));
	            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, allUncompressedTextureInternalFormats)));
	            if (call.args.length >= 9) {
	                args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	                args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	                args.push(new FunctionParam(gl, "border", new UIInfo(UIType.LONG)));
	                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, textureFormats)));
	                args.push(new FunctionParam(gl, "type", textureTypes));
	                if (util.isTypedArray(call.args[9])) {
	                    args.push(new FunctionParam(gl, "srcData", new UIInfo(UIType.ARRAY)));
	                } else {
	                    args.push(new FunctionParam(gl, "source", new UIInfo(UIType.OBJECT)));
	                }
	                if (call.args.length >= 10) {
	                    args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	                }
	            } else {
	                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, textureFormats)));
	                args.push(new FunctionParam(gl, "type", textureTypes));
	                args.push(new FunctionParam(gl, "value", new UIInfo(UIType.OBJECT)));
	            }
	            return args;
	        };
	        functionInfos["texSubImage2D"].getArgs = function (call) {
	            var args = [];
	            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, faceTextureTargets)));
	            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)));
	            args.push(new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)));
	            if (call.args.length == 9) {
	                args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
	                args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
	                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, textureFormats)));
	                args.push(new FunctionParam(gl, "type", textureTypes));
	                if (typeof call.args[8] === "number") {
	                    args.push(new FunctionParam(gl, "pboOffset", new UIInfo(UIType.LONG)));
	                } else if (util.isTypedArray(call.args[8])) {
	                    args.push(new FunctionParam(gl, "srcData", new UIInfo(UIType.ARRAY)));
	                    if (call.args.length >= 10) {
	                        args.push(new FunctionParam(gl, "srcOffset", new UIInfo(UIType.ULONG)));
	                    }
	                } else {
	                    args.push(new FunctionParam(gl, "source", new UIInfo(UIType.OBJECT)));
	                }
	            } else {
	                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, textureFormats)));
	                args.push(new FunctionParam(gl, "type", textureTypes));
	                args.push(new FunctionParam(gl, "value", new UIInfo(UIType.OBJECT)));
	            }
	            return args;
	        };

	        info.functions = functionInfos;
	    };

	    var StateParameter = function StateParameter(staticgl, name, readOnly, ui) {
	        this.value = staticgl[name];
	        this.name = name;
	        this.readOnly = readOnly;
	        this.ui = ui;

	        this.getter = function (gl) {
	            try {
	                return gl.getParameter(gl[this.name]);
	            } catch (e) {
	                console.log("unable to get state parameter " + this.name);
	                return null;
	            }
	        };
	    };

	    function setupStateParameters(gl) {
	        var isWebGL2 = util.isWebGL2(gl);

	        if (info.stateParameters) {
	            return;
	        }

	        var drawBuffers = ["NONE", "BACK", "DRAW_BUFFER0", "DRAW_BUFFER1", "DRAW_BUFFER2", "DRAW_BUFFER3", "DRAW_BUFFER4", "DRAW_BUFFER5", "DRAW_BUFFER6", "DRAW_BUFFER7", "DRAW_BUFFER8", "DRAW_BUFFER9", "DRAW_BUFFER10", "DRAW_BUFFER11", "DRAW_BUFFER12", "DRAW_BUFFER13", "DRAW_BUFFER14", "DRAW_BUFFER15"];

	        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

	        var hintValues = ["FASTEST", "NICEST", "DONT_CARE"];
	        var stateParameters = [new StateParameter(gl, "ACTIVE_TEXTURE", false, new UIInfo(UIType.ENUM, ["TEXTURE0", "TEXTURE1", "TEXTURE2", "TEXTURE3", "TEXTURE4", "TEXTURE5", "TEXTURE6", "TEXTURE7", "TEXTURE8", "TEXTURE9", "TEXTURE10", "TEXTURE11", "TEXTURE12", "TEXTURE13", "TEXTURE14", "TEXTURE15", "TEXTURE16", "TEXTURE17", "TEXTURE18", "TEXTURE19", "TEXTURE20", "TEXTURE21", "TEXTURE22", "TEXTURE23", "TEXTURE24", "TEXTURE25", "TEXTURE26", "TEXTURE27", "TEXTURE28", "TEXTURE29", "TEXTURE30", "TEXTURE31"])), new StateParameter(gl, "ALIASED_LINE_WIDTH_RANGE", true, new UIInfo(UIType.RANGE)), new StateParameter(gl, "ALIASED_POINT_SIZE_RANGE", true, new UIInfo(UIType.RANGE)), new StateParameter(gl, "ALPHA_BITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "ARRAY_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "BLEND", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "BLEND_COLOR", false, new UIInfo(UIType.COLOR)), new StateParameter(gl, "BLEND_DST_ALPHA", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])), new StateParameter(gl, "BLEND_DST_RGB", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])), new StateParameter(gl, "BLEND_EQUATION_ALPHA", false, new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"])), new StateParameter(gl, "BLEND_EQUATION_RGB", false, new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"])), new StateParameter(gl, "BLEND_SRC_ALPHA", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])), new StateParameter(gl, "BLEND_SRC_RGB", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])), new StateParameter(gl, "BLUE_BITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "COLOR_CLEAR_VALUE", false, new UIInfo(UIType.COLOR)), new StateParameter(gl, "COLOR_WRITEMASK", false, new UIInfo(UIType.COLORMASK)), new StateParameter(gl, "CULL_FACE", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "CULL_FACE_MODE", false, new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])), new StateParameter(gl, "CURRENT_PROGRAM", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "DEPTH_BITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "DEPTH_CLEAR_VALUE", false, new UIInfo(UIType.FLOAT)), new StateParameter(gl, "DEPTH_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "EQUAL", "LEQUAL", "GREATER", "NOTEQUAL", "GEQUAL", "ALWAYS"])), new StateParameter(gl, "DEPTH_RANGE", false, new UIInfo(UIType.RANGE)), new StateParameter(gl, "DEPTH_TEST", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "DEPTH_WRITEMASK", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "DITHER", true, new UIInfo(UIType.BOOL)), new StateParameter(gl, "ELEMENT_ARRAY_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "FRAGMENT_SHADER_DERIVATIVE_HINT_OES", false, new UIInfo(UIType.ENUM, hintValues)), new StateParameter(gl, "FRAMEBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "FRONT_FACE", false, new UIInfo(UIType.ENUM, ["CW", "CCW"])), new StateParameter(gl, "GENERATE_MIPMAP_HINT", false, new UIInfo(UIType.ENUM, hintValues)), new StateParameter(gl, "GREEN_BITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "LINE_WIDTH", false, new UIInfo(UIType.FLOAT)), new StateParameter(gl, "MAX_COMBINED_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_CUBE_MAP_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_FRAGMENT_UNIFORM_VECTORS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_RENDERBUFFER_SIZE", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_TEXTURE_MAX_ANISOTROPY_EXT", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VARYING_VECTORS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VERTEX_ATTRIBS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VERTEX_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VERTEX_UNIFORM_VECTORS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VIEWPORT_DIMS", true, new UIInfo(UIType.WH)), new StateParameter(gl, "PACK_ALIGNMENT", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "POLYGON_OFFSET_FACTOR", false, new UIInfo(UIType.FLOAT)), new StateParameter(gl, "POLYGON_OFFSET_FILL", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "POLYGON_OFFSET_UNITS", false, new UIInfo(UIType.FLOAT)), new StateParameter(gl, "RED_BITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "RENDERBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "RENDERER", true, new UIInfo(UIType.STRING)), new StateParameter(gl, "SAMPLE_BUFFERS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "SAMPLE_COVERAGE_INVERT", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "SAMPLE_COVERAGE_VALUE", false, new UIInfo(UIType.FLOAT)), new StateParameter(gl, "SAMPLES", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "SCISSOR_BOX", false, new UIInfo(UIType.RECT)), new StateParameter(gl, "SCISSOR_TEST", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "SHADING_LANGUAGE_VERSION", true, new UIInfo(UIType.STRING)), new StateParameter(gl, "STENCIL_BACK_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new StateParameter(gl, "STENCIL_BACK_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])), new StateParameter(gl, "STENCIL_BACK_PASS_DEPTH_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new StateParameter(gl, "STENCIL_BACK_PASS_DEPTH_PASS", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new StateParameter(gl, "STENCIL_BACK_REF", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "STENCIL_BACK_VALUE_MASK", false, new UIInfo(UIType.BITMASK)), new StateParameter(gl, "STENCIL_BACK_WRITEMASK", false, new UIInfo(UIType.BITMASK)), new StateParameter(gl, "STENCIL_BITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "STENCIL_CLEAR_VALUE", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "STENCIL_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new StateParameter(gl, "STENCIL_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])), new StateParameter(gl, "STENCIL_PASS_DEPTH_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new StateParameter(gl, "STENCIL_PASS_DEPTH_PASS", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])), new StateParameter(gl, "STENCIL_REF", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "STENCIL_TEST", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "STENCIL_VALUE_MASK", false, new UIInfo(UIType.BITMASK)), new StateParameter(gl, "STENCIL_WRITEMASK", false, new UIInfo(UIType.BITMASK)), new StateParameter(gl, "SUBPIXEL_BITS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "UNPACK_ALIGNMENT", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "UNPACK_COLORSPACE_CONVERSION_WEBGL", false, new UIInfo(UIType.ENUM, ["NONE", "BROWSER_DEFAULT_WEBGL"])), new StateParameter(gl, "UNPACK_FLIP_Y_WEBGL", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "UNPACK_PREMULTIPLY_ALPHA_WEBGL", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "VENDOR", true, new UIInfo(UIType.STRING)), new StateParameter(gl, "VERSION", true, new UIInfo(UIType.STRING)), new StateParameter(gl, "VIEWPORT", false, new UIInfo(UIType.RECT))];

	        if (isWebGL2) {
	            stateParameters.splice.apply(stateParameters, [stateParameters.length, 0].concat([new StateParameter(gl, "COPY_READ_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "COPY_WRITE_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "DRAW_FRAMEBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "FRAGMENT_SHADER_DERIVATIVE_HINT", false, new UIInfo(UIType.ENUM, hintValues)), new StateParameter(gl, "MAX_3D_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_ARRAY_TEXTURE_LAYERS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_CLIENT_WAIT_TIMEOUT_WEBGL", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_COLOR_ATTACHMENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_COMBINED_UNIFORM_BLOCKS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_DRAW_BUFFERS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_ELEMENT_INDEX", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_ELEMENTS_INDICES", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_ELEMENTS_VERTICES", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_FRAGMENT_INPUT_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_FRAGMENT_UNIFORM_BLOCKS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_FRAGMENT_UNIFORM_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_PROGRAM_TEXEL_OFFSET", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_SAMPLES", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_SERVER_WAIT_TIMEOUT", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_TEXTURE_LOD_BIAS", true, new UIInfo(UIType.FLOAT)), new StateParameter(gl, "MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_UNIFORM_BLOCK_SIZE", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_UNIFORM_BUFFER_BINDINGS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VARYING_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VERTEX_OUTPUT_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VERTEX_UNIFORM_BLOCKS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MAX_VERTEX_UNIFORM_COMPONENTS", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "MIN_PROGRAM_TEXEL_OFFSET", true, new UIInfo(UIType.LONG)), new StateParameter(gl, "PACK_ROW_LENGTH", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "PACK_SKIP_PIXELS", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "PACK_SKIP_ROWS", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "PIXEL_PACK_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "PIXEL_UNPACK_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "RASTERIZER_DISCARD", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "READ_BUFFER", false, new UIInfo(UIType.ENUM, readBufferEnums)), new StateParameter(gl, "READ_FRAMEBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "SAMPLE_ALPHA_TO_COVERAGE", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "SAMPLE_COVERAGE", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "SAMPLER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "TEXTURE_BINDING_2D_ARRAY", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "TEXTURE_BINDING_3D", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "TRANSFORM_FEEDBACK_ACTIVE", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "TRANSFORM_FEEDBACK_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "TRANSFORM_FEEDBACK_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "TRANSFORM_FEEDBACK_PAUSED", false, new UIInfo(UIType.BOOL)), new StateParameter(gl, "UNIFORM_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)), new StateParameter(gl, "UNIFORM_BUFFER_OFFSET_ALIGNMENT", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "UNPACK_IMAGE_HEIGHT", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "UNPACK_ROW_LENGTH", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "UNPACK_SKIP_IMAGES", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "UNPACK_SKIP_PIXELS", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "UNPACK_SKIP_ROWS", false, new UIInfo(UIType.LONG)), new StateParameter(gl, "VERTEX_ARRAY_BINDING", false, new UIInfo(UIType.OBJECT))]));
	        }

	        function makeTextureStateParametersForBinding(binding) {
	            for (var n = 0; n < maxTextureUnits; ++n) {
	                var param = new StateParameter(gl, binding + "_" + n, false, new UIInfo(UIType.OBJECT));
	                param.getter = function (n) {
	                    return function (gl) {
	                        var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
	                        gl.activeTexture(gl.TEXTURE0 + n);
	                        var result = gl.getParameter(gl[binding]);
	                        gl.activeTexture(existingBinding);
	                        return result;
	                    };
	                }(n);
	                stateParameters.push(param);
	            }
	        }

	        makeTextureStateParametersForBinding("TEXTURE_BINDING_2D");
	        makeTextureStateParametersForBinding("TEXTURE_BINDING_CUBE_MAP");

	        if (isWebGL2) {
	            makeTextureStateParametersForBinding("TEXTURE_BINDING_2D_ARRAY");
	            makeTextureStateParametersForBinding("TEXTURE_BINDING_3D");

	            // fix: on WebGL1 need if WEBGL_draw_buffers is enabled?
	            var maxDrawBuffers = gl.getParameter(gl.MAX_DRAW_BUFFERS);
	            for (var n = 0; n < maxDrawBuffers; ++n) {
	                stateParameters.push(new StateParameter(gl, "DRAW_BUFFER" + n, false, new UIInfo(UIType.ENUM, drawBuffers)));
	            }
	        }

	        // Build lookup
	        for (var _n = 0; _n < stateParameters.length; _n++) {
	            stateParameters[stateParameters[_n].name] = stateParameters[_n];
	        }

	        info.stateParameters = stateParameters;
	    };

	    function setupEnumMap(gl) {
	        var enumMap = {};
	        for (var n in gl) {
	            enumMap[gl[n]] = n;
	        }

	        info.enumMap = enumMap;
	    };
	    setupEnumMap(glc);

	    info.UIType = UIType;
	    info.FunctionType = FunctionType;
	    //info.functions - deferred
	    //info.stateParameters - deferred

	    info.enumToString = function (n) {
	        var string = info.enumMap[n];
	        if (string !== undefined) {
	            return string;
	        }
	        return "0x" + n.toString(16);
	    };

	    info.initialize = function (gl) {
	        setupFunctionInfos(gl);
	        setupStateParameters(gl);
	    };

	    return info;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  var _glConstants;

	  var glConstants = (_glConstants = {
	    /* ClearBufferMask */
	    DEPTH_BUFFER_BIT: 0x00000100,
	    STENCIL_BUFFER_BIT: 0x00000400,
	    COLOR_BUFFER_BIT: 0x00004000,

	    /* BeginMode */
	    POINTS: 0x0000,
	    LINES: 0x0001,
	    LINE_LOOP: 0x0002,
	    LINE_STRIP: 0x0003,
	    TRIANGLES: 0x0004,
	    TRIANGLE_STRIP: 0x0005,
	    TRIANGLE_FAN: 0x0006,

	    /* AlphaFunction (not supported in ES20) */
	    /*      NEVER */
	    /*      LESS */
	    /*      EQUAL */
	    /*      LEQUAL */
	    /*      GREATER */
	    /*      NOTEQUAL */
	    /*      GEQUAL */
	    /*      ALWAYS */

	    /* BlendingFactorDest */
	    ZERO: 0,
	    ONE: 1,
	    SRC_COLOR: 0x0300,
	    ONE_MINUS_SRC_COLOR: 0x0301,
	    SRC_ALPHA: 0x0302,
	    ONE_MINUS_SRC_ALPHA: 0x0303,
	    DST_ALPHA: 0x0304,
	    ONE_MINUS_DST_ALPHA: 0x0305,

	    /* BlendingFactorSrc */
	    /*      ZERO */
	    /*      ONE */
	    DST_COLOR: 0x0306,
	    ONE_MINUS_DST_COLOR: 0x0307,
	    SRC_ALPHA_SATURATE: 0x0308,
	    /*      SRC_ALPHA */
	    /*      ONE_MINUS_SRC_ALPHA */
	    /*      DST_ALPHA */
	    /*      ONE_MINUS_DST_ALPHA */

	    /* BlendEquationSeparate */
	    FUNC_ADD: 0x8006,
	    BLEND_EQUATION: 0x8009,
	    BLEND_EQUATION_RGB: 0x8009, /* same as BLEND_EQUATION */
	    BLEND_EQUATION_ALPHA: 0x883D,

	    /* BlendSubtract */
	    FUNC_SUBTRACT: 0x800A,
	    FUNC_REVERSE_SUBTRACT: 0x800B,

	    /* Separate Blend Functions */
	    BLEND_DST_RGB: 0x80C8,
	    BLEND_SRC_RGB: 0x80C9,
	    BLEND_DST_ALPHA: 0x80CA,
	    BLEND_SRC_ALPHA: 0x80CB,
	    CONSTANT_COLOR: 0x8001,
	    ONE_MINUS_CONSTANT_COLOR: 0x8002,
	    CONSTANT_ALPHA: 0x8003,
	    ONE_MINUS_CONSTANT_ALPHA: 0x8004,
	    BLEND_COLOR: 0x8005,

	    /* Buffer Objects */
	    ARRAY_BUFFER: 0x8892,
	    ELEMENT_ARRAY_BUFFER: 0x8893,
	    ARRAY_BUFFER_BINDING: 0x8894,
	    ELEMENT_ARRAY_BUFFER_BINDING: 0x8895,

	    STREAM_DRAW: 0x88E0,
	    STATIC_DRAW: 0x88E4,
	    DYNAMIC_DRAW: 0x88E8,

	    BUFFER_SIZE: 0x8764,
	    BUFFER_USAGE: 0x8765,

	    CURRENT_VERTEX_ATTRIB: 0x8626,

	    /* CullFaceMode */
	    FRONT: 0x0404,
	    BACK: 0x0405,
	    FRONT_AND_BACK: 0x0408,

	    /* DepthFunction */
	    /*      NEVER */
	    /*      LESS */
	    /*      EQUAL */
	    /*      LEQUAL */
	    /*      GREATER */
	    /*      NOTEQUAL */
	    /*      GEQUAL */
	    /*      ALWAYS */

	    /* EnableCap */
	    /* TEXTURE_2D */
	    CULL_FACE: 0x0B44,
	    BLEND: 0x0BE2,
	    DITHER: 0x0BD0,
	    STENCIL_TEST: 0x0B90,
	    DEPTH_TEST: 0x0B71,
	    SCISSOR_TEST: 0x0C11,
	    POLYGON_OFFSET_FILL: 0x8037,
	    SAMPLE_ALPHA_TO_COVERAGE: 0x809E,
	    SAMPLE_COVERAGE: 0x80A0,

	    /* ErrorCode */
	    NO_ERROR: 0,
	    INVALID_ENUM: 0x0500,
	    INVALID_VALUE: 0x0501,
	    INVALID_OPERATION: 0x0502,
	    OUT_OF_MEMORY: 0x0505,

	    /* FrontFaceDirection */
	    CW: 0x0900,
	    CCW: 0x0901,

	    /* GetPName */
	    LINE_WIDTH: 0x0B21,
	    ALIASED_POINT_SIZE_RANGE: 0x846D,
	    ALIASED_LINE_WIDTH_RANGE: 0x846E,
	    CULL_FACE_MODE: 0x0B45,
	    FRONT_FACE: 0x0B46,
	    DEPTH_RANGE: 0x0B70,
	    DEPTH_WRITEMASK: 0x0B72,
	    DEPTH_CLEAR_VALUE: 0x0B73,
	    DEPTH_FUNC: 0x0B74,
	    STENCIL_CLEAR_VALUE: 0x0B91,
	    STENCIL_FUNC: 0x0B92,
	    STENCIL_FAIL: 0x0B94,
	    STENCIL_PASS_DEPTH_FAIL: 0x0B95,
	    STENCIL_PASS_DEPTH_PASS: 0x0B96,
	    STENCIL_REF: 0x0B97,
	    STENCIL_VALUE_MASK: 0x0B93,
	    STENCIL_WRITEMASK: 0x0B98,
	    STENCIL_BACK_FUNC: 0x8800,
	    STENCIL_BACK_FAIL: 0x8801,
	    STENCIL_BACK_PASS_DEPTH_FAIL: 0x8802,
	    STENCIL_BACK_PASS_DEPTH_PASS: 0x8803,
	    STENCIL_BACK_REF: 0x8CA3,
	    STENCIL_BACK_VALUE_MASK: 0x8CA4,
	    STENCIL_BACK_WRITEMASK: 0x8CA5,
	    VIEWPORT: 0x0BA2,
	    SCISSOR_BOX: 0x0C10,
	    /*      SCISSOR_TEST */
	    COLOR_CLEAR_VALUE: 0x0C22,
	    COLOR_WRITEMASK: 0x0C23,
	    UNPACK_ALIGNMENT: 0x0CF5,
	    PACK_ALIGNMENT: 0x0D05,
	    MAX_TEXTURE_SIZE: 0x0D33,
	    MAX_VIEWPORT_DIMS: 0x0D3A,
	    SUBPIXEL_BITS: 0x0D50,
	    RED_BITS: 0x0D52,
	    GREEN_BITS: 0x0D53,
	    BLUE_BITS: 0x0D54,
	    ALPHA_BITS: 0x0D55,
	    DEPTH_BITS: 0x0D56,
	    STENCIL_BITS: 0x0D57,
	    POLYGON_OFFSET_UNITS: 0x2A00,
	    /*      POLYGON_OFFSET_FILL */
	    POLYGON_OFFSET_FACTOR: 0x8038,
	    TEXTURE_BINDING_2D: 0x8069,
	    SAMPLE_BUFFERS: 0x80A8,
	    SAMPLES: 0x80A9,
	    SAMPLE_COVERAGE_VALUE: 0x80AA,
	    SAMPLE_COVERAGE_INVERT: 0x80AB,

	    /* GetTextureParameter */
	    /*      TEXTURE_MAG_FILTER */
	    /*      TEXTURE_MIN_FILTER */
	    /*      TEXTURE_WRAP_S */
	    /*      TEXTURE_WRAP_T */

	    COMPRESSED_TEXTURE_FORMATS: 0x86A3,

	    /* HintMode */
	    DONT_CARE: 0x1100,
	    FASTEST: 0x1101,
	    NICEST: 0x1102,

	    /* HintTarget */
	    GENERATE_MIPMAP_HINT: 0x8192,

	    /* DataType */
	    BYTE: 0x1400,
	    UNSIGNED_BYTE: 0x1401,
	    SHORT: 0x1402,
	    UNSIGNED_SHORT: 0x1403,
	    INT: 0x1404,
	    UNSIGNED_INT: 0x1405,
	    FLOAT: 0x1406,

	    /* PixelFormat */
	    DEPTH_COMPONENT: 0x1902,
	    ALPHA: 0x1906,
	    RGB: 0x1907,
	    RGBA: 0x1908,
	    LUMINANCE: 0x1909,
	    LUMINANCE_ALPHA: 0x190A,

	    /* PixelType */
	    /*      UNSIGNED_BYTE */
	    UNSIGNED_SHORT_4_4_4_4: 0x8033,
	    UNSIGNED_SHORT_5_5_5_1: 0x8034,
	    UNSIGNED_SHORT_5_6_5: 0x8363,

	    /* Shaders */
	    FRAGMENT_SHADER: 0x8B30,
	    VERTEX_SHADER: 0x8B31,
	    MAX_VERTEX_ATTRIBS: 0x8869,
	    MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB,
	    MAX_VARYING_VECTORS: 0x8DFC,
	    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
	    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C,
	    MAX_TEXTURE_IMAGE_UNITS: 0x8872,
	    MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFD,
	    SHADER_TYPE: 0x8B4F,
	    DELETE_STATUS: 0x8B80,
	    LINK_STATUS: 0x8B82,
	    VALIDATE_STATUS: 0x8B83,
	    ATTACHED_SHADERS: 0x8B85,
	    ACTIVE_UNIFORMS: 0x8B86,
	    ACTIVE_ATTRIBUTES: 0x8B89,
	    SHADING_LANGUAGE_VERSION: 0x8B8C,
	    CURRENT_PROGRAM: 0x8B8D,

	    /* StencilFunction */
	    NEVER: 0x0200,
	    LESS: 0x0201,
	    EQUAL: 0x0202,
	    LEQUAL: 0x0203,
	    GREATER: 0x0204,
	    NOTEQUAL: 0x0205,
	    GEQUAL: 0x0206,
	    ALWAYS: 0x0207,

	    /* StencilOp */
	    /*      ZERO */
	    KEEP: 0x1E00,
	    REPLACE: 0x1E01,
	    INCR: 0x1E02,
	    DECR: 0x1E03,
	    INVERT: 0x150A,
	    INCR_WRAP: 0x8507,
	    DECR_WRAP: 0x8508,

	    /* StringName */
	    VENDOR: 0x1F00,
	    RENDERER: 0x1F01,
	    VERSION: 0x1F02,

	    /* TextureMagFilter */
	    NEAREST: 0x2600,
	    LINEAR: 0x2601,

	    /* TextureMinFilter */
	    /*      NEAREST */
	    /*      LINEAR */
	    NEAREST_MIPMAP_NEAREST: 0x2700,
	    LINEAR_MIPMAP_NEAREST: 0x2701,
	    NEAREST_MIPMAP_LINEAR: 0x2702,
	    LINEAR_MIPMAP_LINEAR: 0x2703,

	    /* TextureParameterName */
	    TEXTURE_MAG_FILTER: 0x2800,
	    TEXTURE_MIN_FILTER: 0x2801,
	    TEXTURE_WRAP_S: 0x2802,
	    TEXTURE_WRAP_T: 0x2803,

	    /* TextureTarget */
	    TEXTURE_2D: 0x0DE1,
	    TEXTURE: 0x1702,

	    TEXTURE_CUBE_MAP: 0x8513,
	    TEXTURE_BINDING_CUBE_MAP: 0x8514,
	    TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
	    TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
	    TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
	    TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
	    TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
	    TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851A,
	    MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C,

	    /* TextureUnit */
	    TEXTURE0: 0x84C0,
	    TEXTURE1: 0x84C1,
	    TEXTURE2: 0x84C2,
	    TEXTURE3: 0x84C3,
	    TEXTURE4: 0x84C4,
	    TEXTURE5: 0x84C5,
	    TEXTURE6: 0x84C6,
	    TEXTURE7: 0x84C7,
	    TEXTURE8: 0x84C8,
	    TEXTURE9: 0x84C9,
	    TEXTURE10: 0x84CA,
	    TEXTURE11: 0x84CB,
	    TEXTURE12: 0x84CC,
	    TEXTURE13: 0x84CD,
	    TEXTURE14: 0x84CE,
	    TEXTURE15: 0x84CF,
	    TEXTURE16: 0x84D0,
	    TEXTURE17: 0x84D1,
	    TEXTURE18: 0x84D2,
	    TEXTURE19: 0x84D3,
	    TEXTURE20: 0x84D4,
	    TEXTURE21: 0x84D5,
	    TEXTURE22: 0x84D6,
	    TEXTURE23: 0x84D7,
	    TEXTURE24: 0x84D8,
	    TEXTURE25: 0x84D9,
	    TEXTURE26: 0x84DA,
	    TEXTURE27: 0x84DB,
	    TEXTURE28: 0x84DC,
	    TEXTURE29: 0x84DD,
	    TEXTURE30: 0x84DE,
	    TEXTURE31: 0x84DF,
	    ACTIVE_TEXTURE: 0x84E0,

	    /* TextureWrapMode */
	    REPEAT: 0x2901,
	    CLAMP_TO_EDGE: 0x812F,
	    MIRRORED_REPEAT: 0x8370,

	    /* Uniform Types */
	    FLOAT_VEC2: 0x8B50,
	    FLOAT_VEC3: 0x8B51,
	    FLOAT_VEC4: 0x8B52,
	    INT_VEC2: 0x8B53,
	    INT_VEC3: 0x8B54,
	    INT_VEC4: 0x8B55,
	    BOOL: 0x8B56,
	    BOOL_VEC2: 0x8B57,
	    BOOL_VEC3: 0x8B58,
	    BOOL_VEC4: 0x8B59,
	    FLOAT_MAT2: 0x8B5A,
	    FLOAT_MAT3: 0x8B5B,
	    FLOAT_MAT4: 0x8B5C,
	    SAMPLER_2D: 0x8B5E,
	    SAMPLER_CUBE: 0x8B60,

	    /* Vertex Arrays */
	    VERTEX_ATTRIB_ARRAY_ENABLED: 0x8622,
	    VERTEX_ATTRIB_ARRAY_SIZE: 0x8623,
	    VERTEX_ATTRIB_ARRAY_STRIDE: 0x8624,
	    VERTEX_ATTRIB_ARRAY_TYPE: 0x8625,
	    VERTEX_ATTRIB_ARRAY_NORMALIZED: 0x886A,
	    VERTEX_ATTRIB_ARRAY_POINTER: 0x8645,
	    VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 0x889F,

	    /* Shader Source */
	    COMPILE_STATUS: 0x8B81,

	    /* Shader Precision-Specified Types */
	    LOW_FLOAT: 0x8DF0,
	    MEDIUM_FLOAT: 0x8DF1,
	    HIGH_FLOAT: 0x8DF2,
	    LOW_INT: 0x8DF3,
	    MEDIUM_INT: 0x8DF4,
	    HIGH_INT: 0x8DF5,

	    /* Framebuffer Object. */
	    FRAMEBUFFER: 0x8D40,
	    RENDERBUFFER: 0x8D41,

	    RGBA4: 0x8056,
	    RGB5_A1: 0x8057,
	    RGB565: 0x8D62,
	    DEPTH_COMPONENT16: 0x81A5,
	    STENCIL_INDEX: 0x1901,
	    STENCIL_INDEX8: 0x8D48,
	    DEPTH_STENCIL: 0x84F9,

	    RENDERBUFFER_WIDTH: 0x8D42,
	    RENDERBUFFER_HEIGHT: 0x8D43,
	    RENDERBUFFER_INTERNAL_FORMAT: 0x8D44,
	    RENDERBUFFER_RED_SIZE: 0x8D50,
	    RENDERBUFFER_GREEN_SIZE: 0x8D51,
	    RENDERBUFFER_BLUE_SIZE: 0x8D52,
	    RENDERBUFFER_ALPHA_SIZE: 0x8D53,
	    RENDERBUFFER_DEPTH_SIZE: 0x8D54,
	    RENDERBUFFER_STENCIL_SIZE: 0x8D55,

	    FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 0x8CD0,
	    FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 0x8CD1,
	    FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 0x8CD2,
	    FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 0x8CD3,

	    COLOR_ATTACHMENT0: 0x8CE0,
	    DEPTH_ATTACHMENT: 0x8D00,
	    STENCIL_ATTACHMENT: 0x8D20,
	    DEPTH_STENCIL_ATTACHMENT: 0x821A,

	    NONE: 0,

	    FRAMEBUFFER_COMPLETE: 0x8CD5,
	    FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 0x8CD6,
	    FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 0x8CD7,
	    FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 0x8CD9,
	    FRAMEBUFFER_UNSUPPORTED: 0x8CDD,

	    FRAMEBUFFER_BINDING: 0x8CA6,
	    RENDERBUFFER_BINDING: 0x8CA7,
	    MAX_RENDERBUFFER_SIZE: 0x84E8,

	    INVALID_FRAMEBUFFER_OPERATION: 0x0506,

	    /* WebGL-specific enums */
	    UNPACK_FLIP_Y_WEBGL: 0x9240,
	    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
	    CONTEXT_LOST_WEBGL: 0x9242,
	    UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,
	    BROWSER_DEFAULT_WEBGL: 0x9244,

	    READ_BUFFER: 0x0C02,
	    UNPACK_ROW_LENGTH: 0x0CF2,
	    UNPACK_SKIP_ROWS: 0x0CF3,
	    UNPACK_SKIP_PIXELS: 0x0CF4,
	    PACK_ROW_LENGTH: 0x0D02,
	    PACK_SKIP_ROWS: 0x0D03,
	    PACK_SKIP_PIXELS: 0x0D04,
	    COLOR: 0x1800,
	    DEPTH: 0x1801,
	    STENCIL: 0x1802,
	    RED: 0x1903,
	    RGB8: 0x8051,
	    RGBA8: 0x8058,
	    RGB10_A2: 0x8059,
	    TEXTURE_BINDING_3D: 0x806A,
	    UNPACK_SKIP_IMAGES: 0x806D,
	    UNPACK_IMAGE_HEIGHT: 0x806E,
	    TEXTURE_3D: 0x806F,
	    TEXTURE_WRAP_R: 0x8072,
	    MAX_3D_TEXTURE_SIZE: 0x8073,
	    UNSIGNED_INT_2_10_10_10_REV: 0x8368,
	    MAX_ELEMENTS_VERTICES: 0x80E8,
	    MAX_ELEMENTS_INDICES: 0x80E9,
	    TEXTURE_MIN_LOD: 0x813A,
	    TEXTURE_MAX_LOD: 0x813B,
	    TEXTURE_BASE_LEVEL: 0x813C,
	    TEXTURE_MAX_LEVEL: 0x813D,
	    MIN: 0x8007,
	    MAX: 0x8008,
	    DEPTH_COMPONENT24: 0x81A6,
	    MAX_TEXTURE_LOD_BIAS: 0x84FD,
	    TEXTURE_COMPARE_MODE: 0x884C,
	    TEXTURE_COMPARE_FUNC: 0x884D,
	    CURRENT_QUERY: 0x8865,
	    QUERY_RESULT: 0x8866,
	    QUERY_RESULT_AVAILABLE: 0x8867,
	    STREAM_READ: 0x88E1,
	    STREAM_COPY: 0x88E2,
	    STATIC_READ: 0x88E5,
	    STATIC_COPY: 0x88E6,
	    DYNAMIC_READ: 0x88E9,
	    DYNAMIC_COPY: 0x88EA,
	    MAX_DRAW_BUFFERS: 0x8824,
	    DRAW_BUFFER0: 0x8825,
	    DRAW_BUFFER1: 0x8826,
	    DRAW_BUFFER2: 0x8827,
	    DRAW_BUFFER3: 0x8828,
	    DRAW_BUFFER4: 0x8829,
	    DRAW_BUFFER5: 0x882A,
	    DRAW_BUFFER6: 0x882B,
	    DRAW_BUFFER7: 0x882C,
	    DRAW_BUFFER8: 0x882D,
	    DRAW_BUFFER9: 0x882E,
	    DRAW_BUFFER10: 0x882F,
	    DRAW_BUFFER11: 0x8830,
	    DRAW_BUFFER12: 0x8831,
	    DRAW_BUFFER13: 0x8832,
	    DRAW_BUFFER14: 0x8833,
	    DRAW_BUFFER15: 0x8834,
	    MAX_FRAGMENT_UNIFORM_COMPONENTS: 0x8B49,
	    MAX_VERTEX_UNIFORM_COMPONENTS: 0x8B4A,
	    SAMPLER_3D: 0x8B5F,
	    SAMPLER_2D_SHADOW: 0x8B62,
	    FRAGMENT_SHADER_DERIVATIVE_HINT: 0x8B8B,
	    PIXEL_PACK_BUFFER: 0x88EB,
	    PIXEL_UNPACK_BUFFER: 0x88EC,
	    PIXEL_PACK_BUFFER_BINDING: 0x88ED,
	    PIXEL_UNPACK_BUFFER_BINDING: 0x88EF,
	    FLOAT_MAT2x3: 0x8B65,
	    FLOAT_MAT2x4: 0x8B66,
	    FLOAT_MAT3x2: 0x8B67,
	    FLOAT_MAT3x4: 0x8B68,
	    FLOAT_MAT4x2: 0x8B69,
	    FLOAT_MAT4x3: 0x8B6A,
	    SRGB: 0x8C40,
	    SRGB8: 0x8C41,
	    SRGB8_ALPHA8: 0x8C43,
	    COMPARE_REF_TO_TEXTURE: 0x884E,
	    RGBA32F: 0x8814,
	    RGB32F: 0x8815,
	    RGBA16F: 0x881A,
	    RGB16F: 0x881B,
	    VERTEX_ATTRIB_ARRAY_INTEGER: 0x88FD,
	    MAX_ARRAY_TEXTURE_LAYERS: 0x88FF,
	    MIN_PROGRAM_TEXEL_OFFSET: 0x8904,
	    MAX_PROGRAM_TEXEL_OFFSET: 0x8905,
	    MAX_VARYING_COMPONENTS: 0x8B4B,
	    TEXTURE_2D_ARRAY: 0x8C1A,
	    TEXTURE_BINDING_2D_ARRAY: 0x8C1D,
	    R11F_G11F_B10F: 0x8C3A,
	    UNSIGNED_INT_10F_11F_11F_REV: 0x8C3B,
	    RGB9_E5: 0x8C3D,
	    UNSIGNED_INT_5_9_9_9_REV: 0x8C3E,
	    TRANSFORM_FEEDBACK_BUFFER_MODE: 0x8C7F,
	    MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: 0x8C80,
	    TRANSFORM_FEEDBACK_VARYINGS: 0x8C83,
	    TRANSFORM_FEEDBACK_BUFFER_START: 0x8C84,
	    TRANSFORM_FEEDBACK_BUFFER_SIZE: 0x8C85,
	    TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: 0x8C88,
	    RASTERIZER_DISCARD: 0x8C89,
	    MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: 0x8C8A,
	    MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: 0x8C8B,
	    INTERLEAVED_ATTRIBS: 0x8C8C,
	    SEPARATE_ATTRIBS: 0x8C8D,
	    TRANSFORM_FEEDBACK_BUFFER: 0x8C8E,
	    TRANSFORM_FEEDBACK_BUFFER_BINDING: 0x8C8F,
	    RGBA32UI: 0x8D70,
	    RGB32UI: 0x8D71,
	    RGBA16UI: 0x8D76,
	    RGB16UI: 0x8D77,
	    RGBA8UI: 0x8D7C,
	    RGB8UI: 0x8D7D,
	    RGBA32I: 0x8D82,
	    RGB32I: 0x8D83,
	    RGBA16I: 0x8D88,
	    RGB16I: 0x8D89,
	    RGBA8I: 0x8D8E,
	    RGB8I: 0x8D8F,
	    RED_INTEGER: 0x8D94,
	    RGB_INTEGER: 0x8D98,
	    RGBA_INTEGER: 0x8D99,
	    SAMPLER_2D_ARRAY: 0x8DC1,
	    SAMPLER_2D_ARRAY_SHADOW: 0x8DC4,
	    SAMPLER_CUBE_SHADOW: 0x8DC5,
	    UNSIGNED_INT_VEC2: 0x8DC6,
	    UNSIGNED_INT_VEC3: 0x8DC7,
	    UNSIGNED_INT_VEC4: 0x8DC8,
	    INT_SAMPLER_2D: 0x8DCA,
	    INT_SAMPLER_3D: 0x8DCB,
	    INT_SAMPLER_CUBE: 0x8DCC,
	    INT_SAMPLER_2D_ARRAY: 0x8DCF,
	    UNSIGNED_INT_SAMPLER_2D: 0x8DD2,
	    UNSIGNED_INT_SAMPLER_3D: 0x8DD3,
	    UNSIGNED_INT_SAMPLER_CUBE: 0x8DD4,
	    UNSIGNED_INT_SAMPLER_2D_ARRAY: 0x8DD7,
	    DEPTH_COMPONENT32F: 0x8CAC,
	    DEPTH32F_STENCIL8: 0x8CAD,
	    FLOAT_32_UNSIGNED_INT_24_8_REV: 0x8DAD,
	    FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: 0x8210,
	    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: 0x8211,
	    FRAMEBUFFER_ATTACHMENT_RED_SIZE: 0x8212,
	    FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: 0x8213,
	    FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: 0x8214,
	    FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: 0x8215,
	    FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: 0x8216,
	    FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: 0x8217,
	    FRAMEBUFFER_DEFAULT: 0x8218
	  }, _defineProperty(_glConstants, "DEPTH_STENCIL_ATTACHMENT", 0x821A), _defineProperty(_glConstants, "DEPTH_STENCIL", 0x84F9), _defineProperty(_glConstants, "UNSIGNED_INT_24_8", 0x84FA), _defineProperty(_glConstants, "DEPTH24_STENCIL8", 0x88F0), _defineProperty(_glConstants, "UNSIGNED_NORMALIZED", 0x8C17), _defineProperty(_glConstants, "DRAW_FRAMEBUFFER_BINDING", 0x8CA6), _defineProperty(_glConstants, "READ_FRAMEBUFFER", 0x8CA8), _defineProperty(_glConstants, "DRAW_FRAMEBUFFER", 0x8CA9), _defineProperty(_glConstants, "READ_FRAMEBUFFER_BINDING", 0x8CAA), _defineProperty(_glConstants, "RENDERBUFFER_SAMPLES", 0x8CAB), _defineProperty(_glConstants, "FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER", 0x8CD4), _defineProperty(_glConstants, "MAX_COLOR_ATTACHMENTS", 0x8CDF), _defineProperty(_glConstants, "COLOR_ATTACHMENT1", 0x8CE1), _defineProperty(_glConstants, "COLOR_ATTACHMENT2", 0x8CE2), _defineProperty(_glConstants, "COLOR_ATTACHMENT3", 0x8CE3), _defineProperty(_glConstants, "COLOR_ATTACHMENT4", 0x8CE4), _defineProperty(_glConstants, "COLOR_ATTACHMENT5", 0x8CE5), _defineProperty(_glConstants, "COLOR_ATTACHMENT6", 0x8CE6), _defineProperty(_glConstants, "COLOR_ATTACHMENT7", 0x8CE7), _defineProperty(_glConstants, "COLOR_ATTACHMENT8", 0x8CE8), _defineProperty(_glConstants, "COLOR_ATTACHMENT9", 0x8CE9), _defineProperty(_glConstants, "COLOR_ATTACHMENT10", 0x8CEA), _defineProperty(_glConstants, "COLOR_ATTACHMENT11", 0x8CEB), _defineProperty(_glConstants, "COLOR_ATTACHMENT12", 0x8CEC), _defineProperty(_glConstants, "COLOR_ATTACHMENT13", 0x8CED), _defineProperty(_glConstants, "COLOR_ATTACHMENT14", 0x8CEE), _defineProperty(_glConstants, "COLOR_ATTACHMENT15", 0x8CEF), _defineProperty(_glConstants, "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE", 0x8D56), _defineProperty(_glConstants, "MAX_SAMPLES", 0x8D57), _defineProperty(_glConstants, "HALF_FLOAT", 0x140B), _defineProperty(_glConstants, "RG", 0x8227), _defineProperty(_glConstants, "RG_INTEGER", 0x8228), _defineProperty(_glConstants, "R8", 0x8229), _defineProperty(_glConstants, "RG8", 0x822B), _defineProperty(_glConstants, "R16F", 0x822D), _defineProperty(_glConstants, "R32F", 0x822E), _defineProperty(_glConstants, "RG16F", 0x822F), _defineProperty(_glConstants, "RG32F", 0x8230), _defineProperty(_glConstants, "R8I", 0x8231), _defineProperty(_glConstants, "R8UI", 0x8232), _defineProperty(_glConstants, "R16I", 0x8233), _defineProperty(_glConstants, "R16UI", 0x8234), _defineProperty(_glConstants, "R32I", 0x8235), _defineProperty(_glConstants, "R32UI", 0x8236), _defineProperty(_glConstants, "RG8I", 0x8237), _defineProperty(_glConstants, "RG8UI", 0x8238), _defineProperty(_glConstants, "RG16I", 0x8239), _defineProperty(_glConstants, "RG16UI", 0x823A), _defineProperty(_glConstants, "RG32I", 0x823B), _defineProperty(_glConstants, "RG32UI", 0x823C), _defineProperty(_glConstants, "VERTEX_ARRAY_BINDING", 0x85B5), _defineProperty(_glConstants, "R8_SNORM", 0x8F94), _defineProperty(_glConstants, "RG8_SNORM", 0x8F95), _defineProperty(_glConstants, "RGB8_SNORM", 0x8F96), _defineProperty(_glConstants, "RGBA8_SNORM", 0x8F97), _defineProperty(_glConstants, "SIGNED_NORMALIZED", 0x8F9C), _defineProperty(_glConstants, "COPY_READ_BUFFER", 0x8F36), _defineProperty(_glConstants, "COPY_WRITE_BUFFER", 0x8F37), _defineProperty(_glConstants, "COPY_READ_BUFFER_BINDING", 0x8F36), _defineProperty(_glConstants, "COPY_WRITE_BUFFER_BINDING", 0x8F37), _defineProperty(_glConstants, "UNIFORM_BUFFER", 0x8A11), _defineProperty(_glConstants, "UNIFORM_BUFFER_BINDING", 0x8A28), _defineProperty(_glConstants, "UNIFORM_BUFFER_START", 0x8A29), _defineProperty(_glConstants, "UNIFORM_BUFFER_SIZE", 0x8A2A), _defineProperty(_glConstants, "MAX_VERTEX_UNIFORM_BLOCKS", 0x8A2B), _defineProperty(_glConstants, "MAX_FRAGMENT_UNIFORM_BLOCKS", 0x8A2D), _defineProperty(_glConstants, "MAX_COMBINED_UNIFORM_BLOCKS", 0x8A2E), _defineProperty(_glConstants, "MAX_UNIFORM_BUFFER_BINDINGS", 0x8A2F), _defineProperty(_glConstants, "MAX_UNIFORM_BLOCK_SIZE", 0x8A30), _defineProperty(_glConstants, "MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS", 0x8A31), _defineProperty(_glConstants, "MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS", 0x8A33), _defineProperty(_glConstants, "UNIFORM_BUFFER_OFFSET_ALIGNMENT", 0x8A34), _defineProperty(_glConstants, "ACTIVE_UNIFORM_BLOCKS", 0x8A36), _defineProperty(_glConstants, "UNIFORM_TYPE", 0x8A37), _defineProperty(_glConstants, "UNIFORM_SIZE", 0x8A38), _defineProperty(_glConstants, "UNIFORM_BLOCK_INDEX", 0x8A3A), _defineProperty(_glConstants, "UNIFORM_OFFSET", 0x8A3B), _defineProperty(_glConstants, "UNIFORM_ARRAY_STRIDE", 0x8A3C), _defineProperty(_glConstants, "UNIFORM_MATRIX_STRIDE", 0x8A3D), _defineProperty(_glConstants, "UNIFORM_IS_ROW_MAJOR", 0x8A3E), _defineProperty(_glConstants, "UNIFORM_BLOCK_BINDING", 0x8A3F), _defineProperty(_glConstants, "UNIFORM_BLOCK_DATA_SIZE", 0x8A40), _defineProperty(_glConstants, "UNIFORM_BLOCK_ACTIVE_UNIFORMS", 0x8A42), _defineProperty(_glConstants, "UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES", 0x8A43), _defineProperty(_glConstants, "UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER", 0x8A44), _defineProperty(_glConstants, "UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER", 0x8A46), _defineProperty(_glConstants, "INVALID_INDEX", 0xFFFFFFFF), _defineProperty(_glConstants, "MAX_VERTEX_OUTPUT_COMPONENTS", 0x9122), _defineProperty(_glConstants, "MAX_FRAGMENT_INPUT_COMPONENTS", 0x9125), _defineProperty(_glConstants, "MAX_SERVER_WAIT_TIMEOUT", 0x9111), _defineProperty(_glConstants, "OBJECT_TYPE", 0x9112), _defineProperty(_glConstants, "SYNC_CONDITION", 0x9113), _defineProperty(_glConstants, "SYNC_STATUS", 0x9114), _defineProperty(_glConstants, "SYNC_FLAGS", 0x9115), _defineProperty(_glConstants, "SYNC_FENCE", 0x9116), _defineProperty(_glConstants, "SYNC_GPU_COMMANDS_COMPLETE", 0x9117), _defineProperty(_glConstants, "UNSIGNALED", 0x9118), _defineProperty(_glConstants, "SIGNALED", 0x9119), _defineProperty(_glConstants, "ALREADY_SIGNALED", 0x911A), _defineProperty(_glConstants, "TIMEOUT_EXPIRED", 0x911B), _defineProperty(_glConstants, "CONDITION_SATISFIED", 0x911C), _defineProperty(_glConstants, "WAIT_FAILED", 0x911D), _defineProperty(_glConstants, "SYNC_FLUSH_COMMANDS_BIT", 0x00000001), _defineProperty(_glConstants, "VERTEX_ATTRIB_ARRAY_DIVISOR", 0x88FE), _defineProperty(_glConstants, "ANY_SAMPLES_PASSED", 0x8C2F), _defineProperty(_glConstants, "ANY_SAMPLES_PASSED_CONSERVATIVE", 0x8D6A), _defineProperty(_glConstants, "SAMPLER_BINDING", 0x8919), _defineProperty(_glConstants, "RGB10_A2UI", 0x906F), _defineProperty(_glConstants, "INT_2_10_10_10_REV", 0x8D9F), _defineProperty(_glConstants, "TRANSFORM_FEEDBACK", 0x8E22), _defineProperty(_glConstants, "TRANSFORM_FEEDBACK_PAUSED", 0x8E23), _defineProperty(_glConstants, "TRANSFORM_FEEDBACK_ACTIVE", 0x8E24), _defineProperty(_glConstants, "TRANSFORM_FEEDBACK_BINDING", 0x8E25), _defineProperty(_glConstants, "TEXTURE_IMMUTABLE_FORMAT", 0x912F), _defineProperty(_glConstants, "MAX_ELEMENT_INDEX", 0x8D6B), _defineProperty(_glConstants, "TEXTURE_IMMUTABLE_LEVELS", 0x82DF), _defineProperty(_glConstants, "TIMEOUT_IGNORED", -1), _defineProperty(_glConstants, "MAX_CLIENT_WAIT_TIMEOUT_WEBGL", 0x9247), _defineProperty(_glConstants, "COMPRESSED_RGB_S3TC_DXT1_EXT", 0x83F0), _defineProperty(_glConstants, "COMPRESSED_RGBA_S3TC_DXT1_EXT", 0x83F1), _defineProperty(_glConstants, "COMPRESSED_RGBA_S3TC_DXT3_EXT", 0x83F2), _defineProperty(_glConstants, "COMPRESSED_RGBA_S3TC_DXT5_EXT", 0x83F3), _defineProperty(_glConstants, "COMPRESSED_R11_EAC", 0x9270), _defineProperty(_glConstants, "COMPRESSED_SIGNED_R11_EAC", 0x9271), _defineProperty(_glConstants, "COMPRESSED_RG11_EAC", 0x9272), _defineProperty(_glConstants, "COMPRESSED_SIGNED_RG11_EAC", 0x9273), _defineProperty(_glConstants, "COMPRESSED_RGB8_ETC2", 0x9274), _defineProperty(_glConstants, "COMPRESSED_SRGB8_ETC2", 0x9275), _defineProperty(_glConstants, "COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2", 0x9276), _defineProperty(_glConstants, "COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2", 0x9277), _defineProperty(_glConstants, "COMPRESSED_RGBA8_ETC2_EAC", 0x9278), _defineProperty(_glConstants, "COMPRESSED_SRGB8_ALPHA8_ETC2_EAC", 0x9279), _defineProperty(_glConstants, "COMPRESSED_RGB_ATC_WEBGL", 0x8C92), _defineProperty(_glConstants, "COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL", 0x8C93), _defineProperty(_glConstants, "COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL", 0x87EE), _defineProperty(_glConstants, "COMPRESSED_RGB_PVRTC_4BPPV1_IMG", 0x8C00), _defineProperty(_glConstants, "COMPRESSED_RGB_PVRTC_2BPPV1_IMG", 0x8C01), _defineProperty(_glConstants, "COMPRESSED_RGBA_PVRTC_4BPPV1_IMG", 0x8C02), _defineProperty(_glConstants, "COMPRESSED_RGBA_PVRTC_2BPPV1_IMG", 0x8C03), _glConstants);

	  return glConstants;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	// Hack to always define a console
	if (!window["console"]) {
	    window.console = { log: function log() {} };
	}

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(4), __webpack_require__(6)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, extensions, hacks) {

	    var util = {};

	    util.setWebGLVersion = function (gl) {
	        util.useWebGL2 = util.isWebGL2(gl);
	    };

	    util.getWebGLContext = function (canvas, baseAttrs, attrs) {
	        var finalAttrs = {
	            preserveDrawingBuffer: true
	        };

	        // baseAttrs are all required and attrs are ORed in
	        if (baseAttrs) {
	            for (var k in baseAttrs) {
	                finalAttrs[k] = baseAttrs[k];
	            }
	        }
	        if (attrs) {
	            for (var k in attrs) {
	                if (finalAttrs[k] === undefined) {
	                    finalAttrs[k] = attrs[k];
	                } else {
	                    finalAttrs[k] |= attrs[k];
	                }
	            }
	        }

	        function getContext(contextName) {
	            var gl = null;
	            try {
	                if (canvas.getContextRaw) {
	                    gl = canvas.getContextRaw(contextName, finalAttrs);
	                } else {
	                    gl = canvas.getContext(contextName, finalAttrs);
	                }
	            } catch (e) {}
	            return gl;
	        }

	        // WebGL2 should **mostly** be compatible with webgl. At least at the start
	        // Otherwise we need to some how know what kind of context we need (1 or 2)
	        var gl = void 0;
	        if (util.useWebGL2) {
	            gl = getContext("webgl2");
	        } else {
	            gl = getContext("webgl") || getContext("experimental-webgl");
	        }
	        if (!gl) {
	            // ?
	            alert("Unable to get WebGL context: " + e);
	        }

	        if (gl) {
	            extensions.enableAllExtensions(gl);
	            hacks.installAll(gl);
	        }

	        return gl;
	    };

	    // Adjust TypedArray types to have consistent toString methods
	    var typedArrayToString = function typedArrayToString() {
	        var s = "";
	        var maxIndex = Math.min(64, this.length);
	        for (var n = 0; n < maxIndex; n++) {
	            s += this[n];
	            if (n < this.length - 1) {
	                s += ",";
	            }
	        }
	        if (maxIndex < this.length) {
	            s += ",... (" + this.length + " total)";
	        }
	        return s;
	    };
	    Int8Array.prototype.toString = typedArrayToString;
	    Uint8Array.prototype.toString = typedArrayToString;
	    Int16Array.prototype.toString = typedArrayToString;
	    Uint16Array.prototype.toString = typedArrayToString;
	    Int32Array.prototype.toString = typedArrayToString;
	    Uint32Array.prototype.toString = typedArrayToString;
	    Float32Array.prototype.toString = typedArrayToString;

	    util.typedArrayToString = function (array) {
	        if (array) {
	            return typedArrayToString.apply(array);
	        } else {
	            return "(null)";
	        }
	    };

	    util.isTypedArray = function (value) {
	        if (value) {
	            var typename = base.typename(value);
	            switch (typename) {
	                case "Int8Array":
	                case "Uint8Array":
	                case "Int16Array":
	                case "Uint16Array":
	                case "Int32Array":
	                case "Uint32Array":
	                case "Float32Array":
	                    return true;
	            }
	            return false;
	        } else {
	            return false;
	        }
	    };

	    util.arrayCompare = function (a, b) {
	        if (a && b && a.length == b.length) {
	            for (var n = 0; n < a.length; n++) {
	                if (a[n] !== b[n]) {
	                    return false;
	                }
	            }
	            return true;
	        } else {
	            return false;
	        }
	    };

	    util.isWebGL2 = function (gl) {
	        //return gl.getParameter(gl.VERSION).substring(0, 9) === "WebGL 2.0";
	        return gl.texStorage2D !== undefined;
	    };

	    util.isWebGLResource = function (value) {
	        if (value) {
	            var typename = base.typename(value);
	            switch (typename) {
	                case "WebGLBuffer":
	                case "WebGLFramebuffer":
	                case "WebGLProgram":
	                case "WebGLRenderbuffer":
	                case "WebGLShader":
	                case "WebGLTexture":
	                case "WebGLQuery":
	                case "WebGLSampler":
	                case "WebGLSync":
	                case "WebGLTransformFeedback":
	                case "WebGLVertexArrayObject":
	                    return true;
	            }
	            return false;
	        } else {
	            return false;
	        }
	    };

	    function prepareDocumentElement(el) {
	        // FF requires all content be in a document before it'll accept it for playback
	        if (window.navigator.product == "Gecko") {
	            var frag = document.createDocumentFragment();
	            frag.appendChild(el);
	        }
	    };

	    util.clone = function (arg) {
	        if (arg) {
	            if (arg.constructor == Number || arg.constructor == String) {
	                // Fast path for immutables
	                return arg;
	            } else if (arg.constructor == Array) {
	                return arg.slice(); // ghetto clone
	            } else if (arg instanceof ArrayBuffer) {
	                // There may be a better way to do this, but I don't know it
	                var target = new ArrayBuffer(arg.byteLength);
	                var sourceView = new DataView(arg, 0, arg.byteLength);
	                var targetView = new DataView(target, 0, arg.byteLength);
	                for (var n = 0; n < arg.byteLength; n++) {
	                    targetView.setUint8(n, sourceView.getUint8(n));
	                }
	                return target;
	            } else if (util.isTypedArray(arg)) {
	                //} else if (arg instanceof ArrayBufferView) {
	                // HACK: at least Chromium doesn't have ArrayBufferView as a known type (for some reason)
	                var target = null;
	                if (arg instanceof Int8Array) {
	                    target = new Int8Array(arg);
	                } else if (arg instanceof Uint8Array) {
	                    target = new Uint8Array(arg);
	                } else if (arg instanceof Int16Array) {
	                    target = new Int16Array(arg);
	                } else if (arg instanceof Uint16Array) {
	                    target = new Uint16Array(arg);
	                } else if (arg instanceof Int32Array) {
	                    target = new Int32Array(arg);
	                } else if (arg instanceof Uint32Array) {
	                    target = new Uint32Array(arg);
	                } else if (arg instanceof Float32Array) {
	                    target = new Float32Array(arg);
	                } else {
	                    target = arg;
	                }
	                return target;
	            } else if (base.typename(arg) == "ImageData") {
	                var dummyCanvas = document.createElement("canvas");
	                var dummyContext = dummyCanvas.getContext("2d");
	                var target = dummyContext.createImageData(arg);
	                for (var n = 0; n < arg.data.length; n++) {
	                    target.data[n] = arg.data[n];
	                }
	                return target;
	            } else if (arg instanceof HTMLCanvasElement) {
	                // TODO: better way of doing this?
	                var target = arg.cloneNode(true);
	                var ctx = target.getContext("2d");
	                ctx.drawImage(arg, 0, 0);
	                prepareDocumentElement(target);
	                return target;
	            } else if (arg instanceof HTMLImageElement) {
	                // TODO: clone image data (src?)
	                var target = arg.cloneNode(true);
	                target.width = arg.width;
	                target.height = arg.height;
	                prepareDocumentElement(target);
	                return target;
	            } else if (arg instanceof HTMLVideoElement) {
	                // TODO: clone video data (is this even possible? we want the exact frame at the time of upload - maybe preserve seek time?)
	                var target = arg.cloneNode(true);
	                prepareDocumentElement(target);
	                return target;
	            } else {
	                return arg;
	            }
	        } else {
	            return arg;
	        }
	    };

	    return util;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	    var Settings = function Settings() {
	        this.global = {
	            captureOn: [],
	            showHud: false,
	            popupHud: false,
	            enableTimeline: true
	        };

	        this.session = {
	            showRedundantCalls: true,
	            showDepthDiscarded: true,
	            enableTimeline: false,
	            hudVisible: false,
	            hudHeight: 275,
	            hudPopupWidth: 1200,
	            hudPopupHeight: 500,
	            traceSplitter: 400,
	            textureSplitter: 240,
	            counterToggles: {}
	        };

	        this.load();
	    };

	    Settings.prototype.setGlobals = function (globals) {
	        for (var n in globals) {
	            this.global[n] = globals[n];
	        }
	    };

	    Settings.prototype.load = function () {
	        var sessionString = localStorage["__gli"];
	        if (sessionString) {
	            var sessionObj = JSON.parse(sessionString);
	            for (var n in sessionObj) {
	                this.session[n] = sessionObj[n];
	            }
	        }
	    };
	    Settings.prototype.save = function () {
	        localStorage["__gli"] = JSON.stringify(this.session);
	    };

	    return new Settings();
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(8), __webpack_require__(9), __webpack_require__(12)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, glc, util, StateSnapshot) {

	    var CallType = {
	        MARK: 0,
	        GL: 1
	    };

	    var Call = function Call(ordinal, type, name, sourceArgs, frame) {
	        this.ordinal = ordinal;
	        this.time = new Date().getTime();

	        this.type = type;
	        this.name = name;
	        this.stack = null;

	        this.isRedundant = false;

	        // Clone arguments
	        var args = [];
	        for (var n = 0; n < sourceArgs.length; n++) {
	            if (sourceArgs[n] && sourceArgs[n].sourceUniformName) {
	                args[n] = sourceArgs[n]; // TODO: pull out uniform reference
	            } else {
	                args[n] = util.clone(sourceArgs[n]);

	                if (util.isWebGLResource(args[n])) {
	                    var tracked = args[n].trackedObject;
	                    args[n] = tracked;

	                    // TODO: mark resource access based on type
	                    if (true) {
	                        frame.markResourceRead(tracked);
	                    }
	                    if (true) {
	                        frame.markResourceWrite(tracked);
	                    }
	                }
	            }
	        }
	        this.args = args;

	        // Set upon completion
	        this.duration = 0;
	        this.result = null;
	        this.error = null;
	    };

	    Call.prototype.complete = function (result, error, stack) {
	        this.duration = new Date().getTime() - this.time;
	        this.result = result;
	        this.error = error;
	        this.stack = stack;
	    };

	    Call.prototype.transformArgs = function (gl) {
	        var args = [];
	        for (var n = 0; n < this.args.length; n++) {
	            args[n] = this.args[n];

	            if (args[n]) {
	                if (args[n].mirror) {
	                    // Translate from resource -> mirror target
	                    args[n] = args[n].mirror.target;
	                } else if (args[n].sourceUniformName) {
	                    // Get valid uniform location on new context
	                    args[n] = gl.getUniformLocation(args[n].sourceProgram.mirror.target, args[n].sourceUniformName);
	                }
	            }
	        }
	        return args;
	    };

	    Call.prototype.emit = function (gl) {
	        var args = this.transformArgs(gl);

	        //while (gl.getError() != gl.NO_ERROR);

	        // TODO: handle result?
	        try {
	            gl[this.name].apply(gl, args);
	        } catch (e) {
	            console.log("exception during replay of " + this.name + ": " + e);
	        }
	        //console.log("call " + call.name);

	        //var error = gl.getError();
	        //if (error != gl.NO_ERROR) {
	        //    console.log(error);
	        //}
	    };

	    var Frame = function Frame(canvas, rawgl, frameNumber, resourceCache) {
	        var attrs = rawgl.getContextAttributes ? rawgl.getContextAttributes() : {};
	        this.canvasInfo = {
	            width: canvas.width,
	            height: canvas.height,
	            attributes: attrs
	        };

	        this.frameNumber = frameNumber;
	        this.initialState = new StateSnapshot(rawgl);
	        this.screenshot = null;

	        this.hasCheckedRedundancy = false;
	        this.redundantCalls = 0;

	        this.resourcesUsed = [];
	        this.resourcesRead = [];
	        this.resourcesWritten = [];

	        this.calls = [];

	        // Mark all bound resources as read
	        for (var n in this.initialState) {
	            var value = this.initialState[n];
	            if (util.isWebGLResource(value)) {
	                this.markResourceRead(value.trackedObject);
	                // TODO: differentiate between framebuffers (as write) and the reads
	            }
	        }
	        for (var n = 0; n < this.initialState.attribs.length; n++) {
	            var attrib = this.initialState.attribs[n];
	            for (var m in attrib) {
	                var value = attrib[m];
	                if (util.isWebGLResource(value)) {
	                    this.markResourceRead(value.trackedObject);
	                }
	            }
	        }

	        this.resourceVersions = resourceCache.captureVersions();
	        this.captureUniforms(rawgl, resourceCache.getPrograms());
	    };

	    Frame.prototype.captureUniforms = function (rawgl, allPrograms) {
	        // Capture all program uniforms - nasty, but required to get accurate playback when not all uniforms are set each frame
	        this.uniformValues = [];
	        for (var n = 0; n < allPrograms.length; n++) {
	            var program = allPrograms[n];
	            var target = program.target;
	            var values = {};

	            var uniformCount = rawgl.getProgramParameter(target, rawgl.ACTIVE_UNIFORMS);
	            for (var m = 0; m < uniformCount; m++) {
	                var activeInfo = rawgl.getActiveUniform(target, m);
	                if (activeInfo) {
	                    var loc = rawgl.getUniformLocation(target, activeInfo.name);
	                    var value = rawgl.getUniform(target, loc);
	                    values[activeInfo.name] = {
	                        size: activeInfo.size,
	                        type: activeInfo.type,
	                        value: value
	                    };
	                }
	            }

	            this.uniformValues.push({
	                program: program,
	                values: values
	            });
	        }
	    };

	    var uniformInfos = {};
	    uniformInfos[glc.FLOAT] = { funcName: "uniform1f", arrayFuncName: "uniform1fv" };
	    uniformInfos[glc.FLOAT_VEC2] = { funcName: "uniform2f", arrayFuncName: "uniform2fv" };
	    uniformInfos[glc.FLOAT_VEC3] = { funcName: "uniform3f", arrayFuncName: "uniform3fv" };
	    uniformInfos[glc.FLOAT_VEC4] = { funcName: "uniform4f", arrayFuncName: "uniform4fv" };
	    uniformInfos[glc.INT] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.INT_VEC2] = { funcName: "uniform2i", arrayFuncName: "uniform2iv" };
	    uniformInfos[glc.INT_VEC3] = { funcName: "uniform3i", arrayFuncName: "uniform3iv" };
	    uniformInfos[glc.INT_VEC4] = { funcName: "uniform4i", arrayFuncName: "uniform4iv" };
	    uniformInfos[glc.UNSIGNED_INT] = { funcName: "uniform1ui", arrayFuncName: "uniform1uiv" };
	    uniformInfos[glc.UNSIGNED_INT_VEC2] = { funcName: "uniform2ui", arrayFuncName: "uniform2uiv" };
	    uniformInfos[glc.UNSIGNED_INT_VEC3] = { funcName: "uniform3ui", arrayFuncName: "uniform3uiv" };
	    uniformInfos[glc.UNSIGNED_INT_VEC4] = { funcName: "uniform4ui", arrayFuncName: "uniform4uiv" };
	    uniformInfos[glc.BOOL] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.BOOL_VEC2] = { funcName: "uniform2i", arrayFuncName: "uniform2iv" };
	    uniformInfos[glc.BOOL_VEC3] = { funcName: "uniform3i", arrayFuncName: "uniform3iv" };
	    uniformInfos[glc.BOOL_VEC4] = { funcName: "uniform4i", arrayFuncName: "uniform4iv" };
	    uniformInfos[glc.FLOAT_MAT2] = { funcName: "uniformMatrix2fv", arrayFuncName: "uniformMatrix2fv" };
	    uniformInfos[glc.FLOAT_MAT3] = { funcName: "uniformMatrix3fv", arrayFuncName: "uniformMatrix3fv" };
	    uniformInfos[glc.FLOAT_MAT4] = { funcName: "uniformMatrix4fv", arrayFuncName: "uniformMatrix4fv" };
	    uniformInfos[glc.FLOAT_MAT2x3] = { funcName: "uniformMatrix2x3fv", arrayFuncName: "uniformMatrix2x3fv" };
	    uniformInfos[glc.FLOAT_MAT2x4] = { funcName: "uniformMatrix2x4fv", arrayFuncName: "uniformMatrix2x4fv" };
	    uniformInfos[glc.FLOAT_MAT3x2] = { funcName: "uniformMatrix3x2fv", arrayFuncName: "uniformMatrix3x2fv" };
	    uniformInfos[glc.FLOAT_MAT3x4] = { funcName: "uniformMatrix3x4fv", arrayFuncName: "uniformMatrix3x4fv" };
	    uniformInfos[glc.FLOAT_MAT4x2] = { funcName: "uniformMatrix4x2fv", arrayFuncName: "uniformMatrix4x2fv" };
	    uniformInfos[glc.FLOAT_MAT4x3] = { funcName: "uniformMatrix4x3fv", arrayFuncName: "uniformMatrix4x3fv" };
	    uniformInfos[glc.SAMPLER_2D] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.SAMPLER_CUBE] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.SAMPLER_3D] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.SAMPLER_2D_SHADOW] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.SAMPLER_2D_ARRAY] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.SAMPLER_2D_ARRAY_SHADOW] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.SAMPLER_CUBE_SHADOW] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.INT_SAMPLER_2D] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.INT_SAMPLER_3D] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.INT_SAMPLER_CUBE] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.INT_SAMPLER_2D_ARRAY] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.UNSIGNED_INT_SAMPLER_2D] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.UNSIGNED_INT_SAMPLER_3D] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.UNSIGNED_INT_SAMPLER_CUBE] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };
	    uniformInfos[glc.UNSIGNED_INT_SAMPLER_2D_ARRAY] = { funcName: "uniform1i", arrayFuncName: "uniform1iv" };

	    Frame.prototype.applyUniforms = function (gl) {
	        var originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);

	        for (var n = 0; n < this.uniformValues.length; n++) {
	            var program = this.uniformValues[n].program;
	            var values = this.uniformValues[n].values;

	            var target = program.mirror.target;
	            if (!target) {
	                continue;
	            }

	            gl.useProgram(target);

	            for (var name in values) {
	                var data = values[name];
	                var loc = gl.getUniformLocation(target, name);

	                var info = uniformInfos[data.type];
	                var funcName = data.value && data.value.length !== undefined ? info.arrayFuncName : info.funcName;

	                if (funcName.indexOf("Matrix") != -1) {
	                    gl[funcName].apply(gl, [loc, false, data.value]);
	                } else {
	                    gl[funcName].apply(gl, [loc, data.value]);
	                }
	            }
	        }

	        gl.useProgram(originalProgram);
	    };

	    Frame.prototype.end = function (rawgl) {
	        var canvas = rawgl.canvas;

	        // Take a picture! Note, this may fail for many reasons, but seems ok right now
	        this.screenshot = document.createElement("canvas");
	        var frag = document.createDocumentFragment();
	        frag.appendChild(this.screenshot);
	        this.screenshot.width = canvas.width;
	        this.screenshot.height = canvas.height;
	        var ctx2d = this.screenshot.getContext("2d");
	        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
	        ctx2d.drawImage(canvas, 0, 0);
	    };

	    Frame.prototype.mark = function (args) {
	        var call = new Call(this.calls.length, CallType.MARK, "mark", args, this);
	        this.calls.push(call);
	        call.complete(undefined, undefined); // needed?
	        return call;
	    };

	    Frame.prototype.allocateCall = function (name, args) {
	        var call = new Call(this.calls.length, CallType.GL, name, args, this);
	        this.calls.push(call);
	        return call;
	    };

	    Frame.prototype.findResourceVersion = function (resource) {
	        for (var n = 0; n < this.resourceVersions.length; n++) {
	            if (this.resourceVersions[n].resource == resource) {
	                return this.resourceVersions[n].value;
	            }
	        }
	        return null;
	    };

	    Frame.prototype.findResourceUsages = function (resource) {
	        // Quick check to see if we have it marked as being used
	        if (this.resourcesUsed.indexOf(resource) == -1) {
	            // Unused this frame
	            return null;
	        }

	        // Search all call args
	        var usages = [];
	        for (var n = 0; n < this.calls.length; n++) {
	            var call = this.calls[n];
	            for (var m = 0; m < call.args.length; m++) {
	                if (call.args[m] == resource) {
	                    usages.push(call);
	                }
	            }
	        }
	        return usages;
	    };

	    Frame.prototype.markResourceRead = function (resource) {
	        // TODO: faster check (this can affect performance)
	        if (resource) {
	            if (this.resourcesUsed.indexOf(resource) == -1) {
	                this.resourcesUsed.push(resource);
	            }
	            if (this.resourcesRead.indexOf(resource) == -1) {
	                this.resourcesRead.push(resource);
	            }
	            if (resource.getDependentResources) {
	                var dependentResources = resource.getDependentResources();
	                for (var n = 0; n < dependentResources.length; n++) {
	                    this.markResourceRead(dependentResources[n]);
	                }
	            }
	        }
	    };

	    Frame.prototype.markResourceWrite = function (resource) {
	        // TODO: faster check (this can affect performance)
	        if (resource) {
	            if (this.resourcesUsed.indexOf(resource) == -1) {
	                this.resourcesUsed.push(resource);
	            }
	            if (this.resourcesWritten.indexOf(resource) == -1) {
	                this.resourcesWritten.push(resource);
	            }
	            if (resource.getDependentResources) {
	                var dependentResources = resource.getDependentResources();
	                for (var n = 0; n < dependentResources.length; n++) {
	                    this.markResourceWrite(dependentResources[n]);
	                }
	            }
	        }
	    };

	    Frame.prototype.getResourcesUsedOfType = function (typename) {
	        var results = [];
	        for (var n = 0; n < this.resourcesUsed.length; n++) {
	            var resource = this.resourcesUsed[n];
	            if (!resource.target) {
	                continue;
	            }
	            if (typename == base.typename(resource.target)) {
	                results.push(resource);
	            }
	        }
	        return results;
	    };

	    Frame.prototype._lookupResourceVersion = function (resource) {
	        // TODO: faster lookup
	        for (var m = 0; m < this.resourceVersions.length; m++) {
	            if (this.resourceVersions[m].resource.id === resource.id) {
	                return this.resourceVersions[m].value;
	            }
	        }
	        return null;
	    };

	    Frame.prototype.makeActive = function (gl, force, options, exclusions) {
	        options = options || {};
	        exclusions = exclusions || [];

	        // Sort resources by creation order - this ensures that shaders are ready before programs, etc
	        // Since dependencies are fairly straightforward, this *should* be ok
	        // 0 - Buffer
	        // 1 - Texture
	        // 2 - Renderbuffer
	        // 3 - Framebuffer
	        // 4 - Shader
	        // 5 - Program
	        this.resourcesUsed.sort(function (a, b) {
	            return a.creationOrder - b.creationOrder;
	        });

	        for (var n = 0; n < this.resourcesUsed.length; n++) {
	            var resource = this.resourcesUsed[n];
	            if (exclusions.indexOf(resource) != -1) {
	                continue;
	            }

	            var version = this._lookupResourceVersion(resource);
	            if (!version) {
	                continue;
	            }

	            resource.restoreVersion(gl, version, force, options);
	        }

	        this.initialState.apply(gl);
	        this.applyUniforms(gl);
	    };

	    Frame.prototype.cleanup = function (gl) {
	        // Unbind everything
	        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	        gl.useProgram(null);
	        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	        var maxVertexAttrs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	        var dummyBuffer = gl.createBuffer();
	        gl.bindBuffer(gl.ARRAY_BUFFER, dummyBuffer);
	        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(12), gl.STATIC_DRAW);
	        for (var n = 0; n < maxVertexAttrs; n++) {
	            gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
	        }
	        gl.deleteBuffer(dummyBuffer);
	        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	        for (var n = 0; n < maxTextureUnits; n++) {
	            gl.activeTexture(gl.TEXTURE0 + n);
	            gl.bindTexture(gl.TEXTURE_2D, null);
	            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	        }

	        // Dispose all objects
	        for (var n = 0; n < this.resourcesUsed.length; n++) {
	            var resource = this.resourcesUsed[n];
	            resource.disposeMirror();
	        }
	    };

	    Frame.prototype.switchMirrors = function (setName) {
	        for (var n = 0; n < this.resourcesUsed.length; n++) {
	            var resource = this.resourcesUsed[n];
	            resource.switchMirror(setName);
	        }
	    };

	    Frame.prototype.resetAllMirrors = function () {
	        for (var n = 0; n < this.resourcesUsed.length; n++) {
	            var resource = this.resourcesUsed[n];
	            resource.disposeAllMirrors();
	        }
	    };

	    Frame.CallType = CallType;
	    Frame.Call = Call;

	    return Frame;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function (util) {

	    var stateParameters = null;
	    function setupStateParameters(gl) {
	        stateParameters = [{ name: "ACTIVE_TEXTURE" }, { name: "ALIASED_LINE_WIDTH_RANGE" }, { name: "ALIASED_POINT_SIZE_RANGE" }, { name: "ALPHA_BITS" }, { name: "ARRAY_BUFFER_BINDING" }, { name: "BLEND" }, { name: "BLEND_COLOR" }, { name: "BLEND_DST_ALPHA" }, { name: "BLEND_DST_RGB" }, { name: "BLEND_EQUATION_ALPHA" }, { name: "BLEND_EQUATION_RGB" }, { name: "BLEND_SRC_ALPHA" }, { name: "BLEND_SRC_RGB" }, { name: "BLUE_BITS" }, { name: "COLOR_CLEAR_VALUE" }, { name: "COLOR_WRITEMASK" }, { name: "CULL_FACE" }, { name: "CULL_FACE_MODE" }, { name: "CURRENT_PROGRAM" }, { name: "DEPTH_BITS" }, { name: "DEPTH_CLEAR_VALUE" }, { name: "DEPTH_FUNC" }, { name: "DEPTH_RANGE" }, { name: "DEPTH_TEST" }, { name: "DEPTH_WRITEMASK" }, { name: "DITHER" }, { name: "ELEMENT_ARRAY_BUFFER_BINDING" }, { name: "FRAMEBUFFER_BINDING" }, { name: "FRONT_FACE" }, { name: "GENERATE_MIPMAP_HINT" }, { name: "GREEN_BITS" }, { name: "LINE_WIDTH" }, { name: "MAX_COMBINED_TEXTURE_IMAGE_UNITS" }, { name: "MAX_CUBE_MAP_TEXTURE_SIZE" }, { name: "MAX_FRAGMENT_UNIFORM_VECTORS" }, { name: "MAX_RENDERBUFFER_SIZE" }, { name: "MAX_TEXTURE_IMAGE_UNITS" }, { name: "MAX_TEXTURE_SIZE" }, { name: "MAX_VARYING_VECTORS" }, { name: "MAX_VERTEX_ATTRIBS" }, { name: "MAX_VERTEX_TEXTURE_IMAGE_UNITS" }, { name: "MAX_VERTEX_UNIFORM_VECTORS" }, { name: "MAX_VIEWPORT_DIMS" }, { name: "PACK_ALIGNMENT" }, { name: "POLYGON_OFFSET_FACTOR" }, { name: "POLYGON_OFFSET_FILL" }, { name: "POLYGON_OFFSET_UNITS" }, { name: "RED_BITS" }, { name: "RENDERBUFFER_BINDING" }, { name: "RENDERER" }, { name: "SAMPLE_BUFFERS" }, { name: "SAMPLE_COVERAGE_INVERT" }, { name: "SAMPLE_COVERAGE_VALUE" }, { name: "SAMPLES" }, { name: "SCISSOR_BOX" }, { name: "SCISSOR_TEST" }, { name: "SHADING_LANGUAGE_VERSION" }, { name: "STENCIL_BACK_FAIL" }, { name: "STENCIL_BACK_FUNC" }, { name: "STENCIL_BACK_PASS_DEPTH_FAIL" }, { name: "STENCIL_BACK_PASS_DEPTH_PASS" }, { name: "STENCIL_BACK_REF" }, { name: "STENCIL_BACK_VALUE_MASK" }, { name: "STENCIL_BACK_WRITEMASK" }, { name: "STENCIL_BITS" }, { name: "STENCIL_CLEAR_VALUE" }, { name: "STENCIL_FAIL" }, { name: "STENCIL_FUNC" }, { name: "STENCIL_PASS_DEPTH_FAIL" }, { name: "STENCIL_PASS_DEPTH_PASS" }, { name: "STENCIL_REF" }, { name: "STENCIL_TEST" }, { name: "STENCIL_VALUE_MASK" }, { name: "STENCIL_WRITEMASK" }, { name: "SUBPIXEL_BITS" }, { name: "UNPACK_ALIGNMENT" }, { name: "UNPACK_COLORSPACE_CONVERSION_WEBGL" }, { name: "UNPACK_FLIP_Y_WEBGL" }, { name: "UNPACK_PREMULTIPLY_ALPHA_WEBGL" }, { name: "VENDOR" }, { name: "VERSION" }, { name: "VIEWPORT" }];

	        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	        for (var n = 0; n < maxTextureUnits; n++) {
	            var param = { name: "TEXTURE_BINDING_2D_" + n };
	            param.getter = function (n) {
	                return function (gl) {
	                    var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
	                    gl.activeTexture(gl.TEXTURE0 + n);
	                    var result = gl.getParameter(gl.TEXTURE_BINDING_2D);
	                    gl.activeTexture(existingBinding);
	                    return result;
	                };
	            }(n);
	            stateParameters.push(param);
	        }
	        for (var n = 0; n < maxTextureUnits; n++) {
	            var param = { name: "TEXTURE_BINDING_CUBE_MAP_" + n };
	            param.getter = function (n) {
	                return function (gl) {
	                    var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
	                    gl.activeTexture(gl.TEXTURE0 + n);
	                    var result = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
	                    gl.activeTexture(existingBinding);
	                    return result;
	                };
	            }(n);
	            stateParameters.push(param);
	        }

	        // Setup values
	        for (var n = 0; n < stateParameters.length; n++) {
	            var param = stateParameters[n];
	            param.value = gl[param.name];
	        }
	    };

	    function defaultGetParameter(gl, name) {
	        try {
	            return gl.getParameter(gl[name]);
	        } catch (e) {
	            console.log("unable to get state parameter " + name);
	            return null;
	        }
	    };

	    var StateSnapshot = function StateSnapshot(gl) {
	        if (stateParameters == null) {
	            setupStateParameters(gl);
	        }

	        for (var n = 0; n < stateParameters.length; n++) {
	            var param = stateParameters[n];
	            var value = param.getter ? param.getter(gl) : defaultGetParameter(gl, param.name);
	            this[param.value ? param.value : param.name] = value;
	        }

	        this.attribs = [];
	        var attribEnums = [gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING, gl.VERTEX_ATTRIB_ARRAY_ENABLED, gl.VERTEX_ATTRIB_ARRAY_SIZE, gl.VERTEX_ATTRIB_ARRAY_STRIDE, gl.VERTEX_ATTRIB_ARRAY_TYPE, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED, gl.CURRENT_VERTEX_ATTRIB];
	        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	        for (var n = 0; n < maxVertexAttribs; n++) {
	            var values = {};
	            for (var m = 0; m < attribEnums.length; m++) {
	                values[attribEnums[m]] = gl.getVertexAttrib(n, attribEnums[m]);
	                // TODO: replace buffer binding with ref
	            }
	            values[0] = gl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
	            this.attribs.push(values);
	        }
	    };

	    StateSnapshot.prototype.clone = function () {
	        var cloned = {};
	        for (var k in this) {
	            cloned[k] = util.clone(this[k]);
	        }
	        return cloned;
	    };

	    function getTargetValue(value) {
	        if (value) {
	            if (value.trackedObject) {
	                return value.trackedObject.mirror.target;
	            } else {
	                return value;
	            }
	        } else {
	            return null;
	        }
	    };

	    StateSnapshot.prototype.apply = function (gl) {
	        gl.bindFramebuffer(gl.FRAMEBUFFER, getTargetValue(this[gl.FRAMEBUFFER_BINDING]));
	        gl.bindRenderbuffer(gl.RENDERBUFFER, getTargetValue(this[gl.RENDERBUFFER_BINDING]));

	        gl.viewport(this[gl.VIEWPORT][0], this[gl.VIEWPORT][1], this[gl.VIEWPORT][2], this[gl.VIEWPORT][3]);

	        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	        for (var n = 0; n < maxTextureUnits; n++) {
	            gl.activeTexture(gl.TEXTURE0 + n);
	            if (this["TEXTURE_BINDING_2D_" + n]) {
	                gl.bindTexture(gl.TEXTURE_2D, getTargetValue(this["TEXTURE_BINDING_2D_" + n]));
	            }
	            if (this["TEXTURE_BINDING_CUBE_MAP_" + n]) {
	                gl.bindTexture(gl.TEXTURE_CUBE_MAP, getTargetValue(this["TEXTURE_BINDING_CUBE_MAP_" + n]));
	            }
	            if (this["TEXTURE_BINDING_3D_" + n]) {
	                gl.bindTexture(gl.TEXTURE_3D, getTargetValue(this["TEXTURE_BINDING_3D_" + n]));
	            }
	            if (this["TEXTURE_BINDING_2D_ARRAY_" + n]) {
	                gl.bindTexture(gl.TEXTURE_2D_ARRAY, getTargetValue(this["TEXTURE_BINDING_2D_ARRAY_" + n]));
	            }
	        }

	        gl.clearColor(this[gl.COLOR_CLEAR_VALUE][0], this[gl.COLOR_CLEAR_VALUE][1], this[gl.COLOR_CLEAR_VALUE][2], this[gl.COLOR_CLEAR_VALUE][3]);
	        gl.colorMask(this[gl.COLOR_WRITEMASK][0], this[gl.COLOR_WRITEMASK][1], this[gl.COLOR_WRITEMASK][2], this[gl.COLOR_WRITEMASK][3]);

	        if (this[gl.DEPTH_TEST]) {
	            gl.enable(gl.DEPTH_TEST);
	        } else {
	            gl.disable(gl.DEPTH_TEST);
	        }
	        gl.clearDepth(this[gl.DEPTH_CLEAR_VALUE]);
	        gl.depthFunc(this[gl.DEPTH_FUNC]);
	        gl.depthRange(this[gl.DEPTH_RANGE][0], this[gl.DEPTH_RANGE][1]);
	        gl.depthMask(this[gl.DEPTH_WRITEMASK]);

	        if (this[gl.BLEND]) {
	            gl.enable(gl.BLEND);
	        } else {
	            gl.disable(gl.BLEND);
	        }
	        gl.blendColor(this[gl.BLEND_COLOR][0], this[gl.BLEND_COLOR][1], this[gl.BLEND_COLOR][2], this[gl.BLEND_COLOR][3]);
	        gl.blendEquationSeparate(this[gl.BLEND_EQUATION_RGB], this[gl.BLEND_EQUATION_ALPHA]);
	        gl.blendFuncSeparate(this[gl.BLEND_SRC_RGB], this[gl.BLEND_DST_RGB], this[gl.BLEND_SRC_ALPHA], this[gl.BLEND_DST_ALPHA]);

	        //gl.DITHER, // ??????????????????????????????????????????????????????????

	        if (this[gl.CULL_FACE]) {
	            gl.enable(gl.CULL_FACE);
	        } else {
	            gl.disable(gl.CULL_FACE);
	        }
	        gl.cullFace(this[gl.CULL_FACE_MODE]);
	        gl.frontFace(this[gl.FRONT_FACE]);

	        gl.lineWidth(this[gl.LINE_WIDTH]);

	        if (this[gl.POLYGON_OFFSET_FILL]) {
	            gl.enable(gl.POLYGON_OFFSET_FILL);
	        } else {
	            gl.disable(gl.POLYGON_OFFSET_FILL);
	        }
	        gl.polygonOffset(this[gl.POLYGON_OFFSET_FACTOR], this[gl.POLYGON_OFFSET_UNITS]);

	        if (this[gl.SAMPLE_COVERAGE]) {
	            gl.enable(gl.SAMPLE_COVERAGE);
	        } else {
	            gl.disable(gl.SAMPLE_COVERAGE);
	        }
	        if (this[gl.SAMPLE_ALPHA_TO_COVERAGE]) {
	            gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
	        } else {
	            gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
	        }
	        gl.sampleCoverage(this[gl.SAMPLE_COVERAGE_VALUE], this[gl.SAMPLE_COVERAGE_INVERT]);

	        if (this[gl.SCISSOR_TEST]) {
	            gl.enable(gl.SCISSOR_TEST);
	        } else {
	            gl.disable(gl.SCISSOR_TEST);
	        }
	        gl.scissor(this[gl.SCISSOR_BOX][0], this[gl.SCISSOR_BOX][1], this[gl.SCISSOR_BOX][2], this[gl.SCISSOR_BOX][3]);

	        if (this[gl.STENCIL_TEST]) {
	            gl.enable(gl.STENCIL_TEST);
	        } else {
	            gl.disable(gl.STENCIL_TEST);
	        }
	        gl.clearStencil(this[gl.STENCIL_CLEAR_VALUE]);
	        gl.stencilFuncSeparate(gl.FRONT, this[gl.STENCIL_FUNC], this[gl.STENCIL_REF], this[gl.STENCIL_VALUE_MASK]);
	        gl.stencilFuncSeparate(gl.BACK, this[gl.STENCIL_BACK_FUNC], this[gl.STENCIL_BACK_REF], this[gl.STENCIL_BACK_VALUE_MASK]);
	        gl.stencilOpSeparate(gl.FRONT, this[gl.STENCIL_FAIL], this[gl.STENCIL_PASS_DEPTH_FAIL], this[gl.STENCIL_PASS_DEPTH_PASS]);
	        gl.stencilOpSeparate(gl.BACK, this[gl.STENCIL_BACK_FAIL], this[gl.STENCIL_BACK_PASS_DEPTH_FAIL], this[gl.STENCIL_BACK_PASS_DEPTH_PASS]);
	        gl.stencilMaskSeparate(gl.FRONT, this[gl.STENCIL_WRITEMASK]);
	        gl.stencilMaskSeparate(gl.BACK, this[gl.STENCIL_BACK_WRITEMASK]);

	        gl.hint(gl.GENERATE_MIPMAP_HINT, this[gl.GENERATE_MIPMAP_HINT]);

	        gl.pixelStorei(gl.PACK_ALIGNMENT, this[gl.PACK_ALIGNMENT]);
	        gl.pixelStorei(gl.UNPACK_ALIGNMENT, this[gl.UNPACK_ALIGNMENT]);
	        //gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this[gl.UNPACK_COLORSPACE_CONVERSION_WEBGL]); ////////////////////// NOT YET SUPPORTED IN SOME BROWSERS
	        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this[gl.UNPACK_FLIP_Y_WEBGL]);
	        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this[gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL]);

	        var program = getTargetValue(this[gl.CURRENT_PROGRAM]);
	        // HACK: if not linked, try linking
	        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	            gl.linkProgram(program);
	        }
	        gl.useProgram(program);

	        for (var n = 0; n < this.attribs.length; n++) {
	            var values = this.attribs[n];
	            if (values[gl.VERTEX_ATTRIB_ARRAY_ENABLED]) {
	                gl.enableVertexAttribArray(n);
	            } else {
	                gl.disableVertexAttribArray(n);
	            }
	            if (values[gl.CURRENT_VERTEX_ATTRIB]) {
	                gl.vertexAttrib4fv(n, values[gl.CURRENT_VERTEX_ATTRIB]);
	            }
	            var buffer = getTargetValue(values[gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING]);
	            if (buffer) {
	                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	                gl.vertexAttribPointer(n, values[gl.VERTEX_ATTRIB_ARRAY_SIZE], values[gl.VERTEX_ATTRIB_ARRAY_TYPE], values[gl.VERTEX_ATTRIB_ARRAY_NORMALIZED], values[gl.VERTEX_ATTRIB_ARRAY_STRIDE], values[0]);
	            }
	        }

	        gl.bindBuffer(gl.ARRAY_BUFFER, getTargetValue(this[gl.ARRAY_BUFFER_BINDING]));
	        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, getTargetValue(this[gl.ELEMENT_ARRAY_BUFFER_BINDING]));

	        gl.activeTexture(this[gl.ACTIVE_TEXTURE]);
	    };

	    return StateSnapshot;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	    var Notifier = function Notifier(captureContext) {
	        this.captureContext = captureContext;
	        this.div = document.createElement("div");
	        this.div.style.zIndex = "99999";
	        this.div.style.position = "absolute";
	        this.div.style.left = "5px";
	        this.div.style.top = "5px";
	        this.div.style.webkitTransition = "opacity .5s ease-in-out";
	        this.div.style.opacity = "0";
	        this.div.style.color = "yellow";
	        this.div.style.fontSize = "8pt";
	        this.div.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
	        this.div.style.backgroundColor = "rgba(0,0,0,0.8)";
	        this.div.style.padding = "5px";
	        this.div.style.border = "1px solid yellow";
	        document.body.appendChild(this.div);

	        this.hideTimeout = -1;
	    };

	    Notifier.prototype.postMessage = function (message) {
	        console.log(message);
	        this.div.style.opacity = "1";
	        this.div.textContent = message;

	        var self = this;
	        if (this.hideTimeout >= 0) {
	            this.captureContext.clearTimeout(this.hideTimeout);
	            this.hideTimeout = -1;
	        }
	        this.hideTimeout = this.captureContext.setTimeout(function () {
	            self.div.style.opacity = "0";
	        }, 2000);
	    };

	    return Notifier;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(3), __webpack_require__(5), __webpack_require__(9), __webpack_require__(15), __webpack_require__(18), __webpack_require__(19), __webpack_require__(20), __webpack_require__(21), __webpack_require__(22), __webpack_require__(24), __webpack_require__(25)], __WEBPACK_AMD_DEFINE_RESULT__ = function (printStackTrace, base, EventSource, util, Buffer, Framebuffer, Program, Renderbuffer, Shader, Texture, VertexArray, VertexArrayObjectOES) {

	    var resourceCtors = {
	        Buffer: Buffer,
	        Framebuffer: Framebuffer,
	        Program: Program,
	        Renderbuffer: Renderbuffer,
	        Shader: Shader,
	        Texture: Texture,
	        VertexArray: VertexArray,
	        VertexArrayObjectOES: VertexArrayObjectOES
	    };

	    function setCaptures(cache, context) {
	        var gl = context; //.rawgl;

	        var generateStack;
	        if (context.options.resourceStacks) {
	            generateStack = function generateStack() {
	                // Generate stack trace
	                var stack = printStackTrace();
	                // ignore garbage
	                stack = stack.slice(4);
	                // Fix up our type
	                stack[0] = stack[0].replace("[object Object].", "gl.");
	                return stack;
	            };
	        } else {
	            generateStack = function generateStack() {
	                return null;
	            };
	        }

	        function captureCreateDelete(typeName) {
	            var originalCreate = gl["create" + typeName];
	            gl["create" + typeName] = function () {
	                // Track object count
	                gl.statistics[typeName.toLowerCase() + "Count"].value++;

	                var result = originalCreate.apply(gl, arguments);
	                var tracked = new resourceCtors[typeName](gl, context.frameNumber, generateStack(), result, arguments);
	                if (tracked) {
	                    cache.registerResource(tracked);
	                }
	                return result;
	            };
	            var originalDelete = gl["delete" + typeName];
	            gl["delete" + typeName] = function () {
	                // Track object count
	                // FIXME: This object might already be deleted in which case
	                // we should not decrement the count
	                gl.statistics[typeName.toLowerCase() + "Count"].value--;

	                var tracked = arguments[0] ? arguments[0].trackedObject : null;
	                if (tracked) {
	                    // Track total buffer and texture bytes consumed
	                    if (typeName == "Buffer") {
	                        gl.statistics.bufferBytes.value -= tracked.estimatedSize;
	                    } else if (typeName == "Texture") {
	                        gl.statistics.textureBytes.value -= tracked.estimatedSize;
	                    }

	                    tracked.markDeleted(generateStack());
	                }
	                originalDelete.apply(gl, arguments);
	            };
	        };

	        captureCreateDelete("Buffer");
	        captureCreateDelete("Framebuffer");
	        captureCreateDelete("Program");
	        captureCreateDelete("Renderbuffer");
	        captureCreateDelete("Shader");
	        captureCreateDelete("Texture");

	        var glvao = gl.getExtension("OES_vertex_array_object");
	        if (glvao) {
	            (function () {
	                var originalCreate = glvao.createVertexArrayOES;
	                glvao.createVertexArrayOES = function () {
	                    // Track object count
	                    gl.statistics["vertexArrayObjectCount"].value++;

	                    var result = originalCreate.apply(glvao, arguments);
	                    var tracked = new VertexArrayObjectOES(gl, context.frameNumber, generateStack(), result, arguments);
	                    if (tracked) {
	                        cache.registerResource(tracked);
	                    }
	                    return result;
	                };
	                var originalDelete = glvao.deleteVertexArrayOES;
	                glvao.deleteVertexArrayOES = function () {
	                    // Track object count
	                    // FIXME: This object might already be deleted in which case
	                    // we should not decrement the count
	                    gl.statistics["vertexArrayObjectCount"].value--;

	                    var tracked = arguments[0] ? arguments[0].trackedObject : null;
	                    if (tracked) {
	                        tracked.markDeleted(generateStack());
	                    }
	                    originalDelete.apply(glvao, arguments);
	                };
	            })();
	        }

	        Buffer.setCaptures(gl);
	        Framebuffer.setCaptures(gl);
	        Program.setCaptures(gl);
	        Renderbuffer.setCaptures(gl);
	        Shader.setCaptures(gl);
	        Texture.setCaptures(gl);
	        VertexArrayObjectOES.setCaptures(gl);

	        if (util.isWebGL2(gl)) {
	            //            captureCreateDelete("Query");
	            //            captureCreateDelete("Sampler");
	            //captureCreateDelete("Sync");
	            //            captureCreateDelete("TransformFeedback");
	            captureCreateDelete("VertexArray");

	            //            Query.setCaptures(gl);
	            //            Sampler.setCaptures(gl);
	            //Sync.setCaptures(gl);
	            //            TransformFeedback.setCaptures(gl);
	            VertexArray.setCaptures(gl);
	        }
	    };

	    var ResourceCache = function ResourceCache(context) {
	        this.context = context;

	        this.resources = [];

	        this.resourceRegistered = new EventSource("resourceRegistered");

	        setCaptures(this, context);
	    };

	    ResourceCache.prototype.registerResource = function (resource) {
	        this.resources.push(resource);
	        this.resourceRegistered.fire(resource);
	    };

	    ResourceCache.prototype.captureVersions = function () {
	        var allResources = [];
	        for (var n = 0; n < this.resources.length; n++) {
	            var resource = this.resources[n];
	            allResources.push({
	                resource: resource,
	                value: resource.captureVersion()
	            });
	        }
	        return allResources;
	    };

	    ResourceCache.prototype.getResources = function (name) {
	        var selectedResources = [];
	        for (var n = 0; n < this.resources.length; n++) {
	            var resource = this.resources[n];
	            var typename = base.typename(resource.target);
	            if (typename == name) {
	                selectedResources.push(resource);
	            }
	        }
	        return selectedResources;
	    };

	    ResourceCache.prototype.getResourceById = function (id) {
	        // TODO: fast lookup
	        for (var n = 0; n < this.resources.length; n++) {
	            var resource = this.resources[n];
	            if (resource.id === id) {
	                return resource;
	            }
	        }
	        return null;
	    };

	    ResourceCache.prototype.getTextures = function () {
	        return this.getResources("WebGLTexture");
	    };

	    ResourceCache.prototype.getBuffers = function () {
	        return this.getResources("WebGLBuffer");
	    };

	    ResourceCache.prototype.getPrograms = function () {
	        return this.getResources("WebGLProgram");
	    };

	    return ResourceCache;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(9), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, util, Resource) {

	    var Buffer = function Buffer(gl, frameNumber, stack, target) {
	        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
	        this.creationOrder = 0;

	        this.defaultName = "Buffer " + this.id;

	        this.type = gl.ARRAY_BUFFER; // ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER

	        this.parameters = {};
	        this.parameters[gl.BUFFER_SIZE] = 0;
	        this.parameters[gl.BUFFER_USAGE] = gl.STATIC_DRAW;

	        this.currentVersion.type = this.type;
	        this.currentVersion.structure = null;
	        this.currentVersion.lastDrawState = null;
	        this.currentVersion.setParameters(this.parameters);

	        this.estimatedSize = 0;
	    };

	    Buffer.prototype.refresh = function (gl) {
	        var paramEnums = [gl.BUFFER_SIZE, gl.BUFFER_USAGE];
	        for (var n = 0; n < paramEnums.length; n++) {
	            this.parameters[paramEnums[n]] = gl.getBufferParameter(this.type, paramEnums[n]);
	        }
	    };

	    Buffer.getTracked = function (gl, args) {
	        var bindingEnum;
	        switch (args[0]) {
	            default:
	            case gl.ARRAY_BUFFER:
	                bindingEnum = gl.ARRAY_BUFFER_BINDING;
	                break;
	            case gl.ELEMENT_ARRAY_BUFFER:
	                bindingEnum = gl.ELEMENT_ARRAY_BUFFER_BINDING;
	                break;
	        }
	        var glbuffer = gl.rawgl.getParameter(bindingEnum);
	        if (glbuffer == null) {
	            // Going to fail
	            return null;
	        }
	        return glbuffer.trackedObject;
	    };

	    Buffer.setCaptures = function (gl) {
	        var original_bufferData = gl.bufferData;
	        gl.bufferData = function () {
	            // Track buffer writes
	            var totalBytes = 0;
	            if (arguments[1] && arguments[1].byteLength) {
	                totalBytes = arguments[1].byteLength;
	            } else {
	                totalBytes = arguments[1];
	            }
	            gl.statistics.bufferWrites.value += totalBytes;

	            var tracked = Buffer.getTracked(gl, arguments);
	            tracked.type = arguments[0];

	            // Track total buffer bytes consumed
	            gl.statistics.bufferBytes.value -= tracked.estimatedSize;
	            gl.statistics.bufferBytes.value += totalBytes;
	            tracked.estimatedSize = totalBytes;

	            tracked.markDirty(true);
	            tracked.currentVersion.target = tracked.type;
	            tracked.currentVersion.structure = null;
	            tracked.currentVersion.lastDrawState = null;
	            tracked.currentVersion.pushCall("bufferData", arguments);
	            var result = original_bufferData.apply(gl, arguments);
	            tracked.refresh(gl.rawgl);
	            tracked.currentVersion.setParameters(tracked.parameters);
	            return result;
	        };

	        var original_bufferSubData = gl.bufferSubData;
	        gl.bufferSubData = function () {
	            // Track buffer writes
	            var totalBytes = 0;
	            if (arguments[2]) {
	                totalBytes = arguments[2].byteLength;
	            }
	            gl.statistics.bufferWrites.value += totalBytes;

	            var tracked = Buffer.getTracked(gl, arguments);
	            tracked.type = arguments[0];
	            tracked.markDirty(false);
	            tracked.currentVersion.target = tracked.type;
	            tracked.currentVersion.structure = null;
	            tracked.currentVersion.lastDrawState = null;
	            tracked.currentVersion.pushCall("bufferSubData", arguments);
	            return original_bufferSubData.apply(gl, arguments);
	        };

	        // This is constant, so fetch once
	        var maxVertexAttribs = gl.rawgl.getParameter(gl.MAX_VERTEX_ATTRIBS);

	        function assignDrawStructure() {
	            var rawgl = gl.rawgl;
	            var mode = arguments[0];

	            var drawState = {
	                mode: mode,
	                elementArrayBuffer: null,
	                elementArrayBufferType: null,
	                first: 0,
	                offset: 0,
	                count: 0
	            };
	            if (arguments.length == 3) {
	                // drawArrays
	                drawState.first = arguments[1];
	                drawState.count = arguments[2];
	            } else {
	                // drawElements
	                var glelementArrayBuffer = rawgl.getParameter(rawgl.ELEMENT_ARRAY_BUFFER_BINDING);
	                drawState.elementArrayBuffer = glelementArrayBuffer ? glelementArrayBuffer.trackedObject : null;
	                drawState.elementArrayBufferType = arguments[2];
	                drawState.offset = arguments[3];
	                drawState.count = arguments[1];
	            }

	            // TODO: cache all draw state so that we don't have to query each time
	            var allDatas = {};
	            var allBuffers = [];
	            for (var n = 0; n < maxVertexAttribs; n++) {
	                if (rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_ENABLED)) {
	                    var glbuffer = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
	                    var buffer = glbuffer.trackedObject;
	                    if (buffer.currentVersion.structure) {
	                        continue;
	                    }

	                    var size = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_SIZE);
	                    var stride = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_STRIDE);
	                    var offset = rawgl.getVertexAttribOffset(n, rawgl.VERTEX_ATTRIB_ARRAY_POINTER);
	                    var type = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_TYPE);
	                    var normalized = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_NORMALIZED);

	                    var datas = allDatas[buffer.id];
	                    if (!datas) {
	                        datas = allDatas[buffer.id] = [];
	                        allBuffers.push(buffer);
	                    }

	                    datas.push({
	                        size: size,
	                        stride: stride,
	                        offset: offset,
	                        type: type,
	                        normalized: normalized
	                    });
	                }
	            }

	            // TODO: build structure
	            for (var n = 0; n < allBuffers.length; n++) {
	                var buffer = allBuffers[n];
	                var datas = allDatas[buffer.id];
	                datas.sort(function (a, b) {
	                    return a.offset - b.offset;
	                });

	                buffer.currentVersion.structure = datas;
	                buffer.currentVersion.lastDrawState = drawState;
	            }
	        };

	        function calculatePrimitiveCount(gl, mode, count) {
	            switch (mode) {
	                case gl.POINTS:
	                    return count;
	                case gl.LINE_STRIP:
	                    return count - 1;
	                case gl.LINE_LOOP:
	                    return count;
	                case gl.LINES:
	                    return count / 2;
	                case gl.TRIANGLE_STRIP:
	                    return count - 2;
	                default:
	                case gl.TRIANGLES:
	                    return count / 3;
	            }
	        };

	        var origin_drawArrays = gl.drawArrays;
	        gl.drawArrays = function () {
	            //void drawArrays(GLenum mode, GLint first, GLsizei count);
	            if (gl.captureFrame) {
	                assignDrawStructure.apply(null, arguments);
	            }

	            // Track draw stats
	            var totalPrimitives = calculatePrimitiveCount(gl, arguments[0], arguments[2]);
	            gl.statistics.drawsPerFrame.value++;
	            gl.statistics.primitivesPerFrame.value += totalPrimitives;

	            return origin_drawArrays.apply(gl, arguments);
	        };

	        var origin_drawElements = gl.drawElements;
	        gl.drawElements = function () {
	            //void drawElements(GLenum mode, GLsizei count, GLenum type, GLsizeiptr offset);
	            if (gl.captureFrame) {
	                assignDrawStructure.apply(null, arguments);
	            }

	            // Track draw stats
	            var totalPrimitives = calculatePrimitiveCount(gl, arguments[0], arguments[1]);
	            gl.statistics.drawsPerFrame.value++;
	            gl.statistics.primitivesPerFrame.value += totalPrimitives;

	            return origin_drawElements.apply(gl, arguments);
	        };
	    };

	    Buffer.prototype.createTarget = function (gl, version, options) {
	        options = options || {};

	        var buffer = gl.createBuffer();
	        gl.bindBuffer(version.target, buffer);

	        // Filter uploads if requested
	        var uploadFilter = null;
	        if (options.ignoreBufferUploads) {
	            uploadFilter = function uploadFilter(call, args) {
	                if (call.name == "bufferData" || call.name == "bufferSubData") {
	                    return false;
	                }
	                return true;
	            };
	        }

	        this.replayCalls(gl, version, buffer, uploadFilter);

	        return buffer;
	    };

	    Buffer.prototype.deleteTarget = function (gl, target) {
	        gl.deleteBuffer(target);
	    };

	    Buffer.prototype.constructVersion = function (gl, version) {
	        // Find the last bufferData call to initialize the data
	        var subDataCalls = [];
	        var data = null;
	        for (var n = version.calls.length - 1; n >= 0; n--) {
	            var call = version.calls[n];
	            if (call.name == "bufferData") {
	                var sourceArray = call.args[1];
	                if (sourceArray.constructor == Number) {
	                    // Size - create an empty array
	                    data = new ArrayBuffer(sourceArray);
	                    break;
	                } else {
	                    // Has to be an ArrayBuffer or ArrayBufferView
	                    data = util.clone(sourceArray);
	                    break;
	                }
	            } else if (call.name == "bufferSubData") {
	                // Queue up for later
	                subDataCalls.unshift(call);
	            }
	        }
	        if (!data) {
	            // No bufferData calls!
	            return [];
	        }

	        // Apply bufferSubData calls
	        for (var n = 0; n < subDataCalls.length; n++) {
	            var call = subDataCalls[n];
	            var offset = call.args[1];
	            var sourceArray = call.args[2];

	            var view;
	            switch (base.typename(sourceArray)) {
	                case "Int8Array":
	                    view = new Int8Array(data, offset);
	                    break;
	                case "Uint8Array":
	                    view = new Uint8Array(data, offset);
	                    break;
	                case "Int16Array":
	                    view = new Int16Array(data, offset);
	                    break;
	                case "Uint16Array":
	                    view = new Uint16Array(data, offset);
	                    break;
	                case "Int32Array":
	                    view = new Int32Array(data, offset);
	                    break;
	                case "Uint32Array":
	                    view = new Uint32Array(data, offset);
	                    break;
	                case "Float32Array":
	                    view = new Float32Array(data, offset);
	                    break;
	            }
	            for (var i = 0; i < sourceArray.length; i++) {
	                view[i] = sourceArray[i];
	            }
	        }

	        return data;
	    };

	    return Buffer;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5), __webpack_require__(17)], __WEBPACK_AMD_DEFINE_RESULT__ = function (EventSource, ResourceVersion) {

	    // Incrmeents with each resource allocated
	    var uniqueId = 0;

	    var Resource = function Resource(gl, frameNumber, stack, target) {
	        this.id = uniqueId++;
	        this.status = Resource.ALIVE;

	        this.defaultName = "res " + this.id;

	        this.target = target;
	        target.trackedObject = this;

	        this.mirror = {
	            gl: null,
	            target: null,
	            version: null
	        };
	        this.mirrorSets = {};
	        this.mirrorSets["default"] = this.mirror;

	        this.creationFrameNumber = frameNumber;
	        this.creationStack = stack;
	        this.deletionStack = null;

	        // previousVersion is the previous version that was captured
	        // currentVersion is the version as it is at the current point in time
	        this.previousVersion = null;
	        this.currentVersion = new ResourceVersion();
	        this.versionNumber = 0;
	        this.dirty = true;

	        this.modified = new EventSource("modified");
	        this.deleted = new EventSource("deleted");
	    };

	    Resource.ALIVE = 0;
	    Resource.DEAD = 1;

	    Resource.prototype.getName = function () {
	        if (this.target.displayName) {
	            return this.target.displayName;
	        } else {
	            return this.defaultName;
	        }
	    };

	    Resource.prototype.setName = function (name, ifNeeded) {
	        if (!ifNeeded && this.target.displayName && this.target.displayName !== name) {
	            this.target.displayName = name;
	            this.modified.fireDeferred(this);
	        }
	    };

	    Resource.prototype.captureVersion = function () {
	        this.dirty = false;
	        return this.currentVersion;
	    };

	    Resource.prototype.markDirty = function (reset) {
	        if (!this.dirty) {
	            this.previousVersion = this.currentVersion;
	            this.currentVersion = reset ? new ResourceVersion() : this.previousVersion.clone();
	            this.versionNumber++;
	            this.currentVersion.versionNumber = this.versionNumber;
	            this.dirty = true;
	            this.cachedPreview = null; // clear a preview if we have one
	            this.modified.fireDeferred(this);
	        } else {
	            if (reset) {
	                this.currentVersion = new ResourceVersion();
	            }
	            this.modified.fireDeferred(this);
	        }
	    };

	    Resource.prototype.markDeleted = function (stack) {
	        this.status = Resource.DEAD;
	        this.deletionStack = stack;

	        // TODO: hang on to object?
	        //this.target = null;

	        this.deleted.fireDeferred(this);
	    };

	    Resource.prototype.restoreVersion = function (gl, version, force, options) {
	        if (force || this.mirror.version != version) {
	            this.disposeMirror();

	            this.mirror.gl = gl;
	            this.mirror.version = version;
	            this.mirror.target = this.createTarget(gl, version, options);
	            this.mirror.target.trackedObject = this;
	        } else {
	            // Already at the current version
	        }
	    };

	    Resource.prototype.switchMirror = function (setName) {
	        setName = setName || "default";
	        var oldMirror = this.mirror;
	        var newMirror = this.mirrorSets[setName];
	        if (oldMirror == newMirror) {
	            return;
	        }
	        if (!newMirror) {
	            newMirror = {
	                gl: null,
	                target: null,
	                version: null
	            };
	            this.mirrorSets[setName] = newMirror;
	        }
	        this.mirror = newMirror;
	    };

	    Resource.prototype.disposeMirror = function () {
	        if (this.mirror.target) {
	            this.deleteTarget(this.mirror.gl, this.mirror.target);
	            this.mirror.gl = null;
	            this.mirror.target = null;
	            this.mirror.version = null;
	        }
	    };

	    Resource.prototype.disposeAllMirrors = function () {
	        for (var setName in this.mirrorSets) {
	            var mirror = this.mirrorSets[setName];
	            if (mirror && mirror.target) {
	                this.deleteTarget(mirror.gl, mirror.target);
	                mirror.gl = null;
	                mirror.target = null;
	                mirror.version = null;
	            }
	        }
	    };

	    Resource.prototype.createTarget = function (gl, version, options) {
	        console.log("unimplemented createTarget");
	        return null;
	    };

	    Resource.prototype.deleteTarget = function (gl, target) {
	        console.log("unimplemented deleteTarget");
	    };

	    Resource.prototype.replayCalls = function (gl, version, target, filter) {
	        for (var n = 0; n < version.calls.length; n++) {
	            var call = version.calls[n];

	            var args = [];
	            for (var m = 0; m < call.args.length; m++) {
	                // TODO: unpack refs?
	                args[m] = call.args[m];
	                if (args[m] == this) {
	                    args[m] = target;
	                } else if (args[m] && args[m].mirror) {
	                    args[m] = args[m].mirror.target;
	                }
	            }

	            if (filter) {
	                if (filter(call, args) == false) {
	                    continue;
	                }
	            }

	            gl[call.name].apply(gl, args);
	        }
	    };

	    return Resource;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(9), __webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function (info, util, Frame) {

	    var ResourceVersion = function ResourceVersion() {
	        this.versionNumber = 0;
	        this.target = null;
	        this.parameters = {};
	        this.calls = [];
	        this.extras = {};
	    };

	    ResourceVersion.prototype.setParameters = function (params) {
	        this.parameters = {};
	        for (var n in params) {
	            this.parameters[n] = params[n];
	        }
	    };

	    ResourceVersion.prototype.setExtraParameters = function (name, params) {
	        this.extras[name] = {};
	        for (var n in params) {
	            this.extras[name][n] = params[n];
	        }
	    };

	    ResourceVersion.prototype.pushCall = function (name, sourceArgs) {
	        var args = [];
	        for (var n = 0; n < sourceArgs.length; n++) {
	            args[n] = util.clone(sourceArgs[n]);

	            if (util.isWebGLResource(args[n])) {
	                var tracked = args[n].trackedObject;
	                args[n] = tracked;
	            }
	        }
	        var call = new Frame.Call(this.calls.length, Frame.CallType.GL, name, args);
	        call.info = info.functions[call.name];
	        call.complete(); // needed?
	        this.calls.push(call);
	    };

	    ResourceVersion.prototype.clone = function () {
	        var clone = new ResourceVersion();
	        clone.target = this.target;
	        clone.setParameters(this.parameters);
	        for (var n = 0; n < this.calls.length; n++) {
	            clone.calls[n] = this.calls[n];
	        }
	        for (var n in this.extras) {
	            clone.setExtraParameters(n, this.extras[n]);
	        }
	        return clone;
	    };

	    return ResourceVersion;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource) {

	    var Framebuffer = function Framebuffer(gl, frameNumber, stack, target) {
	        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
	        this.creationOrder = 3;

	        this.defaultName = "Framebuffer " + this.id;

	        // Track the attachments a framebuffer has (watching framebufferRenderbuffer/etc calls)
	        this.attachments = {};

	        this.parameters = {};
	        // Attachments: COLOR_ATTACHMENT0, DEPTH_ATTACHMENT, STENCIL_ATTACHMENT
	        // These parameters are per-attachment
	        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE] = 0;
	        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME] = 0;
	        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL] = 0;
	        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE] = 0;

	        this.currentVersion.setParameters(this.parameters);
	        this.currentVersion.setExtraParameters("attachments", this.attachments);
	    };

	    Framebuffer.prototype.getDependentResources = function () {
	        var resources = [];
	        for (var n in this.attachments) {
	            var attachment = this.attachments[n];
	            if (resources.indexOf(attachment) == -1) {
	                resources.push(attachment);
	            }
	        }
	        return resources;
	    };

	    Framebuffer.prototype.refresh = function (gl) {
	        // Attachments: COLOR_ATTACHMENT0, DEPTH_ATTACHMENT, STENCIL_ATTACHMENT
	        //var paramEnums = [gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE];
	        //for (var n = 0; n < paramEnums.length; n++) {
	        //    this.parameters[paramEnums[n]] = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, attachment, paramEnums[n]);
	        //}
	    };

	    Framebuffer.getTracked = function (gl, args) {
	        // only FRAMEBUFFER
	        var bindingEnum = gl.FRAMEBUFFER_BINDING;
	        var glframebuffer = gl.getParameter(bindingEnum);
	        if (glframebuffer == null) {
	            // Going to fail
	            return null;
	        }
	        return glframebuffer.trackedObject;
	    };

	    Framebuffer.setCaptures = function (gl) {
	        var original_framebufferRenderbuffer = gl.framebufferRenderbuffer;
	        gl.framebufferRenderbuffer = function () {
	            var tracked = Framebuffer.getTracked(gl, arguments);
	            tracked.markDirty(false);
	            // TODO: remove existing calls for this attachment
	            tracked.currentVersion.pushCall("framebufferRenderbuffer", arguments);

	            // Save attachment
	            tracked.attachments[arguments[1]] = arguments[3] ? arguments[3].trackedObject : null;
	            tracked.currentVersion.setExtraParameters("attachments", tracked.attachments);

	            var result = original_framebufferRenderbuffer.apply(gl, arguments);

	            // HACK: query the parameters now - easier than calculating all of them
	            tracked.refresh(gl);
	            tracked.currentVersion.setParameters(tracked.parameters);

	            return result;
	        };

	        var original_framebufferTexture2D = gl.framebufferTexture2D;
	        gl.framebufferTexture2D = function () {
	            var tracked = Framebuffer.getTracked(gl, arguments);
	            tracked.markDirty(false);
	            // TODO: remove existing calls for this attachment
	            tracked.currentVersion.pushCall("framebufferTexture2D", arguments);

	            // Save attachment
	            tracked.attachments[arguments[1]] = arguments[3] ? arguments[3].trackedObject : null;
	            tracked.currentVersion.setExtraParameters("attachments", tracked.attachments);

	            var result = original_framebufferTexture2D.apply(gl, arguments);

	            // HACK: query the parameters now - easier than calculating all of them
	            tracked.refresh(gl);
	            tracked.currentVersion.setParameters(tracked.parameters);

	            return result;
	        };
	    };

	    Framebuffer.prototype.createTarget = function (gl, version) {
	        var framebuffer = gl.createFramebuffer();
	        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

	        this.replayCalls(gl, version, framebuffer);

	        return framebuffer;
	    };

	    Framebuffer.prototype.deleteTarget = function (gl, target) {
	        gl.deleteFramebuffer(target);
	    };

	    return Framebuffer;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(8), __webpack_require__(9), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, glc, util, Resource) {

	    var Program = function Program(gl, frameNumber, stack, target) {
	        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
	        this.creationOrder = 5;

	        this.defaultName = "Program " + this.id;

	        this.shaders = [];

	        this.parameters = {};
	        this.parameters[gl.DELETE_STATUS] = 0;
	        this.parameters[gl.LINK_STATUS] = 0;
	        this.parameters[gl.VALIDATE_STATUS] = 0;
	        this.parameters[gl.ATTACHED_SHADERS] = 0;
	        this.parameters[gl.ACTIVE_ATTRIBUTES] = 0;
	        this.parameters[gl.ACTIVE_UNIFORMS] = 0;
	        this.infoLog = null;

	        this.uniformInfos = [];
	        this.attribInfos = [];
	        this.attribBindings = {};

	        this.currentVersion.setParameters(this.parameters);
	        this.currentVersion.setExtraParameters("extra", { infoLog: "" });
	        this.currentVersion.setExtraParameters("uniformInfos", this.uniformInfos);
	        this.currentVersion.setExtraParameters("attribInfos", this.attribInfos);
	        this.currentVersion.setExtraParameters("attribBindings", this.attribBindings);
	    };

	    Program.prototype.getDependentResources = function () {
	        return this.shaders;
	    };

	    Program.prototype.getShader = function (type) {
	        for (var n = 0; n < this.shaders.length; n++) {
	            var shader = this.shaders[n];
	            if (shader.type == type) {
	                return shader;
	            }
	        }
	        return null;
	    };

	    Program.prototype.getVertexShader = function (gl) {
	        return this.getShader(gl.VERTEX_SHADER);
	    };

	    Program.prototype.getFragmentShader = function (gl) {
	        return this.getShader(gl.FRAGMENT_SHADER);
	    };

	    var samplerTypes = {};
	    samplerTypes[glc.SAMPLER_2D] = { textureType: glc.TEXTURE_2D, bindingType: glc.TEXTURE_BINDING_2D };
	    samplerTypes[glc.SAMPLER_CUBE] = { textureType: glc.TEXTURE_CUBE_MAP, bindingType: glc.TEXTURE_BINDING_CUBE_MAP };
	    samplerTypes[glc.SAMPLER_3D] = { textureType: glc.TEXTURE_3D, bindingType: glc.TEXTURE_BINDING_3D };
	    samplerTypes[glc.SAMPLER_2D_SHADOW] = { textureType: glc.TEXTURE_2D, bindingType: glc.TEXTURE_BINDING_2D };
	    samplerTypes[glc.SAMPLER_2D_ARRAY] = { textureType: glc.TEXTURE_2D_ARRAY, bindingType: glc.TEXTURE_BINDING_2D_ARRAY };
	    samplerTypes[glc.SAMPLER_2D_ARRAY_SHADOW] = { textureType: glc.TEXTURE_2D_ARRAY, bindingType: glc.TEXTURE_BINDING_2D_ARRAY };
	    samplerTypes[glc.SAMPLER_CUBE_SHADOW] = { textureType: glc.TEXTURE_CUBE_MAP, bindingType: glc.TEXTURE_BINDING_CUBE_MAP };
	    samplerTypes[glc.INT_SAMPLER_2D] = { textureType: glc.TEXTURE_2D, bindingType: glc.TEXTURE_BINDING_2D };
	    samplerTypes[glc.INT_SAMPLER_3D] = { textureType: glc.TEXTURE_3D, bindingType: glc.TEXTURE_BINDING_3D };
	    samplerTypes[glc.INT_SAMPLER_CUBE] = { textureType: glc.TEXTURE_CUBE_MAP, bindingType: glc.TEXTURE_BINDING_CUBE_MAP };
	    samplerTypes[glc.INT_SAMPLER_2D_ARRAY] = { textureType: glc.TEXTURE_2D_ARRAY, bindingType: glc.TEXTURE_BINDING_2D_ARRAY };
	    samplerTypes[glc.UNSIGNED_INT_SAMPLER_2D] = { textureType: glc.TEXTURE_2D, bindingType: glc.TEXTURE_BINDING_2D };
	    samplerTypes[glc.UNSIGNED_INT_SAMPLER_3D] = { textureType: glc.TEXTURE_3D, bindingType: glc.TEXTURE_BINDING_3D };
	    samplerTypes[glc.UNSIGNED_INT_SAMPLER_CUBE] = { textureType: glc.TEXTURE_CUBE_MAP, bindingType: glc.TEXTURE_BINDING_CUBE_MAP };
	    samplerTypes[glc.UNSIGNED_INT_SAMPLER_2D_ARRAY] = { textureType: glc.TEXTURE_2D_ARRAY, bindingType: glc.TEXTURE_BINDING_2D_ARRAY };

	    Program.prototype.getUniformInfos = function (gl, target) {
	        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);

	        var uniformInfos = [];
	        var uniformCount = gl.getProgramParameter(target, gl.ACTIVE_UNIFORMS);
	        for (var n = 0; n < uniformCount; n++) {
	            var activeInfo = gl.getActiveUniform(target, n);
	            if (activeInfo) {
	                var loc = gl.getUniformLocation(target, activeInfo.name);
	                var value = util.clone(gl.getUniform(target, loc));
	                value = value !== null ? value : 0;

	                var textureValue = null;
	                var samplerType = samplerTypes[activeInfo.type];
	                if (samplerType) {
	                    gl.activeTexture(gl.TEXTURE0 + value);
	                    var texture = gl.getParameter(samplerType.bindingType);
	                    textureValue = texture ? texture.trackedObject : null;
	                }

	                uniformInfos[n] = {
	                    index: n,
	                    name: activeInfo.name,
	                    size: activeInfo.size,
	                    type: activeInfo.type,
	                    value: value,
	                    textureValue: textureValue
	                };
	            }
	            if (gl.ignoreErrors) {
	                gl.ignoreErrors();
	            }
	        }

	        gl.activeTexture(originalActiveTexture);
	        return uniformInfos;
	    };

	    Program.prototype.getAttribInfos = function (gl, target) {
	        var attribInfos = [];
	        var remainingAttribs = gl.getProgramParameter(target, gl.ACTIVE_ATTRIBUTES);
	        var maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	        var attribIndex = 0;
	        while (remainingAttribs > 0) {
	            var activeInfo = gl.getActiveAttrib(target, attribIndex);
	            if (activeInfo && activeInfo.type) {
	                remainingAttribs--;
	                var loc = gl.getAttribLocation(target, activeInfo.name);
	                var bufferBinding = gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
	                attribInfos.push({
	                    index: attribIndex,
	                    loc: loc,
	                    name: activeInfo.name,
	                    size: activeInfo.size,
	                    type: activeInfo.type,
	                    state: {
	                        enabled: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_ENABLED),
	                        buffer: bufferBinding ? bufferBinding.trackedObject : null,
	                        size: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_SIZE),
	                        stride: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_STRIDE),
	                        type: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_TYPE),
	                        normalized: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
	                        pointer: gl.getVertexAttribOffset(loc, gl.VERTEX_ATTRIB_ARRAY_POINTER),
	                        value: gl.getVertexAttrib(loc, gl.CURRENT_VERTEX_ATTRIB)
	                    }
	                });
	            }
	            if (gl.ignoreErrors) {
	                gl.ignoreErrors();
	            }
	            attribIndex++;
	            if (attribIndex >= maxAttribs) {
	                break;
	            }
	        }
	        return attribInfos;
	    };

	    Program.prototype.refresh = function (gl) {
	        var paramEnums = [gl.DELETE_STATUS, gl.LINK_STATUS, gl.VALIDATE_STATUS, gl.ATTACHED_SHADERS, gl.ACTIVE_ATTRIBUTES, gl.ACTIVE_UNIFORMS];
	        for (var n = 0; n < paramEnums.length; n++) {
	            this.parameters[paramEnums[n]] = gl.getProgramParameter(this.target, paramEnums[n]);
	        }
	        this.infoLog = gl.getProgramInfoLog(this.target);
	    };

	    Program.setCaptures = function (gl) {
	        var original_attachShader = gl.attachShader;
	        gl.attachShader = function () {
	            if (arguments[0] && arguments[1]) {
	                var tracked = arguments[0].trackedObject;
	                var trackedShader = arguments[1].trackedObject;
	                tracked.shaders.push(trackedShader);
	                tracked.parameters[gl.ATTACHED_SHADERS]++;
	                tracked.markDirty(false);
	                tracked.currentVersion.setParameters(tracked.parameters);
	                tracked.currentVersion.pushCall("attachShader", arguments);
	            }
	            return original_attachShader.apply(gl, arguments);
	        };

	        var original_detachShader = gl.detachShader;
	        gl.detachShader = function () {
	            if (arguments[0] && arguments[1]) {
	                var tracked = arguments[0].trackedObject;
	                var trackedShader = arguments[1].trackedObject;
	                var index = tracked.shaders.indexOf(trackedShader);
	                if (index >= 0) {
	                    tracked.shaders.splice(index, 1);
	                }
	                tracked.parameters[gl.ATTACHED_SHADERS]--;
	                tracked.markDirty(false);
	                tracked.currentVersion.setParameters(tracked.parameters);
	                tracked.currentVersion.pushCall("detachShader", arguments);
	            }
	            return original_detachShader.apply(gl, arguments);
	        };

	        var original_linkProgram = gl.linkProgram;
	        gl.linkProgram = function () {
	            var tracked = arguments[0].trackedObject;
	            var result = original_linkProgram.apply(gl, arguments);

	            // Refresh params
	            tracked.refresh(gl.rawgl);

	            // Grab uniforms
	            tracked.uniformInfos = tracked.getUniformInfos(gl, tracked.target);

	            // Grab attribs
	            tracked.attribInfos = tracked.getAttribInfos(gl, tracked.target);

	            tracked.markDirty(false);
	            tracked.currentVersion.setParameters(tracked.parameters);
	            tracked.currentVersion.pushCall("linkProgram", arguments);
	            tracked.currentVersion.setExtraParameters("extra", { infoLog: tracked.infoLog });
	            tracked.currentVersion.setExtraParameters("uniformInfos", tracked.uniformInfos);
	            tracked.currentVersion.setExtraParameters("attribInfos", tracked.attribInfos);
	            tracked.currentVersion.setExtraParameters("attribBindings", tracked.attribBindings);

	            return result;
	        };

	        var original_bindAttribLocation = gl.bindAttribLocation;
	        gl.bindAttribLocation = function () {
	            var tracked = arguments[0].trackedObject;
	            var index = arguments[1];
	            var name = arguments[2];
	            tracked.attribBindings[index] = name;

	            tracked.markDirty(false);
	            tracked.currentVersion.setParameters(tracked.parameters);
	            tracked.currentVersion.pushCall("bindAttribLocation", arguments);
	            tracked.currentVersion.setExtraParameters("attribBindings", tracked.attribBindings);

	            return original_bindAttribLocation.apply(gl, arguments);
	        };

	        // Cache off uniform name so that we can retrieve it later
	        var original_getUniformLocation = gl.getUniformLocation;
	        gl.getUniformLocation = function () {
	            var result = original_getUniformLocation.apply(gl, arguments);
	            if (result) {
	                var tracked = arguments[0].trackedObject;
	                result.sourceProgram = tracked;
	                result.sourceUniformName = arguments[1];
	            }
	            return result;
	        };
	    };

	    Program.prototype.createTarget = function (gl, version, options) {
	        options = options || {};

	        var program = gl.createProgram();

	        this.replayCalls(gl, version, program);

	        return program;
	    };

	    Program.prototype.deleteTarget = function (gl, target) {
	        gl.deleteProgram(target);
	    };

	    return Program;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource) {

	    var Renderbuffer = function Renderbuffer(gl, frameNumber, stack, target) {
	        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
	        this.creationOrder = 2;

	        this.defaultName = "Renderbuffer " + this.id;

	        this.parameters = {};
	        this.parameters[gl.RENDERBUFFER_WIDTH] = 0;
	        this.parameters[gl.RENDERBUFFER_HEIGHT] = 0;
	        this.parameters[gl.RENDERBUFFER_INTERNAL_FORMAT] = gl.RGBA4;
	        this.parameters[gl.RENDERBUFFER_RED_SIZE] = 0;
	        this.parameters[gl.RENDERBUFFER_GREEN_SIZE] = 0;
	        this.parameters[gl.RENDERBUFFER_BLUE_SIZE] = 0;
	        this.parameters[gl.RENDERBUFFER_ALPHA_SIZE] = 0;
	        this.parameters[gl.RENDERBUFFER_DEPTH_SIZE] = 0;
	        this.parameters[gl.RENDERBUFFER_STENCIL_SIZE] = 0;

	        this.currentVersion.setParameters(this.parameters);
	    };

	    Renderbuffer.prototype.refresh = function (gl) {
	        var paramEnums = [gl.RENDERBUFFER_WIDTH, gl.RENDERBUFFER_HEIGHT, gl.RENDERBUFFER_INTERNAL_FORMAT, gl.RENDERBUFFER_RED_SIZE, gl.RENDERBUFFER_GREEN_SIZE, gl.RENDERBUFFER_BLUE_SIZE, gl.RENDERBUFFER_ALPHA_SIZE, gl.RENDERBUFFER_DEPTH_SIZE, gl.RENDERBUFFER_STENCIL_SIZE];
	        for (var n = 0; n < paramEnums.length; n++) {
	            this.parameters[paramEnums[n]] = gl.getRenderbufferParameter(gl.RENDERBUFFER, paramEnums[n]);
	        }
	    };

	    Renderbuffer.getTracked = function (gl, args) {
	        // only RENDERBUFFER
	        var bindingEnum = gl.RENDERBUFFER_BINDING;
	        var glrenderbuffer = gl.getParameter(bindingEnum);
	        if (glrenderbuffer == null) {
	            // Going to fail
	            return null;
	        }
	        return glrenderbuffer.trackedObject;
	    };

	    Renderbuffer.setCaptures = function (gl) {
	        var original_renderbufferStorage = gl.renderbufferStorage;
	        gl.renderbufferStorage = function () {
	            var tracked = Renderbuffer.getTracked(gl, arguments);
	            tracked.markDirty(true);
	            tracked.currentVersion.pushCall("renderbufferStorage", arguments);

	            var result = original_renderbufferStorage.apply(gl, arguments);

	            // HACK: query the parameters now - easier than calculating all of them
	            tracked.refresh(gl);
	            tracked.currentVersion.setParameters(tracked.parameters);

	            return result;
	        };
	    };

	    Renderbuffer.prototype.createTarget = function (gl, version) {
	        var renderbuffer = gl.createRenderbuffer();
	        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

	        this.replayCalls(gl, version, renderbuffer);

	        return renderbuffer;
	    };

	    Renderbuffer.prototype.deleteTarget = function (gl, target) {
	        gl.deleteRenderbuffer(target);
	    };

	    return Renderbuffer;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource) {

	    var Shader = function Shader(gl, frameNumber, stack, target, args) {
	        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
	        this.creationOrder = 4;

	        this.defaultName = "Shader " + this.id;

	        this.type = args[0]; // VERTEX_SHADER, FRAGMENT_SHADER

	        this.source = null;

	        this.parameters = {};
	        this.parameters[gl.SHADER_TYPE] = this.type;
	        this.parameters[gl.DELETE_STATUS] = 0;
	        this.parameters[gl.COMPILE_STATUS] = 0;
	        this.infoLog = null;

	        this.currentVersion.target = this.type;
	        this.currentVersion.setParameters(this.parameters);
	        this.currentVersion.setExtraParameters("extra", { infoLog: "" });
	    };

	    Shader.prototype.refresh = function (gl) {
	        var paramEnums = [gl.SHADER_TYPE, gl.DELETE_STATUS, gl.COMPILE_STATUS];
	        for (var n = 0; n < paramEnums.length; n++) {
	            this.parameters[paramEnums[n]] = gl.getShaderParameter(this.target, paramEnums[n]);
	        }
	        this.infoLog = gl.getShaderInfoLog(this.target);
	    };

	    Shader.setCaptures = function (gl) {
	        var original_shaderSource = gl.shaderSource;
	        gl.shaderSource = function () {
	            var tracked = arguments[0].trackedObject;
	            tracked.source = arguments[1];
	            tracked.markDirty(true);
	            tracked.currentVersion.target = tracked.type;
	            tracked.currentVersion.setParameters(tracked.parameters);
	            tracked.currentVersion.pushCall("shaderSource", arguments);
	            return original_shaderSource.apply(gl, arguments);
	        };

	        var original_compileShader = gl.compileShader;
	        gl.compileShader = function () {
	            var tracked = arguments[0].trackedObject;
	            tracked.markDirty(false);
	            var result = original_compileShader.apply(gl, arguments);
	            tracked.refresh(gl);
	            tracked.currentVersion.setParameters(tracked.parameters);
	            tracked.currentVersion.setExtraParameters("extra", { infoLog: tracked.infoLog });
	            tracked.currentVersion.pushCall("compileShader", arguments);
	            return result;
	        };
	    };

	    Shader.prototype.createTarget = function (gl, version, options) {
	        var shader = gl.createShader(version.target);

	        this.replayCalls(gl, version, shader, function (call, args) {
	            if (options.fragmentShaderOverride) {
	                if (call.name == "shaderSource") {
	                    if (version.target == gl.FRAGMENT_SHADER) {
	                        args[1] = options.fragmentShaderOverride;
	                    }
	                }
	            }
	            return true;
	        });

	        return shader;
	    };

	    Shader.prototype.deleteTarget = function (gl, target) {
	        gl.deleteShader(target);
	    };

	    return Shader;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(8), __webpack_require__(23), __webpack_require__(9), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, glc, textureInfo, util, Resource) {

	    var Texture = function Texture(gl, frameNumber, stack, target) {
	        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
	        this.creationOrder = 1;

	        this.defaultName = "Texture " + this.id;

	        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP, TEXTURE_3D, TEXTURE_2D_ARRAY

	        this.parameters = {};
	        this.parameters[gl.TEXTURE_MAG_FILTER] = gl.LINEAR;
	        this.parameters[gl.TEXTURE_MIN_FILTER] = gl.NEAREST_MIPMAP_LINEAR;
	        this.parameters[gl.TEXTURE_WRAP_S] = gl.REPEAT;
	        this.parameters[gl.TEXTURE_WRAP_T] = gl.REPEAT;

	        if (util.isWebGL2(gl)) {
	            this.parameters[gl.TEXTURE_BASE_LEVEL] = 0;
	            this.parameters[gl.TEXTURE_COMPARE_FUNC] = gl.LEQUAL;
	            this.parameters[gl.TEXTURE_COMPARE_MODE] = gl.NONE;
	            this.parameters[gl.TEXTURE_MIN_LOD] = -1000;
	            this.parameters[gl.TEXTURE_MAX_LOD] = 1000;
	            this.parameters[gl.TEXTURE_MAX_LEVEL] = 1000;
	            this.parameters[gl.TEXTURE_WRAP_R] = gl.REPEAT;
	        }

	        // TODO: handle TEXTURE_MAX_ANISOTROPY_EXT

	        this.currentVersion.target = this.type;
	        this.currentVersion.setParameters(this.parameters);

	        this.estimatedSize = 0;
	    };

	    Texture.prototype.guessSize = function (gl, version, face) {
	        version = version || this.currentVersion;
	        for (var n = version.calls.length - 1; n >= 0; n--) {
	            var call = version.calls[n];
	            if (call.name == "texImage2D") {
	                // Ignore all but level 0
	                if (call.args[1]) {
	                    continue;
	                }
	                if (face) {
	                    if (call.args[0] != face) {
	                        continue;
	                    }
	                }
	                if (call.args.length == 9) {
	                    return [call.args[3], call.args[4], 1];
	                } else {
	                    var sourceObj = call.args[5];
	                    if (sourceObj) {
	                        return [sourceObj.width, sourceObj.height];
	                    } else {
	                        return null;
	                    }
	                }
	            } else if (call.name == "compressedTexImage2D") {
	                // Ignore all but level 0
	                if (call.args[1]) {
	                    continue;
	                }
	                if (face) {
	                    if (call.args[0] != face) {
	                        continue;
	                    }
	                }
	                return [call.args[3], call.args[4], 1];
	            } else if (call.name == "texImage3D") {
	                // Ignore all but level 0
	                if (call.args[1]) {
	                    continue;
	                }
	                return [call.args[3], call.args[4], call.args[5]];
	            }
	        }
	        return null;
	    };

	    var webgl1RefreshParamEnums = [glc.TEXTURE_MAG_FILTER, glc.TEXTURE_MIN_FILTER, glc.TEXTURE_WRAP_S, glc.TEXTURE_WRAP_T];

	    var webgl2RefreshParamEnums = [].concat(webgl1RefreshParamEnums, [glc.TEXTURE_BASE_LEVEL, glc.TEXTURE_COMPARE_FUNC, glc.TEXTURE_COMPARE_MODE, glc.TEXTURE_MIN_LOD, glc.TEXTURE_MAX_LOD, glc.TEXTURE_MAX_LEVEL, glc.TEXTURE_WRAP_R]);

	    Texture.prototype.refresh = function (gl) {
	        var paramEnums = util.isWebGL2(gl) ? webgl2RefreshParamEnums : webgl1RefreshParamEnums;
	        for (var n = 0; n < paramEnums.length; n++) {
	            this.parameters[paramEnums[n]] = gl.getTexParameter(this.type, paramEnums[n]);
	        }
	    };

	    Texture.getTracked = function (gl, args) {
	        var bindingEnum = textureInfo.getTargetInfo(args[0]).query;
	        var gltexture = gl.rawgl.getParameter(bindingEnum);
	        if (gltexture == null) {
	            // Going to fail
	            return null;
	        }
	        return gltexture.trackedObject;
	    };

	    Texture.setCaptures = function (gl) {
	        // TODO: copyTexImage2D
	        // TODO: copyTexSubImage2D

	        var original_texParameterf = gl.texParameterf;
	        gl.texParameterf = function (target) {
	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.type = textureInfo.getTargetInfo(target).target;
	                tracked.parameters[arguments[1]] = arguments[2];
	                tracked.markDirty(false);
	                tracked.currentVersion.target = tracked.type;
	                tracked.currentVersion.setParameters(tracked.parameters);
	            }

	            return original_texParameterf.apply(gl, arguments);
	        };
	        var original_texParameteri = gl.texParameteri;
	        gl.texParameteri = function (target) {
	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.type = textureInfo.getTargetInfo(target).target;
	                tracked.parameters[arguments[1]] = arguments[2];
	                tracked.markDirty(false);
	                tracked.currentVersion.target = tracked.type;
	                tracked.currentVersion.setParameters(tracked.parameters);
	            }

	            return original_texParameteri.apply(gl, arguments);
	        };

	        function pushPixelStoreState(gl, version) {
	            var pixelStoreEnums = [gl.PACK_ALIGNMENT, gl.UNPACK_ALIGNMENT, gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.UNPACK_FLIP_Y_WEBGL, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL];
	            for (var n = 0; n < pixelStoreEnums.length; n++) {
	                var pixelStoreEnum = pixelStoreEnums[n];
	                if (pixelStoreEnum === undefined) {
	                    continue;
	                }
	                var value = gl.getParameter(pixelStoreEnums[n]);
	                version.pushCall("pixelStorei", [pixelStoreEnum, value]);
	            }
	        };

	        var original_texImage2D = gl.texImage2D;
	        gl.texImage2D = function (target, level, internalFormat) {
	            // Track texture writes
	            var totalBytes = 0;
	            var width = void 0;
	            var height = void 0;
	            var depth = 1;
	            var format = void 0;
	            var type = void 0;
	            if (arguments.length == 9) {
	                width = arguments[3];
	                height = arguments[4];
	                format = arguments[6];
	                type = arguments[7];
	            } else {
	                var sourceArg = arguments[5];
	                width = sourceArg.width;
	                height = sourceArg.height;
	                format = arguments[3];
	                type = arguments[4];
	            }
	            totalBytes = textureInfo.calculateNumSourceBytes(width, height, depth, internalFormat, format, type);
	            gl.statistics.textureWrites.value += totalBytes;

	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                var targetInfo = textureInfo.getTargetInfo(target);
	                tracked.type = targetInfo.target;

	                // Track total texture bytes consumed
	                gl.statistics.textureBytes.value -= tracked.estimatedSize;
	                gl.statistics.textureBytes.value += totalBytes;
	                tracked.estimatedSize = totalBytes;

	                // If !face texture this is always a reset, otherwise it may be a single face of the cube
	                if (!targetInfo.face) {
	                    tracked.markDirty(true);
	                    tracked.currentVersion.setParameters(tracked.parameters);
	                } else {
	                    // Cube face - always partial
	                    tracked.markDirty(false);
	                }
	                tracked.currentVersion.target = tracked.type;
	                if (level == 0) {
	                    tracked.currentVersion.setExtraParameters("format", {
	                        internalFormat: internalFormat,
	                        width: width,
	                        height: height,
	                        depth: 1
	                    });
	                }

	                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
	                tracked.currentVersion.pushCall("texImage2D", arguments);

	                // If this is an upload from something with a URL and we haven't been named yet, auto name us
	                if (arguments.length == 6) {
	                    var sourceArg = arguments[5];
	                    if (sourceArg && sourceArg.src) {
	                        if (!tracked.target.displayName) {
	                            var filename = sourceArg.src;
	                            var lastSlash = filename.lastIndexOf("/");
	                            if (lastSlash >= 0) {
	                                filename = filename.substr(lastSlash + 1);
	                            }
	                            var lastDot = filename.lastIndexOf(".");
	                            if (lastDot >= 0) {
	                                filename = filename.substr(0, lastDot);
	                            }
	                            tracked.setName(filename, true);
	                        }
	                    }
	                }
	            }

	            return original_texImage2D.apply(gl, arguments);
	        };

	        var original_texSubImage2D = gl.texSubImage2D;
	        gl.texSubImage2D = function (target) {
	            // Track texture writes
	            var totalBytes = 0;
	            if (arguments.length == 9) {
	                totalBytes = textureInfo.calculateNumSourceBytes(arguments[4], arguments[5], 1, undefined, arguments[6], arguments[7]);
	            } else {
	                var sourceArg = arguments[6];
	                var width = sourceArg.width;
	                var height = sourceArg.height;
	                totalBytes = textureInfo.calculateNumSourceBytes(width, height, 1, undefined, arguments[4], arguments[5]);
	            }
	            gl.statistics.textureWrites.value += totalBytes;

	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.type = textureInfo.getTargetInfo(target).target;
	                tracked.markDirty(false);
	                tracked.currentVersion.target = tracked.type;
	                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
	                tracked.currentVersion.pushCall("texSubImage2D", arguments);
	            }

	            return original_texSubImage2D.apply(gl, arguments);
	        };

	        var original_texImage3D = gl.texImage3D;
	        gl.texImage3D = function (target, level, internalFormat, width, height, depth, border, format, type, source, offset) {
	            // Track texture writes
	            var totalBytes = 0;
	            totalBytes = textureInfo.calculateNumSourceBytes(width, height, depth, internalFormat, format, type);
	            gl.statistics.textureWrites.value += totalBytes;

	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                var targetInfo = textureInfo.getTargetInfo(target);
	                tracked.type = targetInfo.target;

	                // Track total texture bytes consumed
	                gl.statistics.textureBytes.value -= tracked.estimatedSize;
	                gl.statistics.textureBytes.value += totalBytes;
	                tracked.estimatedSize = totalBytes;

	                // If !face texture this is always a reset, otherwise it may be a single face of the cube
	                if (!targetInfo.face) {
	                    tracked.markDirty(true);
	                    tracked.currentVersion.setParameters(tracked.parameters);
	                } else {
	                    // Cube face - always partial
	                    tracked.markDirty(false);
	                }
	                tracked.currentVersion.target = tracked.type;
	                if (level == 0) {
	                    tracked.currentVersion.setExtraParameters("format", {
	                        internalFormat: internalFormat,
	                        width: width,
	                        height: height,
	                        depth: depth
	                    });
	                }

	                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
	                tracked.currentVersion.pushCall("texImage3D", arguments);

	                // If this is an upload from something with a URL and we haven't been named yet, auto name us
	                if (source instanceof HTMLCanvasElement || source instanceof HTMLImageElement) {
	                    if (!tracked.target.displayName) {
	                        var filename = sourceArg.src;
	                        var lastSlash = filename.lastIndexOf("/");
	                        if (lastSlash >= 0) {
	                            filename = filename.substr(lastSlash + 1);
	                        }
	                        var lastDot = filename.lastIndexOf(".");
	                        if (lastDot >= 0) {
	                            filename = filename.substr(0, lastDot);
	                        }
	                        tracked.setName(filename, true);
	                    }
	                }
	            }

	            return original_texImage3D.apply(gl, arguments);
	        };

	        var original_texSubImage3D = gl.texSubImage3D;
	        gl.texSubImage3D = function (target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, source, offset) {
	            // Track texture writes
	            var totalBytes = 0;
	            totalBytes = textureInfo.calculateNumSourceBytes(width, height, depth, undefined, format, type);
	            gl.statistics.textureWrites.value += totalBytes;

	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.type = textureInfo.getTargetInfo(target).target;
	                tracked.markDirty(false);
	                tracked.currentVersion.target = tracked.type;
	                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
	                tracked.currentVersion.pushCall("texSubImage3D", arguments);
	            }

	            return original_texSubImage3D.apply(gl, arguments);
	        };

	        var original_compressedTexImage2D = gl.compressedTexImage2D;
	        gl.compressedTexImage2D = function (target, level, internalFormat, width, height) {
	            // Track texture writes
	            var totalBytes = 0;
	            switch (internalFormat) {
	                case glc.COMPRESSED_RGB_S3TC_DXT1_EXT:
	                case glc.COMPRESSED_RGBA_S3TC_DXT1_EXT:
	                    totalBytes = Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 8;
	                    break;
	                case glc.COMPRESSED_RGBA_S3TC_DXT3_EXT:
	                case glc.COMPRESSED_RGBA_S3TC_DXT5_EXT:
	                    totalBytes = Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 16;
	                    break;
	            }
	            gl.statistics.textureWrites.value += totalBytes;

	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.type = textureInfo.getTargetInfo(target).target;

	                // Track total texture bytes consumed
	                gl.statistics.textureBytes.value -= tracked.estimatedSize;
	                gl.statistics.textureBytes.value += totalBytes;
	                tracked.estimatedSize = totalBytes;

	                // If a 2D texture this is always a reset, otherwise it may be a single face of the cube
	                // Note that we don't reset if we are adding extra levels.
	                if (arguments[1] == 0 && arguments[0] == gl.TEXTURE_2D) {
	                    tracked.markDirty(true);
	                    tracked.currentVersion.setParameters(tracked.parameters);
	                } else {
	                    // Cube face - always partial
	                    tracked.markDirty(false);
	                }
	                tracked.currentVersion.target = tracked.type;

	                if (level == 0) {
	                    tracked.currentVersion.setExtraParameters("format", {
	                        internalFormat: internalFormat,
	                        width: width,
	                        height: height,
	                        depth: 1
	                    });
	                }

	                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
	                tracked.currentVersion.pushCall("compressedTexImage2D", arguments);
	            }

	            return original_compressedTexImage2D.apply(gl, arguments);
	        };

	        var original_compressedTexSubImage2D = gl.compressedTexSubImage2D;
	        gl.compressedTexSubImage2D = function (target) {
	            // Track texture writes
	            var totalBytes = 0;
	            switch (arguments[2]) {
	                case glc.COMPRESSED_RGB_S3TC_DXT1_EXT:
	                case glc.COMPRESSED_RGBA_S3TC_DXT1_EXT:
	                    totalBytes = Math.floor((arguments[4] + 3) / 4) * Math.floor((arguments[5] + 3) / 4) * 8;
	                    break;
	                case glc.COMPRESSED_RGBA_S3TC_DXT3_EXT:
	                case glc.COMPRESSED_RGBA_S3TC_DXT5_EXT:
	                    totalBytes = Math.floor((arguments[4] + 3) / 4) * Math.floor((arguments[5] + 3) / 4) * 16;
	                    break;
	            }
	            gl.statistics.textureWrites.value += totalBytes;

	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.type = textureInfo.getTargetInfo(target).target;
	                tracked.markDirty(false);
	                tracked.currentVersion.target = tracked.type;
	                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
	                tracked.currentVersion.pushCall("compressedTexSubImage2D", arguments);
	            }

	            return original_compressedTexSubImage2D.apply(gl, arguments);
	        };

	        var original_generateMipmap = gl.generateMipmap;
	        gl.generateMipmap = function (target) {
	            var tracked = Texture.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.type = textureInfo.getTargetInfo(target).target;
	                // TODO: figure out what to do with mipmaps
	                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
	                tracked.currentVersion.pushCall("generateMipmap", arguments);
	            }

	            return original_generateMipmap.apply(gl, arguments);
	        };

	        var original_readPixels = gl.readPixels;
	        gl.readPixels = function () {
	            var result = original_readPixels.apply(gl, arguments);
	            if (result) {
	                // Track texture reads
	                // NOTE: only RGBA is supported for reads
	                var totalBytes = arguments[2] * arguments[3] * 4;
	                gl.statistics.textureReads.value += totalBytes;
	            }
	            return result;
	        };
	    };

	    // If a face is supplied the texture created will be a 2D texture containing only the given face
	    Texture.prototype.createTarget = function (gl, version, options, face) {
	        options = options || {};
	        var target = version.target;
	        if (face) {
	            target = gl.TEXTURE_2D;
	        }

	        var texture = gl.createTexture();
	        gl.bindTexture(target, texture);

	        for (var n in version.parameters) {
	            gl.texParameteri(target, parseInt(n), version.parameters[n]);
	        }

	        this.replayCalls(gl, version, texture, function (call, args) {
	            // Filter uploads if requested
	            if (options.ignoreTextureUploads) {
	                if (call.name === "texImage2D" || call.name === "texImage3D" || call.name === "texSubImage2D" || call.name === "texSubImage3D" || call.name === "compressedTexImage2D" || call.name === "compressedTexSubImage2D" || call.name === "generateMipmap") {
	                    return false;
	                }
	            }

	            // Filter non-face calls and rewrite the target if this is a face-specific call
	            if (call.name == "texImage2D" || call.name == "texSubImage2D" || call.name == "compressedTexImage2D" || call.name == "compressedTexSubImage2D") {
	                if (face && args.length > 0) {
	                    if (args[0] != face) {
	                        return false;
	                    }
	                    args[0] = gl.TEXTURE_2D;
	                }
	            } else if (call.name == "generateMipmap") {
	                args[0] = target;
	            }

	            return true;
	        });

	        return texture;
	    };

	    Texture.prototype.deleteTarget = function (gl, target) {
	        gl.deleteTexture(target);
	    };

	    return Texture;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(8), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function (glc, util) {

	    var texTargetInfo = {};
	    texTargetInfo[glc.TEXTURE_2D] = { target: glc.TEXTURE_2D, query: glc.TEXTURE_BINDING_2D };
	    texTargetInfo[glc.TEXTURE_CUBE_MAP] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP };
	    texTargetInfo[glc.TEXTURE_3D] = { target: glc.TEXTURE_3D, query: glc.TEXTURE_BINDING_3D };
	    texTargetInfo[glc.TEXTURE_2D_ARRAY] = { target: glc.TEXTURE_2D_ARRAY, query: glc.TEXTURE_BINDING_2D_ARRAY };
	    texTargetInfo[glc.TEXTURE_CUBE_MAP_POSITIVE_X] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true };
	    texTargetInfo[glc.TEXTURE_CUBE_MAP_NEGATIVE_X] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true };
	    texTargetInfo[glc.TEXTURE_CUBE_MAP_POSITIVE_Y] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true };
	    texTargetInfo[glc.TEXTURE_CUBE_MAP_NEGATIVE_Y] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true };
	    texTargetInfo[glc.TEXTURE_CUBE_MAP_POSITIVE_Z] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true };
	    texTargetInfo[glc.TEXTURE_CUBE_MAP_NEGATIVE_Z] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true };

	    var defaultTargetInfo = texTargetInfo[glc.TEXTURE_2D];

	    // Given a target for gl.bindTexture or gl.texXXX return a texTargetInfo above
	    function getTargetInfo(target) {
	        return texTargetInfo[target] || defaultTargetInfo;
	    }

	    var formatTypeInfo = {};
	    var textureInternalFormatInfo = {};
	    {
	        var t = textureInternalFormatInfo;
	        // unsized formats                                                             can render to it        can filter
	        t[glc.ALPHA] = { colorType: "0-1", format: glc.ALPHA, colorRenderable: true, textureFilterable: true, bytesPerElement: [1, 2, 4], type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.LUMINANCE] = { colorType: "0-1", format: glc.LUMINANCE, colorRenderable: true, textureFilterable: true, bytesPerElement: [1, 2, 4], type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.LUMINANCE_ALPHA] = { colorType: "0-1", format: glc.LUMINANCE_ALPHA, colorRenderable: true, textureFilterable: true, bytesPerElement: [2, 4, 8], type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.RGB] = { colorType: "0-1", format: glc.RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3, 6, 12, 2], type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT, glc.UNSIGNED_SHORT_5_6_5] };
	        t[glc.RGBA] = { colorType: "0-1", format: glc.RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 8, 16, 2, 2], type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT, glc.UNSIGNED_SHORT_4_4_4_4, glc.UNSIGNED_SHORT_5_5_5_1] };

	        // sized formats
	        t[glc.R8] = { colorType: "0-1", format: glc.RED, colorRenderable: true, textureFilterable: true, bytesPerElement: 1, type: glc.UNSIGNED_BYTE };
	        t[glc.R8_SNORM] = { colorType: "norm", format: glc.RED, colorRenderable: false, textureFilterable: true, bytesPerElement: 1, type: glc.BYTE };
	        t[glc.R16F] = { colorType: "float", format: glc.RED, colorRenderable: false, textureFilterable: true, bytesPerElement: [2, 4], type: [glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.R32F] = { colorType: "float", format: glc.RED, colorRenderable: false, textureFilterable: false, bytesPerElement: 4, type: glc.FLOAT };
	        t[glc.R8UI] = { colorType: "uint", format: glc.RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 1, type: glc.UNSIGNED_BYTE };
	        t[glc.R8I] = { colorType: "int", format: glc.RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 1, type: glc.BYTE };
	        t[glc.R16UI] = { colorType: "uint", format: glc.RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 2, type: glc.UNSIGNED_SHORT };
	        t[glc.R16I] = { colorType: "int", format: glc.RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 2, type: glc.SHORT };
	        t[glc.R32UI] = { colorType: "uint", format: glc.RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.UNSIGNED_INT };
	        t[glc.R32I] = { colorType: "int", format: glc.RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.INT };
	        t[glc.RG8] = { colorType: "0-1", format: glc.RG, colorRenderable: true, textureFilterable: true, bytesPerElement: 2, type: glc.UNSIGNED_BYTE };
	        t[glc.RG8_SNORM] = { colorType: "norm", format: glc.RG, colorRenderable: false, textureFilterable: true, bytesPerElement: 2, type: glc.BYTE };
	        t[glc.RG16F] = { colorType: "float", format: glc.RG, colorRenderable: false, textureFilterable: true, bytesPerElement: [4, 8], type: [glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.RG32F] = { colorType: "float", format: glc.RG, colorRenderable: false, textureFilterable: false, bytesPerElement: 8, type: glc.FLOAT };
	        t[glc.RG8UI] = { colorType: "uint", format: glc.RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 2, type: glc.UNSIGNED_BYTE };
	        t[glc.RG8I] = { colorType: "int", format: glc.RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 2, type: glc.BYTE };
	        t[glc.RG16UI] = { colorType: "uint", format: glc.RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.UNSIGNED_SHORT };
	        t[glc.RG16I] = { colorType: "int", format: glc.RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.SHORT };
	        t[glc.RG32UI] = { colorType: "uint", format: glc.RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 8, type: glc.UNSIGNED_INT };
	        t[glc.RG32I] = { colorType: "int", format: glc.RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 8, type: glc.INT };
	        t[glc.RGB8] = { colorType: "0-1", format: glc.RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: 3, type: glc.UNSIGNED_BYTE };
	        t[glc.SRGB8] = { colorType: "0-1", format: glc.RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: 3, type: glc.UNSIGNED_BYTE };
	        t[glc.RGB565] = { colorType: "0-1", format: glc.RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3, 2], type: [glc.UNSIGNED_BYTE, glc.UNSIGNED_SHORT_5_6_5] };
	        t[glc.RGB8_SNORM] = { colorType: "norm", format: glc.RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: 3, type: glc.BYTE };
	        t[glc.R11F_G11F_B10F] = { colorType: "float", format: glc.RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [4, 6, 12], type: [glc.UNSIGNED_INT_10F_11F_11F_REV, glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.RGB9_E5] = { colorType: "float", format: glc.RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [4, 6, 12], type: [glc.UNSIGNED_INT_5_9_9_9_REV, glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.RGB16F] = { colorType: "float", format: glc.RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [6, 12], type: [glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.RGB32F] = { colorType: "float", format: glc.RGB, colorRenderable: false, textureFilterable: false, bytesPerElement: 12, type: glc.FLOAT };
	        t[glc.RGB8UI] = { colorType: "uint", format: glc.RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 3, type: glc.UNSIGNED_BYTE };
	        t[glc.RGB8I] = { colorType: "int", format: glc.RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 3, type: glc.BYTE };
	        t[glc.RGB16UI] = { colorType: "uint", format: glc.RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 6, type: glc.UNSIGNED_SHORT };
	        t[glc.RGB16I] = { colorType: "int", format: glc.RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 6, type: glc.SHORT };
	        t[glc.RGB32UI] = { colorType: "uint", format: glc.RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 12, type: glc.UNSIGNED_INT };
	        t[glc.RGB32I] = { colorType: "int", format: glc.RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 12, type: glc.INT };
	        t[glc.RGBA8] = { colorType: "0-1", format: glc.RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: 4, type: glc.UNSIGNED_BYTE };
	        t[glc.SRGB8_ALPHA8] = { colorType: "0-1", format: glc.RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: 4, type: glc.UNSIGNED_BYTE };
	        t[glc.RGBA8_SNORM] = { colorType: "norm", format: glc.RGBA, colorRenderable: false, textureFilterable: true, bytesPerElement: 4, type: glc.BYTE };
	        t[glc.RGB5_A1] = { colorType: "0-1", format: glc.RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 2, 4], type: [glc.UNSIGNED_BYTE, glc.UNSIGNED_SHORT_5_5_5_1, glc.UNSIGNED_INT_2_10_10_10_REV] };
	        t[glc.RGBA4] = { colorType: "0-1", format: glc.RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 2], type: [glc.UNSIGNED_BYTE, glc.UNSIGNED_SHORT_4_4_4_4] };
	        t[glc.RGB10_A2] = { colorType: "0-1", format: glc.RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: 4, type: glc.UNSIGNED_INT_2_10_10_10_REV };
	        t[glc.RGBA16F] = { colorType: "float", format: glc.RGBA, colorRenderable: false, textureFilterable: true, bytesPerElement: [8, 16], type: [glc.HALF_FLOAT, glc.FLOAT] };
	        t[glc.RGBA32F] = { colorType: "float", format: glc.RGBA, colorRenderable: false, textureFilterable: false, bytesPerElement: 16, type: glc.FLOAT };
	        t[glc.RGBA8UI] = { colorType: "uint", format: glc.RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.UNSIGNED_BYTE };
	        t[glc.RGBA8I] = { colorType: "int", format: glc.RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.BYTE };
	        t[glc.RGB10_A2UI] = { colorType: "uint", format: glc.RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.UNSIGNED_INT_2_10_10_10_REV };
	        t[glc.RGBA16UI] = { colorType: "uint", format: glc.RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 8, type: glc.UNSIGNED_SHORT };
	        t[glc.RGBA16I] = { colorType: "int", format: glc.RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 8, type: glc.SHORT };
	        t[glc.RGBA32I] = { colorType: "int", format: glc.RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 16, type: glc.INT };
	        t[glc.RGBA32UI] = { colorType: "uint", format: glc.RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 16, type: glc.UNSIGNED_INT };
	        // Sized Internal FormatFormat	Type	Depth Bits	Stencil Bits
	        t[glc.DEPTH_COMPONENT16] = { colorType: "0-1", format: glc.DEPTH_COMPONENT, colorRenderable: true, textureFilterable: false, bytesPerElement: [2, 4], type: [glc.UNSIGNED_SHORT, glc.UNSIGNED_INT] };
	        t[glc.DEPTH_COMPONENT24] = { colorType: "0-1", format: glc.DEPTH_COMPONENT, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.UNSIGNED_INT };
	        t[glc.DEPTH_COMPONENT32F] = { colorType: "0-1", format: glc.DEPTH_COMPONENT, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.FLOAT };
	        t[glc.DEPTH24_STENCIL8] = { colorType: "0-1", format: glc.DEPTH_STENCIL, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.UNSIGNED_INT_24_8 };
	        t[glc.DEPTH32F_STENCIL8] = { colorType: "0-1", format: glc.DEPTH_STENCIL, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: glc.FLOAT_32_UNSIGNED_INT_24_8_REV };

	        Object.keys(t).forEach(function (internalFormat) {
	            var info = t[internalFormat];
	            info.bytesPerElementMap = {};

	            var formatToTypeMap = formatTypeInfo[info.format] || {};
	            formatTypeInfo[info.format] = formatToTypeMap;

	            if (Array.isArray(info.bytesPerElement)) {
	                info.bytesPerElement.forEach(function (bytesPerElement, ndx) {
	                    var type = info.type[ndx];
	                    info.bytesPerElementMap[type] = bytesPerElement;
	                    formatToTypeMap[type] = bytesPerElement;
	                });
	            } else {
	                var type = info.type;
	                info.bytesPerElementMap[type] = info.bytesPerElement;
	                formatToTypeMap[type] = info.bytesPerElement;
	            }
	        });
	    }

	    function getInternalFormatInfo(internalFormat) {
	        return textureInternalFormatInfo[internalFormat];
	    }

	    function calculateNumSourceBytes(width, height, depth, internalFormat, format, type) {
	        var formatToTypeMap = formatTypeInfo[format];
	        var bytesPerElement = formatToTypeMap[type];
	        return width * height * depth * bytesPerElement;
	    }

	    return {
	        calculateNumSourceBytes: calculateNumSourceBytes,
	        getInternalFormatInfo: getInternalFormatInfo,
	        getTargetInfo: getTargetInfo
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource) {

	    var VertexArray = function VertexArray(gl, frameNumber, stack, target) {
	        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
	        this.creationOrder = 2;

	        this.defaultName = "VertexArray " + this.id;

	        // Track the attributes (most importantly which buffers are attached
	        // by watching vertexAttribPointer, vertexAttribIPointer,
	        // and bindBuffer (do we need to track the individual values?
	        this.attributes = {};
	        this.parameters = {};
	        this.elementBuffer = null;

	        this.currentVersion.setParameters(this.parameters);
	        this.currentVersion.setExtraParameters("attributes", this.attributes);
	        this.currentVersion.setExtraParameters("elementBuffer", { buffer: this.elementBuffer });
	    };

	    VertexArray.prototype.getDependentResources = function () {
	        var _this = this;

	        var resources = [];
	        Object.keys(this.attributes).forEach(function (ndx) {
	            var attribute = _this.attributes[ndx];
	            var buffer = attribute.buffer;
	            if (resources.indexOf(buffer) < 0) {
	                resources.push(buffer);
	            }
	        });
	        if (this.elementBuffer) {
	            resources.push(this.elementBuffer);
	        }
	        return resources;
	    };

	    VertexArray.prototype.refresh = function (gl) {};

	    VertexArray.getTracked = function (gl, args) {
	        var glvao = gl.rawgl.getParameter(gl.VERTEX_ARRAY_BINDING);
	        if (glvao == null) {
	            // Going to fail
	            return null;
	        }
	        return glvao.trackedObject;
	    };

	    function cloneAttributes(src) {
	        var dst = {};
	        Object.keys(src).forEach(function (ndx) {
	            dst[ndx] = Object.assign({}, src[ndx]);
	        });
	        return dst;
	    }

	    VertexArray.setCaptures = function (gl) {
	        var original_bindBuffer = gl.bindBuffer;
	        gl.bindBuffer = function (target, buffer) {
	            if (target == gl.ARRAY_BUFFER || target === gl.ELEMENT_ARRAY_BUFFER) {
	                var tracked = VertexArray.getTracked(gl, arguments);
	                if (tracked) {
	                    tracked.currentVersion.pushCall("bindBuffer", arguments);
	                    if (target === gl.ELEMENT_ARRAY_BUFFER) {
	                        tracked.markDirty(false);
	                        tracked.elementBuffer = buffer ? buffer.trackedObject : null;
	                        tracked.currentVersion.setExtraParameters("elementBuffer", { buffer: tracked.elementBuffer });
	                    }
	                }
	            }

	            return original_bindBuffer.apply(gl, arguments);
	        };

	        var original_enableVertexAttribArray = gl.enableVertexAttribArray;
	        gl.enableVertexAttribArray = function (index) {
	            var tracked = VertexArray.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.markDirty(false);
	                tracked.currentVersion.pushCall("enableVertexAttribArray", arguments);
	                var attribute = tracked.attributes[index] || {};
	                tracked.attributes[index] = attribute;
	                attribute.enabled = true;
	                tracked.currentVersion.setExtraParameters("attributes", cloneAttributes(tracked.attributes));
	            }
	            return original_enableVertexAttribArray.apply(gl, arguments);
	        };

	        var original_disableVertexAttribArray = gl.disableVertexAttribArray;
	        gl.disableVertexAttribArray = function (index) {
	            var tracked = VertexArray.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.markDirty(false);
	                tracked.currentVersion.pushCall("disableVertexAttribArray", arguments);
	                var attribute = tracked.attributes[index] || {};
	                tracked.attributes[index] = attribute;
	                attribute.enabled = false;
	                tracked.currentVersion.setExtraParameters("attributes", cloneAttributes(tracked.attributes));
	            }
	            return original_disableVertexAttribArray.apply(gl, arguments);
	        };

	        var original_vertexAttribPointer = gl.vertexAttribPointer;
	        gl.vertexAttribPointer = function (index, size, type, normalize, stride, offset) {
	            var tracked = VertexArray.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.markDirty(false);
	                tracked.currentVersion.pushCall("vertexAttribPointer", arguments);
	                var buffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
	                var attribute = tracked.attributes[index] || {};
	                tracked.attributes[index] = attribute;
	                attribute.size = size;
	                attribute.type = type;
	                attribute.normalize = normalize;
	                attribute.stride = stride;
	                attribute.offset = offset;
	                attribute.buffer = buffer ? buffer.trackedObject : null;
	                tracked.currentVersion.setExtraParameters("attributes", cloneAttributes(tracked.attributes));
	            }
	            return original_vertexAttribPointer.apply(gl, arguments);
	        };

	        var original_vertexAttribIPointer = gl.vertexAttribIPointer;
	        gl.vertexAttribIPointer = function (index, size, type, stride, offset) {
	            var tracked = VertexArray.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.markDirty(false);
	                tracked.currentVersion.pushCall("vertexAttribIPointer", arguments);
	                var buffer = gl.rawgl.getParameter(gl.ARRAY_BUFFER_BINDING);
	                var attribute = tracked.attributes[index] || {};
	                tracked.attributes[index] = attribute;
	                attribute.size = size;
	                attribute.type = type;
	                attribute.stride = stride;
	                attribute.offset = offset;
	                attribute.buffer = buffer ? buffer.trackedObject : null;
	                tracked.currentVersion.setExtraParameters("attributes", cloneAttributes(tracked.attributes));
	            }
	            return original_vertexAttribIPointer.apply(gl, arguments);
	        };

	        var original_vertexAttribDivisor = gl.vertexAttribDivisor;
	        gl.vertexAttribDivisor = function (index, divisor) {
	            var tracked = VertexArray.getTracked(gl, arguments);
	            if (tracked) {
	                tracked.markDirty(false);
	                tracked.currentVersion.pushCall("disableVertexAttribArray", arguments);
	                var attribute = tracked.attributes[index] || {};
	                tracked.attributes[index] = attribute;
	                attribute.divisor = divisor;
	                tracked.currentVersion.setExtraParameters("attributes", cloneAttributes(tracked.attributes));
	            }
	            return original_vertexAttribDivisor.apply(gl, arguments);
	        };

	        ["vertexAttrib1f", // (GLuint indx, GLfloat x);
	        "vertexAttrib2f", // (GLuint indx, GLfloat x, GLfloat y);
	        "vertexAttrib3f", // (GLuint indx, GLfloat x, GLfloat y, GLfloat z);
	        "vertexAttrib4f", // (GLuint indx, GLfloat x, GLfloat y, GLfloat z, GLfloat w);
	        "vertexAttribI4i", // (GLuint index, GLint x, GLint y, GLint z, GLint w);
	        "vertexAttribI4ui", // (GLuint index, GLuint x, GLuint y, GLuint z, GLuint w);
	        "vertexAttrib1fv", // (GLuint indx, Float32Array values);
	        "vertexAttrib2fv", // (GLuint indx, Float32Array values);
	        "vertexAttrib3fv", // (GLuint indx, Float32Array values);
	        "vertexAttrib4fv", // (GLuint indx, Float32Array values);
	        "vertexAttribI4iv", // (GLuint index, Int32List values);
	        "vertexAttribI4uiv"].forEach(function (funcName) {
	            var original_vertexAttribFunc = gl[funcName];
	            var numArgs = parseInt(/\d/.exec(funcName)[0]);
	            var isArrayFn = funcName.substring(funcName.length - 1) === "v";
	            var offset = isArrayFn ? 0 : 1;

	            gl[funcName] = function (index) {
	                var tracked = VertexArray.getTracked(gl, arguments);
	                if (tracked) {
	                    tracked.markDirty(false);
	                    tracked.currentVersion.pushCall(funcName, arguments);
	                    var attribute = tracked.attributes[index] || {};
	                    var array = isArrayFn ? arguments : arguments[1];
	                    tracked.attributes[index] = attribute;
	                    attribute.value = [0, 0, 0, 1];
	                    for (var i = 0; i < numArgs; ++i) {
	                        attribute.value[i] = array[i + offset];
	                    }
	                    tracked.currentVersion.setExtraParameters("attributes", cloneAttributes(tracked.attributes));
	                }
	                return original_vertexAttribFunc.apply(gl, arguments);
	            };
	        });
	    };

	    VertexArray.prototype.createTarget = function (gl, version) {
	        var vao = gl.createVertexArray();
	        gl.bindVertexArray(vao);

	        this.replayCalls(gl, version, vao);

	        return vao;
	    };

	    VertexArray.prototype.deleteTarget = function (gl, target) {
	        gl.deleteVertexArray(target);
	    };

	    return VertexArray;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource) {

	    var VertexArrayObjectOES = function VertexArrayObjectOES(gl, frameNumber, stack, target) {
	        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
	        this.creationOrder = 2;

	        this.defaultName = "VAO " + this.id;

	        this.parameters = {};

	        this.currentVersion.setParameters(this.parameters);
	    };

	    VertexArrayObjectOES.prototype.refresh = function (gl) {};

	    VertexArrayObjectOES.getTracked = function (gl, args) {
	        var ext = gl.getExtension("OES_vertex_array_object");
	        var glvao = gl.getParameter(ext.VERTEX_ARRAY_BINDING_OES);
	        if (glvao == null) {
	            // Going to fail
	            return null;
	        }
	        return glvao.trackedObject;
	    };

	    VertexArrayObjectOES.setCaptures = function (gl) {
	        var ext = gl.getExtension("OES_vertex_array_object");

	        /*
	        var original_renderbufferStorage = gl.renderbufferStorage;
	        gl.renderbufferStorage = function () {
	            var tracked = VertexArrayObjectOES.getTracked(gl, arguments);
	            tracked.markDirty(true);
	            tracked.currentVersion.pushCall("renderbufferStorage", arguments);
	             var result = original_renderbufferStorage.apply(gl, arguments);
	             // HACK: query the parameters now - easier than calculating all of them
	            tracked.refresh(gl);
	            tracked.currentVersion.setParameters(tracked.parameters);
	             return result;
	        };*/
	    };

	    VertexArrayObjectOES.prototype.createTarget = function (gl, version) {
	        var ext = gl.getExtension("OES_vertex_array_object");

	        var vao = ext.createVertexArrayOES();
	        ext.bindVertexArrayOES(vao);

	        this.replayCalls(gl, version, vao);

	        return vao;
	    };

	    VertexArrayObjectOES.prototype.deleteTarget = function (gl, target) {
	        var ext = gl.getExtension("OES_vertex_array_object");
	        ext.deleteVertexArrayOES(target);
	    };

	    return VertexArrayObjectOES;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	    var Counter = function Counter(name, description, unit, color, enabledByDefault) {
	        this.name = name;
	        this.description = description;
	        this.unit = unit;
	        this.color = color;
	        this.enabled = enabledByDefault;

	        this.value = 0;
	        this.previousValue = 0;
	        this.averageValue = 0;
	    };

	    var Statistics = function Statistics() {
	        this.counters = [];

	        this.counters.push(new Counter("frameTime", "Frame Time", "ms", "rgb(0,0,0)", true));
	        this.counters.push(new Counter("drawsPerFrame", "Draws/Frame", null, "rgb(255,0,0)", true));
	        this.counters.push(new Counter("primitivesPerFrame", "Primitives/Frame", null, "rgb(100,0,0)", true));
	        this.counters.push(new Counter("callsPerFrame", "Calls/Frame", null, "rgb(100,0,0)", false));
	        this.counters.push(new Counter("redundantCalls", "Redundant Call %", null, "rgb(0,100,0)", false));
	        this.counters.push(new Counter("textureCount", "Textures", null, "rgb(0,255,0)", true));
	        this.counters.push(new Counter("bufferCount", "Buffers", null, "rgb(0,100,0)", true));
	        this.counters.push(new Counter("programCount", "Programs", null, "rgb(0,200,0)", true));
	        this.counters.push(new Counter("framebufferCount", "Framebuffers", null, "rgb(0,0,0)", false));
	        this.counters.push(new Counter("renderbufferCount", "Renderbuffers", null, "rgb(0,0,0)", false));
	        this.counters.push(new Counter("shaderCount", "Shaders", null, "rgb(0,0,0)", false));
	        this.counters.push(new Counter("vertexarrayCount", "VAs", null, "rgb(0,0,0)", false));
	        this.counters.push(new Counter("vertexArrayObjectCount", "VAOs", null, "rgb(0,0,0)", false));
	        this.counters.push(new Counter("textureBytes", "Texture Memory", "MB", "rgb(0,0,255)", true));
	        this.counters.push(new Counter("bufferBytes", "Buffer Memory", "MB", "rgb(0,0,100)", true));
	        this.counters.push(new Counter("textureWrites", "Texture Writes/Frame", "MB", "rgb(255,255,0)", true));
	        this.counters.push(new Counter("bufferWrites", "Buffer Writes/Frame", "MB", "rgb(100,100,0)", true));
	        this.counters.push(new Counter("textureReads", "Texture Reads/Frame", "MB", "rgb(0,255,255)", true));

	        for (var n = 0; n < this.counters.length; n++) {
	            var counter = this.counters[n];
	            this[counter.name] = counter;
	        }

	        this.history = [];
	    };

	    Statistics.prototype.clear = function () {
	        this.history.length = 0;
	    };

	    Statistics.prototype.beginFrame = function () {
	        for (var n = 0; n < this.counters.length; n++) {
	            var counter = this.counters[n];
	            counter.previousValue = counter.value;
	        }

	        this.frameTime.value = 0;
	        this.drawsPerFrame.value = 0;
	        this.primitivesPerFrame.value = 0;
	        this.callsPerFrame.value = 0;
	        this.redundantCalls.value = 0;
	        this.textureWrites.value = 0;
	        this.bufferWrites.value = 0;
	        this.textureReads.value = 0;

	        this.startTime = new Date().getTime();
	    };

	    Statistics.prototype.endFrame = function () {
	        this.frameTime.value = new Date().getTime() - this.startTime;

	        // Redundant call calculation
	        if (this.callsPerFrame.value > 0) {
	            this.redundantCalls.value = this.redundantCalls.value / this.callsPerFrame.value * 100;
	        } else {
	            this.redundantCalls.value = 0;
	        }

	        var slice = [];
	        slice[this.counters.length - 1] = 0;
	        for (var n = 0; n < this.counters.length; n++) {
	            var counter = this.counters[n];

	            // Average things and store the values off
	            // TODO: better average calculation
	            if (counter.averageValue == 0) {
	                counter.averageValue = counter.value;
	            } else {
	                counter.averageValue = (counter.value * 75 + counter.averageValue * 25) / 100;
	            }

	            // Store in history
	            slice[n] = counter.averageValue;
	        }

	        //this.history.push(slice);
	    };

	    return Statistics;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(10), __webpack_require__(28), __webpack_require__(29), __webpack_require__(38), __webpack_require__(1)], __WEBPACK_AMD_DEFINE_RESULT__ = function (info, settings, SplitterBar, Window, cssLoader, captureContext) {

	    function requestCapture(context) {
	        context.requestCapture(function (context, frame) {
	            for (var n = 0, len = frame.calls.length; n < len; ++n) {
	                var call = frame.calls[n];
	                call.info = info.functions[call.name];
	            }
	            context.frames.push(frame);
	            if (context.ui) {
	                context.ui.appendFrame(frame);
	            }
	        });
	    };

	    var InlineWindow = function InlineWindow(context) {
	        var self = this;
	        this.context = context;

	        var w = this.element = document.createElement("div");
	        w.className = "yui3-cssreset inline-window-host";

	        // TODO: validate height better?
	        var hudHeight = settings.session.hudHeight;
	        hudHeight = Math.max(112, Math.min(hudHeight, window.innerHeight - 42));
	        w.style.height = hudHeight + "px";

	        document.body.appendChild(w);

	        this.splitter = new SplitterBar(w, "horizontal", 112, 42, null, function (newHeight) {
	            context.ui.layout();
	            settings.session.hudHeight = newHeight;
	            settings.save();
	        });

	        cssLoader.load(window);

	        context.ui = new Window(context, window.document, w);

	        this.opened = true;
	        settings.session.hudVisible = true;
	        settings.save();
	    };
	    InlineWindow.prototype.focus = function () {};
	    InlineWindow.prototype.close = function () {
	        if (this.element) {
	            document.body.removeChild(this.element);

	            this.context.ui = null;
	            this.context.window = null;

	            this.element = null;
	            this.context = null;
	            this.splitter = null;
	            this.opened = false;
	            settings.session.hudVisible = false;
	            settings.save();
	        }
	    };
	    InlineWindow.prototype.isOpened = function () {
	        return this.opened;
	    };
	    InlineWindow.prototype.toggle = function () {
	        if (this.opened) {
	            this.element.style.display = "none";
	        } else {
	            this.element.style.display = "";
	        }
	        this.opened = !this.opened;
	        settings.session.hudVisible = this.opened;
	        settings.save();

	        var self = this;
	        captureContext.setTimeout(function () {
	            self.context.ui.layout();
	        }, 0);
	    };

	    var PopupWindow = function PopupWindow(context) {
	        var self = this;
	        this.context = context;

	        settings.session.hudVisible = true;
	        settings.save();

	        var startupWidth = settings.session.hudPopupWidth ? settings.session.hudPopupWidth : 1000;
	        var startupHeight = settings.session.hudPopupHeight ? settings.session.hudPopupHeight : 500;
	        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=" + startupWidth + ",innerHeight=" + startupHeight);
	        w.document.writeln("<html><head><title>WebGL Inspector</title></head><body class='yui3-cssreset' style='margin: 0px; padding: 0px;'></body></html>");

	        window.addEventListener("beforeunload", function () {
	            w.close();
	        }, false);

	        w.addEventListener("unload", function () {
	            context.window.browserWindow.opener.focus();
	            context.window = null;
	        }, false);

	        // Key handler to listen for state changes
	        w.document.addEventListener("keydown", function (event) {
	            var handled = false;
	            switch (event.keyCode) {
	                case 122:
	                    // F11
	                    w.opener.focus();
	                    handled = true;
	                    break;
	                case 123:
	                    // F12
	                    requestCapture(context);
	                    handled = true;
	                    break;
	            };

	            if (handled) {
	                event.preventDefault();
	                event.stopPropagation();
	            }
	        }, false);

	        w.addEventListener("resize", function () {
	            context.ui.layout();
	            settings.session.hudPopupWidth = w.innerWidth;
	            settings.session.hudPopupHeight = w.innerHeight;
	            settings.save();
	        }, false);

	        cssLoader.load(w);

	        // I don't think this is needed
	        // w.gli = window.gli;

	        captureContext.setTimeout(function () {
	            context.ui = new Window(context, w.document);
	        }, 0);
	    };
	    PopupWindow.prototype.focus = function () {
	        this.browserWindow.focus();
	    };
	    PopupWindow.prototype.close = function () {
	        this.browserWindow.close();
	        this.browserWindow = null;
	        this.context.window = null;
	        settings.session.hudVisible = false;
	        settings.save();
	    };
	    PopupWindow.prototype.isOpened = function () {
	        return this.browserWindow && !this.browserWindow.closed;
	    };

	    function requestFullUI(context, hiddenByDefault) {
	        if (settings.global.popupHud) {
	            if (context.window) {
	                if (context.window.isOpened()) {
	                    context.window.focus();
	                } else {
	                    context.window.close();
	                }
	            }

	            if (!context.window) {
	                if (!hiddenByDefault) {
	                    context.window = new PopupWindow(context);
	                }
	            }
	        } else {
	            if (!context.window) {
	                context.window = new InlineWindow(context);
	                if (hiddenByDefault) {
	                    context.window.toggle();
	                }
	            } else {
	                context.window.toggle();
	            }
	        }
	    };

	    function injectUI(ui) {
	        var context = ui.context;

	        var button1 = document.createElement("div");
	        button1.style.zIndex = "99999";
	        button1.style.position = "absolute";
	        button1.style.right = "38px";
	        button1.style.top = "5px";
	        button1.style.cursor = "pointer";
	        button1.style.backgroundColor = "rgba(50,10,10,0.8)";
	        button1.style.color = "red";
	        button1.style.fontSize = "8pt";
	        button1.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
	        button1.style.fontWeight = "bold";
	        button1.style.padding = "5px";
	        button1.style.border = "1px solid red";
	        button1.style.webkitUserSelect = "none";
	        button1.style.mozUserSelect = "none";
	        button1.title = "Capture frame (F12)";
	        button1.textContent = "Capture";
	        document.body.appendChild(button1);

	        button1.addEventListener("click", function () {
	            requestCapture(context);
	        });

	        var button2 = document.createElement("div");
	        button2.style.zIndex = "99999";
	        button2.style.position = "absolute";
	        button2.style.right = "5px";
	        button2.style.top = "5px";
	        button2.style.cursor = "pointer";
	        button2.style.backgroundColor = "rgba(10,50,10,0.8)";
	        button2.style.color = "rgb(0,255,0)";
	        button2.style.fontSize = "8pt";
	        button2.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
	        button2.style.fontWeight = "bold";
	        button2.style.padding = "5px";
	        button2.style.border = "1px solid rgb(0,255,0)";
	        button2.style.webkitUserSelect = "none";
	        button2.style.mozUserSelect = "none";
	        button2.title = "Show full inspector (F11)";
	        button2.textContent = "UI";
	        document.body.appendChild(button2);

	        button2.addEventListener("click", function () {
	            requestFullUI(context);
	        }, false);
	    };

	    function injectHandlers(ui) {
	        var context = ui.context;

	        // Key handler to listen for capture requests
	        document.addEventListener("keydown", function (event) {
	            var handled = false;
	            switch (event.keyCode) {
	                case 122:
	                    // F11
	                    requestFullUI(context);
	                    handled = true;
	                    break;
	                case 123:
	                    // F12
	                    requestCapture(context);
	                    handled = true;
	                    break;
	            };

	            if (handled) {
	                event.preventDefault();
	                event.stopPropagation();
	            }
	        }, false);
	    };

	    var HostUI = function HostUI(context) {
	        this.context = context;

	        injectUI(this);
	        injectHandlers(this);

	        this.context.frames = [];

	        var hudVisible = settings.session.hudVisible || settings.global.showHud;
	        requestFullUI(context, !hudVisible);
	    };

	    HostUI.requestFullUI = requestFullUI;
	    return HostUI;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	    var SplitterBar = function SplitterBar(parentElement, direction, minValue, maxValue, customStyle, changeCallback) {
	        var self = this;
	        var doc = parentElement.ownerDocument;

	        var el = this.el = doc.createElement("div");
	        parentElement.appendChild(el);

	        el.className = customStyle || "splitter-" + direction;

	        var lastValue = 0;

	        function mouseMove(e) {
	            var newValue;

	            if (direction == "horizontal") {
	                var dy = e.screenY - lastValue;
	                lastValue = e.screenY;

	                var height = parseInt(parentElement.style.height);
	                height -= dy;
	                height = Math.max(minValue, height);
	                height = Math.min(window.innerHeight - maxValue, height);
	                parentElement.style.height = height + "px";
	                newValue = height;
	            } else {
	                var dx = e.screenX - lastValue;
	                lastValue = e.screenX;

	                var width = parseInt(parentElement.style.width);
	                width -= dx;
	                width = Math.max(minValue, width);
	                width = Math.min(window.innerWidth - maxValue, width);
	                parentElement.style.width = width + "px";
	                newValue = width;
	            }

	            if (changeCallback) {
	                changeCallback(newValue);
	            }

	            e.preventDefault();
	            e.stopPropagation();
	        };

	        function mouseUp(e) {
	            endResize();
	            e.preventDefault();
	            e.stopPropagation();
	        };

	        function beginResize() {
	            doc.addEventListener("mousemove", mouseMove, true);
	            doc.addEventListener("mouseup", mouseUp, true);
	            if (direction == "horizontal") {
	                doc.body.style.cursor = "n-resize";
	            } else {
	                doc.body.style.cursor = "e-resize";
	            }
	        };

	        function endResize() {
	            doc.removeEventListener("mousemove", mouseMove, true);
	            doc.removeEventListener("mouseup", mouseUp, true);
	            doc.body.style.cursor = "";
	        };

	        el.onmousedown = function (e) {
	            beginResize();
	            if (direction == "horizontal") {
	                lastValue = e.screenY;
	            } else {
	                lastValue = e.screenX;
	            }
	            e.preventDefault();
	            e.stopPropagation();
	        };

	        // TODO: save splitter value somewhere across sessions?
	    };

	    return SplitterBar;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(27), __webpack_require__(30), __webpack_require__(31), __webpack_require__(32), __webpack_require__(49), __webpack_require__(51), __webpack_require__(53), __webpack_require__(56), __webpack_require__(58), __webpack_require__(62)], __WEBPACK_AMD_DEFINE_RESULT__ = function (captureContext, HostUI, Controller, Tab, TraceTab, TimelineTab, StateTab, TexturesTab, BuffersTab, ProgramsTab, VertexArraysTab) {

	    var Toolbar = function Toolbar(w) {
	        var self = this;
	        var document = w.document;

	        this.window = w;
	        this.elements = {
	            bar: w.root.getElementsByClassName("window-toolbar")[0]
	        };
	        this.buttons = {};

	        function appendRightRegion(title, buttons) {
	            var regionDiv = document.createElement("div");
	            regionDiv.className = "toolbar-right-region";

	            var titleDiv = document.createElement("div");
	            titleDiv.className = "toolbar-right-region-title";
	            titleDiv.textContent = title;
	            regionDiv.appendChild(titleDiv);

	            var activeIndex = 0;
	            var previousSelection = null;

	            for (var n = 0; n < buttons.length; n++) {
	                var button = buttons[n];

	                var buttonSpan = document.createElement("span");
	                if (button.name) {
	                    buttonSpan.textContent = button.name;
	                }
	                if (button.className) {
	                    buttonSpan.className = button.className;
	                }
	                buttonSpan.title = button.title ? button.title : button.name;
	                regionDiv.appendChild(buttonSpan);
	                button.el = buttonSpan;

	                (function (n, button) {
	                    buttonSpan.onclick = function () {
	                        if (previousSelection) {
	                            previousSelection.el.className = previousSelection.el.className.replace(" toolbar-right-region-active", "");
	                        }
	                        previousSelection = button;
	                        button.el.className += " toolbar-right-region-active";

	                        button.onclick.apply(self);
	                    };
	                })(n, button);

	                if (n < buttons.length - 1) {
	                    var sep = document.createElement("div");
	                    sep.className = "toolbar-right-region-sep";
	                    sep.textContent = " | ";
	                    regionDiv.appendChild(sep);
	                }
	            }

	            // Select first
	            buttons[0].el.onclick();

	            self.elements.bar.appendChild(regionDiv);
	        };
	        function appendRightButtons(buttons) {
	            var regionDiv = document.createElement("div");
	            regionDiv.className = "toolbar-right-buttons";

	            for (var n = 0; n < buttons.length; n++) {
	                var button = buttons[n];

	                var buttonDiv = document.createElement("div");
	                if (button.name) {
	                    buttonDiv.textContent = button.name;
	                }
	                buttonDiv.className = "toolbar-right-button";
	                if (button.className) {
	                    buttonDiv.className += " " + button.className;
	                }
	                buttonDiv.title = button.title ? button.title : button.name;
	                regionDiv.appendChild(buttonDiv);
	                button.el = buttonDiv;

	                (function (button) {
	                    buttonDiv.onclick = function () {
	                        button.onclick.apply(self);
	                    };
	                })(button);

	                if (n < buttons.length - 1) {
	                    var sep = document.createElement("div");
	                    sep.className = "toolbar-right-buttons-sep";
	                    sep.textContent = " ";
	                    regionDiv.appendChild(sep);
	                }
	            }

	            self.elements.bar.appendChild(regionDiv);
	        };

	        appendRightButtons([
	        /*{
	            title: "Options",
	            className: "toolbar-right-button-options",
	            onclick: function () {
	                alert("options");
	            }
	        },*/
	        {
	            title: "Hide inspector (F11)",
	            className: "toolbar-right-button-close",
	            onclick: function onclick() {
	                HostUI.requestFullUI(w.context);
	            }
	        }]);
	        /*
	        appendRightRegion("Version: ", [
	            {
	                name: "Live",
	                onclick: function () {
	                    w.setActiveVersion(null);
	                }
	            },
	            {
	                name: "Current",
	                onclick: function () {
	                    w.setActiveVersion("current");
	                }
	            }
	        ]);
	        */
	        appendRightRegion("Frame Control: ", [{
	            name: "Normal",
	            onclick: function onclick() {
	                captureContext.setFrameControl(0);
	            }
	        }, {
	            name: "Slowed",
	            onclick: function onclick() {
	                captureContext.setFrameControl(250);
	            }
	        }, {
	            name: "Paused",
	            onclick: function onclick() {
	                captureContext.setFrameControl(Infinity);
	            }
	        }]);
	    };
	    Toolbar.prototype.addSelection = function (name, tip) {
	        var self = this;

	        var el = document.createElement("div");
	        el.className = "toolbar-button toolbar-button-enabled toolbar-button-command-" + name;

	        el.title = tip;
	        el.textContent = tip;

	        el.onclick = function () {
	            self.window.selectTab(name);
	        };

	        this.elements.bar.appendChild(el);

	        this.buttons[name] = el;
	    };
	    Toolbar.prototype.toggleSelection = function (name) {
	        for (var n in this.buttons) {
	            var el = this.buttons[n];
	            el.className = el.className.replace("toolbar-button-selected", "toolbar-button-enabled");
	        }
	        var el = this.buttons[name];
	        if (el) {
	            el.className = el.className.replace("toolbar-button-disabled", "toolbar-button-selected");
	            el.className = el.className.replace("toolbar-button-enabled", "toolbar-button-selected");
	        }
	    };

	    function writeDocument(document, elementHost) {
	        var root = document.createElement("div");
	        root.className = "window";

	        // Toolbar
	        // <div class="window-toolbar">
	        // ...
	        var toolbar = document.createElement("div");
	        toolbar.className = "window-toolbar";
	        root.appendChild(toolbar);

	        // Middle
	        // <div class="window-middle">
	        // ...
	        var middle = document.createElement("div");
	        middle.className = "window-middle";
	        root.appendChild(middle);

	        if (elementHost) {
	            elementHost.appendChild(root);
	        } else {
	            document.body.appendChild(root);
	        }

	        root.elements = {
	            toolbar: toolbar,
	            middle: middle
	        };

	        return root;
	    };

	    var Window = function Window(context, document, elementHost) {
	        var self = this;
	        this.context = context;
	        this.document = document;
	        this.browserWindow = window;

	        this.root = writeDocument(document, elementHost);

	        this.controller = new Controller();

	        this.toolbar = new Toolbar(this);
	        this.tabs = {};
	        this.currentTab = null;
	        this.windows = {};

	        this.activeVersion = "current"; // or null for live
	        this.activeFilter = null;

	        var middle = this.root.elements.middle;
	        function addTab(name, tip, implType) {
	            var tab = new Tab(self, middle, name);

	            if (implType) {
	                implType.apply(tab, [self]);
	            }

	            self.toolbar.addSelection(name, tip);

	            self.tabs[name] = tab;
	        };

	        addTab("trace", "Trace", TraceTab);
	        addTab("timeline", "Timeline", TimelineTab);
	        addTab("state", "State", StateTab);
	        addTab("textures", "Textures", TexturesTab);
	        addTab("buffers", "Buffers", BuffersTab);
	        addTab("programs", "Programs", ProgramsTab);
	        addTab("vaos", "VAOs", VertexArraysTab);
	        //addTab("performance", "Performance", PerformanceTab);

	        this.selectTab("trace");

	        window.addEventListener("beforeunload", function () {
	            for (var n in self.windows) {
	                var w = self.windows[n];
	                if (w) {
	                    w.close();
	                }
	            }
	        }, false);

	        captureContext.setTimeout(function () {
	            self.selectTab("trace", true);
	        }, 0);
	    };

	    Window.prototype.layout = function () {
	        for (var n in this.tabs) {
	            var tab = this.tabs[n];
	            if (tab.layout) {
	                tab.layout();
	            }
	        }
	    };

	    Window.prototype.selectTab = function (name, force) {
	        if (name.name) {
	            name = name.name;
	        }
	        if (this.currentTab && this.currentTab.name == name && !force) {
	            return;
	        }
	        var tab = this.tabs[name];
	        if (!tab) {
	            return;
	        }

	        if (this.currentTab) {
	            this.currentTab.loseFocus();
	            this.currentTab = null;
	        }

	        this.currentTab = tab;
	        this.currentTab.gainFocus();
	        this.toolbar.toggleSelection(name);

	        if (tab.layout) {
	            tab.layout();
	        }
	        if (tab.refresh) {
	            tab.refresh();
	        }
	    };

	    Window.prototype.setActiveVersion = function (version) {
	        if (this.activeVersion == version) {
	            return;
	        }
	        this.activeVersion = version;
	        if (this.currentTab.refresh) {
	            this.currentTab.refresh();
	        }
	    };

	    Window.prototype.setActiveFilter = function (filter) {
	        if (this.activeFilter == filter) {
	            return;
	        }
	        this.activeFilter = filter;
	        console.log("would set active filter: " + filter);
	    };

	    Window.prototype.appendFrame = function (frame) {
	        var tab = this.tabs["trace"];
	        this.selectTab(tab);
	        tab.listing.appendValue(frame);
	        tab.listing.selectValue(frame);
	    };

	    Window.prototype.showTrace = function (frame, callOrdinal) {
	        var tab = this.tabs["trace"];
	        this.selectTab(tab);
	        if (this.controller.currentFrame != frame) {
	            tab.listing.selectValue(frame);
	        }
	        tab.traceView.stepUntil(callOrdinal);
	    };

	    Window.prototype.showResource = function (resourceTab, resource, switchToCurrent) {
	        if (switchToCurrent) {
	            // TODO: need to update UI to be able to do this
	            //this.setActiveVersion("current");
	        }
	        var tab = this.tabs[resourceTab];
	        this.selectTab(tab);
	        tab.listing.selectValue(resource);
	        this.browserWindow.focus();
	    };

	    Window.prototype.showTexture = function (texture, switchToCurrent) {
	        this.showResource("textures", texture, switchToCurrent);
	    };

	    Window.prototype.showBuffer = function (buffer, switchToCurrent) {
	        this.showResource("buffers", buffer, switchToCurrent);
	    };

	    Window.prototype.showVertexArray = function (vertexArray, switchToCurrent) {
	        this.showResource("vaos", vertexArray, switchToCurrent);
	    };

	    Window.prototype.showProgram = function (program, switchToCurrent) {
	        this.showResource("programs", program, switchToCurrent);
	    };

	    return Window;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5), __webpack_require__(7), __webpack_require__(9), __webpack_require__(12)], __WEBPACK_AMD_DEFINE_RESULT__ = function (EventSource, info, util, StateSnapshot) {

	    function clearToZeroAndRestoreParams(gl, bufferBits) {
	        var oldColorMask = gl.getParameter(gl.COLOR_WRITEMASK);
	        var oldColorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	        var oldDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
	        var oldDepthClearValue = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
	        var oldStencilFrontMask = gl.getParameter(gl.STENCIL_WRITEMASK);
	        var oldStencilBackMask = gl.getParameter(gl.STENCIL_BACK_WRITEMASK);
	        var oldStencilClearValue = gl.getParameter(gl.STENCIL_CLEAR_VALUE);
	        gl.colorMask(true, true, true, true);
	        gl.clearColor(0, 0, 0, 0);
	        gl.clearDepth(1);
	        gl.stencilMask(0xFFFFFFFF);
	        gl.clearStencil(0);
	        gl.clear(bufferBits);
	        gl.colorMask(oldColorMask[0], oldColorMask[1], oldColorMask[2], oldColorMask[3]);
	        gl.clearColor(oldColorClearValue[0], oldColorClearValue[1], oldColorClearValue[2], oldColorClearValue[3]);
	        gl.depthMask(oldDepthMask);
	        gl.clearDepth(oldDepthClearValue);
	        gl.stencilMaskSeparate(gl.FRONT, oldStencilFrontMask);
	        gl.stencilMaskSeparate(gl.BACK, oldStencilBackMask);
	        gl.clearStencil(oldStencilClearValue);
	    }

	    var Controller = function Controller() {
	        this.output = {};

	        this.currentFrame = null;
	        this.callIndex = 0;
	        this.stepping = false;

	        this.stepCompleted = new EventSource("stepCompleted");
	    };

	    Controller.prototype.setOutput = function (canvas) {
	        this.output.canvas = canvas;

	        // TODO: pull attributes from source somehow?
	        var gl = this.output.gl = util.getWebGLContext(canvas, null, null);
	        info.initialize(gl);
	    };

	    Controller.prototype.reset = function (force) {
	        if (this.currentFrame) {
	            var gl = this.output.gl;
	            if (force) {
	                this.currentFrame.cleanup(gl);
	            }
	        }

	        this.currentFrame = null;
	        this.callIndex = 0;
	        this.stepping = false;
	    };

	    Controller.prototype.getCurrentState = function () {
	        if (!this.output.gl) return null;
	        return new StateSnapshot(this.output.gl);
	    };

	    Controller.prototype.openFrame = function (frame, suppressEvents, force, useDepthShader) {
	        var gl = this.output.gl;

	        // Canvas must match size when frame was captured otherwise viewport
	        // and matrices etc will not match
	        if (gl.canvas.width !== frame.canvasInfo.width || gl.canvas.heigth !== frame.canvasInfo.height) {
	            gl.canvas.width = frame.canvasInfo.width;
	            gl.canvas.height = frame.canvasInfo.height;
	        }

	        this.currentFrame = frame;

	        if (useDepthShader) {
	            frame.switchMirrors();
	        } else {
	            frame.switchMirrors("depth");
	        }

	        var depthShader = null;
	        if (useDepthShader) {
	            depthShader = "precision highp float;\n" + "vec4 packFloatToVec4i(const float value) {\n" + "   const vec4 bitSh = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\n" + "   const vec4 bitMsk = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\n" + "   vec4 res = fract(value * bitSh);\n" + "   res -= res.xxyz * bitMsk;\n" + "   return res;\n" + "}\n" + "void main() {\n" + "   gl_FragColor = packFloatToVec4i(gl_FragCoord.z);\n" +
	            //"   gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);\n" +
	            "}";
	        }
	        frame.makeActive(gl, force, {
	            fragmentShaderOverride: depthShader,
	            ignoreTextureUploads: useDepthShader
	        });

	        this.beginStepping();
	        this.callIndex = 0;
	        this.endStepping(suppressEvents);
	    };

	    function emitMark(mark) {
	        console.log("mark hit");
	    };

	    Controller.prototype.issueCall = function (callIndex) {
	        var gl = this.output.gl;

	        if (this.currentFrame == null) {
	            return false;
	        }
	        if (this.callIndex + 1 > this.currentFrame.calls.length) {
	            return false;
	        }

	        if (callIndex >= 0) {
	            this.callIndex = callIndex;
	        } else {
	            callIndex = this.callIndex;
	        }

	        var call = this.currentFrame.calls[callIndex];

	        switch (call.type) {
	            case 0:
	                // MARK
	                emitMark(call);
	                break;
	            case 1:
	                // GL
	                call.emit(gl);
	                break;
	        }

	        return true;
	    };

	    Controller.prototype.beginStepping = function () {
	        this.stepping = true;
	    };

	    Controller.prototype.endStepping = function (suppressEvents, overrideCallIndex) {
	        this.stepping = false;
	        if (!suppressEvents) {
	            var callIndex = overrideCallIndex || this.callIndex;
	            this.stepCompleted.fire(callIndex);
	        }
	    };

	    Controller.prototype.stepUntil = function (callIndex) {
	        if (this.callIndex > callIndex) {
	            var frame = this.currentFrame;
	            this.reset();
	            this.openFrame(frame);
	        }
	        var wasStepping = this.stepping;
	        if (!wasStepping) {
	            this.beginStepping();
	        }
	        while (this.callIndex <= callIndex) {
	            if (this.issueCall()) {
	                this.callIndex++;
	            } else {
	                this.endStepping();
	                return false;
	            }
	        }
	        if (!wasStepping) {
	            this.endStepping();
	        }
	        return true;
	    };

	    Controller.prototype.stepForward = function () {
	        return this.stepUntil(this.callIndex);
	    };

	    Controller.prototype.stepBackward = function () {
	        if (this.callIndex <= 1) {
	            return false;
	        }
	        return this.stepUntil(this.callIndex - 2);
	    };

	    Controller.prototype.stepUntilError = function () {
	        //
	    };

	    Controller.prototype.stepUntilDraw = function () {
	        this.beginStepping();
	        while (this.issueCall()) {
	            var call = this.currentFrame.calls[this.callIndex];
	            var funcInfo = info.functions[call.name];
	            if (funcInfo.type == info.FunctionType.DRAW) {
	                this.callIndex++;
	                break;
	            } else {
	                this.callIndex++;
	            }
	        }
	        this.endStepping();
	    };

	    Controller.prototype.stepUntilEnd = function () {
	        this.beginStepping();
	        while (this.stepForward()) {}
	        this.endStepping();
	    };

	    Controller.prototype.runFrame = function (frame) {
	        var gl = this.output.gl;

	        if (!frame.canvasInfo.attributes.preserveDrawingBuffer) {
	            // TODO: should probably clear to 0, depth to 1, stencil to 0
	            clearToZeroAndRestoreParams(gl, gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	        }

	        this.openFrame(frame);
	        this.stepUntilEnd();
	    };

	    Controller.prototype.runIsolatedDraw = function (frame, targetCall) {
	        this.openFrame(frame, true);

	        var gl = this.output.gl;

	        this.beginStepping();
	        while (true) {
	            var call = this.currentFrame.calls[this.callIndex];
	            var shouldExec = false;

	            if (call.name == "clear") {
	                // Allow clear calls
	                shouldExec = true;
	            } else if (call == targetCall) {
	                // The target call
	                shouldExec = true;

	                // Before executing the call, clear the color buffer
	                clearToZeroAndRestoreParameters(g.COLOR_BUFFER_BIT);
	            } else {
	                var funcInfo = info.functions[call.name];
	                if (funcInfo.type == info.FunctionType.DRAW) {
	                    // Ignore all other draws
	                    shouldExec = false;
	                } else {
	                    shouldExec = true;
	                }
	            }

	            if (shouldExec) {
	                if (!this.issueCall()) {
	                    break;
	                }
	            }

	            this.callIndex++;
	            if (call == targetCall) {
	                break;
	            }
	        }

	        var finalCallIndex = this.callIndex;

	        this.openFrame(frame, true);

	        this.endStepping(false, finalCallIndex);
	    };

	    function packFloatToVec4i(value) {
	        //vec4 bitSh = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
	        //vec4 bitMsk = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
	        //vec4 res = fract(value * bitSh);
	        var r = value * 256 * 256 * 256;
	        var g = value * 256 * 256;
	        var b = value * 256;
	        var a = value;
	        r = r - Math.floor(r);
	        g = g - Math.floor(g);
	        b = b - Math.floor(b);
	        a = a - Math.floor(a);
	        //res -= res.xxyz * bitMsk;
	        g -= r / 256.0;
	        b -= g / 256.0;
	        a -= b / 256.0;
	        return [r, g, b, a];
	    };

	    Controller.prototype.runDepthDraw = function (frame, targetCall) {
	        this.openFrame(frame, true, undefined, true);

	        var gl = this.output.gl;

	        this.beginStepping();
	        while (true) {
	            var call = this.currentFrame.calls[this.callIndex];
	            var shouldExec = true;

	            var arg0;
	            switch (call.name) {
	                case "clear":
	                    arg0 = call.args[0];
	                    // Only allow depth clears if depth mask is set
	                    if (gl.getParameter(gl.DEPTH_WRITEMASK) == true) {
	                        call.args[0] = call.args[0] & gl.DEPTH_BUFFER_BIT;
	                        if (arg0 & gl.DEPTH_BUFFER_BIT) {
	                            call.args[0] |= gl.COLOR_BUFFER_BIT;
	                        }
	                        var d = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
	                        var vd = packFloatToVec4i(d);
	                        gl.clearColor(vd[0], vd[1], vd[2], vd[3]);
	                    } else {
	                        shouldExec = false;
	                    }
	                    break;
	                case "drawArrays":
	                case "drawElements":
	                    // Only allow draws if depth mask is set
	                    if (gl.getParameter(gl.DEPTH_WRITEMASK) == true) {
	                        // Reset state to what we need
	                        gl.disable(gl.BLEND);
	                        gl.colorMask(true, true, true, true);
	                    } else {
	                        shouldExec = false;
	                    }
	                    break;
	                default:
	                    break;
	            }

	            if (shouldExec) {
	                if (!this.issueCall()) {
	                    break;
	                }
	            }

	            switch (call.name) {
	                case "clear":
	                    call.args[0] = arg0;
	                    break;
	                default:
	                    break;
	            }

	            this.callIndex++;
	            if (call == targetCall) {
	                break;
	            }
	        }

	        var finalCallIndex = this.callIndex;

	        this.openFrame(frame, true);

	        this.endStepping(false, finalCallIndex);
	    };

	    return Controller;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5)], __WEBPACK_AMD_DEFINE_RESULT__ = function (EventSource) {

	    var Tab = function Tab(w, container, name) {
	        this.name = name;
	        this.hasFocus = false;

	        var el = this.el = document.createElement("div");
	        el.className = "window-tab-root";
	        container.appendChild(el);

	        this.gainedFocus = new EventSource("gainedFocus");
	        this.lostFocus = new EventSource("lostFocus");
	    };
	    Tab.prototype.gainFocus = function () {
	        this.hasFocus = true;
	        this.el.className += " window-tab-selected";
	        this.gainedFocus.fire();
	    };
	    Tab.prototype.loseFocus = function () {
	        this.lostFocus.fire();
	        this.hasFocus = false;
	        this.el.className = this.el.className.replace(" window-tab-selected", "");
	    };

	    // Variadic.
	    Tab.eleClasses = function (eleType) {
	        var ele = document.createElement(eleType);
	        for (var i = 1, len = arguments.length; i < len; ++i) {
	            ele.classList.add(arguments[i]);
	        }
	        return ele;
	    };

	    Tab.divClass = function (klass, comment) {
	        var div = Tab.eleClasses("div", klass);
	        if (comment) div.appendChild(document.createComment(" " + comment + " "));
	        return div;
	    };

	    Tab.windowLeft = function (options) {
	        var left = Tab.divClass("window-left");
	        left.appendChild(Tab.divClass("window-left-listing", options.listing));
	        left.appendChild(Tab.divClass("window-left-toolbar", options.toolbar));
	        return left;
	    };

	    Tab.inspector = function () {
	        var canvas = Tab.eleClasses("canvas", "gli-reset", "surface-inspector-pixel");
	        var statusbar = Tab.divClass("surface-inspector-statusbar");
	        var inspector = Tab.divClass("window-inspector");

	        canvas.width = canvas.height = 1;

	        statusbar.appendChild(canvas);
	        statusbar.appendChild(Tab.eleClasses("span", "surface-inspector-location"));
	        inspector.appendChild(Tab.divClass("surface-inspector-toolbar", "toolbar"));
	        inspector.appendChild(Tab.divClass("surface-inspector-inner", "inspector"));
	        inspector.appendChild(statusbar);

	        return inspector;
	    };

	    Tab.genericLeftRightView = function () {
	        var outer = Tab.divClass("window-right-outer");
	        var right = Tab.divClass("window-right");

	        right.appendChild(Tab.divClass("window-right-inner", "scrolling content"));
	        outer.appendChild(right);
	        outer.appendChild(Tab.windowLeft({ listing: "state list", toolbar: "toolbar" }));

	        return outer;
	    };

	    return Tab;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(31), __webpack_require__(33), __webpack_require__(34)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tab, LeftListing, TraceView) {

	    var TraceTab = function TraceTab(w) {
	        var outer = Tab.divClass("window-right-outer");
	        var right = Tab.divClass("window-right");
	        var inspector = Tab.inspector();
	        inspector.classList.add("window-trace-inspector");
	        var traceOuter = Tab.divClass("window-trace-outer");
	        var trace = Tab.divClass("window-trace");
	        var left = Tab.windowLeft({ listing: "frame list", toolbar: "toolbar" });

	        trace.appendChild(Tab.divClass("trace-minibar", "minibar"));
	        trace.appendChild(Tab.divClass("trace-listing", "call trace"));
	        traceOuter.appendChild(trace);
	        right.appendChild(inspector);
	        right.appendChild(traceOuter);
	        outer.appendChild(right);
	        outer.appendChild(left);

	        this.el.appendChild(outer);

	        this.listing = new LeftListing(w, this.el, "frame", function (el, frame) {
	            var canvas = document.createElement("canvas");
	            canvas.className = "gli-reset frame-item-preview";
	            canvas.style.cursor = "pointer";
	            canvas.width = 80;
	            canvas.height = frame.screenshot.height / frame.screenshot.width * 80;

	            // Draw the data - hacky, but easiest?
	            var ctx2d = canvas.getContext("2d");
	            ctx2d.drawImage(frame.screenshot, 0, 0, canvas.width, canvas.height);

	            el.appendChild(canvas);

	            var number = document.createElement("div");
	            number.className = "frame-item-number";
	            number.textContent = frame.frameNumber;
	            el.appendChild(number);
	        });
	        this.traceView = new TraceView(w, this.el);

	        this.listing.valueSelected.addListener(this, function (frame) {
	            this.traceView.setFrame(frame);
	        });

	        var scrollStates = {
	            listing: null,
	            traceView: null
	        };
	        this.lostFocus.addListener(this, function () {
	            scrollStates.listing = this.listing.getScrollState();
	            scrollStates.traceView = this.traceView.getScrollState();
	        });
	        this.gainedFocus.addListener(this, function () {
	            this.listing.setScrollState(scrollStates.listing);
	            this.traceView.setScrollState(scrollStates.traceView);
	        });

	        var context = w.context;
	        for (var n = 0; n < context.frames.length; n++) {
	            var frame = context.frames[n];
	            this.listing.appendValue(frame);
	        }
	        if (context.frames.length > 0) {
	            this.listing.selectValue(context.frames[context.frames.length - 1]);
	        }

	        this.layout = function () {
	            if (this.traceView.layout) this.traceView.layout();
	        };
	    };

	    return TraceTab;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(5)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, EventSource) {

	    var LeftListing = function LeftListing(w, elementRoot, cssBase, itemGenerator) {
	        var self = this;
	        this.window = w;
	        this.elements = {
	            list: elementRoot.getElementsByClassName("window-left-listing")[0],
	            toolbar: elementRoot.getElementsByClassName("window-left-toolbar")[0]
	        };

	        // Hide toolbar until the first button is added
	        this.toolbarHeight = this.elements.toolbar.style.height;
	        this.elements.toolbar.style.display = "none";
	        this.elements.toolbar.style.height = "0px";
	        this.elements.list.style.bottom = "0px";

	        this.cssBase = cssBase;
	        this.itemGenerator = itemGenerator;

	        this.valueEntries = [];

	        this.previousSelection = null;

	        this.valueSelected = new EventSource("valueSelected");
	    };

	    LeftListing.prototype.addButton = function (name) {
	        // Show the toolbar
	        this.elements.toolbar.style.display = "";
	        this.elements.toolbar.style.height = this.toolbarHeight;
	        this.elements.list.style.bottom = this.toolbarHeight;

	        var event = new EventSource("buttonClicked");

	        var buttonEl = document.createElement("div");
	        buttonEl.className = "mini-button";

	        var leftEl = document.createElement("div");
	        leftEl.className = "mini-button-left";
	        buttonEl.appendChild(leftEl);

	        var spanEl = document.createElement("div");
	        spanEl.className = "mini-button-span";
	        spanEl.textContent = name;
	        buttonEl.appendChild(spanEl);

	        var rightEl = document.createElement("div");
	        rightEl.className = "mini-button-right";
	        buttonEl.appendChild(rightEl);

	        this.elements.toolbar.appendChild(buttonEl);

	        buttonEl.onclick = function (e) {
	            event.fire();
	            e.preventDefault();
	            e.stopPropagation();
	        };

	        return event;
	    };

	    LeftListing.prototype.appendValue = function (value) {
	        var self = this;
	        var document = this.window.document;

	        // <div class="XXXX-item">
	        //     ??
	        // </div>

	        var el = document.createElement("div");
	        el.className = this.cssBase + "-item listing-item";

	        this.itemGenerator(el, value);

	        this.elements.list.appendChild(el);

	        el.onclick = function () {
	            self.selectValue(value);
	        };

	        this.valueEntries.push({
	            value: value,
	            element: el
	        });
	        value.uielement = el;
	    };

	    LeftListing.prototype.resort = function () {
	        // TODO: restort
	    };

	    LeftListing.prototype.removeValue = function (value) {};

	    LeftListing.prototype.selectValue = function (value) {
	        if (this.previousSelection) {
	            var el = this.previousSelection.element;
	            el.className = el.className.replace(" " + this.cssBase + "-item-selected listing-item-selected", "");
	            this.previousSelection = null;
	        }

	        var valueObj = null;
	        for (var n = 0; n < this.valueEntries.length; n++) {
	            if (this.valueEntries[n].value == value) {
	                valueObj = this.valueEntries[n];
	                break;
	            }
	        }
	        this.previousSelection = valueObj;
	        if (valueObj) {
	            valueObj.element.className += " " + this.cssBase + "-item-selected listing-item-selected";
	        }

	        if (value) {
	            base.scrollIntoViewIfNeeded(value.uielement);
	        }

	        this.valueSelected.fire(value);
	    };

	    LeftListing.prototype.getScrollState = function () {
	        return {
	            list: this.elements.list.scrollTop
	        };
	    };

	    LeftListing.prototype.setScrollState = function (state) {
	        if (!state) {
	            return;
	        }
	        this.elements.list.scrollTop = state.list;
	    };

	    return LeftListing;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(10), __webpack_require__(35), __webpack_require__(36), __webpack_require__(37), __webpack_require__(41), __webpack_require__(42), __webpack_require__(39), __webpack_require__(44)], __WEBPACK_AMD_DEFINE_RESULT__ = function (info, settings, RedundancyChecker, PixelHistory, PopupWindow, SurfaceInspector, TexturePreviewGenerator, traceLine, TraceListing) {

	    var TraceMinibar = function TraceMinibar(view, w, elementRoot) {
	        var self = this;
	        this.view = view;
	        this.window = w;
	        this.elements = {
	            bar: elementRoot.getElementsByClassName("trace-minibar")[0]
	        };
	        this.buttons = {};
	        this.toggles = {};

	        this.controller = w.controller;

	        this.controller.stepCompleted.addListener(this, function (callIndex) {
	            if (callIndex == 0) {
	                self.lastCallIndex = null;
	            } else {
	                self.lastCallIndex = callIndex - 1;
	            }
	        });

	        var buttonHandlers = {};

	        function addButton(bar, name, tip, callback) {
	            var el = w.document.createElement("div");
	            el.className = "trace-minibar-button trace-minibar-button-disabled trace-minibar-command-" + name;

	            el.title = tip;
	            el.textContent = " ";

	            el.onclick = function () {
	                if (el.className.indexOf("disabled") != -1) {
	                    return;
	                }
	                callback.apply(self);
	            };
	            buttonHandlers[name] = callback;

	            bar.appendChild(el);

	            self.buttons[name] = el;
	        };

	        addButton(this.elements.bar, "run", "Playback entire frame (F9)", function () {
	            this.controller.stepUntilEnd();
	            this.refreshState();
	        });
	        addButton(this.elements.bar, "step-forward", "Step forward one call (F8)", function () {
	            if (this.controller.stepForward() == false) {
	                this.controller.reset();
	                this.controller.openFrame(this.view.frame);
	                this.controller.stepForward();
	            }
	            this.refreshState();
	        });
	        addButton(this.elements.bar, "step-back", "Step backward one call (F6)", function () {
	            this.controller.stepBackward();
	            this.refreshState();
	        });
	        addButton(this.elements.bar, "step-until-draw", "Skip to the next draw call (F7)", function () {
	            this.controller.stepUntilDraw();
	            this.refreshState();
	        });
	        /*
	        addButton(this.elements.bar, "step-until-error", "Run until an error occurs", function () {
	        alert("step-until-error");
	        this.controller.stepUntilError();
	        this.refreshState();
	        });
	        */
	        addButton(this.elements.bar, "restart", "Restart from the beginning of the frame (F10)", function () {
	            this.controller.openFrame(this.view.frame);
	            this.controller.stepForward();
	            this.refreshState();
	        });

	        // TODO: move to shared code
	        function addToggle(bar, defaultValue, name, tip, callback) {
	            var input = w.document.createElement("input");
	            input.style.width = "inherit";
	            input.style.height = "inherit";

	            input.type = "checkbox";
	            input.title = tip;
	            input.checked = defaultValue;

	            input.onchange = function () {
	                callback.apply(self, [input.checked]);
	            };

	            var span = w.document.createElement("span");
	            span.textContent = " " + name;

	            span.onclick = function () {
	                input.checked = !input.checked;
	                callback.apply(self, [input.checked]);
	            };

	            var el = w.document.createElement("div");
	            el.className = "trace-minibar-toggle";
	            el.appendChild(input);
	            el.appendChild(span);

	            bar.appendChild(el);

	            callback.apply(self, [defaultValue]);

	            self.toggles[name] = input;
	        };

	        var traceCallRedundantBackgroundColor = "#FFFFD1";
	        var redundantStylesheet = w.document.createElement("style");
	        redundantStylesheet.type = "text/css";
	        redundantStylesheet.appendChild(w.document.createTextNode(".trace-call-redundant { background-color: " + traceCallRedundantBackgroundColor + "; }"));
	        w.document.getElementsByTagName("head")[0].appendChild(redundantStylesheet);
	        var stylesheet = null;
	        for (var n = 0; n < w.document.styleSheets.length; n++) {
	            var ss = w.document.styleSheets[n];
	            if (ss.ownerNode == redundantStylesheet) {
	                stylesheet = ss;
	                break;
	            }
	        }
	        var redundantRule = null;
	        // Grabbed on demand in case it hasn't loaded yet

	        var defaultShowRedundant = settings.session.showRedundantCalls;
	        addToggle(this.elements.bar, defaultShowRedundant, "Redundant Calls", "Display redundant calls in yellow", function (checked) {
	            if (!stylesheet) {
	                return;
	            }
	            if (!redundantRule) {
	                for (var n = 0; n < stylesheet.cssRules.length; n++) {
	                    var rule = stylesheet.cssRules[n];
	                    if (rule.selectorText == ".trace-call-redundant") {
	                        redundantRule = rule;
	                        break;
	                    }
	                }
	            }

	            if (checked) {
	                redundantRule.style.backgroundColor = traceCallRedundantBackgroundColor;
	            } else {
	                redundantRule.style.backgroundColor = "transparent";
	            }

	            settings.session.showRedundantCalls = checked;
	            settings.save();
	        });

	        w.document.addEventListener("keydown", function (event) {
	            var handled = false;
	            switch (event.keyCode) {
	                case 117:
	                    // F6
	                    buttonHandlers["step-back"].apply(self);
	                    handled = true;
	                    break;
	                case 118:
	                    // F7
	                    buttonHandlers["step-until-draw"].apply(self);
	                    handled = true;
	                    break;
	                case 119:
	                    // F8
	                    buttonHandlers["step-forward"].apply(self);
	                    handled = true;
	                    break;
	                case 120:
	                    // F9
	                    buttonHandlers["run"].apply(self);
	                    handled = true;
	                    break;
	                case 121:
	                    // F10
	                    buttonHandlers["restart"].apply(self);
	                    handled = true;
	                    break;
	            };

	            if (handled) {
	                event.preventDefault();
	                event.stopPropagation();
	            }
	        }, false);

	        //this.update();
	    };
	    TraceMinibar.prototype.refreshState = function (ignoreScroll) {
	        //var newState = new StateCapture(this.replaygl);
	        if (this.lastCallIndex != null) {
	            this.view.traceListing.setActiveCall(this.lastCallIndex, ignoreScroll);
	        }
	        //this.window.stateHUD.showState(newState);
	        //this.window.outputHUD.refresh();

	        if (this.view.frame) {
	            this.view.updateActiveFramebuffer();
	        }
	    };
	    TraceMinibar.prototype.stepUntil = function (callIndex) {
	        if (this.controller.callIndex > callIndex) {
	            this.controller.reset();
	            this.controller.openFrame(this.view.frame, true);
	            this.controller.stepUntil(callIndex);
	        } else {
	            this.controller.stepUntil(callIndex);
	        }
	        this.refreshState();
	    };
	    TraceMinibar.prototype.reset = function () {
	        this.update();
	    };
	    TraceMinibar.prototype.update = function () {
	        var self = this;

	        if (this.view.frame) {
	            this.controller.reset();
	            this.controller.runFrame(this.view.frame);
	            this.controller.openFrame(this.view.frame);
	        } else {
	            this.controller.reset();
	            // TODO: clear canvas
	            //console.log("would clear canvas");
	        }

	        function toggleButton(name, enabled) {
	            var el = self.buttons[name];
	            if (el) {
	                if (enabled) {
	                    el.className = el.className.replace("trace-minibar-button-disabled", "trace-minibar-button-enabled");
	                } else {
	                    el.className = el.className.replace("trace-minibar-button-enabled", "trace-minibar-button-disabled");
	                }
	            }
	        };

	        for (var n in this.buttons) {
	            toggleButton(n, false);
	        }

	        toggleButton("run", true);
	        toggleButton("step-forward", true);
	        toggleButton("step-back", true);
	        toggleButton("step-until-error", true);
	        toggleButton("step-until-draw", true);
	        toggleButton("restart", true);

	        this.refreshState();

	        //this.window.outputHUD.refresh();
	    };

	    var TraceView = function TraceView(w, elementRoot) {
	        var self = this;
	        var context = w.context;
	        this.window = w;
	        this.elements = {};
	        this.minibar = new TraceMinibar(this, w, elementRoot);
	        this.traceListing = new TraceListing(this, w, elementRoot);
	        this.inspectorElements = {
	            "window-trace-outer": elementRoot.getElementsByClassName("window-trace-outer")[0],
	            "window-trace": elementRoot.getElementsByClassName("window-trace")[0],
	            "window-trace-inspector": elementRoot.getElementsByClassName("window-trace-inspector")[0],
	            "trace-minibar": elementRoot.getElementsByClassName("trace-minibar")[0]
	        };
	        this.inspector = new SurfaceInspector(this, w, elementRoot, {
	            splitterKey: 'traceSplitter',
	            title: 'Replay Preview',
	            selectionName: 'Buffer',
	            selectionValues: null /* set later */
	        });
	        this.inspector.activeFramebuffers = [];
	        this.inspector.querySize = function () {
	            if (this.activeFramebuffers) {
	                var framebuffer = this.activeFramebuffers[this.optionsList.selectedIndex];
	                if (framebuffer) {
	                    var gl = this.gl;
	                    var originalFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	                    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.mirror.target);
	                    var texture = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
	                    gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
	                    if (texture && texture.trackedObject) {
	                        return texture.trackedObject.guessSize(gl);
	                    }
	                }
	            }
	            return [context.canvas.width, context.canvas.height];
	        };
	        this.inspector.reset = function () {
	            this.layout();
	            if (w.windows.pixelHistory) {
	                if (w.windows.pixelHistory.isOpened()) {
	                    w.windows.pixelHistory.clear();
	                } else {
	                    w.windows.pixelHistory.close();
	                }
	            }
	            if (w.windows.drawInfo) {
	                if (w.windows.drawInfo.isOpened()) {
	                    w.windows.drawInfo.clear();
	                } else {
	                    w.windows.drawInfo.close();
	                }
	            }
	        };
	        this.inspector.inspectPixel = function (x, y, locationString) {
	            if (!self.frame) {
	                return;
	            }
	            PopupWindow.show(w.context, PixelHistory, "pixelHistory", function (popup) {
	                popup.inspectPixel(self.frame, x, y, locationString);
	            });
	        };
	        this.inspector.setupPreview = function () {
	            if (this.previewer) {
	                return;
	            }
	            this.previewer = new TexturePreviewGenerator(this.canvas, true);
	            this.gl = this.previewer.gl;
	        };
	        this.inspector.updatePreview = function () {
	            this.layout();

	            var gl = this.gl;
	            gl.flush();

	            // NOTE: index 0 is always null
	            var framebuffer = this.activeFramebuffers[this.optionsList.selectedIndex];
	            if (!framebuffer) {
	                // Default framebuffer - redraw everything up to the current call (required as we've thrown out everything)
	                this.canvas.width = context.canvas.width;
	                this.canvas.height = context.canvas.height;
	            }

	            var controller = self.window.controller;
	            var callIndex = controller.callIndex;
	            controller.reset();
	            controller.openFrame(self.frame, true);
	            controller.stepUntil(callIndex - 1);

	            if (framebuffer) {
	                // User framebuffer - draw quad with the contents of the framebuffer
	                var originalFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.mirror.target);
	                var texture = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
	                gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
	                if (texture) {
	                    texture = texture.trackedObject;
	                }
	                if (texture) {
	                    var size = texture.guessSize(gl);
	                    var desiredWidth = 1;
	                    var desiredHeight = 1;
	                    if (size) {
	                        desiredWidth = size[0];
	                        desiredHeight = size[1];
	                        this.canvas.style.display = "";
	                    } else {
	                        this.canvas.style.display = "none";
	                    }
	                    this.previewer.draw(texture, texture.currentVersion, null, desiredWidth, desiredHeight);
	                } else {
	                    // ?
	                    console.log("invalid framebuffer attachment");
	                    this.canvas.style.display = "none";
	                }
	            }
	        };

	        var canvas = this.inspector.canvas;
	        canvas.style.display = "";
	        w.controller.setOutput(canvas);
	        // TODO: watch for parent canvas size changes and update
	        canvas.width = this.window.context.canvas.width;
	        canvas.height = this.window.context.canvas.height;
	    };

	    TraceView.prototype.setInspectorWidth = function (newWidth) {
	        //.window-trace-outer margin-left: -480px !important; /* -2 * window-inspector.width */
	        //.window-trace margin-left: 240px !important;
	        //.trace-minibar right: 240px; /* window-trace-inspector */
	        //.trace-listing right: 240px; /* window-trace-inspector */
	        this.inspectorElements["window-trace-outer"].style.marginLeft = -2 * newWidth + "px";
	        this.inspectorElements["window-trace"].style.marginLeft = newWidth + "px";
	        this.inspectorElements["window-trace-inspector"].style.width = newWidth + "px";
	        this.inspectorElements["trace-minibar"].style.right = newWidth + "px";
	        this.traceListing.elements.list.style.right = newWidth + "px";
	    };

	    TraceView.prototype.layout = function () {
	        if (this.inspector) this.inspector.layout();
	    };

	    TraceView.prototype.reset = function () {
	        this.frame = null;

	        this.minibar.reset();
	        this.traceListing.reset();
	        this.inspector.reset();
	    };

	    TraceView.prototype.setFrame = function (frame) {
	        var gl = this.window.context;

	        this.reset();
	        this.frame = frame;

	        // Check for redundancy, if required
	        RedundancyChecker.checkFrame(frame);

	        // Find interesting calls
	        var bindFramebufferCalls = [];
	        var errorCalls = [];
	        for (var n = 0; n < frame.calls.length; n++) {
	            var call = frame.calls[n];
	            if (call.name == "bindFramebuffer") {
	                bindFramebufferCalls.push(call);
	            }
	            if (call.error) {
	                errorCalls.push(call);
	            }
	        }

	        // Setup support for multiple framebuffers
	        var activeFramebuffers = [];
	        if (bindFramebufferCalls.length > 0) {
	            for (var n = 0; n < bindFramebufferCalls.length; n++) {
	                var call = bindFramebufferCalls[n];
	                var framebuffer = call.args[1];
	                if (framebuffer) {
	                    if (activeFramebuffers.indexOf(framebuffer) == -1) {
	                        activeFramebuffers.push(framebuffer);
	                    }
	                }
	            }
	        }
	        if (activeFramebuffers.length) {
	            var names = [];
	            // Index 0 is always default - push to activeFramebuffers to keep consistent
	            activeFramebuffers.unshift(null);
	            for (var n = 0; n < activeFramebuffers.length; n++) {
	                var framebuffer = activeFramebuffers[n];
	                if (framebuffer) {
	                    names.push(framebuffer.getName());
	                } else {
	                    names.push("Default");
	                }
	            }
	            this.inspector.setSelectionValues(names);
	            this.inspector.elements.faces.style.display = "";
	            this.inspector.optionsList.selectedIndex = 0;
	        } else {
	            this.inspector.setSelectionValues(null);
	            this.inspector.elements.faces.style.display = "none";
	        }
	        this.inspector.activeOption = 0;
	        this.inspector.activeFramebuffers = activeFramebuffers;

	        // Print out errors to console
	        if (errorCalls.length) {
	            console.log(" ");
	            console.log("Frame " + frame.frameNumber + " errors:");
	            console.log("----------------------");
	            for (var n = 0; n < errorCalls.length; n++) {
	                var call = errorCalls[n];

	                var callString = traceLine.populateCallString(this.window.context, call);
	                var errorString = info.enumToString(call.error);
	                console.log(" " + errorString + " <= " + callString);

	                // Stack (if present)
	                if (call.stack) {
	                    for (var m = 0; m < call.stack.length; m++) {
	                        console.log("   - " + call.stack[m]);
	                    }
	                }
	            }
	            console.log(" ");
	        }

	        // Run the frame
	        this.traceListing.setFrame(frame);
	        this.minibar.update();
	        this.traceListing.scrollToCall(0);
	    };

	    TraceView.prototype.guessActiveFramebuffer = function (callIndex) {
	        // Can't trust the current state, so walk the calls to try to find a bindFramebuffer call
	        for (var n = this.minibar.lastCallIndex - 1; n >= 0; n--) {
	            var call = this.frame.calls[n];
	            if (call.info.name == "bindFramebuffer") {
	                return call.args[1];
	                break;
	            }
	        }
	        return null;
	    };

	    TraceView.prototype.updateActiveFramebuffer = function () {
	        var gl = this.window.controller.output.gl;

	        var callIndex = this.minibar.lastCallIndex - 1;
	        var framebuffer = this.guessActiveFramebuffer(callIndex);

	        if (this.inspector.activeFramebuffers.length) {
	            for (var n = 0; n < this.inspector.activeFramebuffers.length; n++) {
	                if (this.inspector.activeFramebuffers[n] == framebuffer) {
	                    // Found in list at index n
	                    if (this.inspector.optionsList.selectedIndex != n) {
	                        // Differs - update to current
	                        this.inspector.optionsList.selectedIndex = n;
	                        this.inspector.activeOption = n;
	                        this.inspector.updatePreview();
	                    } else {
	                        // Same - nothing to do
	                        this.inspector.updatePreview();
	                    }
	                    break;
	                }
	            }
	        }
	    };

	    TraceView.prototype.stepUntil = function (callIndex) {
	        this.minibar.stepUntil(callIndex);
	    };

	    TraceView.prototype.getScrollState = function () {
	        return {
	            listing: this.traceListing.getScrollState()
	        };
	    };

	    TraceView.prototype.setScrollState = function (state) {
	        if (!state) {
	            return;
	        }
	        this.traceListing.setScrollState(state.listing);
	    };

	    return TraceView;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function (util) {

	    var RedundancyChecker = function RedundancyChecker() {
	        function prepareCanvas(canvas) {
	            var frag = document.createDocumentFragment();
	            frag.appendChild(canvas);
	            var gl = util.getWebGLContext(canvas);
	            return gl;
	        };
	        this.canvas = document.createElement("canvas");
	        var gl = this.gl = prepareCanvas(this.canvas);

	        // Cache off uniform name so that we can retrieve it later
	        var original_getUniformLocation = gl.getUniformLocation;
	        gl.getUniformLocation = function () {
	            var result = original_getUniformLocation.apply(gl, arguments);
	            if (result) {
	                var tracked = arguments[0].trackedObject;
	                result.sourceProgram = tracked;
	                result.sourceUniformName = arguments[1];
	            }
	            return result;
	        };
	    };

	    var stateCacheModifiers = {
	        activeTexture: function activeTexture(texture) {
	            this.stateCache["ACTIVE_TEXTURE"] = texture;
	        },
	        bindBuffer: function bindBuffer(target, buffer) {
	            switch (target) {
	                case this.ARRAY_BUFFER:
	                    this.stateCache["ARRAY_BUFFER_BINDING"] = buffer;
	                    break;
	                case this.ELEMENT_ARRAY_BUFFER:
	                    this.stateCache["ELEMENT_ARRAY_BUFFER_BINDING"] = buffer;
	                    break;
	            }
	        },
	        bindFramebuffer: function bindFramebuffer(target, framebuffer) {
	            this.stateCache["FRAMEBUFFER_BINDING"] = framebuffer;
	        },
	        bindRenderbuffer: function bindRenderbuffer(target, renderbuffer) {
	            this.stateCache["RENDERBUFFER_BINDING"] = renderbuffer;
	        },
	        bindTexture: function bindTexture(target, texture) {
	            var activeTexture = this.stateCache["ACTIVE_TEXTURE"] - this.TEXTURE0;
	            switch (target) {
	                case this.TEXTURE_2D:
	                    this.stateCache["TEXTURE_BINDING_2D_" + activeTexture] = texture;
	                    break;
	                case this.TEXTURE_CUBE_MAP:
	                    this.stateCache["TEXTURE_BINDING_CUBE_MAP_" + activeTexture] = texture;
	                    break;
	                case this.TEXTURE_3D:
	                    this.stateCache["TEXTURE_BINDING_3D_" + activeTexture] = texture;
	                    break;
	                case this.TEXTURE_2D_ARRAY:
	                    this.stateCache["TEXTURE_BINDING_2D_ARRAY_" + activeTexture] = texture;
	                    break;
	            }
	        },
	        blendEquation: function blendEquation(mode) {
	            this.stateCache["BLEND_EQUATION_RGB"] = mode;
	            this.stateCache["BLEND_EQUATION_ALPHA"] = mode;
	        },
	        blendEquationSeparate: function blendEquationSeparate(modeRGB, modeAlpha) {
	            this.stateCache["BLEND_EQUATION_RGB"] = modeRGB;
	            this.stateCache["BLEND_EQUATION_ALPHA"] = modeAlpha;
	        },
	        blendFunc: function blendFunc(sfactor, dfactor) {
	            this.stateCache["BLEND_SRC_RGB"] = sfactor;
	            this.stateCache["BLEND_SRC_ALPHA"] = sfactor;
	            this.stateCache["BLEND_DST_RGB"] = dfactor;
	            this.stateCache["BLEND_DST_ALPHA"] = dfactor;
	        },
	        blendFuncSeparate: function blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha) {
	            this.stateCache["BLEND_SRC_RGB"] = srcRGB;
	            this.stateCache["BLEND_SRC_ALPHA"] = srcAlpha;
	            this.stateCache["BLEND_DST_RGB"] = dstRGB;
	            this.stateCache["BLEND_DST_ALPHA"] = dstAlpha;
	        },
	        clearColor: function clearColor(red, green, blue, alpha) {
	            this.stateCache["COLOR_CLEAR_VALUE"] = [red, green, blue, alpha];
	        },
	        clearDepth: function clearDepth(depth) {
	            this.stateCache["DEPTH_CLEAR_VALUE"] = depth;
	        },
	        clearStencil: function clearStencil(s) {
	            this.stateCache["STENCIL_CLEAR_VALUE"] = s;
	        },
	        colorMask: function colorMask(red, green, blue, alpha) {
	            this.stateCache["COLOR_WRITEMASK"] = [red, green, blue, alpha];
	        },
	        cullFace: function cullFace(mode) {
	            this.stateCache["CULL_FACE_MODE"] = mode;
	        },
	        depthFunc: function depthFunc(func) {
	            this.stateCache["DEPTH_FUNC"] = func;
	        },
	        depthMask: function depthMask(flag) {
	            this.stateCache["DEPTH_WRITEMASK"] = flag;
	        },
	        depthRange: function depthRange(zNear, zFar) {
	            this.stateCache["DEPTH_RANGE"] = [zNear, zFar];
	        },
	        disable: function disable(cap) {
	            switch (cap) {
	                case this.BLEND:
	                    this.stateCache["BLEND"] = false;
	                    break;
	                case this.CULL_FACE:
	                    this.stateCache["CULL_FACE"] = false;
	                    break;
	                case this.DEPTH_TEST:
	                    this.stateCache["DEPTH_TEST"] = false;
	                    break;
	                case this.POLYGON_OFFSET_FILL:
	                    this.stateCache["POLYGON_OFFSET_FILL"] = false;
	                    break;
	                case this.SAMPLE_ALPHA_TO_COVERAGE:
	                    this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] = false;
	                    break;
	                case this.SAMPLE_COVERAGE:
	                    this.stateCache["SAMPLE_COVERAGE"] = false;
	                    break;
	                case this.SCISSOR_TEST:
	                    this.stateCache["SCISSOR_TEST"] = false;
	                    break;
	                case this.STENCIL_TEST:
	                    this.stateCache["STENCIL_TEST"] = false;
	                    break;
	            }
	        },
	        disableVertexAttribArray: function disableVertexAttribArray(index) {
	            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] = false;
	        },
	        enable: function enable(cap) {
	            switch (cap) {
	                case this.BLEND:
	                    this.stateCache["BLEND"] = true;
	                    break;
	                case this.CULL_FACE:
	                    this.stateCache["CULL_FACE"] = true;
	                    break;
	                case this.DEPTH_TEST:
	                    this.stateCache["DEPTH_TEST"] = true;
	                    break;
	                case this.POLYGON_OFFSET_FILL:
	                    this.stateCache["POLYGON_OFFSET_FILL"] = true;
	                    break;
	                case this.SAMPLE_ALPHA_TO_COVERAGE:
	                    this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] = true;
	                    break;
	                case this.SAMPLE_COVERAGE:
	                    this.stateCache["SAMPLE_COVERAGE"] = true;
	                    break;
	                case this.SCISSOR_TEST:
	                    this.stateCache["SCISSOR_TEST"] = true;
	                    break;
	                case this.STENCIL_TEST:
	                    this.stateCache["STENCIL_TEST"] = true;
	                    break;
	            }
	        },
	        enableVertexAttribArray: function enableVertexAttribArray(index) {
	            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] = true;
	        },
	        frontFace: function frontFace(mode) {
	            this.stateCache["FRONT_FACE"] = mode;
	        },
	        hint: function hint(target, mode) {
	            switch (target) {
	                case this.GENERATE_MIPMAP_HINT:
	                    this.stateCache["GENERATE_MIPMAP_HINT"] = mode;
	                    break;
	            }
	        },
	        lineWidth: function lineWidth(width) {
	            this.stateCache["LINE_WIDTH"] = width;
	        },
	        pixelStorei: function pixelStorei(pname, param) {
	            switch (pname) {
	                case this.PACK_ALIGNMENT:
	                    this.stateCache["PACK_ALIGNMENT"] = param;
	                    break;
	                case this.UNPACK_ALIGNMENT:
	                    this.stateCache["UNPACK_ALIGNMENT"] = param;
	                    break;
	                case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
	                    this.stateCache["UNPACK_COLORSPACE_CONVERSION_WEBGL"] = param;
	                    break;
	                case this.UNPACK_FLIP_Y_WEBGL:
	                    this.stateCache["UNPACK_FLIP_Y_WEBGL"] = param;
	                    break;
	                case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
	                    this.stateCache["UNPACK_PREMULTIPLY_ALPHA_WEBGL"] = param;
	                    break;
	            }
	        },
	        polygonOffset: function polygonOffset(factor, units) {
	            this.stateCache["POLYGON_OFFSET_FACTOR"] = factor;
	            this.stateCache["POLYGON_OFFSET_UNITS"] = units;
	        },
	        sampleCoverage: function sampleCoverage(value, invert) {
	            this.stateCache["SAMPLE_COVERAGE_VALUE"] = value;
	            this.stateCache["SAMPLE_COVERAGE_INVERT"] = invert;
	        },
	        scissor: function scissor(x, y, width, height) {
	            this.stateCache["SCISSOR_BOX"] = [x, y, width, height];
	        },
	        stencilFunc: function stencilFunc(func, ref, mask) {
	            this.stateCache["STENCIL_FUNC"] = func;
	            this.stateCache["STENCIL_REF"] = ref;
	            this.stateCache["STENCIL_VALUE_MASK"] = mask;
	            this.stateCache["STENCIL_BACK_FUNC"] = func;
	            this.stateCache["STENCIL_BACK_REF"] = ref;
	            this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
	        },
	        stencilFuncSeparate: function stencilFuncSeparate(face, func, ref, mask) {
	            switch (face) {
	                case this.FRONT:
	                    this.stateCache["STENCIL_FUNC"] = func;
	                    this.stateCache["STENCIL_REF"] = ref;
	                    this.stateCache["STENCIL_VALUE_MASK"] = mask;
	                    break;
	                case this.BACK:
	                    this.stateCache["STENCIL_BACK_FUNC"] = func;
	                    this.stateCache["STENCIL_BACK_REF"] = ref;
	                    this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
	                    break;
	                case this.FRONT_AND_BACK:
	                    this.stateCache["STENCIL_FUNC"] = func;
	                    this.stateCache["STENCIL_REF"] = ref;
	                    this.stateCache["STENCIL_VALUE_MASK"] = mask;
	                    this.stateCache["STENCIL_BACK_FUNC"] = func;
	                    this.stateCache["STENCIL_BACK_REF"] = ref;
	                    this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
	                    break;
	            }
	        },
	        stencilMask: function stencilMask(mask) {
	            this.stateCache["STENCIL_WRITEMASK"] = mask;
	            this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
	        },
	        stencilMaskSeparate: function stencilMaskSeparate(face, mask) {
	            switch (face) {
	                case this.FRONT:
	                    this.stateCache["STENCIL_WRITEMASK"] = mask;
	                    break;
	                case this.BACK:
	                    this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
	                    break;
	                case this.FRONT_AND_BACK:
	                    this.stateCache["STENCIL_WRITEMASK"] = mask;
	                    this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
	                    break;
	            }
	        },
	        stencilOp: function stencilOp(fail, zfail, zpass) {
	            this.stateCache["STENCIL_FAIL"] = fail;
	            this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
	            this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
	            this.stateCache["STENCIL_BACK_FAIL"] = fail;
	            this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
	            this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
	        },
	        stencilOpSeparate: function stencilOpSeparate(face, fail, zfail, zpass) {
	            switch (face) {
	                case this.FRONT:
	                    this.stateCache["STENCIL_FAIL"] = fail;
	                    this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
	                    this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
	                    break;
	                case this.BACK:
	                    this.stateCache["STENCIL_BACK_FAIL"] = fail;
	                    this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
	                    this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
	                    break;
	                case this.FRONT_AND_BACK:
	                    this.stateCache["STENCIL_FAIL"] = fail;
	                    this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
	                    this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
	                    this.stateCache["STENCIL_BACK_FAIL"] = fail;
	                    this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
	                    this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
	                    break;
	            }
	        },
	        uniformN: function uniformN(location, v) {
	            if (!location) {
	                return;
	            }
	            var program = location.sourceProgram;
	            if (v.slice !== undefined) {
	                v = v.slice();
	            } else {
	                v = new Float32Array(v);
	            }
	            program.uniformCache[location.sourceUniformName] = v;
	        },
	        uniform1f: function uniform1f(location, v0) {
	            stateCacheModifiers.uniformN.call(this, location, [v0]);
	        },
	        uniform2f: function uniform2f(location, v0, v1) {
	            stateCacheModifiers.uniformN.call(this, location, [v0, v1]);
	        },
	        uniform3f: function uniform3f(location, v0, v1, v2) {
	            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2]);
	        },
	        uniform4f: function uniform4f(location, v0, v1, v2, v3) {
	            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2, v3]);
	        },
	        uniform1i: function uniform1i(location, v0) {
	            stateCacheModifiers.uniformN.call(this, location, [v0]);
	        },
	        uniform2i: function uniform2i(location, v0, v1) {
	            stateCacheModifiers.uniformN.call(this, location, [v0, v1]);
	        },
	        uniform3i: function uniform3i(location, v0, v1, v2) {
	            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2]);
	        },
	        uniform4i: function uniform4i(location, v0, v1, v2, v3) {
	            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2, v3]);
	        },
	        uniform1fv: function uniform1fv(location, v) {
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniform2fv: function uniform2fv(location, v) {
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniform3fv: function uniform3fv(location, v) {
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniform4fv: function uniform4fv(location, v) {
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniform1iv: function uniform1iv(location, v) {
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniform2iv: function uniform2iv(location, v) {
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniform3iv: function uniform3iv(location, v) {
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniform4iv: function uniform4iv(location, v) {
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniformMatrix2fv: function uniformMatrix2fv(location, transpose, v) {
	            // TODO: transpose
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniformMatrix3fv: function uniformMatrix3fv(location, transpose, v) {
	            // TODO: transpose
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        uniformMatrix4fv: function uniformMatrix4fv(location, transpose, v) {
	            // TODO: transpose
	            stateCacheModifiers.uniformN.call(this, location, v);
	        },
	        useProgram: function useProgram(program) {
	            this.stateCache["CURRENT_PROGRAM"] = program;
	        },
	        vertexAttrib1f: function vertexAttrib1f(indx, x) {
	            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, 0, 0, 1];
	        },
	        vertexAttrib2f: function vertexAttrib2f(indx, x, y) {
	            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, 0, 1];
	        },
	        vertexAttrib3f: function vertexAttrib3f(indx, x, y, z) {
	            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, z, 1];
	        },
	        vertexAttrib4f: function vertexAttrib4f(indx, x, y, z, w) {
	            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, z, w];
	        },
	        vertexAttrib1fv: function vertexAttrib1fv(indx, v) {
	            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], 0, 0, 1];
	        },
	        vertexAttrib2fv: function vertexAttrib2fv(indx, v) {
	            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], 0, 1];
	        },
	        vertexAttrib3fv: function vertexAttrib3fv(indx, v) {
	            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], v[2], 1];
	        },
	        vertexAttrib4fv: function vertexAttrib4fv(indx, v) {
	            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], v[2], v[3]];
	        },
	        vertexAttribPointer: function vertexAttribPointer(indx, size, type, normalized, stride, offset) {
	            this.stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + indx] = size;
	            this.stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + indx] = type;
	            this.stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + indx] = normalized;
	            this.stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + indx] = stride;
	            this.stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + indx] = offset;
	            this.stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + indx] = this.stateCache["ARRAY_BUFFER_BINDING"];
	        },
	        viewport: function viewport(x, y, width, height) {
	            this.stateCache["VIEWPORT"] = [x, y, width, height];
	        }
	    };

	    var redundantChecks = {
	        activeTexture: function activeTexture(texture) {
	            return this.stateCache["ACTIVE_TEXTURE"] == texture;
	        },
	        bindBuffer: function bindBuffer(target, buffer) {
	            switch (target) {
	                case this.ARRAY_BUFFER:
	                    return this.stateCache["ARRAY_BUFFER_BINDING"] == buffer;
	                case this.ELEMENT_ARRAY_BUFFER:
	                    return this.stateCache["ELEMENT_ARRAY_BUFFER_BINDING"] == buffer;
	                default:
	                    return false;
	            }
	        },
	        bindFramebuffer: function bindFramebuffer(target, framebuffer) {
	            return this.stateCache["FRAMEBUFFER_BINDING"] == framebuffer;
	        },
	        bindRenderbuffer: function bindRenderbuffer(target, renderbuffer) {
	            return this.stateCache["RENDERBUFFER_BINDING"] == renderbuffer;
	        },
	        bindTexture: function bindTexture(target, texture) {
	            var activeTexture = this.stateCache["ACTIVE_TEXTURE"] - this.TEXTURE0;
	            switch (target) {
	                case this.TEXTURE_2D:
	                    return this.stateCache["TEXTURE_BINDING_2D_" + activeTexture] == texture;
	                case this.TEXTURE_CUBE_MAP:
	                    return this.stateCache["TEXTURE_BINDING_CUBE_MAP_" + activeTexture] == texture;
	                case this.TEXTURE_3D:
	                    return this.stateCache["TEXTURE_BINDING_3D_" + activeTexture] == texture;
	                case this.TEXTURE_2D_ARRAY:
	                    return this.stateCache["TEXTURE_BINDING_2D_ARRAY_" + activeTexture] == texture;
	            }
	            return false;
	        },
	        blendEquation: function blendEquation(mode) {
	            return this.stateCache["BLEND_EQUATION_RGB"] == mode && this.stateCache["BLEND_EQUATION_ALPHA"] == mode;
	        },
	        blendEquationSeparate: function blendEquationSeparate(modeRGB, modeAlpha) {
	            return this.stateCache["BLEND_EQUATION_RGB"] == modeRGB && this.stateCache["BLEND_EQUATION_ALPHA"] == modeAlpha;
	        },
	        blendFunc: function blendFunc(sfactor, dfactor) {
	            return this.stateCache["BLEND_SRC_RGB"] == sfactor && this.stateCache["BLEND_SRC_ALPHA"] == sfactor && this.stateCache["BLEND_DST_RGB"] == dfactor && this.stateCache["BLEND_DST_ALPHA"] == dfactor;
	        },
	        blendFuncSeparate: function blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha) {
	            return this.stateCache["BLEND_SRC_RGB"] == srcRGB && this.stateCache["BLEND_SRC_ALPHA"] == srcAlpha && this.stateCache["BLEND_DST_RGB"] == dstRGB && this.stateCache["BLEND_DST_ALPHA"] == dstAlpha;
	        },
	        clearColor: function clearColor(red, green, blue, alpha) {
	            return util.arrayCompare(this.stateCache["COLOR_CLEAR_VALUE"], [red, green, blue, alpha]);
	        },
	        clearDepth: function clearDepth(depth) {
	            return this.stateCache["DEPTH_CLEAR_VALUE"] == depth;
	        },
	        clearStencil: function clearStencil(s) {
	            return this.stateCache["STENCIL_CLEAR_VALUE"] == s;
	        },
	        colorMask: function colorMask(red, green, blue, alpha) {
	            return util.arrayCompare(this.stateCache["COLOR_WRITEMASK"], [red, green, blue, alpha]);
	        },
	        cullFace: function cullFace(mode) {
	            return this.stateCache["CULL_FACE_MODE"] == mode;
	        },
	        depthFunc: function depthFunc(func) {
	            return this.stateCache["DEPTH_FUNC"] == func;
	        },
	        depthMask: function depthMask(flag) {
	            return this.stateCache["DEPTH_WRITEMASK"] == flag;
	        },
	        depthRange: function depthRange(zNear, zFar) {
	            return util.arrayCompare(this.stateCache["DEPTH_RANGE"], [zNear, zFar]);
	        },
	        disable: function disable(cap) {
	            switch (cap) {
	                case this.BLEND:
	                    return this.stateCache["BLEND"] == false;
	                case this.CULL_FACE:
	                    return this.stateCache["CULL_FACE"] == false;
	                case this.DEPTH_TEST:
	                    return this.stateCache["DEPTH_TEST"] == false;
	                case this.POLYGON_OFFSET_FILL:
	                    return this.stateCache["POLYGON_OFFSET_FILL"] == false;
	                case this.SAMPLE_ALPHA_TO_COVERAGE:
	                    return this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] == false;
	                case this.SAMPLE_COVERAGE:
	                    return this.stateCache["SAMPLE_COVERAGE"] == false;
	                case this.SCISSOR_TEST:
	                    return this.stateCache["SCISSOR_TEST"] == false;
	                case this.STENCIL_TEST:
	                    return this.stateCache["STENCIL_TEST"] == false;
	                default:
	                    return false;
	            }
	        },
	        disableVertexAttribArray: function disableVertexAttribArray(index) {
	            return this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] == false;
	        },
	        enable: function enable(cap) {
	            switch (cap) {
	                case this.BLEND:
	                    return this.stateCache["BLEND"] == true;
	                case this.CULL_FACE:
	                    return this.stateCache["CULL_FACE"] == true;
	                case this.DEPTH_TEST:
	                    return this.stateCache["DEPTH_TEST"] == true;
	                case this.POLYGON_OFFSET_FILL:
	                    return this.stateCache["POLYGON_OFFSET_FILL"] == true;
	                case this.SAMPLE_ALPHA_TO_COVERAGE:
	                    return this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] == true;
	                case this.SAMPLE_COVERAGE:
	                    return this.stateCache["SAMPLE_COVERAGE"] == true;
	                case this.SCISSOR_TEST:
	                    return this.stateCache["SCISSOR_TEST"] == true;
	                case this.STENCIL_TEST:
	                    return this.stateCache["STENCIL_TEST"] == true;
	                default:
	                    return false;
	            }
	        },
	        enableVertexAttribArray: function enableVertexAttribArray(index) {
	            return this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] == true;
	        },
	        frontFace: function frontFace(mode) {
	            return this.stateCache["FRONT_FACE"] == mode;
	        },
	        hint: function hint(target, mode) {
	            switch (target) {
	                case this.GENERATE_MIPMAP_HINT:
	                    return this.stateCache["GENERATE_MIPMAP_HINT"] == mode;
	                default:
	                    return false;
	            }
	        },
	        lineWidth: function lineWidth(width) {
	            return this.stateCache["LINE_WIDTH"] == width;
	        },
	        pixelStorei: function pixelStorei(pname, param) {
	            switch (pname) {
	                case this.PACK_ALIGNMENT:
	                    return this.stateCache["PACK_ALIGNMENT"] == param;
	                case this.UNPACK_ALIGNMENT:
	                    return this.stateCache["UNPACK_ALIGNMENT"] == param;
	                case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
	                    return this.stateCache["UNPACK_COLORSPACE_CONVERSION_WEBGL"] == param;
	                case this.UNPACK_FLIP_Y_WEBGL:
	                    return this.stateCache["UNPACK_FLIP_Y_WEBGL"] == param;
	                case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
	                    return this.stateCache["UNPACK_PREMULTIPLY_ALPHA_WEBGL"] == param;
	                default:
	                    return false;
	            }
	        },
	        polygonOffset: function polygonOffset(factor, units) {
	            return this.stateCache["POLYGON_OFFSET_FACTOR"] == factor && this.stateCache["POLYGON_OFFSET_UNITS"] == units;
	        },
	        sampleCoverage: function sampleCoverage(value, invert) {
	            return this.stateCache["SAMPLE_COVERAGE_VALUE"] == value && this.stateCache["SAMPLE_COVERAGE_INVERT"] == invert;
	        },
	        scissor: function scissor(x, y, width, height) {
	            return util.arrayCompare(this.stateCache["SCISSOR_BOX"], [x, y, width, height]);
	        },
	        stencilFunc: function stencilFunc(func, ref, mask) {
	            return this.stateCache["STENCIL_FUNC"] == func && this.stateCache["STENCIL_REF"] == ref && this.stateCache["STENCIL_VALUE_MASK"] == mask && this.stateCache["STENCIL_BACK_FUNC"] == func && this.stateCache["STENCIL_BACK_REF"] == ref && this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask;
	        },
	        stencilFuncSeparate: function stencilFuncSeparate(face, func, ref, mask) {
	            switch (face) {
	                case this.FRONT:
	                    return this.stateCache["STENCIL_FUNC"] == func && this.stateCache["STENCIL_REF"] == ref && this.stateCache["STENCIL_VALUE_MASK"] == mask;
	                case this.BACK:
	                    return this.stateCache["STENCIL_BACK_FUNC"] == func && this.stateCache["STENCIL_BACK_REF"] == ref && this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask;
	                case this.FRONT_AND_BACK:
	                    return this.stateCache["STENCIL_FUNC"] == func && this.stateCache["STENCIL_REF"] == ref && this.stateCache["STENCIL_VALUE_MASK"] == mask && this.stateCache["STENCIL_BACK_FUNC"] == func && this.stateCache["STENCIL_BACK_REF"] == ref && this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask;
	                default:
	                    return false;
	            }
	        },
	        stencilMask: function stencilMask(mask) {
	            return this.stateCache["STENCIL_WRITEMASK"] == mask && this.stateCache["STENCIL_BACK_WRITEMASK"] == mask;
	        },
	        stencilMaskSeparate: function stencilMaskSeparate(face, mask) {
	            switch (face) {
	                case this.FRONT:
	                    return this.stateCache["STENCIL_WRITEMASK"] == mask;
	                case this.BACK:
	                    return this.stateCache["STENCIL_BACK_WRITEMASK"] == mask;
	                case this.FRONT_AND_BACK:
	                    return this.stateCache["STENCIL_WRITEMASK"] == mask && this.stateCache["STENCIL_BACK_WRITEMASK"] == mask;
	                default:
	                    return false;
	            }
	        },
	        stencilOp: function stencilOp(fail, zfail, zpass) {
	            return this.stateCache["STENCIL_FAIL"] == fail && this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail && this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass && this.stateCache["STENCIL_BACK_FAIL"] == fail && this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail && this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass;
	        },
	        stencilOpSeparate: function stencilOpSeparate(face, fail, zfail, zpass) {
	            switch (face) {
	                case this.FRONT:
	                    return this.stateCache["STENCIL_FAIL"] == fail && this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail && this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass;
	                case this.BACK:
	                    return this.stateCache["STENCIL_BACK_FAIL"] == fail && this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail && this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass;
	                case this.FRONT_AND_BACK:
	                    return this.stateCache["STENCIL_FAIL"] == fail && this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail && this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass && this.stateCache["STENCIL_BACK_FAIL"] == fail && this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail && this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass;
	                default:
	                    return false;
	            }
	        },
	        uniformN: function uniformN(location, v) {
	            if (!location) {
	                return true;
	            }
	            var program = location.sourceProgram;
	            if (!program.uniformCache) return false;
	            return util.arrayCompare(program.uniformCache[location.sourceUniformName], v);
	        },
	        uniform1f: function uniform1f(location, v0) {
	            return redundantChecks.uniformN.call(this, location, [v0]);
	        },
	        uniform2f: function uniform2f(location, v0, v1) {
	            return redundantChecks.uniformN.call(this, location, [v0, v1]);
	        },
	        uniform3f: function uniform3f(location, v0, v1, v2) {
	            return redundantChecks.uniformN.call(this, location, [v0, v1, v2]);
	        },
	        uniform4f: function uniform4f(location, v0, v1, v2, v3) {
	            return redundantChecks.uniformN.call(this, location, [v0, v1, v2, v3]);
	        },
	        uniform1i: function uniform1i(location, v0) {
	            return redundantChecks.uniformN.call(this, location, [v0]);
	        },
	        uniform2i: function uniform2i(location, v0, v1) {
	            return redundantChecks.uniformN.call(this, location, [v0, v1]);
	        },
	        uniform3i: function uniform3i(location, v0, v1, v2) {
	            return redundantChecks.uniformN.call(this, location, [v0, v1, v2]);
	        },
	        uniform4i: function uniform4i(location, v0, v1, v2, v3) {
	            return redundantChecks.uniformN.call(this, location, [v0, v1, v2, v3]);
	        },
	        uniform1fv: function uniform1fv(location, v) {
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniform2fv: function uniform2fv(location, v) {
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniform3fv: function uniform3fv(location, v) {
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniform4fv: function uniform4fv(location, v) {
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniform1iv: function uniform1iv(location, v) {
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniform2iv: function uniform2iv(location, v) {
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniform3iv: function uniform3iv(location, v) {
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniform4iv: function uniform4iv(location, v) {
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniformMatrix2fv: function uniformMatrix2fv(location, transpose, v) {
	            // TODO: transpose
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniformMatrix3fv: function uniformMatrix3fv(location, transpose, v) {
	            // TODO: transpose
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        uniformMatrix4fv: function uniformMatrix4fv(location, transpose, v) {
	            // TODO: transpose
	            return redundantChecks.uniformN.call(this, location, v);
	        },
	        useProgram: function useProgram(program) {
	            return this.stateCache["CURRENT_PROGRAM"] == program;
	        },
	        vertexAttrib1f: function vertexAttrib1f(indx, x) {
	            return util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, 0, 0, 1]);
	        },
	        vertexAttrib2f: function vertexAttrib2f(indx, x, y) {
	            return util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, 0, 1]);
	        },
	        vertexAttrib3f: function vertexAttrib3f(indx, x, y, z) {
	            return util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, z, 1]);
	        },
	        vertexAttrib4f: function vertexAttrib4f(indx, x, y, z, w) {
	            return util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, z, w]);
	        },
	        vertexAttrib1fv: function vertexAttrib1fv(indx, v) {
	            return util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], 0, 0, 1]);
	        },
	        vertexAttrib2fv: function vertexAttrib2fv(indx, v) {
	            return util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], v[1], 0, 1]);
	        },
	        vertexAttrib3fv: function vertexAttrib3fv(indx, v) {
	            return util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], v[1], v[2], 1]);
	        },
	        vertexAttrib4fv: function vertexAttrib4fv(indx, v) {
	            return util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], v);
	        },
	        vertexAttribPointer: function vertexAttribPointer(indx, size, type, normalized, stride, offset) {
	            return this.stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + indx] == size && this.stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + indx] == type && this.stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + indx] == normalized && this.stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + indx] == stride && this.stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + indx] == offset && this.stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + indx] == this.stateCache["ARRAY_BUFFER_BINDING"];
	        },
	        viewport: function viewport(x, y, width, height) {
	            return util.arrayCompare(this.stateCache["VIEWPORT"], [x, y, width, height]);
	        }
	    };

	    RedundancyChecker.prototype.initializeStateCache = function (gl) {
	        var stateCache = {};

	        var stateParameters = ["ACTIVE_TEXTURE", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "CULL_FACE", "CULL_FACE_MODE", "CURRENT_PROGRAM", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_WRITEMASK", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAMEBUFFER_BINDING", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "LINE_WIDTH", "PACK_ALIGNMENT", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "RENDERBUFFER_BINDING", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SCISSOR_BOX", "SCISSOR_TEST", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "VIEWPORT"];
	        for (var n = 0; n < stateParameters.length; n++) {
	            try {
	                stateCache[stateParameters[n]] = gl.getParameter(gl[stateParameters[n]]);
	            } catch (e) {
	                // Ignored
	            }
	        }
	        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
	        for (var n = 0; n < maxTextureUnits; n++) {
	            gl.activeTexture(gl.TEXTURE0 + n);
	            stateCache["TEXTURE_BINDING_2D_" + n] = gl.getParameter(gl.TEXTURE_BINDING_2D);
	            stateCache["TEXTURE_BINDING_CUBE_MAP_" + n] = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
	        }
	        gl.activeTexture(originalActiveTexture);
	        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	        for (var n = 0; n < maxVertexAttribs; n++) {
	            stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
	            stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
	            stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_SIZE);
	            stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
	            stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_TYPE);
	            stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
	            stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + n] = gl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
	            stateCache["CURRENT_VERTEX_ATTRIB_" + n] = gl.getVertexAttrib(n, gl.CURRENT_VERTEX_ATTRIB);
	        }

	        return stateCache;
	    };

	    RedundancyChecker.prototype.cacheUniformValues = function (gl, frame) {
	        var originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);

	        for (var n = 0; n < frame.uniformValues.length; n++) {
	            var program = frame.uniformValues[n].program;
	            var values = frame.uniformValues[n].values;

	            var target = program.mirror.target;
	            if (!target) {
	                continue;
	            }

	            program.uniformCache = {};

	            gl.useProgram(target);

	            for (var name in values) {
	                var data = values[name];
	                var loc = gl.getUniformLocation(target, name);

	                switch (data.type) {
	                    case gl.FLOAT:
	                    case gl.FLOAT_VEC2:
	                    case gl.FLOAT_VEC3:
	                    case gl.FLOAT_VEC4:
	                    case gl.INT:
	                    case gl.INT_VEC2:
	                    case gl.INT_VEC3:
	                    case gl.INT_VEC4:
	                    case gl.BOOL:
	                    case gl.BOOL_VEC2:
	                    case gl.BOOL_VEC3:
	                    case gl.BOOL_VEC4:
	                    case gl.SAMPLER_2D:
	                    case gl.SAMPLER_CUBE:
	                        if (data.value && data.value.length !== undefined) {
	                            program.uniformCache[name] = data.value;
	                        } else {
	                            program.uniformCache[name] = [data.value];
	                        }
	                        break;
	                    case gl.FLOAT_MAT2:
	                    case gl.FLOAT_MAT3:
	                    case gl.FLOAT_MAT4:
	                        program.uniformCache[name] = data.value;
	                        break;
	                }
	            }
	        }

	        gl.useProgram(originalProgram);
	    };

	    RedundancyChecker.prototype.run = function (frame) {
	        // TODO: if we every support editing, we may want to recheck
	        if (frame.hasCheckedRedundancy) {
	            return;
	        }
	        frame.hasCheckedRedundancy = true;

	        var gl = this.gl;

	        frame.switchMirrors("redundancy");
	        frame.makeActive(gl, false, {
	            ignoreBufferUploads: true,
	            ignoreTextureUploads: true
	        });

	        // Setup initial state cache (important to do here so we have the frame initial state)
	        gl.stateCache = this.initializeStateCache(gl);

	        // Cache all uniform values for checking
	        this.cacheUniformValues(gl, frame);

	        var redundantCalls = 0;
	        var calls = frame.calls;
	        for (var n = 0; n < calls.length; n++) {
	            var call = calls[n];
	            if (call.type !== 1) {
	                continue;
	            }

	            var redundantCheck = redundantChecks[call.name];
	            var stateCacheModifier = stateCacheModifiers[call.name];
	            if (!redundantCheck && !stateCacheModifier) {
	                continue;
	            }

	            var args = call.transformArgs(gl);

	            if (redundantCheck && redundantCheck.apply(gl, args)) {
	                redundantCalls++;
	                call.isRedundant = true;
	            }

	            if (stateCacheModifier) {
	                stateCacheModifier.apply(gl, args);
	            }
	        }

	        frame.redundantCalls = redundantCalls;

	        frame.cleanup(gl);
	        frame.switchMirrors();
	    };

	    var cachedChecker = null;
	    RedundancyChecker.checkFrame = function (frame) {
	        if (!cachedChecker) {
	            cachedChecker = new RedundancyChecker();
	        }

	        cachedChecker.run(frame);
	    };

	    return RedundancyChecker;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(3), __webpack_require__(10), __webpack_require__(9), __webpack_require__(37), __webpack_require__(39), __webpack_require__(40)], __WEBPACK_AMD_DEFINE_RESULT__ = function (captureContext, base, settings, util, PopupWindow, traceLine, helpers) {

	    var PixelHistory = function PixelHistory(context, name) {
	        base.subclass(PopupWindow, this, [context, name, "Pixel History", 926, 600]);
	    };

	    PixelHistory.prototype.setup = function () {
	        var self = this;
	        var context = this.context;
	        var doc = this.browserWindow.document;

	        var defaultShowDepthDiscarded = settings.session.showDepthDiscarded;
	        this.addToolbarToggle("Show Depth Discarded Draws", "Display draws discarded by depth test", defaultShowDepthDiscarded, function (checked) {
	            settings.session.showDepthDiscarded = checked;
	            settings.save();

	            if (self.current) {
	                var current = self.current;
	                self.inspectPixel(current.frame, current.x, current.y, current.locationString);
	            }
	        });

	        var loadingMessage = this.loadingMessage = doc.createElement("div");
	        loadingMessage.className = "pixelhistory-loading";
	        loadingMessage.textContent = "Loading... (this may take awhile)";

	        // TODO: move to shared code
	        function prepareCanvas(canvas) {
	            var frag = doc.createDocumentFragment();
	            frag.appendChild(canvas);
	            var gl = util.getWebGLContext(canvas, context.attributes, null);
	            return gl;
	        };
	        this.canvas1 = doc.createElement("canvas");
	        this.canvas2 = doc.createElement("canvas");
	        this.gl1 = prepareCanvas(this.canvas1);
	        this.gl2 = prepareCanvas(this.canvas2);
	    };

	    PixelHistory.prototype.dispose = function () {
	        if (this.current) {
	            var frame = this.current.frame;
	            frame.switchMirrors("pixelhistory1");
	            frame.cleanup(this.gl1);
	            frame.switchMirrors("pixelhistory2");
	            frame.cleanup(this.gl2);
	            frame.switchMirrors();
	        }
	        this.current = null;
	        this.canvas1 = this.canvas2 = null;
	        this.gl1 = this.gl2 = null;
	    };

	    PixelHistory.prototype.clear = function () {
	        this.current = null;

	        this.browserWindow.document.title = "Pixel History";

	        this.clearPanels();
	    };

	    PixelHistory.prototype.clearPanels = function () {
	        var node = this.elements.innerDiv;
	        node.scrollTop = 0;
	        while (node.hasChildNodes()) {
	            node.removeChild(node.firstChild);
	        }
	    };

	    function addColor(doc, colorsLine, colorMask, name, canvas, subscript) {
	        // Label
	        // Canvas
	        // rgba(r, g, b, a)

	        var div = doc.createElement("div");
	        div.className = "pixelhistory-color";

	        var labelSpan = doc.createElement("span");
	        labelSpan.className = "pixelhistory-color-label";
	        labelSpan.textContent = name;
	        div.appendChild(labelSpan);

	        canvas.className = "gli-reset pixelhistory-color-canvas";
	        div.appendChild(canvas);

	        var rgba = getPixelRGBA(canvas.getContext("2d"));
	        if (rgba) {
	            var rgbaSpan = doc.createElement("span");
	            rgbaSpan.className = "pixelhistory-color-rgba";
	            var chanVals = {
	                R: Math.floor(rgba[0] * 255),
	                G: Math.floor(rgba[1] * 255),
	                B: Math.floor(rgba[2] * 255),
	                A: Math.floor(rgba[3] * 255)
	            };
	            Object.keys(chanVals).forEach(function (key, i) {
	                var subscripthtml = document.createElement("sub");
	                var strike = null;
	                subscripthtml.textContent = subscript;
	                rgbaSpan.appendChild(document.createTextNode(key));
	                rgbaSpan.appendChild(subscripthtml);
	                if (colorMask[i]) {
	                    rgbaSpan.appendChild(document.createTextNode(": " + chanVals[key]));
	                } else {
	                    strike = document.createElement("strike");
	                    strike.textContent = chanVals[key];
	                    rgbaSpan.appendChild(document.createTextNode(": "));
	                    rgbaSpan.appendChild(strike);
	                }
	                rgbaSpan.appendChild(document.createElement('br'));
	            });
	            div.appendChild(rgbaSpan);
	        }

	        colorsLine.appendChild(div);
	    };

	    PixelHistory.prototype.addPanel = function (gl, frame, call) {
	        var doc = this.browserWindow.document;

	        var panel = this.buildPanel();

	        var callLine = doc.createElement("div");
	        callLine.className = "pixelhistory-call";
	        var callParent = callLine;
	        if (call.history.isDepthDiscarded) {
	            // If discarded by the depth test, strike out the line
	            callParent = document.createElement("strike");
	            callLine.appendChild(callParent);
	        }
	        traceLine.appendCallLine(this.context, callParent, frame, call);
	        panel.appendChild(callLine);

	        // Only add color info if not discarded
	        if (!call.history.isDepthDiscarded) {
	            var colorsLine = doc.createElement("div");
	            colorsLine.className = "pixelhistory-colors";
	            addColor(doc, colorsLine, call.history.colorMask, "Source", call.history.self, "s");
	            addColor(doc, colorsLine, [true, true, true, true], "Dest", call.history.pre, "d");
	            addColor(doc, colorsLine, [true, true, true, true], "Result", call.history.post, "r");

	            if (call.history.blendEnabled) {
	                var genBlendString = function genBlendString(index) {
	                    var letter = letters[index];
	                    var blendColor = call.history.blendColor[index];
	                    var blendEqu;
	                    var blendSrc;
	                    var blendDst;
	                    switch (index) {
	                        case 0:
	                        case 1:
	                        case 2:
	                            blendEqu = call.history.blendEquRGB;
	                            blendSrc = call.history.blendSrcRGB;
	                            blendDst = call.history.blendDstRGB;
	                            break;
	                        case 3:
	                            blendEqu = call.history.blendEquAlpha;
	                            blendSrc = call.history.blendSrcAlpha;
	                            blendDst = call.history.blendDstAlpha;
	                            break;
	                    }

	                    var x_pre = rgba_pre ? rgba_pre[index] : undefined;
	                    var x_self = rgba_self ? rgba_self[index] : undefined;
	                    var x_post = rgba_post ? rgba_post[index] : undefined;
	                    function genFactor(factor) {
	                        switch (factor) {
	                            case gl.ZERO:
	                                return ["0", 0];
	                            case gl.ONE:
	                            default:
	                                return ["1", 1];
	                            case gl.SRC_COLOR:
	                                return [letter + "<sub>s</sub>", x_self];
	                            case gl.ONE_MINUS_SRC_COLOR:
	                                return ["1 - " + letter + "<sub>s</sub>", 1 - x_self];
	                            case gl.DST_COLOR:
	                                return [letter + "<sub>d</sub>", x_pre];
	                            case gl.ONE_MINUS_DST_COLOR:
	                                return ["1 - " + letter + "<sub>d</sub>", 1 - x_pre];
	                            case gl.SRC_ALPHA:
	                                return ["A<sub>s</sub>", a_self];
	                            case gl.ONE_MINUS_SRC_ALPHA:
	                                return ["1 - A<sub>s</sub>", 1 - a_self];
	                            case gl.DST_ALPHA:
	                                return ["A<sub>d</sub>", a_pre];
	                            case gl.ONE_MINUS_DST_ALPHA:
	                                return ["1 - A<sub>d</sub>", 1 - a_pre];
	                            case gl.CONSTANT_COLOR:
	                                return [letter + "<sub>c</sub>", blendColor[index]];
	                            case gl.ONE_MINUS_CONSTANT_COLOR:
	                                return ["1 - " + letter + "<sub>c</sub>", 1 - blendColor[index]];
	                            case gl.CONSTANT_ALPHA:
	                                return ["A<sub>c</sub>", blendColor[3]];
	                            case gl.ONE_MINUS_CONSTANT_ALPHA:
	                                return ["1 - A<sub>c</sub>", 1 - blendColor[3]];
	                            case gl.SRC_ALPHA_SATURATE:
	                                if (index == 3) {
	                                    return ["1", 1];
	                                } else {
	                                    return ["i", Math.min(a_self, 1 - a_pre)];
	                                }
	                        }
	                    };
	                    var sfactor = genFactor(blendSrc);
	                    var dfactor = genFactor(blendDst);
	                    var s = letter + "<sub>s</sub>(" + sfactor[0] + ")";
	                    var d = letter + "<sub>d</sub>(" + dfactor[0] + ")";
	                    function fixFloat(n) {
	                        var s = (Math.round(n * 10000) / 10000).toString();
	                        if (s.length === 1) {
	                            s += ".0000";
	                        }
	                        while (s.length < 6) {
	                            s += "0";
	                        }
	                        return s;
	                    };
	                    var largs = ["s", "d"];
	                    var args = [s, d];
	                    var equstr = "";
	                    switch (blendEqu) {
	                        case gl.FUNC_ADD:
	                            equstr = "+";
	                            break;
	                        case gl.FUNC_SUBTRACT:
	                            equstr = "-";
	                            break;
	                        case gl.FUNC_REVERSE_SUBTRACT:
	                            equstr = "-";
	                            largs = ["d", "s"];
	                            args = [d, s];
	                            break;
	                    }
	                    var str = letter + "<sub>r</sub> = " + args[0] + " " + equstr + " " + args[1];
	                    var nstr;
	                    if (hasPixelValues) {
	                        var ns = fixFloat(x_self) + "(" + fixFloat(sfactor[1]) + ")";
	                        var nd = fixFloat(x_pre) + "(" + fixFloat(dfactor[1]) + ")";
	                        var nargs = [ns, nd];
	                        switch (blendEqu) {
	                            case gl.FUNC_ADD:
	                            case gl.FUNC_SUBTRACT:
	                                break;
	                            case gl.FUNC_REVERSE_SUBTRACT:
	                                nargs = [nd, ns];
	                                break;
	                        }
	                        nstr = fixFloat(x_post) + " = " + nargs[0] + "&nbsp;" + equstr + "&nbsp;" + nargs[1] + "<sub>&nbsp;</sub>"; // last sub for line height fix
	                    } else {
	                        nstr = "";
	                    }
	                    return [str, nstr];
	                };

	                var letters = ["R", "G", "B", "A"];
	                var rgba_pre = getPixelRGBA(call.history.pre.getContext("2d"));
	                var rgba_self = getPixelRGBA(call.history.self.getContext("2d"));
	                var rgba_post = getPixelRGBA(call.history.post.getContext("2d"));
	                var hasPixelValues = rgba_pre && rgba_self && rgba_post;
	                var a_pre, a_self, a_post;
	                if (hasPixelValues) {
	                    a_pre = rgba_pre[3];
	                    a_self = rgba_self[3];
	                    a_post = rgba_post[3];
	                }

	                ;
	                var rs = genBlendString(0);
	                var gs = genBlendString(1);
	                var bs = genBlendString(2);
	                var as = genBlendString(3);
	                var blendingLine2 = doc.createElement("div");
	                blendingLine2.className = "pixelhistory-blending pixelhistory-blending-equ";
	                blendingLine2.appendChild(this.blendingLineFrag(rs[0], gs[0], bs[0], as[0]));
	                colorsLine.appendChild(blendingLine2);
	                if (hasPixelValues) {
	                    var blendingLine1 = doc.createElement("div");
	                    blendingLine1.className = "pixelhistory-blending pixelhistory-blending-values";
	                    blendingLine1.appendChild(this.blendingLineFrag(rs[1], gs[1], bs[1], as[1]));
	                    colorsLine.appendChild(blendingLine1);
	                }
	            } else {
	                var blendingLine = doc.createElement("div");
	                blendingLine.className = "pixelhistory-blending";
	                blendingLine.textContent = "blending disabled";
	                colorsLine.appendChild(blendingLine);
	            }

	            helpers.appendClear(colorsLine);
	            panel.appendChild(colorsLine);
	        }

	        return panel;
	    };

	    PixelHistory.prototype.blendingLineFrag = function () {
	        var frag = document.createDocumentFragment();
	        for (var i = 0, len = arguments.length; i < len; ++i) {
	            frag.appendChild(this.stringSubTagReplace(arguments[i]));
	            frag.appendChild(document.createElement("br"));
	        }
	        return frag;
	    };

	    PixelHistory.prototype.stringSubTagReplace = function (str) {
	        var frag = document.createDocumentFragment();
	        var strs = str.replace(/&nbsp;/g, " ").split("</sub>");
	        for (var i = 0, len = strs.length; i < len; ++i) {
	            var pair = strs[i].split("<sub>");
	            frag.appendChild(document.createTextNode(pair[0]));
	            var sub = document.createElement("sub");
	            sub.textContent = pair[1];
	            frag.appendChild(sub);
	        }
	        return frag;
	    };

	    PixelHistory.prototype.addClear = function (gl, frame, call) {
	        var panel = this.addPanel(gl, frame, call);

	        //
	    };

	    PixelHistory.prototype.addDraw = function (gl, frame, call) {
	        var panel = this.addPanel(gl, frame, call);

	        //
	    };

	    function clearColorBuffer(gl) {
	        var oldColorMask = gl.getParameter(gl.COLOR_WRITEMASK);
	        var oldColorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	        gl.colorMask(true, true, true, true);
	        gl.clearColor(0, 0, 0, 0);
	        gl.clear(gl.COLOR_BUFFER_BIT);
	        gl.colorMask(oldColorMask[0], oldColorMask[1], oldColorMask[2], oldColorMask[3]);
	        gl.clearColor(oldColorClearValue[0], oldColorClearValue[1], oldColorClearValue[2], oldColorClearValue[3]);
	    };

	    function getPixelRGBA(ctx) {
	        var imageData = null;
	        try {
	            imageData = ctx.getImageData(0, 0, 1, 1);
	        } catch (e) {
	            // Likely a security error due to cross-domain dirty flag set on the canvas
	        }
	        if (imageData) {
	            var r = imageData.data[0] / 255.0;
	            var g = imageData.data[1] / 255.0;
	            var b = imageData.data[2] / 255.0;
	            var a = imageData.data[3] / 255.0;
	            return [r, g, b, a];
	        } else {
	            console.log("unable to read back pixel");
	            return null;
	        }
	    };

	    function readbackRGBA(canvas, gl, x, y) {
	        // NOTE: this call may fail due to security errors
	        var pixel = new Uint8Array(4);
	        try {
	            gl.readPixels(x, canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
	            return pixel;
	        } catch (e) {
	            console.log("unable to read back pixel");
	            return null;
	        }
	    };

	    function readbackPixel(canvas, gl, doc, x, y) {
	        var readbackCanvas = doc.createElement("canvas");
	        readbackCanvas.width = readbackCanvas.height = 1;
	        var frag = doc.createDocumentFragment();
	        frag.appendChild(readbackCanvas);
	        var ctx = readbackCanvas.getContext("2d");

	        // First attempt to read the pixel the fast way
	        var pixel = readbackRGBA(canvas, gl, x, y);
	        if (pixel) {
	            // Fast - write to canvas and return
	            var imageData = ctx.createImageData(1, 1);
	            imageData.data[0] = pixel[0];
	            imageData.data[1] = pixel[1];
	            imageData.data[2] = pixel[2];
	            imageData.data[3] = pixel[3];
	            ctx.putImageData(imageData, 0, 0);
	        } else {
	            // Slow - blit entire canvas
	            ctx.clearRect(0, 0, 1, 1);
	            ctx.drawImage(canvas, x, y, 1, 1, 0, 0, 1, 1);
	        }

	        return readbackCanvas;
	    };

	    function gatherInterestingResources(gl, resourcesUsed) {
	        var _markResourceUsed = null;
	        _markResourceUsed = function markResourceUsed(resource) {
	            if (resourcesUsed.indexOf(resource) == -1) {
	                resourcesUsed.push(resource);
	            }
	            if (resource.getDependentResources) {
	                var dependentResources = resource.getDependentResources();
	                for (var n = 0; n < dependentResources.length; n++) {
	                    _markResourceUsed(dependentResources[n]);
	                }
	            }
	        };

	        var currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
	        if (currentProgram) {
	            _markResourceUsed(currentProgram.trackedObject);
	        }

	        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
	        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	        for (var n = 0; n < maxTextureUnits; n++) {
	            gl.activeTexture(gl.TEXTURE0 + n);
	            var tex2d = gl.getParameter(gl.TEXTURE_BINDING_2D);
	            if (tex2d) {
	                _markResourceUsed(tex2d.trackedObject);
	            }
	            var texCube = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
	            if (texCube) {
	                _markResourceUsed(texCube.trackedObject);
	            }
	        }
	        gl.activeTexture(originalActiveTexture);

	        var indexBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
	        if (indexBuffer) {
	            _markResourceUsed(indexBuffer.trackedObject);
	        }

	        var vertexBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
	        if (vertexBuffer) {
	            _markResourceUsed(vertexBuffer.trackedObject);
	        }
	        var maxVertexAttrs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	        for (var n = 0; n < maxVertexAttrs; n++) {
	            vertexBuffer = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
	            if (vertexBuffer) {
	                _markResourceUsed(vertexBuffer.trackedObject);
	            }
	        }
	    };

	    PixelHistory.prototype.beginLoading = function () {
	        var doc = this.browserWindow.document;
	        doc.body.style.cursor = "wait !important";
	        this.elements.innerDiv.appendChild(this.loadingMessage);
	    };

	    PixelHistory.prototype.endLoading = function () {
	        var doc = this.browserWindow.document;
	        doc.body.style.cursor = "";
	        this.elements.innerDiv.removeChild(this.loadingMessage);
	    };

	    PixelHistory.prototype.inspectPixel = function (frame, x, y, locationString) {
	        var self = this;
	        var doc = this.browserWindow.document;
	        doc.title = "Pixel History: " + locationString;

	        this.current = {
	            frame: frame,
	            x: x,
	            y: y,
	            locationString: locationString
	        };

	        this.clearPanels();
	        this.beginLoading();

	        captureContext.setTimeout(function () {
	            self.inspectPixelCore(frame, x, y);
	        }, 20);
	    };

	    PixelHistory.prototype.inspectPixelCore = function (frame, x, y) {
	        var doc = this.browserWindow.document;

	        var width = frame.canvasInfo.width;
	        var height = frame.canvasInfo.height;

	        var canvas1 = this.canvas1;
	        var canvas2 = this.canvas2;
	        canvas1.width = width;canvas1.height = height;
	        canvas2.width = width;canvas2.height = height;
	        var gl1 = this.gl1;
	        var gl2 = this.gl2;

	        // Canvas 1: no texture data, faked fragment shaders - for draw detection
	        // Canvas 2: full playback - for color information

	        // Prepare canvas 1 and hack all the programs
	        var pass1Shader = "precision highp float;" + "void main() {" + "    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);" + "}";
	        canvas1.width = 1;canvas1.width = width;
	        frame.switchMirrors("pixelhistory1");
	        frame.makeActive(gl1, false, {
	            ignoreTextureUploads: true,
	            fragmentShaderOverride: pass1Shader
	        });

	        // Issue all calls, read-back to detect changes, and mark the relevant calls
	        var writeCalls = [];
	        var resourcesUsed = [];
	        frame.calls.forEach(function (call) {
	            var needReadback = false;
	            switch (call.name) {
	                case "clear":
	                    // Only deal with clears that affect the color buffer
	                    if (call.args[0] & gl1.COLOR_BUFFER_BIT) {
	                        needReadback = true;
	                    }
	                    break;
	                case "drawArrays":
	                case "drawElements":
	                    needReadback = true;
	                    break;
	            }
	            // If the current framebuffer is not the default one, skip the call
	            // TODO: support pixel history on other framebuffers?
	            if (gl1.getParameter(gl1.FRAMEBUFFER_BINDING)) {
	                needReadback = false;
	            }

	            if (needReadback) {
	                // Clear color buffer only (we need depth buffer to be valid)
	                clearColorBuffer(gl1);
	            }

	            function applyPass1Call() {
	                var originalBlendEnable = null;
	                var originalColorMask = null;
	                var unmungedColorClearValue = null;
	                if (needReadback) {
	                    // Disable blending during draws
	                    originalBlendEnable = gl1.isEnabled(gl1.BLEND);
	                    gl1.disable(gl1.BLEND);

	                    // Enable all color channels to get fragment output
	                    originalColorMask = gl1.getParameter(gl1.COLOR_WRITEMASK);
	                    gl1.colorMask(true, true, true, true);

	                    // Clear calls get munged so that we make sure we can see their effects
	                    if (call.name == "clear") {
	                        unmungedColorClearValue = gl1.getParameter(gl1.COLOR_CLEAR_VALUE);
	                        gl1.clearColor(1, 1, 1, 1);
	                    }
	                }

	                // Issue call
	                call.emit(gl1);

	                if (needReadback) {
	                    // Restore blend mode
	                    if (originalBlendEnable != null) {
	                        if (originalBlendEnable) {
	                            gl1.enable(gl1.BLEND);
	                        } else {
	                            gl1.disable(gl1.BLEND);
	                        }
	                    }

	                    // Restore color mask
	                    if (originalColorMask) {
	                        gl1.colorMask(originalColorMask[0], originalColorMask[1], originalColorMask[2], originalColorMask[3]);
	                    }

	                    // Restore clear color
	                    if (unmungedColorClearValue) {
	                        gl1.clearColor(unmungedColorClearValue[0], unmungedColorClearValue[1], unmungedColorClearValue[2], unmungedColorClearValue[3]);
	                    }
	                }
	            };
	            applyPass1Call();

	            var isWrite = false;
	            function checkForPass1Write(isDepthDiscarded) {
	                var rgba = readbackRGBA(canvas1, gl1, x, y);
	                if (rgba && rgba[0]) {
	                    // Call had an effect!
	                    isWrite = true;
	                    call.history = {};
	                    call.history.isDepthDiscarded = isDepthDiscarded;
	                    call.history.colorMask = gl1.getParameter(gl1.COLOR_WRITEMASK);
	                    call.history.blendEnabled = gl1.isEnabled(gl1.BLEND);
	                    call.history.blendEquRGB = gl1.getParameter(gl1.BLEND_EQUATION_RGB);
	                    call.history.blendEquAlpha = gl1.getParameter(gl1.BLEND_EQUATION_ALPHA);
	                    call.history.blendSrcRGB = gl1.getParameter(gl1.BLEND_SRC_RGB);
	                    call.history.blendSrcAlpha = gl1.getParameter(gl1.BLEND_SRC_ALPHA);
	                    call.history.blendDstRGB = gl1.getParameter(gl1.BLEND_DST_RGB);
	                    call.history.blendDstAlpha = gl1.getParameter(gl1.BLEND_DST_ALPHA);
	                    call.history.blendColor = gl1.getParameter(gl1.BLEND_COLOR);
	                    writeCalls.push(call);

	                    // Stash off a bunch of useful resources
	                    gatherInterestingResources(gl1, resourcesUsed);
	                }
	            };
	            if (needReadback) {
	                checkForPass1Write(false);
	            }

	            if (needReadback) {
	                // If we are looking for depth discarded pixels and we were not picked up as a write, try again
	                // NOTE: we only need to do this if depth testing is enabled!
	                var isDepthTestEnabled = gl1.isEnabled(gl1.DEPTH_TEST);
	                var isDraw = false;
	                switch (call.name) {
	                    case "drawArrays":
	                    case "drawElements":
	                        isDraw = true;
	                        break;
	                }
	                if (isDraw && isDepthTestEnabled && !isWrite && settings.session.showDepthDiscarded) {
	                    // Reset depth test settings
	                    var originalDepthTest = gl1.isEnabled(gl1.DEPTH_TEST);
	                    var originalDepthMask = gl1.getParameter(gl1.DEPTH_WRITEMASK);
	                    gl1.disable(gl1.DEPTH_TEST);
	                    gl1.depthMask(false);

	                    // Call again
	                    applyPass1Call();

	                    // Restore depth test settings
	                    if (originalDepthTest) {
	                        gl1.enable(gl1.DEPTH_TEST);
	                    } else {
	                        gl1.disable(gl1.DEPTH_TEST);
	                    }
	                    gl1.depthMask(originalDepthMask);

	                    // Check for write
	                    checkForPass1Write(true);
	                }
	            }
	        });

	        // TODO: cleanup canvas 1 resources?

	        // Find resources that were not used so we can exclude them
	        var exclusions = [];
	        // TODO: better search
	        for (var n = 0; n < frame.resourcesUsed.length; n++) {
	            var resource = frame.resourcesUsed[n];
	            var typename = base.typename(resource.target);
	            switch (typename) {
	                case "WebGLTexture":
	                case "WebGLProgram":
	                case "WebGLShader":
	                case "WebGLBuffer":
	                    if (resourcesUsed.indexOf(resource) == -1) {
	                        // Not used - exclude
	                        exclusions.push(resource);
	                    }
	                    break;
	            }
	        }

	        // Prepare canvas 2 for pulling out individual contribution
	        canvas2.width = 1;canvas2.width = width;
	        frame.switchMirrors("pixelhistory2");
	        frame.makeActive(gl2, false, null, exclusions);

	        for (var n = 0; n < frame.calls.length; n++) {
	            var call = frame.calls[n];
	            var isWrite = writeCalls.indexOf(call) >= 0;

	            // Ignore things that don't affect this pixel
	            var ignore = false;
	            if (!isWrite) {
	                switch (call.name) {
	                    case "drawArrays":
	                    case "drawElements":
	                        ignore = true;
	                        break;
	                }
	            }
	            if (ignore) {
	                continue;
	            }

	            var originalBlendEnable = null;
	            var originalColorMask = null;
	            if (isWrite) {
	                // Clear color buffer only (we need depth buffer to be valid)
	                clearColorBuffer(gl2);

	                // Disable blending during draws
	                originalBlendEnable = gl2.isEnabled(gl2.BLEND);
	                gl2.disable(gl2.BLEND);

	                // Enable all color channels to get fragment output
	                originalColorMask = gl2.getParameter(gl2.COLOR_WRITEMASK);
	                gl2.colorMask(true, true, true, true);
	            }

	            call.emit(gl2);

	            if (isWrite) {
	                // Restore blend mode
	                if (originalBlendEnable != null) {
	                    if (originalBlendEnable) {
	                        gl2.enable(gl2.BLEND);
	                    } else {
	                        gl2.disable(gl2.BLEND);
	                    }
	                }

	                // Restore color mask
	                if (originalColorMask) {
	                    gl2.colorMask(originalColorMask[0], originalColorMask[1], originalColorMask[2], originalColorMask[3]);
	                }
	            }

	            if (isWrite) {
	                // Read back the written fragment color
	                call.history.self = readbackPixel(canvas2, gl2, doc, x, y);
	            }
	        }

	        // Prepare canvas 2 for pulling out blending before/after
	        canvas2.width = 1;canvas2.width = width;
	        frame.makeActive(gl2, false, null, exclusions);

	        for (var n = 0; n < frame.calls.length; n++) {
	            var call = frame.calls[n];
	            var isWrite = writeCalls.indexOf(call) >= 0;

	            // Ignore things that don't affect this pixel
	            var ignore = false;
	            if (!isWrite) {
	                switch (call.name) {
	                    case "drawArrays":
	                    case "drawElements":
	                        ignore = true;
	                        break;
	                }
	            }
	            if (ignore) {
	                continue;
	            }

	            if (isWrite) {
	                // Read prior color
	                call.history.pre = readbackPixel(canvas2, gl2, doc, x, y);
	            }

	            call.emit(gl2);

	            if (isWrite) {
	                // Read new color
	                call.history.post = readbackPixel(canvas2, gl2, doc, x, y);
	            }

	            if (isWrite) {
	                switch (call.name) {
	                    case "clear":
	                        this.addClear(gl2, frame, call);
	                        break;
	                    case "drawArrays":
	                    case "drawElements":
	                        this.addDraw(gl2, frame, call);
	                        break;
	                }
	            }
	        }

	        // TODO: cleanup canvas 2 resources?

	        // Restore all resource mirrors
	        frame.switchMirrors(null);

	        this.endLoading();
	    };

	    return PixelHistory;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(38), __webpack_require__(1)], __WEBPACK_AMD_DEFINE_RESULT__ = function (cssLoader, captureContext) {

	    var PopupWindow = function PopupWindow(context, name, title, defaultWidth, defaultHeight) {
	        var self = this;
	        this.context = context;

	        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=" + defaultWidth + ",innerHeight=" + defaultHeight + "");
	        w.document.writeln("<html><head><title>" + title + "</title></head><body style='margin: 0px; padding: 0px;'></body></html>");
	        w.focus();

	        w.addEventListener("unload", function () {
	            self.dispose();
	            if (self.browserWindow) {
	                self.browserWindow.closed = true;
	                self.browserWindow = null;
	            }
	            context.ui.windows[name] = null;
	        }, false);

	        cssLoader.load(w);

	        this.elements = {};

	        captureContext.setTimeout(function () {
	            var doc = self.browserWindow.document;
	            var body = doc.body;

	            var toolbarDiv = self.elements.toolbarDiv = doc.createElement("div");
	            toolbarDiv.className = "popup-toolbar";
	            body.appendChild(toolbarDiv);

	            var innerDiv = self.elements.innerDiv = doc.createElement("div");
	            innerDiv.className = "popup-inner";
	            body.appendChild(innerDiv);

	            self.setup();
	        }, 0);
	    };

	    PopupWindow.prototype.addToolbarToggle = function (name, tip, defaultValue, callback) {
	        var self = this;
	        var doc = this.browserWindow.document;
	        var toolbarDiv = this.elements.toolbarDiv;

	        var input = doc.createElement("input");
	        input.style.width = "inherit";
	        input.style.height = "inherit";

	        input.type = "checkbox";
	        input.title = tip;
	        input.checked = defaultValue;

	        input.onchange = function () {
	            callback.apply(self, [input.checked]);
	        };

	        var span = doc.createElement("span");
	        span.textContent = " " + name;

	        span.onclick = function () {
	            input.checked = !input.checked;
	            callback.apply(self, [input.checked]);
	        };

	        var el = doc.createElement("div");
	        el.className = "popup-toolbar-toggle";
	        el.appendChild(input);
	        el.appendChild(span);

	        toolbarDiv.appendChild(el);

	        callback.apply(this, [defaultValue]);
	    };

	    PopupWindow.prototype.buildPanel = function () {
	        var doc = this.browserWindow.document;

	        var panelOuter = doc.createElement("div");
	        panelOuter.className = "popup-panel-outer";

	        var panel = doc.createElement("div");
	        panel.className = "popup-panel";

	        panelOuter.appendChild(panel);
	        this.elements.innerDiv.appendChild(panelOuter);
	        return panel;
	    };

	    PopupWindow.prototype.setup = function () {};

	    PopupWindow.prototype.dispose = function () {};

	    PopupWindow.prototype.focus = function () {
	        this.browserWindow.focus();
	    };

	    PopupWindow.prototype.close = function () {
	        this.dispose();
	        if (this.browserWindow) {
	            this.browserWindow.close();
	            this.browserWindow = null;
	        }
	        this.context.ui.windows[name] = null;
	    };

	    PopupWindow.prototype.isOpened = function () {
	        return this.browserWindow && !this.browserWindow.closed;
	    };

	    PopupWindow.show = function (context, type, name, callback) {
	        var existing = context.ui.windows[name];
	        if (existing && existing.isOpened()) {
	            existing.focus();
	            if (callback) {
	                callback(existing);
	            }
	        } else {
	            if (existing) {
	                existing.dispose();
	            }
	            context.ui.windows[name] = new type(context, name);
	            if (callback) {
	                captureContext.setTimeout(function () {
	                    // May have somehow closed in the interim
	                    var popup = context.ui.windows[name];
	                    if (popup) {
	                        callback(popup);
	                    }
	                }, 0);
	            }
	        }
	    };

	    return PopupWindow;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {

	    function injectCSS(filename, injectState) {
	        var doc = injectState.window.document;
	        var url = injectState.pathRoot + filename;
	        if (url.indexOf("http://") == 0 || url.indexOf("file://") == 0 || url.indexOf("chrome-extension://") == 0) {
	            var link = doc.createElement("link");
	            link.rel = "stylesheet";
	            link.href = url;
	            (doc.head || doc.body || doc.documentElement).appendChild(link);
	        } else {
	            var xhr = new XMLHttpRequest();
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState == 4) {
	                    if (xhr.status == 200) {
	                        (doc.head || doc.body || doc.documentElement).appendChild(style);
	                    }
	                }
	            };
	            xhr.open("GET", url, true);
	            xhr.send(null);
	        }
	    };

	    function load(w) {

	        if (window.gliCssRoot) {
	            var injectState = {
	                window: w,
	                pathRoot: window.gliCssRoot
	            };

	            injectCSS("./dependencies/reset-context.css", injectState);
	            injectCSS("./dependencies/syntaxhighlighter_3.0.83/shCore.css", injectState);
	            injectCSS("./dependencies/syntaxhighlighter_3.0.83/shThemeDefault.css", injectState);
	            injectCSS("./ui/gli.css", injectState);
	        } else if (window.gliCssUrl) {
	            var targets = [w.document.body, w.document.head, w.document.documentElement];
	            for (var n = 0; n < targets.length; n++) {
	                var target = targets[n];
	                if (target) {
	                    var link = w.document.createElement("link");
	                    link.rel = "stylesheet";
	                    link.href = window["gliCssUrl"];
	                    target.appendChild(link);
	                    break;
	                }
	            }
	        }
	    }

	    return {
	        load: load
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(7), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, info, util) {

	    function generateFunctionDisplay(context, call, el) {
	        var sig = "";

	        // TODO: return type must be set in info.js
	        //if (call.info.returnType) {
	        if (call.result) {
	            sig += "UNK ";
	        } else {
	            sig += "void ";
	        }

	        sig += call.info.name + "(";

	        var argInfos = call.info.getArgs(call);
	        if (argInfos.length || argInfos.length == 0) {
	            for (var n = 0; n < argInfos.length; n++) {
	                var argInfo = argInfos[n];
	                if (n != 0) {
	                    sig += ", ";
	                }
	                sig += argInfo.name;
	            }
	        } else {
	            if (argInfos) {
	                var UIType = info.UIType;
	                switch (argInfos.ui) {
	                    case UIType.COLORMASK:
	                        sig += "r, g, b, a";
	                        break;
	                    case UIType.COLOR:
	                        sig += "r, g, b, a";
	                        break;
	                }
	            }
	        }

	        sig += ")";

	        var functionSpan = document.createElement("span");
	        functionSpan.textContent = call.info.name;
	        functionSpan.title = sig;
	        el.appendChild(functionSpan);
	    };

	    function generateValueString(context, call, ui, value, argIndex) {
	        var gl = context;
	        var UIType = info.UIType;

	        var text = null;

	        var argInfos = call.info.getArgs(call);

	        // If no UI provided, fake one and guess
	        if (!ui) {
	            ui = {};
	            ui.type = UIType.OBJECT;
	        }
	        if (value && value.trackedObject) {
	            // Got passed a real gl object instead of our tracked one - fixup
	            value = value.trackedObject;
	        }

	        switch (ui.type) {
	            case UIType.ENUM:
	                var anyMatches = false;
	                for (var i = 0; i < ui.values.length; i++) {
	                    var enumName = ui.values[i];
	                    if (value == gl[enumName]) {
	                        anyMatches = true;
	                        text = enumName;
	                    }
	                }
	                if (anyMatches == false) {
	                    if (value === undefined) {
	                        text = "undefined";
	                    } else {
	                        text = "?? 0x" + value.toString(16) + " ??";
	                    }
	                }
	                break;
	            case UIType.ARRAY:
	                text = "[" + value + "]";
	                break;
	            case UIType.BOOL:
	                text = value ? "true" : "false";
	                break;
	            case UIType.LONG:
	                text = value;
	                break;
	            case UIType.ULONG:
	                text = value;
	                break;
	            case UIType.COLORMASK:
	                text = value;
	                //outputHTML += "R<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[0] ? "checked='checked'" : "") + "/>";
	                //outputHTML += "G<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[1] ? "checked='checked'" : "") + "/>";
	                //outputHTML += "B<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[2] ? "checked='checked'" : "") + "/>";
	                //outputHTML += "A<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[3] ? "checked='checked'" : "") + "/>";
	                break;
	            case UIType.OBJECT:
	                // TODO: custom object output based on type
	                text = value ? value : "null";
	                if (value && value.target && util.isWebGLResource(value.target)) {
	                    var typename = base.typename(value.target);
	                    text = "[" + value.getName() + "]";
	                } else if (util.isTypedArray(value)) {
	                    text = "[" + value + "]";
	                } else if (value) {
	                    var typename = base.typename(value);
	                    switch (typename) {
	                        case "WebGLUniformLocation":
	                            text = '"' + value.sourceUniformName + '"';
	                            break;
	                    }
	                }
	                break;
	            case UIType.WH:
	                text = value[0] + " x " + value[1];
	                break;
	            case UIType.RECT:
	                text = value[0] + ", " + value[1] + " " + value[2] + " x " + value[3];
	                break;
	            case UIType.STRING:
	                text = '"' + value + '"';
	                break;
	            case UIType.COLOR:
	                text = value;
	                //outputHTML += "<span style='color: rgb(" + (value[0] * 255) + "," + (value[1] * 255) + "," + (value[2] * 255) + ")'>rgba(" +
	                //                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/>, " +
	                //                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>, " +
	                //                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[2] + "'/>, " +
	                //                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[3] + "'/>" +
	                //                ")</span>";
	                // TODO: color tip
	                break;
	            case UIType.FLOAT:
	                text = value;
	                break;
	            case UIType.BITMASK:
	                text = "0x" + value.toString(16);
	                // TODO: bitmask tip
	                break;
	            case UIType.RANGE:
	                text = value[0] + " - " + value[1];
	                break;
	            case UIType.MATRIX:
	                switch (value.length) {
	                    default:
	                        // ?
	                        text = "[matrix]";
	                        break;
	                    case 4:
	                        // 2x2
	                        text = "[matrix 2x2]";
	                        break;
	                    case 9:
	                        // 3x3
	                        text = "[matrix 3x3]";
	                        break;
	                    case 16:
	                        // 4x4
	                        text = "[matrix 4x4]";
	                        break;
	                }
	                // TODO: matrix tip
	                text = "[" + value + "]";
	                break;
	        }

	        return text;
	    };

	    function generateValueDisplay(w, context, call, el, ui, value, argIndex) {
	        var vel = document.createElement("span");

	        var gl = context;
	        var UIType = info.UIType;

	        var text = null;
	        var tip = null;
	        var clickhandler = null;

	        var argInfos = call.info.getArgs(call);
	        if (argInfos.length || argInfos.length == 0) {
	            var argInfo = argInfos[argIndex];
	            if (argInfo) {
	                tip = argInfo.name;
	            }
	        } else {
	            if (argInfos) {
	                switch (argInfos.ui) {
	                    case UIType.COLORMASK:
	                        break;
	                    case UIType.COLOR:
	                        break;
	                }
	            }
	        }

	        // If no UI provided, fake one and guess
	        if (!ui) {
	            ui = {};
	            ui.type = UIType.OBJECT;
	        }
	        if (value && value.trackedObject) {
	            // Got passed a real gl object instead of our tracked one - fixup
	            value = value.trackedObject;
	        }

	        // This slows down large traces - need to do all tips on demand instead
	        var useEnumTips = false;

	        switch (ui.type) {
	            case UIType.ENUM:
	                var enumTip = tip;
	                enumTip += ":\r\n";
	                var anyMatches = false;
	                if (useEnumTips) {
	                    for (var i = 0; i < ui.values.length; i++) {
	                        var enumName = ui.values[i];
	                        enumTip += enumName;
	                        if (value == gl[enumName]) {
	                            anyMatches = true;
	                            text = enumName;
	                            enumTip += " <---";
	                        }
	                        enumTip += "\r\n";
	                    }
	                    tip = enumTip;
	                } else {
	                    for (var i = 0; i < ui.values.length; i++) {
	                        var enumName = ui.values[i];
	                        if (value == gl[enumName]) {
	                            anyMatches = true;
	                            text = enumName;
	                        }
	                    }
	                }
	                if (anyMatches == false) {
	                    if (value === undefined) {
	                        text = "undefined";
	                    } else {
	                        text = "?? 0x" + value.toString(16) + " ??";
	                    }
	                }
	                break;
	            case UIType.ARRAY:
	                text = "[" + value + "]";
	                break;
	            case UIType.BOOL:
	                text = value ? "true" : "false";
	                break;
	            case UIType.LONG:
	                text = value;
	                break;
	            case UIType.ULONG:
	                text = value;
	                break;
	            case UIType.COLORMASK:
	                text = value;
	                //outputHTML += "R<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[0] ? "checked='checked'" : "") + "/>";
	                //outputHTML += "G<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[1] ? "checked='checked'" : "") + "/>";
	                //outputHTML += "B<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[2] ? "checked='checked'" : "") + "/>";
	                //outputHTML += "A<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[3] ? "checked='checked'" : "") + "/>";
	                break;
	            case UIType.OBJECT:
	                // TODO: custom object output based on type
	                text = value ? value : "null";
	                if (value && value.target && util.isWebGLResource(value.target)) {
	                    var typename = base.typename(value.target);
	                    switch (typename) {
	                        case "WebGLBuffer":
	                            clickhandler = function clickhandler() {
	                                w.showBuffer(value, true);
	                            };
	                            break;
	                        case "WebGLFramebuffer":
	                            break;
	                        case "WebGLProgram":
	                            clickhandler = function clickhandler() {
	                                w.showProgram(value, true);
	                            };
	                            break;
	                        case "WebGLRenderbuffer":
	                            break;
	                        case "WebGLShader":
	                            break;
	                        case "WebGLTexture":
	                            clickhandler = function clickhandler() {
	                                w.showTexture(value, true);
	                            };
	                            break;
	                        case "WebGLQuery":
	                            break;
	                        case "WebGLSampler":
	                            break;
	                        case "WebGLSync":
	                            break;
	                        case "WebGLTransformFeedback":
	                            break;
	                        case "WebGLVertexArrayObject":
	                            break;
	                        case "WebGLVertexArrayObjectOES":
	                            break;
	                    }
	                    text = "[" + value.getName() + "]";
	                } else if (util.isTypedArray(value)) {
	                    text = "[" + value + "]";
	                } else if (value) {
	                    var typename = base.typename(value);
	                    switch (typename) {
	                        case "WebGLUniformLocation":
	                            text = '"' + value.sourceUniformName + '"';
	                            break;
	                    }
	                }
	                break;
	            case UIType.WH:
	                text = value[0] + " x " + value[1];
	                break;
	            case UIType.RECT:
	                text = value[0] + ", " + value[1] + " " + value[2] + " x " + value[3];
	                break;
	            case UIType.STRING:
	                text = '"' + value + '"';
	                break;
	            case UIType.COLOR:
	                text = value;
	                //                outputHTML += "<span style='color: rgb(" + (value[0] * 255) + "," + (value[1] * 255) + "," + (value[2] * 255) + ")'>rgba(" +
	                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/>, " +
	                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>, " +
	                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[2] + "'/>, " +
	                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[3] + "'/>" +
	                //                                ")</span>";
	                // TODO: color tip
	                break;
	            case UIType.FLOAT:
	                text = value;
	                break;
	            case UIType.BITMASK:
	                // If enum values present use them (they are flags), otherwise just a hex value
	                text = "";
	                if (ui.values && ui.values.length) {
	                    for (var i = 0; i < ui.values.length; i++) {
	                        var enumName = ui.values[i];
	                        if (value & gl[enumName]) {
	                            if (text.length) {
	                                text += " | " + enumName;
	                            } else {
	                                text = enumName;
	                            }
	                        }
	                    }
	                } else {
	                    text = "0x" + value.toString(16);
	                }
	                // TODO: bitmask tip
	                break;
	            case UIType.RANGE:
	                text = value[0] + " - " + value[1];
	                break;
	            case UIType.MATRIX:
	                switch (value.length) {
	                    default:
	                        // ?
	                        text = "[matrix]";
	                        break;
	                    case 4:
	                        // 2x2
	                        text = "[matrix 2x2]";
	                        break;
	                    case 9:
	                        // 3x3
	                        text = "[matrix 3x3]";
	                        break;
	                    case 16:
	                        // 4x4
	                        text = "[matrix 4x4]";
	                        break;
	                }
	                // TODO: matrix tip
	                text = "[" + value + "]";
	                break;
	        }

	        vel.textContent = text;
	        vel.title = tip;

	        if (clickhandler) {
	            vel.className += " trace-call-clickable";
	            vel.onclick = function (e) {
	                clickhandler();
	                e.preventDefault();
	                e.stopPropagation();
	            };
	        }

	        el.appendChild(vel);
	    };

	    function populateCallString(context, call) {
	        var s = call.info.name;
	        s += "(";

	        var argInfos = call.info.getArgs(call);
	        if (argInfos.length || argInfos.length == 0) {
	            for (var n = 0; n < call.args.length; n++) {
	                var argInfo = n < argInfos.length ? argInfos[n] : null;
	                var argValue = call.args[n];
	                if (n != 0) {
	                    s += ", ";
	                }
	                s += generateValueString(context, call, argInfo ? argInfo.ui : null, argValue, n);
	            }
	        } else {
	            // Special argument formatter
	            s += generateValueString(w, context, call, argInfos, call.args);
	        }

	        s += ")";

	        // TODO: return type must be set in info.js
	        //if (call.info.returnType) {
	        if (call.result) {
	            s += " = ";
	            s += generateValueString(context, call, call.info.returnType, call.result);
	            //el.appendChild(document.createTextNode(call.result)); // TODO: pretty
	        }

	        return s;
	    };

	    function populateCallLine(w, call, el) {
	        var context = w.context;

	        generateFunctionDisplay(context, call, el);

	        el.appendChild(document.createTextNode("("));

	        var argInfos = call.info.getArgs(call);
	        if (argInfos.length || argInfos.length == 0) {
	            for (var n = 0; n < call.args.length; n++) {
	                var argInfo = n < argInfos.length ? argInfos[n] : null;
	                var argValue = call.args[n];
	                if (n != 0) {
	                    el.appendChild(document.createTextNode(", "));
	                }
	                generateValueDisplay(w, context, call, el, argInfo ? argInfo.ui : null, argValue, n);
	            }
	        } else {
	            // Special argument formatter
	            generateValueDisplay(w, context, call, el, argInfos, call.args);
	        }

	        el.appendChild(document.createTextNode(")"));

	        // TODO: return type must be set in info.js
	        //if (call.info.returnType) {
	        if (call.result) {
	            el.appendChild(document.createTextNode(" = "));
	            generateValueDisplay(w, context, call, el, call.info.returnType, call.result);
	            //el.appendChild(document.createTextNode(call.result)); // TODO: pretty
	        }
	    };

	    function appendHistoryLine(gl, el, call) {
	        // <div class="history-call">
	        //     <div class="trace-call-line">
	        //         hello world
	        //     </div>
	        // </div>

	        var callRoot = document.createElement("div");
	        callRoot.className = "usage-call";

	        var line = document.createElement("div");
	        line.className = "trace-call-line";
	        populateCallLine(gl.ui, call, line);
	        callRoot.appendChild(line);

	        el.appendChild(callRoot);

	        // TODO: click to expand stack trace?
	    };

	    function appendCallLine(gl, el, frame, call) {
	        // <div class="usage-call">
	        //     <div class="usage-call-ordinal">
	        //         NNNN
	        //     </div>
	        //     <div class="trace-call-line">
	        //         hello world
	        //     </div>
	        // </div>

	        var callRoot = document.createElement("div");
	        callRoot.className = "usage-call usage-call-clickable";

	        callRoot.onclick = function (e) {
	            // Jump to trace view and run until ordinal
	            gl.ui.showTrace(frame, call.ordinal);
	            e.preventDefault();
	            e.stopPropagation();
	        };

	        var ordinal = document.createElement("div");
	        ordinal.className = "usage-call-ordinal";
	        ordinal.textContent = call.ordinal;
	        callRoot.appendChild(ordinal);

	        var line = document.createElement("div");
	        line.className = "trace-call-line";
	        populateCallLine(gl.ui, call, line);
	        callRoot.appendChild(line);

	        el.appendChild(callRoot);
	    };

	    function appendObjectRef(context, el, value) {
	        var w = context.ui;

	        var clickhandler = null;
	        var text = value ? value : "null";
	        if (value && value.target && util.isWebGLResource(value.target)) {
	            var typename = base.typename(value.target);
	            switch (typename) {
	                case "WebGLBuffer":
	                    clickhandler = function clickhandler() {
	                        w.showBuffer(value, true);
	                    };
	                    break;
	                case "WebGLFramebuffer":
	                    break;
	                case "WebGLProgram":
	                    clickhandler = function clickhandler() {
	                        w.showProgram(value, true);
	                    };
	                    break;
	                case "WebGLRenderbuffer":
	                    break;
	                case "WebGLShader":
	                    break;
	                case "WebGLTexture":
	                    clickhandler = function clickhandler() {
	                        w.showTexture(value, true);
	                    };
	                    break;
	                case "WebGLQuery":
	                    break;
	                case "WebGLSampler":
	                    break;
	                case "WebGLSync":
	                    break;
	                case "WebGLTransformFeedback":
	                    break;
	                case "WebGLVertexArrayObject":
	                    break;
	                case "WebGLVertexArrayObjectOES":
	                    break;
	            }
	            text = "[" + value.getName() + "]";
	        } else if (util.isTypedArray(value)) {
	            text = "[" + value + "]";
	        } else if (value) {
	            var typename = base.typename(value);
	            switch (typename) {
	                case "WebGLUniformLocation":
	                    text = '"' + value.sourceUniformName + '"';
	                    break;
	            }
	        }

	        var vel = document.createElement("span");
	        vel.textContent = text;

	        if (clickhandler) {
	            vel.className += " trace-call-clickable";
	            vel.onclick = function (e) {
	                clickhandler();
	                e.preventDefault();
	                e.stopPropagation();
	            };
	        }

	        el.appendChild(vel);
	    };

	    function generateUsageList(gl, el, frame, resource) {
	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-secondary";
	        titleDiv.textContent = "Usage in frame " + frame.frameNumber;
	        el.appendChild(titleDiv);

	        var rootEl = document.createElement("div");
	        rootEl.className = "resource-usage";
	        el.appendChild(rootEl);

	        var usages = frame.findResourceUsages(resource);
	        if (usages == null) {
	            var notUsed = document.createElement("div");
	            notUsed.textContent = "Not used in this frame";
	            rootEl.appendChild(notUsed);
	        } else if (usages.length == 0) {
	            var notUsed = document.createElement("div");
	            notUsed.textContent = "Used but not referenced in this frame";
	            rootEl.appendChild(notUsed);
	        } else {
	            for (var n = 0; n < usages.length; n++) {
	                var call = usages[n];
	                appendCallLine(gl, rootEl, frame, call);
	            }
	        }
	    };

	    return {
	        populateCallString: populateCallString,
	        populateCallLine: populateCallLine,
	        appendHistoryLine: appendHistoryLine,
	        appendCallLine: appendCallLine,
	        appendObjectRef: appendObjectRef,
	        generateUsageList: generateUsageList
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(7), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, info, util) {
	    function appendbr(el) {
	        var br = document.createElement("br");
	        el.appendChild(br);
	    };
	    function appendClear(el) {
	        var clearDiv = document.createElement("div");
	        clearDiv.style.clear = "both";
	        el.appendChild(clearDiv);
	    };
	    function appendSeparator(el) {
	        var div = document.createElement("div");
	        div.className = "info-separator";
	        el.appendChild(div);
	        appendbr(el);
	    };
	    function appendParameters(gl, el, obj, parameters, parameterEnumValues) {
	        var table = document.createElement("table");
	        table.className = "info-parameters";

	        for (var n = 0; n < parameters.length; n++) {
	            var enumName = parameters[n];
	            var value = obj.parameters[gl[enumName]];

	            var tr = document.createElement("tr");
	            tr.className = "info-parameter-row";

	            var tdkey = document.createElement("td");
	            tdkey.className = "info-parameter-key";
	            tdkey.textContent = enumName;
	            tr.appendChild(tdkey);

	            var tdvalue = document.createElement("td");
	            tdvalue.className = "info-parameter-value";
	            if (parameterEnumValues && parameterEnumValues[n]) {
	                var valueFound = false;
	                for (var m = 0; m < parameterEnumValues[n].length; m++) {
	                    if (value == gl[parameterEnumValues[n][m]]) {
	                        tdvalue.textContent = parameterEnumValues[n][m];
	                        valueFound = true;
	                        break;
	                    }
	                }
	                if (!valueFound) {
	                    tdvalue.textContent = value + " (unknown)";
	                }
	            } else {
	                tdvalue.textContent = value; // TODO: convert to something meaningful?
	            }
	            tr.appendChild(tdvalue);

	            table.appendChild(tr);
	        }

	        el.appendChild(table);
	    };
	    function appendStateParameterRow(w, gl, table, state, param) {
	        var tr = document.createElement("tr");
	        tr.className = "info-parameter-row";

	        var tdkey = document.createElement("td");
	        tdkey.className = "info-parameter-key";
	        tdkey.textContent = param.name;
	        tr.appendChild(tdkey);

	        var value;
	        if (param.value) {
	            value = state[param.value];
	        } else {
	            value = state[param.name];
	        }

	        // Grab tracked objects
	        if (value && value.trackedObject) {
	            value = value.trackedObject;
	        }

	        var tdvalue = document.createElement("td");
	        tdvalue.className = "info-parameter-value";

	        var text = "";
	        var clickhandler = null;

	        var UIType = info.UIType;
	        var ui = param.ui;
	        switch (ui.type) {
	            case UIType.ENUM:
	                var anyMatches = false;
	                for (var i = 0; i < ui.values.length; i++) {
	                    var enumName = ui.values[i];
	                    if (value == gl[enumName]) {
	                        anyMatches = true;
	                        text = enumName;
	                    }
	                }
	                if (anyMatches == false) {
	                    if (value === undefined) {
	                        text = "undefined";
	                    } else {
	                        text = "?? 0x" + value.toString(16) + " ??";
	                    }
	                }
	                break;
	            case UIType.ARRAY:
	                text = "[" + value + "]";
	                break;
	            case UIType.BOOL:
	                text = value ? "true" : "false";
	                break;
	            case UIType.LONG:
	                text = value;
	                break;
	            case UIType.ULONG:
	                text = value;
	                break;
	            case UIType.COLORMASK:
	                text = value;
	                break;
	            case UIType.OBJECT:
	                // TODO: custom object output based on type
	                text = value ? value : "null";
	                if (value && value.target && util.isWebGLResource(value.target)) {
	                    var typename = base.typename(value.target);
	                    switch (typename) {
	                        case "WebGLBuffer":
	                            clickhandler = function clickhandler() {
	                                w.showBuffer(value, true);
	                            };
	                            break;
	                        case "WebGLFramebuffer":
	                            break;
	                        case "WebGLProgram":
	                            clickhandler = function clickhandler() {
	                                w.showProgram(value, true);
	                            };
	                            break;
	                        case "WebGLRenderbuffer":
	                            break;
	                        case "WebGLShader":
	                            break;
	                        case "WebGLTexture":
	                            clickhandler = function clickhandler() {
	                                w.showTexture(value, true);
	                            };
	                            break;
	                    }
	                    text = "[" + value.getName() + "]";
	                } else if (util.isTypedArray(value)) {
	                    text = "[" + value + "]";
	                } else if (value) {
	                    var typename = base.typename(value);
	                    switch (typename) {
	                        case "WebGLUniformLocation":
	                            text = '"' + value.sourceUniformName + '"';
	                            break;
	                    }
	                }
	                break;
	            case UIType.WH:
	                text = value[0] + " x " + value[1];
	                break;
	            case UIType.RECT:
	                if (value) {
	                    text = value[0] + ", " + value[1] + " " + value[2] + " x " + value[3];
	                } else {
	                    text = "null";
	                }
	                break;
	            case UIType.STRING:
	                text = '"' + value + '"';
	                break;
	            case UIType.COLOR:
	                var rgba = "rgba(" + value[0] * 255 + ", " + value[1] * 255 + ", " + value[2] * 255 + ", " + value[3] + ")";
	                var div = document.createElement("div");
	                div.classList.add("info-parameter-color");
	                div.style.backgroundColor = rgba;
	                tdvalue.appendChild(div);
	                text = " " + rgba;
	                // TODO: color tip
	                break;
	            case UIType.FLOAT:
	                text = value;
	                break;
	            case UIType.BITMASK:
	                text = "0x" + value.toString(16);
	                // TODO: bitmask tip
	                break;
	            case UIType.RANGE:
	                text = value[0] + " - " + value[1];
	                break;
	            case UIType.MATRIX:
	                switch (value.length) {
	                    default:
	                        // ?
	                        text = "[matrix]";
	                        break;
	                    case 4:
	                        // 2x2
	                        text = "[matrix 2x2]";
	                        break;
	                    case 9:
	                        // 3x3
	                        text = "[matrix 3x3]";
	                        break;
	                    case 16:
	                        // 4x4
	                        text = "[matrix 4x4]";
	                        break;
	                }
	                // TODO: matrix tip
	                text = "[" + value + "]";
	                break;
	        }

	        // Some td's have more than just text, assigning to textContent clears.
	        tdvalue.appendChild(document.createTextNode(text));
	        if (clickhandler) {
	            tdvalue.className += " trace-call-clickable";
	            tdvalue.onclick = function (e) {
	                clickhandler();
	                e.preventDefault();
	                e.stopPropagation();
	            };
	        }

	        tr.appendChild(tdvalue);

	        table.appendChild(tr);
	    };
	    function appendContextAttributeRow(w, gl, table, state, param) {
	        appendStateParameterRow(w, gl, table, state, { name: param, ui: { type: info.UIType.BOOL } });
	    }
	    function appendMatrices(gl, el, type, size, value) {
	        switch (type) {
	            case gl.FLOAT_MAT2:
	                for (var n = 0; n < size; n++) {
	                    var offset = n * 4;
	                    appendMatrix(el, value, offset, 2);
	                }
	                break;
	            case gl.FLOAT_MAT3:
	                for (var n = 0; n < size; n++) {
	                    var offset = n * 9;
	                    appendMatrix(el, value, offset, 3);
	                }
	                break;
	            case gl.FLOAT_MAT4:
	                for (var n = 0; n < size; n++) {
	                    var offset = n * 16;
	                    appendMatrix(el, value, offset, 4);
	                }
	                break;
	        }
	    };
	    function appendMatrix(el, value, offset, size) {
	        var div = document.createElement("div");

	        var openSpan = document.createElement("span");
	        openSpan.textContent = "[";
	        div.appendChild(openSpan);

	        for (var i = 0; i < size; i++) {
	            for (var j = 0; j < size; j++) {
	                var v = value[offset + i * size + j];
	                div.appendChild(document.createTextNode(padFloat(v)));
	                if (!(i == size - 1 && j == size - 1)) {
	                    var comma = document.createElement("span");
	                    comma.textContent = ", ";
	                    div.appendChild(comma);
	                }
	            }
	            if (i < size - 1) {
	                appendbr(div);
	                var prefix = document.createElement("span");
	                prefix.textContent = " ";
	                div.appendChild(prefix);
	            }
	        }

	        var closeSpan = document.createElement("span");
	        closeSpan.textContent = " ]";
	        div.appendChild(closeSpan);

	        el.appendChild(div);
	    };
	    function appendArray(el, value) {
	        var div = document.createElement("div");

	        var openSpan = document.createElement("span");
	        openSpan.textContent = "[";
	        div.appendChild(openSpan);

	        var s = "";
	        var maxIndex = Math.min(64, value.length);
	        var isFloat = base.typename(value).indexOf("Float") >= 0;
	        for (var n = 0; n < maxIndex; n++) {
	            if (isFloat) {
	                s += padFloat(value[n]);
	            } else {
	                s += " " + padInt(value[n]);
	            }
	            if (n < value.length - 1) {
	                s += ", ";
	            }
	        }
	        if (maxIndex < value.length) {
	            s += ",... (" + value.length + " total)";
	        }
	        var strSpan = document.createElement("span");
	        strSpan.textContent = s;
	        div.appendChild(strSpan);

	        var closeSpan = document.createElement("span");
	        closeSpan.textContent = " ]";
	        div.appendChild(closeSpan);

	        el.appendChild(div);
	    };
	    function padInt(v) {
	        var s = String(v);
	        if (s >= 0) {
	            s = " " + s;
	        }
	        s = s.substr(0, 11);
	        while (s.length < 11) {
	            s = " " + s;
	        }
	        return s;
	    };
	    function padFloat(v) {
	        var s = String(v);
	        if (s >= 0.0) {
	            s = " " + s;
	        }
	        if (s.indexOf(".") == -1) {
	            s += ".";
	        }
	        s = s.substr(0, 12);
	        while (s.length < 12) {
	            s += "0";
	        }
	        return s;
	    };

	    return {
	        appendbr: appendbr,
	        appendClear: appendClear,
	        appendSeparator: appendSeparator,
	        appendParameters: appendParameters,
	        appendStateParameterRow: appendStateParameterRow,
	        appendContextAttributeRow: appendContextAttributeRow,
	        appendMatrices: appendMatrices,
	        appendMatrix: appendMatrix,
	        appendArray: appendArray,
	        padFloat: padFloat,
	        padInt: padInt
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(10), __webpack_require__(28), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function (captureContext, settings, SplitterBar, util) {

	    // options: {
	    //     splitterKey: 'traceSplitter' / etc
	    //     title: 'Texture'
	    //     selectionName: 'Face' / etc
	    //     selectionValues: ['sel 1', 'sel 2', ...]
	    //     disableSizing: true/false
	    //     transparentCanvas: true/false
	    // }

	    var SurfaceInspector = function SurfaceInspector(view, w, elementRoot, options) {
	        var self = this;
	        var context = w.context;
	        this.window = w;
	        this.elements = {
	            toolbar: elementRoot.getElementsByClassName("surface-inspector-toolbar")[0],
	            statusbar: elementRoot.getElementsByClassName("surface-inspector-statusbar")[0],
	            view: elementRoot.getElementsByClassName("surface-inspector-inner")[0]
	        };
	        this.options = options;

	        var defaultWidth = 240;
	        var width = settings.session[options.splitterKey];
	        if (width) {
	            width = Math.max(240, Math.min(width, window.innerWidth - 400));
	        } else {
	            width = defaultWidth;
	        }
	        this.elements.view.style.width = width + "px";
	        this.splitter = new SplitterBar(this.elements.view, "vertical", 240, 800, "splitter-inspector", function (newWidth) {
	            view.setInspectorWidth(newWidth);
	            self.layout();

	            if (self.elements.statusbar) {
	                self.elements.statusbar.style.width = newWidth + "px";
	            }

	            settings.session[options.splitterKey] = newWidth;
	            settings.save();
	        });
	        view.setInspectorWidth(width);

	        // Add view options
	        var optionsDiv = document.createElement("div");
	        optionsDiv.className = "surface-inspector-options";
	        optionsDiv.style.display = "none";
	        var optionsSpan = document.createElement("span");
	        optionsSpan.textContent = options.selectionName + ": ";
	        optionsDiv.appendChild(optionsSpan);
	        var optionsList = document.createElement("select");
	        optionsList.className = "";
	        optionsDiv.appendChild(optionsList);
	        this.setSelectionValues = function (selectionValues) {
	            while (optionsList.hasChildNodes()) {
	                optionsList.removeChild(optionsList.firstChild);
	            }
	            if (selectionValues) {
	                for (var n = 0; n < selectionValues.length; n++) {
	                    var selectionOption = document.createElement("option");
	                    selectionOption.textContent = selectionValues[n];
	                    optionsList.appendChild(selectionOption);
	                }
	            }
	        };
	        this.setSelectionValues(options.selectionValues);
	        this.elements.toolbar.appendChild(optionsDiv);
	        this.elements.faces = optionsDiv;
	        this.optionsList = optionsList;
	        optionsList.onchange = function () {
	            if (self.activeOption != optionsList.selectedIndex) {
	                self.activeOption = optionsList.selectedIndex;
	                self.updatePreview();
	            }
	        };

	        // Add sizing options
	        var sizingDiv = document.createElement("div");
	        sizingDiv.className = "surface-inspector-sizing";
	        if (this.options.disableSizing) {
	            sizingDiv.style.display = "none";
	        }
	        var nativeSize = document.createElement("span");
	        nativeSize.title = "Native resolution (100%)";
	        nativeSize.textContent = "100%";
	        nativeSize.onclick = function () {
	            self.sizingMode = "native";
	            self.layout();
	        };
	        sizingDiv.appendChild(nativeSize);
	        var sepSize = document.createElement("div");
	        sepSize.className = "surface-inspector-sizing-sep";
	        sepSize.textContent = " | ";
	        sizingDiv.appendChild(sepSize);
	        var fitSize = document.createElement("span");
	        fitSize.title = "Fit to inspector window";
	        fitSize.textContent = "Fit";
	        fitSize.onclick = function () {
	            self.sizingMode = "fit";
	            self.layout();
	        };
	        sizingDiv.appendChild(fitSize);
	        this.elements.toolbar.appendChild(sizingDiv);
	        this.elements.sizingDiv = sizingDiv;

	        function getLocationString(x, y) {
	            var width = self.canvas.width;
	            var height = self.canvas.height;
	            var tx = String(Math.round(x / width * 1000) / 1000);
	            var ty = String(Math.round(y / height * 1000) / 1000);
	            if (tx.length == 1) {
	                tx += ".000";
	            }
	            while (tx.length < 5) {
	                tx += "0";
	            }
	            if (ty.length == 1) {
	                ty += ".000";
	            }
	            while (ty.length < 5) {
	                ty += "0";
	            }
	            return x + ", " + y + " (" + tx + ", " + ty + ")";
	        };

	        // Statusbar (may not be present)
	        var updatePixelPreview = null;
	        var pixelDisplayMode = "location";
	        var statusbar = this.elements.statusbar;
	        var pixelCanvas = statusbar && statusbar.getElementsByClassName("surface-inspector-pixel")[0];
	        var locationSpan = statusbar && statusbar.getElementsByClassName("surface-inspector-location")[0];
	        if (statusbar) {
	            statusbar.style.width = width + "px";
	        }
	        if (statusbar && pixelCanvas && locationSpan) {
	            var lastX = 0;
	            var lastY = 0;
	            updatePixelPreview = function updatePixelPreview(x, y) {
	                pixelCanvas.style.display = "none";

	                if (x === null || y === null) {
	                    while (locationSpan.hasChildNodes()) {
	                        locationSpan.removeChild(locationSpan.firstChild);
	                    }
	                    return;
	                }

	                lastX = x;
	                lastY = y;

	                var gl = util.getWebGLContext(self.canvas);
	                var pixel = new Uint8Array(4);
	                gl.readPixels(x, self.canvas.height - y - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
	                var r = pixel[0];
	                var g = pixel[1];
	                var b = pixel[2];
	                var a = pixel[3];
	                var pixelStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

	                // Draw preview in the pixel canvas
	                pixelCanvas.style.display = "";
	                var pctx = pixelCanvas.getContext("2d");
	                pctx.clearRect(0, 0, 1, 1);
	                pctx.fillStyle = pixelStyle;
	                pctx.fillRect(0, 0, 1, 1);

	                switch (pixelDisplayMode) {
	                    case "location":
	                        locationSpan.textContent = getLocationString(x, y);
	                        break;
	                    case "color":
	                        locationSpan.textContent = pixelStyle;
	                        break;
	                }
	            };
	            statusbar.addEventListener("click", function () {
	                if (pixelDisplayMode == "location") {
	                    pixelDisplayMode = "color";
	                } else {
	                    pixelDisplayMode = "location";
	                }
	                updatePixelPreview(lastX, lastY);
	            }, false);

	            this.clearPixel = function () {
	                updatePixelPreview(null, null);
	            };
	        } else {
	            this.clearPixel = function () {};
	        }

	        // Display canvas
	        var canvas = this.canvas = document.createElement("canvas");
	        canvas.className = "gli-reset";
	        if (options.transparentCanvas) {
	            canvas.className += " surface-inspector-canvas-transparent";
	        } else {
	            canvas.className += " surface-inspector-canvas";
	        }
	        canvas.style.display = "none";
	        canvas.width = 1;
	        canvas.height = 1;
	        this.elements.view.appendChild(canvas);

	        function getPixelPosition(e) {
	            var x = e.offsetX || e.layerX;
	            var y = e.offsetY || e.layerY;
	            switch (self.sizingMode) {
	                case "fit":
	                    var scale = parseFloat(self.canvas.style.width) / self.canvas.width;
	                    x /= scale;
	                    y /= scale;
	                    break;
	                case "native":
	                    break;
	            }
	            return [Math.floor(x), Math.floor(y)];
	        };

	        canvas.addEventListener("click", function (e) {
	            var pos = getPixelPosition(e);
	            self.inspectPixel(pos[0], pos[1], getLocationString(pos[0], pos[1]));
	        }, false);

	        if (updatePixelPreview) {
	            canvas.addEventListener("mousemove", function (e) {
	                var pos = getPixelPosition(e);
	                updatePixelPreview(pos[0], pos[1]);
	            }, false);
	        }

	        this.sizingMode = "fit";
	        this.resizeHACK = false;
	        this.elements.view.style.overflow = "";

	        this.activeOption = 0;

	        captureContext.setTimeout(function () {
	            self.setupPreview();
	            self.layout();
	        }, 0);
	    };

	    SurfaceInspector.prototype.inspectPixel = function (x, y, locationString) {};

	    SurfaceInspector.prototype.setupPreview = function () {
	        this.activeOption = 0;
	    };

	    SurfaceInspector.prototype.updatePreview = function () {};

	    SurfaceInspector.prototype.layout = function () {
	        var self = this;
	        this.clearPixel();

	        var size = this.querySize();
	        if (!size) {
	            return;
	        }

	        if (this.options.autoFit) {
	            this.canvas.style.left = "";
	            this.canvas.style.top = "";
	            this.canvas.style.width = "";
	            this.canvas.style.height = "";
	            var parentWidth = this.elements.view.clientWidth;
	            var parentHeight = this.elements.view.clientHeight;
	            this.canvas.width = parentWidth;
	            this.canvas.height = parentHeight;
	            self.updatePreview();
	        } else {
	            switch (this.sizingMode) {
	                case "native":
	                    this.elements.view.style.overflow = "auto";
	                    this.canvas.style.left = "";
	                    this.canvas.style.top = "";
	                    this.canvas.style.width = "";
	                    this.canvas.style.height = "";
	                    break;
	                case "fit":
	                    this.elements.view.style.overflow = "";

	                    var parentWidth = this.elements.view.clientWidth;
	                    var parentHeight = this.elements.view.clientHeight;
	                    var parentar = parentHeight / parentWidth;
	                    var ar = size[1] / size[0];

	                    var width;
	                    var height;
	                    if (ar * parentWidth < parentHeight) {
	                        width = parentWidth;
	                        height = ar * parentWidth;
	                    } else {
	                        height = parentHeight;
	                        width = parentHeight / ar;
	                    }
	                    if (width && height) {
	                        this.canvas.style.width = width + "px";
	                        this.canvas.style.height = height + "px";
	                    }

	                    this.canvas.style.left = parentWidth / 2 - width / 2 + "px";
	                    this.canvas.style.top = parentHeight / 2 - height / 2 + "px";

	                    // HACK: force another layout because we may have changed scrollbar status
	                    if (this.resizeHACK) {
	                        this.resizeHACK = false;
	                    } else {
	                        this.resizeHACK = true;
	                        captureContext.setTimeout(function () {
	                            self.layout();
	                        }, 0);
	                    }
	                    break;
	            }
	        }
	    };

	    SurfaceInspector.prototype.reset = function () {
	        this.elements.view.scrollLeft = 0;
	        this.elements.view.scrollTop = 0;
	    };

	    return SurfaceInspector;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(8), __webpack_require__(7), __webpack_require__(10), __webpack_require__(43), __webpack_require__(23), __webpack_require__(9), __webpack_require__(16)], __WEBPACK_AMD_DEFINE_RESULT__ = function (captureContext, glc, info, settings, shaderUtils, textureInfo, util, Resource) {

	    function isSampler3D(samplerType) {
	        var is3D = samplerType === "sampler3D" || samplerType === "sampler2DArray";
	        return is3D;
	    }

	    function getMinMaxFragmentShaderSnippet(gl, samplerType, vecType) {
	        if (isSampler3D(samplerType)) {
	            return '\n                ivec3 size = textureSize(u_sampler0, 0);\n                ' + vecType + ' minColor = texelFetch(u_sampler0, ivec3(0), 0);\n                ' + vecType + ' maxColor = minColor;\n                for (int z = 0; z < size.z; ++z) {\n                  for (int y = 0; y < size.y; ++y) {\n                    for (int x = 0; x < size.x; ++x) {\n                      ' + vecType + ' color = texelFetch(u_sampler0, ivec3(x, y, z), 0);\n                      minColor = min(minColor, color);\n                      maxColor = max(maxColor, color);\n                    }\n                  }\n                }\n            ';
	        } else {
	            return '\n                ivec2 size = textureSize(u_sampler0, 0);\n                ' + vecType + ' minColor = texelFetch(u_sampler0, ivec2(0), 0);\n                ' + vecType + ' maxColor = minColor;\n                for (int y = 0; y < size.y; ++y) {\n                  for (int x = 0; x < size.x; ++x) {\n                    ' + vecType + ' color = texelFetch(u_sampler0, ivec2(x, y), 0);\n                    minColor = min(minColor, color);\n                    maxColor = max(maxColor, color);\n                  }\n                }\n            ';
	        }
	    }

	    function getInOutSnippets(gl, samplerType, vecType) {
	        // is this hacky? should we use a table?
	        var isFloatType = samplerType[0] === 's';
	        if (isFloatType) {
	            return {
	                outputDefinition: '\n                    layout(location = 0) out highp uvec4 outMinColor;\n                    layout(location = 1) out highp uvec4 outMaxColor;\n                ',
	                output: '\n                    outMinColor = floatBitsToUint(' + vecType + '(minColor.rgb, 0));\n                    outMaxColor = floatBitsToUint(' + vecType + '(maxColor.rgb, 1));\n                ',
	                inputDefinition: '\n                    uniform highp usampler2D u_min;\n                    uniform highp usampler2D u_max;\n                ',
	                input: '\n                    vec4 minColor = uintBitsToFloat(texelFetch(u_min, ivec2(0), 0));\n                    vec4 maxColor = uintBitsToFloat(texelFetch(u_max, ivec2(0), 0));\n                '
	            };
	        } else {
	            return {
	                outputDefinition: '\n                    layout(location = 0) out highp ' + vecType + ' outMinColor;\n                    layout(location = 1) out highp ' + vecType + ' outMaxColor;\n                ',
	                output: '\n                    outMinColor = ' + vecType + '(minColor.rgb, 0);\n                    outMaxColor = ' + vecType + '(maxColor.rgb, 1);\n                ',
	                inputDefinition: '\n                    uniform highp ' + samplerType + ' u_min;\n                    uniform highp ' + samplerType + ' u_max;\n                ',
	                input: '\n                    vec4 minColor = vec4(texelFetch(u_min, ivec2(0), 0));\n                    vec4 maxColor = vec4(texelFetch(u_max, ivec2(0), 0));\n                '
	            };
	        }
	    }

	    // This function is currently only used in WebGL2
	    function generateMinMaxFragmentShader(gl, samplerType, vecType) {
	        var loopSnippet = getMinMaxFragmentShaderSnippet(gl, samplerType, vecType);
	        var inOutSnippets = getInOutSnippets(gl, samplerType, vecType);
	        return '#version 300 es\n            precision mediump float;\n\n            uniform mediump ' + samplerType + ' u_sampler0;\n\n            in vec2 v_uv;\n\n            ' + inOutSnippets.outputDefinition + '\n\n            void main() {\n                ' + loopSnippet + '\n\n                // TODO: decide what to do about unused channels. If the texture is like R16F\n                // only red has valid values. That means GBA\'s zero value affect this answer\n                // conversely normalizing each channel separately is also pretty horrible.\n\n                // Also what to do about solid colors. If min/max are equal.\n\n                minColor = ' + vecType + '(min(min(min(minColor.r, minColor.g), minColor.b), minColor.a));\n                maxColor = ' + vecType + '(max(max(max(maxColor.r, maxColor.g), maxColor.b), maxColor.a));\n\n                ' + inOutSnippets.output + '\n            }\n        ';
	    }

	    function generateColorFragmentShader(gl, samplerType, vecType) {
	        if (!util.isWebGL2(gl)) {
	            return '\n                precision mediump float;\n                uniform mediump sampler2D u_sampler0;\n                uniform sampler2D u_min;\n                uniform sampler2D u_max;\n\n                varying vec2 v_uv;\n\n                void main() {\n                    vec4 minColor = texture2D(u_min, vec2(.5));\n                    vec4 maxColor = texture2D(u_max, vec2(.5));\n                    gl_FragColor = (vec4(texture2D(u_sampler0, v_uv)) - minColor) / (maxColor - minColor);\n                }\n            ';
	        }

	        var inOutSnippets = getInOutSnippets(gl, samplerType, vecType);
	        if (samplerType.endsWith("sampler2D")) {
	            return '#version 300 es\n                precision mediump float;\n                uniform mediump ' + samplerType + ' u_sampler0;\n\n                ' + inOutSnippets.inputDefinition + '\n\n                in vec2 v_uv;\n                out vec4 outColor;\n\n                void main() {\n                    ' + inOutSnippets.input + '\n\n                    outColor = (vec4(texture(u_sampler0, v_uv)) - minColor) / (maxColor - minColor);\n                    outColor.a = 1.;  // TODO: decide what to do about alpha\n                }\n            ';
	        } else if (samplerType.endsWith("sampler2DArray")) {
	            return '#version 300 es\n                precision mediump float;\n                uniform mediump ' + samplerType + ' u_sampler0;\n\n                ' + inOutSnippets.inputDefinition + '\n\n                in vec2 v_uv;\n                out vec4 outColor;\n\n                void main() {\n                    // show every slice squeezed into whatever size quad\n                    // the preview is drawn to\n                    vec3 size = vec3(textureSize(u_sampler0, 0));\n                    float slicesAcross = floor(sqrt(size.z));\n                    float sliceUnit = 1. / slicesAcross;\n                    vec2 sliceST = floor(v_uv / sliceUnit);\n                    float slice = sliceST.x + sliceST.y * slicesAcross;\n                    vec3 uvw = vec3(mod(v_uv, sliceUnit) / sliceUnit, slice);\n\n                    ' + inOutSnippets.input + '\n\n                    outColor = (vec4(texture(u_sampler0, uvw)) - minColor) / (maxColor - minColor);\n                    outColor.a = 1.;  // TODO: decide what to do about alpha\n                }\n            ';
	        } else if (samplerType.endsWith("sampler3D")) {
	            return '#version 300 es\n                precision mediump float;\n                uniform mediump ' + samplerType + ' u_sampler0;\n\n                ' + inOutSnippets.inputDefinition + '\n\n                in vec2 v_uv;\n                out vec4 outColor;\n\n                void main() {\n                    // show every slice squeezed into whatever size quad\n                    // the preview is drawn to\n                    vec3 size = vec3(textureSize(u_sampler0, 0));\n                    float slicesAcross = floor(sqrt(size.z));\n                    float sliceUnit = 1. / slicesAcross;\n                    vec2 sliceST = floor(v_uv / sliceUnit);\n                    float slice = (sliceST.x + sliceST.y * slicesAcross) / size.z;\n                    vec3 uvw = vec3(mod(v_uv, sliceUnit) / sliceUnit, slice);\n\n                    ' + inOutSnippets.input + '\n\n                    outColor = (vec4(texture(u_sampler0, uvw)) - minColor) / (maxColor - minColor);\n                    outColor.a = 1.;  // TODO: decide what to do about alpha\n                }\n            ';
	        } else {
	            return '#version 300 es\n                precision mediump float;\n                uniform mediump ' + samplerType + ' u_sampler0;\n\n                ' + inOutSnippets.inputDefinition + '\n\n                in vec2 v_uv;\n                out vec4 outColor;\n\n                void main() {\n                    ' + inOutSnippets.input + '\n\n                    outColor = (vec4(texture(u_sampler0, v_uv)) - minColor) / (maxColor - minColor);\n                    outColor.a = 1.;  // TODO: decide what to do about alpha\n                }\n            ';
	        }
	    }

	    function generateUnitQuadVertexShader(gl, samplerType, vecType) {
	        if (!util.isWebGL2(gl)) {
	            return '\n                attribute vec4 a_position;\n                varying vec2 v_uv;\n                void main() {\n                    gl_Position = a_position;\n                    v_uv = a_position.xy * vec2(1,-1) * .5 + .5;\n                }\n            ';
	        } else {
	            return '#version 300 es\n                in vec4 a_position;\n                out vec2 v_uv;\n                void main() {\n                    gl_Position = a_position;\n                    v_uv = a_position.xy * vec2(1,-1) * .5 + .5;\n                }\n            ';
	        }
	    }

	    var sharedAttributeNames = ["a_position"];

	    function create1x1PixelTexture(gl, target, internalFormat, format, type, data) {
	        var tex = gl.createTexture();
	        gl.bindTexture(target, tex);
	        if (target === gl.TEXTURE_2D_ARRAY || target === gl.TEXTURE_3D) {
	            gl.texImage3D(target, 0, internalFormat, 1, 1, 1, 0, format, type, data);
	            gl.texParameteri(target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	        } else {
	            gl.texImage2D(target, 0, internalFormat, 1, 1, 0, format, type, data);
	        }
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	        return tex;
	    }

	    var TexturePreviewGenerator = function TexturePreviewGenerator(canvas, useMirror) {
	        this.useMirror = useMirror;
	        if (canvas) {
	            // Re-use the canvas passed in
	        } else {
	            // Create a canvas for previewing
	            canvas = document.createElement("canvas");
	            canvas.className = "gli-reset";

	            // HACK: this gets things working in firefox
	            var frag = document.createDocumentFragment();
	            frag.appendChild(canvas);
	        }
	        this.canvas = canvas;

	        var gl = this.gl = util.getWebGLContext(canvas);
	        this.programInfos = {};
	        this.normMinMaxTextures = {};

	        // Initialize buffer
	        var vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
	        var buffer = this.buffer = gl.createBuffer();
	        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	        gl.bindBuffer(gl.ARRAY_BUFFER, null);

	        this.zeroTex = create1x1PixelTexture(gl, gl.TEXTURE_2D, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
	        this.oneTex = create1x1PixelTexture(gl, gl.TEXTURE_2D, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
	        this.point5Tex = create1x1PixelTexture(gl, gl.TEXTURE_2D, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([127, 127, 127, 127]));
	    };

	    TexturePreviewGenerator.prototype.dispose = function () {
	        var _this = this;

	        var gl = this.gl;

	        Object.keys(this.programInfos).forEach(function (programInfo) {
	            gl.deleteProgram(programInfo.program);
	        });
	        this.programInfos = null;

	        ["zeroTex", "oneTex", "point5Tex"].forEach(function (name) {
	            if (_this[name]) {
	                gl.deleteTexture(_this[name]);
	                _this[name] = null;
	            }
	        });

	        Object.keys(this.normMinMaxTextures).forEach(function (name) {
	            var normMinMax = _this.normMinMaxTextures[name];
	            gl.deleteFramebuffer(normMinMax.framebuffer);
	            gl.deleteTexture(normMinMax.minTex);
	            gl.deleteTexture(normMinMax.maxTex);
	        });

	        gl.deleteBuffer(this.buffer);
	        this.buffer = null;

	        this.gl = null;
	        this.canvas = null;
	    };

	    TexturePreviewGenerator.prototype.getMinMaxTextures = function (samplerType, vecType) {
	        var gl = this.gl;
	        var minMaxName = samplerType + '-' + vecType;
	        if (!this.normMinMaxTextures[minMaxName]) {
	            var internalFormat = void 0;
	            var format = void 0;
	            var type = void 0;
	            switch (samplerType) {
	                case "sampler2D":
	                case "sampler2DArray":
	                    internalFormat = gl.RGBA32UI;
	                    format = gl.RGBA_INTEGER;
	                    type = gl.UNSIGNED_INT;
	                    break;
	                case "isampler2D":
	                case "isampler2DArray":
	                    internalFormat = gl.RGBA32I;
	                    format = gl.RGBA_INTEGER;
	                    type = gl.INT;
	                    break;
	                case "usampler2D":
	                case "usampler2DArray":
	                    internalFormat = gl.RGBA32UI;
	                    format = gl.RGBA_INTEGER;
	                    type = gl.UNSIGNED_INT;
	                    break;
	            }
	            // These are created on demand because they will fail if not WebGL2
	            var minTex = create1x1PixelTexture(gl, gl.TEXTURE_2D, internalFormat, format, type, null);
	            var maxTex = create1x1PixelTexture(gl, gl.TEXTURE_2D, internalFormat, format, type, null);
	            var minMaxFramebuffer = gl.createFramebuffer();
	            gl.bindFramebuffer(gl.FRAMEBUFFER, minMaxFramebuffer);
	            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, minTex, 0);
	            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, maxTex, 0);
	            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	            this.normMinMaxTextures[minMaxName] = {
	                minTex: minTex,
	                maxTex: maxTex,
	                framebuffer: minMaxFramebuffer
	            };
	        }
	        return this.normMinMaxTextures[minMaxName];
	    };

	    function getSamplerTypeForTarget(target, prefix) {
	        var samplerType = void 0;
	        switch (target) {
	            case glc.TEXTURE_2D:
	                samplerType = prefix + 'sampler2D';
	                break;
	            case glc.TEXTURE_CUBE_MAP:
	                samplerType = prefix + 'samplerCube';
	                break;
	            case glc.TEXTURE_3D:
	                samplerType = prefix + 'sampler3D';
	                break;
	            case glc.TEXTURE_2D_ARRAY:
	                samplerType = prefix + 'sampler2DArray';
	                break;
	        }
	        return samplerType;
	    }

	    TexturePreviewGenerator.prototype.draw = function (texture, version, targetFace, desiredWidth, desiredHeight) {
	        var gl = this.gl;

	        if (this.canvas.width != desiredWidth || this.canvas.height != desiredHeight) {
	            this.canvas.width = desiredWidth;
	            this.canvas.height = desiredHeight;
	        }

	        if (texture && version) {
	            var samplerType = "sampler2D";
	            var vecType = "vec4";
	            var normalize = false;
	            var target = version.target;
	            var normalizeTextures = [this.zeroTex, this.oneTex];
	            var internalFormatInfo = textureInfo.getInternalFormatInfo(version.extras.format.internalFormat);
	            if (internalFormatInfo) {
	                switch (internalFormatInfo.colorType) {
	                    case "0-1":
	                        samplerType = getSamplerTypeForTarget(target, "");
	                        vecType = "vec4";
	                        normalize = false;
	                        normalizeTextures = {
	                            minTex: this.zeroTex,
	                            maxTex: this.oneTex
	                        };
	                        break;
	                    case "norm":
	                        samplerType = getSamplerTypeForTarget(target, "");
	                        vecType = "vec4";
	                        normalize = false;
	                        normalizeTextures = {
	                            minTex: this.point5Tex,
	                            maxTex: this.point5Tex
	                        };
	                        break;
	                    case "float":
	                        samplerType = getSamplerTypeForTarget(target, "");
	                        vecType = "vec4";
	                        normalize = true;
	                        normalizeTextures = this.getMinMaxTextures(samplerType, vecType);
	                        break;
	                    case "int":
	                        samplerType = getSamplerTypeForTarget(target, "i");
	                        vecType = "ivec4";
	                        normalize = true;
	                        normalizeTextures = this.getMinMaxTextures(samplerType, vecType);
	                        break;
	                    case "uint":
	                        samplerType = getSamplerTypeForTarget(target, "u");
	                        vecType = "uvec4";
	                        normalize = true;
	                        normalizeTextures = this.getMinMaxTextures(samplerType, vecType);
	                        break;
	                }
	            }

	            var a_position = 0;

	            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

	            gl.enableVertexAttribArray(a_position);
	            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

	            var gltex;
	            if (this.useMirror) {
	                gltex = texture.mirror.target;
	            } else {
	                gltex = texture.createTarget(gl, version, null, targetFace);
	            }

	            gl.disable(gl.CULL_FACE);
	            gl.disable(gl.DEPTH_TEST);

	            if (normalize) {
	                gl.bindFramebuffer(gl.FRAMEBUFFER, normalizeTextures.framebuffer);
	                gl.viewport(0, 0, 1, 1);
	                gl.disable(gl.BLEND);

	                var normShaderName = samplerType + '-' + vecType + '-norm';
	                if (!this.programInfos[normShaderName]) {
	                    this.programInfos[normShaderName] = shaderUtils.createProgramInfo(gl, [generateUnitQuadVertexShader(gl, samplerType, vecType), generateMinMaxFragmentShader(gl, samplerType, vecType)], sharedAttributeNames);
	                }

	                var normProgramInfo = this.programInfos[normShaderName];
	                gl.useProgram(normProgramInfo.program);

	                shaderUtils.setUniforms(gl, normProgramInfo, {
	                    u_sampler0: gltex
	                });

	                gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
	                gl.drawArrays(gl.TRIANGLES, 0, 6);
	                gl.drawBuffers([]);
	            }

	            var shaderName = samplerType + '-' + vecType;
	            if (!this.programInfos[shaderName]) {
	                this.programInfos[shaderName] = shaderUtils.createProgramInfo(gl, [generateUnitQuadVertexShader(gl, samplerType, vecType), generateColorFragmentShader(gl, samplerType, vecType)], sharedAttributeNames);
	            }

	            var programInfo = this.programInfos[shaderName];
	            gl.useProgram(programInfo.program);

	            shaderUtils.setUniforms(gl, programInfo, {
	                u_sampler0: gltex,
	                u_min: normalizeTextures.minTex,
	                u_max: normalizeTextures.maxTex
	            });

	            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	            gl.viewport(0, 0, this.canvas.width, this.canvas.height);

	            gl.colorMask(true, true, true, true);
	            gl.clearColor(0.0, 0.0, 0.0, 0.0);
	            gl.clear(gl.COLOR_BUFFER_BIT);
	            gl.enable(gl.BLEND);
	            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	            gl.drawArrays(gl.TRIANGLES, 0, 6);

	            if (!this.useMirror) {
	                texture.deleteTarget(gl, gltex);
	            }
	        }
	    };

	    TexturePreviewGenerator.prototype.capture = function (doc) {
	        var targetCanvas = doc.createElement("canvas");
	        targetCanvas.className = "gli-reset";
	        targetCanvas.width = this.canvas.width;
	        targetCanvas.height = this.canvas.height;
	        try {
	            var ctx = targetCanvas.getContext("2d");
	            if (doc == this.canvas.ownerDocument) {
	                ctx.drawImage(this.canvas, 0, 0);
	            } else {
	                // Need to extract the data and copy manually, as doc->doc canvas
	                // draws aren't supported for some stupid reason
	                var srcctx = this.canvas.getContext("2d");
	                if (srcctx) {
	                    var srcdata = srcctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	                    ctx.putImageData(srcdata, 0, 0);
	                } else {
	                    var dataurl = this.canvas.toDataURL();
	                    var img = doc.createElement("img");
	                    img.onload = function () {
	                        ctx.drawImage(img, 0, 0);
	                    };
	                    img.src = dataurl;
	                }
	            }
	        } catch (e) {
	            window.console.log('unable to draw texture preview');
	            window.console.log(e);
	        }
	        return targetCanvas;
	    };

	    TexturePreviewGenerator.prototype.buildItem = function (w, doc, gl, texture, closeOnClick, useCache) {
	        var self = this;

	        var el = doc.createElement("div");
	        el.className = "texture-picker-item";
	        if (texture.status == Resource.DEAD) {
	            el.className += " texture-picker-item-deleted";
	        }

	        var previewContainer = doc.createElement("div");
	        previewContainer.className = "texture-picker-item-container";
	        el.appendChild(previewContainer);

	        function updatePreview() {
	            var preview = null;
	            if (useCache && texture.cachedPreview) {
	                // Preview exists - use it
	                preview = texture.cachedPreview;
	            }
	            if (!preview) {
	                // Preview does not exist - create it
	                // TODO: pick the right version
	                var version = texture.currentVersion;
	                var targetFace;
	                switch (texture.type) {
	                    case gl.TEXTURE_CUBE_MAP:
	                        targetFace = gl.TEXTURE_CUBE_MAP_POSITIVE_X; // pick a different face?
	                        break;
	                    default:
	                        targetFace = null;
	                        break;
	                }
	                var size = texture.guessSize(gl, version, targetFace);
	                var desiredWidth = 128;
	                var desiredHeight = 128;
	                if (size) {
	                    if (size[0] > size[1]) {
	                        desiredWidth = 128;
	                        desiredHeight = 128 / (size[0] / size[1]);
	                    } else {
	                        desiredHeight = 128;
	                        desiredWidth = 128 / (size[1] / size[0]);
	                    }
	                }
	                self.draw(texture, version, targetFace, desiredWidth, desiredHeight);
	                preview = self.capture(doc);
	                var x = 128 / 2 - desiredWidth / 2;
	                var y = 128 / 2 - desiredHeight / 2;
	                preview.style.marginLeft = x + "px";
	                preview.style.marginTop = y + "px";
	                if (useCache) {
	                    texture.cachedPreview = preview;
	                }
	            }
	            if (preview) {
	                // TODO: setup
	                preview.className = "";
	                if (preview.parentNode) {
	                    preview.parentNode.removeChild(preview);
	                }
	                while (previewContainer.hasChildNodes()) {
	                    previewContainer.removeChild(previewContainer.firstChild);
	                }
	                previewContainer.appendChild(preview);
	            }
	        };

	        updatePreview();

	        var iconDiv = doc.createElement("div");
	        iconDiv.className = "texture-picker-item-icon";
	        switch (texture.type) {
	            case gl.TEXTURE_2D:
	                iconDiv.className += " texture-picker-item-icon-2d";
	                break;
	            case gl.TEXTURE_CUBE_MAP:
	                iconDiv.className += " texture-picker-item-icon-cube";
	                break;
	        }
	        el.appendChild(iconDiv);

	        var titleDiv = doc.createElement("div");
	        titleDiv.className = "texture-picker-item-title";
	        titleDiv.textContent = texture.getName();
	        el.appendChild(titleDiv);

	        el.onclick = function (e) {
	            w.context.ui.showTexture(texture);
	            if (closeOnClick) {
	                w.close(); // TODO: do this?
	            }
	            e.preventDefault();
	            e.stopPropagation();
	        };

	        texture.modified.addListener(self, function (texture) {
	            texture.cachedPreview = null;
	            updatePreview();
	        });
	        texture.deleted.addListener(self, function (texture) {
	            el.className += " texture-picker-item-deleted";
	        });

	        return el;
	    };

	    return TexturePreviewGenerator;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(8)], __WEBPACK_AMD_DEFINE_RESULT__ = function (glc) {

	    /**
	     * Returns the corresponding bind point for a given sampler type
	     */
	    function getBindPointForSamplerType(gl, type) {
	        return typeMap[type].bindPoint;
	    }

	    // This kind of sucks! If you could compose functions as in `var fn = gl[name];`
	    // this code could be a lot smaller but that is sadly really slow (T_T)

	    function floatSetter(gl, location) {
	        return function (v) {
	            gl.uniform1f(location, v);
	        };
	    }

	    function floatArraySetter(gl, location) {
	        return function (v) {
	            gl.uniform1fv(location, v);
	        };
	    }

	    function floatVec2Setter(gl, location) {
	        return function (v) {
	            gl.uniform2fv(location, v);
	        };
	    }

	    function floatVec3Setter(gl, location) {
	        return function (v) {
	            gl.uniform3fv(location, v);
	        };
	    }

	    function floatVec4Setter(gl, location) {
	        return function (v) {
	            gl.uniform4fv(location, v);
	        };
	    }

	    function intSetter(gl, location) {
	        return function (v) {
	            gl.uniform1i(location, v);
	        };
	    }

	    function intArraySetter(gl, location) {
	        return function (v) {
	            gl.uniform1iv(location, v);
	        };
	    }

	    function intVec2Setter(gl, location) {
	        return function (v) {
	            gl.uniform2iv(location, v);
	        };
	    }

	    function intVec3Setter(gl, location) {
	        return function (v) {
	            gl.uniform3iv(location, v);
	        };
	    }

	    function intVec4Setter(gl, location) {
	        return function (v) {
	            gl.uniform4iv(location, v);
	        };
	    }

	    function uintSetter(gl, location) {
	        return function (v) {
	            gl.uniform1ui(location, v);
	        };
	    }

	    function uintArraySetter(gl, location) {
	        return function (v) {
	            gl.uniform1uiv(location, v);
	        };
	    }

	    function uintVec2Setter(gl, location) {
	        return function (v) {
	            gl.uniform2uiv(location, v);
	        };
	    }

	    function uintVec3Setter(gl, location) {
	        return function (v) {
	            gl.uniform3uiv(location, v);
	        };
	    }

	    function uintVec4Setter(gl, location) {
	        return function (v) {
	            gl.uniform4uiv(location, v);
	        };
	    }

	    function floatMat2Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix2fv(location, false, v);
	        };
	    }

	    function floatMat3Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix3fv(location, false, v);
	        };
	    }

	    function floatMat4Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix4fv(location, false, v);
	        };
	    }

	    function floatMat23Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix2x3fv(location, false, v);
	        };
	    }

	    function floatMat32Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix3x2fv(location, false, v);
	        };
	    }

	    function floatMat24Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix2x4fv(location, false, v);
	        };
	    }

	    function floatMat42Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix4x2fv(location, false, v);
	        };
	    }

	    function floatMat34Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix3x4fv(location, false, v);
	        };
	    }

	    function floatMat43Setter(gl, location) {
	        return function (v) {
	            gl.uniformMatrix4x3fv(location, false, v);
	        };
	    }

	    function samplerSetter(gl, type, unit, location) {
	        var bindPoint = getBindPointForSamplerType(gl, type);
	        return function (textureOrPair) {
	            var texture = void 0;
	            if (textureOrPair instanceof WebGLTexture) {
	                texture = textureOrPair;
	            } else {
	                texture = textureOrPair.texture;
	                gl.bindSampler(unit, textureOrPair.sampler);
	            }
	            gl.uniform1i(location, unit);
	            gl.activeTexture(gl.TEXTURE0 + unit);
	            gl.bindTexture(bindPoint, texture);
	        };
	    }

	    function samplerArraySetter(gl, type, unit, location, size) {
	        var bindPoint = getBindPointForSamplerType(gl, type);
	        var units = new Int32Array(size);
	        for (var ii = 0; ii < size; ++ii) {
	            units[ii] = unit + ii;
	        }

	        return function (textures) {
	            gl.uniform1iv(location, units);
	            textures.forEach(function (textureOrPair, index) {
	                gl.activeTexture(gl.TEXTURE0 + units[index]);
	                var texture = void 0;
	                if (textureOrPair instanceof WebGLTexture) {
	                    texture = textureOrPair;
	                } else {
	                    texture = textureOrPair.texture;
	                    gl.bindSampler(unit, textureOrPair.sampler);
	                }
	                gl.bindTexture(bindPoint, texture);
	            });
	        };
	    }

	    var typeMap = {};
	    typeMap[glc.FLOAT] = { Type: Float32Array, size: 4, setter: floatSetter, arraySetter: floatArraySetter };
	    typeMap[glc.FLOAT_VEC2] = { Type: Float32Array, size: 8, setter: floatVec2Setter };
	    typeMap[glc.FLOAT_VEC3] = { Type: Float32Array, size: 12, setter: floatVec3Setter };
	    typeMap[glc.FLOAT_VEC4] = { Type: Float32Array, size: 16, setter: floatVec4Setter };
	    typeMap[glc.INT] = { Type: Int32Array, size: 4, setter: intSetter, arraySetter: intArraySetter };
	    typeMap[glc.INT_VEC2] = { Type: Int32Array, size: 8, setter: intVec2Setter };
	    typeMap[glc.INT_VEC3] = { Type: Int32Array, size: 12, setter: intVec3Setter };
	    typeMap[glc.INT_VEC4] = { Type: Int32Array, size: 16, setter: intVec4Setter };
	    typeMap[glc.UNSIGNED_INT] = { Type: Uint32Array, size: 4, setter: uintSetter, arraySetter: uintArraySetter };
	    typeMap[glc.UNSIGNED_INT_VEC2] = { Type: Uint32Array, size: 8, setter: uintVec2Setter };
	    typeMap[glc.UNSIGNED_INT_VEC3] = { Type: Uint32Array, size: 12, setter: uintVec3Setter };
	    typeMap[glc.UNSIGNED_INT_VEC4] = { Type: Uint32Array, size: 16, setter: uintVec4Setter };
	    typeMap[glc.BOOL] = { Type: Uint32Array, size: 4, setter: intSetter, arraySetter: intArraySetter };
	    typeMap[glc.BOOL_VEC2] = { Type: Uint32Array, size: 8, setter: intVec2Setter };
	    typeMap[glc.BOOL_VEC3] = { Type: Uint32Array, size: 12, setter: intVec3Setter };
	    typeMap[glc.BOOL_VEC4] = { Type: Uint32Array, size: 16, setter: intVec4Setter };
	    typeMap[glc.FLOAT_MAT2] = { Type: Float32Array, size: 16, setter: floatMat2Setter };
	    typeMap[glc.FLOAT_MAT3] = { Type: Float32Array, size: 36, setter: floatMat3Setter };
	    typeMap[glc.FLOAT_MAT4] = { Type: Float32Array, size: 64, setter: floatMat4Setter };
	    typeMap[glc.FLOAT_MAT2x3] = { Type: Float32Array, size: 24, setter: floatMat23Setter };
	    typeMap[glc.FLOAT_MAT2x4] = { Type: Float32Array, size: 32, setter: floatMat24Setter };
	    typeMap[glc.FLOAT_MAT3x2] = { Type: Float32Array, size: 24, setter: floatMat32Setter };
	    typeMap[glc.FLOAT_MAT3x4] = { Type: Float32Array, size: 48, setter: floatMat34Setter };
	    typeMap[glc.FLOAT_MAT4x2] = { Type: Float32Array, size: 32, setter: floatMat42Setter };
	    typeMap[glc.FLOAT_MAT4x3] = { Type: Float32Array, size: 48, setter: floatMat43Setter };
	    typeMap[glc.SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_2D };
	    typeMap[glc.SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_CUBE_MAP };
	    typeMap[glc.SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_3D };
	    typeMap[glc.SAMPLER_2D_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_2D };
	    typeMap[glc.SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_2D_ARRAY };
	    typeMap[glc.SAMPLER_2D_ARRAY_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_2D_ARRAY };
	    typeMap[glc.SAMPLER_CUBE_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_CUBE_MAP };
	    typeMap[glc.INT_SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_2D };
	    typeMap[glc.INT_SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_3D };
	    typeMap[glc.INT_SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_CUBE_MAP };
	    typeMap[glc.INT_SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_2D_ARRAY };
	    typeMap[glc.UNSIGNED_INT_SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_2D };
	    typeMap[glc.UNSIGNED_INT_SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_3D };
	    typeMap[glc.UNSIGNED_INT_SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_CUBE_MAP };
	    typeMap[glc.UNSIGNED_INT_SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: glc.TEXTURE_2D_ARRAY };

	    function floatAttribSetter(gl, index) {
	        return function (b) {
	            gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
	            gl.enableVertexAttribArray(index);
	            gl.vertexAttribPointer(index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
	        };
	    }

	    function intAttribSetter(gl, index) {
	        return function (b) {
	            gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
	            gl.enableVertexAttribArray(index);
	            gl.vertexAttribIPointer(index, b.numComponents || b.size, b.type || gl.INT, b.stride || 0, b.offset || 0);
	        };
	    }

	    function matAttribSetter(gl, index, typeInfo) {
	        var defaultSize = typeInfo.size;
	        var count = typeInfo.count;

	        return function (b) {
	            gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
	            var numComponents = b.size || b.numComponents || defaultSize;
	            var size = numComponents / count;
	            var type = b.type || gl.FLOAT;
	            var typeInfo = typeMap[type];
	            var stride = typeInfo.size * numComponents;
	            var normalize = b.normalize || false;
	            var offset = b.offset || 0;
	            var rowOffset = stride / count;
	            for (var i = 0; i < count; ++i) {
	                gl.enableVertexAttribArray(index + i);
	                gl.vertexAttribPointer(index + i, size, type, normalize, stride, offset + rowOffset * i);
	            }
	        };
	    }

	    function addLineNumbers(src, lineOffset) {
	        lineOffset = lineOffset || 0;
	        ++lineOffset;

	        return src.split("\n").map(function (line, ndx) {
	            return ndx + lineOffset + ": " + line;
	        }).join("\n");
	    }

	    function createShader(gl, vSrc, vType) {
	        var shader = gl.createShader(vType);
	        gl.shaderSource(shader, vSrc);
	        gl.compileShader(shader);
	        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	        if (!success) {
	            console.error(addLineNumbers(vSrc), "\n", gl.getShaderInfoLog(shader));
	        }
	        return shader;
	    };

	    var shaderTypes = [glc.VERTEX_SHADER, glc.FRAGMENT_SHADER];

	    function createProgram(gl, sources, locations) {
	        var program = gl.createProgram();
	        var shaders = sources.map(function (src, ndx) {
	            var shader = createShader(gl, src, shaderTypes[ndx]);
	            gl.attachShader(program, shader);
	            gl.deleteShader(shader);
	            return shader;
	        });

	        if (locations) {
	            locations.forEach(function (name, ndx) {
	                gl.bindAttribLocation(program, ndx, name);
	            });
	        }

	        gl.linkProgram(program);

	        shaders.forEach(function (shader) {
	            return gl.deleteShader(shader);
	        });
	        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
	        if (!linked) {
	            console.error("--vertexShader--\n", addLineNumbers(source[0]), "--fragmentShader--\n", addLineNumbers(source[1]), "--error--\n", gl.getProgramInfoLog(program));
	        }
	        return program;
	    }

	    function createUniformSetters(gl, program) {
	        var textureUnit = 0;

	        function createUniformSetter(program, uniformInfo) {
	            var location = gl.getUniformLocation(program, uniformInfo.name);
	            var isArray = uniformInfo.size > 1 && uniformInfo.name.substr(-3) === "[0]";
	            var type = uniformInfo.type;
	            var typeInfo = typeMap[type];
	            if (!typeInfo) {
	                throw "unknown type: 0x" + type.toString(16); // we should never get here.
	            }
	            if (typeInfo.bindPoint) {
	                // it's a sampler
	                var unit = textureUnit;
	                textureUnit += uniformInfo.size;

	                if (isArray) {
	                    return typeInfo.arraySetter(gl, type, unit, location, uniformInfo.size);
	                } else {
	                    return typeInfo.setter(gl, type, unit, location, uniformInfo.size);
	                }
	            } else {
	                if (typeInfo.arraySetter && isArray) {
	                    return typeInfo.arraySetter(gl, location);
	                } else {
	                    return typeInfo.setter(gl, location);
	                }
	            }
	        }

	        var uniformSetters = {};
	        var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

	        for (var ii = 0; ii < numUniforms; ++ii) {
	            var uniformInfo = gl.getActiveUniform(program, ii);
	            if (!uniformInfo) {
	                break;
	            }
	            var name = uniformInfo.name;
	            // remove the array suffix.
	            if (name.substr(-3) === "[0]") {
	                name = name.substr(0, name.length - 3);
	            }
	            var setter = createUniformSetter(program, uniformInfo);
	            uniformSetters[name] = setter;
	        }
	        return uniformSetters;
	    }

	    function setUniforms(gl, setters, values) {
	        // eslint-disable-line
	        var actualSetters = setters.uniformSetters || setters;
	        var numArgs = arguments.length;
	        for (var andx = 1; andx < numArgs; ++andx) {
	            var vals = arguments[andx];
	            if (Array.isArray(vals)) {
	                var numValues = vals.length;
	                for (var ii = 0; ii < numValues; ++ii) {
	                    setUniforms(actualSetters, vals[ii]);
	                }
	            } else {
	                for (var name in vals) {
	                    var setter = actualSetters[name];
	                    if (setter) {
	                        setter(vals[name]);
	                    }
	                }
	            }
	        }
	    }

	    function createProgramInfo(gl, sources, attributes) {
	        var program = createProgram(gl, sources, attributes);
	        var uniformSetters = createUniformSetters(gl, program);
	        var programInfo = {
	            program: program,
	            uniformSetters: uniformSetters
	        };

	        return programInfo;
	    }

	    return {
	        createShader: createShader,
	        createProgram: createProgram,
	        createProgramInfo: createProgramInfo,
	        setUniforms: setUniforms
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(7), __webpack_require__(45), __webpack_require__(37), __webpack_require__(39)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, info, DrawInfo, PopupWindow, traceLine) {

	    var TraceListing = function TraceListing(view, w, elementRoot) {
	        var self = this;
	        this.view = view;
	        this.window = w;
	        this.elements = {
	            list: elementRoot.getElementsByClassName("trace-listing")[0]
	        };

	        this.calls = [];

	        this.activeCall = null;
	    };

	    TraceListing.prototype.reset = function () {
	        this.activeCall = null;
	        this.calls.length = 0;

	        // Swap out the element for faster clear
	        var oldList = this.elements.list;
	        var newList = document.createElement("div");
	        newList.className = "trace-listing";
	        newList.style.cssText = oldList.style.cssText;
	        var parentNode = oldList.parentNode;
	        parentNode.replaceChild(newList, oldList);
	        this.elements.list = newList;
	    };

	    function addCall(listing, container, frame, call) {
	        var document = listing.window.document;
	        var gl = listing.window.context;

	        // <div class="trace-call">
	        //     <div class="trace-call-icon">
	        //         &nbsp;
	        //     </div>
	        //     <div class="trace-call-line">
	        //         hello world
	        //     </div>
	        //     <div class="trace-call-actions">
	        //         ??
	        //     </div>
	        // </div>

	        var el = document.createElement("div");
	        el.className = "trace-call";

	        var icon = document.createElement("div");
	        icon.className = "trace-call-icon";
	        el.appendChild(icon);

	        var ordinal = document.createElement("div");
	        ordinal.className = "trace-call-ordinal";
	        ordinal.textContent = call.ordinal;
	        el.appendChild(ordinal);

	        // Actions must go before line for floating to work right
	        var funcInfo = info.functions[call.name];
	        if (funcInfo.type == info.FunctionType.DRAW) {
	            var actions = document.createElement("div");
	            actions.className = "trace-call-actions";

	            var infoAction = document.createElement("div");
	            infoAction.className = "trace-call-action trace-call-action-info";
	            infoAction.title = "View draw information";
	            actions.appendChild(infoAction);
	            infoAction.onclick = function (e) {
	                PopupWindow.show(listing.window.context, DrawInfo, "drawInfo", function (popup) {
	                    popup.inspectDrawCall(frame, call);
	                });
	                e.preventDefault();
	                e.stopPropagation();
	            };

	            var isolateAction = document.createElement("div");
	            isolateAction.className = "trace-call-action trace-call-action-isolate";
	            isolateAction.title = "Run draw call isolated";
	            actions.appendChild(isolateAction);
	            isolateAction.onclick = function (e) {
	                listing.window.controller.runIsolatedDraw(frame, call);
	                //listing.window.controller.runDepthDraw(frame, call);
	                listing.view.minibar.refreshState(true);
	                e.preventDefault();
	                e.stopPropagation();
	            };

	            el.appendChild(actions);
	        }

	        var line = document.createElement("div");
	        line.className = "trace-call-line";
	        traceLine.populateCallLine(listing.window, call, line);
	        el.appendChild(line);

	        if (call.isRedundant) {
	            el.className += " trace-call-redundant";
	        }
	        if (call.error) {
	            el.className += " trace-call-error";

	            var errorString = info.enumToString(call.error);
	            var extraInfo = document.createElement("div");
	            extraInfo.className = "trace-call-extra";
	            var errorName = document.createElement("span");
	            errorName.textContent = errorString;
	            extraInfo.appendChild(errorName);
	            el.appendChild(extraInfo);

	            // If there is a stack, add to tooltip
	            if (call.stack) {
	                var line0 = call.stack[0];
	                extraInfo.title = line0;
	            }
	        }

	        container.appendChild(el);

	        var index = listing.calls.length;
	        el.onclick = function () {
	            listing.view.minibar.stepUntil(index);
	        };

	        listing.calls.push({
	            call: call,
	            element: el,
	            icon: icon
	        });
	    };

	    TraceListing.prototype.setFrame = function (frame) {
	        this.reset();

	        var container = document.createDocumentFragment();

	        for (var n = 0; n < frame.calls.length; n++) {
	            var call = frame.calls[n];
	            addCall(this, container, frame, call);
	        }

	        this.elements.list.appendChild(container);

	        this.elements.list.scrollTop = 0;
	    };

	    TraceListing.prototype.setActiveCall = function (callIndex, ignoreScroll) {
	        if (this.activeCall == callIndex) {
	            return;
	        }

	        if (this.activeCall != null) {
	            // Clean up previous changes
	            var oldel = this.calls[this.activeCall].element;
	            oldel.className = oldel.className.replace("trace-call-highlighted", "");
	            var oldicon = this.calls[this.activeCall].icon;
	            oldicon.className = oldicon.className.replace("trace-call-icon-active", "");
	        }

	        this.activeCall = callIndex;

	        this.calls[callIndex].element.classList.add("trace-call-highlighted");
	        this.calls[callIndex].icon.classList.add("trace-call-icon-active");

	        if (!ignoreScroll) {
	            this.scrollToCall(callIndex);
	        }
	    };

	    TraceListing.prototype.scrollToCall = function (callIndex) {
	        var el = this.calls[callIndex].icon;
	        base.scrollIntoViewIfNeeded(el);
	    };

	    TraceListing.prototype.getScrollState = function () {
	        return {
	            list: this.elements.list.scrollTop
	        };
	    };

	    TraceListing.prototype.setScrollState = function (state) {
	        this.elements.list.scrollTop = state.list;
	    };

	    return TraceListing;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(7), __webpack_require__(9), __webpack_require__(12), __webpack_require__(46), __webpack_require__(37), __webpack_require__(42), __webpack_require__(39), __webpack_require__(40)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, info, util, StateSnapshot, BufferPreview, PopupWindow, TexturePreviewGenerator, traceLine, helpers) {

	    function padValue(v, l) {
	        v = String(v);
	        var n = v.length;
	        while (n < l) {
	            v = " " + v;
	            n++;
	        }
	        return v;
	    };

	    var DrawInfo = function DrawInfo(context, name) {
	        base.subclass(PopupWindow, this, [context, name, "Draw Info", 863, 600]);
	    };

	    DrawInfo.prototype.setup = function () {
	        var self = this;
	        var context = this.context;

	        // TODO: toolbar buttons/etc
	    };

	    DrawInfo.prototype.dispose = function () {
	        this.bufferCanvas = null;
	        this.bufferCanvasOuter = null;
	        if (this.bufferPreviewer) {
	            this.bufferPreviewer.dispose();
	            this.bufferPreviewer = null;
	        }
	        if (this.texturePreviewer) {
	            this.texturePreviewer.dispose();
	            this.texturePreviewer = null;
	        }

	        this.canvas = null;
	        this.gl = null;
	    };

	    DrawInfo.prototype.demandSetup = function () {
	        // This happens around here to work around some Chromium issues with
	        // creating WebGL canvases in differing documents

	        if (this.gl) {
	            return;
	        }

	        var doc = this.browserWindow.document;

	        // TODO: move to shared code
	        function prepareCanvas(canvas) {
	            var frag = document.createDocumentFragment();
	            frag.appendChild(canvas);
	            var gl = util.getWebGLContext(canvas);
	            return gl;
	        };
	        this.canvas = document.createElement("canvas");
	        this.gl = prepareCanvas(this.canvas);

	        this.texturePreviewer = new TexturePreviewGenerator();

	        var bufferCanvas = this.bufferCanvas = doc.createElement("canvas");
	        bufferCanvas.className = "gli-reset drawinfo-canvas";
	        bufferCanvas.width = 256;
	        bufferCanvas.height = 256;
	        var bufferCanvasOuter = this.bufferCanvasOuter = doc.createElement("div");
	        bufferCanvasOuter.style.position = "relative";
	        bufferCanvasOuter.appendChild(bufferCanvas);

	        this.bufferPreviewer = new BufferPreview(bufferCanvas);
	        this.bufferPreviewer.setupDefaultInput();
	    };

	    DrawInfo.prototype.clear = function () {
	        var doc = this.browserWindow.document;
	        doc.title = "Draw Info";
	        var node = this.elements.innerDiv;
	        while (node.hasChildNodes()) {
	            node.removeChild(node.firstChild);
	        }
	    };

	    DrawInfo.prototype.addCallInfo = function (frame, call, drawInfo) {
	        var self = this;
	        var doc = this.browserWindow.document;
	        var gl = this.gl;
	        var innerDiv = this.elements.innerDiv;

	        var panel = this.buildPanel();

	        // Call line
	        var callLine = doc.createElement("div");
	        callLine.className = "drawinfo-call";
	        traceLine.appendCallLine(this.context, callLine, frame, call);
	        panel.appendChild(callLine);

	        // ELEMENT_ARRAY_BUFFER (if an indexed call)
	        if (call.name == "drawElements") {
	            var elementArrayLine = doc.createElement("div");
	            elementArrayLine.className = "drawinfo-elementarray trace-call-line";
	            elementArrayLine.style.paddingLeft = "42px";
	            elementArrayLine.textContent = "ELEMENT_ARRAY_BUFFER: ";
	            traceLine.appendObjectRef(this.context, elementArrayLine, drawInfo.args.elementArrayBuffer);
	            panel.appendChild(elementArrayLine);
	            helpers.appendClear(panel);
	        }

	        helpers.appendClear(innerDiv);
	        helpers.appendbr(innerDiv);

	        // Guess the position attribute
	        var positionIndex = function guessPositionIndex(attribInfos) {
	            // Look for any attributes that sound like a position ('pos'/'position'/etc)
	            // and have the right type (vec2/vec3/vec4)
	            for (var n = 0; n < drawInfo.attribInfos.length; n++) {
	                var attrib = drawInfo.attribInfos[n];
	                if (attrib.name.toLowerCase().indexOf("pos") != -1) {
	                    switch (attrib.type) {
	                        case gl.INT_VEC2:
	                        case gl.INT_VEC3:
	                        case gl.INT_VEC4:
	                        case gl.FLOAT_VEC2:
	                        case gl.FLOAT_VEC3:
	                        case gl.FLOAT_VEC4:
	                            return n;
	                    }
	                }
	            }

	            // Look for the first vec3 attribute
	            for (var n = 0; n < drawInfo.attribInfos.length; n++) {
	                var attrib = drawInfo.attribInfos[n];
	                if (attrib.type == gl.FLOAT_VEC3) {
	                    return n;
	                }
	            }

	            return -1;
	        }(drawInfo.attribInfos);

	        // Setup default preview options
	        var previewOptions = null;
	        if (positionIndex >= 0) {
	            var positionBuffer = drawInfo.attribInfos[positionIndex].state.buffer;
	            var indexBuffer = drawInfo.args.elementArrayBuffer;
	            previewOptions = {
	                mode: drawInfo.args.mode,
	                arrayBuffer: [positionBuffer, positionBuffer.mirror.version],
	                positionIndex: positionIndex,
	                position: drawInfo.attribInfos[positionIndex].state,
	                elementArrayBuffer: indexBuffer ? [indexBuffer, indexBuffer.mirror.version] : null,
	                elementArrayType: drawInfo.args.elementArrayType,
	                offset: drawInfo.args.offset,
	                first: drawInfo.args.first,
	                count: drawInfo.args.count
	            };
	        }

	        // Buffer preview item
	        var bufferDiv = doc.createElement("div");
	        bufferDiv.className = "drawinfo-canvas-outer";
	        bufferDiv.appendChild(this.bufferCanvasOuter);
	        innerDiv.appendChild(bufferDiv);
	        this.bufferPreviewer.setBuffer(previewOptions);
	        this.bufferPreviewer.draw();

	        // Frame preview item
	        var frameDiv = doc.createElement("div");
	        frameDiv.className = "drawinfo-canvas-outer";
	        var cc = doc.createElement("canvas");
	        cc.className = "gli-reset drawinfo-canvas drawinfo-canvas-trans";
	        cc.width = 256;
	        cc.height = 256;
	        frameDiv.appendChild(cc);
	        innerDiv.appendChild(frameDiv);

	        // Isolated preview item
	        var frameDiv = doc.createElement("div");
	        frameDiv.className = "drawinfo-canvas-outer";
	        var cc = doc.createElement("canvas");
	        cc.className = "gli-reset drawinfo-canvas drawinfo-canvas-trans";
	        cc.width = 256;
	        cc.height = 256;
	        frameDiv.appendChild(cc);
	        innerDiv.appendChild(frameDiv);

	        helpers.appendClear(innerDiv);
	        helpers.appendbr(innerDiv);

	        var optionsDiv = doc.createElement("div");
	        optionsDiv.className = "drawinfo-options";

	        var attributeSelect = doc.createElement("select");
	        var maxAttribNameLength = 0;
	        var maxBufferNameLength = 0;
	        for (var n = 0; n < drawInfo.attribInfos.length; n++) {
	            maxAttribNameLength = Math.max(maxAttribNameLength, drawInfo.attribInfos[n].name.length);
	            var buffer = drawInfo.attribInfos[n].state.buffer;
	            if (buffer) {
	                maxBufferNameLength = Math.max(maxBufferNameLength, buffer.getName().length);
	            }
	        }
	        for (var n = 0; n < drawInfo.attribInfos.length; n++) {
	            var attrib = drawInfo.attribInfos[n];
	            var option = doc.createElement("option");
	            var typeString;
	            switch (attrib.state.type) {
	                case gl.BYTE:
	                    typeString = "BYTE";
	                    break;
	                case gl.UNSIGNED_BYTE:
	                    typeString = "UNSIGNED_BYTE";
	                    break;
	                case gl.SHORT:
	                    typeString = "SHORT";
	                    break;
	                case gl.UNSIGNED_SHORT:
	                    typeString = "UNSIGNED_SHORT";
	                    break;
	                default:
	                case gl.FLOAT:
	                    typeString = "FLOAT";
	                    break;
	            }
	            option.textContent = padValue(attrib.name, maxAttribNameLength) + ": ";
	            if (attrib.state.buffer) {
	                option.textContent += padValue("[" + attrib.state.buffer.getName() + "]", maxBufferNameLength) + " " + padValue("+" + attrib.state.pointer, 4) + " / " + attrib.state.size + " * " + typeString;
	            } else {
	                option.textContent += util.typedArrayToString(attrib.state.value);
	            }
	            attributeSelect.appendChild(option);
	        }
	        attributeSelect.selectedIndex = positionIndex;
	        attributeSelect.onchange = function () {
	            frame.switchMirrors("drawinfo");
	            previewOptions.positionIndex = attributeSelect.selectedIndex;
	            previewOptions.position = drawInfo.attribInfos[previewOptions.positionIndex].state;
	            var positionBuffer = drawInfo.attribInfos[previewOptions.positionIndex].state.buffer;
	            previewOptions.arrayBuffer = [positionBuffer, positionBuffer.mirror.version];
	            try {
	                self.bufferPreviewer.setBuffer(previewOptions);
	            } catch (e) {
	                console.log("error trying to preview buffer: " + e);
	            }
	            self.bufferPreviewer.draw();
	            frame.switchMirrors();
	        };
	        optionsDiv.appendChild(attributeSelect);

	        innerDiv.appendChild(optionsDiv);

	        helpers.appendClear(innerDiv);
	        helpers.appendbr(innerDiv);
	    };

	    DrawInfo.prototype.appendTable = function (el, drawInfo, name, tableData, valueCallback) {
	        var doc = this.browserWindow.document;
	        var gl = this.gl;

	        // [ordinal, name, size, type, optional value]
	        var table = doc.createElement("table");
	        table.className = "program-attribs";

	        var tr = doc.createElement("tr");
	        var td = doc.createElement("th");
	        td.textContent = "idx";
	        tr.appendChild(td);
	        td = doc.createElement("th");
	        td.className = "program-attribs-name";
	        td.textContent = name + " name";
	        tr.appendChild(td);
	        td = doc.createElement("th");
	        td.textContent = "size";
	        tr.appendChild(td);
	        td = doc.createElement("th");
	        td.className = "program-attribs-type";
	        td.textContent = "type";
	        tr.appendChild(td);
	        if (valueCallback) {
	            td = doc.createElement("th");
	            td.className = "program-attribs-value";
	            td.textContent = "value";
	            tr.appendChild(td);
	        }
	        table.appendChild(tr);

	        for (var n = 0; n < tableData.length; n++) {
	            var row = tableData[n];

	            var tr = doc.createElement("tr");
	            td = doc.createElement("td");
	            td.textContent = row[0];
	            tr.appendChild(td);
	            td = doc.createElement("td");
	            td.textContent = row[1];
	            tr.appendChild(td);
	            td = doc.createElement("td");
	            td.textContent = row[2];
	            tr.appendChild(td);
	            td = doc.createElement("td");
	            switch (row[3]) {
	                case gl.FLOAT:
	                    td.textContent = "FLOAT";
	                    break;
	                case gl.FLOAT_VEC2:
	                    td.textContent = "FLOAT_VEC2";
	                    break;
	                case gl.FLOAT_VEC3:
	                    td.textContent = "FLOAT_VEC3";
	                    break;
	                case gl.FLOAT_VEC4:
	                    td.textContent = "FLOAT_VEC4";
	                    break;
	                case gl.INT:
	                    td.textContent = "INT";
	                    break;
	                case gl.INT_VEC2:
	                    td.textContent = "INT_VEC2";
	                    break;
	                case gl.INT_VEC3:
	                    td.textContent = "INT_VEC3";
	                    break;
	                case gl.INT_VEC4:
	                    td.textContent = "INT_VEC4";
	                    break;
	                case gl.BOOL:
	                    td.textContent = "BOOL";
	                    break;
	                case gl.BOOL_VEC2:
	                    td.textContent = "BOOL_VEC2";
	                    break;
	                case gl.BOOL_VEC3:
	                    td.textContent = "BOOL_VEC3";
	                    break;
	                case gl.BOOL_VEC4:
	                    td.textContent = "BOOL_VEC4";
	                    break;
	                case gl.FLOAT_MAT2:
	                    td.textContent = "FLOAT_MAT2";
	                    break;
	                case gl.FLOAT_MAT3:
	                    td.textContent = "FLOAT_MAT3";
	                    break;
	                case gl.FLOAT_MAT4:
	                    td.textContent = "FLOAT_MAT4";
	                    break;
	                case gl.SAMPLER_2D:
	                    td.textContent = "SAMPLER_2D";
	                    break;
	                case gl.SAMPLER_CUBE:
	                    td.textContent = "SAMPLER_CUBE";
	                    break;
	            }
	            tr.appendChild(td);

	            if (valueCallback) {
	                td = doc.createElement("td");
	                valueCallback(n, td);
	                tr.appendChild(td);
	            }

	            table.appendChild(tr);
	        }

	        el.appendChild(table);
	    };

	    DrawInfo.prototype.appendUniformInfos = function (el, drawInfo) {
	        var self = this;
	        var doc = this.browserWindow.document;
	        var gl = this.gl;

	        var uniformInfos = drawInfo.uniformInfos;
	        var tableData = [];
	        for (var n = 0; n < uniformInfos.length; n++) {
	            var uniformInfo = uniformInfos[n];
	            tableData.push([uniformInfo.index, uniformInfo.name, uniformInfo.size, uniformInfo.type]);
	        }
	        this.appendTable(el, drawInfo, "uniform", tableData, function (n, el) {
	            var uniformInfo = uniformInfos[n];
	            if (uniformInfo.textureValue) {
	                // Texture value
	                var texture = uniformInfo.textureValue;

	                var samplerDiv = doc.createElement("div");
	                samplerDiv.className = "drawinfo-sampler-value";
	                samplerDiv.textContent = "Sampler: " + uniformInfo.value;
	                el.appendChild(samplerDiv);
	                el.appendChild(document.createTextNode(" "));
	                traceLine.appendObjectRef(self.context, el, uniformInfo.textureValue);

	                if (texture) {
	                    var item = self.texturePreviewer.buildItem(self, doc, gl, texture, false, false);
	                    item.className += " drawinfo-sampler-thumb";
	                    el.appendChild(item);
	                }
	            } else {
	                // Normal value
	                switch (uniformInfo.type) {
	                    case gl.FLOAT_MAT2:
	                    case gl.FLOAT_MAT3:
	                    case gl.FLOAT_MAT4:
	                        helpers.appendMatrices(gl, el, uniformInfo.type, uniformInfo.size, uniformInfo.value);
	                        break;
	                    case gl.FLOAT:
	                        el.textContent = " " + helpers.padFloat(uniformInfo.value);
	                        break;
	                    case gl.INT:
	                    case gl.BOOL:
	                        el.textContent = " " + helpers.padInt(uniformInfo.value);
	                        break;
	                    default:
	                        if (uniformInfo.value.hasOwnProperty("length")) {
	                            helpers.appendArray(el, uniformInfo.value);
	                        } else {
	                            // TODO: prettier display
	                            el.textContent = uniformInfo.value;
	                        }
	                        break;
	                }
	            }
	        });
	    };

	    DrawInfo.prototype.appendAttribInfos = function (el, drawInfo) {
	        var self = this;
	        var doc = this.browserWindow.document;
	        var gl = this.gl;

	        var attribInfos = drawInfo.attribInfos;
	        var tableData = [];
	        for (var n = 0; n < attribInfos.length; n++) {
	            var attribInfo = attribInfos[n];
	            tableData.push([attribInfo.index, attribInfo.name, attribInfo.size, attribInfo.type]);
	        }
	        this.appendTable(el, drawInfo, "attribute", tableData, function (n, el) {
	            var attribInfo = attribInfos[n];
	            if (attribInfo.state.buffer) {
	                el.textContent = "Buffer: ";
	                traceLine.appendObjectRef(self.context, el, attribInfo.state.buffer);
	                var typeString;
	                switch (attribInfo.state.type) {
	                    case gl.BYTE:
	                        typeString = "BYTE";
	                        break;
	                    case gl.UNSIGNED_BYTE:
	                        typeString = "UNSIGNED_BYTE";
	                        break;
	                    case gl.SHORT:
	                        typeString = "SHORT";
	                        break;
	                    case gl.UNSIGNED_SHORT:
	                        typeString = "UNSIGNED_SHORT";
	                        break;
	                    default:
	                    case gl.FLOAT:
	                        typeString = "FLOAT";
	                        break;
	                }
	                var specifierSpan = doc.createElement("span");
	                specifierSpan.textContent = " " + padValue("+" + attribInfo.state.pointer, 4) + " / " + attribInfo.state.size + " * " + typeString + (attribInfo.state.normalized ? " N" : "");
	                el.appendChild(specifierSpan);
	            } else {
	                el.textContent = "Constant: ";
	                // TODO: pretty print
	                el.textContent += attribInfo.state.value;
	            }
	        });
	    };

	    DrawInfo.prototype.addProgramInfo = function (frame, call, drawInfo) {
	        var doc = this.browserWindow.document;
	        var gl = this.gl;
	        var innerDiv = this.elements.innerDiv;

	        var panel = this.buildPanel();

	        // Name
	        var programLine = doc.createElement("div");
	        programLine.className = "drawinfo-program trace-call-line";
	        var frag = document.createDocumentFragment();
	        var b = document.createElement("b");
	        b.textContent = "Program";
	        frag.appendChild(b);
	        frag.appendChild(document.createTextNode(": "));
	        programLine.appendChild(frag);

	        traceLine.appendObjectRef(this.context, programLine, drawInfo.program);
	        panel.appendChild(programLine);
	        helpers.appendClear(panel);
	        helpers.appendClear(innerDiv);
	        helpers.appendbr(innerDiv);

	        // Uniforms
	        this.appendUniformInfos(innerDiv, drawInfo);
	        helpers.appendbr(innerDiv);

	        // Vertex attribs
	        this.appendAttribInfos(innerDiv, drawInfo);
	        helpers.appendbr(innerDiv);
	    };

	    DrawInfo.prototype.addStateInfo = function (frame, call, drawInfo) {
	        var doc = this.browserWindow.document;
	        var gl = this.gl;
	        var innerDiv = this.elements.innerDiv;

	        var panel = this.buildPanel();

	        var programLine = doc.createElement("div");
	        programLine.className = "drawinfo-program trace-call-line";
	        var b = document.createElement("b");
	        b.textContent = "State";
	        programLine.appendChild(b);

	        // TODO: link to state object
	        panel.appendChild(programLine);
	        helpers.appendClear(panel);
	        helpers.appendClear(innerDiv);

	        var vertexState = ["CULL_FACE", "CULL_FACE_MODE", "FRONT_FACE", "LINE_WIDTH"];

	        var fragmentState = ["BLEND", "BLEND_EQUATION_RGB", "BLEND_EQUATION_ALPHA", "BLEND_SRC_RGB", "BLEND_SRC_ALPHA", "BLEND_DST_RGB", "BLEND_DST_ALPHA", "BLEND_COLOR"];

	        var depthStencilState = ["DEPTH_TEST", "DEPTH_FUNC", "DEPTH_RANGE", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_UNITS", "STENCIL_TEST", "STENCIL_FUNC", "STENCIL_REF", "STENCIL_VALUE_MASK", "STENCIL_FAIL", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_BACK_FUNC", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_FAIL", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS"];

	        var outputState = ["VIEWPORT", "SCISSOR_TEST", "SCISSOR_BOX", "COLOR_WRITEMASK", "DEPTH_WRITEMASK", "STENCIL_WRITEMASK", "FRAMEBUFFER_BINDING"
	        // TODO: RTT / renderbuffers/etc
	        ];

	        function generateStateTable(el, name, state, enumNames) {
	            var titleDiv = doc.createElement("div");
	            titleDiv.className = "info-title-master";
	            titleDiv.textContent = name;
	            el.appendChild(titleDiv);

	            var table = doc.createElement("table");
	            table.className = "info-parameters";

	            var stateParameters = info.stateParameters;
	            for (var n = 0; n < enumNames.length; n++) {
	                var enumName = enumNames[n];
	                var param = stateParameters[enumName];
	                helpers.appendStateParameterRow(this.window, gl, table, state, param);
	            }

	            el.appendChild(table);
	        };

	        generateStateTable(innerDiv, "Vertex State", drawInfo.state, vertexState);
	        generateStateTable(innerDiv, "Fragment State", drawInfo.state, fragmentState);
	        generateStateTable(innerDiv, "Depth/Stencil State", drawInfo.state, depthStencilState);
	        generateStateTable(innerDiv, "Output State", drawInfo.state, outputState);
	    };

	    DrawInfo.prototype.captureDrawInfo = function (frame, call) {
	        var gl = this.gl;

	        var drawInfo = {
	            args: {
	                mode: 0,
	                elementArrayBuffer: null,
	                elementArrayType: 0,
	                first: 0,
	                offset: 0,
	                count: 0
	            },
	            program: null,
	            uniformInfos: [],
	            attribInfos: [],
	            state: null
	        };

	        // Args
	        switch (call.name) {
	            case "drawArrays":
	                drawInfo.args.mode = call.args[0];
	                drawInfo.args.first = call.args[1];
	                drawInfo.args.count = call.args[2];
	                break;
	            case "drawElements":
	                drawInfo.args.mode = call.args[0];
	                drawInfo.args.count = call.args[1];
	                drawInfo.args.elementArrayType = call.args[2];
	                drawInfo.args.offset = call.args[3];
	                var glelementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
	                drawInfo.args.elementArrayBuffer = glelementArrayBuffer ? glelementArrayBuffer.trackedObject : null;
	                break;
	        }

	        // Program
	        var glprogram = gl.getParameter(gl.CURRENT_PROGRAM);
	        drawInfo.program = glprogram ? glprogram.trackedObject : null;
	        if (glprogram) {
	            drawInfo.uniformInfos = drawInfo.program.getUniformInfos(gl, glprogram);
	            drawInfo.attribInfos = drawInfo.program.getAttribInfos(gl, glprogram);
	        }

	        // Capture entire state for blend mode/etc
	        drawInfo.state = new StateSnapshot(gl);

	        return drawInfo;
	    };

	    DrawInfo.prototype.inspectDrawCall = function (frame, drawCall) {
	        var doc = this.browserWindow.document;
	        doc.title = "Draw Info: #" + drawCall.ordinal + " " + drawCall.name;

	        var innerDiv = this.elements.innerDiv;
	        while (innerDiv.hasChildNodes()) {
	            innerDiv.removeChild(innerDiv.firstChild);
	        }

	        this.demandSetup();

	        // Prep canvas
	        var width = frame.canvasInfo.width;
	        var height = frame.canvasInfo.height;
	        this.canvas.width = width;
	        this.canvas.height = height;
	        var gl = this.gl;

	        // Prepare canvas
	        frame.switchMirrors("drawinfo");
	        frame.makeActive(gl, true, {
	            ignoreTextureUploads: true
	        });

	        // Issue all calls (minus the draws we don't care about) and stop at our draw
	        for (var n = 0; n < frame.calls.length; n++) {
	            var call = frame.calls[n];

	            if (call == drawCall) {
	                // Call we want
	            } else {
	                // Skip other draws/etc
	                switch (call.name) {
	                    case "drawArrays":
	                    case "drawElements":
	                        continue;
	                }
	            }

	            call.emit(gl);

	            if (call == drawCall) {
	                break;
	            }
	        }

	        // Capture interesting draw info
	        var drawInfo = this.captureDrawInfo(frame, drawCall);

	        this.addCallInfo(frame, drawCall, drawInfo);
	        this.addProgramInfo(frame, drawCall, drawInfo);
	        this.addStateInfo(frame, drawCall, drawInfo);

	        helpers.appendbr(innerDiv);

	        // Restore all resource mirrors
	        frame.switchMirrors(null);
	    };

	    return DrawInfo;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(47), __webpack_require__(43), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function (m4, shaderUtils, util) {

	    var BufferPreview = function BufferPreview(canvas) {
	        this.document = canvas.ownerDocument;
	        this.canvas = canvas;
	        this.drawState = null;

	        var expandLink = this.expandLink = document.createElement("span");
	        expandLink.className = "surface-inspector-collapsed";
	        expandLink.textContent = "Show preview";
	        expandLink.style.visibility = "collapse";
	        canvas.parentNode.appendChild(expandLink);

	        var gl = this.gl = util.getWebGLContext(canvas);
	        this.programInfo = shaderUtils.createProgramInfo(gl, ['\n                uniform mat4 u_projMatrix;\n                uniform mat4 u_modelViewMatrix;\n                uniform mat4 u_modelViewInvMatrix;\n                uniform bool u_enableLighting;\n                attribute vec4 a_position;\n                attribute vec4 a_normal;\n                varying vec3 v_lighting;\n                void main() {\n                    gl_Position = u_projMatrix * u_modelViewMatrix * a_position;\n                    if (u_enableLighting) {\n                        vec3 lightDirection = vec3(0.0, 0.0, 1.0);\n                        vec4 normalT = u_modelViewInvMatrix * a_normal;\n                        float lighting = max(dot(normalT.xyz, lightDirection), 0.0);\n                        v_lighting = vec3(0.2, 0.2, 0.2) + vec3(1.0, 1.0, 1.0) * lighting;\n                    } else {\n                        v_lighting = vec3(1.0, 1.0, 1.0);\n                    }\n                    gl_PointSize = 3.0;\n                }\n             ', '\n                precision highp float;\n                uniform bool u_wireframe;\n                varying vec3 v_lighting;\n                void main() {\n                    vec4 color;\n                    if (u_wireframe) {\n                        color = vec4(1.0, 1.0, 1.0, 0.4);\n                    } else {\n                        color = vec4(1.0, 0.0, 0.0, 1.0);\n                    }\n                    gl_FragColor = vec4(color.rgb * v_lighting, color.a);\n                }\n              '], ['a_position', 'a_normal']);

	        this.programInfo.a_position = 0;
	        this.programInfo.a_normal = 1;

	        // Default state
	        gl.clearColor(0.0, 0.0, 0.0, 0.0);
	        gl.depthFunc(gl.LEQUAL);
	        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	        gl.disable(gl.CULL_FACE);

	        this.camera = {
	            defaultDistance: 5,
	            distance: 5,
	            rotx: 0,
	            roty: 0
	        };
	    };

	    BufferPreview.prototype.resetCamera = function () {
	        this.camera.distance = this.camera.defaultDistance;
	        this.camera.rotx = 0;
	        this.camera.roty = 0;
	        this.draw();
	    };

	    BufferPreview.prototype.dispose = function () {
	        var gl = this.gl;

	        this.setBuffer(null);

	        gl.deleteProgram(this.programInfo.program);
	        this.programInfo = null;

	        this.gl = null;
	        this.canvas = null;
	    };

	    BufferPreview.prototype.draw = function () {
	        var gl = this.gl;

	        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	        if (!this.drawState) {
	            return;
	        }
	        var ds = this.drawState;

	        gl.useProgram(this.programInfo.program);

	        // Setup projection matrix
	        var zn = 0.1;
	        var zf = 1000.0; // TODO: normalize depth range based on buffer?
	        var fovy = 45.0 * Math.PI / 180;
	        var aspectRatio = this.canvas.width / this.canvas.height;

	        var projMatrix = m4.perspective(fovy, aspectRatio, zn, zf);

	        // Build the view matrix
	        /*this.camera = {
	        distance: 5,
	        rotx: 0,
	        roty: 0
	        };*/

	        var modelViewMatrix = m4.identity();
	        modelViewMatrix = m4.translate(modelViewMatrix, [0, 0, -this.camera.distance * 5]);
	        modelViewMatrix = m4.rotateY(modelViewMatrix, this.camera.rotx);
	        modelViewMatrix = m4.rotateX(modelViewMatrix, this.camera.roty);

	        modelViewInvMatrix = m4.transpose(m4.inverse(modelViewMatrix));

	        shaderUtils.setUniforms(gl, this.programInfo, {
	            u_projMatrix: projMatrix,
	            u_modelViewMatrix: modelViewMatrix,
	            u_modelViewInvMatrix: modelViewInvMatrix
	        });

	        gl.enable(gl.DEPTH_TEST);
	        gl.disable(gl.BLEND);

	        if (!this.triBuffer) {
	            // No custom buffer, draw raw user stuff
	            shaderUtils.setUniforms(gl, this.programInfo, {
	                u_enableLighting: 0,
	                u_wireframe: 0
	            });
	            gl.enableVertexAttribArray(this.programInfo.a_position);
	            gl.disableVertexAttribArray(this.programInfo.a_normal);
	            gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBufferTarget);
	            gl.vertexAttribPointer(this.programInfo.a_position, ds.position.size, ds.position.type, ds.position.normalized, ds.position.stride, ds.position.offset);
	            gl.vertexAttribPointer(this.programInfo.a_normal, 3, gl.FLOAT, false, ds.position.stride, 0);
	            if (this.elementArrayBufferTarget) {
	                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementArrayBufferTarget);
	                gl.drawElements(ds.mode, ds.count, ds.elementArrayType, ds.offset);
	            } else {
	                gl.drawArrays(ds.mode, ds.first, ds.count);
	            }
	        } else {
	            // Draw triangles
	            if (this.triBuffer) {
	                shaderUtils.setUniforms(gl, this.programInfo, {
	                    u_enableLighting: 1,
	                    u_wireframe: 0
	                });
	                gl.enableVertexAttribArray(this.programInfo.a_position);
	                gl.enableVertexAttribArray(this.programInfo.a_normal);
	                gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuffer);
	                gl.vertexAttribPointer(this.programInfo.a_position, 3, gl.FLOAT, false, 24, 0);
	                gl.vertexAttribPointer(this.programInfo.a_normal, 3, gl.FLOAT, false, 24, 12);
	                gl.drawArrays(gl.TRIANGLES, 0, this.triBuffer.count);
	            }

	            // Draw wireframe
	            if (this.lineBuffer) {
	                gl.enable(gl.DEPTH_TEST);
	                gl.enable(gl.BLEND);
	                shaderUtils.setUniforms(gl, this.programInfo, {
	                    u_enableLighting: 0,
	                    u_wireframe: 1
	                });
	                gl.enableVertexAttribArray(this.programInfo.a_position);
	                gl.disableVertexAttribArray(this.programInfo.a_normal);
	                gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
	                gl.vertexAttribPointer(this.programInfo.a_position, 3, gl.FLOAT, false, 0, 0);
	                gl.vertexAttribPointer(this.programInfo.a_normal, 3, gl.FLOAT, false, 0, 0);
	                gl.drawArrays(gl.LINES, 0, this.lineBuffer.count);
	            }
	        }
	    };

	    function extractAttribute(gl, buffer, version, attrib) {
	        var data = buffer.constructVersion(gl, version);
	        if (!data) {
	            return null;
	        }
	        var dataBuffer = data.buffer ? data.buffer : data;

	        var result = [];

	        var byteAdvance = 0;
	        switch (attrib.type) {
	            case gl.BYTE:
	            case gl.UNSIGNED_BYTE:
	                byteAdvance = 1 * attrib.size;
	                break;
	            case gl.SHORT:
	            case gl.UNSIGNED_SHORT:
	                byteAdvance = 2 * attrib.size;
	                break;
	            default:
	            case gl.FLOAT:
	                byteAdvance = 4 * attrib.size;
	                break;
	        }
	        var stride = attrib.stride ? attrib.stride : byteAdvance;
	        var byteOffset = 0;
	        while (byteOffset < data.byteLength) {
	            var readView = null;
	            switch (attrib.type) {
	                case gl.BYTE:
	                    readView = new Int8Array(dataBuffer, byteOffset, attrib.size);
	                    break;
	                case gl.UNSIGNED_BYTE:
	                    readView = new Uint8Array(dataBuffer, byteOffset, attrib.size);
	                    break;
	                case gl.SHORT:
	                    readView = new Int16Array(dataBuffer, byteOffset, attrib.size);
	                    break;
	                case gl.UNSIGNED_SHORT:
	                    readView = new Uint16Array(dataBuffer, byteOffset, attrib.size);
	                    break;
	                default:
	                case gl.FLOAT:
	                    readView = new Float32Array(dataBuffer, byteOffset, attrib.size);
	                    break;
	            }

	            // HACK: this is completely and utterly stupidly slow
	            // TODO: speed up extracting attributes
	            switch (attrib.size) {
	                case 1:
	                    result.push([readView[0], 0, 0, 0]);
	                    break;
	                case 2:
	                    result.push([readView[0], readView[1], 0, 0]);
	                    break;
	                case 3:
	                    result.push([readView[0], readView[1], readView[2], 0]);
	                    break;
	                case 4:
	                    result.push([readView[0], readView[1], readView[2], readView[3]]);
	                    break;
	            }

	            byteOffset += stride;
	        }

	        return result;
	    };

	    function buildTriangles(gl, drawState, start, count, positionData, indices) {
	        var triangles = [];

	        var end = start + count;

	        // Emit triangles
	        switch (drawState.mode) {
	            case gl.TRIANGLES:
	                if (indices) {
	                    for (var n = start; n < end; n += 3) {
	                        triangles.push([indices[n], indices[n + 1], indices[n + 2]]);
	                    }
	                } else {
	                    for (var n = start; n < end; n += 3) {
	                        triangles.push([n, n + 1, n + 2]);
	                    }
	                }
	                break;
	            case gl.TRIANGLE_FAN:
	                if (indices) {
	                    triangles.push([indices[start], indices[start + 1], indices[start + 2]]);
	                    for (var n = start + 2; n < end; n++) {
	                        triangles.push([indices[start], indices[n], indices[n + 1]]);
	                    }
	                } else {
	                    triangles.push([start, start + 1, start + 2]);
	                    for (var n = start + 2; n < end; n++) {
	                        triangles.push([start, n, n + 1]);
	                    }
	                }
	                break;
	            case gl.TRIANGLE_STRIP:
	                if (indices) {
	                    for (var n = start; n < end - 2; n++) {
	                        if (indices[n] == indices[n + 1]) {
	                            // Degenerate
	                            continue;
	                        }
	                        if (n % 2 == 0) {
	                            triangles.push([indices[n], indices[n + 1], indices[n + 2]]);
	                        } else {
	                            triangles.push([indices[n + 2], indices[n + 1], indices[n]]);
	                        }
	                    }
	                } else {
	                    for (var n = start; n < end - 2; n++) {
	                        if (n % 2 == 0) {
	                            triangles.push([n, n + 1, n + 2]);
	                        } else {
	                            triangles.push([n + 2, n + 1, n]);
	                        }
	                    }
	                }
	                break;
	        }

	        return triangles;
	    };

	    // from tdl
	    function normalize(a) {
	        var r = [];
	        var n = 0.0;
	        var aLength = a.length;
	        for (var i = 0; i < aLength; i++) {
	            n += a[i] * a[i];
	        }
	        n = Math.sqrt(n);
	        if (n > 0.00001) {
	            for (var i = 0; i < aLength; i++) {
	                r[i] = a[i] / n;
	            }
	        } else {
	            r = [0, 0, 0];
	        }
	        return r;
	    };

	    // drawState: {
	    //     mode: enum
	    //     arrayBuffer: [value, version]
	    //     position: { size: enum, type: enum, normalized: bool, stride: n, offset: n }
	    //     elementArrayBuffer: [value, version]/null
	    //     elementArrayType: UNSIGNED_BYTE/UNSIGNED_SHORT/null
	    //     first: n (if no elementArrayBuffer)
	    //     offset: n bytes (if elementArrayBuffer)
	    //     count: n
	    // }
	    BufferPreview.prototype.setBuffer = function (drawState, force) {
	        var self = this;
	        var gl = this.gl;
	        if (this.arrayBufferTarget) {
	            this.arrayBuffer.deleteTarget(gl, this.arrayBufferTarget);
	            this.arrayBufferTarget = null;
	            this.arrayBuffer = null;
	        }
	        if (this.elementArrayBufferTarget) {
	            this.elementArrayBuffer.deleteTarget(gl, this.elementArrayBufferTarget);
	            this.elementArrayBufferTarget = null;
	            this.elementArrayBuffer = null;
	        }

	        var maxPreviewBytes = 40000;
	        if (drawState && !force && drawState.arrayBuffer[1].parameters[gl.BUFFER_SIZE] > maxPreviewBytes) {
	            // Buffer is really big - delay populating
	            this.expandLink.style.visibility = "visible";
	            this.expandLink.onclick = function () {
	                self.setBuffer(drawState, true);
	                self.expandLink.style.visibility = "collapse";
	            };
	            this.drawState = null;
	            this.draw();
	        } else if (drawState) {
	            if (drawState.arrayBuffer) {
	                this.arrayBuffer = drawState.arrayBuffer[0];
	                var version = drawState.arrayBuffer[1];
	                this.arrayBufferTarget = this.arrayBuffer.createTarget(gl, version);
	            }
	            if (drawState.elementArrayBuffer) {
	                this.elementArrayBuffer = drawState.elementArrayBuffer[0];
	                var version = drawState.elementArrayBuffer[1];
	                this.elementArrayBufferTarget = this.elementArrayBuffer.createTarget(gl, version);
	            }

	            // Grab all position data as a list of vec4
	            var positionData = extractAttribute(gl, drawState.arrayBuffer[0], drawState.arrayBuffer[1], drawState.position);

	            // Pull out indices (or null if none)
	            var indices = null;
	            if (drawState.elementArrayBuffer) {
	                indices = drawState.elementArrayBuffer[0].constructVersion(gl, drawState.elementArrayBuffer[1]);
	            }

	            // Get interested range
	            var start;
	            var count = drawState.count;
	            if (drawState.elementArrayBuffer) {
	                // Indexed
	                start = drawState.offset;
	                switch (drawState.elementArrayType) {
	                    case gl.UNSIGNED_BYTE:
	                        start /= 1;
	                        break;
	                    case gl.UNSIGNED_SHORT:
	                        start /= 2;
	                        break;
	                }
	            } else {
	                // Unindexed
	                start = drawState.first;
	            }

	            // Get all triangles as a list of 3-set [v1,v2,v3] vertex indices
	            var areTriangles = false;
	            switch (drawState.mode) {
	                case gl.TRIANGLES:
	                case gl.TRIANGLE_FAN:
	                case gl.TRIANGLE_STRIP:
	                    areTriangles = true;
	                    break;
	            }
	            if (areTriangles) {
	                this.triangles = buildTriangles(gl, drawState, start, count, positionData, indices);
	                var i;

	                // Generate interleaved position + normal data from triangles as a TRIANGLES list
	                var triData = new Float32Array(this.triangles.length * 3 * 3 * 2);
	                i = 0;
	                for (var n = 0; n < this.triangles.length; n++) {
	                    var tri = this.triangles[n];
	                    var v1 = positionData[tri[0]];
	                    var v2 = positionData[tri[1]];
	                    var v3 = positionData[tri[2]];

	                    // a = v2 - v1
	                    var a = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
	                    // b = v3 - v1
	                    var b = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
	                    // a x b
	                    var normal = normalize([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);

	                    triData[i++] = v1[0];triData[i++] = v1[1];triData[i++] = v1[2];
	                    triData[i++] = normal[0];triData[i++] = normal[1];triData[i++] = normal[2];
	                    triData[i++] = v2[0];triData[i++] = v2[1];triData[i++] = v2[2];
	                    triData[i++] = normal[0];triData[i++] = normal[1];triData[i++] = normal[2];
	                    triData[i++] = v3[0];triData[i++] = v3[1];triData[i++] = v3[2];
	                    triData[i++] = normal[0];triData[i++] = normal[1];triData[i++] = normal[2];
	                }
	                this.triBuffer = gl.createBuffer();
	                this.triBuffer.count = this.triangles.length * 3;
	                gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuffer);
	                gl.bufferData(gl.ARRAY_BUFFER, triData, gl.STATIC_DRAW);

	                // Generate LINES list for wireframe
	                var lineData = new Float32Array(this.triangles.length * 3 * 2 * 3);
	                i = 0;
	                for (var n = 0; n < this.triangles.length; n++) {
	                    var tri = this.triangles[n];
	                    var v1 = positionData[tri[0]];
	                    var v2 = positionData[tri[1]];
	                    var v3 = positionData[tri[2]];
	                    lineData[i++] = v1[0];lineData[i++] = v1[1];lineData[i++] = v1[2];
	                    lineData[i++] = v2[0];lineData[i++] = v2[1];lineData[i++] = v2[2];
	                    lineData[i++] = v2[0];lineData[i++] = v2[1];lineData[i++] = v2[2];
	                    lineData[i++] = v3[0];lineData[i++] = v3[1];lineData[i++] = v3[2];
	                    lineData[i++] = v3[0];lineData[i++] = v3[1];lineData[i++] = v3[2];
	                    lineData[i++] = v1[0];lineData[i++] = v1[1];lineData[i++] = v1[2];
	                }
	                this.lineBuffer = gl.createBuffer();
	                this.lineBuffer.count = this.triangles.length * 3 * 2;
	                gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
	                gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.STATIC_DRAW);
	            } else {
	                this.triangles = null;
	                this.triBuffer = null;
	                this.lineBuffer = null;
	            }

	            // Determine the extents of the interesting region
	            var minx = Number.MAX_VALUE;var miny = Number.MAX_VALUE;var minz = Number.MAX_VALUE;
	            var maxx = Number.MIN_VALUE;var maxy = Number.MIN_VALUE;var maxz = Number.MIN_VALUE;
	            if (indices) {
	                for (var n = start; n < start + count; n++) {
	                    var vec = positionData[indices[n]];
	                    minx = Math.min(minx, vec[0]);maxx = Math.max(maxx, vec[0]);
	                    miny = Math.min(miny, vec[1]);maxy = Math.max(maxy, vec[1]);
	                    minz = Math.min(minz, vec[2]);maxz = Math.max(maxz, vec[2]);
	                }
	            } else {
	                for (var n = start; n < start + count; n++) {
	                    var vec = positionData[n];
	                    minx = Math.min(minx, vec[0]);maxx = Math.max(maxx, vec[0]);
	                    miny = Math.min(miny, vec[1]);maxy = Math.max(maxy, vec[1]);
	                    minz = Math.min(minz, vec[2]);maxz = Math.max(maxz, vec[2]);
	                }
	            }
	            var maxd = 0;
	            var extents = [minx, miny, minz, maxx, maxy, maxz];
	            for (var n = 0; n < extents.length; n++) {
	                maxd = Math.max(maxd, Math.abs(extents[n]));
	            }

	            // Now have a bounding box for the mesh
	            // TODO: set initial view based on bounding box
	            this.camera.defaultDistance = maxd;
	            this.resetCamera();

	            this.drawState = drawState;
	            this.draw();
	        } else {
	            this.drawState = null;
	            this.draw();
	        }
	    };

	    BufferPreview.prototype.setupDefaultInput = function () {
	        var self = this;

	        // Drag rotate
	        var lastValueX = 0;
	        var lastValueY = 0;
	        function mouseMove(e) {
	            var dx = e.screenX - lastValueX;
	            var dy = e.screenY - lastValueY;
	            lastValueX = e.screenX;
	            lastValueY = e.screenY;

	            var camera = self.camera;
	            camera.rotx += dx * Math.PI / 180;
	            camera.roty += dy * Math.PI / 180;
	            self.draw();

	            e.preventDefault();
	            e.stopPropagation();
	        };
	        function mouseUp(e) {
	            endDrag();
	            e.preventDefault();
	            e.stopPropagation();
	        };
	        function beginDrag() {
	            self.document.addEventListener("mousemove", mouseMove, true);
	            self.document.addEventListener("mouseup", mouseUp, true);
	            self.canvas.style.cursor = "move";
	            self.document.body.style.cursor = "move";
	        };
	        function endDrag() {
	            self.document.removeEventListener("mousemove", mouseMove, true);
	            self.document.removeEventListener("mouseup", mouseUp, true);
	            self.canvas.style.cursor = "";
	            self.document.body.style.cursor = "";
	        };
	        this.canvas.onmousedown = function (e) {
	            beginDrag();
	            lastValueX = e.screenX;
	            lastValueY = e.screenY;
	            e.preventDefault();
	            e.stopPropagation();
	        };

	        // Zoom
	        this.canvas.onmousewheel = function (e) {
	            var delta = 0;
	            if (e.wheelDelta) {
	                delta = e.wheelDelta / 120;
	            } else if (e.detail) {
	                delta = -e.detail / 3;
	            }
	            if (delta) {
	                var camera = self.camera;
	                camera.distance -= delta * (camera.defaultDistance / 10.0);
	                camera.distance = Math.max(camera.defaultDistance / 10.0, camera.distance);
	                self.draw();
	            }

	            e.preventDefault();
	            e.stopPropagation();
	            e.returnValue = false;
	        };
	        this.canvas.addEventListener("DOMMouseScroll", this.canvas.onmousewheel, false);
	    };

	    return BufferPreview;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(48)], __WEBPACK_AMD_DEFINE_RESULT__ = function (v3) {
	  "use strict";

	  /**
	   * 4x4 Matrix math math functions.
	   *
	   * Almost all functions take an optional `dst` argument. If it is not passed in the
	   * functions will create a new matrix. In other words you can do this
	   *
	   *     var mat = m4.translation([1, 2, 3]);  // Creates a new translation matrix
	   *
	   * or
	   *
	   *     var mat = m4.create();
	   *     m4.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
	   *
	   * The first style is often easier but depending on where it's used it generates garbage where
	   * as there is almost never allocation with the second style.
	   *
	   * It is always save to pass any matrix as the destination. So for example
	   *
	   *     var mat = m4.identity();
	   *     var trans = m4.translation([1, 2, 3]);
	   *     m4.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
	   *
	   * @module twgl/m4
	   */

	  var MatType = Float32Array;

	  var tempV3a = v3.create();
	  var tempV3b = v3.create();
	  var tempV3c = v3.create();

	  /**
	   * A JavaScript array with 16 values or a Float32Array with 16 values.
	   * When created by the library will create the default type which is `Float32Array`
	   * but can be set by calling {@link module:twgl/m4.setDefaultType}.
	   * @typedef {(number[]|Float32Array)} Mat4
	   * @memberOf module:twgl/m4
	   */

	  /**
	   * Sets the type this library creates for a Mat4
	   * @param {constructor} ctor the constructor for the type. Either `Float32Array` or `Array`
	   * @return {constructor} previous constructor for Mat4
	   */
	  function setDefaultType(ctor) {
	    var oldType = MatType;
	    MatType = ctor;
	    return oldType;
	  }

	  /**
	   * Negates a matrix.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} -m.
	   * @memberOf module:twgl/m4
	   */
	  function negate(m, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = -m[0];
	    dst[1] = -m[1];
	    dst[2] = -m[2];
	    dst[3] = -m[3];
	    dst[4] = -m[4];
	    dst[5] = -m[5];
	    dst[6] = -m[6];
	    dst[7] = -m[7];
	    dst[8] = -m[8];
	    dst[9] = -m[9];
	    dst[10] = -m[10];
	    dst[11] = -m[11];
	    dst[12] = -m[12];
	    dst[13] = -m[13];
	    dst[14] = -m[14];
	    dst[15] = -m[15];

	    return dst;
	  }

	  /**
	   * Copies a matrix.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {module:twgl/m4.Mat4} [dst] The matrix.
	   * @return {module:twgl/m4.Mat4} A copy of m.
	   * @memberOf module:twgl/m4
	   */
	  function copy(m, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = m[0];
	    dst[1] = m[1];
	    dst[2] = m[2];
	    dst[3] = m[3];
	    dst[4] = m[4];
	    dst[5] = m[5];
	    dst[6] = m[6];
	    dst[7] = m[7];
	    dst[8] = m[8];
	    dst[9] = m[9];
	    dst[10] = m[10];
	    dst[11] = m[11];
	    dst[12] = m[12];
	    dst[13] = m[13];
	    dst[14] = m[14];
	    dst[15] = m[15];

	    return dst;
	  }

	  /**
	   * Creates an n-by-n identity matrix.
	   *
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} An n-by-n identity matrix.
	   * @memberOf module:twgl/m4
	   */
	  function identity(dst) {
	    dst = dst || new MatType(16);

	    dst[0] = 1;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = 1;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = 1;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Takes the transpose of a matrix.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The transpose of m.
	   * @memberOf module:twgl/m4
	   */
	  function transpose(m, dst) {
	    dst = dst || new MatType(16);
	    if (dst === m) {
	      var t;

	      t = m[1];
	      m[1] = m[4];
	      m[4] = t;

	      t = m[2];
	      m[2] = m[8];
	      m[8] = t;

	      t = m[3];
	      m[3] = m[12];
	      m[12] = t;

	      t = m[6];
	      m[6] = m[9];
	      m[9] = t;

	      t = m[7];
	      m[7] = m[13];
	      m[13] = t;

	      t = m[11];
	      m[11] = m[14];
	      m[14] = t;
	      return dst;
	    }

	    var m00 = m[0 * 4 + 0];
	    var m01 = m[0 * 4 + 1];
	    var m02 = m[0 * 4 + 2];
	    var m03 = m[0 * 4 + 3];
	    var m10 = m[1 * 4 + 0];
	    var m11 = m[1 * 4 + 1];
	    var m12 = m[1 * 4 + 2];
	    var m13 = m[1 * 4 + 3];
	    var m20 = m[2 * 4 + 0];
	    var m21 = m[2 * 4 + 1];
	    var m22 = m[2 * 4 + 2];
	    var m23 = m[2 * 4 + 3];
	    var m30 = m[3 * 4 + 0];
	    var m31 = m[3 * 4 + 1];
	    var m32 = m[3 * 4 + 2];
	    var m33 = m[3 * 4 + 3];

	    dst[0] = m00;
	    dst[1] = m10;
	    dst[2] = m20;
	    dst[3] = m30;
	    dst[4] = m01;
	    dst[5] = m11;
	    dst[6] = m21;
	    dst[7] = m31;
	    dst[8] = m02;
	    dst[9] = m12;
	    dst[10] = m22;
	    dst[11] = m32;
	    dst[12] = m03;
	    dst[13] = m13;
	    dst[14] = m23;
	    dst[15] = m33;

	    return dst;
	  }

	  /**
	   * Computes the inverse of a 4-by-4 matrix.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The inverse of m.
	   * @memberOf module:twgl/m4
	   */
	  function inverse(m, dst) {
	    dst = dst || new MatType(16);

	    var m00 = m[0 * 4 + 0];
	    var m01 = m[0 * 4 + 1];
	    var m02 = m[0 * 4 + 2];
	    var m03 = m[0 * 4 + 3];
	    var m10 = m[1 * 4 + 0];
	    var m11 = m[1 * 4 + 1];
	    var m12 = m[1 * 4 + 2];
	    var m13 = m[1 * 4 + 3];
	    var m20 = m[2 * 4 + 0];
	    var m21 = m[2 * 4 + 1];
	    var m22 = m[2 * 4 + 2];
	    var m23 = m[2 * 4 + 3];
	    var m30 = m[3 * 4 + 0];
	    var m31 = m[3 * 4 + 1];
	    var m32 = m[3 * 4 + 2];
	    var m33 = m[3 * 4 + 3];
	    var tmp_0 = m22 * m33;
	    var tmp_1 = m32 * m23;
	    var tmp_2 = m12 * m33;
	    var tmp_3 = m32 * m13;
	    var tmp_4 = m12 * m23;
	    var tmp_5 = m22 * m13;
	    var tmp_6 = m02 * m33;
	    var tmp_7 = m32 * m03;
	    var tmp_8 = m02 * m23;
	    var tmp_9 = m22 * m03;
	    var tmp_10 = m02 * m13;
	    var tmp_11 = m12 * m03;
	    var tmp_12 = m20 * m31;
	    var tmp_13 = m30 * m21;
	    var tmp_14 = m10 * m31;
	    var tmp_15 = m30 * m11;
	    var tmp_16 = m10 * m21;
	    var tmp_17 = m20 * m11;
	    var tmp_18 = m00 * m31;
	    var tmp_19 = m30 * m01;
	    var tmp_20 = m00 * m21;
	    var tmp_21 = m20 * m01;
	    var tmp_22 = m00 * m11;
	    var tmp_23 = m10 * m01;

	    var t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
	    var t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
	    var t2 = tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
	    var t3 = tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

	    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

	    dst[0] = d * t0;
	    dst[1] = d * t1;
	    dst[2] = d * t2;
	    dst[3] = d * t3;
	    dst[4] = d * (tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30 - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
	    dst[5] = d * (tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30 - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
	    dst[6] = d * (tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30 - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
	    dst[7] = d * (tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20 - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
	    dst[8] = d * (tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33 - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
	    dst[9] = d * (tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33 - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
	    dst[10] = d * (tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33 - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
	    dst[11] = d * (tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23 - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
	    dst[12] = d * (tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12 - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
	    dst[13] = d * (tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22 - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
	    dst[14] = d * (tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02 - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
	    dst[15] = d * (tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12 - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

	    return dst;
	  }

	  /**
	   * Multiplies two 4-by-4 matrices with a on the left and b on the right
	   * @param {module:twgl/m4.Mat4} a The matrix on the left.
	   * @param {module:twgl/m4.Mat4} b The matrix on the right.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The matrix product of a and b.
	   * @memberOf module:twgl/m4
	   */
	  function multiply(a, b, dst) {
	    dst = dst || new MatType(16);

	    var a00 = a[0];
	    var a01 = a[1];
	    var a02 = a[2];
	    var a03 = a[3];
	    var a10 = a[4 + 0];
	    var a11 = a[4 + 1];
	    var a12 = a[4 + 2];
	    var a13 = a[4 + 3];
	    var a20 = a[8 + 0];
	    var a21 = a[8 + 1];
	    var a22 = a[8 + 2];
	    var a23 = a[8 + 3];
	    var a30 = a[12 + 0];
	    var a31 = a[12 + 1];
	    var a32 = a[12 + 2];
	    var a33 = a[12 + 3];
	    var b00 = b[0];
	    var b01 = b[1];
	    var b02 = b[2];
	    var b03 = b[3];
	    var b10 = b[4 + 0];
	    var b11 = b[4 + 1];
	    var b12 = b[4 + 2];
	    var b13 = b[4 + 3];
	    var b20 = b[8 + 0];
	    var b21 = b[8 + 1];
	    var b22 = b[8 + 2];
	    var b23 = b[8 + 3];
	    var b30 = b[12 + 0];
	    var b31 = b[12 + 1];
	    var b32 = b[12 + 2];
	    var b33 = b[12 + 3];

	    dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
	    dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
	    dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
	    dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
	    dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
	    dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
	    dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
	    dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
	    dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
	    dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
	    dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
	    dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
	    dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
	    dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
	    dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
	    dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;

	    return dst;
	  }

	  /**
	   * Sets the translation component of a 4-by-4 matrix to the given
	   * vector.
	   * @param {module:twgl/m4.Mat4} a The matrix.
	   * @param {Vec3} v The vector.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} a once modified.
	   * @memberOf module:twgl/m4
	   */
	  function setTranslation(a, v, dst) {
	    dst = dst || identity();
	    if (a !== dst) {
	      dst[0] = a[0];
	      dst[1] = a[1];
	      dst[2] = a[2];
	      dst[3] = a[3];
	      dst[4] = a[4];
	      dst[5] = a[5];
	      dst[6] = a[6];
	      dst[7] = a[7];
	      dst[8] = a[8];
	      dst[9] = a[9];
	      dst[10] = a[10];
	      dst[11] = a[11];
	    }
	    dst[12] = v[0];
	    dst[13] = v[1];
	    dst[14] = v[2];
	    dst[15] = 1;
	    return dst;
	  }

	  /**
	   * Returns the translation component of a 4-by-4 matrix as a vector with 3
	   * entries.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} [dst] vector..
	   * @return {Vec3} The translation component of m.
	   * @memberOf module:twgl/m4
	   */
	  function getTranslation(m, dst) {
	    dst = dst || v3.create();
	    dst[0] = m[12];
	    dst[1] = m[13];
	    dst[2] = m[14];
	    return dst;
	  }

	  /**
	   * Returns an axis of a 4x4 matrix as a vector with 3 entries
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {number} axis The axis 0 = x, 1 = y, 2 = z;
	   * @return {Vec3} [dst] vector.
	   * @return {Vec3} The axis component of m.
	   * @memberOf module:twgl/m4
	   */
	  function getAxis(m, axis, dst) {
	    dst = dst || v3.create();
	    var off = axis * 4;
	    dst[0] = m[off + 0];
	    dst[1] = m[off + 1];
	    dst[2] = m[off + 2];
	    return dst;
	  }

	  /**
	   * Sets an axis of a 4x4 matrix as a vector with 3 entries
	   * @param {Vec3} v the axis vector
	   * @param {number} axis The axis  0 = x, 1 = y, 2 = z;
	   * @param {module:twgl/m4.Mat4} [dst] The matrix to set. If none a new one is created
	   * @return {module:twgl/m4.Mat4} dst
	   * @memberOf module:twgl/m4
	   */
	  function setAxis(a, v, axis, dst) {
	    if (dst !== a) {
	      dst = copy(a, dst);
	    }
	    var off = axis * 4;
	    dst[off + 0] = v[0];
	    dst[off + 1] = v[1];
	    dst[off + 2] = v[2];
	    return dst;
	  }

	  /**
	   * Computes a 4-by-4 perspective transformation matrix given the angular height
	   * of the frustum, the aspect ratio, and the near and far clipping planes.  The
	   * arguments define a frustum extending in the negative z direction.  The given
	   * angle is the vertical angle of the frustum, and the horizontal angle is
	   * determined to produce the given aspect ratio.  The arguments near and far are
	   * the distances to the near and far clipping planes.  Note that near and far
	   * are not z coordinates, but rather they are distances along the negative
	   * z-axis.  The matrix generated sends the viewing frustum to the unit box.
	   * We assume a unit box extending from -1 to 1 in the x and y dimensions and
	   * from 0 to 1 in the z dimension.
	   * @param {number} fieldOfViewYInRadians The camera angle from top to bottom (in radians).
	   * @param {number} aspect The aspect ratio width / height.
	   * @param {number} zNear The depth (negative z coordinate)
	   *     of the near clipping plane.
	   * @param {number} zFar The depth (negative z coordinate)
	   *     of the far clipping plane.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The perspective matrix.
	   * @memberOf module:twgl/m4
	   */
	  function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
	    dst = dst || new MatType(16);

	    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
	    var rangeInv = 1.0 / (zNear - zFar);

	    dst[0] = f / aspect;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;

	    dst[4] = 0;
	    dst[5] = f;
	    dst[6] = 0;
	    dst[7] = 0;

	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = (zNear + zFar) * rangeInv;
	    dst[11] = -1;

	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = zNear * zFar * rangeInv * 2;
	    dst[15] = 0;

	    return dst;
	  }

	  /**
	   * Computes a 4-by-4 othogonal transformation matrix given the left, right,
	   * bottom, and top dimensions of the near clipping plane as well as the
	   * near and far clipping plane distances.
	   * @param {number} left Left side of the near clipping plane viewport.
	   * @param {number} right Right side of the near clipping plane viewport.
	   * @param {number} top Top of the near clipping plane viewport.
	   * @param {number} bottom Bottom of the near clipping plane viewport.
	   * @param {number} near The depth (negative z coordinate)
	   *     of the near clipping plane.
	   * @param {number} far The depth (negative z coordinate)
	   *     of the far clipping plane.
	   * @param {module:twgl/m4.Mat4} [dst] Output matrix.
	   * @return {module:twgl/m4.Mat4} The perspective matrix.
	   * @memberOf module:twgl/m4
	   */
	  function ortho(left, right, bottom, top, near, far, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = 2 / (right - left);
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;

	    dst[4] = 0;
	    dst[5] = 2 / (top - bottom);
	    dst[6] = 0;
	    dst[7] = 0;

	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = -1 / (far - near);
	    dst[11] = 0;

	    dst[12] = (right + left) / (left - right);
	    dst[13] = (top + bottom) / (bottom - top);
	    dst[14] = -near / (near - far);
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Computes a 4-by-4 perspective transformation matrix given the left, right,
	   * top, bottom, near and far clipping planes. The arguments define a frustum
	   * extending in the negative z direction. The arguments near and far are the
	   * distances to the near and far clipping planes. Note that near and far are not
	   * z coordinates, but rather they are distances along the negative z-axis. The
	   * matrix generated sends the viewing frustum to the unit box. We assume a unit
	   * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
	   * dimension.
	   * @param {number} left The x coordinate of the left plane of the box.
	   * @param {number} right The x coordinate of the right plane of the box.
	   * @param {number} bottom The y coordinate of the bottom plane of the box.
	   * @param {number} top The y coordinate of the right plane of the box.
	   * @param {number} near The negative z coordinate of the near plane of the box.
	   * @param {number} far The negative z coordinate of the far plane of the box.
	   * @param {module:twgl/m4.Mat4} [dst] Output matrix.
	   * @return {module:twgl/m4.Mat4} The perspective projection matrix.
	   * @memberOf module:twgl/m4
	   */
	  function frustum(left, right, bottom, top, near, far, dst) {
	    dst = dst || new MatType(16);

	    var dx = right - left;
	    var dy = top - bottom;
	    var dz = near - far;

	    dst[0] = 2 * near / dx;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = 2 * near / dy;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = (left + right) / dx;
	    dst[9] = (top + bottom) / dy;
	    dst[10] = far / dz;
	    dst[11] = -1;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = near * far / dz;
	    dst[15] = 0;

	    return dst;
	  }

	  /**
	   * Computes a 4-by-4 look-at transformation.
	   *
	   * This is a matrix which positions the camera itself. If you want
	   * a view matrix (a matrix which moves things in front of the camera)
	   * take the inverse of this.
	   *
	   * @param {Vec3} eye The position of the eye.
	   * @param {Vec3} target The position meant to be viewed.
	   * @param {Vec3} up A vector pointing up.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The look-at matrix.
	   * @memberOf module:twgl/m4
	   */
	  function lookAt(eye, target, up, dst) {
	    dst = dst || new MatType(16);

	    var xAxis = tempV3a;
	    var yAxis = tempV3b;
	    var zAxis = tempV3c;

	    v3.normalize(v3.subtract(eye, target, zAxis), zAxis);
	    v3.normalize(v3.cross(up, zAxis, xAxis), xAxis);
	    v3.normalize(v3.cross(zAxis, xAxis, yAxis), yAxis);

	    dst[0] = xAxis[0];
	    dst[1] = xAxis[1];
	    dst[2] = xAxis[2];
	    dst[3] = 0;
	    dst[4] = yAxis[0];
	    dst[5] = yAxis[1];
	    dst[6] = yAxis[2];
	    dst[7] = 0;
	    dst[8] = zAxis[0];
	    dst[9] = zAxis[1];
	    dst[10] = zAxis[2];
	    dst[11] = 0;
	    dst[12] = eye[0];
	    dst[13] = eye[1];
	    dst[14] = eye[2];
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which translates by the given vector v.
	   * @param {Vec3} v The vector by
	   *     which to translate.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The translation matrix.
	   * @memberOf module:twgl/m4
	   */
	  function translation(v, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = 1;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = 1;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = 1;
	    dst[11] = 0;
	    dst[12] = v[0];
	    dst[13] = v[1];
	    dst[14] = v[2];
	    dst[15] = 1;
	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by translation by the given vector v.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} v The vector by
	   *     which to translate.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function translate(m, v, dst) {
	    dst = dst || new MatType(16);

	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];
	    var m00 = m[0];
	    var m01 = m[1];
	    var m02 = m[2];
	    var m03 = m[3];
	    var m10 = m[1 * 4 + 0];
	    var m11 = m[1 * 4 + 1];
	    var m12 = m[1 * 4 + 2];
	    var m13 = m[1 * 4 + 3];
	    var m20 = m[2 * 4 + 0];
	    var m21 = m[2 * 4 + 1];
	    var m22 = m[2 * 4 + 2];
	    var m23 = m[2 * 4 + 3];
	    var m30 = m[3 * 4 + 0];
	    var m31 = m[3 * 4 + 1];
	    var m32 = m[3 * 4 + 2];
	    var m33 = m[3 * 4 + 3];

	    if (m !== dst) {
	      dst[0] = m00;
	      dst[1] = m01;
	      dst[2] = m02;
	      dst[3] = m03;
	      dst[4] = m10;
	      dst[5] = m11;
	      dst[6] = m12;
	      dst[7] = m13;
	      dst[8] = m20;
	      dst[9] = m21;
	      dst[10] = m22;
	      dst[11] = m23;
	    }

	    dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
	    dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
	    dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
	    dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The rotation matrix.
	   * @memberOf module:twgl/m4
	   */
	  function rotationX(angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = 1;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = c;
	    dst[6] = s;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = -s;
	    dst[10] = c;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by a rotation around the x-axis by the given
	   * angle.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function rotateX(m, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var m10 = m[4];
	    var m11 = m[5];
	    var m12 = m[6];
	    var m13 = m[7];
	    var m20 = m[8];
	    var m21 = m[9];
	    var m22 = m[10];
	    var m23 = m[11];
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[4] = c * m10 + s * m20;
	    dst[5] = c * m11 + s * m21;
	    dst[6] = c * m12 + s * m22;
	    dst[7] = c * m13 + s * m23;
	    dst[8] = c * m20 - s * m10;
	    dst[9] = c * m21 - s * m11;
	    dst[10] = c * m22 - s * m12;
	    dst[11] = c * m23 - s * m13;

	    if (m !== dst) {
	      dst[0] = m[0];
	      dst[1] = m[1];
	      dst[2] = m[2];
	      dst[3] = m[3];
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The rotation matrix.
	   * @memberOf module:twgl/m4
	   */
	  function rotationY(angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = c;
	    dst[1] = 0;
	    dst[2] = -s;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = 1;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = s;
	    dst[9] = 0;
	    dst[10] = c;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by a rotation around the y-axis by the given
	   * angle.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function rotateY(m, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var m00 = m[0 * 4 + 0];
	    var m01 = m[0 * 4 + 1];
	    var m02 = m[0 * 4 + 2];
	    var m03 = m[0 * 4 + 3];
	    var m20 = m[2 * 4 + 0];
	    var m21 = m[2 * 4 + 1];
	    var m22 = m[2 * 4 + 2];
	    var m23 = m[2 * 4 + 3];
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = c * m00 - s * m20;
	    dst[1] = c * m01 - s * m21;
	    dst[2] = c * m02 - s * m22;
	    dst[3] = c * m03 - s * m23;
	    dst[8] = c * m20 + s * m00;
	    dst[9] = c * m21 + s * m01;
	    dst[10] = c * m22 + s * m02;
	    dst[11] = c * m23 + s * m03;

	    if (m !== dst) {
	      dst[4] = m[4];
	      dst[5] = m[5];
	      dst[6] = m[6];
	      dst[7] = m[7];
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The rotation matrix.
	   * @memberOf module:twgl/m4
	   */
	  function rotationZ(angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = c;
	    dst[1] = s;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = -s;
	    dst[5] = c;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = 1;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by a rotation around the z-axis by the given
	   * angle.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function rotateZ(m, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var m00 = m[0 * 4 + 0];
	    var m01 = m[0 * 4 + 1];
	    var m02 = m[0 * 4 + 2];
	    var m03 = m[0 * 4 + 3];
	    var m10 = m[1 * 4 + 0];
	    var m11 = m[1 * 4 + 1];
	    var m12 = m[1 * 4 + 2];
	    var m13 = m[1 * 4 + 3];
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = c * m00 + s * m10;
	    dst[1] = c * m01 + s * m11;
	    dst[2] = c * m02 + s * m12;
	    dst[3] = c * m03 + s * m13;
	    dst[4] = c * m10 - s * m00;
	    dst[5] = c * m11 - s * m01;
	    dst[6] = c * m12 - s * m02;
	    dst[7] = c * m13 - s * m03;

	    if (m !== dst) {
	      dst[8] = m[8];
	      dst[9] = m[9];
	      dst[10] = m[10];
	      dst[11] = m[11];
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which rotates around the given axis by the given
	   * angle.
	   * @param {Vec3} axis The axis
	   *     about which to rotate.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} A matrix which rotates angle radians
	   *     around the axis.
	   * @memberOf module:twgl/m4
	   */
	  function axisRotation(axis, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var x = axis[0];
	    var y = axis[1];
	    var z = axis[2];
	    var n = Math.sqrt(x * x + y * y + z * z);
	    x /= n;
	    y /= n;
	    z /= n;
	    var xx = x * x;
	    var yy = y * y;
	    var zz = z * z;
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);
	    var oneMinusCosine = 1 - c;

	    dst[0] = xx + (1 - xx) * c;
	    dst[1] = x * y * oneMinusCosine + z * s;
	    dst[2] = x * z * oneMinusCosine - y * s;
	    dst[3] = 0;
	    dst[4] = x * y * oneMinusCosine - z * s;
	    dst[5] = yy + (1 - yy) * c;
	    dst[6] = y * z * oneMinusCosine + x * s;
	    dst[7] = 0;
	    dst[8] = x * z * oneMinusCosine + y * s;
	    dst[9] = y * z * oneMinusCosine - x * s;
	    dst[10] = zz + (1 - zz) * c;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by rotation around the given axis by the
	   * given angle.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} axis The axis
	   *     about which to rotate.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function axisRotate(m, axis, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var x = axis[0];
	    var y = axis[1];
	    var z = axis[2];
	    var n = Math.sqrt(x * x + y * y + z * z);
	    x /= n;
	    y /= n;
	    z /= n;
	    var xx = x * x;
	    var yy = y * y;
	    var zz = z * z;
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);
	    var oneMinusCosine = 1 - c;

	    var r00 = xx + (1 - xx) * c;
	    var r01 = x * y * oneMinusCosine + z * s;
	    var r02 = x * z * oneMinusCosine - y * s;
	    var r10 = x * y * oneMinusCosine - z * s;
	    var r11 = yy + (1 - yy) * c;
	    var r12 = y * z * oneMinusCosine + x * s;
	    var r20 = x * z * oneMinusCosine + y * s;
	    var r21 = y * z * oneMinusCosine - x * s;
	    var r22 = zz + (1 - zz) * c;

	    var m00 = m[0];
	    var m01 = m[1];
	    var m02 = m[2];
	    var m03 = m[3];
	    var m10 = m[4];
	    var m11 = m[5];
	    var m12 = m[6];
	    var m13 = m[7];
	    var m20 = m[8];
	    var m21 = m[9];
	    var m22 = m[10];
	    var m23 = m[11];

	    dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
	    dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
	    dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
	    dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
	    dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
	    dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
	    dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
	    dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
	    dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
	    dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
	    dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
	    dst[11] = r20 * m03 + r21 * m13 + r22 * m23;

	    if (m !== dst) {
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
	   * the corresponding entry in the given vector; assumes the vector has three
	   * entries.
	   * @param {Vec3} v A vector of
	   *     three entries specifying the factor by which to scale in each dimension.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The scaling matrix.
	   * @memberOf module:twgl/m4
	   */
	  function scaling(v, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = v[0];
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = v[1];
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = v[2];
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix, scaling in each dimension by an amount
	   * given by the corresponding entry in the given vector; assumes the vector has
	   * three entries.
	   * @param {module:twgl/m4.Mat4} m The matrix to be modified.
	   * @param {Vec3} v A vector of three entries specifying the
	   *     factor by which to scale in each dimension.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function scale(m, v, dst) {
	    dst = dst || new MatType(16);

	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];

	    dst[0] = v0 * m[0 * 4 + 0];
	    dst[1] = v0 * m[0 * 4 + 1];
	    dst[2] = v0 * m[0 * 4 + 2];
	    dst[3] = v0 * m[0 * 4 + 3];
	    dst[4] = v1 * m[1 * 4 + 0];
	    dst[5] = v1 * m[1 * 4 + 1];
	    dst[6] = v1 * m[1 * 4 + 2];
	    dst[7] = v1 * m[1 * 4 + 3];
	    dst[8] = v2 * m[2 * 4 + 0];
	    dst[9] = v2 * m[2 * 4 + 1];
	    dst[10] = v2 * m[2 * 4 + 2];
	    dst[11] = v2 * m[2 * 4 + 3];

	    if (m !== dst) {
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Takes a 4-by-4 matrix and a vector with 3 entries,
	   * interprets the vector as a point, transforms that point by the matrix, and
	   * returns the result as a vector with 3 entries.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} v The point.
	   * @param {Vec3} dst optional vec3 to store result
	   * @return {Vec3} dst or new vec3 if not provided
	   * @memberOf module:twgl/m4
	   */
	  function transformPoint(m, v, dst) {
	    dst = dst || v3.create();
	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];
	    var d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];

	    dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
	    dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
	    dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;

	    return dst;
	  }

	  /**
	   * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
	   * direction, transforms that direction by the matrix, and returns the result;
	   * assumes the transformation of 3-dimensional space represented by the matrix
	   * is parallel-preserving, i.e. any combination of rotation, scaling and
	   * translation, but not a perspective distortion. Returns a vector with 3
	   * entries.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} v The direction.
	   * @param {Vec3} dst optional Vec3 to store result
	   * @return {Vec3} dst or new Vec3 if not provided
	   * @memberOf module:twgl/m4
	   */
	  function transformDirection(m, v, dst) {
	    dst = dst || v3.create();

	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];

	    dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
	    dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
	    dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];

	    return dst;
	  }

	  /**
	   * Takes a 4-by-4 matrix m and a vector v with 3 entries, interprets the vector
	   * as a normal to a surface, and computes a vector which is normal upon
	   * transforming that surface by the matrix. The effect of this function is the
	   * same as transforming v (as a direction) by the inverse-transpose of m.  This
	   * function assumes the transformation of 3-dimensional space represented by the
	   * matrix is parallel-preserving, i.e. any combination of rotation, scaling and
	   * translation, but not a perspective distortion.  Returns a vector with 3
	   * entries.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} v The normal.
	   * @param {Vec3} [dst] The direction.
	   * @return {Vec3} The transformed direction.
	   * @memberOf module:twgl/m4
	   */
	  function transformNormal(m, v, dst) {
	    dst = dst || v3.create();
	    var mi = inverse(m);
	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];

	    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
	    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
	    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

	    return dst;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "axisRotate": axisRotate,
	    "axisRotation": axisRotation,
	    "create": identity,
	    "copy": copy,
	    "frustum": frustum,
	    "getAxis": getAxis,
	    "getTranslation": getTranslation,
	    "identity": identity,
	    "inverse": inverse,
	    "lookAt": lookAt,
	    "multiply": multiply,
	    "negate": negate,
	    "ortho": ortho,
	    "perspective": perspective,
	    "rotateX": rotateX,
	    "rotateY": rotateY,
	    "rotateZ": rotateZ,
	    "rotateAxis": axisRotate,
	    "rotationX": rotationX,
	    "rotationY": rotationY,
	    "rotationZ": rotationZ,
	    "scale": scale,
	    "scaling": scaling,
	    "setAxis": setAxis,
	    "setDefaultType": setDefaultType,
	    "setTranslation": setTranslation,
	    "transformDirection": transformDirection,
	    "transformNormal": transformNormal,
	    "transformPoint": transformPoint,
	    "translate": translate,
	    "translation": translation,
	    "transpose": transpose
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  "use strict";

	  /**
	   *
	   * Vec3 math math functions.
	   *
	   * Almost all functions take an optional `dst` argument. If it is not passed in the
	   * functions will create a new Vec3. In other words you can do this
	   *
	   *     var v = v3.cross(v1, v2);  // Creates a new Vec3 with the cross product of v1 x v2.
	   *
	   * or
	   *
	   *     var v3 = v3.create();
	   *     v3.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
	   *
	   * The first style is often easier but depending on where it's used it generates garbage where
	   * as there is almost never allocation with the second style.
	   *
	   * It is always save to pass any vector as the destination. So for example
	   *
	   *     v3.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
	   *
	   * @module twgl/v3
	   */

	  var VecType = Float32Array;

	  /**
	   * A JavaScript array with 3 values or a Float32Array with 3 values.
	   * When created by the library will create the default type which is `Float32Array`
	   * but can be set by calling {@link module:twgl/v3.setDefaultType}.
	   * @typedef {(number[]|Float32Array)} Vec3
	   * @memberOf module:twgl/v3
	   */

	  /**
	   * Sets the type this library creates for a Vec3
	   * @param {constructor} ctor the constructor for the type. Either `Float32Array` or `Array`
	   * @return {constructor} previous constructor for Vec3
	   */
	  function setDefaultType(ctor) {
	    var oldType = VecType;
	    VecType = ctor;
	    return oldType;
	  }

	  /**
	   * Creates a vec3; may be called with x, y, z to set initial values.
	   * @return {Vec3} the created vector
	   * @memberOf module:twgl/v3
	   */
	  function create(x, y, z) {
	    var dst = new VecType(3);
	    if (x) {
	      dst[0] = x;
	    }
	    if (y) {
	      dst[1] = y;
	    }
	    if (z) {
	      dst[2] = z;
	    }
	    return dst;
	  }

	  /**
	   * Adds two vectors; assumes a and b have the same dimension.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @memberOf module:twgl/v3
	   */
	  function add(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[0] + b[0];
	    dst[1] = a[1] + b[1];
	    dst[2] = a[2] + b[2];

	    return dst;
	  }

	  /**
	   * Subtracts two vectors.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @memberOf module:twgl/v3
	   */
	  function subtract(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[0] - b[0];
	    dst[1] = a[1] - b[1];
	    dst[2] = a[2] - b[2];

	    return dst;
	  }

	  /**
	   * Performs linear interpolation on two vectors.
	   * Given vectors a and b and interpolation coefficient t, returns
	   * (1 - t) * a + t * b.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {number} t Interpolation coefficient.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @memberOf module:twgl/v3
	   */
	  function lerp(a, b, t, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = (1 - t) * a[0] + t * b[0];
	    dst[1] = (1 - t) * a[1] + t * b[1];
	    dst[2] = (1 - t) * a[2] + t * b[2];

	    return dst;
	  }

	  /**
	   * Mutiplies a vector by a scalar.
	   * @param {module:twgl/v3.Vec3} v The vector.
	   * @param {number} k The scalar.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} dst.
	   * @memberOf module:twgl/v3
	   */
	  function mulScalar(v, k, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = v[0] * k;
	    dst[1] = v[1] * k;
	    dst[2] = v[2] * k;

	    return dst;
	  }

	  /**
	   * Divides a vector by a scalar.
	   * @param {module:twgl/v3.Vec3} v The vector.
	   * @param {number} k The scalar.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} dst.
	   * @memberOf module:twgl/v3
	   */
	  function divScalar(v, k, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = v[0] / k;
	    dst[1] = v[1] / k;
	    dst[2] = v[2] / k;

	    return dst;
	  }

	  /**
	   * Computes the cross product of two vectors; assumes both vectors have
	   * three entries.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} The vector a cross b.
	   * @memberOf module:twgl/v3
	   */
	  function cross(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[1] * b[2] - a[2] * b[1];
	    dst[1] = a[2] * b[0] - a[0] * b[2];
	    dst[2] = a[0] * b[1] - a[1] * b[0];

	    return dst;
	  }

	  /**
	   * Computes the dot product of two vectors; assumes both vectors have
	   * three entries.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @return {number} dot product
	   * @memberOf module:twgl/v3
	   */
	  function dot(a, b) {
	    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	  }

	  /**
	   * Computes the length of vector
	   * @param {module:twgl/v3.Vec3} v vector.
	   * @return {number} length of vector.
	   * @memberOf module:twgl/v3
	   */
	  function length(v) {
	    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	  }

	  /**
	   * Computes the square of the length of vector
	   * @param {module:twgl/v3.Vec3} v vector.
	   * @return {number} square of the length of vector.
	   * @memberOf module:twgl/v3
	   */
	  function lengthSq(v) {
	    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
	  }

	  /**
	   * Divides a vector by its Euclidean length and returns the quotient.
	   * @param {module:twgl/v3.Vec3} a The vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} The normalized vector.
	   * @memberOf module:twgl/v3
	   */
	  function normalize(a, dst) {
	    dst = dst || new VecType(3);

	    var lenSq = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
	    var len = Math.sqrt(lenSq);
	    if (len > 0.00001) {
	      dst[0] = a[0] / len;
	      dst[1] = a[1] / len;
	      dst[2] = a[2] / len;
	    } else {
	      dst[0] = 0;
	      dst[1] = 0;
	      dst[2] = 0;
	    }

	    return dst;
	  }

	  /**
	   * Negates a vector.
	   * @param {module:twgl/v3.Vec3} v The vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} -v.
	   * @memberOf module:twgl/v3
	   */
	  function negate(v, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = -v[0];
	    dst[1] = -v[1];
	    dst[2] = -v[2];

	    return dst;
	  }

	  /**
	   * Copies a vector.
	   * @param {module:twgl/v3.Vec3} v The vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} A copy of v.
	   * @memberOf module:twgl/v3
	   */
	  function copy(v, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = v[0];
	    dst[1] = v[1];
	    dst[2] = v[2];

	    return dst;
	  }

	  /**
	   * Multiplies a vector by another vector (component-wise); assumes a and
	   * b have the same length.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} The vector of products of entries of a and
	   *     b.
	   * @memberOf module:twgl/v3
	   */
	  function multiply(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[0] * b[0];
	    dst[1] = a[1] * b[1];
	    dst[2] = a[2] * b[2];

	    return dst;
	  }

	  /**
	   * Divides a vector by another vector (component-wise); assumes a and
	   * b have the same length.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} The vector of quotients of entries of a and
	   *     b.
	   * @memberOf module:twgl/v3
	   */
	  function divide(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[0] / b[0];
	    dst[1] = a[1] / b[1];
	    dst[2] = a[2] / b[2];

	    return dst;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "add": add,
	    "copy": copy,
	    "create": create,
	    "cross": cross,
	    "divide": divide,
	    "divScalar": divScalar,
	    "dot": dot,
	    "lerp": lerp,
	    "length": length,
	    "lengthSq": lengthSq,
	    "mulScalar": mulScalar,
	    "multiply": multiply,
	    "negate": negate,
	    "normalize": normalize,
	    "setDefaultType": setDefaultType,
	    "subtract": subtract
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(31), __webpack_require__(50)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tab, TimelineView) {

	    var TimelineTab = function TimelineTab(w) {
	        var outer = Tab.divClass('window-right-outer');
	        var right = Tab.divClass('window-right');

	        right.appendChild(Tab.eleClasses('canvas', 'gli-reset', 'timeline-canvas'));
	        outer.appendChild(right);
	        outer.appendChild(Tab.divClass('window-left'));

	        this.el.appendChild(outer);

	        this.timelineView = new TimelineView(w, this.el);

	        this.lostFocus.addListener(this, function () {
	            this.timelineView.suspendUpdating();
	        });
	        this.gainedFocus.addListener(this, function () {
	            this.timelineView.resumeUpdating();
	        });
	    };

	    return TimelineTab;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(10)], __WEBPACK_AMD_DEFINE_RESULT__ = function (settings) {

	    var TimelineView = function TimelineView(w, elementRoot) {
	        var self = this;
	        this.window = w;
	        this.elements = {
	            view: elementRoot.getElementsByClassName("window-right-outer")[0],
	            left: elementRoot.getElementsByClassName("window-left")[0],
	            right: elementRoot.getElementsByClassName("window-right")[0]
	        };

	        var statistics = this.window.context.statistics;

	        this.displayCanvas = elementRoot.getElementsByClassName("timeline-canvas")[0];

	        function appendKeyRow(keyRoot, counter) {
	            var row = document.createElement("div");
	            row.className = "timeline-key-row";
	            if (counter.enabled) {
	                row.className += " timeline-key-row-enabled";
	            }

	            var colorEl = document.createElement("div");
	            colorEl.className = "timeline-key-color";
	            colorEl.style.backgroundColor = counter.color;
	            row.appendChild(colorEl);

	            var nameEl = document.createElement("div");
	            nameEl.className = "timeline-key-name";
	            nameEl.textContent = counter.description;
	            row.appendChild(nameEl);

	            keyRoot.appendChild(row);

	            row.onclick = function () {
	                counter.enabled = !counter.enabled;
	                if (!counter.enabled) {
	                    row.className = row.className.replace(" timeline-key-row-enabled", "");
	                } else {
	                    row.className += " timeline-key-row-enabled";
	                }

	                settings.session.counterToggles[counter.name] = counter.enabled;
	                settings.save();
	            };
	        };

	        if (settings.session.enableTimeline) {
	            this.displayCanvas.width = 800;
	            this.displayCanvas.height = 200;

	            this.elements.left.style.overflow = "auto";

	            this.canvases = [];
	            for (var n = 0; n < 2; n++) {
	                var canvas = document.createElement("canvas");
	                canvas.className = "gli-reset";
	                canvas.width = 800;
	                canvas.height = 200;
	                this.canvases.push(canvas);
	            }
	            this.activeCanvasIndex = 0;

	            // Load enabled status
	            var counterToggles = settings.session.counterToggles;
	            if (counterToggles) {
	                for (var n = 0; n < statistics.counters.length; n++) {
	                    var counter = statistics.counters[n];
	                    var toggle = counterToggles[counter.name];
	                    if (toggle === true) {
	                        counter.enabled = true;
	                    } else if (toggle === false) {
	                        counter.enabled = false;
	                    } else {
	                        // Default
	                    }
	                }
	            }

	            var keyRoot = document.createElement("div");
	            keyRoot.className = "timeline-key";
	            for (var n = 0; n < statistics.counters.length; n++) {
	                var counter = statistics.counters[n];
	                appendKeyRow(keyRoot, counter);
	            }
	            this.elements.left.appendChild(keyRoot);

	            // Install a frame watcher
	            this.updating = false;
	            var updateCount = 0;
	            this.window.context.frameCompleted.addListener(this, function () {
	                // TODO: hold updates for a bit? Could affect perf to do this every frame
	                updateCount++;
	                if (updateCount % 2 == 0) {
	                    // Only update every other frame
	                    self.appendFrame();
	                }
	            });
	        } else {
	            // Hide canvas
	            this.displayCanvas.style.display = "none";
	        }

	        // Show help message
	        var enableMessage = document.createElement("a");
	        enableMessage.className = "timeline-enable-link";
	        if (settings.session.enableTimeline) {
	            enableMessage.textContent = "Timeline enabled - click to disable";
	        } else {
	            enableMessage.textContent = "Timeline disabled - click to enable";
	        }
	        enableMessage.onclick = function (e) {
	            settings.session.enableTimeline = !settings.session.enableTimeline;
	            settings.save();
	            window.location.reload();
	            e.preventDefault();
	            e.stopPropagation();
	        };
	        this.elements.right.insertBefore(enableMessage, this.elements.right.firstChild);
	    };

	    TimelineView.prototype.suspendUpdating = function () {
	        this.updating = false;
	    };

	    TimelineView.prototype.resumeUpdating = function () {
	        this.updating = true;
	    };

	    TimelineView.prototype.appendFrame = function () {
	        var statistics = this.window.context.statistics;

	        var canvas = this.canvases[this.activeCanvasIndex];
	        this.activeCanvasIndex = (this.activeCanvasIndex + 1) % this.canvases.length;
	        var oldCanvas = this.canvases[this.activeCanvasIndex];

	        var ctx = canvas.getContext("2d");

	        // Draw old
	        ctx.drawImage(oldCanvas, -1, 0);

	        // Clear newly revealed line
	        var x = canvas.width - 1;
	        ctx.fillStyle = "rgb(255,255,255)";
	        ctx.fillRect(x - 1, 0, 2, canvas.height);

	        // Draw counter values
	        for (var n = 0; n < statistics.counters.length; n++) {
	            var counter = statistics.counters[n];
	            if (!counter.enabled) {
	                continue;
	            }
	            var v = Math.round(counter.value);
	            var pv = Math.round(counter.previousValue);
	            var y = canvas.height - v;
	            var py = canvas.height - pv;
	            ctx.beginPath();
	            ctx.moveTo(x - 1, py + 0.5);
	            ctx.lineTo(x, y + 0.5);
	            ctx.strokeStyle = counter.color;
	            ctx.stroke();
	        }

	        // Only do the final composite if we have focus
	        if (this.updating) {
	            var displayCtx = this.displayCanvas.getContext("2d");
	            displayCtx.drawImage(canvas, 0, 0);
	        }
	    };

	    TimelineView.prototype.refresh = function () {
	        // 
	    };

	    return TimelineView;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(31), __webpack_require__(52)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tab, StateView) {

	    var divClass = Tab.divClass;

	    var StateTab = function StateTab(w) {
	        var outer = divClass("window-whole-outer");
	        var whole = divClass("window-whole");
	        whole.appendChild(divClass("window-whole-inner", "scrolling contents"));
	        outer.appendChild(whole);
	        this.el.appendChild(outer);

	        this.stateView = new StateView(w, this.el);

	        this.stateView.setState();

	        this.refresh = function () {
	            this.stateView.setState();
	        };
	    };

	    return StateTab;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(12), __webpack_require__(40)], __WEBPACK_AMD_DEFINE_RESULT__ = function (info, StateSnapshot, helpers) {

	    var StateView = function StateView(w, elementRoot) {
	        var self = this;
	        this.window = w;
	        this.elements = {
	            view: elementRoot.getElementsByClassName("window-whole-inner")[0]
	        };
	    };

	    function generateStateDisplay(w, el, state) {
	        var gl = w.context;

	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-master";
	        titleDiv.textContent = "State Snapshot";
	        el.appendChild(titleDiv);

	        var table = document.createElement("table");
	        table.className = "info-parameters";

	        var stateParameters = info.stateParameters;
	        for (var n = 0; n < stateParameters.length; n++) {
	            var param = stateParameters[n];
	            helpers.appendStateParameterRow(w, gl, table, state, param);
	        }

	        el.appendChild(table);

	        titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-master";
	        titleDiv.textContent = "Canvas Attributes";
	        el.appendChild(titleDiv);

	        table = document.createElement("table");
	        table.className = "info-parameters";
	        var attribs = gl.getContextAttributes();
	        Object.keys(attribs).forEach(function (key) {
	            helpers.appendContextAttributeRow(w, gl, table, attribs, key);
	        });

	        el.appendChild(table);
	    };

	    StateView.prototype.setState = function () {
	        var rawgl = this.window.context.rawgl;
	        var state = null;
	        switch (this.window.activeVersion) {
	            case null:
	                state = new StateSnapshot(rawgl);
	                break;
	            case "current":
	                state = this.window.controller.getCurrentState();
	                break;
	        }

	        var node = this.elements.view;
	        while (node.hasChildNodes()) {
	            node.removeChild(node.firstChild);
	        }

	        if (state) {
	            generateStateDisplay(this.window, this.elements.view, state);
	        }

	        this.elements.view.scrollTop = 0;
	    };

	    return StateView;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16), __webpack_require__(31), __webpack_require__(33), __webpack_require__(37), __webpack_require__(54), __webpack_require__(55)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource, Tab, LeftListing, PopupWindow, TexturePicker, TextureView) {

	    var textureItemCSSClassRE = /texture-item-\w+$/;

	    var TexturesTab = function TexturesTab(w) {
	        var outer = Tab.divClass('window-right-outer');
	        var right = Tab.divClass('window-right');
	        var inspector = Tab.divClass('window-inspector');
	        inspector.classList.add('window-texture-inspector');
	        var texture = Tab.divClass('window-texture-outer');

	        inspector.appendChild(Tab.divClass('surface-inspector-toolbar', 'toolbar'));
	        inspector.appendChild(Tab.divClass('surface-inspector-inner', 'inspector'));
	        inspector.appendChild(Tab.inspector());
	        texture.appendChild(Tab.divClass('texture-listing', 'call trace'));
	        right.appendChild(inspector);
	        right.appendChild(texture);
	        outer.appendChild(right);
	        outer.appendChild(Tab.windowLeft({ listing: 'frame list', toolbar: 'buttons' }));

	        this.el.appendChild(outer);

	        this.listing = new LeftListing(w, this.el, "texture", function (el, texture) {
	            var gl = w.context;

	            if (texture.status == Resource.DEAD) {
	                el.className += " texture-item-deleted";
	            }

	            switch (texture.type) {
	                case gl.TEXTURE_2D:
	                    el.className += " texture-item-2d";
	                    break;
	                case gl.TEXTURE_CUBE_MAP:
	                    el.className += " texture-item-cube";
	                    break;
	                case gl.TEXTURE_3D:
	                    el.className += " texture-item-3d";
	                    break;
	                case gl.TEXTURE_2D_ARRAY:
	                    el.className += " texture-item-3d";
	                    break;
	            }

	            var number = document.createElement("div");
	            number.className = "texture-item-number";
	            number.textContent = texture.getName();
	            el.appendChild(number);

	            var row = document.createElement("div");
	            row.className = "texture-item-row";

	            function updateSize() {
	                switch (texture.type) {
	                    case gl.TEXTURE_2D:
	                        el.className = el.className.replace(textureItemCSSClassRE, 'texture-item-2d');
	                        break;
	                    case gl.TEXTURE_CUBE_MAP:
	                        el.className = el.className.replace(textureItemCSSClassRE, 'texture-item-cube');
	                        break;
	                    case gl.TEXTURE_3D:
	                        el.className = el.className.replace(textureItemCSSClassRE, 'texture-item-3d');
	                        break;
	                    case gl.TEXTURE_2D_ARRAY:
	                        el.className = el.className.replace(textureItemCSSClassRE, 'texture-item-2d-array');
	                        break;
	                }
	                var guessedSize = texture.guessSize(gl);
	                if (guessedSize) {
	                    row.textContent = guessedSize[0] + " x " + guessedSize[1];
	                } else {
	                    row.textContent = "? x ?";
	                }
	            };
	            updateSize();

	            if (!row.hasChildNodes()) {
	                el.appendChild(row);
	            }

	            texture.modified.addListener(this, function (texture) {
	                number.textContent = texture.getName();
	                updateSize();
	                // TODO: refresh view if selected
	            });
	            texture.deleted.addListener(this, function (texture) {
	                el.className += " texture-item-deleted";
	            });
	        });

	        this.listing.addButton("Browse All").addListener(this, function () {
	            PopupWindow.show(w.context, TexturePicker, "texturePicker", function (popup) {});
	        });

	        this.textureView = new TextureView(w, this.el);

	        this.listing.valueSelected.addListener(this, function (texture) {
	            this.textureView.setTexture(texture);
	        });

	        var scrollStates = {};
	        this.lostFocus.addListener(this, function () {
	            scrollStates.listing = this.listing.getScrollState();
	        });
	        this.gainedFocus.addListener(this, function () {
	            this.listing.setScrollState(scrollStates.listing);
	        });

	        // Append textures already present
	        var context = w.context;
	        var textures = context.resources.getTextures();
	        for (var n = 0; n < textures.length; n++) {
	            var texture = textures[n];
	            this.listing.appendValue(texture);
	        }

	        // Listen for changes
	        context.resources.resourceRegistered.addListener(this, function (resource) {
	            if (base.typename(resource.target) == "WebGLTexture") {
	                this.listing.appendValue(resource);
	            }
	        });

	        this.layout = function () {
	            this.textureView.layout();
	        };

	        this.refresh = function () {
	            this.textureView.setTexture(this.textureView.currentTexture);
	        };
	    };

	    return TexturesTab;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(37), __webpack_require__(42)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, PopupWindow, TexturePreviewGenerator) {

	    var TexturePicker = function TexturePicker(context, name) {
	        base.subclass(PopupWindow, this, [context, name, "Texture Browser", 610, 600]);
	    };

	    TexturePicker.prototype.setup = function () {
	        var self = this;
	        var context = this.context;
	        var doc = this.browserWindow.document;
	        var gl = context;

	        this.previewer = new TexturePreviewGenerator();

	        // Append textures already present
	        var textures = context.resources.getTextures();
	        for (var n = 0; n < textures.length; n++) {
	            var texture = textures[n];
	            var el = this.previewer.buildItem(this, doc, gl, texture, true, true);
	            this.elements.innerDiv.appendChild(el);
	        }

	        // Listen for changes
	        context.resources.resourceRegistered.addListener(this, this.resourceRegistered);
	    };

	    TexturePicker.prototype.dispose = function () {
	        this.context.resources.resourceRegistered.removeListener(this);
	    };

	    TexturePicker.prototype.resourceRegistered = function (resource) {
	        var doc = this.browserWindow.document;
	        var gl = this.context;
	        if (base.typename(resource.target) == "WebGLTexture") {
	            var el = this.previewer.buildItem(this, doc, gl, resource, true);
	            this.elements.innerDiv.appendChild(el);
	        }
	    };

	    return TexturePicker;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(8), __webpack_require__(7), __webpack_require__(10), __webpack_require__(9), __webpack_require__(40), __webpack_require__(46), __webpack_require__(41), __webpack_require__(42), __webpack_require__(39)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, glc, info, settings, util, helpers, BufferPreview, SurfaceInspector, TexturePreviewGenerator, traceLine) {

	    var TextureView = function TextureView(w, elementRoot) {
	        var self = this;
	        this.window = w;
	        this.elements = {
	            view: elementRoot.getElementsByClassName("window-right")[0],
	            listing: elementRoot.getElementsByClassName("texture-listing")[0]
	        };

	        this.inspectorElements = {
	            "window-texture-outer": elementRoot.getElementsByClassName("window-texture-outer")[0],
	            "window-texture-inspector": elementRoot.getElementsByClassName("window-texture-inspector")[0],
	            "texture-listing": elementRoot.getElementsByClassName("texture-listing")[0]
	        };
	        this.inspector = new SurfaceInspector(this, w, elementRoot, {
	            splitterKey: 'textureSplitter',
	            title: 'Texture Preview',
	            selectionName: 'Face',
	            selectionValues: ["POSITIVE_X", "NEGATIVE_X", "POSITIVE_Y", "NEGATIVE_Y", "POSITIVE_Z", "NEGATIVE_Z"]
	        });
	        this.inspector.currentTexture = null;
	        this.inspector.currentVersion = null;
	        this.inspector.getTargetFace = function (gl) {
	            var targetFace;
	            switch (this.currentTexture.type) {
	                case gl.TEXTURE_CUBE_MAP:
	                    targetFace = gl.TEXTURE_CUBE_MAP_POSITIVE_X + this.activeOption;
	                    break;
	                default:
	                    targetFace = null;
	                    break;
	            }
	            return targetFace;
	        };
	        this.inspector.querySize = function () {
	            var gl = this.gl;
	            if (!this.currentTexture || !this.currentVersion) {
	                return null;
	            }
	            var targetFace = this.getTargetFace(gl);
	            return this.currentTexture.guessSize(gl, this.currentVersion, targetFace);
	        };
	        this.inspector.setupPreview = function () {
	            if (this.previewer) {
	                return;
	            }
	            this.previewer = new TexturePreviewGenerator(this.canvas, false);
	            this.gl = this.previewer.gl;
	        };
	        this.inspector.updatePreview = function () {
	            var gl = this.gl;

	            var targetFace = this.getTargetFace(gl);
	            var size = this.currentTexture.guessSize(gl, this.currentVersion, targetFace);
	            var desiredWidth = 1;
	            var desiredHeight = 1;
	            if (size) {
	                desiredWidth = size[0];
	                desiredHeight = size[1];
	                this.canvas.style.display = "";
	            } else {
	                this.canvas.style.display = "none";
	            }

	            this.previewer.draw(this.currentTexture, this.currentVersion, targetFace, desiredWidth, desiredHeight);
	        };
	        this.inspector.setTexture = function (texture, version) {
	            var gl = this.window.context;

	            if (texture) {
	                this.options.title = "Texture Preview: " + texture.getName();
	            } else {
	                this.options.title = "Texture Preview: (none)";
	            }

	            this.currentTexture = texture;
	            this.currentVersion = version;
	            this.activeOption = 0;
	            this.optionsList.selectedIndex = 0;

	            if (texture) {
	                // Setup UI
	                switch (texture.type) {
	                    case gl.TEXTURE_2D:
	                    case gl.TEXTURE_3D:
	                    case gl.TEXTURE_2D_ARRAY:
	                        this.elements.faces.style.display = "none";
	                        break;
	                    case gl.TEXTURE_CUBE_MAP:
	                        this.elements.faces.style.display = "";
	                        break;
	                }
	                this.updatePreview();
	            } else {
	                // Clear everything
	                this.elements.faces.style.display = "none";
	                this.canvas.width = 1;
	                this.canvas.height = 1;
	                this.canvas.style.display = "none";
	            }

	            this.reset();
	            this.layout();
	        };

	        this.currentTexture = null;
	    };

	    TextureView.prototype.setInspectorWidth = function (newWidth) {
	        //.window-texture-outer margin-left: -800px !important; /* -2 * window-texture-inspector.width */
	        //.window-texture margin-left: 400px !important; /* window-texture-inspector.width */
	        //.texture-listing right: 400px; /* window-texture-inspector */
	        this.inspectorElements["window-texture-outer"].style.marginLeft = -2 * newWidth + "px";
	        this.inspectorElements["window-texture-inspector"].style.width = newWidth + "px";
	        this.inspectorElements["texture-listing"].style.right = newWidth + "px";
	    };

	    TextureView.prototype.layout = function () {
	        this.inspector.layout();
	    };

	    function oneValueOneChannelCopyRect(src, srcStart, srcStride, dst, dstStride, width, height, valueFn, formatConversionInfo, preMultAlpha) {
	        var numComponents = formatConversionInfo.numComponents,
	            channelMult = formatConversionInfo.channelMult,
	            channelNdx = formatConversionInfo.channelNdx,
	            channelOffset = formatConversionInfo.channelOffset;

	        for (var y = 0; y < height; ++y) {
	            var sn = srcStart;
	            var dn = y * dstStride;
	            for (var x = 0; x < width; ++x, sn += numComponents, dn += 4) {
	                dst[dn + 0] = channelMult[0] * valueFn(src[sn + channelNdx[0]]) + channelOffset[0] * 255;
	                dst[dn + 1] = channelMult[1] * valueFn(src[sn + channelNdx[1]]) + channelOffset[1] * 255;
	                dst[dn + 2] = channelMult[2] * valueFn(src[sn + channelNdx[2]]) + channelOffset[2] * 255;
	                dst[dn + 3] = channelMult[3] * valueFn(src[sn + channelNdx[3]]) + channelOffset[3] * 255;
	            }
	            srcStart += srcStride;
	        }
	    }

	    function oneValueAllChannelsCopyRect(src, srcStart, srcStride, dst, dstStride, width, height, valueFn) {
	        for (var y = 0; y < height; ++y) {
	            var sn = srcStart;
	            var dn = y * dstStride;
	            for (var x = 0; x < width; ++x, ++sn, dn += 4) {
	                var s = valueFn(src[sn]);
	                dst[dn + 0] = s.r;
	                dst[dn + 1] = s.g;
	                dst[dn + 2] = s.b;
	                dst[dn + 3] = s.a;
	            }
	            srcStart += srcStride;
	        }
	    }

	    function FP32() {
	        var floatView = new Float32Array(1);
	        var uint32View = new Uint32Array(floatView.buffer);

	        return {
	            u: uint32View,
	            f: floatView
	        };
	    }

	    // from https://gist.github.com/rygorous/2156668
	    var fromHalf = function () {
	        var shifted_exp = 0x7c00 << 13; // exponent mask after shift
	        var magic = new FP32();
	        magic.u[0] = 113 << 23;
	        var o = new FP32();

	        return function (v) {

	            o.u[0] = (v & 0x7fff) << 13; // exponent/mantissa bits
	            var exp = shifted_exp & o.u[0]; // just the exponent
	            o.u[0] += 127 - 15 << 23; // exponent adjust

	            // handle exponent special cases
	            if (exp === shifted_exp) {
	                // Inf/NaN?
	                o.u[0] += 128 - 16 << 23; // extra exp adjust
	            } else if (exp == 0) {
	                // Zero/Denormal?
	                o.u[0] += 1 << 23; // extra exp adjust
	                o.f[0] -= magic.f[0]; // renormalize
	            }

	            o.u[0] |= (v & 0x8000) << 16; // sign bit
	            return o.f[0];
	        };
	    }();

	    // From OpenGL ES 3.0 spec 2.1.3
	    function from11f(v) {
	        var e = v >> 6;
	        var m = v & 0x2F;
	        if (e === 0) {
	            if (m === 0) {
	                return 0;
	            } else {
	                return Math.pow(2, -14) * (m / 64);
	            }
	        } else {
	            if (e < 31) {
	                return Math.pow(2, e - 15) * (1 + m / 64);
	            } else {
	                if (m === 0) {
	                    return 0; // Inf
	                } else {
	                    return 0; // Nan
	                }
	            }
	        }
	    }

	    // From OpenGL ES 3.0 spec 2.1.4
	    function from10f(v) {
	        var e = v >> 5;
	        var m = v & 0x1F;
	        if (e === 0) {
	            if (m === 0) {
	                return 0;
	            } else {
	                return Math.pow(2, -14) * (m / 32);
	            }
	        } else {
	            if (e < 31) {
	                return Math.pow(2, e - 15) * (1 + m / 32);
	            } else {
	                if (m === 0) {
	                    return 0; // Inf
	                } else {
	                    return 0; // Nan
	                }
	            }
	        }
	    }

	    function rgba8From565(v) {
	        return {
	            r: (v >> 11 & 0x1F) * 0xFF / 0x1F | 0,
	            g: (v >> 5 & 0x3F) * 0xFF / 0x3F | 0,
	            b: (v >> 0 & 0x1F) * 0xFF / 0x1F | 0,
	            a: 255
	        };
	    }

	    function rgba8From4444(v) {
	        return {
	            r: (v >> 12 & 0xF) * 0xFF / 0xF | 0,
	            g: (v >> 8 & 0xF) * 0xFF / 0xF | 0,
	            b: (v >> 4 & 0xF) * 0xFF / 0xF | 0,
	            a: (v >> 0 & 0xF) * 0xFF / 0xF | 0
	        };
	    }

	    function rgba8From5551(v) {
	        return {
	            r: (v >> 11 & 0x1F) * 0xFF / 0x1F | 0,
	            g: (v >> 6 & 0x1F) * 0xFF / 0x1F | 0,
	            b: (v >> 1 & 0x1F) * 0xFF / 0x1F | 0,
	            a: (v >> 0 & 0x01) * 0xFF / 0x01 | 0
	        };
	    }

	    function rgba8From10F11F11Frev(v) {
	        return {
	            r: from11f(v >> 0 & 0x3FF) * 0xFF | 0,
	            g: from11f(v >> 11 & 0x3FF) * 0xFF | 0,
	            b: from10f(v >> 22 & 0x1FF) * 0xFF | 0,
	            a: 255
	        };
	    }

	    function rgba8From5999rev(v) {
	        // OpenGL ES 3.0 spec 3.8.3.2
	        var n = 9; // num bits
	        var b = 15; // exponent bias
	        var exp = v >> 27;
	        var sharedExp = Math.pow(2, exp - b - n);
	        return {
	            r: (v >> 0 & 0x1FF) * sharedExp * 0xFF | 0,
	            g: (v >> 9 & 0x1FF) * sharedExp * 0xFF | 0,
	            b: (v >> 18 & 0x1FF) * sharedExp * 0xFF | 0,
	            a: 255
	        };
	    }

	    function rgba8From2101010rev(v) {
	        return {
	            r: (v >> 0 & 0x2FF) * 0xFF / 0x2FF | 0,
	            g: (v >> 10 & 0x2FF) * 0xFF / 0x2FF | 0,
	            b: (v >> 20 & 0x2FF) * 0xFF / 0x2FF | 0,
	            a: (v >> 30 & 0x3) * 0xFF / 0x3 | 0
	        };
	    }

	    function rgba8From248(v) {
	        return {
	            r: (v >> 8 & 0xFFFFFF) * 0xFF / 0xFFFFFF | 0,
	            g: v >> 0 & 0xFF,
	            b: 0,
	            a: 0
	        };
	    }

	    function rgba8From248rev(v) {
	        return {
	            r: (v >> 0 & 0xFFFFFF) * 0xFF / 0xFFFFFF | 0,
	            g: v >> 24 & 0xFF,
	            b: 0,
	            a: 0
	        };
	    }

	    var formatConversionInfo = {};

	    formatConversionInfo[glc.ALPHA] = { numComponents: 1, channelMult: [0, 0, 0, 1], channelNdx: [0, 0, 0, 0], channelOffset: [0, 0, 0, 0] };
	    formatConversionInfo[glc.LUMINANCE] = { numComponents: 1, channelMult: [1, 1, 1, 0], channelNdx: [0, 0, 0, 0], channelOffset: [0, 0, 0, 1] };
	    formatConversionInfo[glc.LUMINANCE_ALPHA] = { numComponents: 2, channelMult: [1, 1, 1, 1], channelNdx: [0, 0, 0, 1], channelOffset: [0, 0, 0, 0] };
	    formatConversionInfo[glc.RED] = { numComponents: 1, channelMult: [1, 0, 0, 0], channelNdx: [0, 0, 0, 0], channelOffset: [0, 0, 0, 1] }; // NOTE: My experience is these are actually alpha = 0 but then you can't see them
	    formatConversionInfo[glc.RED_INTEGER] = { numComponents: 1, channelMult: [1, 0, 0, 0], channelNdx: [0, 0, 0, 0], channelOffset: [0, 0, 0, 1] }; // NOTE: My experience is these are actually alpha = 0 but then you can't see them
	    formatConversionInfo[glc.RG] = { numComponents: 2, channelMult: [1, 1, 0, 0], channelNdx: [0, 1, 0, 0], channelOffset: [0, 0, 0, 1] }; // NOTE: My experience is these are actually alpha = 0 but then you can't see them
	    formatConversionInfo[glc.RG_INTEGER] = { numComponents: 2, channelMult: [1, 1, 0, 0], channelNdx: [0, 0, 0, 0], channelOffset: [0, 0, 0, 1] }; // NOTE: My experience is these are actually alpha = 0 but then you can't see them
	    formatConversionInfo[glc.RGB] = { numComponents: 3, channelMult: [1, 1, 1, 0], channelNdx: [0, 1, 2, 0], channelOffset: [0, 0, 0, 1] };
	    formatConversionInfo[glc.RGB_INTEGER] = { numComponents: 3, channelMult: [1, 1, 1, 0], channelNdx: [0, 1, 2, 0], channelOffset: [0, 0, 0, 1] };
	    formatConversionInfo[glc.RGBA] = { numComponents: 4, channelMult: [1, 1, 1, 1], channelNdx: [0, 1, 2, 3], channelOffset: [0, 0, 0, 0] };
	    formatConversionInfo[glc.RGBA_INTEGER] = { numComponents: 4, channelMult: [1, 1, 1, 1], channelNdx: [0, 1, 2, 3], channelOffset: [0, 0, 0, 0] };
	    formatConversionInfo[glc.DEPTH_COMPONENT] = { numComponents: 1, channelMult: [1, 1, 0, 0], channelNdx: [1, 1, 1, 0], channelOffset: [0, 0, 0, 1] };
	    formatConversionInfo[glc.DEPTH_STENCIL] = { numComponents: 2, channelMult: [1, 1, 0, 0], channelNdx: [0, 1, 0, 0], channelOffset: [0, 0, 0, 1] };

	    var typeFormatConversionInfo = {};

	    typeFormatConversionInfo[glc.BYTE] = { typeSize: 1, multiChannel: false, rectFn: oneValueOneChannelCopyRect, valueFn: function valueFn(v) {
	            return v + 128;
	        } };
	    typeFormatConversionInfo[glc.UNSIGNED_BYTE] = { typeSize: 1, multiChannel: false, rectFn: oneValueOneChannelCopyRect, valueFn: function valueFn(v) {
	            return v;
	        } };
	    typeFormatConversionInfo[glc.FLOAT] = { typeSize: 4, multiChannel: false, rectFn: oneValueOneChannelCopyRect, valueFn: function valueFn(v) {
	            return v * 255;
	        } };
	    typeFormatConversionInfo[glc.HALF_FLOAT] = { typeSize: 2, multiChannel: false, rectFn: oneValueOneChannelCopyRect, valueFn: function valueFn(v) {
	            return fromHalf(v) * 255;
	        } };
	    typeFormatConversionInfo[glc.SHORT] = { typeSize: 2, multiChannel: false, rectFn: oneValueOneChannelCopyRect, valueFn: function valueFn(v) {
	            return v;
	        } };
	    typeFormatConversionInfo[glc.UNSIGNED_SHORT] = { typeSize: 2, multiChannel: false, rectFn: oneValueOneChannelCopyRect, valueFn: function valueFn(v) {
	            return v;
	        } };
	    typeFormatConversionInfo[glc.INT] = { typeSize: 4, multiChannel: false, rectFn: oneValueOneChannelCopyRect, valueFn: function valueFn(v) {
	            return v;
	        } };
	    typeFormatConversionInfo[glc.UNSIGNED_INT] = { typeSize: 4, multiChannel: false, rectFn: oneValueOneChannelCopyRect, valueFn: function valueFn(v) {
	            return v;
	        } };
	    typeFormatConversionInfo[glc.UNSIGNED_SHORT_5_6_5] = { typeSize: 2, multiChannel: true, rectFn: oneValueAllChannelsCopyRect, valueFn: rgba8From565 };
	    typeFormatConversionInfo[glc.UNSIGNED_SHORT_4_4_4_4] = { typeSize: 2, multiChannel: true, rectFn: oneValueAllChannelsCopyRect, valueFn: rgba8From4444 };
	    typeFormatConversionInfo[glc.UNSIGNED_SHORT_5_5_5_1] = { typeSize: 2, multiChannel: true, rectFn: oneValueAllChannelsCopyRect, valueFn: rgba8From5551 };
	    typeFormatConversionInfo[glc.UNSIGNED_INT_10F_11F_11F_REV] = { typeSize: 4, multiChannel: true, rectFn: oneValueAllChannelsCopyRect, valueFn: rgba8From10F11F11Frev };
	    typeFormatConversionInfo[glc.UNSIGNED_INT_5_9_9_9_REV] = { typeSize: 4, multiChannel: true, rectFn: oneValueAllChannelsCopyRect, valueFn: rgba8From5999rev };
	    typeFormatConversionInfo[glc.UNSIGNED_INT_2_10_10_10_REV] = { typeSize: 4, multiChannel: true, rectFn: oneValueAllChannelsCopyRect, valueFn: rgba8From2101010rev };
	    typeFormatConversionInfo[glc.UNSIGNED_INT_24_8] = { typeSize: 4, multiChannel: true, rectFn: oneValueAllChannelsCopyRect, valueFn: rgba8From248 };
	    typeFormatConversionInfo[glc.FLOAT_32_UNSIGNED_INT_24_8_REV] = { typeSize: 4, multiChannel: true, rectFn: oneValueAllChannelsCopyRect, valueFn: rgba8From248rev };

	    //// WEBGL_compressed_texture_s3tc
	    //glc.COMPRESSED_RGB_S3TC_DXT1_EXT
	    //glc.COMPRESSED_RGBA_S3TC_DXT1_EXT
	    //glc.COMPRESSED_RGBA_S3TC_DXT3_EXT
	    //glc.COMPRESSED_RGBA_S3TC_DXT5_EXT
	    //
	    //glc.COMPRESSED_R11_EAC
	    //glc.COMPRESSED_SIGNED_R11_EAC
	    //glc.COMPRESSED_RG11_EAC
	    //glc.COMPRESSED_SIGNED_RG11_EAC
	    //glc.COMPRESSED_RGB8_ETC2
	    //glc.COMPRESSED_SRGB8_ETC2
	    //glc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2
	    //glc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2
	    //glc.COMPRESSED_RGBA8_ETC2_EAC
	    //glc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
	    //
	    //// WEBGL_compressed_texture_atc
	    //glc.COMPRESSED_RGB_ATC_WEBGL
	    //glc.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL
	    //glc.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL
	    //
	    //// WEBGL_compressed_texture_pvrtc
	    //glc.COMPRESSED_RGB_PVRTC_4BPPV1_IMG
	    //glc.COMPRESSED_RGB_PVRTC_2BPPV1_IMG
	    //glc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG
	    //glc.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG

	    function createImageDataFromPixels(gl, pixelStoreState, width, height, depth, format, type, source) {
	        var canvas = document.createElement("canvas");
	        canvas.className = "gli-reset";
	        var ctx = canvas.getContext("2d");
	        var imageData = ctx.createImageData(width, height);

	        // TODO: support depth > 1

	        // TODO: support all pixel store state
	        //UNPACK_ALIGNMENT
	        //UNPACK_COLORSPACE_CONVERSION_WEBGL
	        //UNPACK_FLIP_Y_WEBGL
	        //UNPACK_PREMULTIPLY_ALPHA_WEBGL
	        //UNPACK_ROW_LENGTH
	        //UNPACK_SKIP_ROWS
	        //UNPACK_SKIP_PIXELS
	        //UNPACK_SKIP_IMAGES
	        //UNPACK_IMAGE_HEIGHT


	        var unpackAlignment = pixelStoreState["UNPACK_ALIGNMENT"];
	        if (unpackAlignment === undefined) {
	            unpackAlignment = 4;
	        }

	        if (pixelStoreState["UNPACK _COLORSPACE_CONVERSION_WEBGL"] !== gl.BROWSER_DEFAULT_WEBGL) {
	            console.log("unsupported: UNPACK_COLORSPACE_CONVERSION_WEBGL != BROWSER_DEFAULT_WEBGL");
	        }
	        if (pixelStoreState["UNPACK_PREMULTIPLY_ALPHA_WEBGL"]) {
	            console.log("unsupported: UNPACK_PREMULTIPLY_ALPHA_WEBGL = true");
	        }

	        // TODO: implement all texture formats
	        var typeFormatInfo = typeFormatConversionInfo[type];
	        if (!typeFormatInfo) {
	            console.log("unsupported texture type:", info.enumToString(type));
	            return null;
	        }

	        var formatInfo = formatConversionInfo[format];
	        if (!formatInfo) {
	            console.log("unsupported texture format:", info.enumToString(format));
	            return null;
	        }

	        var bytesPerElement = (typeFormatInfo.multiChannel ? 1 : formatInfo.numComponents) * typeFormatInfo.typeSize;

	        var srcStride = bytesPerElement * width + unpackAlignment - 1 & (0x10000000 - unpackAlignment) / source.BYTES_PER_ELEMENT;
	        if (srcStride % 1) {
	            console.log("unsupported source type");
	            return null;
	        }

	        var dstStride = width * 4;
	        var preMultAlpha = pixelStoreState["UNPACK_PREMULTIPLY_ALPHA_WEBGL"];
	        var flipY = pixelStoreState["UNPACK_FLIP_Y_WEBGL"];
	        var srcStart = flipY ? srcStride * (height - 1) : 0;

	        typeFormatInfo.rectFn(source, srcStart, flipY ? -srcStide : srcStride, imageData.data, dstStride, width, height, typeFormatInfo.valueFn, formatInfo, preMultAlpha);

	        return imageData;
	    };

	    function appendHistoryLine(gl, el, texture, version, call) {
	        if (call.name == "pixelStorei") {
	            // Don't care about these for now - maybe they will be useful in the future
	            return;
	        }

	        traceLine.appendHistoryLine(gl, el, call);

	        if (call.name == "texImage2D" || call.name == "texSubImage2D" || call.name == "texImage3D" || call.name == "texSubImage3D" || call.name == "compressedTexImage2D" || call.name == "compressedTexSubImage2D") {
	            // Gather up pixel store state between this call and the previous one
	            var pixelStoreState = {};
	            for (var i = version.calls.indexOf(call) - 1; i >= 0; i--) {
	                var prev = version.calls[i];
	                if (prev.name == "texImage2D" || prev.name == "texSubImage2D" || prev.name == "texImage3D" || prev.name == "texSubImage3D" || prev.name == "compressedTexImage2D" || prev.name == "compressedTexSubImage2D") {
	                    break;
	                }
	                var pname = info.enumMap[prev.args[0]];
	                pixelStoreState[pname] = prev.args[1];
	            }

	            // TODO: display src of last arg (either data, img, video, etc)
	            var sourceArg = null;
	            for (var n = 0; n < call.args.length; n++) {
	                var arg = call.args[n];
	                if (arg) {
	                    if (arg instanceof HTMLCanvasElement || arg instanceof HTMLImageElement || arg instanceof HTMLVideoElement) {
	                        sourceArg = util.clone(arg);
	                    } else if (base.typename(arg) == "ImageData") {
	                        sourceArg = arg;
	                    } else if (arg.length) {
	                        // Likely an array of some kind
	                        sourceArg = arg;
	                    }
	                }
	            }

	            // Fixup arrays by converting to ImageData
	            if (sourceArg && sourceArg.length) {
	                var _width = void 0;
	                var _height = void 0;
	                var depth = 1;
	                var format = void 0;
	                var type = void 0;
	                if (call.name == "texImage2D") {
	                    _width = call.args[3];
	                    _height = call.args[4];
	                    format = call.args[6];
	                    type = call.args[7];
	                } else if (call.name == "texSubImage2D") {
	                    _width = call.args[4];
	                    _height = call.args[5];
	                    format = call.args[6];
	                    type = call.args[7];
	                } else if (call.name == "texImage3D") {
	                    _width = call.args[3];
	                    _height = call.args[4];
	                    depth = call.args[5];
	                    format = call.args[7];
	                    type = call.args[8];
	                } else if (call.name == "texSubImage3D") {
	                    _width = call.args[4];
	                    _height = call.args[5];
	                    depth = call.args[6];
	                    format = call.args[8];
	                    type = call.args[9];
	                } else if (call.name == "compressedTexImage2D") {
	                    _width = call.args[3];
	                    _height = call.args[4];
	                    format = call.args[2];
	                    type = format;
	                } else if (call.name == "compressedTexSubImage2D") {
	                    _width = call.args[4];
	                    _height = call.args[5];
	                    format = call.args[6];
	                    type = format;
	                }
	                sourceArg = createImageDataFromPixels(gl, pixelStoreState, _width, _height, depth, format, type, sourceArg);
	            }

	            // Fixup ImageData
	            if (sourceArg && base.typename(sourceArg) == "ImageData") {
	                // Draw into a canvas
	                var canvas = document.createElement("canvas");
	                canvas.className = "gli-reset";
	                canvas.width = sourceArg.width;
	                canvas.height = sourceArg.height;
	                var ctx = canvas.getContext("2d");
	                ctx.putImageData(sourceArg, 0, 0);
	                sourceArg = canvas;
	            }

	            if (sourceArg) {
	                var dupeEl = sourceArg;

	                // Grab the size before we muck with the element
	                var size = [dupeEl.width, dupeEl.height];

	                dupeEl.style.width = "100%";
	                dupeEl.style.height = "100%";

	                if (dupeEl.src) {
	                    var srcEl = document.createElement("div");
	                    srcEl.className = "texture-history-src";
	                    srcEl.textContent = "Source: ";
	                    var srcLinkEl = document.createElement("span");
	                    srcLinkEl.className = "texture-history-src-link";
	                    srcLinkEl.target = "_blank";
	                    srcLinkEl.href = dupeEl.src;
	                    srcLinkEl.textContent = dupeEl.src;
	                    srcEl.appendChild(srcLinkEl);
	                    el.appendChild(srcEl);
	                }

	                var dupeRoot = document.createElement("div");
	                dupeRoot.className = "texture-history-dupe";
	                dupeRoot.appendChild(dupeEl);
	                el.appendChild(dupeRoot);

	                // Resize on click logic
	                var parentWidth = 512; // TODO: pull from parent?
	                var parentHeight = Math.min(size[1], 128);
	                var parentar = parentHeight / parentWidth;
	                var ar = size[1] / size[0];

	                var width;
	                var height;
	                if (ar * parentWidth < parentHeight) {
	                    width = parentWidth;
	                    height = ar * parentWidth;
	                } else {
	                    height = parentHeight;
	                    width = parentHeight / ar;
	                }
	                dupeRoot.style.width = width + "px";
	                dupeRoot.style.height = height + "px";

	                var sizedToFit = true;
	                dupeRoot.onclick = function (e) {
	                    sizedToFit = !sizedToFit;
	                    if (sizedToFit) {
	                        dupeRoot.style.width = width + "px";
	                        dupeRoot.style.height = height + "px";
	                    } else {
	                        dupeRoot.style.width = size[0] + "px";
	                        dupeRoot.style.height = size[1] + "px";
	                    }
	                    e.preventDefault();
	                    e.stopPropagation();
	                };
	            }
	        }
	    };

	    function generateTextureHistory(gl, el, texture, version) {
	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-secondary";
	        titleDiv.textContent = "History";
	        el.appendChild(titleDiv);

	        var rootEl = document.createElement("div");
	        rootEl.className = "texture-history";
	        el.appendChild(rootEl);

	        for (var n = 0; n < version.calls.length; n++) {
	            var call = version.calls[n];
	            appendHistoryLine(gl, rootEl, texture, version, call);
	        }
	    };

	    var notEnum = undefined;
	    var repeatEnums = ["REPEAT", "CLAMP_TO_EDGE", "MIRROR_REPEAT"];
	    var filterEnums = ["NEAREST", "LINEAR", "NEAREST_MIPMAP_NEAREST", "LINEAR_MIPMAP_NEAREST", "NEAREST_MIPMAP_LINEAR", "LINEAR_MIPMAP_LINEAR"];
	    var compareModeEnums = ["NONE", "COMPARE_REF_TO_TEXTURE"];
	    var compareFuncEnums = ["LEQUAL", "GEQUAL", "LESS", "GREATER", "EQUAL", "NOTEQUAL", "ALWAYS", "NEVER"];

	    var webgl1TexturePropertyInfo = {
	        properties: ["TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_MIN_FILTER", "TEXTURE_MAG_FILTER"],
	        enums: [repeatEnums, repeatEnums, filterEnums, filterEnums]
	    };
	    var webgl2TexturePropertyInfo = {
	        properties: ["TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_WRAP_R", "TEXTURE_MIN_FILTER", "TEXTURE_MAG_FILTER", "TEXTURE_MIN_LOD", "TEXTURE_MAX_LOD", "TEXTURE_BASE_LEVEL", "TEXTURE_MAX_LEVEL", "TEXTURE_COMPARE_FUNC", "TEXTURE_COMPARE_MODE"],
	        enums: [repeatEnums, repeatEnums, repeatEnums, filterEnums, filterEnums, notEnum, notEnum, notEnum, notEnum, compareFuncEnums, compareModeEnums]
	    };

	    function generateTextureDisplay(gl, el, texture, version) {
	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-master";
	        titleDiv.textContent = texture.getName();
	        el.appendChild(titleDiv);

	        var propInfo = util.isWebGL2(gl) ? webgl2TexturePropertyInfo : webgl1TexturePropertyInfo;

	        helpers.appendParameters(gl, el, texture, propInfo.properties, propInfo.enums);
	        helpers.appendbr(el);

	        helpers.appendSeparator(el);

	        generateTextureHistory(gl, el, texture, version);
	        helpers.appendbr(el);

	        var frame = gl.ui.controller.currentFrame;
	        if (frame) {
	            helpers.appendSeparator(el);
	            traceLine.generateUsageList(gl, el, frame, texture);
	            helpers.appendbr(el);
	        }
	    };

	    TextureView.prototype.setTexture = function (texture) {
	        this.currentTexture = texture;

	        var version = null;
	        if (texture) {
	            switch (this.window.activeVersion) {
	                case null:
	                    version = texture.currentVersion;
	                    break;
	                case "current":
	                    var frame = this.window.controller.currentFrame;
	                    if (frame) {
	                        version = frame.findResourceVersion(texture);
	                    }
	                    version = version || texture.currentVersion; // Fallback to live
	                    break;
	            }
	        }

	        var node = this.elements.listing;
	        while (node.hasChildNodes()) {
	            node.removeChild(node.firstChild);
	        }
	        if (texture) {
	            generateTextureDisplay(this.window.context, this.elements.listing, texture, version);
	        }

	        this.inspector.setTexture(texture, version);

	        this.elements.listing.scrollTop = 0;
	    };

	    return TextureView;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16), __webpack_require__(31), __webpack_require__(33), __webpack_require__(57)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource, Tab, LeftListing, BufferView) {

	    var BuffersTab = function BuffersTab(w) {
	        var outer = Tab.divClass("window-right-outer");
	        var right = Tab.divClass("window-right");
	        var inspector = Tab.divClass("window-inspector");
	        inspector.classList.add("window-buffer-inspector");
	        var buffer = Tab.divClass("window-buffer-outer");

	        inspector.appendChild(Tab.divClass("surface-inspector-toolbar", "toolbar"));
	        inspector.appendChild(Tab.divClass("surface-inspector-inner", "inspector"));
	        inspector.appendChild(Tab.divClass("surface-inspector-statusbar"));
	        buffer.appendChild(Tab.divClass("buffer-listing", "scrolling contents"));
	        right.appendChild(inspector);
	        right.appendChild(buffer);
	        outer.appendChild(right);
	        outer.appendChild(Tab.windowLeft({ listing: "frame list", toolbar: "buttons" }));

	        this.el.appendChild(outer);

	        this.listing = new LeftListing(w, this.el, "buffer", function (el, buffer) {
	            var gl = w.context;

	            if (buffer.status == Resource.DEAD) {
	                el.className += " buffer-item-deleted";
	            }

	            switch (buffer.type) {
	                case gl.ARRAY_BUFFER:
	                    el.className += " buffer-item-array";
	                    break;
	                case gl.ELEMENT_ARRAY_BUFFER:
	                    el.className += " buffer-item-element-array";
	                    break;
	            }

	            var number = document.createElement("div");
	            number.className = "buffer-item-number";
	            number.textContent = buffer.getName();
	            el.appendChild(number);

	            buffer.modified.addListener(this, function (buffer) {
	                // TODO: refresh view if selected
	                //console.log("refresh buffer row");

	                // Type may have changed - update it
	                el.className = el.className.replace(" buffer-item-array", "").replace(" buffer-item-element-array", "");
	                switch (buffer.type) {
	                    case gl.ARRAY_BUFFER:
	                        el.className += " buffer-item-array";
	                        break;
	                    case gl.ELEMENT_ARRAY_BUFFER:
	                        el.className += " buffer-item-element-array";
	                        break;
	                }
	            });
	            buffer.deleted.addListener(this, function (buffer) {
	                el.className += " buffer-item-deleted";
	            });
	        });
	        this.bufferView = new BufferView(w, this.el);

	        this.listing.valueSelected.addListener(this, function (buffer) {
	            this.bufferView.setBuffer(buffer);
	        });

	        var scrollStates = {};
	        this.lostFocus.addListener(this, function () {
	            scrollStates.listing = this.listing.getScrollState();
	        });
	        this.gainedFocus.addListener(this, function () {
	            this.listing.setScrollState(scrollStates.listing);
	        });

	        // Append buffers already present
	        var context = w.context;
	        var buffers = context.resources.getBuffers();
	        for (var n = 0; n < buffers.length; n++) {
	            var buffer = buffers[n];
	            this.listing.appendValue(buffer);
	        }

	        // Listen for changes
	        context.resources.resourceRegistered.addListener(this, function (resource) {
	            if (base.typename(resource.target) == "WebGLBuffer") {
	                this.listing.appendValue(resource);
	            }
	        });

	        // When we lose focus, reselect the buffer - shouldn't mess with things too much, and also keeps the DOM small if the user had expanded things
	        this.lostFocus.addListener(this, function () {
	            if (this.listing.previousSelection) {
	                this.listing.selectValue(this.listing.previousSelection.value);
	            }
	        });

	        this.layout = function () {
	            this.bufferView.layout();
	        };

	        this.refresh = function () {
	            this.bufferView.setBuffer(this.bufferView.currentBuffer);
	        };
	    };

	    return BuffersTab;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(40), __webpack_require__(46), __webpack_require__(41), __webpack_require__(39)], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers, BufferPreview, SurfaceInspector, traceLine) {

	    function shouldShowPreview(gl, buffer, version) {
	        return !!buffer && buffer.type == gl.ARRAY_BUFFER && !!version.structure && !!version.lastDrawState;
	    }

	    var BufferView = function BufferView(w, elementRoot) {
	        var self = this;
	        this.window = w;
	        this.elements = {
	            view: elementRoot.getElementsByClassName("window-right")[0],
	            listing: elementRoot.getElementsByClassName("buffer-listing")[0]
	        };

	        this.inspectorElements = {
	            "window-buffer-outer": elementRoot.getElementsByClassName("window-buffer-outer")[0],
	            "window-buffer-inspector": elementRoot.getElementsByClassName("window-buffer-inspector")[0],
	            "buffer-listing": elementRoot.getElementsByClassName("buffer-listing")[0]
	        };
	        this.inspector = new SurfaceInspector(this, w, elementRoot, {
	            splitterKey: 'bufferSplitter',
	            title: 'Buffer Preview',
	            selectionName: null,
	            selectionValues: null,
	            disableSizing: true,
	            transparentCanvas: true,
	            autoFit: true
	        });
	        this.inspector.currentBuffer = null;
	        this.inspector.currentVersion = null;
	        this.inspector.querySize = function () {
	            var gl = this.gl;
	            if (!this.currentBuffer || !this.currentVersion) {
	                return null;
	            }
	            return [256, 256]; // ?
	        };
	        this.inspector.setupPreview = function () {
	            var self = this;
	            if (this.previewer) {
	                return;
	            }

	            this.previewer = new BufferPreview(this.canvas);
	            this.gl = this.previewer.gl;

	            this.canvas.width = 256;
	            this.canvas.height = 256;

	            this.previewer.setupDefaultInput();
	        };
	        this.inspector.updatePreview = function () {
	            var gl = this.gl;

	            this.previewer.draw();
	        };
	        this.inspector.setBuffer = function (buffer, version) {
	            var gl = this.gl;

	            var showPreview = shouldShowPreview(gl, buffer, version);
	            if (showPreview) {
	                // Setup UI
	                this.canvas.width = 256;
	                this.canvas.height = 256;
	                this.canvas.style.display = "";
	                this.updatePreview();
	            } else {
	                // Clear everything
	                this.canvas.width = 1;
	                this.canvas.height = 1;
	                this.canvas.style.display = "none";
	            }

	            if (showPreview) {
	                this.options.title = "Buffer Preview: " + buffer.getName();
	            } else {
	                this.options.title = "Buffer Preview: (none)";
	            }

	            this.currentBuffer = buffer;
	            this.currentVersion = version;
	            this.activeOption = 0;
	            this.optionsList.selectedIndex = 0;

	            this.reset();
	            this.layout();

	            if (showPreview) {
	                this.previewer.setBuffer(buffer.previewOptions);
	            }
	        };

	        this.currentBuffer = null;
	    };

	    BufferView.prototype.setInspectorWidth = function (newWidth) {
	        //.window-buffer-outer margin-left: -800px !important; /* -2 * window-buffer-inspector.width */
	        //.window-buffer margin-left: 400px !important; /* window-buffer-inspector.width */
	        //.buffer-listing right: 400px; /* window-buffer-inspector */
	        this.inspectorElements["window-buffer-outer"].style.marginLeft = -2 * newWidth + "px";
	        this.inspectorElements["window-buffer-inspector"].style.width = newWidth + "px";
	        this.inspectorElements["buffer-listing"].style.right = newWidth + "px";
	    };

	    BufferView.prototype.layout = function () {
	        this.inspector.layout();
	    };

	    function appendHistoryLine(gl, el, buffer, call) {
	        traceLine.appendHistoryLine(gl, el, call);

	        // TODO: other custom stuff?
	    }

	    function generateBufferHistory(gl, el, buffer, version) {
	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-secondary";
	        titleDiv.textContent = "History";
	        el.appendChild(titleDiv);

	        var rootEl = document.createElement("div");
	        rootEl.className = "buffer-history";
	        el.appendChild(rootEl);

	        for (var n = 0; n < version.calls.length; n++) {
	            var call = version.calls[n];
	            appendHistoryLine(gl, rootEl, buffer, call);
	        }
	    };

	    function generateGenericArrayBufferContents(gl, el, buffer, version) {
	        var data = buffer.constructVersion(gl, version);

	        var table = document.createElement("table");
	        table.className = "buffer-data";
	        for (var n = 0, len = data.length; n < len; ++n) {
	            var tr = document.createElement("tr");
	            var tdkey = document.createElement("td");
	            tdkey.className = "buffer-data-key";
	            tdkey.textContent = n;
	            tr.appendChild(tdkey);
	            var tdvalue = document.createElement("td");
	            tdvalue.className = "buffer-data-value";
	            tdvalue.textContent = data[n];
	            tr.appendChild(tdvalue);
	            table.appendChild(tr);
	        }
	        el.appendChild(table);
	    };

	    function generateArrayBufferContents(gl, el, buffer, version) {
	        if (!version.structure) {
	            generateGenericArrayBufferContents(gl, el, buffer, version);
	            return;
	        }

	        var data = buffer.constructVersion(gl, version);
	        var datas = version.structure;
	        var stride = datas[0].stride;
	        if (stride == 0) {
	            // Calculate stride from last byte
	            for (var m = 0; m < datas.length; m++) {
	                var byteAdvance = 0;
	                switch (datas[m].type) {
	                    case gl.BYTE:
	                    case gl.UNSIGNED_BYTE:
	                        byteAdvance = 1 * datas[m].size;
	                        break;
	                    case gl.SHORT:
	                    case gl.UNSIGNED_SHORT:
	                        byteAdvance = 2 * datas[m].size;
	                        break;
	                    default:
	                    case gl.FLOAT:
	                        byteAdvance = 4 * datas[m].size;
	                        break;
	                }
	                stride = Math.max(stride, datas[m].offset + byteAdvance);
	            }
	        }

	        var table = document.createElement("table");
	        table.className = "buffer-data";
	        var byteOffset = 0;
	        var itemOffset = 0;
	        while (byteOffset < data.byteLength) {
	            var tr = document.createElement("tr");

	            var tdkey = document.createElement("td");
	            tdkey.className = "buffer-data-key";
	            tdkey.textContent = itemOffset;
	            tr.appendChild(tdkey);

	            var innerOffset = byteOffset;
	            for (var m = 0; m < datas.length; m++) {
	                var byteAdvance = 0;
	                var readView = null;
	                var dataBuffer = data.buffer ? data.buffer : data;
	                switch (datas[m].type) {
	                    case gl.BYTE:
	                        byteAdvance = 1 * datas[m].size;
	                        readView = new Int8Array(dataBuffer, innerOffset, datas[m].size);
	                        break;
	                    case gl.UNSIGNED_BYTE:
	                        byteAdvance = 1 * datas[m].size;
	                        readView = new Uint8Array(dataBuffer, innerOffset, datas[m].size);
	                        break;
	                    case gl.SHORT:
	                        byteAdvance = 2 * datas[m].size;
	                        readView = new Int16Array(dataBuffer, innerOffset, datas[m].size);
	                        break;
	                    case gl.UNSIGNED_SHORT:
	                        byteAdvance = 2 * datas[m].size;
	                        readView = new Uint16Array(dataBuffer, innerOffset, datas[m].size);
	                        break;
	                    default:
	                    case gl.FLOAT:
	                        byteAdvance = 4 * datas[m].size;
	                        readView = new Float32Array(dataBuffer, innerOffset, datas[m].size);
	                        break;
	                }
	                innerOffset += byteAdvance;

	                for (var i = 0; i < datas[m].size; i++) {
	                    var td = document.createElement("td");
	                    td.className = "buffer-data-value";
	                    if (m != datas.length - 1 && i == datas[m].size - 1) {
	                        td.className += " buffer-data-value-end";
	                    }
	                    td.textContent = readView[i];
	                    tr.appendChild(td);
	                }
	            }

	            byteOffset += stride;
	            itemOffset++;
	            table.appendChild(tr);
	        }
	        el.appendChild(table);
	    };

	    function generateBufferDisplay(view, gl, el, buffer, version) {
	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-master";
	        titleDiv.textContent = buffer.getName();
	        switch (buffer.type) {
	            case gl.ARRAY_BUFFER:
	                titleDiv.textContent += " / ARRAY_BUFFER";
	                break;
	            case gl.ELEMENT_ARRAY_BUFFER:
	                titleDiv.textContent += " / ELEMENT_ARRAY_BUFFER";
	                break;
	        }
	        el.appendChild(titleDiv);

	        helpers.appendParameters(gl, el, buffer, ["BUFFER_SIZE", "BUFFER_USAGE"], [null, ["STREAM_DRAW", "STATIC_DRAW", "DYNAMIC_DRAW"]]);
	        helpers.appendbr(el);

	        function updatePreviewSettings() {
	            var options = buffer.previewOptions;

	            // Draw options
	            options.mode = gl.POINTS + modeSelect.selectedIndex;
	            options.positionIndex = attributeSelect.selectedIndex;
	            options.position = version.structure[options.positionIndex];

	            // Element array buffer options
	            if (elementArraySelect.selectedIndex === 0) {
	                // Unindexed
	                options.elementArrayBuffer = null;
	            } else {
	                var option = elementArraySelect.options[elementArraySelect.selectedIndex];
	                var elid = parseInt(option.value, 10);
	                var elbuffer = gl.resources.getResourceById(elid);
	                options.elementArrayBuffer = [elbuffer, elbuffer.currentVersion];
	            }
	            switch (sizeSelect.selectedIndex) {
	                case 0:
	                    options.elementArrayType = gl.UNSIGNED_BYTE;
	                    break;
	                case 1:
	                    options.elementArrayType = gl.UNSIGNED_SHORT;
	                    break;
	            }

	            // Range options
	            if (options.elementArrayBuffer) {
	                options.offset = parseInt(startInput.value, 10);
	            } else {
	                options.first = parseInt(startInput.value, 10);
	            }
	            options.count = parseInt(countInput.value, 10);

	            try {
	                view.inspector.setBuffer(buffer, version);
	            } catch (e) {
	                view.inspector.setBuffer(null, null);
	                console.log("exception while setting buffer preview: " + e);
	            }
	        };

	        var showPreview = shouldShowPreview(gl, buffer, version);
	        if (showPreview) {
	            helpers.appendSeparator(el);

	            var previewDiv = document.createElement("div");
	            previewDiv.className = "info-title-secondary";
	            previewDiv.textContent = "Preview Options";
	            el.appendChild(previewDiv);

	            var previewContainer = document.createElement("div");

	            // Tools for choosing preview options
	            var previewOptions = document.createElement("table");
	            previewOptions.className = "buffer-preview";

	            // Draw settings
	            var drawRow = document.createElement("tr");
	            {
	                var col0 = document.createElement("td");
	                var span0 = document.createElement("span");
	                span0.textContent = "Mode: ";
	                col0.appendChild(span0);
	                drawRow.appendChild(col0);
	            }
	            {
	                var col1 = document.createElement("td");
	                var modeSelect = document.createElement("select");
	                var modeEnums = ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLES", "TRIANGLE_STRIP", "TRIANGLE_FAN"];
	                for (var n = 0; n < modeEnums.length; n++) {
	                    var option = document.createElement("option");
	                    option.textContent = modeEnums[n];
	                    modeSelect.appendChild(option);
	                }
	                modeSelect.onchange = function () {
	                    updatePreviewSettings();
	                };
	                col1.appendChild(modeSelect);
	                drawRow.appendChild(col1);
	            }
	            {
	                var col2 = document.createElement("td");
	                var span1 = document.createElement("span");
	                span1.textContent = "Position Attribute: ";
	                col2.appendChild(span1);
	                drawRow.appendChild(col2);
	            }
	            {
	                var col3 = document.createElement("td");
	                var attributeSelect = document.createElement("select");
	                for (var n = 0; n < version.structure.length; n++) {
	                    var attrInfo = version.structure[n];
	                    var option = document.createElement("option");
	                    var typeString;
	                    switch (attrInfo.type) {
	                        case gl.BYTE:
	                            typeString = "BYTE";
	                            break;
	                        case gl.UNSIGNED_BYTE:
	                            typeString = "UNSIGNED_BYTE";
	                            break;
	                        case gl.SHORT:
	                            typeString = "SHORT";
	                            break;
	                        case gl.UNSIGNED_SHORT:
	                            typeString = "UNSIGNED_SHORT";
	                            break;
	                        default:
	                        case gl.FLOAT:
	                            typeString = "FLOAT";
	                            break;
	                    }
	                    option.textContent = "+" + attrInfo.offset + " / " + attrInfo.size + " * " + typeString;
	                    attributeSelect.appendChild(option);
	                }
	                attributeSelect.onchange = function () {
	                    updatePreviewSettings();
	                };
	                col3.appendChild(attributeSelect);
	                drawRow.appendChild(col3);
	            }
	            previewOptions.appendChild(drawRow);

	            // ELEMENT_ARRAY_BUFFER settings
	            var elementArrayRow = document.createElement("tr");
	            {
	                var col0 = document.createElement("td");
	                var span0 = document.createElement("span");
	                span0.textContent = "Element Array: ";
	                col0.appendChild(span0);
	                elementArrayRow.appendChild(col0);
	            }
	            {
	                var col1 = document.createElement("td");
	                var elementArraySelect = document.createElement("select");
	                var noneOption = document.createElement("option");
	                noneOption.textContent = "[unindexed]";
	                noneOption.value = null;
	                elementArraySelect.appendChild(noneOption);
	                var allBuffers = gl.resources.getBuffers();
	                for (var n = 0; n < allBuffers.length; n++) {
	                    var elBuffer = allBuffers[n];
	                    if (elBuffer.type == gl.ELEMENT_ARRAY_BUFFER) {
	                        var option = document.createElement("option");
	                        option.textContent = elBuffer.getName();
	                        option.value = elBuffer.id;
	                        elementArraySelect.appendChild(option);
	                    }
	                }
	                elementArraySelect.onchange = function () {
	                    updatePreviewSettings();
	                };
	                col1.appendChild(elementArraySelect);
	                elementArrayRow.appendChild(col1);
	            }
	            {
	                var col2 = document.createElement("td");
	                var span1 = document.createElement("span");
	                span1.textContent = "Element Type: ";
	                col2.appendChild(span1);
	                elementArrayRow.appendChild(col2);
	            }
	            {
	                var col3 = document.createElement("td");
	                var sizeSelect = document.createElement("select");
	                var sizeEnums = ["UNSIGNED_BYTE", "UNSIGNED_SHORT"];
	                for (var n = 0; n < sizeEnums.length; n++) {
	                    var option = document.createElement("option");
	                    option.textContent = sizeEnums[n];
	                    sizeSelect.appendChild(option);
	                }
	                sizeSelect.onchange = function () {
	                    updatePreviewSettings();
	                };
	                col3.appendChild(sizeSelect);
	                elementArrayRow.appendChild(col3);
	            }
	            previewOptions.appendChild(elementArrayRow);

	            // Range settings
	            var rangeRow = document.createElement("tr");
	            {
	                var col0 = document.createElement("td");
	                var span0 = document.createElement("span");
	                span0.textContent = "Start: ";
	                col0.appendChild(span0);
	                rangeRow.appendChild(col0);
	            }
	            {
	                var col1 = document.createElement("td");
	                var startInput = document.createElement("input");
	                startInput.type = "text";
	                startInput.value = "0";
	                startInput.onchange = function () {
	                    updatePreviewSettings();
	                };
	                col1.appendChild(startInput);
	                rangeRow.appendChild(col1);
	            }
	            {
	                var col2 = document.createElement("td");
	                var span1 = document.createElement("span");
	                span1.textContent = "Count: ";
	                col2.appendChild(span1);
	                rangeRow.appendChild(col2);
	            }
	            {
	                var col3 = document.createElement("td");
	                var countInput = document.createElement("input");
	                countInput.type = "text";
	                countInput.value = "0";
	                countInput.onchange = function () {
	                    updatePreviewSettings();
	                };
	                col3.appendChild(countInput);
	                rangeRow.appendChild(col3);
	            }
	            previewOptions.appendChild(rangeRow);

	            // Set all defaults based on draw state
	            {
	                var options = buffer.previewOptions;

	                // Draw options
	                modeSelect.selectedIndex = options.mode - gl.POINTS;
	                attributeSelect.selectedIndex = options.positionIndex;

	                // Element array buffer options
	                if (options.elementArrayBuffer) {
	                    // TODO: speed up lookup
	                    for (var n = 0; n < elementArraySelect.options.length; n++) {
	                        var option = elementArraySelect.options[n];
	                        if (option.value == options.elementArrayBuffer[0].id) {
	                            elementArraySelect.selectedIndex = n;
	                            break;
	                        }
	                    }
	                } else {
	                    elementArraySelect.selectedIndex = 0; // unindexed
	                }
	                switch (options.elementArrayType) {
	                    case gl.UNSIGNED_BYTE:
	                        sizeSelect.selectedIndex = 0;
	                        break;
	                    case gl.UNSIGNED_SHORT:
	                        sizeSelect.selectedIndex = 1;
	                        break;
	                }

	                // Range options
	                if (options.elementArrayBuffer) {
	                    startInput.value = options.offset;
	                } else {
	                    startInput.value = options.first;
	                }
	                countInput.value = options.count;
	            }

	            previewContainer.appendChild(previewOptions);

	            el.appendChild(previewContainer);
	            helpers.appendbr(el);

	            helpers.appendSeparator(el);
	        }

	        if (version.structure) {
	            // TODO: some kind of fancy structure editor/overload?
	            var attribs = version.structure;

	            var structDiv = document.createElement("div");
	            structDiv.className = "info-title-secondary";
	            structDiv.textContent = "Structure (from last draw)";
	            el.appendChild(structDiv);

	            var table = document.createElement("table");
	            table.className = "buffer-struct";

	            var tr = document.createElement("tr");
	            var td = document.createElement("th");
	            td.textContent = "offset";
	            tr.appendChild(td);
	            td = document.createElement("th");
	            td.textContent = "size";
	            tr.appendChild(td);
	            td = document.createElement("th");
	            td.textContent = "type";
	            tr.appendChild(td);
	            td = document.createElement("th");
	            td.textContent = "stride";
	            tr.appendChild(td);
	            td = document.createElement("th");
	            td.textContent = "normalized";
	            tr.appendChild(td);
	            table.appendChild(tr);

	            for (var n = 0; n < attribs.length; n++) {
	                var attrib = attribs[n];

	                var tr = document.createElement("tr");

	                td = document.createElement("td");
	                td.textContent = attrib.offset;
	                tr.appendChild(td);
	                td = document.createElement("td");
	                td.textContent = attrib.size;
	                tr.appendChild(td);
	                td = document.createElement("td");
	                switch (attrib.type) {
	                    case gl.BYTE:
	                        td.textContent = "BYTE";
	                        break;
	                    case gl.UNSIGNED_BYTE:
	                        td.textContent = "UNSIGNED_BYTE";
	                        break;
	                    case gl.SHORT:
	                        td.textContent = "SHORT";
	                        break;
	                    case gl.UNSIGNED_SHORT:
	                        td.textContent = "UNSIGNED_SHORT";
	                        break;
	                    default:
	                    case gl.FLOAT:
	                        td.textContent = "FLOAT";
	                        break;
	                }
	                tr.appendChild(td);
	                td = document.createElement("td");
	                td.textContent = attrib.stride;
	                tr.appendChild(td);
	                td = document.createElement("td");
	                td.textContent = attrib.normalized;
	                tr.appendChild(td);

	                table.appendChild(tr);
	            }

	            el.appendChild(table);
	            helpers.appendbr(el);
	        }

	        helpers.appendSeparator(el);

	        generateBufferHistory(gl, el, buffer, version);
	        helpers.appendbr(el);

	        var frame = gl.ui.controller.currentFrame;
	        if (frame) {
	            helpers.appendSeparator(el);
	            traceLine.generateUsageList(gl, el, frame, buffer);
	            helpers.appendbr(el);
	        }

	        helpers.appendSeparator(el);

	        var contentsDiv = document.createElement("div");
	        contentsDiv.className = "info-title-secondary";
	        contentsDiv.textContent = "Contents";
	        el.appendChild(contentsDiv);

	        var contentsContainer = document.createElement("div");

	        function populateContents() {
	            while (contentsContainer.hasChildNodes()) {
	                contentsContainer.removeChild(contentsContainer.firstChild);
	            }
	            var frag = document.createDocumentFragment();
	            switch (buffer.type) {
	                case gl.ARRAY_BUFFER:
	                    generateArrayBufferContents(gl, frag, buffer, version);
	                    break;
	                case gl.ELEMENT_ARRAY_BUFFER:
	                    generateGenericArrayBufferContents(gl, frag, buffer, version);
	                    break;
	            }
	            contentsContainer.appendChild(frag);
	        };

	        if (buffer.parameters[gl.BUFFER_SIZE] > 40000) {
	            // Buffer is really big - delay populating
	            var expandLink = document.createElement("span");
	            expandLink.className = "buffer-data-collapsed";
	            expandLink.textContent = "Show buffer contents";
	            expandLink.onclick = function () {
	                populateContents();
	            };
	            contentsContainer.appendChild(expandLink);
	        } else {
	            // Auto-expand
	            populateContents();
	        }

	        el.appendChild(contentsContainer);

	        helpers.appendbr(el);
	    }

	    BufferView.prototype.setBuffer = function (buffer) {
	        this.currentBuffer = buffer;

	        var node = this.elements.listing;
	        while (node.hasChildNodes()) {
	            node.removeChild(node.firstChild);
	        }
	        if (buffer) {
	            var version;
	            switch (this.window.activeVersion) {
	                case null:
	                    version = buffer.currentVersion;
	                    break;
	                case "current":
	                    var frame = this.window.controller.currentFrame;
	                    if (frame) {
	                        version = frame.findResourceVersion(buffer);
	                    }
	                    version = version || buffer.currentVersion; // Fallback to live
	                    break;
	            }

	            // Setup user preview options if not defined
	            var lastDrawState = version.lastDrawState;
	            if (!buffer.previewOptions && lastDrawState) {
	                var elementArrayBufferArray = null;
	                if (lastDrawState.elementArrayBuffer) {
	                    elementArrayBufferArray = [lastDrawState.elementArrayBuffer, null];
	                    // TODO: pick the right version of the ELEMENT_ARRAY_BUFFER
	                    elementArrayBufferArray[1] = elementArrayBufferArray[0].currentVersion;
	                }

	                // TODO: pick the right position attribute
	                var positionIndex = 0;
	                var positionAttr = version.structure[positionIndex];

	                var drawState = {
	                    mode: lastDrawState.mode,
	                    arrayBuffer: [buffer, version],
	                    positionIndex: positionIndex,
	                    position: positionAttr,
	                    elementArrayBuffer: elementArrayBufferArray,
	                    elementArrayType: lastDrawState.elementArrayBufferType,
	                    first: lastDrawState.first,
	                    offset: lastDrawState.offset,
	                    count: lastDrawState.count
	                };

	                buffer.previewOptions = drawState;
	            }

	            try {
	                this.inspector.setBuffer(buffer, version);
	            } catch (e) {
	                this.inspector.setBuffer(null, null);
	                console.log("exception while setting up buffer preview: " + e);
	            }

	            generateBufferDisplay(this, this.window.context, this.elements.listing, buffer, version);
	        } else {
	            this.inspector.setBuffer(null, null);
	        }

	        this.elements.listing.scrollTop = 0;
	    };

	    return BufferView;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16), __webpack_require__(31), __webpack_require__(33), __webpack_require__(59)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource, Tab, LeftListing, ProgramView) {

	    var ProgramsTab = function ProgramsTab(w) {
	        var self = this;
	        this.el.appendChild(Tab.genericLeftRightView());

	        this.listing = new LeftListing(w, this.el, "program", function (el, program) {
	            var gl = w.context;

	            if (program.status == Resource.DEAD) {
	                el.className += " program-item-deleted";
	            }

	            var number = document.createElement("div");
	            number.className = "program-item-number";
	            number.textContent = program.getName();
	            el.appendChild(number);

	            var vsrow = document.createElement("div");
	            vsrow.className = "program-item-row";
	            el.appendChild(vsrow);
	            var fsrow = document.createElement("div");
	            fsrow.className = "program-item-row";
	            el.appendChild(fsrow);

	            function updateShaderReferences() {
	                var vs = program.getVertexShader(gl);
	                var fs = program.getFragmentShader(gl);
	                vsrow.textContent = "VS: " + (vs ? "Shader " + vs.id : "[none]");
	                fsrow.textContent = "FS: " + (fs ? "Shader " + fs.id : "[none]");
	            }
	            updateShaderReferences();

	            program.modified.addListener(this, function (program) {
	                updateShaderReferences();
	                if (self.programView.currentProgram == program) {
	                    self.programView.setProgram(program);
	                }
	            });
	            program.deleted.addListener(this, function (program) {
	                el.className += " program-item-deleted";
	            });
	        });
	        this.programView = new ProgramView(w, this.el);

	        this.listing.valueSelected.addListener(this, function (program) {
	            this.programView.setProgram(program);
	        });

	        var scrollStates = {};
	        this.lostFocus.addListener(this, function () {
	            scrollStates.listing = this.listing.getScrollState();
	        });
	        this.gainedFocus.addListener(this, function () {
	            this.listing.setScrollState(scrollStates.listing);
	        });

	        // Append programs already present
	        var context = w.context;
	        var programs = context.resources.getPrograms();
	        for (var n = 0; n < programs.length; n++) {
	            var program = programs[n];
	            this.listing.appendValue(program);
	        }

	        // Listen for changes
	        context.resources.resourceRegistered.addListener(this, function (resource) {
	            if (base.typename(resource.target) == "WebGLProgram") {
	                this.listing.appendValue(resource);
	            }
	        });

	        this.refresh = function () {
	            this.programView.setProgram(this.programView.currentProgram);
	        };
	    };

	    return ProgramsTab;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(60), __webpack_require__(40), __webpack_require__(41), __webpack_require__(39)], __WEBPACK_AMD_DEFINE_RESULT__ = function (dummy, helpers, SurfaceInspector, traceLine) {

	    var ProgramView = function ProgramView(w, elementRoot) {
	        var self = this;
	        this.window = w;
	        this.elements = {
	            view: elementRoot.getElementsByClassName("window-right-inner")[0]
	        };

	        this.currentProgram = null;
	    };

	    function prettyPrintSource(el, source, highlightLines) {
	        var div = document.createElement("div");
	        div.textContent = source;
	        el.appendChild(div);

	        var firstLine = 1;
	        var firstChar = source.search(/./);
	        if (firstChar > 0) {
	            firstLine += firstChar;
	        }

	        SyntaxHighlighter.highlight({
	            brush: 'glsl',
	            'first-line': firstLine,
	            highlight: highlightLines,
	            toolbar: false
	        }, div);
	    };

	    function generateShaderDisplay(gl, el, shader) {
	        var shaderType = shader.type == gl.VERTEX_SHADER ? "Vertex" : "Fragment";

	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-secondary";
	        titleDiv.textContent = shaderType + " " + shader.getName();
	        el.appendChild(titleDiv);

	        helpers.appendParameters(gl, el, shader, ["COMPILE_STATUS", "DELETE_STATUS"]);

	        var highlightLines = [];
	        if (shader.infoLog && shader.infoLog.length > 0) {
	            var errorLines = shader.infoLog.match(/^ERROR: [0-9]+:[0-9]+: /gm);
	            if (errorLines) {
	                for (var n = 0; n < errorLines.length; n++) {
	                    // expecting: 'ERROR: 0:LINE: '
	                    var errorLine = errorLines[n];
	                    errorLine = parseInt(errorLine.match(/ERROR: [0-9]+:([0-9]+): /)[1]);
	                    highlightLines.push(errorLine);
	                }
	            }
	        }

	        var sourceDiv = document.createElement("div");
	        sourceDiv.className = "shader-info-source";
	        if (shader.source) {
	            prettyPrintSource(sourceDiv, shader.source, highlightLines);
	        } else {
	            sourceDiv.textContent = "[no source uploaded]";
	        }
	        el.appendChild(sourceDiv);

	        if (shader.infoLog && shader.infoLog.length > 0) {
	            var infoDiv = document.createElement("div");
	            infoDiv.className = "program-info-log";
	            shader.infoLog.split("\n").forEach(function (line) {
	                infoDiv.appendChild(document.createTextNode(line));
	                infoDiv.appendChild(document.createElement("br"));
	            });
	            el.appendChild(infoDiv);
	            helpers.appendbr(el);
	        }
	    };

	    function appendTable(context, gl, el, program, name, tableData, valueCallback) {
	        // [ordinal, name, size, type, optional value]
	        var table = document.createElement("table");
	        table.className = "program-attribs";

	        var tr = document.createElement("tr");
	        var td = document.createElement("th");
	        td.textContent = "idx";
	        tr.appendChild(td);
	        td = document.createElement("th");
	        td.className = "program-attribs-name";
	        td.textContent = name + " name";
	        tr.appendChild(td);
	        td = document.createElement("th");
	        td.textContent = "size";
	        tr.appendChild(td);
	        td = document.createElement("th");
	        td.className = "program-attribs-type";
	        td.textContent = "type";
	        tr.appendChild(td);
	        if (valueCallback) {
	            td = document.createElement("th");
	            td.className = "program-attribs-value";
	            td.textContent = "value";
	            tr.appendChild(td);
	        }
	        table.appendChild(tr);

	        for (var n = 0; n < tableData.length; n++) {
	            var row = tableData[n];

	            var tr = document.createElement("tr");
	            td = document.createElement("td");
	            td.textContent = row[0];
	            tr.appendChild(td);
	            td = document.createElement("td");
	            td.textContent = row[1];
	            tr.appendChild(td);
	            td = document.createElement("td");
	            td.textContent = row[2];
	            tr.appendChild(td);
	            td = document.createElement("td");
	            switch (row[3]) {
	                case gl.FLOAT:
	                    td.textContent = "FLOAT";
	                    break;
	                case gl.FLOAT_VEC2:
	                    td.textContent = "FLOAT_VEC2";
	                    break;
	                case gl.FLOAT_VEC3:
	                    td.textContent = "FLOAT_VEC3";
	                    break;
	                case gl.FLOAT_VEC4:
	                    td.textContent = "FLOAT_VEC4";
	                    break;
	                case gl.INT:
	                    td.textContent = "INT";
	                    break;
	                case gl.INT_VEC2:
	                    td.textContent = "INT_VEC2";
	                    break;
	                case gl.INT_VEC3:
	                    td.textContent = "INT_VEC3";
	                    break;
	                case gl.INT_VEC4:
	                    td.textContent = "INT_VEC4";
	                    break;
	                case gl.BOOL:
	                    td.textContent = "BOOL";
	                    break;
	                case gl.BOOL_VEC2:
	                    td.textContent = "BOOL_VEC2";
	                    break;
	                case gl.BOOL_VEC3:
	                    td.textContent = "BOOL_VEC3";
	                    break;
	                case gl.BOOL_VEC4:
	                    td.textContent = "BOOL_VEC4";
	                    break;
	                case gl.FLOAT_MAT2:
	                    td.textContent = "FLOAT_MAT2";
	                    break;
	                case gl.FLOAT_MAT3:
	                    td.textContent = "FLOAT_MAT3";
	                    break;
	                case gl.FLOAT_MAT4:
	                    td.textContent = "FLOAT_MAT4";
	                    break;
	                case gl.SAMPLER_2D:
	                    td.textContent = "SAMPLER_2D";
	                    break;
	                case gl.SAMPLER_CUBE:
	                    td.textContent = "SAMPLER_CUBE";
	                    break;
	            }
	            tr.appendChild(td);

	            if (valueCallback) {
	                td = document.createElement("td");
	                valueCallback(n, td);
	                tr.appendChild(td);
	            }

	            table.appendChild(tr);
	        }

	        el.appendChild(table);
	    };

	    function appendUniformInfos(gl, el, program, isCurrent) {
	        var tableData = [];
	        var uniformInfos = program.getUniformInfos(gl, program.target);
	        for (var n = 0; n < uniformInfos.length; n++) {
	            var uniformInfo = uniformInfos[n];
	            tableData.push([uniformInfo.index, uniformInfo.name, uniformInfo.size, uniformInfo.type]);
	        }
	        appendTable(gl, gl, el, program, "uniform", tableData, null);
	    };

	    function appendAttributeInfos(gl, el, program) {
	        var tableData = [];
	        var attribInfos = program.getAttribInfos(gl, program.target);
	        for (var n = 0; n < attribInfos.length; n++) {
	            var attribInfo = attribInfos[n];
	            tableData.push([attribInfo.index, attribInfo.name, attribInfo.size, attribInfo.type]);
	        }
	        appendTable(gl, gl, el, program, "attribute", tableData, null);
	    };

	    function generateProgramDisplay(gl, el, program, version, isCurrent) {
	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-master";
	        titleDiv.textContent = program.getName();
	        el.appendChild(titleDiv);

	        helpers.appendParameters(gl, el, program, ["LINK_STATUS", "VALIDATE_STATUS", "DELETE_STATUS", "ACTIVE_UNIFORMS", "ACTIVE_ATTRIBUTES"]);
	        helpers.appendbr(el);

	        if (program.parameters[gl.ACTIVE_UNIFORMS] > 0) {
	            appendUniformInfos(gl, el, program, isCurrent);
	            helpers.appendbr(el);
	        }
	        if (program.parameters[gl.ACTIVE_ATTRIBUTES] > 0) {
	            appendAttributeInfos(gl, el, program);
	            helpers.appendbr(el);
	        }

	        if (program.infoLog && program.infoLog.length > 0) {
	            var infoDiv = document.createElement("div");
	            infoDiv.className = "program-info-log";
	            program.infoLog.split("\n").forEach(function (line) {
	                infoDiv.appendChild(document.createTextNode(line));
	                infoDiv.appendChild(document.createElement("br"));
	            });
	            el.appendChild(infoDiv);
	            helpers.appendbr(el);
	        }

	        var frame = gl.ui.controller.currentFrame;
	        if (frame) {
	            helpers.appendSeparator(el);
	            traceLine.generateUsageList(gl, el, frame, program);
	            helpers.appendbr(el);
	        }

	        var vertexShader = program.getVertexShader(gl);
	        var fragmentShader = program.getFragmentShader(gl);
	        if (vertexShader) {
	            var vertexShaderDiv = document.createElement("div");
	            helpers.appendSeparator(el);
	            generateShaderDisplay(gl, el, vertexShader);
	        }
	        if (fragmentShader) {
	            var fragmentShaderDiv = document.createElement("div");
	            helpers.appendSeparator(el);
	            generateShaderDisplay(gl, el, fragmentShader);
	        }
	    };

	    ProgramView.prototype.setProgram = function (program) {
	        this.currentProgram = program;

	        var node = this.elements.view;
	        while (node.hasChildNodes()) {
	            node.removeChild(node.firstChild);
	        }
	        if (program) {

	            var version;
	            var isCurrent = false;
	            switch (this.window.activeVersion) {
	                case null:
	                    version = program.currentVersion;
	                    break;
	                case "current":
	                    var frame = this.window.controller.currentFrame;
	                    if (frame) {
	                        version = frame.findResourceVersion(program);
	                        isCurrent = true;
	                    }
	                    version = version || program.currentVersion; // Fallback to live
	                    break;
	            }

	            generateProgramDisplay(this.window.context, this.elements.view, program, version, isCurrent);
	        }

	        this.elements.view.scrollTop = 0;
	    };

	    return ProgramView;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	/*** IMPORTS FROM imports-loader ***/
	var SyntaxHighlighter = __webpack_require__(61);

	/**
	 * SyntaxHighlighter
	 * http://alexgorbatchev.com/SyntaxHighlighter
	 *
	 * SyntaxHighlighter is donationware. If you are using it, please donate.
	 * http://alexgorbatchev.com/SyntaxHighlighter/donate.html
	 *
	 * @version
	 * 3.0.83 (July 02 2010)
	 * 
	 * @copyright
	 * Copyright (C) 2004-2010 Alex Gorbatchev.
	 *
	 * @license
	 * Dual licensed under the MIT and GPL licenses.
	 */
	;(function () {
		// CommonJS
		if (typeof SyntaxHighlighter == 'undefined' && "function" != 'undefined') {
			SyntaxHighlighter = __webpack_require__(61).SyntaxHighlighter;
		}

		function Brush() {
			// Copyright 2006 Shin, YoungJin

			var datatypes = 'void float int bool vec2 vec3 vec4 bvec2 bvec3 bvec4 ivec2 ivec3 ivec4 mat2 mat3 mat4 sampler2D samplerCube ';

			var keywords = 'precision highp mediump lowp ' + 'in out inout ' + 'attribute const break continue do else for if discard return uniform varying struct void while ' + 'gl_Position gl_PointSize ' + 'gl_FragCoord gl_FrontFacing gl_FragColor gl_FragData gl_PointCoord ' + 'gl_DepthRange ' + 'gl_MaxVertexAttribs gl_MaxVertexUniformVectors gl_MaxVaryingVectors gl_MaxVertexTextureImageUnits gl_MaxCombinedTextureImageUnits gl_MaxTextureImageUnits gl_MaxFragmentUniformVectors gl_MaxDrawBuffers ';

			var functions = 'radians degrees sin cos tan asin acos atan ' + 'pow exp log exp2 log2 sqrt inversesqrt ' + 'abs sign floor ceil fract mod min max clamp mix step smoothstep ' + 'length distance dot cross normalize faceforward reflect refract ' + 'matrixCompMult ' + 'lessThan lessThanEqual greaterThan greaterThanEqual equal notEqual any all not ' + 'texture2D texture2DProj texture2DLod texture2DProjLod textureCube textureCubeLod ';

			this.regexList = [{ regex: SyntaxHighlighter.regexLib.singleLineCComments, css: 'comments' }, // one line comments
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments, css: 'comments' }, // multiline comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString, css: 'string' }, // strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString, css: 'string' }, // strings
			{ regex: /^ *#.*/gm, css: 'preprocessor' }, { regex: new RegExp(this.getKeywords(datatypes), 'gm'), css: 'color1 bold' }, { regex: new RegExp(this.getKeywords(functions), 'gm'), css: 'functions bold' }, { regex: new RegExp(this.getKeywords(keywords), 'gm'), css: 'keyword bold' }];
		};

		Brush.prototype = new SyntaxHighlighter.Highlighter();
		Brush.aliases = ['glsl', 'vs', 'fs'];

		SyntaxHighlighter.brushes.GLSL = Brush;

		// CommonJS
		 true ? exports.Brush = Brush : null;
	})();

/***/ }),
/* 61 */
/***/ (function(module, exports) {

	"use strict";

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	/**
	 * SyntaxHighlighter
	 * http://alexgorbatchev.com/SyntaxHighlighter
	 *
	 * SyntaxHighlighter is donationware. If you are using it, please donate.
	 * http://alexgorbatchev.com/SyntaxHighlighter/donate.html
	 *
	 * @version
	 * 3.0.83 (Tue, 04 Feb 2014 22:06:22 GMT)
	 *
	 * @copyright
	 * Copyright (C) 2004-2013 Alex Gorbatchev.
	 *
	 * @license
	 * Dual licensed under the MIT and GPL licenses.
	 */
	/*!
	 * XRegExp v2.0.0
	 * (c) 2007-2012 Steven Levithan <http://xregexp.com/>
	 * MIT License
	 */

	/**
	 * XRegExp provides augmented, extensible JavaScript regular expressions. You get new syntax,
	 * flags, and methods beyond what browsers support natively. XRegExp is also a regex utility belt
	 * with tools to make your client-side grepping simpler and more powerful, while freeing you from
	 * worrying about pesky cross-browser inconsistencies and the dubious `lastIndex` property. See
	 * XRegExp's documentation (http://xregexp.com/) for more details.
	 * @module xregexp
	 * @requires N/A
	 */
	var XRegExp;

	// Avoid running twice; that would reset tokens and could break references to native globals
	XRegExp = XRegExp || function (undef) {
	  "use strict";

	  /*--------------------------------------
	   *  Private variables
	   *------------------------------------*/

	  var _self,
	      addToken,
	      add,


	  // Optional features; can be installed and uninstalled
	  features = {
	    natives: false,
	    extensibility: false
	  },


	  // Store native methods to use and restore ("native" is an ES3 reserved keyword)
	  nativ = {
	    exec: RegExp.prototype.exec,
	    test: RegExp.prototype.test,
	    match: String.prototype.match,
	    replace: String.prototype.replace,
	    split: String.prototype.split
	  },


	  // Storage for fixed/extended native methods
	  fixed = {},


	  // Storage for cached regexes
	  cache = {},


	  // Storage for addon tokens
	  tokens = [],


	  // Token scopes
	  defaultScope = "default",
	      classScope = "class",


	  // Regexes that match native regex syntax
	  nativeTokens = {
	    // Any native multicharacter token in default scope (includes octals, excludes character classes)
	    "default": /^(?:\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S])|\(\?[:=!]|[?*+]\?|{\d+(?:,\d*)?}\??)/,
	    // Any native multicharacter token in character class scope (includes octals)
	    "class": /^(?:\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S]))/
	  },


	  // Any backreference in replacement strings
	  replacementToken = /\$(?:{([\w$]+)}|(\d\d?|[\s\S]))/g,


	  // Any character with a later instance in the string
	  duplicateFlags = /([\s\S])(?=[\s\S]*\1)/g,


	  // Any greedy/lazy quantifier
	  quantifier = /^(?:[?*+]|{\d+(?:,\d*)?})\??/,


	  // Check for correct `exec` handling of nonparticipating capturing groups
	  compliantExecNpcg = nativ.exec.call(/()??/, "")[1] === undef,


	  // Check for flag y support (Firefox 3+)
	  hasNativeY = RegExp.prototype.sticky !== undef,


	  // Used to kill infinite recursion during XRegExp construction
	  isInsideConstructor = false,


	  // Storage for known flags, including addon flags
	  registeredFlags = "gim" + (hasNativeY ? "y" : "");

	  /*--------------------------------------
	   *  Private helper functions
	   *------------------------------------*/

	  /**
	   * Attaches XRegExp.prototype properties and named capture supporting data to a regex object.
	   * @private
	   * @param {RegExp} regex Regex to augment.
	   * @param {Array} captureNames Array with capture names, or null.
	   * @param {Boolean} [isNative] Whether the regex was created by `RegExp` rather than `XRegExp`.
	   * @returns {RegExp} Augmented regex.
	   */
	  function augment(regex, captureNames, isNative) {
	    var p;
	    // Can't auto-inherit these since the XRegExp constructor returns a nonprimitive value
	    for (p in _self.prototype) {
	      if (_self.prototype.hasOwnProperty(p)) {
	        regex[p] = _self.prototype[p];
	      }
	    }
	    regex.xregexp = { captureNames: captureNames, isNative: !!isNative };
	    return regex;
	  }

	  /**
	   * Returns native `RegExp` flags used by a regex object.
	   * @private
	   * @param {RegExp} regex Regex to check.
	   * @returns {String} Native flags in use.
	   */
	  function getNativeFlags(regex) {
	    //return nativ.exec.call(/\/([a-z]*)$/i, String(regex))[1];
	    return (regex.global ? "g" : "") + (regex.ignoreCase ? "i" : "") + (regex.multiline ? "m" : "") + (regex.extended ? "x" : "") + ( // Proposed for ES6, included in AS3
	    regex.sticky ? "y" : ""); // Proposed for ES6, included in Firefox 3+
	  }

	  /**
	   * Copies a regex object while preserving special properties for named capture and augmenting with
	   * `XRegExp.prototype` methods. The copy has a fresh `lastIndex` property (set to zero). Allows
	   * adding and removing flags while copying the regex.
	   * @private
	   * @param {RegExp} regex Regex to copy.
	   * @param {String} [addFlags] Flags to be added while copying the regex.
	   * @param {String} [removeFlags] Flags to be removed while copying the regex.
	   * @returns {RegExp} Copy of the provided regex, possibly with modified flags.
	   */
	  function copy(regex, addFlags, removeFlags) {
	    if (!_self.isRegExp(regex)) {
	      throw new TypeError("type RegExp expected");
	    }
	    var flags = nativ.replace.call(getNativeFlags(regex) + (addFlags || ""), duplicateFlags, "");
	    if (removeFlags) {
	      // Would need to escape `removeFlags` if this was public
	      flags = nativ.replace.call(flags, new RegExp("[" + removeFlags + "]+", "g"), "");
	    }
	    if (regex.xregexp && !regex.xregexp.isNative) {
	      // Compiling the current (rather than precompilation) source preserves the effects of nonnative source flags
	      regex = augment(_self(regex.source, flags), regex.xregexp.captureNames ? regex.xregexp.captureNames.slice(0) : null);
	    } else {
	      // Augment with `XRegExp.prototype` methods, but use native `RegExp` (avoid searching for special tokens)
	      regex = augment(new RegExp(regex.source, flags), null, true);
	    }
	    return regex;
	  }

	  /*
	   * Returns the last index at which a given value can be found in an array, or `-1` if it's not
	   * present. The array is searched backwards.
	   * @private
	   * @param {Array} array Array to search.
	   * @param {*} value Value to locate in the array.
	   * @returns {Number} Last zero-based index at which the item is found, or -1.
	   */
	  function lastIndexOf(array, value) {
	    var i = array.length;
	    if (Array.prototype.lastIndexOf) {
	      return array.lastIndexOf(value); // Use the native method if available
	    }
	    while (i--) {
	      if (array[i] === value) {
	        return i;
	      }
	    }
	    return -1;
	  }

	  /**
	   * Determines whether an object is of the specified type.
	   * @private
	   * @param {*} value Object to check.
	   * @param {String} type Type to check for, in lowercase.
	   * @returns {Boolean} Whether the object matches the type.
	   */
	  function isType(value, type) {
	    return Object.prototype.toString.call(value).toLowerCase() === "[object " + type + "]";
	  }

	  /**
	   * Prepares an options object from the given value.
	   * @private
	   * @param {String|Object} value Value to convert to an options object.
	   * @returns {Object} Options object.
	   */
	  function prepareOptions(value) {
	    value = value || {};
	    if (value === "all" || value.all) {
	      value = { natives: true, extensibility: true };
	    } else if (isType(value, "string")) {
	      value = _self.forEach(value, /[^\s,]+/, function (m) {
	        this[m] = true;
	      }, {});
	    }
	    return value;
	  }

	  /**
	   * Runs built-in/custom tokens in reverse insertion order, until a match is found.
	   * @private
	   * @param {String} pattern Original pattern from which an XRegExp object is being built.
	   * @param {Number} pos Position to search for tokens within `pattern`.
	   * @param {Number} scope Current regex scope.
	   * @param {Object} context Context object assigned to token handler functions.
	   * @returns {Object} Object with properties `output` (the substitution string returned by the
	   *   successful token handler) and `match` (the token's match array), or null.
	   */
	  function runTokens(pattern, pos, scope, context) {
	    var i = tokens.length,
	        result = null,
	        match,
	        t;
	    // Protect against constructing XRegExps within token handler and trigger functions
	    isInsideConstructor = true;
	    // Must reset `isInsideConstructor`, even if a `trigger` or `handler` throws
	    try {
	      while (i--) {
	        // Run in reverse order
	        t = tokens[i];
	        if ((t.scope === "all" || t.scope === scope) && (!t.trigger || t.trigger.call(context))) {
	          t.pattern.lastIndex = pos;
	          match = fixed.exec.call(t.pattern, pattern); // Fixed `exec` here allows use of named backreferences, etc.
	          if (match && match.index === pos) {
	            result = {
	              output: t.handler.call(context, match, scope),
	              match: match
	            };
	            break;
	          }
	        }
	      }
	    } catch (err) {
	      throw err;
	    } finally {
	      isInsideConstructor = false;
	    }
	    return result;
	  }

	  /**
	   * Enables or disables XRegExp syntax and flag extensibility.
	   * @private
	   * @param {Boolean} on `true` to enable; `false` to disable.
	   */
	  function setExtensibility(on) {
	    _self.addToken = addToken[on ? "on" : "off"];
	    features.extensibility = on;
	  }

	  /**
	   * Enables or disables native method overrides.
	   * @private
	   * @param {Boolean} on `true` to enable; `false` to disable.
	   */
	  function setNatives(on) {
	    RegExp.prototype.exec = (on ? fixed : nativ).exec;
	    RegExp.prototype.test = (on ? fixed : nativ).test;
	    String.prototype.match = (on ? fixed : nativ).match;
	    String.prototype.replace = (on ? fixed : nativ).replace;
	    String.prototype.split = (on ? fixed : nativ).split;
	    features.natives = on;
	  }

	  /*--------------------------------------
	   *  Constructor
	   *------------------------------------*/

	  /**
	   * Creates an extended regular expression object for matching text with a pattern. Differs from a
	   * native regular expression in that additional syntax and flags are supported. The returned object
	   * is in fact a native `RegExp` and works with all native methods.
	   * @class XRegExp
	   * @constructor
	   * @param {String|RegExp} pattern Regex pattern string, or an existing `RegExp` object to copy.
	   * @param {String} [flags] Any combination of flags:
	   *   <li>`g` - global
	   *   <li>`i` - ignore case
	   *   <li>`m` - multiline anchors
	   *   <li>`n` - explicit capture
	   *   <li>`s` - dot matches all (aka singleline)
	   *   <li>`x` - free-spacing and line comments (aka extended)
	   *   <li>`y` - sticky (Firefox 3+ only)
	   *   Flags cannot be provided when constructing one `RegExp` from another.
	   * @returns {RegExp} Extended regular expression object.
	   * @example
	   *
	   * // With named capture and flag x
	   * date = XRegExp('(?<year>  [0-9]{4}) -?  # year  \n\
	   *                 (?<month> [0-9]{2}) -?  # month \n\
	   *                 (?<day>   [0-9]{2})     # day   ', 'x');
	   *
	   * // Passing a regex object to copy it. The copy maintains special properties for named capture,
	   * // is augmented with `XRegExp.prototype` methods, and has a fresh `lastIndex` property (set to
	   * // zero). Native regexes are not recompiled using XRegExp syntax.
	   * XRegExp(/regex/);
	   */
	  _self = function self(pattern, flags) {
	    if (_self.isRegExp(pattern)) {
	      if (flags !== undef) {
	        throw new TypeError("can't supply flags when constructing one RegExp from another");
	      }
	      return copy(pattern);
	    }
	    // Tokens become part of the regex construction process, so protect against infinite recursion
	    // when an XRegExp is constructed within a token handler function
	    if (isInsideConstructor) {
	      throw new Error("can't call the XRegExp constructor within token definition functions");
	    }

	    var output = [],
	        scope = defaultScope,
	        tokenContext = {
	      hasNamedCapture: false,
	      captureNames: [],
	      hasFlag: function hasFlag(flag) {
	        return flags.indexOf(flag) > -1;
	      }
	    },
	        pos = 0,
	        tokenResult,
	        match,
	        chr;
	    pattern = pattern === undef ? "" : String(pattern);
	    flags = flags === undef ? "" : String(flags);

	    if (nativ.match.call(flags, duplicateFlags)) {
	      // Don't use test/exec because they would update lastIndex
	      throw new SyntaxError("invalid duplicate regular expression flag");
	    }
	    // Strip/apply leading mode modifier with any combination of flags except g or y: (?imnsx)
	    pattern = nativ.replace.call(pattern, /^\(\?([\w$]+)\)/, function ($0, $1) {
	      if (nativ.test.call(/[gy]/, $1)) {
	        throw new SyntaxError("can't use flag g or y in mode modifier");
	      }
	      flags = nativ.replace.call(flags + $1, duplicateFlags, "");
	      return "";
	    });
	    _self.forEach(flags, /[\s\S]/, function (m) {
	      if (registeredFlags.indexOf(m[0]) < 0) {
	        throw new SyntaxError("invalid regular expression flag " + m[0]);
	      }
	    });

	    while (pos < pattern.length) {
	      // Check for custom tokens at the current position
	      tokenResult = runTokens(pattern, pos, scope, tokenContext);
	      if (tokenResult) {
	        output.push(tokenResult.output);
	        pos += tokenResult.match[0].length || 1;
	      } else {
	        // Check for native tokens (except character classes) at the current position
	        match = nativ.exec.call(nativeTokens[scope], pattern.slice(pos));
	        if (match) {
	          output.push(match[0]);
	          pos += match[0].length;
	        } else {
	          chr = pattern.charAt(pos);
	          if (chr === "[") {
	            scope = classScope;
	          } else if (chr === "]") {
	            scope = defaultScope;
	          }
	          // Advance position by one character
	          output.push(chr);
	          ++pos;
	        }
	      }
	    }

	    return augment(new RegExp(output.join(""), nativ.replace.call(flags, /[^gimy]+/g, "")), tokenContext.hasNamedCapture ? tokenContext.captureNames : null);
	  };

	  /*--------------------------------------
	   *  Public methods/properties
	   *------------------------------------*/

	  // Installed and uninstalled states for `XRegExp.addToken`
	  addToken = {
	    on: function on(regex, handler, options) {
	      options = options || {};
	      if (regex) {
	        tokens.push({
	          pattern: copy(regex, "g" + (hasNativeY ? "y" : "")),
	          handler: handler,
	          scope: options.scope || defaultScope,
	          trigger: options.trigger || null
	        });
	      }
	      // Providing `customFlags` with null `regex` and `handler` allows adding flags that do
	      // nothing, but don't throw an error
	      if (options.customFlags) {
	        registeredFlags = nativ.replace.call(registeredFlags + options.customFlags, duplicateFlags, "");
	      }
	    },
	    off: function off() {
	      throw new Error("extensibility must be installed before using addToken");
	    }
	  };

	  /**
	   * Extends or changes XRegExp syntax and allows custom flags. This is used internally and can be
	   * used to create XRegExp addons. `XRegExp.install('extensibility')` must be run before calling
	   * this function, or an error is thrown. If more than one token can match the same string, the last
	   * added wins.
	   * @memberOf XRegExp
	   * @param {RegExp} regex Regex object that matches the new token.
	   * @param {Function} handler Function that returns a new pattern string (using native regex syntax)
	   *   to replace the matched token within all future XRegExp regexes. Has access to persistent
	   *   properties of the regex being built, through `this`. Invoked with two arguments:
	   *   <li>The match array, with named backreference properties.
	   *   <li>The regex scope where the match was found.
	   * @param {Object} [options] Options object with optional properties:
	   *   <li>`scope` {String} Scopes where the token applies: 'default', 'class', or 'all'.
	   *   <li>`trigger` {Function} Function that returns `true` when the token should be applied; e.g.,
	   *     if a flag is set. If `false` is returned, the matched string can be matched by other tokens.
	   *     Has access to persistent properties of the regex being built, through `this` (including
	   *     function `this.hasFlag`).
	   *   <li>`customFlags` {String} Nonnative flags used by the token's handler or trigger functions.
	   *     Prevents XRegExp from throwing an invalid flag error when the specified flags are used.
	   * @example
	   *
	   * // Basic usage: Adds \a for ALERT character
	   * XRegExp.addToken(
	   *   /\\a/,
	   *   function () {return '\\x07';},
	   *   {scope: 'all'}
	   * );
	   * XRegExp('\\a[\\a-\\n]+').test('\x07\n\x07'); // -> true
	   */
	  _self.addToken = addToken.off;

	  /**
	   * Caches and returns the result of calling `XRegExp(pattern, flags)`. On any subsequent call with
	   * the same pattern and flag combination, the cached copy is returned.
	   * @memberOf XRegExp
	   * @param {String} pattern Regex pattern string.
	   * @param {String} [flags] Any combination of XRegExp flags.
	   * @returns {RegExp} Cached XRegExp object.
	   * @example
	   *
	   * while (match = XRegExp.cache('.', 'gs').exec(str)) {
	   *   // The regex is compiled once only
	   * }
	   */
	  _self.cache = function (pattern, flags) {
	    var key = pattern + "/" + (flags || "");
	    return cache[key] || (cache[key] = _self(pattern, flags));
	  };

	  /**
	   * Escapes any regular expression metacharacters, for use when matching literal strings. The result
	   * can safely be used at any point within a regex that uses any flags.
	   * @memberOf XRegExp
	   * @param {String} str String to escape.
	   * @returns {String} String with regex metacharacters escaped.
	   * @example
	   *
	   * XRegExp.escape('Escaped? <.>');
	   * // -> 'Escaped\?\ <\.>'
	   */
	  _self.escape = function (str) {
	    return nativ.replace.call(str, /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	  };

	  /**
	   * Executes a regex search in a specified string. Returns a match array or `null`. If the provided
	   * regex uses named capture, named backreference properties are included on the match array.
	   * Optional `pos` and `sticky` arguments specify the search start position, and whether the match
	   * must start at the specified position only. The `lastIndex` property of the provided regex is not
	   * used, but is updated for compatibility. Also fixes browser bugs compared to the native
	   * `RegExp.prototype.exec` and can be used reliably cross-browser.
	   * @memberOf XRegExp
	   * @param {String} str String to search.
	   * @param {RegExp} regex Regex to search with.
	   * @param {Number} [pos=0] Zero-based index at which to start the search.
	   * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
	   *   only. The string `'sticky'` is accepted as an alternative to `true`.
	   * @returns {Array} Match array with named backreference properties, or null.
	   * @example
	   *
	   * // Basic use, with named backreference
	   * var match = XRegExp.exec('U+2620', XRegExp('U\\+(?<hex>[0-9A-F]{4})'));
	   * match.hex; // -> '2620'
	   *
	   * // With pos and sticky, in a loop
	   * var pos = 2, result = [], match;
	   * while (match = XRegExp.exec('<1><2><3><4>5<6>', /<(\d)>/, pos, 'sticky')) {
	   *   result.push(match[1]);
	   *   pos = match.index + match[0].length;
	   * }
	   * // result -> ['2', '3', '4']
	   */
	  _self.exec = function (str, regex, pos, sticky) {
	    var r2 = copy(regex, "g" + (sticky && hasNativeY ? "y" : ""), sticky === false ? "y" : ""),
	        match;
	    r2.lastIndex = pos = pos || 0;
	    match = fixed.exec.call(r2, str); // Fixed `exec` required for `lastIndex` fix, etc.
	    if (sticky && match && match.index !== pos) {
	      match = null;
	    }
	    if (regex.global) {
	      regex.lastIndex = match ? r2.lastIndex : 0;
	    }
	    return match;
	  };

	  /**
	   * Executes a provided function once per regex match.
	   * @memberOf XRegExp
	   * @param {String} str String to search.
	   * @param {RegExp} regex Regex to search with.
	   * @param {Function} callback Function to execute for each match. Invoked with four arguments:
	   *   <li>The match array, with named backreference properties.
	   *   <li>The zero-based match index.
	   *   <li>The string being traversed.
	   *   <li>The regex object being used to traverse the string.
	   * @param {*} [context] Object to use as `this` when executing `callback`.
	   * @returns {*} Provided `context` object.
	   * @example
	   *
	   * // Extracts every other digit from a string
	   * XRegExp.forEach('1a2345', /\d/, function (match, i) {
	   *   if (i % 2) this.push(+match[0]);
	   * }, []);
	   * // -> [2, 4]
	   */
	  _self.forEach = function (str, regex, callback, context) {
	    var pos = 0,
	        i = -1,
	        match;
	    while (match = _self.exec(str, regex, pos)) {
	      callback.call(context, match, ++i, str, regex);
	      pos = match.index + (match[0].length || 1);
	    }
	    return context;
	  };

	  /**
	   * Copies a regex object and adds flag `g`. The copy maintains special properties for named
	   * capture, is augmented with `XRegExp.prototype` methods, and has a fresh `lastIndex` property
	   * (set to zero). Native regexes are not recompiled using XRegExp syntax.
	   * @memberOf XRegExp
	   * @param {RegExp} regex Regex to globalize.
	   * @returns {RegExp} Copy of the provided regex with flag `g` added.
	   * @example
	   *
	   * var globalCopy = XRegExp.globalize(/regex/);
	   * globalCopy.global; // -> true
	   */
	  _self.globalize = function (regex) {
	    return copy(regex, "g");
	  };

	  /**
	   * Installs optional features according to the specified options.
	   * @memberOf XRegExp
	   * @param {Object|String} options Options object or string.
	   * @example
	   *
	   * // With an options object
	   * XRegExp.install({
	   *   // Overrides native regex methods with fixed/extended versions that support named
	   *   // backreferences and fix numerous cross-browser bugs
	   *   natives: true,
	   *
	   *   // Enables extensibility of XRegExp syntax and flags
	   *   extensibility: true
	   * });
	   *
	   * // With an options string
	   * XRegExp.install('natives extensibility');
	   *
	   * // Using a shortcut to install all optional features
	   * XRegExp.install('all');
	   */
	  _self.install = function (options) {
	    options = prepareOptions(options);
	    if (!features.natives && options.natives) {
	      setNatives(true);
	    }
	    if (!features.extensibility && options.extensibility) {
	      setExtensibility(true);
	    }
	  };

	  /**
	   * Checks whether an individual optional feature is installed.
	   * @memberOf XRegExp
	   * @param {String} feature Name of the feature to check. One of:
	   *   <li>`natives`
	   *   <li>`extensibility`
	   * @returns {Boolean} Whether the feature is installed.
	   * @example
	   *
	   * XRegExp.isInstalled('natives');
	   */
	  _self.isInstalled = function (feature) {
	    return !!features[feature];
	  };

	  /**
	   * Returns `true` if an object is a regex; `false` if it isn't. This works correctly for regexes
	   * created in another frame, when `instanceof` and `constructor` checks would fail.
	   * @memberOf XRegExp
	   * @param {*} value Object to check.
	   * @returns {Boolean} Whether the object is a `RegExp` object.
	   * @example
	   *
	   * XRegExp.isRegExp('string'); // -> false
	   * XRegExp.isRegExp(/regex/i); // -> true
	   * XRegExp.isRegExp(RegExp('^', 'm')); // -> true
	   * XRegExp.isRegExp(XRegExp('(?s).')); // -> true
	   */
	  _self.isRegExp = function (value) {
	    return isType(value, "regexp");
	  };

	  /**
	   * Retrieves the matches from searching a string using a chain of regexes that successively search
	   * within previous matches. The provided `chain` array can contain regexes and objects with `regex`
	   * and `backref` properties. When a backreference is specified, the named or numbered backreference
	   * is passed forward to the next regex or returned.
	   * @memberOf XRegExp
	   * @param {String} str String to search.
	   * @param {Array} chain Regexes that each search for matches within preceding results.
	   * @returns {Array} Matches by the last regex in the chain, or an empty array.
	   * @example
	   *
	   * // Basic usage; matches numbers within <b> tags
	   * XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>', [
	   *   XRegExp('(?is)<b>.*?</b>'),
	   *   /\d+/
	   * ]);
	   * // -> ['2', '4', '56']
	   *
	   * // Passing forward and returning specific backreferences
	   * html = '<a href="http://xregexp.com/api/">XRegExp</a>\
	   *         <a href="http://www.google.com/">Google</a>';
	   * XRegExp.matchChain(html, [
	   *   {regex: /<a href="([^"]+)">/i, backref: 1},
	   *   {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
	   * ]);
	   * // -> ['xregexp.com', 'www.google.com']
	   */
	  _self.matchChain = function (str, chain) {
	    return function recurseChain(values, level) {
	      var item = chain[level].regex ? chain[level] : { regex: chain[level] },
	          matches = [],
	          addMatch = function addMatch(match) {
	        matches.push(item.backref ? match[item.backref] || "" : match[0]);
	      },
	          i;
	      for (i = 0; i < values.length; ++i) {
	        _self.forEach(values[i], item.regex, addMatch);
	      }
	      return level === chain.length - 1 || !matches.length ? matches : recurseChain(matches, level + 1);
	    }([str], 0);
	  };

	  /**
	   * Returns a new string with one or all matches of a pattern replaced. The pattern can be a string
	   * or regex, and the replacement can be a string or a function to be called for each match. To
	   * perform a global search and replace, use the optional `scope` argument or include flag `g` if
	   * using a regex. Replacement strings can use `${n}` for named and numbered backreferences.
	   * Replacement functions can use named backreferences via `arguments[0].name`. Also fixes browser
	   * bugs compared to the native `String.prototype.replace` and can be used reliably cross-browser.
	   * @memberOf XRegExp
	   * @param {String} str String to search.
	   * @param {RegExp|String} search Search pattern to be replaced.
	   * @param {String|Function} replacement Replacement string or a function invoked to create it.
	   *   Replacement strings can include special replacement syntax:
	   *     <li>$$ - Inserts a literal '$'.
	   *     <li>$&, $0 - Inserts the matched substring.
	   *     <li>$` - Inserts the string that precedes the matched substring (left context).
	   *     <li>$' - Inserts the string that follows the matched substring (right context).
	   *     <li>$n, $nn - Where n/nn are digits referencing an existent capturing group, inserts
	   *       backreference n/nn.
	   *     <li>${n} - Where n is a name or any number of digits that reference an existent capturing
	   *       group, inserts backreference n.
	   *   Replacement functions are invoked with three or more arguments:
	   *     <li>The matched substring (corresponds to $& above). Named backreferences are accessible as
	   *       properties of this first argument.
	   *     <li>0..n arguments, one for each backreference (corresponding to $1, $2, etc. above).
	   *     <li>The zero-based index of the match within the total search string.
	   *     <li>The total string being searched.
	   * @param {String} [scope='one'] Use 'one' to replace the first match only, or 'all'. If not
	   *   explicitly specified and using a regex with flag `g`, `scope` is 'all'.
	   * @returns {String} New string with one or all matches replaced.
	   * @example
	   *
	   * // Regex search, using named backreferences in replacement string
	   * var name = XRegExp('(?<first>\\w+) (?<last>\\w+)');
	   * XRegExp.replace('John Smith', name, '${last}, ${first}');
	   * // -> 'Smith, John'
	   *
	   * // Regex search, using named backreferences in replacement function
	   * XRegExp.replace('John Smith', name, function (match) {
	   *   return match.last + ', ' + match.first;
	   * });
	   * // -> 'Smith, John'
	   *
	   * // Global string search/replacement
	   * XRegExp.replace('RegExp builds RegExps', 'RegExp', 'XRegExp', 'all');
	   * // -> 'XRegExp builds XRegExps'
	   */
	  _self.replace = function (str, search, replacement, scope) {
	    var isRegex = _self.isRegExp(search),
	        search2 = search,
	        result;
	    if (isRegex) {
	      if (scope === undef && search.global) {
	        scope = "all"; // Follow flag g when `scope` isn't explicit
	      }
	      // Note that since a copy is used, `search`'s `lastIndex` isn't updated *during* replacement iterations
	      search2 = copy(search, scope === "all" ? "g" : "", scope === "all" ? "" : "g");
	    } else if (scope === "all") {
	      search2 = new RegExp(_self.escape(String(search)), "g");
	    }
	    result = fixed.replace.call(String(str), search2, replacement); // Fixed `replace` required for named backreferences, etc.
	    if (isRegex && search.global) {
	      search.lastIndex = 0; // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
	    }
	    return result;
	  };

	  /**
	   * Splits a string into an array of strings using a regex or string separator. Matches of the
	   * separator are not included in the result array. However, if `separator` is a regex that contains
	   * capturing groups, backreferences are spliced into the result each time `separator` is matched.
	   * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
	   * cross-browser.
	   * @memberOf XRegExp
	   * @param {String} str String to split.
	   * @param {RegExp|String} separator Regex or string to use for separating the string.
	   * @param {Number} [limit] Maximum number of items to include in the result array.
	   * @returns {Array} Array of substrings.
	   * @example
	   *
	   * // Basic use
	   * XRegExp.split('a b c', ' ');
	   * // -> ['a', 'b', 'c']
	   *
	   * // With limit
	   * XRegExp.split('a b c', ' ', 2);
	   * // -> ['a', 'b']
	   *
	   * // Backreferences in result array
	   * XRegExp.split('..word1..', /([a-z]+)(\d+)/i);
	   * // -> ['..', 'word', '1', '..']
	   */
	  _self.split = function (str, separator, limit) {
	    return fixed.split.call(str, separator, limit);
	  };

	  /**
	   * Executes a regex search in a specified string. Returns `true` or `false`. Optional `pos` and
	   * `sticky` arguments specify the search start position, and whether the match must start at the
	   * specified position only. The `lastIndex` property of the provided regex is not used, but is
	   * updated for compatibility. Also fixes browser bugs compared to the native
	   * `RegExp.prototype.test` and can be used reliably cross-browser.
	   * @memberOf XRegExp
	   * @param {String} str String to search.
	   * @param {RegExp} regex Regex to search with.
	   * @param {Number} [pos=0] Zero-based index at which to start the search.
	   * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
	   *   only. The string `'sticky'` is accepted as an alternative to `true`.
	   * @returns {Boolean} Whether the regex matched the provided value.
	   * @example
	   *
	   * // Basic use
	   * XRegExp.test('abc', /c/); // -> true
	   *
	   * // With pos and sticky
	   * XRegExp.test('abc', /c/, 0, 'sticky'); // -> false
	   */
	  _self.test = function (str, regex, pos, sticky) {
	    // Do this the easy way :-)
	    return !!_self.exec(str, regex, pos, sticky);
	  };

	  /**
	   * Uninstalls optional features according to the specified options.
	   * @memberOf XRegExp
	   * @param {Object|String} options Options object or string.
	   * @example
	   *
	   * // With an options object
	   * XRegExp.uninstall({
	   *   // Restores native regex methods
	   *   natives: true,
	   *
	   *   // Disables additional syntax and flag extensions
	   *   extensibility: true
	   * });
	   *
	   * // With an options string
	   * XRegExp.uninstall('natives extensibility');
	   *
	   * // Using a shortcut to uninstall all optional features
	   * XRegExp.uninstall('all');
	   */
	  _self.uninstall = function (options) {
	    options = prepareOptions(options);
	    if (features.natives && options.natives) {
	      setNatives(false);
	    }
	    if (features.extensibility && options.extensibility) {
	      setExtensibility(false);
	    }
	  };

	  /**
	   * Returns an XRegExp object that is the union of the given patterns. Patterns can be provided as
	   * regex objects or strings. Metacharacters are escaped in patterns provided as strings.
	   * Backreferences in provided regex objects are automatically renumbered to work correctly. Native
	   * flags used by provided regexes are ignored in favor of the `flags` argument.
	   * @memberOf XRegExp
	   * @param {Array} patterns Regexes and strings to combine.
	   * @param {String} [flags] Any combination of XRegExp flags.
	   * @returns {RegExp} Union of the provided regexes and strings.
	   * @example
	   *
	   * XRegExp.union(['a+b*c', /(dogs)\1/, /(cats)\1/], 'i');
	   * // -> /a\+b\*c|(dogs)\1|(cats)\2/i
	   *
	   * XRegExp.union([XRegExp('(?<pet>dogs)\\k<pet>'), XRegExp('(?<pet>cats)\\k<pet>')]);
	   * // -> XRegExp('(?<pet>dogs)\\k<pet>|(?<pet>cats)\\k<pet>')
	   */
	  _self.union = function (patterns, flags) {
	    var parts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*]/g,
	        numCaptures = 0,
	        numPriorCaptures,
	        captureNames,
	        rewrite = function rewrite(match, paren, backref) {
	      var name = captureNames[numCaptures - numPriorCaptures];
	      if (paren) {
	        // Capturing group
	        ++numCaptures;
	        if (name) {
	          // If the current capture has a name
	          return "(?<" + name + ">";
	        }
	      } else if (backref) {
	        // Backreference
	        return "\\" + (+backref + numPriorCaptures);
	      }
	      return match;
	    },
	        output = [],
	        pattern,
	        i;
	    if (!(isType(patterns, "array") && patterns.length)) {
	      throw new TypeError("patterns must be a nonempty array");
	    }
	    for (i = 0; i < patterns.length; ++i) {
	      pattern = patterns[i];
	      if (_self.isRegExp(pattern)) {
	        numPriorCaptures = numCaptures;
	        captureNames = pattern.xregexp && pattern.xregexp.captureNames || [];
	        // Rewrite backreferences. Passing to XRegExp dies on octals and ensures patterns
	        // are independently valid; helps keep this simple. Named captures are put back
	        output.push(_self(pattern.source).source.replace(parts, rewrite));
	      } else {
	        output.push(_self.escape(pattern));
	      }
	    }
	    return _self(output.join("|"), flags);
	  };

	  /**
	   * The XRegExp version number.
	   * @static
	   * @memberOf XRegExp
	   * @type String
	   */
	  _self.version = "2.0.0";

	  /*--------------------------------------
	   *  Fixed/extended native methods
	   *------------------------------------*/

	  /**
	   * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
	   * bugs in the native `RegExp.prototype.exec`. Calling `XRegExp.install('natives')` uses this to
	   * override the native method. Use via `XRegExp.exec` without overriding natives.
	   * @private
	   * @param {String} str String to search.
	   * @returns {Array} Match array with named backreference properties, or null.
	   */
	  fixed.exec = function (str) {
	    var match, name, r2, origLastIndex, i;
	    if (!this.global) {
	      origLastIndex = this.lastIndex;
	    }
	    match = nativ.exec.apply(this, arguments);
	    if (match) {
	      // Fix browsers whose `exec` methods don't consistently return `undefined` for
	      // nonparticipating capturing groups
	      if (!compliantExecNpcg && match.length > 1 && lastIndexOf(match, "") > -1) {
	        r2 = new RegExp(this.source, nativ.replace.call(getNativeFlags(this), "g", ""));
	        // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
	        // matching due to characters outside the match
	        nativ.replace.call(String(str).slice(match.index), r2, function () {
	          var i;
	          for (i = 1; i < arguments.length - 2; ++i) {
	            if (arguments[i] === undef) {
	              match[i] = undef;
	            }
	          }
	        });
	      }
	      // Attach named capture properties
	      if (this.xregexp && this.xregexp.captureNames) {
	        for (i = 1; i < match.length; ++i) {
	          name = this.xregexp.captureNames[i - 1];
	          if (name) {
	            match[name] = match[i];
	          }
	        }
	      }
	      // Fix browsers that increment `lastIndex` after zero-length matches
	      if (this.global && !match[0].length && this.lastIndex > match.index) {
	        this.lastIndex = match.index;
	      }
	    }
	    if (!this.global) {
	      this.lastIndex = origLastIndex; // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
	    }
	    return match;
	  };

	  /**
	   * Fixes browser bugs in the native `RegExp.prototype.test`. Calling `XRegExp.install('natives')`
	   * uses this to override the native method.
	   * @private
	   * @param {String} str String to search.
	   * @returns {Boolean} Whether the regex matched the provided value.
	   */
	  fixed.test = function (str) {
	    // Do this the easy way :-)
	    return !!fixed.exec.call(this, str);
	  };

	  /**
	   * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
	   * bugs in the native `String.prototype.match`. Calling `XRegExp.install('natives')` uses this to
	   * override the native method.
	   * @private
	   * @param {RegExp} regex Regex to search with.
	   * @returns {Array} If `regex` uses flag g, an array of match strings or null. Without flag g, the
	   *   result of calling `regex.exec(this)`.
	   */
	  fixed.match = function (regex) {
	    if (!_self.isRegExp(regex)) {
	      regex = new RegExp(regex); // Use native `RegExp`
	    } else if (regex.global) {
	      var result = nativ.match.apply(this, arguments);
	      regex.lastIndex = 0; // Fixes IE bug
	      return result;
	    }
	    return fixed.exec.call(regex, this);
	  };

	  /**
	   * Adds support for `${n}` tokens for named and numbered backreferences in replacement text, and
	   * provides named backreferences to replacement functions as `arguments[0].name`. Also fixes
	   * browser bugs in replacement text syntax when performing a replacement using a nonregex search
	   * value, and the value of a replacement regex's `lastIndex` property during replacement iterations
	   * and upon completion. Note that this doesn't support SpiderMonkey's proprietary third (`flags`)
	   * argument. Calling `XRegExp.install('natives')` uses this to override the native method. Use via
	   * `XRegExp.replace` without overriding natives.
	   * @private
	   * @param {RegExp|String} search Search pattern to be replaced.
	   * @param {String|Function} replacement Replacement string or a function invoked to create it.
	   * @returns {String} New string with one or all matches replaced.
	   */
	  fixed.replace = function (search, replacement) {
	    var isRegex = _self.isRegExp(search),
	        captureNames,
	        result,
	        str,
	        origLastIndex;
	    if (isRegex) {
	      if (search.xregexp) {
	        captureNames = search.xregexp.captureNames;
	      }
	      if (!search.global) {
	        origLastIndex = search.lastIndex;
	      }
	    } else {
	      search += "";
	    }
	    if (isType(replacement, "function")) {
	      result = nativ.replace.call(String(this), search, function () {
	        var args = arguments,
	            i;
	        if (captureNames) {
	          // Change the `arguments[0]` string primitive to a `String` object that can store properties
	          args[0] = new String(args[0]);
	          // Store named backreferences on the first argument
	          for (i = 0; i < captureNames.length; ++i) {
	            if (captureNames[i]) {
	              args[0][captureNames[i]] = args[i + 1];
	            }
	          }
	        }
	        // Update `lastIndex` before calling `replacement`.
	        // Fixes IE, Chrome, Firefox, Safari bug (last tested IE 9, Chrome 17, Firefox 11, Safari 5.1)
	        if (isRegex && search.global) {
	          search.lastIndex = args[args.length - 2] + args[0].length;
	        }
	        return replacement.apply(null, args);
	      });
	    } else {
	      str = String(this); // Ensure `args[args.length - 1]` will be a string when given nonstring `this`
	      result = nativ.replace.call(str, search, function () {
	        var args = arguments; // Keep this function's `arguments` available through closure
	        return nativ.replace.call(String(replacement), replacementToken, function ($0, $1, $2) {
	          var n;
	          // Named or numbered backreference with curly brackets
	          if ($1) {
	            /* XRegExp behavior for `${n}`:
	             * 1. Backreference to numbered capture, where `n` is 1+ digits. `0`, `00`, etc. is the entire match.
	             * 2. Backreference to named capture `n`, if it exists and is not a number overridden by numbered capture.
	             * 3. Otherwise, it's an error.
	             */
	            n = +$1; // Type-convert; drop leading zeros
	            if (n <= args.length - 3) {
	              return args[n] || "";
	            }
	            n = captureNames ? lastIndexOf(captureNames, $1) : -1;
	            if (n < 0) {
	              throw new SyntaxError("backreference to undefined group " + $0);
	            }
	            return args[n + 1] || "";
	          }
	          // Else, special variable or numbered backreference (without curly brackets)
	          if ($2 === "$") return "$";
	          if ($2 === "&" || +$2 === 0) return args[0]; // $&, $0 (not followed by 1-9), $00
	          if ($2 === "`") return args[args.length - 1].slice(0, args[args.length - 2]);
	          if ($2 === "'") return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
	          // Else, numbered backreference (without curly brackets)
	          $2 = +$2; // Type-convert; drop leading zero
	          /* XRegExp behavior:
	           * - Backreferences without curly brackets end after 1 or 2 digits. Use `${..}` for more digits.
	           * - `$1` is an error if there are no capturing groups.
	           * - `$10` is an error if there are less than 10 capturing groups. Use `${1}0` instead.
	           * - `$01` is equivalent to `$1` if a capturing group exists, otherwise it's an error.
	           * - `$0` (not followed by 1-9), `$00`, and `$&` are the entire match.
	           * Native behavior, for comparison:
	           * - Backreferences end after 1 or 2 digits. Cannot use backreference to capturing group 100+.
	           * - `$1` is a literal `$1` if there are no capturing groups.
	           * - `$10` is `$1` followed by a literal `0` if there are less than 10 capturing groups.
	           * - `$01` is equivalent to `$1` if a capturing group exists, otherwise it's a literal `$01`.
	           * - `$0` is a literal `$0`. `$&` is the entire match.
	           */
	          if (!isNaN($2)) {
	            if ($2 > args.length - 3) {
	              throw new SyntaxError("backreference to undefined group " + $0);
	            }
	            return args[$2] || "";
	          }
	          throw new SyntaxError("invalid token " + $0);
	        });
	      });
	    }
	    if (isRegex) {
	      if (search.global) {
	        search.lastIndex = 0; // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
	      } else {
	        search.lastIndex = origLastIndex; // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
	      }
	    }
	    return result;
	  };

	  /**
	   * Fixes browser bugs in the native `String.prototype.split`. Calling `XRegExp.install('natives')`
	   * uses this to override the native method. Use via `XRegExp.split` without overriding natives.
	   * @private
	   * @param {RegExp|String} separator Regex or string to use for separating the string.
	   * @param {Number} [limit] Maximum number of items to include in the result array.
	   * @returns {Array} Array of substrings.
	   */
	  fixed.split = function (separator, limit) {
	    if (!_self.isRegExp(separator)) {
	      return nativ.split.apply(this, arguments); // use faster native method
	    }
	    var str = String(this),
	        origLastIndex = separator.lastIndex,
	        output = [],
	        lastLastIndex = 0,
	        lastLength;
	    /* Values for `limit`, per the spec:
	     * If undefined: pow(2,32) - 1
	     * If 0, Infinity, or NaN: 0
	     * If positive number: limit = floor(limit); if (limit >= pow(2,32)) limit -= pow(2,32);
	     * If negative number: pow(2,32) - floor(abs(limit))
	     * If other: Type-convert, then use the above rules
	     */
	    limit = (limit === undef ? -1 : limit) >>> 0;
	    _self.forEach(str, separator, function (match) {
	      if (match.index + match[0].length > lastLastIndex) {
	        // != `if (match[0].length)`
	        output.push(str.slice(lastLastIndex, match.index));
	        if (match.length > 1 && match.index < str.length) {
	          Array.prototype.push.apply(output, match.slice(1));
	        }
	        lastLength = match[0].length;
	        lastLastIndex = match.index + lastLength;
	      }
	    });
	    if (lastLastIndex === str.length) {
	      if (!nativ.test.call(separator, "") || lastLength) {
	        output.push("");
	      }
	    } else {
	      output.push(str.slice(lastLastIndex));
	    }
	    separator.lastIndex = origLastIndex;
	    return output.length > limit ? output.slice(0, limit) : output;
	  };

	  /*--------------------------------------
	   *  Built-in tokens
	   *------------------------------------*/

	  // Shortcut
	  add = addToken.on;

	  /* Letter identity escapes that natively match literal characters: \p, \P, etc.
	   * Should be SyntaxErrors but are allowed in web reality. XRegExp makes them errors for cross-
	   * browser consistency and to reserve their syntax, but lets them be superseded by XRegExp addons.
	   */
	  add(/\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4})|x(?![\dA-Fa-f]{2}))/, function (match, scope) {
	    // \B is allowed in default scope only
	    if (match[1] === "B" && scope === defaultScope) {
	      return match[0];
	    }
	    throw new SyntaxError("invalid escape " + match[0]);
	  }, { scope: "all" });

	  /* Empty character class: [] or [^]
	   * Fixes a critical cross-browser syntax inconsistency. Unless this is standardized (per the spec),
	   * regex syntax can't be accurately parsed because character class endings can't be determined.
	   */
	  add(/\[(\^?)]/, function (match) {
	    // For cross-browser compatibility with ES3, convert [] to \b\B and [^] to [\s\S].
	    // (?!) should work like \b\B, but is unreliable in Firefox
	    return match[1] ? "[\\s\\S]" : "\\b\\B";
	  });

	  /* Comment pattern: (?# )
	   * Inline comments are an alternative to the line comments allowed in free-spacing mode (flag x).
	   */
	  add(/(?:\(\?#[^)]*\))+/, function (match) {
	    // Keep tokens separated unless the following token is a quantifier
	    return nativ.test.call(quantifier, match.input.slice(match.index + match[0].length)) ? "" : "(?:)";
	  });

	  /* Named backreference: \k<name>
	   * Backreference names can use the characters A-Z, a-z, 0-9, _, and $ only.
	   */
	  add(/\\k<([\w$]+)>/, function (match) {
	    var index = isNaN(match[1]) ? lastIndexOf(this.captureNames, match[1]) + 1 : +match[1],
	        endIndex = match.index + match[0].length;
	    if (!index || index > this.captureNames.length) {
	      throw new SyntaxError("backreference to undefined group " + match[0]);
	    }
	    // Keep backreferences separate from subsequent literal numbers
	    return "\\" + index + (endIndex === match.input.length || isNaN(match.input.charAt(endIndex)) ? "" : "(?:)");
	  });

	  /* Whitespace and line comments, in free-spacing mode (aka extended mode, flag x) only.
	   */
	  add(/(?:\s+|#.*)+/, function (match) {
	    // Keep tokens separated unless the following token is a quantifier
	    return nativ.test.call(quantifier, match.input.slice(match.index + match[0].length)) ? "" : "(?:)";
	  }, {
	    trigger: function trigger() {
	      return this.hasFlag("x");
	    },
	    customFlags: "x"
	  });

	  /* Dot, in dotall mode (aka singleline mode, flag s) only.
	   */
	  add(/\./, function () {
	    return "[\\s\\S]";
	  }, {
	    trigger: function trigger() {
	      return this.hasFlag("s");
	    },
	    customFlags: "s"
	  });

	  /* Named capturing group; match the opening delimiter only: (?<name>
	   * Capture names can use the characters A-Z, a-z, 0-9, _, and $ only. Names can't be integers.
	   * Supports Python-style (?P<name> as an alternate syntax to avoid issues in recent Opera (which
	   * natively supports the Python-style syntax). Otherwise, XRegExp might treat numbered
	   * backreferences to Python-style named capture as octals.
	   */
	  add(/\(\?P?<([\w$]+)>/, function (match) {
	    if (!isNaN(match[1])) {
	      // Avoid incorrect lookups, since named backreferences are added to match arrays
	      throw new SyntaxError("can't use integer as capture name " + match[0]);
	    }
	    this.captureNames.push(match[1]);
	    this.hasNamedCapture = true;
	    return "(";
	  });

	  /* Numbered backreference or octal, plus any following digits: \0, \11, etc.
	   * Octals except \0 not followed by 0-9 and backreferences to unopened capture groups throw an
	   * error. Other matches are returned unaltered. IE <= 8 doesn't support backreferences greater than
	   * \99 in regex syntax.
	   */
	  add(/\\(\d+)/, function (match, scope) {
	    if (!(scope === defaultScope && /^[1-9]/.test(match[1]) && +match[1] <= this.captureNames.length) && match[1] !== "0") {
	      throw new SyntaxError("can't use octal escape or backreference to undefined group " + match[0]);
	    }
	    return match[0];
	  }, { scope: "all" });

	  /* Capturing group; match the opening parenthesis only.
	   * Required for support of named capturing groups. Also adds explicit capture mode (flag n).
	   */
	  add(/\((?!\?)/, function () {
	    if (this.hasFlag("n")) {
	      return "(?:";
	    }
	    this.captureNames.push(null);
	    return "(";
	  }, { customFlags: "n" });

	  /*--------------------------------------
	   *  Expose XRegExp
	   *------------------------------------*/

	  // For CommonJS enviroments
	  if (typeof exports !== "undefined") {
	    exports.XRegExp = _self;
	  }

	  return _self;
	}();

	//
	// Begin anonymous function. This is used to contain local scope variables without polutting global scope.
	//
	if (typeof SyntaxHighlighter == 'undefined') var SyntaxHighlighter = function () {

	  // CommonJS
	  if (typeof require != 'undefined' && typeof XRegExp == 'undefined') {
	    XRegExp = require('xregexp').XRegExp;
	  }

	  // Shortcut object which will be assigned to the SyntaxHighlighter variable.
	  // This is a shorthand for local reference in order to avoid long namespace
	  // references to SyntaxHighlighter.whatever...
	  var sh = {
	    defaults: {
	      /** Additional CSS class names to be added to highlighter elements. */
	      'class-name': '',

	      /** First line number. */
	      'first-line': 1,

	      /**
	       * Pads line numbers. Possible values are:
	       *
	       *   false - don't pad line numbers.
	       *   true  - automaticaly pad numbers with minimum required number of leading zeroes.
	       *   [int] - length up to which pad line numbers.
	       */
	      'pad-line-numbers': false,

	      /** Lines to highlight. */
	      'highlight': null,

	      /** Title to be displayed above the code block. */
	      'title': null,

	      /** Enables or disables smart tabs. */
	      'smart-tabs': true,

	      /** Gets or sets tab size. */
	      'tab-size': 4,

	      /** Enables or disables gutter. */
	      'gutter': true,

	      /** Enables or disables toolbar. */
	      'toolbar': true,

	      /** Enables quick code copy and paste from double click. */
	      'quick-code': true,

	      /** Forces code view to be collapsed. */
	      'collapse': false,

	      /** Enables or disables automatic links. */
	      'auto-links': true,

	      /** Gets or sets light mode. Equavalent to turning off gutter and toolbar. */
	      'light': false,

	      'unindent': true,

	      'html-script': false
	    },

	    config: {
	      space: '&nbsp;',

	      /** Enables use of <SCRIPT type="syntaxhighlighter" /> tags. */
	      useScriptTags: true,

	      /** Blogger mode flag. */
	      bloggerMode: false,

	      stripBrs: false,

	      /** Name of the tag that SyntaxHighlighter will automatically look for. */
	      tagName: 'pre',

	      strings: {
	        expandSource: 'expand source',
	        help: '?',
	        alert: 'SyntaxHighlighter\n\n',
	        noBrush: 'Can\'t find brush for: ',
	        brushNotHtmlScript: 'Brush wasn\'t configured for html-script option: ',

	        // this is populated by the build script
	        aboutDialog: '<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\"><html xmlns=\"http://www.w3.org/1999/xhtml\"><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" /><title>About SyntaxHighlighter</title></head><body style=\"font-family:Geneva,Arial,Helvetica,sans-serif;background-color:#fff;color:#000;font-size:1em;text-align:center;\"><div style=\"text-align:center;margin-top:1.5em;\"><div style=\"font-size:xx-large;\">SyntaxHighlighter</div><div style=\"font-size:.75em;margin-bottom:3em;\"><div>version 3.0.83 (Tue, 04 Feb 2014 22:06:22 GMT)</div><div><a href=\"http://alexgorbatchev.com/SyntaxHighlighter\" target=\"_blank\" style=\"color:#005896\">http://alexgorbatchev.com/SyntaxHighlighter</a></div><div>JavaScript code syntax highlighter.</div><div>Copyright 2004-2013 Alex Gorbatchev.</div></div><div>If you like this script, please <a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2930402\" style=\"color:#005896\">donate</a> to <br/>keep development active!</div></div></body></html>'
	      }
	    },

	    /** Internal 'global' variables. */
	    vars: {
	      discoveredBrushes: null,
	      highlighters: {}
	    },

	    /** This object is populated by user included external brush files. */
	    brushes: {},

	    /** Common regular expressions. */
	    regexLib: {
	      multiLineCComments: XRegExp('/\\*.*?\\*/', 'gs'),
	      singleLineCComments: /\/\/.*$/gm,
	      singleLinePerlComments: /#.*$/gm,
	      doubleQuotedString: /"([^\\"\n]|\\.)*"/g,
	      singleQuotedString: /'([^\\'\n]|\\.)*'/g,
	      multiLineDoubleQuotedString: XRegExp('"([^\\\\"]|\\\\.)*"', 'gs'),
	      multiLineSingleQuotedString: XRegExp("'([^\\\\']|\\\\.)*'", 'gs'),
	      xmlComments: XRegExp('(&lt;|<)!--.*?--(&gt;|>)', 'gs'),
	      url: /\w+:\/\/[\w-.\/?%&=:@;#]*/g,
	      phpScriptTags: { left: /(&lt;|<)\?(?:=|php)?/g, right: /\?(&gt;|>)/g, 'eof': true },
	      aspScriptTags: { left: /(&lt;|<)%=?/g, right: /%(&gt;|>)/g },
	      scriptScriptTags: { left: /(&lt;|<)\s*script.*?(&gt;|>)/gi, right: /(&lt;|<)\/\s*script\s*(&gt;|>)/gi }
	    },

	    toolbar: {
	      /**
	       * Generates HTML markup for the toolbar.
	       * @param {Highlighter} highlighter Highlighter instance.
	       * @return {String} Returns HTML markup.
	       */
	      getHtml: function getHtml(highlighter) {
	        var html = '<div class="toolbar">',
	            items = sh.toolbar.items,
	            list = items.list;

	        function defaultGetHtml(highlighter, name) {
	          return sh.toolbar.getButtonHtml(highlighter, name, sh.config.strings[name]);
	        }

	        for (var i = 0, l = list.length; i < l; i++) {
	          html += (items[list[i]].getHtml || defaultGetHtml)(highlighter, list[i]);
	        }

	        html += '</div>';

	        return html;
	      },

	      /**
	       * Generates HTML markup for a regular button in the toolbar.
	       * @param {Highlighter} highlighter Highlighter instance.
	       * @param {String} commandName		Command name that would be executed.
	       * @param {String} label			Label text to display.
	       * @return {String}					Returns HTML markup.
	       */
	      getButtonHtml: function getButtonHtml(highlighter, commandName, label) {
	        return '<span><a href="#" class="toolbar_item' + ' command_' + commandName + ' ' + commandName + '">' + label + '</a></span>';
	      },

	      /**
	       * Event handler for a toolbar anchor.
	       */
	      handler: function handler(e) {
	        var target = e.target,
	            className = target.className || '';

	        function getValue(name) {
	          var r = new RegExp(name + '_(\\w+)'),
	              match = r.exec(className);

	          return match ? match[1] : null;
	        }

	        var highlighter = getHighlighterById(findParentElement(target, '.syntaxhighlighter').id),
	            commandName = getValue('command');

	        // execute the toolbar command
	        if (highlighter && commandName) sh.toolbar.items[commandName].execute(highlighter);

	        // disable default A click behaviour
	        e.preventDefault();
	      },

	      /** Collection of toolbar items. */
	      items: {
	        // Ordered lis of items in the toolbar. Can't expect `for (var n in items)` to be consistent.
	        list: ['expandSource', 'help'],

	        expandSource: {
	          getHtml: function getHtml(highlighter) {
	            if (highlighter.getParam('collapse') != true) return '';

	            var title = highlighter.getParam('title');
	            return sh.toolbar.getButtonHtml(highlighter, 'expandSource', title ? title : sh.config.strings.expandSource);
	          },

	          execute: function execute(highlighter) {
	            var div = getHighlighterDivById(highlighter.id);
	            removeClass(div, 'collapsed');
	          }
	        },

	        /** Command to display the about dialog window. */
	        help: {
	          execute: function execute(highlighter) {
	            var wnd = popup('', '_blank', 500, 250, 'scrollbars=0'),
	                doc = wnd.document;

	            doc.write(sh.config.strings.aboutDialog);
	            doc.close();
	            wnd.focus();
	          }
	        }
	      }
	    },

	    /**
	     * Finds all elements on the page which should be processes by SyntaxHighlighter.
	     *
	     * @param {Object} globalParams		Optional parameters which override element's
	     * 									parameters. Only used if element is specified.
	     *
	     * @param {Object} element	Optional element to highlight. If none is
	     * 							provided, all elements in the current document
	     * 							are returned which qualify.
	     *
	     * @return {Array}	Returns list of <code>{ target: DOMElement, params: Object }</code> objects.
	     */
	    findElements: function findElements(globalParams, element) {
	      var elements = element ? [element] : toArray(document.getElementsByTagName(sh.config.tagName)),
	          conf = sh.config,
	          result = [];

	      // support for <SCRIPT TYPE="syntaxhighlighter" /> feature
	      if (conf.useScriptTags) elements = elements.concat(getSyntaxHighlighterScriptTags());

	      if (elements.length === 0) return result;

	      for (var i = 0, l = elements.length; i < l; i++) {
	        var item = {
	          target: elements[i],
	          // local params take precedence over globals
	          params: merge(globalParams, parseParams(elements[i].className))
	        };

	        if (item.params['brush'] == null) continue;

	        result.push(item);
	      }

	      return result;
	    },

	    /**
	     * Shorthand to highlight all elements on the page that are marked as
	     * SyntaxHighlighter source code.
	     *
	     * @param {Object} globalParams		Optional parameters which override element's
	     * 									parameters. Only used if element is specified.
	     *
	     * @param {Object} element	Optional element to highlight. If none is
	     * 							provided, all elements in the current document
	     * 							are highlighted.
	     */
	    highlight: function highlight(globalParams, element) {
	      var elements = this.findElements(globalParams, element),
	          propertyName = 'innerHTML',
	          highlighter = null,
	          conf = sh.config;

	      if (elements.length === 0) return;

	      for (var i = 0, l = elements.length; i < l; i++) {
	        var element = elements[i],
	            target = element.target,
	            params = element.params,
	            brushName = params.brush,
	            code;

	        if (brushName == null) continue;

	        // Instantiate a brush
	        if (params['html-script'] == 'true' || sh.defaults['html-script'] == true) {
	          highlighter = new sh.HtmlScript(brushName);
	          brushName = 'htmlscript';
	        } else {
	          var brush = findBrush(brushName);

	          if (brush) highlighter = new brush();else continue;
	        }

	        code = target[propertyName];

	        // remove CDATA from <SCRIPT/> tags if it's present
	        if (conf.useScriptTags) code = stripCData(code);

	        // Inject title if the attribute is present
	        if ((target.title || '') != '') params.title = target.title;

	        params['brush'] = brushName;
	        highlighter.init(params);
	        element = highlighter.getDiv(code);

	        // carry over ID
	        if ((target.id || '') != '') element.id = target.id;

	        target.parentNode.replaceChild(element, target);
	      }
	    },

	    /**
	     * Main entry point for the SyntaxHighlighter.
	     * @param {Object} params Optional params to apply to all highlighted elements.
	     */
	    all: function all(params) {
	      attachEvent(window, 'load', function () {
	        sh.highlight(params);
	      });
	    }
	  }; // end of sh

	  /**
	   * Checks if target DOM elements has specified CSS class.
	   * @param {DOMElement} target Target DOM element to check.
	   * @param {String} className Name of the CSS class to check for.
	   * @return {Boolean} Returns true if class name is present, false otherwise.
	   */
	  function hasClass(target, className) {
	    return target.className.indexOf(className) != -1;
	  };

	  /**
	   * Adds CSS class name to the target DOM element.
	   * @param {DOMElement} target Target DOM element.
	   * @param {String} className New CSS class to add.
	   */
	  function addClass(target, className) {
	    if (!hasClass(target, className)) target.className += ' ' + className;
	  };

	  /**
	   * Removes CSS class name from the target DOM element.
	   * @param {DOMElement} target Target DOM element.
	   * @param {String} className CSS class to remove.
	   */
	  function removeClass(target, className) {
	    target.className = target.className.replace(className, '');
	  };

	  /**
	   * Converts the source to array object. Mostly used for function arguments and
	   * lists returned by getElementsByTagName() which aren't Array objects.
	   * @param {List} source Source list.
	   * @return {Array} Returns array.
	   */
	  function toArray(source) {
	    var result = [];

	    for (var i = 0, l = source.length; i < l; i++) {
	      result.push(source[i]);
	    }return result;
	  };

	  /**
	   * Splits block of text into lines.
	   * @param {String} block Block of text.
	   * @return {Array} Returns array of lines.
	   */
	  function splitLines(block) {
	    return block.split(/\r?\n/);
	  }

	  /**
	   * Generates HTML ID for the highlighter.
	   * @param {String} highlighterId Highlighter ID.
	   * @return {String} Returns HTML ID.
	   */
	  function getHighlighterId(id) {
	    var prefix = 'highlighter_';
	    return id.indexOf(prefix) == 0 ? id : prefix + id;
	  };

	  /**
	   * Finds Highlighter instance by ID.
	   * @param {String} highlighterId Highlighter ID.
	   * @return {Highlighter} Returns instance of the highlighter.
	   */
	  function getHighlighterById(id) {
	    return sh.vars.highlighters[getHighlighterId(id)];
	  };

	  /**
	   * Finds highlighter's DIV container.
	   * @param {String} highlighterId Highlighter ID.
	   * @return {Element} Returns highlighter's DIV element.
	   */
	  function getHighlighterDivById(id) {
	    return document.getElementById(getHighlighterId(id));
	  };

	  /**
	   * Stores highlighter so that getHighlighterById() can do its thing. Each
	   * highlighter must call this method to preserve itself.
	   * @param {Highilghter} highlighter Highlighter instance.
	   */
	  function storeHighlighter(highlighter) {
	    sh.vars.highlighters[getHighlighterId(highlighter.id)] = highlighter;
	  };

	  /**
	   * Looks for a child or parent node which has specified classname.
	   * Equivalent to jQuery's $(container).find(".className")
	   * @param {Element} target Target element.
	   * @param {String} search Class name or node name to look for.
	   * @param {Boolean} reverse If set to true, will go up the node tree instead of down.
	   * @return {Element} Returns found child or parent element on null.
	   */
	  function findElement(target, search, reverse /* optional */) {
	    if (target == null) return null;

	    var nodes = reverse != true ? target.childNodes : [target.parentNode],
	        propertyToFind = { '#': 'id', '.': 'className' }[search.substr(0, 1)] || 'nodeName',
	        expectedValue,
	        found;

	    expectedValue = propertyToFind != 'nodeName' ? search.substr(1) : search.toUpperCase();

	    // main return of the found node
	    if ((target[propertyToFind] || '').indexOf(expectedValue) != -1) return target;

	    for (var i = 0, l = nodes.length; nodes && i < l && found == null; i++) {
	      found = findElement(nodes[i], search, reverse);
	    }return found;
	  };

	  /**
	   * Looks for a parent node which has specified classname.
	   * This is an alias to <code>findElement(container, className, true)</code>.
	   * @param {Element} target Target element.
	   * @param {String} className Class name to look for.
	   * @return {Element} Returns found parent element on null.
	   */
	  function findParentElement(target, className) {
	    return findElement(target, className, true);
	  };

	  /**
	   * Finds an index of element in the array.
	   * @ignore
	   * @param {Object} searchElement
	   * @param {Number} fromIndex
	   * @return {Number} Returns index of element if found; -1 otherwise.
	   */
	  function indexOf(array, searchElement, fromIndex) {
	    fromIndex = Math.max(fromIndex || 0, 0);

	    for (var i = fromIndex, l = array.length; i < l; i++) {
	      if (array[i] == searchElement) return i;
	    }return -1;
	  };

	  /**
	   * Generates a unique element ID.
	   */
	  function guid(prefix) {
	    return (prefix || '') + Math.round(Math.random() * 1000000).toString();
	  };

	  /**
	   * Merges two objects. Values from obj2 override values in obj1.
	   * Function is NOT recursive and works only for one dimensional objects.
	   * @param {Object} obj1 First object.
	   * @param {Object} obj2 Second object.
	   * @return {Object} Returns combination of both objects.
	   */
	  function merge(obj1, obj2) {
	    var result = {},
	        name;

	    for (name in obj1) {
	      result[name] = obj1[name];
	    }for (name in obj2) {
	      result[name] = obj2[name];
	    }return result;
	  };

	  /**
	   * Attempts to convert string to boolean.
	   * @param {String} value Input string.
	   * @return {Boolean} Returns true if input was "true", false if input was "false" and value otherwise.
	   */
	  function toBoolean(value) {
	    var result = { "true": true, "false": false }[value];
	    return result == null ? value : result;
	  };

	  /**
	   * Opens up a centered popup window.
	   * @param {String} url		URL to open in the window.
	   * @param {String} name		Popup name.
	   * @param {int} width		Popup width.
	   * @param {int} height		Popup height.
	   * @param {String} options	window.open() options.
	   * @return {Window}			Returns window instance.
	   */
	  function popup(url, name, width, height, options) {
	    var x = (screen.width - width) / 2,
	        y = (screen.height - height) / 2;

	    options += ', left=' + x + ', top=' + y + ', width=' + width + ', height=' + height;
	    options = options.replace(/^,/, '');

	    var win = window.open(url, name, options);
	    win.focus();
	    return win;
	  };

	  /**
	   * Adds event handler to the target object.
	   * @param {Object} obj		Target object.
	   * @param {String} type		Name of the event.
	   * @param {Function} func	Handling function.
	   */
	  function attachEvent(obj, type, func, scope) {
	    function handler(e) {
	      e = e || window.event;

	      if (!e.target) {
	        e.target = e.srcElement;
	        e.preventDefault = function () {
	          this.returnValue = false;
	        };
	      }

	      func.call(scope || window, e);
	    };

	    if (obj.attachEvent) {
	      obj.attachEvent('on' + type, handler);
	    } else {
	      obj.addEventListener(type, handler, false);
	    }
	  };

	  /**
	   * Displays an alert.
	   * @param {String} str String to display.
	   */
	  function alert(str) {
	    window.alert(sh.config.strings.alert + str);
	  };

	  /**
	   * Finds a brush by its alias.
	   *
	   * @param {String} alias		Brush alias.
	   * @param {Boolean} showAlert	Suppresses the alert if false.
	   * @return {Brush}				Returns bursh constructor if found, null otherwise.
	   */
	  function findBrush(alias, showAlert) {
	    var brushes = sh.vars.discoveredBrushes,
	        result = null;

	    if (brushes == null) {
	      brushes = {};

	      // Find all brushes
	      for (var brush in sh.brushes) {
	        var info = sh.brushes[brush],
	            aliases = info.aliases;

	        if (aliases == null) continue;

	        // keep the brush name
	        info.brushName = brush.toLowerCase();

	        for (var i = 0, l = aliases.length; i < l; i++) {
	          brushes[aliases[i]] = brush;
	        }
	      }

	      sh.vars.discoveredBrushes = brushes;
	    }

	    result = sh.brushes[brushes[alias]];

	    if (result == null && showAlert) alert(sh.config.strings.noBrush + alias);

	    return result;
	  };

	  /**
	   * Executes a callback on each line and replaces each line with result from the callback.
	   * @param {Object} str			Input string.
	   * @param {Object} callback		Callback function taking one string argument and returning a string.
	   */
	  function eachLine(str, callback) {
	    var lines = splitLines(str);

	    for (var i = 0, l = lines.length; i < l; i++) {
	      lines[i] = callback(lines[i], i);
	    } // include \r to enable copy-paste on windows (ie8) without getting everything on one line
	    return lines.join('\r\n');
	  };

	  /**
	   * This is a special trim which only removes first and last empty lines
	   * and doesn't affect valid leading space on the first line.
	   *
	   * @param {String} str   Input string
	   * @return {String}      Returns string without empty first and last lines.
	   */
	  function trimFirstAndLastLines(str) {
	    return str.replace(/^[ ]*[\n]+|[\n]*[ ]*$/g, '');
	  };

	  /**
	   * Parses key/value pairs into hash object.
	   *
	   * Understands the following formats:
	   * - name: word;
	   * - name: [word, word];
	   * - name: "string";
	   * - name: 'string';
	   *
	   * For example:
	   *   name1: value; name2: [value, value]; name3: 'value'
	   *
	   * @param {String} str    Input string.
	   * @return {Object}       Returns deserialized object.
	   */
	  function parseParams(str) {
	    var match,
	        result = {},
	        arrayRegex = XRegExp("^\\[(?<values>(.*?))\\]$"),
	        pos = 0,
	        regex = XRegExp("(?<name>[\\w-]+)" + "\\s*:\\s*" + "(?<value>" + "[\\w%#-]+|" + // word
	    "\\[.*?\\]|" + // [] array
	    '".*?"|' + // "" string
	    "'.*?'" + // '' string
	    ")\\s*;?", "g");

	    while ((match = XRegExp.exec(str, regex, pos)) != null) {
	      var value = match.value.replace(/^['"]|['"]$/g, '') // strip quotes from end of strings
	      ;

	      // try to parse array value
	      if (value != null && arrayRegex.test(value)) {
	        var m = XRegExp.exec(value, arrayRegex);
	        value = m.values.length > 0 ? m.values.split(/\s*,\s*/) : [];
	      }

	      result[match.name] = value;
	      pos = match.index + match[0].length;
	    }

	    return result;
	  };

	  /**
	   * Wraps each line of the string into <code/> tag with given style applied to it.
	   *
	   * @param {String} str   Input string.
	   * @param {String} css   Style name to apply to the string.
	   * @return {String}      Returns input string with each line surrounded by <span/> tag.
	   */
	  function wrapLinesWithCode(str, css) {
	    if (str == null || str.length == 0 || str == '\n') return str;

	    str = str.replace(/</g, '&lt;');

	    // Replace two or more sequential spaces with &nbsp; leaving last space untouched.
	    str = str.replace(/ {2,}/g, function (m) {
	      var spaces = '';

	      for (var i = 0, l = m.length; i < l - 1; i++) {
	        spaces += sh.config.space;
	      }return spaces + ' ';
	    });

	    // Split each line and apply <span class="...">...</span> to them so that
	    // leading spaces aren't included.
	    if (css != null) str = eachLine(str, function (line) {
	      if (line.length == 0) return '';

	      var spaces = '';

	      line = line.replace(/^(&nbsp;| )+/, function (s) {
	        spaces = s;
	        return '';
	      });

	      if (line.length == 0) return spaces;

	      return spaces + '<code class="' + css + '">' + line + '</code>';
	    });

	    return str;
	  };

	  /**
	   * Pads number with zeros until it's length is the same as given length.
	   *
	   * @param {Number} number	Number to pad.
	   * @param {Number} length	Max string length with.
	   * @return {String}			Returns a string padded with proper amount of '0'.
	   */
	  function padNumber(number, length) {
	    var result = number.toString();

	    while (result.length < length) {
	      result = '0' + result;
	    }return result;
	  };

	  /**
	   * Replaces tabs with spaces.
	   *
	   * @param {String} code		Source code.
	   * @param {Number} tabSize	Size of the tab.
	   * @return {String}			Returns code with all tabs replaces by spaces.
	   */
	  function processTabs(code, tabSize) {
	    var tab = '';

	    for (var i = 0; i < tabSize; i++) {
	      tab += ' ';
	    }return code.replace(/\t/g, tab);
	  };

	  /**
	   * Replaces tabs with smart spaces.
	   *
	   * @param {String} code    Code to fix the tabs in.
	   * @param {Number} tabSize Number of spaces in a column.
	   * @return {String}        Returns code with all tabs replaces with roper amount of spaces.
	   */
	  function processSmartTabs(code, tabSize) {
	    var lines = splitLines(code),
	        tab = '\t',
	        spaces = '';

	    // Create a string with 1000 spaces to copy spaces from...
	    // It's assumed that there would be no indentation longer than that.
	    for (var i = 0; i < 50; i++) {
	      spaces += '                    ';
	    } // 20 spaces * 50

	    // This function inserts specified amount of spaces in the string
	    // where a tab is while removing that given tab.
	    function insertSpaces(line, pos, count) {
	      return line.substr(0, pos) + spaces.substr(0, count) + line.substr(pos + 1, line.length) // pos + 1 will get rid of the tab
	      ;
	    };

	    // Go through all the lines and do the 'smart tabs' magic.
	    code = eachLine(code, function (line) {
	      if (line.indexOf(tab) == -1) return line;

	      var pos = 0;

	      while ((pos = line.indexOf(tab)) != -1) {
	        // This is pretty much all there is to the 'smart tabs' logic.
	        // Based on the position within the line and size of a tab,
	        // calculate the amount of spaces we need to insert.
	        var spaces = tabSize - pos % tabSize;
	        line = insertSpaces(line, pos, spaces);
	      }

	      return line;
	    });

	    return code;
	  };

	  /**
	   * Performs various string fixes based on configuration.
	   */
	  function fixInputString(str) {
	    var br = /<br\s*\/?>|&lt;br\s*\/?&gt;/gi;

	    if (sh.config.bloggerMode == true) str = str.replace(br, '\n');

	    if (sh.config.stripBrs == true) str = str.replace(br, '');

	    return str;
	  };

	  /**
	   * Removes all white space at the begining and end of a string.
	   *
	   * @param {String} str   String to trim.
	   * @return {String}      Returns string without leading and following white space characters.
	   */
	  function trim(str) {
	    return str.replace(/^\s+|\s+$/g, '');
	  };

	  /**
	   * Unindents a block of text by the lowest common indent amount.
	   * @param {String} str   Text to unindent.
	   * @return {String}      Returns unindented text block.
	   */
	  function unindent(str) {
	    var lines = splitLines(fixInputString(str)),
	        indents = new Array(),
	        regex = /^\s*/,
	        min = 1000;

	    // go through every line and check for common number of indents
	    for (var i = 0, l = lines.length; i < l && min > 0; i++) {
	      var line = lines[i];

	      if (trim(line).length == 0) continue;

	      var matches = regex.exec(line);

	      // In the event that just one line doesn't have leading white space
	      // we can't unindent anything, so bail completely.
	      if (matches == null) return str;

	      min = Math.min(matches[0].length, min);
	    }

	    // trim minimum common number of white space from the begining of every line
	    if (min > 0) for (var i = 0, l = lines.length; i < l; i++) {
	      lines[i] = lines[i].substr(min);
	    }return lines.join('\n');
	  };

	  /**
	   * Callback method for Array.sort() which sorts matches by
	   * index position and then by length.
	   *
	   * @param {Match} m1	Left object.
	   * @param {Match} m2    Right object.
	   * @return {Number}     Returns -1, 0 or -1 as a comparison result.
	   */
	  function matchesSortCallback(m1, m2) {
	    // sort matches by index first
	    if (m1.index < m2.index) return -1;else if (m1.index > m2.index) return 1;else {
	      // if index is the same, sort by length
	      if (m1.length < m2.length) return -1;else if (m1.length > m2.length) return 1;
	    }

	    return 0;
	  };

	  /**
	   * Executes given regular expression on provided code and returns all
	   * matches that are found.
	   *
	   * @param {String} code    Code to execute regular expression on.
	   * @param {Object} regex   Regular expression item info from <code>regexList</code> collection.
	   * @return {Array}         Returns a list of Match objects.
	   */
	  function getMatches(code, regexInfo) {
	    function defaultAdd(match, regexInfo) {
	      return match[0];
	    };

	    var index = 0,
	        match = null,
	        matches = [],
	        func = regexInfo.func ? regexInfo.func : defaultAdd;
	    pos = 0;

	    while ((match = XRegExp.exec(code, regexInfo.regex, pos)) != null) {
	      var resultMatch = func(match, regexInfo);

	      if (typeof resultMatch == 'string') resultMatch = [new sh.Match(resultMatch, match.index, regexInfo.css)];

	      matches = matches.concat(resultMatch);
	      pos = match.index + match[0].length;
	    }

	    return matches;
	  };

	  /**
	   * Turns all URLs in the code into <a/> tags.
	   * @param {String} code Input code.
	   * @return {String} Returns code with </a> tags.
	   */
	  function processUrls(code) {
	    var gt = /(.*)((&gt;|&lt;).*)/;

	    return code.replace(sh.regexLib.url, function (m) {
	      var suffix = '',
	          match = null;

	      // We include &lt; and &gt; in the URL for the common cases like <http://google.com>
	      // The problem is that they get transformed into &lt;http://google.com&gt;
	      // Where as &gt; easily looks like part of the URL string.

	      if (match = gt.exec(m)) {
	        m = match[1];
	        suffix = match[2];
	      }

	      return '<a href="' + m + '">' + m + '</a>' + suffix;
	    });
	  };

	  /**
	   * Finds all <SCRIPT TYPE="syntaxhighlighter" /> elementss.
	   * @return {Array} Returns array of all found SyntaxHighlighter tags.
	   */
	  function getSyntaxHighlighterScriptTags() {
	    var tags = document.getElementsByTagName('script'),
	        result = [];

	    for (var i = 0, l = tags.length; i < l; i++) {
	      if (tags[i].type == 'syntaxhighlighter') result.push(tags[i]);
	    }return result;
	  };

	  /**
	   * Strips <![CDATA[]]> from <SCRIPT /> content because it should be used
	   * there in most cases for XHTML compliance.
	   * @param {String} original	Input code.
	   * @return {String} Returns code without leading <![CDATA[]]> tags.
	   */
	  function stripCData(original) {
	    var left = '<![CDATA[',
	        right = ']]>',

	    // for some reason IE inserts some leading blanks here
	    copy = trim(original),
	        changed = false,
	        leftLength = left.length,
	        rightLength = right.length;

	    if (copy.indexOf(left) == 0) {
	      copy = copy.substring(leftLength);
	      changed = true;
	    }

	    var copyLength = copy.length;

	    if (copy.indexOf(right) == copyLength - rightLength) {
	      copy = copy.substring(0, copyLength - rightLength);
	      changed = true;
	    }

	    return changed ? copy : original;
	  };

	  /**
	   * Quick code mouse double click handler.
	   */
	  function quickCodeHandler(e) {
	    var target = e.target,
	        highlighterDiv = findParentElement(target, '.syntaxhighlighter'),
	        container = findParentElement(target, '.container'),
	        textarea = document.createElement('textarea'),
	        highlighter;

	    if (!container || !highlighterDiv || findElement(container, 'textarea')) return;

	    highlighter = getHighlighterById(highlighterDiv.id);

	    // add source class name
	    addClass(highlighterDiv, 'source');

	    // Have to go over each line and grab it's text, can't just do it on the
	    // container because Firefox loses all \n where as Webkit doesn't.
	    var lines = container.childNodes,
	        code = [];

	    for (var i = 0, l = lines.length; i < l; i++) {
	      code.push(lines[i].innerText || lines[i].textContent);
	    } // using \r instead of \r or \r\n makes this work equally well on IE, FF and Webkit
	    code = code.join('\r');

	    // For Webkit browsers, replace nbsp with a breaking space
	    code = code.replace(/\u00a0/g, " ");

	    // inject <textarea/> tag
	    textarea.appendChild(document.createTextNode(code));
	    container.appendChild(textarea);

	    // preselect all text
	    textarea.focus();
	    textarea.select();

	    // set up handler for lost focus
	    attachEvent(textarea, 'blur', function (e) {
	      textarea.parentNode.removeChild(textarea);
	      removeClass(highlighterDiv, 'source');
	    });
	  };

	  /**
	   * Match object.
	   */
	  sh.Match = function (value, index, css) {
	    this.value = value;
	    this.index = index;
	    this.length = value.length;
	    this.css = css;
	    this.brushName = null;
	  };

	  sh.Match.prototype.toString = function () {
	    return this.value;
	  };

	  /**
	   * Simulates HTML code with a scripting language embedded.
	   *
	   * @param {String} scriptBrushName Brush name of the scripting language.
	   */
	  sh.HtmlScript = function (scriptBrushName) {
	    var brushClass = findBrush(scriptBrushName),
	        scriptBrush,
	        xmlBrush = new sh.brushes.Xml(),
	        bracketsRegex = null,
	        ref = this,
	        methodsToExpose = 'getDiv getHtml init'.split(' ');

	    if (brushClass == null) return;

	    scriptBrush = new brushClass();

	    for (var i = 0, l = methodsToExpose.length; i < l; i++) {
	      // make a closure so we don't lose the name after i changes
	      (function () {
	        var name = methodsToExpose[i];

	        ref[name] = function () {
	          return xmlBrush[name].apply(xmlBrush, arguments);
	        };
	      })();
	    }if (scriptBrush.htmlScript == null) {
	      alert(sh.config.strings.brushNotHtmlScript + scriptBrushName);
	      return;
	    }

	    xmlBrush.regexList.push({ regex: scriptBrush.htmlScript.code, func: process });

	    function offsetMatches(matches, offset) {
	      for (var j = 0, l = matches.length; j < l; j++) {
	        matches[j].index += offset;
	      }
	    }

	    function process(match, info) {
	      var code = match.code,
	          matches = [],
	          regexList = scriptBrush.regexList,
	          offset = match.index + match.left.length,
	          htmlScript = scriptBrush.htmlScript,
	          result;

	      // add all matches from the code
	      for (var i = 0, l = regexList.length; i < l; i++) {
	        result = getMatches(code, regexList[i]);
	        offsetMatches(result, offset);
	        matches = matches.concat(result);
	      }

	      // add left script bracket
	      if (htmlScript.left != null && match.left != null) {
	        result = getMatches(match.left, htmlScript.left);
	        offsetMatches(result, match.index);
	        matches = matches.concat(result);
	      }

	      // add right script bracket
	      if (htmlScript.right != null && match.right != null) {
	        result = getMatches(match.right, htmlScript.right);
	        offsetMatches(result, match.index + match[0].lastIndexOf(match.right));
	        matches = matches.concat(result);
	      }

	      for (var j = 0, l = matches.length; j < l; j++) {
	        matches[j].brushName = brushClass.brushName;
	      }return matches;
	    }
	  };

	  /**
	   * Main Highlither class.
	   * @constructor
	   */
	  sh.Highlighter = function () {
	    // not putting any code in here because of the prototype inheritance
	  };

	  sh.Highlighter.prototype = {
	    /**
	     * Returns value of the parameter passed to the highlighter.
	     * @param {String} name				Name of the parameter.
	     * @param {Object} defaultValue		Default value.
	     * @return {Object}					Returns found value or default value otherwise.
	     */
	    getParam: function getParam(name, defaultValue) {
	      var result = this.params[name];
	      return toBoolean(result == null ? defaultValue : result);
	    },

	    /**
	     * Shortcut to document.createElement().
	     * @param {String} name		Name of the element to create (DIV, A, etc).
	     * @return {HTMLElement}	Returns new HTML element.
	     */
	    create: function create(name) {
	      return document.createElement(name);
	    },

	    /**
	     * Applies all regular expression to the code and stores all found
	     * matches in the `this.matches` array.
	     * @param {Array} regexList		List of regular expressions.
	     * @param {String} code			Source code.
	     * @return {Array}				Returns list of matches.
	     */
	    findMatches: function findMatches(regexList, code) {
	      var result = [];

	      if (regexList != null) for (var i = 0, l = regexList.length; i < l; i++) {
	        // BUG: length returns len+1 for array if methods added to prototype chain (oising@gmail.com)
	        if (_typeof(regexList[i]) == "object") result = result.concat(getMatches(code, regexList[i]));
	      } // sort and remove nested the matches
	      return this.removeNestedMatches(result.sort(matchesSortCallback));
	    },

	    /**
	     * Checks to see if any of the matches are inside of other matches.
	     * This process would get rid of highligted strings inside comments,
	     * keywords inside strings and so on.
	     */
	    removeNestedMatches: function removeNestedMatches(matches) {
	      // Optimized by Jose Prado (http://joseprado.com)
	      for (var i = 0, l = matches.length; i < l; i++) {
	        if (matches[i] === null) continue;

	        var itemI = matches[i],
	            itemIEndPos = itemI.index + itemI.length;

	        for (var j = i + 1, l = matches.length; j < l && matches[i] !== null; j++) {
	          var itemJ = matches[j];

	          if (itemJ === null) continue;else if (itemJ.index > itemIEndPos) break;else if (itemJ.index == itemI.index && itemJ.length > itemI.length) matches[i] = null;else if (itemJ.index >= itemI.index && itemJ.index < itemIEndPos) matches[j] = null;
	        }
	      }

	      return matches;
	    },

	    /**
	     * Creates an array containing integer line numbers starting from the 'first-line' param.
	     * @return {Array} Returns array of integers.
	     */
	    figureOutLineNumbers: function figureOutLineNumbers(code) {
	      var lines = [],
	          firstLine = parseInt(this.getParam('first-line'));

	      eachLine(code, function (line, index) {
	        lines.push(index + firstLine);
	      });

	      return lines;
	    },

	    /**
	     * Determines if specified line number is in the highlighted list.
	     */
	    isLineHighlighted: function isLineHighlighted(lineNumber) {
	      var list = this.getParam('highlight', []);

	      if ((typeof list === "undefined" ? "undefined" : _typeof(list)) != 'object' && list.push == null) list = [list];

	      return indexOf(list, lineNumber.toString()) != -1;
	    },

	    /**
	     * Generates HTML markup for a single line of code while determining alternating line style.
	     * @param {Integer} lineNumber	Line number.
	     * @param {String} code Line	HTML markup.
	     * @return {String}				Returns HTML markup.
	     */
	    getLineHtml: function getLineHtml(lineIndex, lineNumber, code) {
	      var classes = ['line', 'number' + lineNumber, 'index' + lineIndex, 'alt' + (lineNumber % 2 == 0 ? 1 : 2).toString()];

	      if (this.isLineHighlighted(lineNumber)) classes.push('highlighted');

	      if (lineNumber == 0) classes.push('break');

	      return '<div class="' + classes.join(' ') + '">' + code + '</div>';
	    },

	    /**
	     * Generates HTML markup for line number column.
	     * @param {String} code			Complete code HTML markup.
	     * @param {Array} lineNumbers	Calculated line numbers.
	     * @return {String}				Returns HTML markup.
	     */
	    getLineNumbersHtml: function getLineNumbersHtml(code, lineNumbers) {
	      var html = '',
	          count = splitLines(code).length,
	          firstLine = parseInt(this.getParam('first-line')),
	          pad = this.getParam('pad-line-numbers');

	      if (pad == true) pad = (firstLine + count - 1).toString().length;else if (isNaN(pad) == true) pad = 0;

	      for (var i = 0; i < count; i++) {
	        var lineNumber = lineNumbers ? lineNumbers[i] : firstLine + i,
	            code = lineNumber == 0 ? sh.config.space : padNumber(lineNumber, pad);

	        html += this.getLineHtml(i, lineNumber, code);
	      }

	      return html;
	    },

	    /**
	     * Splits block of text into individual DIV lines.
	     * @param {String} code			Code to highlight.
	     * @param {Array} lineNumbers	Calculated line numbers.
	     * @return {String}				Returns highlighted code in HTML form.
	     */
	    getCodeLinesHtml: function getCodeLinesHtml(html, lineNumbers) {
	      html = trim(html);

	      var lines = splitLines(html),
	          padLength = this.getParam('pad-line-numbers'),
	          firstLine = parseInt(this.getParam('first-line')),
	          html = '',
	          brushName = this.getParam('brush');

	      for (var i = 0, l = lines.length; i < l; i++) {
	        var line = lines[i],
	            indent = /^(&nbsp;|\s)+/.exec(line),
	            spaces = null,
	            lineNumber = lineNumbers ? lineNumbers[i] : firstLine + i;
	        ;

	        if (indent != null) {
	          spaces = indent[0].toString();
	          line = line.substr(spaces.length);
	          spaces = spaces.replace(' ', sh.config.space);
	        }

	        line = trim(line);

	        if (line.length == 0) line = sh.config.space;

	        html += this.getLineHtml(i, lineNumber, (spaces != null ? '<code class="' + brushName + ' spaces">' + spaces + '</code>' : '') + line);
	      }

	      return html;
	    },

	    /**
	     * Returns HTML for the table title or empty string if title is null.
	     */
	    getTitleHtml: function getTitleHtml(title) {
	      return title ? '<caption>' + title + '</caption>' : '';
	    },

	    /**
	     * Finds all matches in the source code.
	     * @param {String} code		Source code to process matches in.
	     * @param {Array} matches	Discovered regex matches.
	     * @return {String} Returns formatted HTML with processed mathes.
	     */
	    getMatchesHtml: function getMatchesHtml(code, matches) {
	      var pos = 0,
	          result = '',
	          brushName = this.getParam('brush', '');

	      function getBrushNameCss(match) {
	        var result = match ? match.brushName || brushName : brushName;
	        return result ? result + ' ' : '';
	      };

	      // Finally, go through the final list of matches and pull the all
	      // together adding everything in between that isn't a match.
	      for (var i = 0, l = matches.length; i < l; i++) {
	        var match = matches[i],
	            matchBrushName;

	        if (match === null || match.length === 0) continue;

	        matchBrushName = getBrushNameCss(match);

	        result += wrapLinesWithCode(code.substr(pos, match.index - pos), matchBrushName + 'plain') + wrapLinesWithCode(match.value, matchBrushName + match.css);

	        pos = match.index + match.length + (match.offset || 0);
	      }

	      // don't forget to add whatever's remaining in the string
	      result += wrapLinesWithCode(code.substr(pos), getBrushNameCss() + 'plain');

	      return result;
	    },

	    /**
	     * Generates HTML markup for the whole syntax highlighter.
	     * @param {String} code Source code.
	     * @return {String} Returns HTML markup.
	     */
	    getHtml: function getHtml(code) {
	      var html = '',
	          classes = ['syntaxhighlighter'],
	          tabSize,
	          matches,
	          lineNumbers;

	      // process light mode
	      if (this.getParam('light') == true) this.params.toolbar = this.params.gutter = false;

	      className = 'syntaxhighlighter';

	      if (this.getParam('collapse') == true) classes.push('collapsed');

	      if ((gutter = this.getParam('gutter')) == false) classes.push('nogutter');

	      // add custom user style name
	      classes.push(this.getParam('class-name'));

	      // add brush alias to the class name for custom CSS
	      classes.push(this.getParam('brush'));

	      code = trimFirstAndLastLines(code).replace(/\r/g, ' ') // IE lets these buggers through
	      ;

	      tabSize = this.getParam('tab-size');

	      // replace tabs with spaces
	      code = this.getParam('smart-tabs') == true ? processSmartTabs(code, tabSize) : processTabs(code, tabSize);

	      // unindent code by the common indentation
	      if (this.getParam('unindent')) code = unindent(code);

	      if (gutter) lineNumbers = this.figureOutLineNumbers(code);

	      // find matches in the code using brushes regex list
	      matches = this.findMatches(this.regexList, code);
	      // processes found matches into the html
	      html = this.getMatchesHtml(code, matches);
	      // finally, split all lines so that they wrap well
	      html = this.getCodeLinesHtml(html, lineNumbers);

	      // finally, process the links
	      if (this.getParam('auto-links')) html = processUrls(html);

	      if (typeof navigator != 'undefined' && navigator.userAgent && navigator.userAgent.match(/MSIE/)) classes.push('ie');

	      html = '<div id="' + getHighlighterId(this.id) + '" class="' + classes.join(' ') + '">' + (this.getParam('toolbar') ? sh.toolbar.getHtml(this) : '') + '<table border="0" cellpadding="0" cellspacing="0">' + this.getTitleHtml(this.getParam('title')) + '<tbody>' + '<tr>' + (gutter ? '<td class="gutter">' + this.getLineNumbersHtml(code) + '</td>' : '') + '<td class="code">' + '<div class="container">' + html + '</div>' + '</td>' + '</tr>' + '</tbody>' + '</table>' + '</div>';

	      return html;
	    },

	    /**
	     * Highlights the code and returns complete HTML.
	     * @param {String} code     Code to highlight.
	     * @return {Element}        Returns container DIV element with all markup.
	     */
	    getDiv: function getDiv(code) {
	      if (code === null) code = '';

	      this.code = code;

	      var div = this.create('div');

	      // create main HTML
	      div.innerHTML = this.getHtml(code);

	      // set up click handlers
	      if (this.getParam('toolbar')) attachEvent(findElement(div, '.toolbar'), 'click', sh.toolbar.handler);

	      if (this.getParam('quick-code')) attachEvent(findElement(div, '.code'), 'dblclick', quickCodeHandler);

	      return div;
	    },

	    /**
	     * Initializes the highlighter/brush.
	     *
	     * Constructor isn't used for initialization so that nothing executes during necessary
	     * `new SyntaxHighlighter.Highlighter()` call when setting up brush inheritence.
	     *
	     * @param {Hash} params Highlighter parameters.
	     */
	    init: function init(params) {
	      this.id = guid();

	      // register this instance in the highlighters list
	      storeHighlighter(this);

	      // local params take precedence over defaults
	      this.params = merge(sh.defaults, params || {});

	      // process light mode
	      if (this.getParam('light') == true) this.params.toolbar = this.params.gutter = false;
	    },

	    /**
	     * Converts space separated list of keywords into a regular expression string.
	     * @param {String} str    Space separated keywords.
	     * @return {String}       Returns regular expression string.
	     */
	    getKeywords: function getKeywords(str) {
	      str = str.replace(/^\s+|\s+$/g, '').replace(/\s+/g, '|');

	      return '\\b(?:' + str + ')\\b';
	    },

	    /**
	     * Makes a brush compatible with the `html-script` functionality.
	     * @param {Object} regexGroup Object containing `left` and `right` regular expressions.
	     */
	    forHtmlScript: function forHtmlScript(regexGroup) {
	      var regex = { 'end': regexGroup.right.source };

	      if (regexGroup.eof) regex.end = "(?:(?:" + regex.end + ")|$)";

	      this.htmlScript = {
	        left: { regex: regexGroup.left, css: 'script' },
	        right: { regex: regexGroup.right, css: 'script' },
	        code: XRegExp("(?<left>" + regexGroup.left.source + ")" + "(?<code>.*?)" + "(?<right>" + regex.end + ")", "sgi")
	      };
	    }
	  }; // end of Highlighter

	  return sh;
	}(); // end of anonymous function

	// CommonJS
	typeof exports != 'undefined' ? exports.SyntaxHighlighter = SyntaxHighlighter : null;

	/*** EXPORTS FROM exports-loader ***/
	module.exports = SyntaxHighlighter;

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(16), __webpack_require__(31), __webpack_require__(33), __webpack_require__(63)], __WEBPACK_AMD_DEFINE_RESULT__ = function (base, Resource, Tab, LeftListing, VertexArrayView) {

	    var VertexArraysTab = function VertexArraysTab(w) {
	        var outer = Tab.divClass("window-right-outer");
	        var right = Tab.divClass("window-right");
	        var inspector = Tab.divClass("window-inspector");
	        inspector.classList.add("window-vertexarray-inspector");
	        var vertexArray = Tab.divClass("window-vertexarray-outer");

	        inspector.appendChild(Tab.divClass("surface-inspector-toolbar", "toolbar"));
	        inspector.appendChild(Tab.divClass("surface-inspector-inner", "inspector"));
	        inspector.appendChild(Tab.divClass("surface-inspector-statusbar"));
	        vertexArray.appendChild(Tab.divClass("vertexarray-listing", "scrolling contents"));
	        right.appendChild(inspector);
	        right.appendChild(vertexArray);
	        outer.appendChild(right);
	        outer.appendChild(Tab.windowLeft({ listing: "frame list", toolbar: "buttons" }));

	        this.el.appendChild(outer);

	        this.listing = new LeftListing(w, this.el, "VertexArray", function (el, vertexArray) {
	            var gl = w.context;

	            if (vertexArray.status == Resource.DEAD) {
	                el.className += " vertexarray-item-deleted";
	            }

	            var number = document.createElement("div");
	            number.className = "vertexarray-item-number";
	            number.textContent = vertexArray.getName();
	            el.appendChild(number);

	            vertexArray.modified.addListener(this, function (vertexArray) {
	                // TODO: refresh view if selected
	                //console.log("refresh vertexArray row");

	                // Type may have changed - update it
	                el.className = el.className.replace(" vertexarray-item-array", "").replace(" vertexarray-item-element-array", "");
	            });
	            vertexArray.deleted.addListener(this, function (vertexArray) {
	                el.className += " vertexarray-item-deleted";
	            });
	        });
	        this.vertexArrayView = new VertexArrayView(w, this.el);

	        this.listing.valueSelected.addListener(this, function (vertexArray) {
	            this.vertexArrayView.setVertexArray(vertexArray);
	        });

	        var scrollStates = {};
	        this.lostFocus.addListener(this, function () {
	            scrollStates.listing = this.listing.getScrollState();
	        });
	        this.gainedFocus.addListener(this, function () {
	            this.listing.setScrollState(scrollStates.listing);
	        });

	        // Append vertexArrays already present
	        var context = w.context;
	        var vertexArrays = context.resources.getResources("WebGLVertexArrayObject");
	        for (var n = 0; n < vertexArrays.length; n++) {
	            var vertexArray = vertexArrays[n];
	            this.listing.appendValue(vertexArray);
	        }

	        // Listen for changes
	        context.resources.resourceRegistered.addListener(this, function (resource) {
	            if (base.typename(resource.target) == "WebGLVertexArrayObject") {
	                this.listing.appendValue(resource);
	            }
	        });

	        // When we lose focus, reselect the vertexArray - shouldn't mess with things too much, and also keeps the DOM small if the user had expanded things
	        this.lostFocus.addListener(this, function () {
	            if (this.listing.previousSelection) {
	                this.listing.selectValue(this.listing.previousSelection.value);
	            }
	        });

	        this.layout = function () {
	            this.vertexArrayView.layout();
	        };

	        this.refresh = function () {
	            this.vertexArrayView.setVertexArray(this.vertexArrayView.currentVertexArray);
	        };
	    };

	    return VertexArraysTab;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(40), __webpack_require__(39)], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers, traceLine) {

	    var VertexArrayView = function VertexArrayView(w, elementRoot) {
	        var self = this;
	        this.window = w;
	        this.elements = {
	            view: elementRoot.getElementsByClassName("window-right")[0],
	            listing: elementRoot.getElementsByClassName("vertexarray-listing")[0]
	        };

	        this.currentVertexArray = null;
	    };

	    VertexArrayView.prototype.layout = function () {};

	    function appendHistoryLine(gl, el, vertexArray, call) {
	        traceLine.appendHistoryLine(gl, el, call);

	        // TODO: other custom stuff?
	    }

	    function generateVertexArrayHistory(gl, el, vertexArray, version) {
	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-secondary";
	        titleDiv.textContent = "History";
	        el.appendChild(titleDiv);

	        var rootEl = document.createElement("div");
	        rootEl.className = "vertexarray-history";
	        el.appendChild(rootEl);

	        for (var n = 0; n < version.calls.length; n++) {
	            var call = version.calls[n];
	            appendHistoryLine(gl, rootEl, vertexArray, call);
	        }
	    };

	    function generateBufferValue(buffer) {
	        if (buffer) {
	            if (buffer.target) {
	                return "[" + buffer.getName() + "]";
	            }
	            return "**unknown buffer";
	        }
	        return "null";
	    }

	    // Do I want the buffer at a certain state?
	    function addBufferClickHandler(window, elem, buffer) {
	        if (buffer && buffer.target) {
	            elem.addEventListener('click', function (e) {
	                window.showBuffer(buffer);
	            });
	            elem.className = elem.className + " vertexattrib-clickable";
	        }
	    }

	    function generateVertexArrayDisplay(view, gl, el, vertexArray, version) {
	        var titleDiv = document.createElement("div");
	        titleDiv.className = "info-title-master";
	        titleDiv.textContent = vertexArray.getName();
	        el.appendChild(titleDiv);

	        {
	            var table = document.createElement("table");
	            table.className = "info-parameters";

	            var tr = document.createElement("tr");
	            tr.className = "info-parameter-row";
	            helpers.appendElement(tr, "td", "ELEMENT_ARRAY_BUFFER");
	            var bufElem = helpers.ui.appendElement(tr, "td", generateBufferValue(version.extras.elementBuffer.buffer), "vertexattrib-buffer");
	            addBufferClickHandler(view.window, bufElem, version.extras.elementBuffer.buffer);

	            table.appendChild(tr);
	            el.appendChild(table);
	        }

	        helpers.ui.appendbr(el);

	        {
	            var _table = document.createElement("table");
	            _table.className = "vertexarray-struct";

	            var _tr = document.createElement("tr");
	            helpers.appendElement(_tr, "th", "index");
	            helpers.appendElement(_tr, "th", "enabled");
	            helpers.appendElement(_tr, "th", "size");
	            helpers.appendElement(_tr, "th", "type");
	            helpers.appendElement(_tr, "th", "normalized");
	            helpers.appendElement(_tr, "th", "stride");
	            helpers.appendElement(_tr, "th", "offset");
	            helpers.appendElement(_tr, "th", "divisor");
	            helpers.appendElement(_tr, "th", "buffer");
	            helpers.appendElement(_tr, "th", "value");
	            _table.appendChild(_tr);

	            var defaultAttrib = {
	                enabled: false,
	                value: [0, 0, 0, 1],
	                size: 4,
	                type: gl.FLOAT,
	                normalize: false,
	                stride: 0,
	                offset: 0,
	                buffer: null,
	                divisor: 0
	            };
	            var attributes = version.extras.attributes;
	            var maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	            for (var n = 0; n < maxAttributes; ++n) {
	                var attribute = attributes[n] || defaultAttrib;
	                var _tr2 = document.createElement("tr");
	                _tr2.className = attribute.enabled ? "vertexattrib-enabled" : "vertexattrib-disabled";

	                helpers.appendElement(_tr2, "td", n, "vertexattrib-index");
	                helpers.appendElement(_tr2, "td", attribute.enabled ? "●" : "", "vertexattrib-enabled");
	                helpers.appendElement(_tr2, "td", attribute.size, "vertexattrib-size");
	                helpers.appendElement(_tr2, "td", glc.enumToString(attribute.type), "vertexattrib-type");
	                helpers.appendElement(_tr2, "td", attribute.normalized ? "true" : "false", "vertexattrib-normalized");
	                helpers.appendElement(_tr2, "td", attribute.stride, "vertexattrib-stride");
	                helpers.appendElement(_tr2, "td", attribute.offset, "vertexattrib-offset");
	                helpers.appendElement(_tr2, "td", attribute.divisor || defaultAttrib.divisor, "vertexattrib-divisor");
	                var _bufElem = helpers.appendElement(_tr2, "td", generateBufferValue(attribute.buffer), "vertexattrib-buffer");
	                addBufferClickHandler(view.window, _bufElem, attribute.buffer);
	                helpers.appendElement(_tr2, "td", attribute.value || defaultAttrib.value, "vertexattrib-value");

	                _table.appendChild(_tr2);
	            }

	            el.appendChild(_table);
	        }

	        helpers.appendbr(el);
	        helpers.appendSeparator(el);

	        generateVertexArrayHistory(gl, el, vertexArray, version);
	        helpers.appendbr(el);

	        var frame = gl.ui.controller.currentFrame;
	        if (frame) {
	            helpers.appendSeparator(el);
	            traceLine.generateUsageList(gl, el, frame, vertexArray);
	            helpers.appendbr(el);
	        }

	        helpers.appendSeparator(el);
	        helpers.appendbr(el);
	    }

	    VertexArrayView.prototype.setVertexArray = function (vertexArray) {
	        this.currentVertexArray = vertexArray;

	        var node = this.elements.listing;
	        while (node.hasChildNodes()) {
	            node.removeChild(node.firstChild);
	        }
	        if (vertexArray) {
	            var version;
	            switch (this.window.activeVersion) {
	                case null:
	                    version = vertexArray.currentVersion;
	                    break;
	                case "current":
	                    var frame = this.window.controller.currentFrame;
	                    if (frame) {
	                        version = frame.findResourceVersion(vertexArray);
	                    }
	                    version = version || vertexArray.currentVersion; // Fallback to live
	                    break;
	            }

	            // Setup user preview options if not defined
	            var lastDrawState = version.lastDrawState;
	            if (!vertexArray.previewOptions && lastDrawState) {
	                var elementArrayBufferArray = null;
	                if (lastDrawState.elementArrayBuffer) {
	                    elementArrayBufferArray = [lastDrawState.elementArrayBuffer, null];
	                    // TODO: pick the right version of the ELEMENT_ARRAY_BUFFER
	                    elementArrayBufferArray[1] = elementArrayBufferArray[0].currentVersion;
	                }
	            }

	            generateVertexArrayDisplay(this, this.window.context, this.elements.listing, vertexArray, version);
	        }

	        this.elements.listing.scrollTop = 0;
	    };

	    return VertexArrayView;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ })
/******/ ]);