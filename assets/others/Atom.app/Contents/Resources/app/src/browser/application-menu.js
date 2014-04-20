(function() {
  var ApplicationMenu, Menu, app, ipc, _;

  app = require('app');

  ipc = require('ipc');

  Menu = require('menu');

  _ = require('underscore-plus');

  module.exports = ApplicationMenu = (function() {
    ApplicationMenu.prototype.version = null;

    ApplicationMenu.prototype.menu = null;

    function ApplicationMenu(version) {
      this.version = version;
      this.menu = Menu.buildFromTemplate(this.getDefaultTemplate());
      Menu.setApplicationMenu(this.menu);
    }

    ApplicationMenu.prototype.update = function(template, keystrokesByCommand) {
      this.translateTemplate(template, keystrokesByCommand);
      this.substituteVersion(template);
      this.menu = Menu.buildFromTemplate(template);
      return Menu.setApplicationMenu(this.menu);
    };

    ApplicationMenu.prototype.flattenMenuItems = function(menu) {
      var index, item, items, _ref;
      items = [];
      _ref = menu.items || {};
      for (index in _ref) {
        item = _ref[index];
        items.push(item);
        if (item.submenu) {
          items = items.concat(this.flattenMenuItems(item.submenu));
        }
      }
      return items;
    };

    ApplicationMenu.prototype.flattenMenuTemplate = function(template) {
      var item, items, _i, _len;
      items = [];
      for (_i = 0, _len = template.length; _i < _len; _i++) {
        item = template[_i];
        items.push(item);
        if (item.submenu) {
          items = items.concat(this.flattenMenuTemplate(item.submenu));
        }
      }
      return items;
    };

    ApplicationMenu.prototype.enableWindowSpecificItems = function(enable) {
      var item, _i, _len, _ref, _ref1, _results;
      _ref = this.flattenMenuItems(this.menu);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if ((_ref1 = item.metadata) != null ? _ref1['windowSpecific'] : void 0) {
          _results.push(item.enabled = enable);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    ApplicationMenu.prototype.substituteVersion = function(template) {
      var item;
      if ((item = _.find(this.flattenMenuTemplate(template), function(i) {
        return i.label === 'VERSION';
      }))) {
        return item.label = "Version " + this.version;
      }
    };

    ApplicationMenu.prototype.showInstallUpdateItem = function(visible) {
      var item;
      if (visible == null) {
        visible = true;
      }
      if ((item = _.find(this.flattenMenuItems(this.menu), function(i) {
        return i.label === 'Restart and Install Update';
      }))) {
        return item.visible = visible;
      }
    };

    ApplicationMenu.prototype.showCheckForUpdateItem = function(visible) {
      var item;
      if (visible == null) {
        visible = true;
      }
      if ((item = _.find(this.flattenMenuItems(this.menu), function(i) {
        return i.label === 'Check for Update';
      }))) {
        return item.visible = visible;
      }
    };

    ApplicationMenu.prototype.getDefaultTemplate = function() {
      return [
        {
          label: "Atom",
          submenu: [
            {
              label: 'Reload',
              accelerator: 'Command+R',
              click: function() {
                var _ref;
                return (_ref = this.focusedWindow()) != null ? _ref.reload() : void 0;
              }
            }, {
              label: 'Close Window',
              accelerator: 'Command+Shift+W',
              click: function() {
                var _ref;
                return (_ref = this.focusedWindow()) != null ? _ref.close() : void 0;
              }
            }, {
              label: 'Toggle Dev Tools',
              accelerator: 'Command+Alt+I',
              click: function() {
                var _ref;
                return (_ref = this.focusedWindow()) != null ? _ref.toggleDevTools() : void 0;
              }
            }, {
              label: 'Quit',
              accelerator: 'Command+Q',
              click: function() {
                return app.quit();
              }
            }
          ]
        }
      ];
    };

    ApplicationMenu.prototype.translateTemplate = function(template, keystrokesByCommand) {
      template.forEach((function(_this) {
        return function(item) {
          item.metadata = {};
          if (item.command) {
            item.accelerator = _this.acceleratorForCommand(item.command, keystrokesByCommand);
            item.click = function() {
              return global.atomApplication.sendCommand(item.command);
            };
            if (!/^application:/.test(item.command)) {
              item.metadata['windowSpecific'] = true;
            }
          }
          if (item.submenu) {
            return _this.translateTemplate(item.submenu, keystrokesByCommand);
          }
        };
      })(this));
      return template;
    };

    ApplicationMenu.prototype.acceleratorForCommand = function(command, keystrokesByCommand) {
      var firstKeystroke, key, keys, modifiers, _ref;
      firstKeystroke = (_ref = keystrokesByCommand[command]) != null ? _ref[0] : void 0;
      if (!firstKeystroke) {
        return null;
      }
      modifiers = firstKeystroke.split('-');
      key = modifiers.pop();
      if (key !== key.toLowerCase()) {
        modifiers.push("Shift");
      }
      modifiers = modifiers.map(function(modifier) {
        return modifier.replace(/shift/ig, "Shift").replace(/cmd/ig, "Command").replace(/ctrl/ig, "Ctrl").replace(/alt/ig, "Alt");
      });
      keys = modifiers.concat([key.toUpperCase()]);
      return keys.join("+");
    };

    return ApplicationMenu;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/browser/application-menu.js.map
