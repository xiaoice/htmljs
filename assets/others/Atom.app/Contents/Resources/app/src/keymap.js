(function() {
  var $, CSON, Emitter, File, KeyBinding, Keymap, Modifiers, fs, path, _,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  $ = require('./space-pen-extensions').$;

  _ = require('underscore-plus');

  fs = require('fs-plus');

  path = require('path');

  CSON = require('season');

  KeyBinding = require('./key-binding');

  File = require('pathwatcher').File;

  Emitter = require('emissary').Emitter;

  Modifiers = ['alt', 'control', 'ctrl', 'shift', 'cmd'];

  module.exports = Keymap = (function() {
    Emitter.includeInto(Keymap);

    function Keymap(_arg) {
      this.resourcePath = _arg.resourcePath, this.configDirPath = _arg.configDirPath;
      this.keyBindings = [];
    }

    Keymap.prototype.destroy = function() {
      return this.unwatchUserKeymap();
    };

    Keymap.prototype.getKeyBindings = function() {
      return _.clone(this.keyBindings);
    };

    Keymap.prototype.keyBindingsForKeystrokeMatchingElement = function(keystroke, element) {
      var keyBindings;
      keyBindings = this.keyBindingsForKeystroke(keystroke);
      return this.keyBindingsMatchingElement(element, keyBindings);
    };

    Keymap.prototype.keyBindingsForCommandMatchingElement = function(command, element) {
      var keyBindings;
      keyBindings = this.keyBindingsForCommand(command);
      return this.keyBindingsMatchingElement(element, keyBindings);
    };

    Keymap.prototype.keyBindingsForKeystroke = function(keystroke) {
      keystroke = KeyBinding.normalizeKeystroke(keystroke);
      return this.keyBindings.filter(function(keyBinding) {
        return keyBinding.matches(keystroke);
      });
    };

    Keymap.prototype.keyBindingsForCommand = function(command) {
      return this.keyBindings.filter(function(keyBinding) {
        return keyBinding.command === command;
      });
    };

    Keymap.prototype.keyBindingsMatchingElement = function(element, keyBindings) {
      if (keyBindings == null) {
        keyBindings = this.keyBindings;
      }
      keyBindings = keyBindings.filter(function(_arg) {
        var selector;
        selector = _arg.selector;
        return $(element).closest(selector).length > 0;
      });
      return keyBindings.sort(function(a, b) {
        return a.compare(b);
      });
    };

    Keymap.prototype.keystrokeStringForEvent = function(event, previousKeystroke) {
      var charCode, hexCharCode, isNamedKey, key, keystroke, modifiers;
      if (event.originalEvent.keyIdentifier.indexOf('U+') === 0) {
        hexCharCode = event.originalEvent.keyIdentifier.slice(2);
        charCode = parseInt(hexCharCode, 16);
        if (!this.isAscii(charCode) && this.isAscii(event.which)) {
          charCode = event.which;
        }
        key = this.keyFromCharCode(charCode);
      } else {
        key = event.originalEvent.keyIdentifier.toLowerCase();
      }
      modifiers = [];
      if (event.altKey && __indexOf.call(Modifiers, key) < 0) {
        modifiers.push('alt');
      }
      if (event.metaKey && __indexOf.call(Modifiers, key) < 0) {
        modifiers.push('cmd');
      }
      if (event.ctrlKey && __indexOf.call(Modifiers, key) < 0) {
        modifiers.push('ctrl');
      }
      if (event.shiftKey && __indexOf.call(Modifiers, key) < 0) {
        isNamedKey = key.length > 1;
        if (isNamedKey) {
          modifiers.push('shift');
        }
      } else {
        key = key.toLowerCase();
      }
      keystroke = __slice.call(modifiers).concat([key]).join('-');
      if (previousKeystroke) {
        if (__indexOf.call(Modifiers, keystroke) >= 0) {
          return previousKeystroke;
        } else {
          return "" + previousKeystroke + " " + keystroke;
        }
      } else {
        return keystroke;
      }
    };

    Keymap.prototype.loadBundledKeymaps = function() {
      this.loadDirectory(path.join(this.resourcePath, 'keymaps'));
      return this.emit('bundled-keymaps-loaded');
    };

    Keymap.prototype.getUserKeymapPath = function() {
      var userKeymapPath;
      if (userKeymapPath = CSON.resolve(path.join(this.configDirPath, 'keymap'))) {
        return userKeymapPath;
      } else {
        return path.join(this.configDirPath, 'keymap.cson');
      }
    };

    Keymap.prototype.unwatchUserKeymap = function() {
      var _ref;
      if ((_ref = this.userKeymapFile) != null) {
        _ref.off();
      }
      if (this.userKeymapPath != null) {
        return this.remove(this.userKeymapPath);
      }
    };

    Keymap.prototype.loadUserKeymap = function() {
      var userKeymapPath;
      this.unwatchUserKeymap();
      userKeymapPath = this.getUserKeymapPath();
      if (fs.isFileSync(userKeymapPath)) {
        this.userKeymapPath = userKeymapPath;
        this.userKeymapFile = new File(userKeymapPath);
        this.userKeymapFile.on('contents-changed moved removed', (function(_this) {
          return function() {
            return _this.loadUserKeymap();
          };
        })(this));
        return this.add(this.userKeymapPath, this.readUserKeymap());
      }
    };

    Keymap.prototype.readUserKeymap = function() {
      var error, _ref, _ref1;
      try {
        return (_ref = CSON.readFileSync(this.userKeymapPath)) != null ? _ref : {};
      } catch (_error) {
        error = _error;
        console.warn("Failed to load your keymap file: " + this.userKeymapPath, (_ref1 = error.stack) != null ? _ref1 : error);
        return {};
      }
    };

    Keymap.prototype.loadDirectory = function(directoryPath) {
      var filePath, otherPlatforms, platforms, _i, _len, _ref, _ref1, _results;
      platforms = ['darwin', 'freebsd', 'linux', 'sunos', 'win32'];
      otherPlatforms = platforms.filter(function(name) {
        return name !== process.platform;
      });
      _ref = fs.listSync(directoryPath, ['.cson', '.json']);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        filePath = _ref[_i];
        if (_ref1 = path.basename(filePath, path.extname(filePath)), __indexOf.call(otherPlatforms, _ref1) >= 0) {
          continue;
        }
        _results.push(this.load(filePath));
      }
      return _results;
    };

    Keymap.prototype.load = function(path) {
      return this.add(path, CSON.readFileSync(path));
    };

    Keymap.prototype.add = function(source, keyMappingsBySelector) {
      var keyMappings, selector, _results;
      _results = [];
      for (selector in keyMappingsBySelector) {
        keyMappings = keyMappingsBySelector[selector];
        _results.push(this.bindKeys(source, selector, keyMappings));
      }
      return _results;
    };

    Keymap.prototype.remove = function(source) {
      return this.keyBindings = this.keyBindings.filter(function(keyBinding) {
        return keyBinding.source !== source;
      });
    };

    Keymap.prototype.bindKeys = function(source, selector, keyMappings) {
      var command, keyBinding, keystroke, _results;
      _results = [];
      for (keystroke in keyMappings) {
        command = keyMappings[keystroke];
        keyBinding = new KeyBinding(source, command, keystroke, selector);
        try {
          $(keyBinding.selector);
          _results.push(this.keyBindings.push(keyBinding));
        } catch (_error) {
          _results.push(console.warn("Keybinding '" + keystroke + "': '" + command + "' in " + source + " has an invalid selector: '" + selector + "'"));
        }
      }
      return _results;
    };

    Keymap.prototype.handleKeyEvent = function(event) {
      var element, keyBinding, keyBindings, keystroke, partialMatch, shouldBubble, _i, _len;
      element = event.target;
      if (element === document.body) {
        element = atom.workspaceView;
      }
      keystroke = this.keystrokeStringForEvent(event, this.queuedKeystroke);
      keyBindings = this.keyBindingsForKeystrokeMatchingElement(keystroke, element);
      if (keyBindings.length === 0 && this.queuedKeystroke) {
        this.queuedKeystroke = null;
        return false;
      } else {
        this.queuedKeystroke = null;
      }
      for (_i = 0, _len = keyBindings.length; _i < _len; _i++) {
        keyBinding = keyBindings[_i];
        partialMatch = keyBinding.keystroke !== keystroke;
        if (partialMatch) {
          this.queuedKeystroke = keystroke;
          shouldBubble = false;
        } else {
          if (keyBinding.command === 'native!') {
            shouldBubble = true;
          } else if (this.triggerCommandEvent(element, keyBinding.command, event)) {
            shouldBubble = false;
          }
        }
        if (shouldBubble != null) {
          break;
        }
      }
      return shouldBubble != null ? shouldBubble : true;
    };

    Keymap.prototype.triggerCommandEvent = function(element, commandName, event) {
      var commandEvent;
      commandEvent = $.Event(commandName);
      commandEvent.originalEvent = event;
      commandEvent.abortKeyBinding = function() {
        return commandEvent.stopImmediatePropagation();
      };
      $(element).trigger(commandEvent);
      return !commandEvent.isImmediatePropagationStopped();
    };

    Keymap.prototype.isAscii = function(charCode) {
      return (0 <= charCode && charCode <= 127);
    };

    Keymap.prototype.keyFromCharCode = function(charCode) {
      switch (charCode) {
        case 8:
          return 'backspace';
        case 9:
          return 'tab';
        case 13:
          return 'enter';
        case 27:
          return 'escape';
        case 32:
          return 'space';
        case 127:
          return 'delete';
        default:
          return String.fromCharCode(charCode);
      }
    };

    return Keymap;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/keymap.js.map
