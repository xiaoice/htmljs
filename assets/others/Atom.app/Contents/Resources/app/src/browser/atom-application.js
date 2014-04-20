(function() {
  var ApplicationMenu, AtomApplication, AtomProtocolHandler, AtomWindow, BrowserWindow, EventEmitter, Menu, app, autoUpdater, dialog, fs, ipc, net, os, path, shell, socketPath, url, _,
    __slice = [].slice;

  AtomWindow = require('./atom-window');

  ApplicationMenu = require('./application-menu');

  AtomProtocolHandler = require('./atom-protocol-handler');

  BrowserWindow = require('browser-window');

  Menu = require('menu');

  autoUpdater = require('auto-updater');

  app = require('app');

  dialog = require('dialog');

  fs = require('fs');

  ipc = require('ipc');

  path = require('path');

  os = require('os');

  net = require('net');

  shell = require('shell');

  url = require('url');

  EventEmitter = require('events').EventEmitter;

  _ = require('underscore-plus');

  socketPath = process.platform === 'win32' ? '\\\\.\\pipe\\atom-sock' : path.join(os.tmpdir(), 'atom.sock');

  module.exports = AtomApplication = (function() {
    _.extend(AtomApplication.prototype, EventEmitter.prototype);

    AtomApplication.prototype.updateVersion = null;

    AtomApplication.open = function(options) {
      var client, createAtomApplication;
      createAtomApplication = function() {
        return new AtomApplication(options);
      };
      if ((process.platform !== 'win32' && !fs.existsSync(socketPath)) || options.test) {
        createAtomApplication();
        return;
      }
      client = net.connect({
        path: socketPath
      }, function() {
        return client.write(JSON.stringify(options), function() {
          client.end();
          return app.terminate();
        });
      });
      return client.on('error', createAtomApplication);
    };

    AtomApplication.prototype.windows = null;

    AtomApplication.prototype.applicationMenu = null;

    AtomApplication.prototype.atomProtocolHandler = null;

    AtomApplication.prototype.resourcePath = null;

    AtomApplication.prototype.version = null;

    AtomApplication.prototype.exit = function(status) {
      return app.exit(status);
    };

    function AtomApplication(options) {
      this.resourcePath = options.resourcePath, this.version = options.version, this.devMode = options.devMode;
      global.atomApplication = this;
      this.pidsToOpenWindows = {};
      if (this.pathsToOpen == null) {
        this.pathsToOpen = [];
      }
      this.windows = [];
      this.applicationMenu = new ApplicationMenu(this.version);
      this.atomProtocolHandler = new AtomProtocolHandler(this.resourcePath);
      this.listenForArgumentsFromNewProcess();
      this.setupJavaScriptArguments();
      this.handleEvents();
      this.setupAutoUpdater();
      this.openWithOptions(options);
    }

    AtomApplication.prototype.openWithOptions = function(_arg) {
      var devMode, logFile, newWindow, pathsToOpen, pidToKillWhenClosed, specDirectory, test, urlToOpen, urlsToOpen, _i, _len, _results;
      pathsToOpen = _arg.pathsToOpen, urlsToOpen = _arg.urlsToOpen, test = _arg.test, pidToKillWhenClosed = _arg.pidToKillWhenClosed, devMode = _arg.devMode, newWindow = _arg.newWindow, specDirectory = _arg.specDirectory, logFile = _arg.logFile;
      if (test) {
        return this.runSpecs({
          exitWhenDone: true,
          resourcePath: this.resourcePath,
          specDirectory: specDirectory,
          logFile: logFile
        });
      } else if (pathsToOpen.length > 0) {
        return this.openPaths({
          pathsToOpen: pathsToOpen,
          pidToKillWhenClosed: pidToKillWhenClosed,
          newWindow: newWindow,
          devMode: devMode
        });
      } else if (urlsToOpen.length > 0) {
        _results = [];
        for (_i = 0, _len = urlsToOpen.length; _i < _len; _i++) {
          urlToOpen = urlsToOpen[_i];
          _results.push(this.openUrl({
            urlToOpen: urlToOpen,
            devMode: devMode
          }));
        }
        return _results;
      } else {
        return this.openPath({
          pidToKillWhenClosed: pidToKillWhenClosed,
          newWindow: newWindow,
          devMode: devMode
        });
      }
    };

    AtomApplication.prototype.removeWindow = function(window) {
      var _ref;
      this.windows.splice(this.windows.indexOf(window), 1);
      if (this.windows.length === 0) {
        return (_ref = this.applicationMenu) != null ? _ref.enableWindowSpecificItems(false) : void 0;
      }
    };

    AtomApplication.prototype.addWindow = function(window) {
      var _ref;
      this.windows.push(window);
      return (_ref = this.applicationMenu) != null ? _ref.enableWindowSpecificItems(true) : void 0;
    };

    AtomApplication.prototype.listenForArgumentsFromNewProcess = function() {
      var server;
      this.deleteSocketFile();
      server = net.createServer((function(_this) {
        return function(connection) {
          return connection.on('data', function(data) {
            return _this.openWithOptions(JSON.parse(data));
          });
        };
      })(this));
      server.listen(socketPath);
      return server.on('error', function(error) {
        return console.error('Application server failed', error);
      });
    };

    AtomApplication.prototype.deleteSocketFile = function() {
      var error;
      if (process.platform === 'win32') {
        return;
      }
      if (fs.existsSync(socketPath)) {
        try {
          return fs.unlinkSync(socketPath);
        } catch (_error) {
          error = _error;
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
    };

    AtomApplication.prototype.setupJavaScriptArguments = function() {
      return app.commandLine.appendSwitch('js-flags', '--harmony_collections --harmony-proxies');
    };

    AtomApplication.prototype.setupAutoUpdater = function() {
      autoUpdater.setFeedUrl("https://atom.io/api/updates?version=" + this.version);
      autoUpdater.on('checking-for-update', (function(_this) {
        return function() {
          _this.applicationMenu.showInstallUpdateItem(false);
          return _this.applicationMenu.showCheckForUpdateItem(false);
        };
      })(this));
      autoUpdater.on('update-not-available', (function(_this) {
        return function() {
          _this.applicationMenu.showInstallUpdateItem(false);
          return _this.applicationMenu.showCheckForUpdateItem(true);
        };
      })(this));
      autoUpdater.on('update-downloaded', (function(_this) {
        return function(event, releaseNotes, releaseName, releaseDate, releaseURL) {
          var atomWindow, _i, _len, _ref;
          _ref = _this.windows;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            atomWindow = _ref[_i];
            atomWindow.sendCommand('window:update-available', [releaseName, releaseNotes]);
          }
          _this.applicationMenu.showInstallUpdateItem(true);
          _this.applicationMenu.showCheckForUpdateItem(false);
          return _this.updateVersion = releaseName;
        };
      })(this));
      autoUpdater.on('error', (function(_this) {
        return function(event, message) {
          _this.applicationMenu.showInstallUpdateItem(false);
          return _this.applicationMenu.showCheckForUpdateItem(true);
        };
      })(this));
      return setTimeout((function() {
        return autoUpdater.checkForUpdates();
      }), 5000);
    };

    AtomApplication.prototype.checkForUpdate = function() {
      autoUpdater.once('update-available', function() {
        return dialog.showMessageBox({
          type: 'info',
          buttons: ['OK'],
          message: 'Update available.',
          detail: 'A new update is being downloaded.'
        });
      });
      autoUpdater.once('update-not-available', (function(_this) {
        return function() {
          return dialog.showMessageBox({
            type: 'info',
            buttons: ['OK'],
            message: 'No update available.',
            detail: "Version " + _this.version + " is the latest version."
          });
        };
      })(this));
      autoUpdater.once('error', function(event, message) {
        return dialog.showMessageBox({
          type: 'warning',
          buttons: ['OK'],
          message: 'There was an error checking for updates.',
          detail: message
        });
      });
      return autoUpdater.checkForUpdates();
    };

    AtomApplication.prototype.handleEvents = function() {
      this.on('application:about', function() {
        return Menu.sendActionToFirstResponder('orderFrontStandardAboutPanel:');
      });
      this.on('application:run-all-specs', function() {
        return this.runSpecs({
          exitWhenDone: false,
          resourcePath: global.devResourcePath
        });
      });
      this.on('application:run-benchmarks', function() {
        return this.runBenchmarks();
      });
      this.on('application:quit', function() {
        return app.quit();
      });
      this.on('application:hide', function() {
        return Menu.sendActionToFirstResponder('hide:');
      });
      this.on('application:hide-other-applications', function() {
        return Menu.sendActionToFirstResponder('hideOtherApplications:');
      });
      this.on('application:unhide-all-applications', function() {
        return Menu.sendActionToFirstResponder('unhideAllApplications:');
      });
      this.on('application:new-window', function() {
        return this.openPath({
          initialSize: this.getFocusedWindowSize()
        });
      });
      this.on('application:new-file', function() {
        var _ref;
        return ((_ref = this.focusedWindow()) != null ? _ref : this).openPath();
      });
      this.on('application:open', function() {
        return this.promptForPath();
      });
      this.on('application:open-dev', function() {
        return this.promptForPath({
          devMode: true
        });
      });
      this.on('application:minimize', function() {
        return Menu.sendActionToFirstResponder('performMiniaturize:');
      });
      this.on('application:zoom', function() {
        return Menu.sendActionToFirstResponder('zoom:');
      });
      this.on('application:bring-all-windows-to-front', function() {
        return Menu.sendActionToFirstResponder('arrangeInFront:');
      });
      this.on('application:inspect', function(_arg) {
        var x, y;
        x = _arg.x, y = _arg.y;
        return this.focusedWindow().browserWindow.inspectElement(x, y);
      });
      this.on('application:open-documentation', function() {
        return shell.openExternal('https://atom.io/docs/latest/?app');
      });
      this.on('application:install-update', function() {
        return autoUpdater.quitAndInstall();
      });
      this.on('application:check-for-update', (function(_this) {
        return function() {
          return _this.checkForUpdate();
        };
      })(this));
      this.openPathOnEvent('application:show-settings', 'atom://config');
      this.openPathOnEvent('application:open-your-config', 'atom://.atom/config');
      this.openPathOnEvent('application:open-your-init-script', 'atom://.atom/init-script');
      this.openPathOnEvent('application:open-your-keymap', 'atom://.atom/keymap');
      this.openPathOnEvent('application:open-your-snippets', 'atom://.atom/snippets');
      this.openPathOnEvent('application:open-your-stylesheet', 'atom://.atom/stylesheet');
      app.on('window-all-closed', function() {
        if (process.platform === 'win32') {
          return app.quit();
        }
      });
      app.on('will-quit', (function(_this) {
        return function() {
          return _this.deleteSocketFile();
        };
      })(this));
      app.on('will-exit', (function(_this) {
        return function() {
          return _this.deleteSocketFile();
        };
      })(this));
      app.on('open-file', (function(_this) {
        return function(event, pathToOpen) {
          event.preventDefault();
          return _this.openPath({
            pathToOpen: pathToOpen
          });
        };
      })(this));
      app.on('open-url', (function(_this) {
        return function(event, urlToOpen) {
          event.preventDefault();
          return _this.openUrl({
            urlToOpen: urlToOpen,
            devMode: _this.devMode
          });
        };
      })(this));
      ipc.on('open', (function(_this) {
        return function(processId, routingId, options) {
          var _ref;
          if (options != null) {
            if (((_ref = options.pathsToOpen) != null ? _ref.length : void 0) > 0) {
              return _this.openPaths(options);
            } else {
              return new AtomWindow(options);
            }
          } else {
            return _this.promptForPath();
          }
        };
      })(this));
      ipc.on('update-application-menu', (function(_this) {
        return function(processId, routingId, template, keystrokesByCommand) {
          return _this.applicationMenu.update(template, keystrokesByCommand);
        };
      })(this));
      ipc.on('run-package-specs', (function(_this) {
        return function(processId, routingId, specDirectory) {
          return _this.runSpecs({
            resourcePath: global.devResourcePath,
            specDirectory: specDirectory,
            exitWhenDone: false
          });
        };
      })(this));
      ipc.on('command', (function(_this) {
        return function(processId, routingId, command) {
          return _this.emit(command);
        };
      })(this));
      ipc.on('window-command', function() {
        var args, command, processId, routingId, win;
        processId = arguments[0], routingId = arguments[1], command = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
        win = BrowserWindow.fromProcessIdAndRoutingId(processId, routingId);
        return win.emit.apply(win, [command].concat(__slice.call(args)));
      });
      return ipc.on('call-window-method', function() {
        var args, method, processId, routingId, win;
        processId = arguments[0], routingId = arguments[1], method = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
        win = BrowserWindow.fromProcessIdAndRoutingId(processId, routingId);
        return win[method].apply(win, args);
      });
    };

    AtomApplication.prototype.sendCommand = function() {
      var args, command, _ref;
      command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!this.emit.apply(this, [command].concat(__slice.call(args)))) {
        return (_ref = this.focusedWindow()) != null ? _ref.sendCommand.apply(_ref, [command].concat(__slice.call(args))) : void 0;
      }
    };

    AtomApplication.prototype.openPathOnEvent = function(eventName, pathToOpen) {
      return this.on(eventName, function() {
        var window;
        if (window = this.focusedWindow()) {
          return window.openPath(pathToOpen);
        } else {
          return this.openPath({
            pathToOpen: pathToOpen
          });
        }
      });
    };

    AtomApplication.prototype.windowForPath = function(pathToOpen) {
      var atomWindow, _i, _len, _ref;
      _ref = this.windows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        atomWindow = _ref[_i];
        if (atomWindow.containsPath(pathToOpen)) {
          return atomWindow;
        }
      }
    };

    AtomApplication.prototype.focusedWindow = function() {
      return _.find(this.windows, function(atomWindow) {
        return atomWindow.isFocused();
      });
    };

    AtomApplication.prototype.getFocusedWindowSize = function() {
      var focusedWindow, height, width, _ref;
      if (focusedWindow = this.focusedWindow()) {
        _ref = focusedWindow.getSize(), width = _ref[0], height = _ref[1];
        return {
          width: width,
          height: height
        };
      } else {
        return null;
      }
    };

    AtomApplication.prototype.openPaths = function(_arg) {
      var devMode, newWindow, pathToOpen, pathsToOpen, pidToKillWhenClosed, _i, _len, _ref, _results;
      pathsToOpen = _arg.pathsToOpen, pidToKillWhenClosed = _arg.pidToKillWhenClosed, newWindow = _arg.newWindow, devMode = _arg.devMode;
      _ref = pathsToOpen != null ? pathsToOpen : [];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pathToOpen = _ref[_i];
        _results.push(this.openPath({
          pathToOpen: pathToOpen,
          pidToKillWhenClosed: pidToKillWhenClosed,
          newWindow: newWindow,
          devMode: devMode
        }));
      }
      return _results;
    };

    AtomApplication.prototype.openPath = function(_arg) {
      var basename, bootstrapScript, devMode, existingWindow, initialLine, initialSize, newWindow, openedWindow, pathToOpen, pidToKillWhenClosed, resourcePath, _ref, _ref1;
      _ref = _arg != null ? _arg : {}, pathToOpen = _ref.pathToOpen, pidToKillWhenClosed = _ref.pidToKillWhenClosed, newWindow = _ref.newWindow, devMode = _ref.devMode, initialSize = _ref.initialSize;
      if (pathToOpen) {
        _ref1 = path.basename(pathToOpen).split(':'), basename = _ref1[0], initialLine = _ref1[1];
        if (initialLine) {
          pathToOpen = "" + (path.dirname(pathToOpen)) + "/" + basename;
          initialLine -= 1;
        }
      }
      if (!devMode) {
        if (!(pidToKillWhenClosed || newWindow)) {
          existingWindow = this.windowForPath(pathToOpen);
        }
      }
      if (existingWindow) {
        openedWindow = existingWindow;
        openedWindow.openPath(pathToOpen, initialLine);
      } else {
        if (devMode) {
          try {
            bootstrapScript = require.resolve(path.join(global.devResourcePath, 'src', 'window-bootstrap'));
            resourcePath = global.devResourcePath;
          } catch (_error) {}
        }
        if (bootstrapScript == null) {
          bootstrapScript = require.resolve('../window-bootstrap');
        }
        if (resourcePath == null) {
          resourcePath = this.resourcePath;
        }
        openedWindow = new AtomWindow({
          pathToOpen: pathToOpen,
          initialLine: initialLine,
          bootstrapScript: bootstrapScript,
          resourcePath: resourcePath,
          devMode: devMode,
          initialSize: initialSize
        });
      }
      if (pidToKillWhenClosed != null) {
        this.pidsToOpenWindows[pidToKillWhenClosed] = openedWindow;
      }
      return openedWindow.browserWindow.on('destroyed', (function(_this) {
        return function() {
          var error, pid, trackedWindow, _ref2, _results;
          _ref2 = _this.pidsToOpenWindows;
          _results = [];
          for (pid in _ref2) {
            trackedWindow = _ref2[pid];
            if (!(trackedWindow === openedWindow)) {
              continue;
            }
            try {
              process.kill(pid);
            } catch (_error) {
              error = _error;
              if (error.code !== 'ESRCH') {
                console.log("Killing process " + pid + " failed: " + error.code);
              }
            }
            _results.push(delete _this.pidsToOpenWindows[pid]);
          }
          return _results;
        };
      })(this));
    };

    AtomApplication.prototype.openUrl = function(_arg) {
      var PackageManager, bootstrapScript, devMode, pack, packageName, packagePath, urlToOpen;
      urlToOpen = _arg.urlToOpen, devMode = _arg.devMode;
      if (this.packages == null) {
        PackageManager = require('../package-manager');
        fs = require('fs-plus');
        this.packages = new PackageManager({
          configDirPath: fs.absolute('~/.atom'),
          devMode: devMode,
          resourcePath: this.resourcePath
        });
      }
      packageName = url.parse(urlToOpen).host;
      pack = _.find(this.packages.getAvailablePackageMetadata(), function(_arg1) {
        var name;
        name = _arg1.name;
        return name === packageName;
      });
      if (pack != null) {
        if (pack.urlMain) {
          packagePath = this.packages.resolvePackagePath(packageName);
          bootstrapScript = path.resolve(packagePath, pack.urlMain);
          return new AtomWindow({
            bootstrapScript: bootstrapScript,
            resourcePath: this.resourcePath,
            devMode: devMode,
            urlToOpen: urlToOpen,
            initialSize: this.getFocusedWindowSize()
          });
        } else {
          return console.log("Package '" + pack.name + "' does not have a url main: " + urlToOpen);
        }
      } else {
        return console.log("Opening unknown url: " + urlToOpen);
      }
    };

    AtomApplication.prototype.runSpecs = function(_arg) {
      var bootstrapScript, devMode, error, exitWhenDone, isSpec, logFile, resourcePath, specDirectory;
      exitWhenDone = _arg.exitWhenDone, resourcePath = _arg.resourcePath, specDirectory = _arg.specDirectory, logFile = _arg.logFile;
      if (resourcePath !== this.resourcePath && !fs.existsSync(resourcePath)) {
        resourcePath = this.resourcePath;
      }
      try {
        bootstrapScript = require.resolve(path.resolve(global.devResourcePath, 'spec', 'spec-bootstrap'));
      } catch (_error) {
        error = _error;
        bootstrapScript = require.resolve(path.resolve(__dirname, '..', '..', 'spec', 'spec-bootstrap'));
      }
      isSpec = true;
      devMode = true;
      return new AtomWindow({
        bootstrapScript: bootstrapScript,
        resourcePath: resourcePath,
        exitWhenDone: exitWhenDone,
        isSpec: isSpec,
        devMode: devMode,
        specDirectory: specDirectory,
        logFile: logFile
      });
    };

    AtomApplication.prototype.runBenchmarks = function() {
      var bootstrapScript, error, isSpec;
      try {
        bootstrapScript = require.resolve(path.resolve(global.devResourcePath, 'benchmark', 'benchmark-bootstrap'));
      } catch (_error) {
        error = _error;
        bootstrapScript = require.resolve(path.resolve(__dirname, '..', '..', 'benchmark', 'benchmark-bootstrap'));
      }
      isSpec = true;
      return new AtomWindow({
        bootstrapScript: bootstrapScript,
        resourcePath: this.resourcePath,
        isSpec: isSpec
      });
    };

    AtomApplication.prototype.promptForPath = function(_arg) {
      var devMode;
      devMode = (_arg != null ? _arg : {}).devMode;
      return dialog.showOpenDialog({
        title: 'Open',
        properties: ['openFile', 'openDirectory', 'multiSelections', 'createDirectory']
      }, (function(_this) {
        return function(pathsToOpen) {
          return _this.openPaths({
            pathsToOpen: pathsToOpen,
            devMode: devMode
          });
        };
      })(this));
    };

    AtomApplication.prototype.getUpdateVersion = function() {
      return this.updateVersion;
    };

    return AtomApplication;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/browser/atom-application.js.map
