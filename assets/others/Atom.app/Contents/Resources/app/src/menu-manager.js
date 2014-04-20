(function() {
  var CSON, MenuManager, fs, ipc, path, _;

  path = require('path');

  _ = require('underscore-plus');

  ipc = require('ipc');

  CSON = require('season');

  fs = require('fs-plus');

  module.exports = MenuManager = (function() {
    function MenuManager(_arg) {
      this.resourcePath = _arg.resourcePath;
      this.pendingUpdateOperation = null;
      this.template = [];
      atom.keymap.on('bundled-keymaps-loaded', (function(_this) {
        return function() {
          return _this.loadPlatformItems();
        };
      })(this));
    }

    MenuManager.prototype.add = function(items) {
      var item, _i, _len;
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        this.merge(this.template, item);
      }
      return this.update();
    };

    MenuManager.prototype.includeSelector = function(selector) {
      var error, testBody, testWorkspace, workspaceClasses, _ref, _ref1, _ref2;
      try {
        if (document.body.webkitMatchesSelector(selector)) {
          return true;
        }
      } catch (_error) {
        error = _error;
        return false;
      }
      if (this.testEditor == null) {
        testBody = document.createElement('body');
        (_ref = testBody.classList).add.apply(_ref, this.classesForElement(document.body));
        testWorkspace = document.createElement('body');
        workspaceClasses = (_ref1 = this.classesForElement(document.body.querySelector('.workspace'))) != null ? _ref1 : ['.workspace'];
        (_ref2 = testWorkspace.classList).add.apply(_ref2, workspaceClasses);
        testBody.appendChild(testWorkspace);
        this.testEditor = document.createElement('div');
        this.testEditor.classList.add('editor');
        testWorkspace.appendChild(this.testEditor);
      }
      return this.testEditor.webkitMatchesSelector(selector);
    };

    MenuManager.prototype.update = function() {
      if (this.pendingUpdateOperation != null) {
        clearImmediate(this.pendingUpdateOperation);
      }
      return this.pendingUpdateOperation = setImmediate((function(_this) {
        return function() {
          var binding, keystrokesByCommand, _i, _len, _name, _ref;
          keystrokesByCommand = {};
          _ref = atom.keymap.getKeyBindings();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            binding = _ref[_i];
            if (!(_this.includeSelector(binding.selector))) {
              continue;
            }
            if (keystrokesByCommand[_name = binding.command] == null) {
              keystrokesByCommand[_name] = [];
            }
            keystrokesByCommand[binding.command].push(binding.keystroke);
          }
          return _this.sendToBrowserProcess(_this.template, keystrokesByCommand);
        };
      })(this));
    };

    MenuManager.prototype.loadPlatformItems = function() {
      var menu, menusDirPath, platformMenuPath;
      menusDirPath = path.join(this.resourcePath, 'menus');
      platformMenuPath = fs.resolve(menusDirPath, process.platform, ['cson', 'json']);
      menu = CSON.readFileSync(platformMenuPath).menu;
      return this.add(menu);
    };

    MenuManager.prototype.merge = function(menu, item) {
      var i, match, _i, _len, _ref, _results;
      item = _.deepClone(item);
      if ((item.submenu != null) && (match = _.find(menu, (function(_this) {
        return function(i) {
          return (i.submenu != null) && _this.normalizeLabel(i.label) === _this.normalizeLabel(item.label);
        };
      })(this)))) {
        _ref = item.submenu;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push(this.merge(match.submenu, i));
        }
        return _results;
      } else {
        if (!_.find(menu, (function(_this) {
          return function(i) {
            return _this.normalizeLabel(i.label) === _this.normalizeLabel(item.label);
          };
        })(this))) {
          return menu.push(item);
        }
      }
    };

    MenuManager.prototype.filterMultipleKeystroke = function(keystrokesByCommand) {
      var binding, bindings, filtered, key, _i, _len;
      filtered = {};
      for (key in keystrokesByCommand) {
        bindings = keystrokesByCommand[key];
        for (_i = 0, _len = bindings.length; _i < _len; _i++) {
          binding = bindings[_i];
          if (binding.indexOf(' ') !== -1) {
            continue;
          }
          if (filtered[key] == null) {
            filtered[key] = [];
          }
          filtered[key].push(binding);
        }
      }
      return filtered;
    };

    MenuManager.prototype.sendToBrowserProcess = function(template, keystrokesByCommand) {
      keystrokesByCommand = this.filterMultipleKeystroke(keystrokesByCommand);
      return ipc.sendChannel('update-application-menu', template, keystrokesByCommand);
    };

    MenuManager.prototype.normalizeLabel = function(label) {
      if (label == null) {
        return void 0;
      }
      if (process.platform === 'win32') {
        return label.replace(/\&/g, '');
      } else {
        return label;
      }
    };

    MenuManager.prototype.classesForElement = function(element) {
      var _ref;
      return (_ref = element != null ? element.classList.toString().split(' ') : void 0) != null ? _ref : [];
    };

    return MenuManager;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/menu-manager.js.map
