;

var modules = (function(ns, $, document, window) {

    ns.cursorPerspective = function(settings) {

        var scope = {};

        var _DEFAULTS = {
            strength: 200,
            enabled: true,
            selector: "img"
        }

        scope.settings = $.extend({}, _DEFAULTS, settings);

        var browserPrefix = "",
            usrAg = navigator.userAgent;
        if (usrAg.indexOf("Chrome") > -1 || usrAg.indexOf("Safari") > -1) {
            browserPrefix = "-webkit-";
        } else if (usrAg.indexOf("Opera") > -1) {
            browserPrefix = "-o-";
        } else if (usrAg.indexOf("Firefox") > -1) {
            browserPrefix = "-moz-";
        } else if (usrAg.indexOf("MSIE") > -1) {
            browserPrefix = "-ms-";
        }

        $(scope.settings.selector).each(function(i, element) {

            var $el = $(element);

            // The actual binding -- where the magic happens :: TODO :: make this depending on location of object instead of center window
            $(document).mousemove(function(event) {

                if (scope.settings.enabled === false) {
                    $el.css(browserPrefix + 'transform', 'rotate3d(0,0,0,0)');
                    return;
                }

                var offset = $el.parent().position(); // Get parent position, because perspective screws div placement

                var cx = (offset.left + ($el.parent().width() / 2)), //Math.ceil(window.innerWidth / 2.0),
                    cy = (offset.top + ($el.parent().height() / 2)), //Math.ceil(window.innerHeight / 2.0),
                    dx = event.pageX - cx,
                    dy = event.pageY - cy,
                    tiltx = -(dy / cy),
                    tilty = (dx / cx),
                    radius = Math.sqrt(Math.pow(tiltx, 2) + Math.pow(tilty, 2)),
                    degree = (radius * 15) * (scope.settings.strength / 100);

                $el.css(browserPrefix + 'transform', 'rotate3d(' + tiltx + ', ' + tilty + ', 0, ' + degree + 'deg)');
            });
        });

        return scope;
    };

    return ns;

})(modules || {}, jQuery, document, window);