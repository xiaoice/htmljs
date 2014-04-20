(function() {
  var Subscriber, getKeystroke, humanizeKeystrokes, jQuery, originalCleanData, requireBootstrapTooltip, spacePen, tooltipDefaults, _;

  _ = require('underscore-plus');

  spacePen = require('space-pen');

  Subscriber = require('emissary').Subscriber;

  Subscriber.includeInto(spacePen.View);

  jQuery = spacePen.jQuery;

  originalCleanData = jQuery.cleanData;

  jQuery.cleanData = function(elements) {
    var element, _i, _len, _ref;
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      element = elements[_i];
      if ((_ref = jQuery(element).view()) != null) {
        _ref.unsubscribe();
      }
    }
    return originalCleanData(elements);
  };

  tooltipDefaults = {
    delay: {
      show: 1000,
      hide: 100
    },
    container: 'body',
    html: true,
    placement: 'auto top',
    viewportPadding: 2
  };

  humanizeKeystrokes = function(keystroke) {
    var keystrokes, stroke;
    keystrokes = keystroke.split(' ');
    keystrokes = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = keystrokes.length; _i < _len; _i++) {
        stroke = keystrokes[_i];
        _results.push(_.humanizeKeystroke(stroke));
      }
      return _results;
    })();
    return keystrokes.join(' ');
  };

  getKeystroke = function(bindings) {
    if (bindings != null ? bindings.length : void 0) {
      return "<span class=\"keystroke\">" + (humanizeKeystrokes(bindings[0].keystroke)) + "</span>";
    } else {
      return '';
    }
  };

  requireBootstrapTooltip = _.once(function() {
    return atom.requireWithGlobals('bootstrap/js/tooltip', {
      jQuery: jQuery
    });
  });

  jQuery.fn.setTooltip = function(tooltipOptions, _arg) {
    var bindings, command, commandElement, _ref;
    _ref = _arg != null ? _arg : {}, command = _ref.command, commandElement = _ref.commandElement;
    requireBootstrapTooltip();
    if (_.isString(tooltipOptions)) {
      tooltipOptions = {
        title: tooltipOptions
      };
    }
    bindings = commandElement ? atom.keymap.keyBindingsForCommandMatchingElement(command, commandElement) : atom.keymap.keyBindingsForCommand(command);
    tooltipOptions.title = "" + tooltipOptions.title + " " + (getKeystroke(bindings));
    return this.tooltip(jQuery.extend({}, tooltipDefaults, tooltipOptions));
  };

  jQuery.fn.hideTooltip = function() {
    var tip;
    tip = this.data('bs.tooltip');
    if (tip) {
      tip.leave({
        currentTarget: this
      });
      return tip.hide();
    }
  };

  jQuery.fn.destroyTooltip = function() {
    this.hideTooltip();
    requireBootstrapTooltip();
    return this.tooltip('destroy');
  };

  jQuery(document.body).on('show.bs.tooltip', function(_arg) {
    var target, windowHandler;
    target = _arg.target;
    windowHandler = function() {
      return jQuery(target).hideTooltip();
    };
    jQuery(window).one('resize', windowHandler);
    return jQuery(target).one('hide.bs.tooltip', function() {
      return jQuery(window).off('resize', windowHandler);
    });
  });

  jQuery.fn.setTooltip.getKeystroke = getKeystroke;

  jQuery.fn.setTooltip.humanizeKeystrokes = humanizeKeystrokes;

  module.exports = spacePen;

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/space-pen-extensions.js.map
