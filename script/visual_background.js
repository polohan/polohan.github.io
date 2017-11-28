;

var visualisations = (function($, createjs, document, visualisations, undefined) {

    visualisations.background = visualisations.background || {};

    visualisations.background.slices = function(id, settings) {

        // Declare a scope for Visualizer
        var scope = {};

        scope.id = id;

        // Bind 'this'
        var _this = this;

        // Private variables for within the plugin only ( no user/ code interaction )
        _this.variables = {
            analyser: null,
            isSkipping: false,
        }

        // The default values ( which can be overriden by supplied settings )
        var _DEFAULTS = {
            precision: 64, // Number of 'samples' taken from the song each frame ( lower this if you have issues with performance )
            mirror: false, // Mirror all frequency data ( so left is equal to right visually )
            rotate: false,
            rotateDuration: 30000,
            type: "normal", // "normal" or "circle" allowed ( default : normal )
            fade: false, // when fade set to 'true', the line will 'ghost'
            fadeDuration: 1000, // number in miliseconds
            borderColor: "rgba(255,255,255,1)",
            fillColor: "rgba(255,0,125,0.5)", // bar fillcolor ( default : transparent )
            timeSkip: 2000,
            borderThickness: 0,
            placement: "middle", // "bottom", "top", "middle" are valid values
            maxWidth: 0,
            circleOffsetX: 0, // negative value = to the left, positive value is to the right
            circleSize: 200,
            barWidth: 10,
            strength: 2,
            reduceSize: true, // scales bars to zero initialy ( default : true )
        }

        scope.canvas = null;
        scope.parent = null;

        scope.gameObject = new createjs.Container();

        scope.settings = $.extend(_DEFAULTS, settings);

        _this.init = function() {

            if (!createjs) { console.error("This visual requires CreateJS to operate!"); }

            _this.bind();
        }

        _this.bind = function() {

        }

        scope.update = function(analyzer) {

            var data;
            // declare data array
            if (scope.settings.mirror) {
                data = new Uint8Array(scope.settings.precision * 0.5);
            } else {
                data = new Uint8Array(scope.settings.precision);
            }

            // Get frequency data ( no wave for bars )
            analyzer.getByteFrequencyData(data);

            if (scope.settings.mirror) {
                var mirror = data.slice(0);
                mirror.reverse();

                newDataArray = new Uint8Array(scope.settings.precision);

                newDataArray.set(data, 0);
                newDataArray.set(mirror, scope.settings.precision * 0.5);

                data = newDataArray;
            }

            // If timeSkip is enabled, and is currently not skipping, then draw
            if (!_this.variables.isSkipping && scope.settings.timeSkip > 0) {

                _this.draw(data);
                // Set the new timeOut for the next draw
                setTimeout(function() {
                    _this.variables.isSkipping = false;
                    // Draw to the cnavas
                }, scope.settings.timeSkip);

                // Set skipping to true, to prevent calling the method again
                _this.variables.isSkipping = true;

            } else if (_this.variables.isSkipping && scope.settings.timeSkip <= 0) {

                // If skipping was enabled, but settings have been set to not skipping, disable it for the next update
                _this.variables.isSkipping = false;
            } else if (!_this.variables.isSkipping) {

                // If not skipping, draw each update
                _this.draw(data);
            }
        }

        _this.drawSegment = function(target, x, y, r, aStart, aEnd, step) {

            if (!step) step = 10;
            // More efficient to work in radians
            var degreesPerRadian = Math.PI / 180;
            aStart *= degreesPerRadian;
            aEnd *= degreesPerRadian;
            step *= degreesPerRadian;

            // Draw the segment
            target.graphics.moveTo(x, y);
            for (var theta = aStart; theta < aEnd; theta += Math.min(step, aEnd - theta)) {
                target.graphics.lineTo(x + r * Math.cos(theta), y + r * Math.sin(theta));
            }
            target.graphics.lineTo(x + r * Math.cos(aEnd), y + r * Math.sin(aEnd));
            target.graphics.lineTo(x, y);
        };

        _this.draw = function(data) {

            var container = new createjs.Container();

            var canvas_w = scope.canvas.width;
            var canvas_h = scope.canvas.height;
            var canvas_m = canvas_h * 0.5;

            var size = 300; // doorsnee
            var radius = size / 2;

            // place container in the center
            var maxWidth = scope.settings.maxWidth || scope.canvas.width;

            container.x = (canvas_w - maxWidth) * 0.5;

            var degrees = 360 / scope.settings.precision;

            var random_offset = Math.random() * 90;

            for (var i = 0; i < scope.settings.precision; i++) {

                var bar = new createjs.Shape();

                bar.graphics.ss(1);
                bar.graphics.rf(["rgba(255,0,0,0)", "rgba(255,0,0,0.8)", "rgba(255,128,0,0.4)", "rgba(255,0,0,0.8)", "rgba(255,0,0,0)"], [0.1, 0.15, 0.3, 0.8, 0.9], 0, 0, 0, 0, 0, radius);
                bar.graphics.rs(["rgba(255,0,0,0)", "rgba(255,0,0,1)", "rgba(255,128,0,1)", "rgba(255,0,0,1)", "rgba(255,0,0,0)"], [0.1, 0.15, 0.3, 0.8, 0.9], 0, 0, 0, 0, 0, radius);

                _this.drawSegment(bar, 0, 0, radius, i * degrees + random_offset, (i + 2) * degrees + random_offset);

                // rotate the bars
                bar.rotation = 360 * (i / scope.settings.precision);
                bar.x = canvas_w / 2;
                bar.y = canvas_m;


                var random_time_offset = Math.random() * 6000;
                var degreesPerRadian = Math.PI / 180;

                var theta = ((i + 0.5) * degrees * 2 + random_offset) * degreesPerRadian;

                var movement = radius * 0.5;

                bar.alpha = 0;
                createjs.Tween.get(bar).wait(random_time_offset).to({ alpha: 0.5 }, 1000).to({ alpha: 0 }, 3000);

                createjs.Tween.get(bar).wait(random_time_offset).to({ scaleX: 5, scaleY: 5, x: canvas_w / 2 + movement * Math.cos(theta), y: canvas_m + movement * Math.sin(theta) }, 4000);

                // var start = new createjs.Shape();
                // start.graphics.f("black").drawCircle(bar.x,bar.y,30);

                // var end = new createjs.Shape();
                // start.graphics.f("black").drawCircle(bar.x + radius * Math.cos(theta),bar.y + radius * Math.sin(theta),30);

                //console.log("x: " + radius * Math.cos(theta) + ", y: " +  radius * Math.sin(theta));

                container.addChild(bar);
            }

            scope.gameObject.addChild(container);

            setTimeout(function() { _this.removeGameObject(container) }, 10000); // 3 x 2000


            if (!_this.variables.isRotating && scope.settings.rotate) {
                createjs.Tween.get(scope.gameObject, { loop: true, override: true }).to({ rotation: 360 }, scope.settings.rotateDuration);

                _this.variables.isRotating = true;
                scope.gameObject.scaleX = scope.gameObject.scaleY = 1.2;

            } else if (_this.variables.isRotating && !scope.settings.rotate) {
                createjs.Tween.get(scope.gameObject, { loop: true, override: true }).to({ rotation: 0 }, scope.settings.fadeDuration);

                _this.variables.isRotating = false;
                scope.gameObject.scaleX = scope.gameObject.scaleY = 1;
            }

            scope.gameObject.regX = scope.canvas.width * 0.5;
            scope.gameObject.regY = scope.canvas.height * 0.5;

            scope.gameObject.x = scope.canvas.width * 0.5;
            scope.gameObject.y = scope.canvas.height * 0.5;
        }

        _this.removeGameObject = function(obj) {
            obj.parent.removeChild(obj);
        }

        _this.init();

        return scope;
    };

    visualisations.background.spaceTravel = function(id, settings) {

        // Declare a scope for Visualizer
        var scope = {};

        scope.id = id;

        // Bind 'this'
        var _this = this;

        // Private variables for within the plugin only ( no user/ code interaction )
        _this.variables = {
            analyser: null,
            isSkipping: false,
        }

        // The default values ( which can be overriden by supplied settings )
        var _DEFAULTS = {
            precision: 64, // Number of 'samples' taken from the song each frame ( lower this if you have issues with performance )
            mirror: false, // Mirror all frequency data ( so left is equal to right visually )
            rotate: false,
            rotateDuration: 30000,
            type: "normal", // "normal" or "circle" allowed ( default : normal )
            fade: false, // when fade set to 'true', the line will 'ghost'
            fadeDuration: 1000, // number in miliseconds
            borderColor: "rgba(255,255,255,1)",
            fillColor: "rgba(255,0,125,0.5)", // bar fillcolor ( default : transparent )
            timeSkip: 2000,
            borderThickness: 0,
            placement: "middle", // "bottom", "top", "middle" are valid values
            maxWidth: 0,
            circleOffsetX: 0, // negative value = to the left, positive value is to the right
            circleSize: 200,
            barWidth: 10,
            strength: 2,
            reduceSize: true, // scales bars to zero initialy ( default : true )
        }

        scope.canvas = null;
        scope.parent = null;

        scope.gameObject = new createjs.Container();

        scope.settings = $.extend(_DEFAULTS, settings);

        _this.init = function() {

            if (!createjs) { console.error("This visual requires CreateJS to operate!"); }

            _this.bind();
        }

        _this.bind = function() {

        }

        scope.update = function(analyzer) {

            var data;
            // declare data array
            if (scope.settings.mirror) {
                data = new Uint8Array(scope.settings.precision * 0.5);
            } else {
                data = new Uint8Array(scope.settings.precision);
            }

            // Get frequency data ( no wave for bars )
            analyzer.getByteFrequencyData(data);

            if (scope.settings.mirror) {
                var mirror = data.slice(0);
                mirror.reverse();

                newDataArray = new Uint8Array(scope.settings.precision);

                newDataArray.set(data, 0);
                newDataArray.set(mirror, scope.settings.precision * 0.5);

                data = newDataArray;
            }

            // If timeSkip is enabled, and is currently not skipping, then draw
            if (!_this.variables.isSkipping && scope.settings.timeSkip > 0) {

                _this.draw(data);
                // Set the new timeOut for the next draw
                setTimeout(function() {
                    _this.variables.isSkipping = false;
                    // Draw to the cnavas
                }, scope.settings.timeSkip);

                // Set skipping to true, to prevent calling the method again
                _this.variables.isSkipping = true;

            } else if (_this.variables.isSkipping && scope.settings.timeSkip <= 0) {

                // If skipping was enabled, but settings have been set to not skipping, disable it for the next update
                _this.variables.isSkipping = false;
            } else if (!_this.variables.isSkipping) {

                // If not skipping, draw each update
                _this.draw(data);
            }
        }

        _this.drawSegment = function(target, x, y, r, aStart, aEnd, step) {

            if (!step) step = 10;
            // More efficient to work in radians
            var degreesPerRadian = Math.PI / 180;
            aStart *= degreesPerRadian;
            aEnd *= degreesPerRadian;
            step *= degreesPerRadian;

            // Draw the segment
            target.graphics.moveTo(x, y);
            for (var theta = aStart; theta < aEnd; theta += Math.min(step, aEnd - theta)) {
                target.graphics.lineTo(x + r * Math.cos(theta), y + r * Math.sin(theta));
            }
            target.graphics.lineTo(x + r * Math.cos(aEnd), y + r * Math.sin(aEnd));
            target.graphics.lineTo(x, y);
        };

        _this.draw = function(data) {

            var container = new createjs.Container();

            var canvas_w = scope.canvas.width;
            var canvas_h = scope.canvas.height;
            var canvas_m = canvas_h * 0.5;

            var size = 300; // doorsnee
            var radius = size / 2;

            // place container in the center
            var maxWidth = scope.settings.maxWidth || scope.canvas.width;

            container.x = (canvas_w - maxWidth) * 0.5;

            var degrees = 360 / scope.settings.precision;

            var random_offset = Math.random() * 90;

            for (var i = 0; i < scope.settings.precision; i++) {

                var bar = new createjs.Shape();

                bar.graphics.ss(1);
                bar.graphics.rf(["rgba(255,0,0,0)", "rgba(255,0,0,0.8)", "rgba(255,128,0,0.4)", "rgba(255,0,0,0.8)", "rgba(255,0,0,0)"], [0.1, 0.15, 0.3, 0.8, 0.9], 0, 0, 0, 0, 0, radius);
                bar.graphics.rs(["rgba(255,0,0,0)", "rgba(255,0,0,1)", "rgba(255,128,0,1)", "rgba(255,0,0,1)", "rgba(255,0,0,0)"], [0.1, 0.15, 0.3, 0.8, 0.9], 0, 0, 0, 0, 0, radius);

                _this.drawSegment(bar, 0, 0, radius, i * degrees + random_offset, (i + 2) * degrees + random_offset);

                // rotate the bars
                bar.rotation = 360 * (i / scope.settings.precision);
                bar.x = canvas_w / 2;
                bar.y = canvas_m;


                var random_time_offset = Math.random() * 6000;
                var degreesPerRadian = Math.PI / 180;

                var theta = ((i + 0.5) * degrees * 2 + random_offset) * degreesPerRadian;

                var movement = radius * 0.5;

                bar.alpha = 0;
                createjs.Tween.get(bar).wait(random_time_offset).to({ alpha: 0.5 }, 1000).to({ alpha: 0 }, 3000);

                createjs.Tween.get(bar).wait(random_time_offset).to({ scaleX: 5, scaleY: 5, x: canvas_w / 2 + movement * Math.cos(theta), y: canvas_m + movement * Math.sin(theta) }, 4000);

                // var start = new createjs.Shape();
                // start.graphics.f("black").drawCircle(bar.x,bar.y,30);

                // var end = new createjs.Shape();
                // start.graphics.f("black").drawCircle(bar.x + radius * Math.cos(theta),bar.y + radius * Math.sin(theta),30);

                //console.log("x: " + radius * Math.cos(theta) + ", y: " +  radius * Math.sin(theta));

                container.addChild(bar);
            }

            scope.gameObject.addChild(container);

            setTimeout(function() { _this.removeGameObject(container) }, 10000); // 3 x 2000


            if (!_this.variables.isRotating && scope.settings.rotate) {
                createjs.Tween.get(scope.gameObject, { loop: true, override: true }).to({ rotation: 360 }, scope.settings.rotateDuration);

                _this.variables.isRotating = true;
                scope.gameObject.scaleX = scope.gameObject.scaleY = 1.2;

            } else if (_this.variables.isRotating && !scope.settings.rotate) {
                createjs.Tween.get(scope.gameObject, { loop: true, override: true }).to({ rotation: 0 }, scope.settings.fadeDuration);

                _this.variables.isRotating = false;
                scope.gameObject.scaleX = scope.gameObject.scaleY = 1;
            }

            scope.gameObject.regX = scope.canvas.width * 0.5;
            scope.gameObject.regY = scope.canvas.height * 0.5;

            scope.gameObject.x = scope.canvas.width * 0.5;
            scope.gameObject.y = scope.canvas.height * 0.5;
        }

        _this.removeGameObject = function(obj) {
            obj.parent.removeChild(obj);
        }

        _this.init();

        return scope;
    };

    visualisations.background.beatMoveBlur = function(id, visualizer, settings) {

        // Declare a scope for Visualizer
        var scope = {};

        scope.id = id;

        // Bind 'this'
        var _this = this;

        // Private variables for within the plugin only ( no user/ code interaction )
        _this.variables = {
            image: null,
            previousImage: null,

            imageRotation: 0
        }

        // The default values ( which can be overriden by supplied settings )
        var _DEFAULTS = {
            enabled: true,

            strengthMultiplier: 1,

            rotationEnabled: false,
            rotationSpeedMultiplier: 1,
            rotationStrengthMultiplier: 1,

            scaleEnabled: false,
            scaleStrengthMultiplier: 1,

            blurEnabled: true,
            blurStrengthMultiplier: 1,

            lightEnabled: false,
            lightStrengthMultiplier: 1,

            slideshowDurationTypeMultiplier: 1, // 1, 60, 3600 ( seconds, minutes, hours )
            slideShowFadeDuration: 3000,
            slideShowShowTime: 5000,
        }

        scope.canvas = null;
        scope.parent = null;

        scope.gameObject = new createjs.Container();

        scope.settings = $.extend(_DEFAULTS, settings);

        _this.init = function() {

            if (!createjs) { console.error("This visual requires CreateJS to operate!"); }

            _this.variables.cursorPosition = _this.variables.cursorPosition || { x: $(document).width() / 2, y: $(document).height() / 2 };

            visualizer.addVisual(scope);

            // Remove from default stage
            scope.parent.stage.removeChild(scope.gameObject);

            // Override the default stage and canvas set by visualizer
            scope.stage = scope.parent.botStage;
            scope.canvas = scope.parent.botCanvas;

            scope.gameObject.name = "Visualizer Background Image"

            _this.bind();

            _this.create();

            scope.startRotationTween();
        }

        _this.bind = function() {

        }

        scope.resetTimeOut = function() {
            setTimeout();
        }

        scope.startSlideShow = function() {

            // Don't start twice :D
            if (!!slideshowStarted) { return; }

            slideshowStarted = true;
            scope.SlideShowNext();
        }

        var slideshowStarted = false;
        var nextSlideTimeOut = null;

        _this.setTimeOut = function() {
            if (!!nextSlideTimeOut) {
                clearTimeout(nextSlideTimeOut);
            }

            nextSlideTimeOut = setTimeout(function() {

                scope.SlideShowNext();

            }, scope.settings.slideShowShowTime + scope.settings.slideShowFadeDuration);
        }

        scope.SlideShowNext = function() {

            // Callback method
            var imageResponse = function(propertyName, filePath) {

                var path = "file:///" + filePath;

                scope.setImage(path);

                _this.setTimeOut();
            }

            // Actually call 
            window.wallpaperRequestRandomFileForProperty("directory", imageResponse);
        }

        scope.stopSlideShow = function(immediate) {

            slideshowStarted = false;

            clearTimeout(nextSlideTimeOut);

            _this.variables.previousImage = _this.variables.image;
            if (!!immediate) {
                _this.variables.previousImage = null;
            } else {
                createjs.Tween.get(_this.variables.previousImage).to({ alpha: 0 }, scope.settings.slideShowFadeDuration).call(function() {
                    _this.variables.previousImage = null;
                });
            }

            _this.variables.image = null;
        }

        scope.setImage = function(url, immediate) {

            if (!url) {
                _this.variables.image = null;
                return;
            }

            var img = new createjs.Bitmap(url);

            img.image.onload = function() {

                if (_this.variables.image) {
                    _this.variables.previousImage = _this.variables.image;
                }

                img.regX = img.image.width / 2;
                img.regY = img.image.height / 2;

                _this.variables.image = img;

                if (!immediate) {
                    _this.variables.image.alpha = 0;

                    createjs.Tween.get(_this.variables.image).to({ alpha: 1 }, scope.settings.slideShowFadeDuration).call(function() {
                        _this.variables.previousImage = null;
                    });
                }
            }
        }

        var imgRot = { r: 0 }

        scope.startRotationTween = function() {

            var deg = 15;
            var rotationSpeed = 2000;

            var mp = (1 / scope.settings.rotationSpeedMultiplier);

            rotationSpeed *= mp;

            createjs.Tween.get(imgRot, { override: true }).to({ r: -deg }, rotationSpeed, createjs.Ease.sineInOut).to({ r: deg }, rotationSpeed, createjs.Ease.sineInOut).call(scope.startRotationTween);
        }

        _this.create = function() {
            //_this.move();

            //_this.rotate();
        }

        // moveFrom = { x: 0, y: 0 };
        // rotation = { r: 0 };

        // _this.move = function() {

        //     moveToX = Math.random() * 100 - 50;
        //     moveToY = Math.random() * 100 - 50;

        //     createjs.Tween.get(moveFrom, { override: true }).to({ x: moveToX, y: moveToY }, 2000, createjs.Ease.sineInOut).call(_this.move);
        // }

        scope.update = function(analyzer) {

            if (!scope.settings.enabled) { return; }

            var data = analyzer;

            _this.draw(data);
        }

        _this.scaleImage = function(img, data) {

            var scale = img.scaleX;

            var baseMultiplier = _this.getBaseMultiplier(data);

            baseMultiplier -= 1;

            baseMultiplier *= scope.settings.scaleStrengthMultiplier;

            scale += baseMultiplier;

            img.scaleX = img.scaleY = scale;
        }

        _this.rotateImage = function(img) {

            rotateScaleDefault = 0.5;

            var strength_mp = scope.settings.rotationStrengthMultiplier;
            var mp = 0.8 * strength_mp - 0.3;

            //var mp = 0.2;

            var rotateDeg = imgRot.r * mp; // 0.2 - 1.2
            var rotateScale = rotateScaleDefault * mp; // 0.2 - 1.2

            var scale = 1 + rotateScale;

            img.rotation = rotateDeg;

            img.scaleY = img.scaleX *= scale;
        }

        _this.filterBackground = function(data) {
            //grab the context from your destination canvas

            var baseMultiplier = _this.getBaseMultiplier(data) - 1;
            var filter = "";

            if (scope.settings.blurEnabled) {

                var blurBaseMultiplier = baseMultiplier * 25;

                var blurMultiplier = blurBaseMultiplier * scope.settings.blurStrengthMultiplier;

                filter += "blur(" + blurMultiplier + "px) ";
            }

            if (scope.settings.lightEnabled) {

                var brightnessAddition = (baseMultiplier * baseMultiplier) * (scope.settings.lightStrengthMultiplier * scope.settings.lightStrengthMultiplier);

                brightnessAddition *= 500;

                brightnessAddition += 100;

                filter += "brightness(" + brightnessAddition + "%) ";
            }

            $(scope.canvas).css({
                "filter": filter
            });
        }

        _this.sizeImage = function(img) {
            var w = scope.canvas.width;
            var h = scope.canvas.height;

            var rh = h / img.image.height;
            var rw = w / img.image.width;

            var scale = 1;

            if (rw > rh) {
                scale = rw;
            } else {
                scale = rh;
            }

            img.regX = img.image.width / 2;
            img.regY = img.image.height / 2;

            img.x = w / 2;
            img.y = h / 2;

            img.scaleX = img.scaleY = scale;
        }

        _this.draw = function(data) {
            // Clean
            scope.gameObject.removeAllChildren();

            var container = new createjs.Container();


            if (!!_this.variables.previousImage) {

                _this.sizeImage(_this.variables.previousImage);

                if (scope.settings.scaleEnabled) {
                    _this.scaleImage(_this.variables.previousImage, data);
                }

                if (scope.settings.rotationEnabled) {
                    _this.rotateImage(_this.variables.previousImage);
                } else {
                    _this.variables.previousImage.rotation = 0;
                }

                if (scope.settings.blurEnabled || scope.settings.lightEnabled) {
                    _this.filterBackground(data);

                } else {
                    $(scope.canvas).css({
                        "filter": "none"
                    });
                }

                container.addChild(_this.variables.previousImage);
            }


            if (!!_this.variables.image) {

                _this.sizeImage(_this.variables.image);

                if (scope.settings.scaleEnabled) {
                    _this.scaleImage(_this.variables.image, data);
                }

                if (scope.settings.rotationEnabled) {
                    _this.rotateImage(_this.variables.image);
                } else {
                    _this.variables.image.rotation = 0;
                }

                if (scope.settings.blurEnabled || scope.settings.lightEnabled) {
                    _this.filterBackground(data);

                } else {
                    $(scope.canvas).css({
                        "filter": "none"
                    });
                }

                container.addChild(_this.variables.image);
            }

            // Add to object
            scope.gameObject.addChild(container);

            // Add to stage
            scope.stage.addChild(scope.gameObject);
        };

        var base = { opacity: 0 };

        _this.getBaseMultiplier = function(data) {

            var num = 0;

            for (x = 0; x < 5; x++) {
                num += data[x] + data[x + 64];
            }

            return num / 10000 + 1;
        }

        _this.removeGameObject = function(obj) {
            obj.parent.removeChild(obj);
        }

        _this.init();

        return scope;
    };

    return visualisations;

}(jQuery, createjs, document, visualisations || {}));