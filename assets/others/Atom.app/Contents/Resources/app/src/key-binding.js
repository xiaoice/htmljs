(function() {
  var KeyBinding, fs, specificity, _,
    __slice = [].slice;

  _ = require('underscore-plus');

  fs = require('fs-plus');

  specificity = require('clear-cut').specificity;

  module.exports = KeyBinding = (function() {
    KeyBinding.parser = null;

    KeyBinding.currentIndex = 1;

    KeyBinding.specificities = null;

    KeyBinding.calculateSpecificity = function(selector) {
      var value;
      if (this.specificities == null) {
        this.specificities = {};
      }
      value = this.specificities[selector];
      if (value == null) {
        value = specificity(selector);
        this.specificities[selector] = value;
      }
      return value;
    };

    KeyBinding.normalizeKeystroke = function(keystroke) {
      var normalizedKeystroke;
      normalizedKeystroke = keystroke.split(/\s+/).map((function(_this) {
        return function(keystroke) {
          var keys, modifiers;
          keys = _this.parseKeystroke(keystroke);
          modifiers = keys.slice(0, -1);
          modifiers.sort();
          return __slice.call(modifiers).concat([_.last(keys)]).join('-');
        };
      })(this));
      return normalizedKeystroke.join(' ');
    };

    KeyBinding.parseKeystroke = function(keystroke) {
      var PEG, keystrokePattern;
      if (this.parser == null) {
        try {
          this.parser = require('./keystroke-pattern');
        } catch (_error) {
          keystrokePattern = fs.readFileSync(require.resolve('./keystroke-pattern.pegjs'), 'utf8');
          PEG = require('pegjs');
          this.parser = PEG.buildParser(keystrokePattern);
        }
      }
      return this.parser.parse(keystroke);
    };

    function KeyBinding(source, command, keystroke, selector) {
      this.source = source;
      this.command = command;
      this.keystroke = KeyBinding.normalizeKeystroke(keystroke);
      this.selector = selector.replace(/!important/g, '');
      this.specificity = KeyBinding.calculateSpecificity(selector);
      this.index = KeyBinding.currentIndex++;
    }

    KeyBinding.prototype.matches = function(keystroke) {
      var multiKeystroke;
      multiKeystroke = /\s/.test(keystroke);
      if (multiKeystroke) {
        return keystroke === this.keystroke;
      } else {
        return keystroke.split(' ')[0] === this.keystroke.split(' ')[0];
      }
    };

    KeyBinding.prototype.compare = function(keyBinding) {
      if (keyBinding.specificity === this.specificity) {
        return keyBinding.index - this.index;
      } else {
        return keyBinding.specificity - this.specificity;
      }
    };

    return KeyBinding;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/key-binding.js.map
