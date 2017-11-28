;

var modules = (function(ns, $, document) {

    ns.wallpaperEngineSlideShow = function(settings) {

        var scope = {};

        var _DEFAULTS = {
            showTime: 10000,
            fadeTime: 3000,
            imageContainer: "body",
            directoryPropertyName: "directory"
        }

        var variables = {
            images: [],
            paused: false
        }

        scope.settings = $.extend({}, _DEFAULTS, settings);

        scope.stop = function() {
            removeAll();
        }

        scope.start = function() {
            variables.paused = false;
            showNext();
        }

        scope.pause = function() {
            pause();
        }

        scope.resume = function() {
            scope.start();
        }

        scope.showNext = function() {
            showNext();
        }

        scope.getNext = function() {
            window.wallpaperRequestRandomFileForProperty(scope.settings.directoryPropertyName, function(propertyName, filePath) {
                return 'file:///' + filePath;
            });
        }

        var pause = function() {
            variables.paused = true;
        }

        var showNext = function() {

            // Callback method
            var imageResponse = function(propertyName, filePath) {

                var image = $("<div/>").css({
                    "position": "absolute",
                    "left": "0",
                    "right": "0",
                    "bottom": "0",
                    "top": "0",
                    "background-size": "cover",
                    "background-position": "center",
                    "background-image": "url('file:///" + filePath + "')",
                    "-webkit-backface-visibility": "hidden"
                });

                $(scope.settings.imageContainer).append(image);

                $(image).hide().fadeIn(scope.settings.fadeTime, function() {
                    removeSlide();

                    setTimeout(function() {
                        if (!scope.settings.paused) {
                            showNext();
                        }
                    }, scope.settings.showTime);
                });

                variables.images.push(image);
            }

            // Actually call 
            window.wallpaperRequestRandomFileForProperty(scope.settings.directoryPropertyName, imageResponse);
        }

        var removeSlide = function() {
            if (variables.images.length > 1) {
                var image = variables.images.shift();
                image.remove();
            }
        }

        var removeAll = function() {
            variables.images.forEach(function(image) {
                image.remove();
            });

            variables.images = [];
        }

        return scope;
    }

    return ns;

})(modules || {}, jQuery, document);