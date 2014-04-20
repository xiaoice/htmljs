(function() {
  var AtomWindow, BrowserWindow, ContextMenu, Menu, app, dialog, fs, ipc, path, url, _,
    __slice = [].slice;

  BrowserWindow = require('browser-window');

  Menu = require('menu');

  ContextMenu = require('./context-menu');

  app = require('app');

  dialog = require('dialog');

  ipc = require('ipc');

  path = require('path');

  fs = require('fs');

  url = require('url');

  _ = require('underscore-plus');

  module.exports = AtomWindow = (function() {
    AtomWindow.iconPath = path.resolve(__dirname, '..', '..', 'resources', 'atom.png');

    AtomWindow.includeShellLoadTime = true;

    AtomWindow.prototype.browserWindow = null;

    AtomWindow.prototype.loaded = null;

    AtomWindow.prototype.isSpec = null;

    function AtomWindow(settings) {
      var initialLine, loadSettings, pathToOpen, _base;
      if (settings == null) {
        settings = {};
      }
      this.resourcePath = settings.resourcePath, pathToOpen = settings.pathToOpen, initialLine = settings.initialLine, this.isSpec = settings.isSpec, this.exitWhenDone = settings.exitWhenDone;
      global.atomApplication.addWindow(this);
      this.setupNodePath(this.resourcePath);
      this.browserWindow = new BrowserWindow({
        show: false,
        title: 'Atom',
        icon: this.constructor.iconPath
      });
      this.browserWindow.restart = _.wrap(_.bind(this.browserWindow.restart, this.browserWindow), (function(_this) {
        return function(restart) {
          _this.setupNodePath(_this.resourcePath);
          return restart();
        };
      })(this));
      this.handleEvents();
      loadSettings = _.extend({}, settings);
      if (loadSettings.windowState == null) {
        loadSettings.windowState = '{}';
      }
      loadSettings.appVersion = app.getVersion();
      if (this.constructor.includeShellLoadTime && !this.isSpec) {
        this.constructor.includeShellLoadTime = false;
        if (loadSettings.shellLoadTime == null) {
          loadSettings.shellLoadTime = Date.now() - global.shellStartTime;
        }
      }
      loadSettings.initialPath = pathToOpen;
      if (typeof (_base = fs.statSyncNoException(pathToOpen)).isFile === "function" ? _base.isFile() : void 0) {
        loadSettings.initialPath = path.dirname(pathToOpen);
      }
      this.browserWindow.loadSettings = loadSettings;
      this.browserWindow.once('window:loaded', (function(_this) {
        return function() {
          return _this.loaded = true;
        };
      })(this));
      this.browserWindow.loadUrl(this.getUrl(loadSettings));
      if (this.isSpec) {
        this.browserWindow.focusOnWebView();
      }
      this.openPath(pathToOpen, initialLine);
    }

    AtomWindow.prototype.setupNodePath = function(resourcePath) {
      return process.env['NODE_PATH'] = path.resolve(resourcePath, 'exports');
    };

    AtomWindow.prototype.getUrl = function(loadSettingsObj) {
      var loadSettings;
      loadSettings = _.clone(loadSettingsObj);
      delete loadSettings['windowState'];
      return url.format({
        protocol: 'file',
        pathname: "" + this.resourcePath + "/static/index.html",
        slashes: true,
        query: {
          loadSettings: JSON.stringify(loadSettings)
        }
      });
    };

    AtomWindow.prototype.getInitialPath = function() {
      return this.browserWindow.loadSettings.initialPath;
    };

    AtomWindow.prototype.containsPath = function(pathToCheck) {
      var initialPath, _base;
      initialPath = this.getInitialPath();
      if (!initialPath) {
        return false;
      } else if (!pathToCheck) {
        return false;
      } else if (pathToCheck === initialPath) {
        return true;
      } else if (typeof (_base = fs.statSyncNoException(pathToCheck)).isDirectory === "function" ? _base.isDirectory() : void 0) {
        return false;
      } else if (pathToCheck.indexOf(path.join(initialPath, path.sep)) === 0) {
        return true;
      } else {
        return false;
      }
    };

    AtomWindow.prototype.handleEvents = function() {
      this.browserWindow.on('destroyed', (function(_this) {
        return function() {
          return global.atomApplication.removeWindow(_this);
        };
      })(this));
      this.browserWindow.on('unresponsive', (function(_this) {
        return function() {
          var chosen;
          if (_this.isSpec) {
            return;
          }
          chosen = dialog.showMessageBox(_this.browserWindow, {
            type: 'warning',
            buttons: ['Close', 'Keep Waiting'],
            message: 'Editor is not responding',
            detail: 'The editor is not responding. Would you like to force close it or just keep waiting?'
          });
          if (chosen === 0) {
            return _this.browserWindow.destroy();
          }
        };
      })(this));
      this.browserWindow.on('crashed', (function(_this) {
        return function() {
          var chosen;
          if (_this.exitWhenDone) {
            global.atomApplication.exit(100);
          }
          chosen = dialog.showMessageBox(_this.browserWindow, {
            type: 'warning',
            buttons: ['Close Window', 'Reload', 'Keep It Open'],
            message: 'The editor has crashed',
            detail: 'Please report this issue to https://github.com/atom/atom/issues'
          });
          switch (chosen) {
            case 0:
              return _this.browserWindow.destroy();
            case 1:
              return _this.browserWindow.restart();
          }
        };
      })(this));
      this.browserWindow.on('context-menu', (function(_this) {
        return function(menuTemplate) {
          return new ContextMenu(menuTemplate, _this.browserWindow);
        };
      })(this));
      if (this.isSpec) {
        return this.browserWindow.on('blur', (function(_this) {
          return function() {
            return _this.browserWindow.focusOnWebView();
          };
        })(this));
      }
    };

    AtomWindow.prototype.openPath = function(pathToOpen, initialLine) {
      if (this.loaded) {
        this.focus();
        this.sendCommand('window:open-path', {
          pathToOpen: pathToOpen,
          initialLine: initialLine
        });
        if (global.atomApplication.getUpdateVersion()) {
          return this.sendCommand('window:update-available', global.atomApplication.getUpdateVersion());
        }
      } else {
        return this.browserWindow.once('window:loaded', (function(_this) {
          return function() {
            return _this.openPath(pathToOpen, initialLine);
          };
        })(this));
      }
    };

    AtomWindow.prototype.sendCommand = function() {
      var args, command;
      command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this.isSpecWindow()) {
        if (!this.sendCommandToFirstResponder(command)) {
          switch (command) {
            case 'window:reload':
              return this.reload();
            case 'window:toggle-dev-tools':
              return this.toggleDevTools();
            case 'window:close':
              return this.close();
          }
        }
      } else if (this.isWebViewFocused()) {
        return this.sendCommandToBrowserWindow.apply(this, [command].concat(__slice.call(args)));
      } else {
        if (!this.sendCommandToFirstResponder(command)) {
          return this.sendCommandToBrowserWindow.apply(this, [command].concat(__slice.call(args)));
        }
      }
    };

    AtomWindow.prototype.sendCommandToBrowserWindow = function() {
      var action, args, command, _ref;
      command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      action = ((_ref = args[0]) != null ? _ref.contextCommand : void 0) ? 'context-command' : 'command';
      return ipc.sendChannel.apply(ipc, [this.browserWindow.getProcessId(), this.browserWindow.getRoutingId(), action, command].concat(__slice.call(args)));
    };

    AtomWindow.prototype.sendCommandToFirstResponder = function(command) {
      switch (command) {
        case 'core:undo':
          Menu.sendActionToFirstResponder('undo:');
          break;
        case 'core:redo':
          Menu.sendActionToFirstResponder('redo:');
          break;
        case 'core:copy':
          Menu.sendActionToFirstResponder('copy:');
          break;
        case 'core:cut':
          Menu.sendActionToFirstResponder('cut:');
          break;
        case 'core:paste':
          Menu.sendActionToFirstResponder('paste:');
          break;
        case 'core:select-all':
          Menu.sendActionToFirstResponder('selectAll:');
          break;
        default:
          return false;
      }
      return true;
    };

    AtomWindow.prototype.close = function() {
      return this.browserWindow.close();
    };

    AtomWindow.prototype.focus = function() {
      return this.browserWindow.focus();
    };

    AtomWindow.prototype.getSize = function() {
      return this.browserWindow.getSize();
    };

    AtomWindow.prototype.handlesAtomCommands = function() {
      return !this.isSpecWindow() && this.isWebViewFocused();
    };

    AtomWindow.prototype.isFocused = function() {
      return this.browserWindow.isFocused();
    };

    AtomWindow.prototype.isWebViewFocused = function() {
      return this.browserWindow.isWebViewFocused();
    };

    AtomWindow.prototype.isSpecWindow = function() {
      return this.isSpec;
    };

    AtomWindow.prototype.reload = function() {
      return this.browserWindow.restart();
    };

    AtomWindow.prototype.toggleDevTools = function() {
      return this.browserWindow.toggleDevTools();
    };

    return AtomWindow;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/browser/atom-window.js.map
