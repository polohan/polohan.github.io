;

var modules = (function(ns, $, document, window) {

    ns.animatedGrid = function(settings) {

        var scope = {};

        var _DEFAULTS = {
            color: '255,255,255',
            gridAmountX: 20,
            gridAmountY: 20,
            selector: "#canvas",
            maxActive: 0.8,
            minActive: 0
        }

        scope.settings = $.extend({}, _DEFAULTS, settings);

        var variables = {
            points: [],
            width: 0,
            height: 0,
            paused: false,
            canvas: null,
            context: null,
            cursorPosition: null
        }

        var init = function() {

            if (!TweenLite) { console.error("Could not start animatedGrid. TweenLite library was not found! It is required for animatedGrid.js..."); return; }

            variables.width = $(window).innerWidth();
            variables.height = $(window).innerHeight();

            // Main
            initGrid();
            addListeners();
        }

        scope.start = function() {
            variables.paused = false;
            startAnimation();
        }

        scope.pause = function() {
            if (variables.paused) { console.info("can't pause moving grid, because grid was paused ;)!"); return; }

            variables.paused = true;
        }

        scope.resume = function() {
            if (!variables.paused) { console.info("can't resume moving grid, because grid was not paused ;)!"); return; }

            scope.start();
        }

        scope.reload = function() {
            initGrid();
        }

        var startAnimation = function() {
            if (variables.paused) { return; }

            animate();
            for (var i in variables.points) {
                shiftPoint(variables.points[i]);
            }
        }

        var animate = function() {

            if (variables.paused) { return; }

            // Clear the rectangle 
            variables.context.clearRect(0, 0, variables.width, variables.height);

            var diff = (scope.settings.maxActive - scope.settings.minActive) / 3;
            var lineDiff = diff / 2;

            // Set the transparency based on cusor position (target)
            for (var i in variables.points) {
                // detect variables.points in range
                if (Math.abs(getDistance(variables.cursorPosition, variables.points[i])) < 4000) {
                    variables.points[i].active = scope.settings.minActive + (3 * lineDiff);
                    variables.points[i].circle.active = scope.settings.minActive + (3 * diff);
                } else if (Math.abs(getDistance(variables.cursorPosition, variables.points[i])) < 20000) {
                    variables.points[i].active = scope.settings.minActive + (2 * lineDiff);
                    variables.points[i].circle.active = scope.settings.minActive + (2 * diff);
                } else if (Math.abs(getDistance(variables.cursorPosition, variables.points[i])) < 40000) {
                    variables.points[i].active = scope.settings.minActive + (1 * lineDiff);
                    variables.points[i].circle.active = scope.settings.minActive + (1 * diff);
                } else {
                    variables.points[i].active = scope.settings.minActive;
                    variables.points[i].circle.active = scope.settings.minActive;
                }

                drawLines(variables.points[i]);
                variables.points[i].circle.draw();
            }

            requestAnimationFrame(animate);
        }

        function initGrid() {

            variables.cursorPosition = variables.cursorPosition || { x: variables.width / 2, y: variables.height / 2 };

            variables.canvas = $(scope.settings.selector)[0];
            variables.canvas.width = variables.width;
            variables.canvas.height = variables.height;
            variables.context = variables.canvas.getContext('2d');

            // create variables.points
            variables.points = [];
            for (var x = 0; x < variables.width; x = x + variables.width / scope.settings.gridAmountX) {
                for (var y = 0; y < variables.height; y = y + variables.height / scope.settings.gridAmountY) {
                    var px = x + Math.random() * variables.width / scope.settings.gridAmountX;
                    var py = y + Math.random() * variables.height / scope.settings.gridAmountY;
                    var p = { x: px, originX: px, y: py, originY: py };
                    variables.points.push(p);
                }
            }

            // for each point find the 5 closest variables.points
            for (var i = 0; i < variables.points.length; i++) {
                var closest = [];
                var p1 = variables.points[i];
                for (var j = 0; j < variables.points.length; j++) {
                    var p2 = variables.points[j]
                    if (!(p1 == p2)) {
                        var placed = false;
                        for (var k = 0; k < 5; k++) {
                            if (!placed) {
                                if (closest[k] == undefined) {
                                    closest[k] = p2;
                                    placed = true;
                                }
                            }
                        }

                        for (var k = 0; k < 5; k++) {
                            if (!placed) {
                                if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                                    closest[k] = p2;
                                    placed = true;
                                }
                            }
                        }
                    }
                }
                p1.closest = closest;
            }

            // assign a circle to each point
            for (var i in variables.points) {
                var c = new Circle(variables.points[i], 2 + Math.random() * 2, 'rgba(' + scope.settings.color + ',0.3)');
                variables.points[i].circle = c;
            }

            scope.start();
        }

        // Event handling
        function addListeners() {
            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('resize', resize);
        }

        // Util
        var getDistance = function(p1, p2) {
            return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        }

        // Returns a function, that, as long as it continues to be invoked, will not
        // be triggered. The function will be called after it stops being called for
        // N milliseconds. If `immediate` is passed, trigger the function on the
        // leading edge, instead of the trailing.
        var debounce = function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this,
                    args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };

        var mouseMove = function(e) {
            var posx = posy = 0;
            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            variables.cursorPosition.x = posx;
            variables.cursorPosition.y = posy;
        }

        var resize = debounce(function() {
            variables.width = window.innerWidth;
            variables.height = window.innerHeight;
            variables.canvas.width = variables.width;
            variables.canvas.height = variables.height;

            // create grid anew after resize
            initGrid();
        }, 100);

        var shiftPoint = function(p) {

            if (variables.paused) { return; }

            TweenLite.to(p, 1 + 1 * Math.random(), {
                x: p.originX - 50 + Math.random() * 100,
                y: p.originY - 50 + Math.random() * 100,
                onComplete: function() {
                    shiftPoint(p);
                }
            });
        }

        // Canvas manipulation
        var drawLines = function(p) {

            if (!p.active) return;

            for (var i in p.closest) {
                variables.context.beginPath();
                variables.context.moveTo(p.x, p.y);
                variables.context.lineTo(p.closest[i].x, p.closest[i].y);
                variables.context.strokeStyle = 'rgba(' + scope.settings.color + ',' + p.active + ')';
                variables.context.stroke();
            }
        }

        // Class 
        var Circle = function(pos, rad) {
            var _this = this;

            // constructor
            (function() {
                _this.pos = pos || null;
                _this.radius = rad || null;
            })();

            this.draw = function() {
                if (!_this.active) return;
                variables.context.beginPath();
                variables.context.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
                variables.context.fillStyle = 'rgba(' + scope.settings.color + ',' + _this.active + ')';
                variables.context.fill();
            };
        }

        init();

        return scope;
    }

    return ns;

})(modules || {}, jQuery, document, window);