;

var visualisations = (function($, createjs, document, visualisations, undefined) {

    visualisations.bar = visualisations.bar || {};

    visualisations.bar.simple = function(id, settings) {

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
            timeSkip: 0,
            borderThickness: 0,
            placement: "middle", // "bottom", "top", "middle" are valid values
            maxWidth: 0,
            circleOffsetX: 0, // negative value = to the left, positive value is to the right
            circleSize: 200,
            barWidth: 10,
            strength: 2,
            reduceSize: true, // scales bars to zero initialy ( default : true )
            alpha: 1,
            enabled: true,
            shadow: false,
            shadowColor: "white",
            shadowSize: 10
        }

        scope.canvas = null;
        scope.parent = null;

        scope.gameObject = new createjs.Container();

        scope.settings = $.extend(_DEFAULTS, settings);

        _this.init = function() {

            if (!createjs) {
                console.error("This visual requires CreateJS to operate!");
            }

            _this.bind();
        }

        _this.bind = function() {

        }

        scope.update = function(analyzer) {

            var data = analyzer;

            _this.draw(data);
        }

        _this.draw = function(data) {

            if (!scope.settings.enabled) {
                return;
            }

            var container = new createjs.Container();

            if (scope.settings.shadow) {
                container.shadow = new createjs.Shadow(scope.settings.shadowColor, 0, 0, scope.settings.shadowSize);
            }

            container.alpha = scope.settings.alpha;

            var canvas_w = scope.canvas.width;
            var canvas_h = scope.canvas.height;
            var canvas_m = canvas_h * 0.5;

            // place container in the center
            var maxWidth = scope.settings.maxWidth || scope.canvas.width;

            container.x = (canvas_w - maxWidth) * 0.5;

            var x_spacing = maxWidth / scope.settings.precision;

            for (var i = 0; i < scope.settings.precision; i++) {

                var bar = new createjs.Shape();
                var barSize = data[i] * scope.settings.strength;

                if (scope.settings.reduceSize) {
                    var minValue = Math.min(...data);
                    barSize -= (minValue * scope.settings.strength);
                }

                if (scope.settings.borderThickness > 0) {
                    bar.graphics.f(scope.settings.fillColor).s(scope.settings.borderColor).ss(scope.settings.borderThickness).dr(0, 0, scope.settings.barWidth, barSize);
                } else {
                    bar.graphics.f(scope.settings.fillColor).dr(0, 0, scope.settings.barWidth, barSize);
                }

                bar.x = i * x_spacing;
                bar.regX = -scope.settings.barWidth / 2;

                if (scope.settings.placement === "bottom") {
                    bar.y = canvas_h - barSize;
                } else if (scope.settings.placement === "middle") {
                    bar.y = canvas_h * 0.5;
                    bar.regY = (barSize) * 0.5;
                }

                if (scope.settings.type === "circle") {
                    // rotate the bars
                    bar.rotation = 360 * (i / scope.settings.precision);
                    bar.regY += scope.settings.circleSize;
                    bar.x = 0;

                    container.x = (canvas_w * 0.5);
                    bar.regX = scope.settings.barWidth / 2;
                }

                container.addChild(bar);
            }

            scope.gameObject.addChild(container);

            if (scope.settings.fade) {
                createjs.Tween.get(container).to({
                    alpha: 0
                }, scope.settings.fadeDuration).call(function() {
                    _this.removeGameObject(container)
                });
            } else {
                setTimeout(function() {
                    _this.removeGameObject(container)
                }, 0);
            }

            if (!_this.variables.isRotating && scope.settings.rotate) {
                createjs.Tween.get(scope.gameObject, {
                    loop: true,
                    override: true
                }).to({
                    rotation: 360
                }, scope.settings.rotateDuration);

                _this.variables.isRotating = true;

            } else if (_this.variables.isRotating && !scope.settings.rotate) {
                createjs.Tween.get(scope.gameObject, {
                    override: true
                }).set({
                    rotation: 0
                });
                _this.variables.isRotating = false;
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

    visualisations.bar.rainbowSimple = function(id, visualizer, settings) {

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

            enabled: true,

            strengthMultiplier: 1,

            barGap: 20,
            barWidth: 5,

            color: null,

            barsVerticalPosition: 0, // percentage from top
            barsHorizontalPosition: 0,

            hideNoSound: false,

            glowEnabled: false,
            glowSize: 3,
            glowColor: "white",

            rotation: 0,

            lineCapsType: 1,
            heightLimit: 0,

            verticalGrowthOffset: 100,

            enableSplit: false,
            splitAlpha: 0.3,

            enableRotateColours: false,
            rotateRainbowSpeedMultiplier: 1,
            rotateColoursL2R: false,
        }

        scope.canvas = null;
        scope.parent = null;
        scope.stage = null;

        scope.gameObject = new createjs.Container();

        scope.settings = $.extend(_DEFAULTS, settings);

        _this.init = function() {

            if (!createjs) {
                console.error("This visual requires CreateJS to operate!");
            }

            visualizer.addVisual(scope);

            _this.bind();

            _this.create();

        }

        scope.reset = function() {
            // Resets
            scope.gameObject.removeAllChildren();
            grid = [];
            rainbow = [];
            rainbowHighlights = [];

            _this.bind();
            _this.create();
        }

        _this.bind = function() {

        }

        var rotateRainbowInterval = null;

        scope.setRotateRainbow = function(bool) {
            scope.settings.enableRotateColours = bool;
            clearInterval(rotateRainbowInterval);

            if (bool) {
                rotateRainbowInterval = setInterval(_this.shiftColours, 100 * scope.settings.rotateRainbowSpeedMultiplier);
            }
        }

        _this.shiftColours = function() {

            if (scope.settings.rotateColoursL2R) {
                rainbowFirst = rainbow.pop();
                rainbow.unshift(rainbowFirst);

                rainbowHighlightsFirst = rainbowHighlights.pop();
                rainbowHighlights.unshift(rainbowHighlightsFirst);
            } else {
                rainbowFirst = rainbow.shift();
                rainbow.push(rainbowFirst);

                rainbowHighlightsFirst = rainbowHighlights.shift();
                rainbowHighlights.push(rainbowHighlightsFirst);
            }
        }

        var rainbow = [];
        var rainbowHighlights = [];

        scope.setPrecision = function(number) {
            scope.settings.precision = number || 64;

            _this.create();
        }

        _this.create = function() {

            // create rainbow 
            rainbow = generateRainbowColorArray(scope.settings.precision);
            rainbowHighlights = generateRainbowColorArray(scope.settings.precision, null, 350, 256);
        }

        scope.update = function(analyzer) {

            var data = analyzer;

            data = analyzer.slice(0, 64);

            data = data.interpolate(scope.settings.precision);

            _this.draw(data);
        }

        _this.draw = function(data) {

            if (!scope.settings.enabled) {
                return;
            }

            if (!!scope.settings.hideNoSound) {
                if (data.average() < 1) {
                    return;
                }
            }

            scope.gameObject.removeAllChildren();

            var container = new createjs.Container();

            if (scope.settings.glowEnabled) {
                // container.shadow = new createjs.Shadow(scope.settings.glowColor, 0, 0, scope.settings.glowSize);
                //alert(scope.settings.glowSize + " " + scope.settings.glowColor);
                $(".main-movement").css({
                    "filter": "drop-shadow(0 0 " + scope.settings.glowSize + "px " + scope.settings.glowColor + ")",
                });
            } else {
                $(".main-movement").css({
                    "filter": "unset"
                });
            }

            var totalWidth = (data.length * (scope.settings.barGap)) - scope.settings.barGap; // subtract one barGap :)

            container.width = totalWidth;
            container.regX = totalWidth / 2 + (scope.settings.barsHorizontalPosition / 100) * -(scope.canvas.width / 2);

            container.x = (scope.canvas.width - container.width) / 2 + totalWidth / 2;

            container.y = scope.canvas.height / 2;
            container.regY = (scope.settings.barsVerticalPosition / 200) * scope.canvas.height;

            var spacing = scope.settings.barGap;

            for (x = 0; x < data.length; x++) {
                var bar = new createjs.Shape();

                bar.x = x * spacing;

                var length = data[x] * (scope.settings.strengthMultiplier);

                if (scope.settings.heightLimit && length > scope.settings.heightLimit) {
                    length = scope.settings.heightLimit;
                }

                var color = scope.settings.color || rainbow[x];

                var startPoint = ((200 - scope.settings.verticalGrowthOffset) / 100) * length;
                var endPoint = (scope.settings.verticalGrowthOffset / 100) * length;

                if (scope.settings.enableSplit) {

                    var rgbaColor = color.replace(")", "," + scope.settings.splitAlpha + ")").replace("rgb", "rgba");

                    bar.graphics.ss(scope.settings.barWidth, scope.settings.lineCapsType).s(color).mt(0, -startPoint).lt(0, 0).s(rgbaColor).mt(0, 0).lt(0, endPoint);
                } else {

                    bar.graphics.ss(scope.settings.barWidth, scope.settings.lineCapsType).s(color).mt(0, -startPoint).lt(0, endPoint);
                }

                container.addChild(bar);
            }

            container.rotation = scope.settings.rotation;

            scope.gameObject.addChild(container);

            scope.stage.addChild(scope.gameObject);
        }

        function generateRainbowColorArray(length, phase, center, width) {
            phase = phase || 5.9;
            center = center || 128;
            width = width || 256;
            frequency = Math.PI * 2 / length;

            var rainbow = [];

            for (var i = 0; i < length; ++i) {
                red = Math.sin(frequency * i + 2 + phase) * width + center;
                green = Math.sin(frequency * i + 0 + phase) * width + center;
                blue = Math.sin(frequency * i + 4 + phase) * width + center;

                rainbow.push('rgb(' + Math.round(red) + ',' + Math.round(green) + ',' + Math.round(blue) + ')');
            }

            return rainbow;
        }

        _this.removeGameObject = function(obj) {
            obj.parent.removeChild(obj);
        }

        _this.init();

        return scope;
    };

    return visualisations;

}(jQuery, createjs, document, visualisations || {}));