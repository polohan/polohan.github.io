;
(function($, createjs, document, undefined) {

    $.fn.visualizer = function(settings) {

        // Declare a scope for Visualizer
        var scope = {};

        // Bind 'this'
        var _this = this;

        // Private variables for within the plugin only ( no user/ code interaction )
        _this.variables = {
            gameObject: null,
            cursorX: 0,
            cursorY: 0,
            isPlaying: false,
            audioContext: null,
            analyser: null,
            audioSource: null,
            loadQueue: null,
            currentSong: null,
            visuals: [],
            stage: null,
            isBeatDetected: false,
        }

        scope.variables = _this.variables;

        // The default values ( which can be overriden by supplied settings )
        var _DEFAULTS = {
            framesPerSecond: 60, // Amount of frames per second -- lower this if you have issues with performance   
            blurAmount: 3, // Lower this value if you have performance issues ( a higer blur is very performance heavy )
            backgroundImage: null, // provide path of image to load as background image
            foregroundImage: null, // provide path of image to load as foreground image ( use transparen PNG/ GIF, else it will hide everything below!)
            beatImage: null,
            volume: 0.5,
            crossFade: true,
            crossFadeDuration: 2000,
            loopMusic: true,
            canvasId: "visualizer", // note : this must be an ID ( not a class! )
            foregroundImageMirror: false,
            fpsEnabled: false,

            enableIdleState: false,
            inactiveTimeoutSeconds: 3,
            inactiveMovementSpeedMultiplier: 1,
            idle: false,

            enabled: true,
        }

        scope.botCanvas = null;
        scope.botStage = null;

        scope.canvas = null;
        scope.stage = null;

        scope.settings = $.extend(_DEFAULTS, settings);

        var time = new Date();

        _this.init = function() {

            if (!this[0].id) { console.error("The targeted canvas needs to have an id specified"); }

            if (!createjs) { console.error("This plugin requires CreateJS to operate!"); }

            scope.settings.canvasId = this[0].id;

            _this.variables.audioContext = new AudioContext();
            _this.variables.analyser = _this.variables.audioContext.createAnalyser();

            _this.variables.loadQueue = new createjs.LoadQueue(true);
            _this.variables.loadQueue.setMaxConnections(10);

            createjs.Sound.registerPlugins([createjs.HTMLAudioPlugin]);
            createjs.Sound.alternateExtensions = ["ogg"];
            _this.variables.loadQueue.installPlugin(createjs.Sound);

            var stage = new createjs.Stage(scope.settings.canvasId);
            stage.snapToPixel = true;
            stage.snapToPixelEnabled = true;
            scope.stage = stage;
            scope.canvas = stage.canvas;

            var botStage = new createjs.Stage("background-canvas");
            botStage.snapToPixel = true;
            botStage.snapToPixelEnabled = true;
            scope.botStage = botStage;
            scope.botCanvas = botStage.canvas;

            _this.variables.gameObject = new createjs.Container();
            _this.variables.gameObject.name = "Visualizer Core";
            stage.addChild(_this.variables.gameObject);

            createjs.Ticker.addEventListener("tick", _this.update);
            createjs.Ticker.setFPS(scope.settings.framesPerSecond);
        }

        _this.createFPS = function() {
            var container = new createjs.Container();
            container.name = "FPS Counter";
            // create fps Counter

            var box_fps = new createjs.Shape();
            //box_fps.x = scope.stage.canvas.width / 2;

            var fps = createjs.Ticker.getMeasuredFPS();
            var target_fps = scope.settings.framesPerSecond;

            if (fps >= target_fps * 0.95) {
                box_fps.graphics.f("green").drawRoundRect(0, 0, 110, 30, 5); // When above or equal 95% FPS target, FPS is GREEN : yay!
            } else if (fps < target_fps * 0.95 && fps >= target_fps * 0.75) {
                box_fps.graphics.f("orange").drawRoundRect(0, 0, 110, 30, 5); // When below 95% FPS target, FPS is ORANGE ( 57 / 60 || 137 / 144 )
            } else {
                box_fps.graphics.f("red").drawRoundRect(0, 0, 110, 30, 5); // When below 75% FPS target, FPS is RED ( 45 / 60 || 108 / 144 )
            }

            var txt_FPS_cur = new createjs.Text(fps.toFixed(1), "12px Verdana", "#000");
            txt_FPS_cur.textAlign = 'right';
            txt_FPS_cur.x = 40;
            txt_FPS_cur.y = 5;

            var txt_FPS_target = new createjs.Text("/ " + scope.settings.framesPerSecond + " FPS", "12px Verdana", "#222");
            txt_FPS_target.x = 45;
            txt_FPS_target.y = 10;

            container.x = scope.stage.canvas.width / 2;
            container.y = 25;
            container.regX = 55;
            container.regY = 15;

            container.addChild(box_fps, txt_FPS_cur, txt_FPS_target);

            scope.stage.addChild(container);
        }

        scope.setFPS = function(fps) {
            scope.settings.framesPerSecond = fps;
            createjs.Ticker.setFPS(scope.settings.framesPerSecond);
        }

        scope.addVisual = function(visual) {
            if (_this.variables.visuals[visual.id]) { console.error("This visual ID is already in use, please use an other one, or remove the existing one!"); return; }

            _this.variables.visuals[visual.id] = visual;
            _this.variables.visuals.push(visual);

            visual.parent = scope;
            visual.stage = scope.stage;
            visual.canvas = scope.canvas;

            scope.stage.addChild(visual.gameObject);
        }

        scope.removeVisual = function(id) {
            delete _this.variables.visuals[id];

            $.each(_this.variables.visuals, function(i) {
                if (_this.variables.visuals[i].id === id) {
                    _this.variables.visuals.splice(i, 1);
                    return false;
                }
            });
        }

        _this.removeGameObject = function(obj) {
            obj.parent.removeChild(obj);
        }

        var previousSoundData = [];
        var soundData = [];
        var fadedSoundData = [];

        var inactiveTimer = 0;
        var inactiveSoundData = [];

        scope.setSoundData = function(data) {
            //previousSoundData = soundData;
            soundData = data;

            if (soundData.average() < 1 && scope.settings.enableIdleState) {
                // It's silent

                if (scope.settings.idle) {

                    inactiveSoundData = [];
                    for (var x = 0; x < 128; x++) {
                        inactiveSoundData.push(Math.sin(x / 5 + new Date().getTime() / 2000 * scope.settings.inactiveMovementSpeedMultiplier) * 100 + 100);
                    }
                    soundData = inactiveSoundData;

                } else if (!inactiveTimer) {
                    inactiveTimer = setTimeout(() => {
                        scope.settings.idle = true;
                    }, 1000 * scope.settings.inactiveTimeoutSeconds);
                }

            } else if (inactiveTimer) {
                clearTimeout(inactiveTimer);
                inactiveTimer = null;
            } else {
                scope.settings.idle = false;
            }

            if (previousSoundData.length == soundData.length) {
                // tween
                createjs.Tween.get(fadedSoundData, { override: true }).to(soundData, 75);

            } else {
                previousSoundData = soundData;
                fadedSoundData = soundData;
            }
        }

        scope.updateVisuals = function(data) {
            // Magic starts here :D
            _this.variables.visuals.forEach(function(visual) {
                visual.update(data);
            });
        }

        // This method gets called every frame, heart of the plugin
        _this.update = function(event) {

            if (!scope.settings.enabled) { return; }

            // clear top and bot stage (new method)
            scope.botStage.removeAllChildren();
            scope.stage.removeAllChildren();

            // clear local gameobject
            _this.variables.gameObject.removeAllChildren();

            // Update visuals
            scope.updateVisuals(fadedSoundData);

            // If FPS enabled, add to top stage
            if (scope.settings.fpsEnabled) {

                _this.createFPS();
            }

            scope.stage.addChild(_this.variables.gameObject);

            scope.botStage.update();
            scope.stage.update();
        }

        _this.init();

        return scope;
    };

}(jQuery, createjs, document));

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

Array.prototype.interpolate = Array.prototype.interpolate || function(newLength) {

    data = this;

    var linearInterpolate = function(before, after, atPoint) {
        return before + (after - before) * atPoint;
    };

    var newData = new Array();
    var springFactor = new Number((data.length - 1) / (newLength - 1));
    newData[0] = data[0]; // for new allocation
    for (var i = 1; i < newLength - 1; i++) {
        var tmp = i * springFactor;
        var before = new Number(Math.floor(tmp)).toFixed();
        var after = new Number(Math.ceil(tmp)).toFixed();
        var atPoint = tmp - before;
        newData[i] = linearInterpolate(data[before], data[after], atPoint);
    }
    newData[newLength - 1] = data[data.length - 1]; // for new allocation
    return newData;
};