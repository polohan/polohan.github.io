;

var visualisations = (function($, createjs, document, visualisations, undefined) {

    visualisations.background = visualisations.background || {};

    visualisations.background.bubbles = function(id, settings) {

        // Declare a scope for Visualizer
        var scope = {};

        scope.id = id;

        // Bind 'this'
        var _this = this;

        // Private variables for within the plugin only ( no user/ code interaction )
        _this.variables = {
            analyser: null,
            objects: [],
            delayTime: new Date().getTime(),
            cursorPosition: null
        }

        // The default values ( which can be overriden by supplied settings )
        var _DEFAULTS = {
            rotate: false,
            rotateDuration: 30000,
            size: 200,
            strength: 2,
            spawnDelay: 100,
            maximumObjects: 100,
        }

        scope.canvas = null;
        scope.parent = null;

        scope.gameObject = new createjs.Container();

        scope.settings = $.extend(_DEFAULTS, settings);

        _this.init = function() {

            if (!createjs) { console.error("This visual requires CreateJS to operate!"); }

            _this.variables.cursorPosition = _this.variables.cursorPosition || { x: $(document).width() / 2, y: $(document).height() / 2 };

            _this.bind();
        }

        _this.bind = function() {
            $(document).on("mousemove", _this.cursorPos);
        }

        scope.update = function(analyzer) {

            var data = analyzer;

            var time = new Date().getTime();

            if (_this.variables.delayTime + scope.settings.spawnDelay < time) {

                _this.variables.delayTime = time;

                // If there is no or low sound, don't spawn items
                if (data.average() < 10) return;

                _this.spawn();
            }

            _this.draw(data);
        }

        _this.cursorPos = function(e) {
            var posx = posy = 0;
            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            _this.variables.cursorPosition.x = posx;
            _this.variables.cursorPosition.y = posy;
        }

        _this.spawn = function() {

            var obj = new createjs.Bitmap("img/bubble_6.png");

            obj.y = scope.canvas.height;
            obj.x = Math.random() * scope.canvas.width;

            obj.regY = obj.image.height / 2;
            obj.regX = obj.image.width / 2;

            speedMultiplier = (Math.random() * 1.5) + 0.5;

            obj.scaleX = obj.scaleY = (Math.random() * 0.02) + 0.01; // between 0.01 and 0.03
            var endScale = (Math.random() * 0.5) + 0.25; // between 0.25 and 0.75
            obj.alpha = 0;
            obj.speedMultiplier = speedMultiplier;

            createjs.Tween.get(obj).to({ scaleX: 0.5, scaleY: 0.5 }, 10000);
            createjs.Tween.get(obj).to({ alpha: 1 }, 250).to({ alpha: 0 }, 10000).call(function(tween) {
                scope.gameObject.removeChild(tween.target);
            });

            if (scope.settings.rotate) {
                createjs.Tween.get(obj).to({ rotate: 360 }, 10000);
            }

            scope.gameObject.addChild(obj);

            if (scope.gameObject.children.length > scope.settings.maximumObjects) {
                scope.gameObject.children.shift();
            }
        }

        _this.draw = function(data) {

            var movement = data.average();

            var mousemove = _this.variables.cursorPosition.x - (scope.canvas.width / 2);

            scope.gameObject.children.forEach(function(obj) {

                obj.y -= (movement / 10) * obj.speedMultiplier;
                obj.x += mousemove / 100;

                if (obj.y < -obj.image.width) {
                    scope.gameObject.removeChild(obj);
                }
            });
        }

        _this.removeGameObject = function(obj) {
            obj.parent.removeChild(obj);
        }

        _this.init();

        return scope;
    };

    visualisations.background.space = function(id, visualizer, settings) {

        // Declare a scope for Visualizer
        var scope = {};

        scope.id = id;

        // Bind 'this'
        var _this = this;

        // Private variables for within the plugin only ( no user/ code interaction )
        _this.variables = {
            analyser: null,
            objects: [],
            delayTime: new Date().getTime(),
            cursorPosition: null
        }

        // The default values ( which can be overriden by supplied settings )
        var _DEFAULTS = {
            enabled: true,
            strength: 2,

            spawnDelay: 500,
            burstSize: 10,
            maximumObjects: 200,

            animationSpeed: 10,
            minimumSound: 10,

            size: 15,
            rotate: true,

            color: null,

            offsetX: 0,
            offsetY: 0,

            rotateDuration: 5000,

            enabledIdle: false,
        }

        scope.canvas = null;
        scope.parent = null;

        scope.gameObject = new createjs.Container();

        scope.settings = $.extend(_DEFAULTS, settings);

        var rainbow = [];

        _this.init = function() {

            if (!createjs) { console.error("This visual requires CreateJS to operate!"); }

            _this.variables.cursorPosition = _this.variables.cursorPosition || { x: $(document).width() / 2, y: $(document).height() / 2 };

            scope.parent = visualizer;
            scope.canvas = $("#" + visualizer.settings.canvasId)[0];

            _this.bind();

            scope.parent.addVisual(scope);

            rainbow = generateRainbowColorArray(64);

            // Rotate the screen :D 
            scope.gameObject.regX = scope.canvas.width / 2;
            scope.gameObject.regY = scope.canvas.height / 2;

            scope.gameObject.x = scope.gameObject.regX;
            scope.gameObject.y = scope.gameObject.regY;
        }

        scope.setConfetti = function(enable) {
            if (!!enable) {
                scope.settings.enabled = true;
            } else {
                scope.settings.enabled = false;
            }
        }

        scope.setRotationSpeed = function(duration) {
            scope.settings.rotateDuration = duration;
        }

        scope.startRotation = function() {
            scope.settings.rotate = true;
            createjs.Tween.get(scope.gameObject, { override: true, loop: true }).to({ rotation: scope.gameObject.rotation + 360 }, scope.settings.rotateDuration);
        }

        scope.stopRotation = function() {
            scope.settings.rotate = false;
            createjs.Tween.get(scope.gameObject, { override: true }).set({ rotation: 0 });
        }

        _this.bind = function() {
            $(document).on("mousemove", _this.cursorPos);
        }

        scope.update = function(analyzer) {

            if (!scope.settings.enabled) { return; }
            if (!scope.settings.enabledIdle && scope.parent.settings.idle) { return; }

            var data = analyzer;

            var time = new Date().getTime();

            if (_this.variables.delayTime + scope.settings.spawnDelay < time) {

                _this.variables.delayTime = time;

                // If there is no or low sound, don't spawn items
                if (data.take(5).average() >= scope.settings.minimumSound) {
                    for (var x = 0; x < scope.settings.burstSize; x++) {
                        _this.spawn(data);
                    }
                }
            }

            _this.draw(data);
        }

        _this.cursorPos = function(e) {
            var posx = posy = 0;
            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            _this.variables.cursorPosition.x = posx;
            _this.variables.cursorPosition.y = posy;
        }

        _this.spawn = function(data) {

            var obj = new createjs.Shape(); //new createjs.Bitmap("img/bubble_6.png");

            var radius = scope.settings.size;

            var color = scope.settings.color || rainbow[Math.floor(Math.random() * rainbow.length)];

            obj.graphics.f(color).drawCircle(0, 0, radius);

            var midY = scope.canvas.height / 2;
            var midX = scope.canvas.width / 2;

            var fragmentX = midX / 100;
            var fragmentY = midY / 100;

            obj.x = midX + (fragmentX * scope.settings.offsetX);
            obj.y = midY + (fragmentY * scope.settings.offsetY)

            obj.targetY = Math.random() * (scope.canvas.height + 2 * radius) - radius;
            obj.targetX = Math.random() * (scope.canvas.width + 2 * radius) - radius;

            obj.regY = radius / 2;
            obj.regX = radius / 2;

            //speedMultiplier = (Math.random() * 1.5) + 0.5;
            speedMultiplier = _this.getBaseMultiplier(data);

            obj.scaleX = obj.scaleY = (Math.random() * 0.02) + 0.01; // between 0.01 and 0.03
            var endScale = (Math.random() * 0.5) + 0.25; // between 0.25 and 0.75
            obj.alpha = 0;
            obj.speedMultiplier = speedMultiplier;


            var animSpeed = 10000 / scope.settings.animationSpeed;
            var random = Math.random() + 0.5; // 0.5 - 1.5;
            animSpeed *= random;

            var movementSpeed = animSpeed / speedMultiplier;

            if (movementSpeed < animSpeed) { animSpeed = movementSpeed; }

            createjs.Tween.get(obj).to({ scaleX: 0.5, scaleY: 0.5 }, animSpeed);
            createjs.Tween.get(obj).to({ alpha: 1 }, animSpeed * 0.1).to({ alpha: 0 }, animSpeed * 0.9).call(function(tween) {
                scope.gameObject.removeChild(tween.target);
            });

            createjs.Tween.get(obj).to({ x: obj.targetX, y: obj.targetY }, movementSpeed);

            if (scope.settings.rotate) {
                createjs.Tween.get(obj).to({ rotate: 360 }, animSpeed);
            }

            scope.gameObject.addChild(obj);

            // if (scope.gameObject.children.length > scope.settings.maximumObjects) {
            //     var obj = scope.gameObject.children[0];
            //     scope.gameObject.removeChild(obj);
            // }
        }

        _this.draw = function(data) {

            //var movement = data.average();

            //var mousemove = _this.variables.cursorPosition.x - (scope.canvas.width / 2);

            scope.parent.stage.addChild(scope.gameObject);
        }

        _this.getBaseMultiplier = function(data) {

            var num = 0;

            for (x = 0; x < 5; x++) {
                num += data[x] + data[x + 64];
            }

            return num / 1000;
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

// Helper methods
Array.prototype.sum = Array.prototype.sum || function() {
    return this.reduce(function(sum, a) { return sum + Number(a) }, 0);
}

Array.prototype.take = Array.prototype.take || function(num) {
    return this.slice(0, num);
}

Array.prototype.average = Array.prototype.average || function() {
    return this.sum() / (this.length || 1);
}