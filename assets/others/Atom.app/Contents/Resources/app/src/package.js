(function() {
  var $, CSON, Emitter, Package, Q, ScopedProperties, async, fs, path, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  path = require('path');

  _ = require('underscore-plus');

  async = require('async');

  CSON = require('season');

  fs = require('fs-plus');

  Emitter = require('emissary').Emitter;

  Q = require('q');

  $ = require('./space-pen-extensions').$;

  ScopedProperties = require('./scoped-properties');

  module.exports = Package = (function() {
    Emitter.includeInto(Package);

    Package.stylesheetsDir = 'stylesheets';

    Package.loadMetadata = function(packagePath, ignoreErrors) {
      var error, metadata, metadataPath;
      if (ignoreErrors == null) {
        ignoreErrors = false;
      }
      if (metadataPath = CSON.resolve(path.join(packagePath, 'package'))) {
        try {
          metadata = CSON.readFileSync(metadataPath);
        } catch (_error) {
          error = _error;
          if (!ignoreErrors) {
            throw error;
          }
        }
      }
      if (metadata == null) {
        metadata = {};
      }
      metadata.name = path.basename(packagePath);
      return metadata;
    };

    Package.prototype.keymaps = null;

    Package.prototype.menus = null;

    Package.prototype.stylesheets = null;

    Package.prototype.grammars = null;

    Package.prototype.scopedProperties = null;

    Package.prototype.mainModulePath = null;

    Package.prototype.resolvedMainModulePath = false;

    Package.prototype.mainModule = null;

    function Package(path, metadata) {
      var _ref, _ref1;
      this.path = path;
      this.metadata = metadata;
      this.handleActivationEvent = __bind(this.handleActivationEvent, this);
      if (this.metadata == null) {
        this.metadata = Package.loadMetadata(this.path);
      }
      this.name = (_ref = (_ref1 = this.metadata) != null ? _ref1.name : void 0) != null ? _ref : path.basename(this.path);
      this.reset();
    }

    Package.prototype.enable = function() {
      return atom.config.removeAtKeyPath('core.disabledPackages', this.name);
    };

    Package.prototype.disable = function() {
      return atom.config.pushAtKeyPath('core.disabledPackages', this.name);
    };

    Package.prototype.isTheme = function() {
      var _ref;
      return ((_ref = this.metadata) != null ? _ref.theme : void 0) != null;
    };

    Package.prototype.measure = function(key, fn) {
      var startTime, value;
      startTime = Date.now();
      value = fn();
      this[key] = Date.now() - startTime;
      return value;
    };

    Package.prototype.getType = function() {
      return 'atom';
    };

    Package.prototype.getStylesheetType = function() {
      return 'bundled';
    };

    Package.prototype.load = function() {
      this.measure('loadTime', (function(_this) {
        return function() {
          var error, _ref;
          try {
            _this.loadKeymaps();
            _this.loadMenus();
            _this.loadStylesheets();
            _this.grammarsPromise = _this.loadGrammars();
            _this.scopedPropertiesPromise = _this.loadScopedProperties();
            if (_this.metadata.activationEvents == null) {
              return _this.requireMainModule();
            }
          } catch (_error) {
            error = _error;
            return console.warn("Failed to load package named '" + _this.name + "'", (_ref = error.stack) != null ? _ref : error);
          }
        };
      })(this));
      return this;
    };

    Package.prototype.reset = function() {
      this.stylesheets = [];
      this.keymaps = [];
      this.menus = [];
      this.grammars = [];
      return this.scopedProperties = [];
    };

    Package.prototype.activate = function() {
      if (this.activationDeferred == null) {
        this.activationDeferred = Q.defer();
        this.measure('activateTime', (function(_this) {
          return function() {
            _this.activateResources();
            if (_this.metadata.activationEvents != null) {
              return _this.subscribeToActivationEvents();
            } else {
              return _this.activateNow();
            }
          };
        })(this));
      }
      return Q.all([this.grammarsPromise, this.scopedPropertiesPromise, this.activationDeferred.promise]);
    };

    Package.prototype.activateNow = function() {
      var e, _ref;
      try {
        this.activateConfig();
        this.activateStylesheets();
        if (this.requireMainModule()) {
          this.mainModule.activate((_ref = atom.packages.getPackageState(this.name)) != null ? _ref : {});
          this.mainActivated = true;
        }
      } catch (_error) {
        e = _error;
        console.warn("Failed to activate package named '" + this.name + "'", e.stack);
      }
      return this.activationDeferred.resolve();
    };

    Package.prototype.activateConfig = function() {
      var _base;
      if (this.configActivated) {
        return;
      }
      this.requireMainModule();
      if (this.mainModule != null) {
        atom.config.setDefaults(this.name, this.mainModule.configDefaults);
        if (typeof (_base = this.mainModule).activateConfig === "function") {
          _base.activateConfig();
        }
      }
      return this.configActivated = true;
    };

    Package.prototype.activateStylesheets = function() {
      var content, stylesheetPath, type, _i, _len, _ref, _ref1;
      if (this.stylesheetsActivated) {
        return;
      }
      type = this.getStylesheetType();
      _ref = this.stylesheets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], stylesheetPath = _ref1[0], content = _ref1[1];
        atom.themes.applyStylesheet(stylesheetPath, content, type);
      }
      return this.stylesheetsActivated = true;
    };

    Package.prototype.activateResources = function() {
      var grammar, keymapPath, map, menuPath, scopedProperties, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      _ref = this.keymaps;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], keymapPath = _ref1[0], map = _ref1[1];
        atom.keymap.add(keymapPath, map);
      }
      _ref2 = this.menus;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        _ref3 = _ref2[_j], menuPath = _ref3[0], map = _ref3[1];
        atom.contextMenu.add(menuPath, map['context-menu']);
      }
      _ref4 = this.menus;
      for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
        _ref5 = _ref4[_k], menuPath = _ref5[0], map = _ref5[1];
        if (map.menu) {
          atom.menu.add(map.menu);
        }
      }
      _ref6 = this.grammars;
      for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
        grammar = _ref6[_l];
        grammar.activate();
      }
      this.grammarsActivated = true;
      _ref7 = this.scopedProperties;
      for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
        scopedProperties = _ref7[_m];
        scopedProperties.activate();
      }
      return this.scopedPropertiesActivated = true;
    };

    Package.prototype.loadKeymaps = function() {
      return this.keymaps = this.getKeymapPaths().map(function(keymapPath) {
        return [keymapPath, CSON.readFileSync(keymapPath)];
      });
    };

    Package.prototype.loadMenus = function() {
      return this.menus = this.getMenuPaths().map(function(menuPath) {
        return [menuPath, CSON.readFileSync(menuPath)];
      });
    };

    Package.prototype.getKeymapPaths = function() {
      var keymapsDirPath;
      keymapsDirPath = path.join(this.path, 'keymaps');
      if (this.metadata.keymaps) {
        return this.metadata.keymaps.map(function(name) {
          return fs.resolve(keymapsDirPath, name, ['json', 'cson', '']);
        });
      } else {
        return fs.listSync(keymapsDirPath, ['cson', 'json']);
      }
    };

    Package.prototype.getMenuPaths = function() {
      var menusDirPath;
      menusDirPath = path.join(this.path, 'menus');
      if (this.metadata.menus) {
        return this.metadata.menus.map(function(name) {
          return fs.resolve(menusDirPath, name, ['json', 'cson', '']);
        });
      } else {
        return fs.listSync(menusDirPath, ['cson', 'json']);
      }
    };

    Package.prototype.loadStylesheets = function() {
      return this.stylesheets = this.getStylesheetPaths().map(function(stylesheetPath) {
        return [stylesheetPath, atom.themes.loadStylesheet(stylesheetPath)];
      });
    };

    Package.prototype.getStylesheetsPath = function() {
      return path.join(this.path, this.constructor.stylesheetsDir);
    };

    Package.prototype.getStylesheetPaths = function() {
      var indexStylesheet, stylesheetDirPath;
      stylesheetDirPath = this.getStylesheetsPath();
      if (this.metadata.stylesheetMain) {
        return [fs.resolve(this.path, this.metadata.stylesheetMain)];
      } else if (this.metadata.stylesheets) {
        return this.metadata.stylesheets.map(function(name) {
          return fs.resolve(stylesheetDirPath, name, ['css', 'less', '']);
        });
      } else if (indexStylesheet = fs.resolve(this.path, 'index', ['css', 'less'])) {
        return [indexStylesheet];
      } else {
        return fs.listSync(stylesheetDirPath, ['css', 'less']);
      }
    };

    Package.prototype.loadGrammars = function() {
      var deferred, grammarsDirPath, loadGrammar;
      this.grammars = [];
      loadGrammar = (function(_this) {
        return function(grammarPath, callback) {
          return atom.syntax.readGrammar(grammarPath, function(error, grammar) {
            var _ref;
            if (error != null) {
              console.warn("Failed to load grammar: " + grammarPath, (_ref = error.stack) != null ? _ref : error);
            } else {
              _this.grammars.push(grammar);
              if (_this.grammarsActivated) {
                grammar.activate();
              }
            }
            return callback();
          });
        };
      })(this);
      deferred = Q.defer();
      grammarsDirPath = path.join(this.path, 'grammars');
      fs.list(grammarsDirPath, ['json', 'cson'], function(error, grammarPaths) {
        if (grammarPaths == null) {
          grammarPaths = [];
        }
        return async.each(grammarPaths, loadGrammar, function() {
          return deferred.resolve();
        });
      });
      return deferred.promise;
    };

    Package.prototype.loadScopedProperties = function() {
      var deferred, loadScopedPropertiesFile, scopedPropertiesDirPath;
      this.scopedProperties = [];
      loadScopedPropertiesFile = (function(_this) {
        return function(scopedPropertiesPath, callback) {
          return ScopedProperties.load(scopedPropertiesPath, function(error, scopedProperties) {
            var _ref;
            if (error != null) {
              console.warn("Failed to load scoped properties: " + scopedPropertiesPath, (_ref = error.stack) != null ? _ref : error);
            } else {
              _this.scopedProperties.push(scopedProperties);
              if (_this.scopedPropertiesActivated) {
                scopedProperties.activate();
              }
            }
            return callback();
          });
        };
      })(this);
      deferred = Q.defer();
      scopedPropertiesDirPath = path.join(this.path, 'scoped-properties');
      fs.list(scopedPropertiesDirPath, ['json', 'cson'], function(error, scopedPropertiesPaths) {
        if (scopedPropertiesPaths == null) {
          scopedPropertiesPaths = [];
        }
        return async.each(scopedPropertiesPaths, loadScopedPropertiesFile, function() {
          return deferred.resolve();
        });
      });
      return deferred.promise;
    };

    Package.prototype.serialize = function() {
      var e, _ref;
      if (this.mainActivated) {
        try {
          return (_ref = this.mainModule) != null ? typeof _ref.serialize === "function" ? _ref.serialize() : void 0 : void 0;
        } catch (_error) {
          e = _error;
          return console.error("Error serializing package '" + this.name + "'", e.stack);
        }
      }
    };

    Package.prototype.deactivate = function() {
      var _ref, _ref1;
      if ((_ref = this.activationDeferred) != null) {
        _ref.reject();
      }
      this.activationDeferred = null;
      this.unsubscribeFromActivationEvents();
      this.deactivateResources();
      this.deactivateConfig();
      if (this.mainActivated) {
        if ((_ref1 = this.mainModule) != null) {
          if (typeof _ref1.deactivate === "function") {
            _ref1.deactivate();
          }
        }
      }
      return this.emit('deactivated');
    };

    Package.prototype.deactivateConfig = function() {
      var _ref;
      if ((_ref = this.mainModule) != null) {
        if (typeof _ref.deactivateConfig === "function") {
          _ref.deactivateConfig();
        }
      }
      return this.configActivated = false;
    };

    Package.prototype.deactivateResources = function() {
      var grammar, keymapPath, scopedProperties, stylesheetPath, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
      _ref = this.grammars;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        grammar = _ref[_i];
        grammar.deactivate();
      }
      _ref1 = this.scopedProperties;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        scopedProperties = _ref1[_j];
        scopedProperties.deactivate();
      }
      _ref2 = this.keymaps;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        keymapPath = _ref2[_k][0];
        atom.keymap.remove(keymapPath);
      }
      _ref3 = this.stylesheets;
      for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
        stylesheetPath = _ref3[_l][0];
        atom.themes.removeStylesheet(stylesheetPath);
      }
      this.stylesheetsActivated = false;
      this.grammarsActivated = false;
      return this.scopedPropertiesActivated = false;
    };

    Package.prototype.reloadStylesheets = function() {
      var content, oldSheets, stylesheetPath, _i, _j, _len, _len1, _ref, _ref1, _results;
      oldSheets = _.clone(this.stylesheets);
      this.loadStylesheets();
      for (_i = 0, _len = oldSheets.length; _i < _len; _i++) {
        stylesheetPath = oldSheets[_i][0];
        atom.themes.removeStylesheet(stylesheetPath);
      }
      _ref = this.stylesheets;
      _results = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        _ref1 = _ref[_j], stylesheetPath = _ref1[0], content = _ref1[1];
        _results.push(this.reloadStylesheet(stylesheetPath, content));
      }
      return _results;
    };

    Package.prototype.reloadStylesheet = function(stylesheetPath, content) {
      return atom.themes.applyStylesheet(stylesheetPath, content, this.getStylesheetType());
    };

    Package.prototype.requireMainModule = function() {
      var mainModulePath;
      if (this.mainModule != null) {
        return this.mainModule;
      }
      mainModulePath = this.getMainModulePath();
      if (fs.isFileSync(mainModulePath)) {
        return this.mainModule = require(mainModulePath);
      }
    };

    Package.prototype.getMainModulePath = function() {
      var mainModulePath;
      if (this.resolvedMainModulePath) {
        return this.mainModulePath;
      }
      this.resolvedMainModulePath = true;
      mainModulePath = this.metadata.main ? path.join(this.path, this.metadata.main) : path.join(this.path, 'index');
      return this.mainModulePath = fs.resolveExtension(mainModulePath, [""].concat(__slice.call(_.keys(require.extensions))));
    };

    Package.prototype.subscribeToActivationEvents = function() {
      var event, selector, _i, _len, _ref, _ref1, _results, _results1;
      if (this.metadata.activationEvents == null) {
        return;
      }
      if (_.isArray(this.metadata.activationEvents)) {
        _ref = this.metadata.activationEvents;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          _results.push(atom.workspaceView.command(event, this.handleActivationEvent));
        }
        return _results;
      } else if (_.isString(this.metadata.activationEvents)) {
        return atom.workspaceView.command(this.metadata.activationEvents, this.handleActivationEvent);
      } else {
        _ref1 = this.metadata.activationEvents;
        _results1 = [];
        for (event in _ref1) {
          selector = _ref1[event];
          _results1.push(atom.workspaceView.command(event, selector, this.handleActivationEvent));
        }
        return _results1;
      }
    };

    Package.prototype.handleActivationEvent = function(event) {
      var bubblePathEventHandlers;
      bubblePathEventHandlers = this.disableEventHandlersOnBubblePath(event);
      this.activateNow();
      $(event.target).trigger(event);
      this.restoreEventHandlersOnBubblePath(bubblePathEventHandlers);
      return this.unsubscribeFromActivationEvents();
    };

    Package.prototype.unsubscribeFromActivationEvents = function() {
      var event, selector, _i, _len, _ref, _ref1, _results, _results1;
      if (atom.workspaceView == null) {
        return;
      }
      if (_.isArray(this.metadata.activationEvents)) {
        _ref = this.metadata.activationEvents;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          _results.push(atom.workspaceView.off(event, this.handleActivationEvent));
        }
        return _results;
      } else if (_.isString(this.metadata.activationEvents)) {
        return atom.workspaceView.off(this.metadata.activationEvents, this.handleActivationEvent);
      } else {
        _ref1 = this.metadata.activationEvents;
        _results1 = [];
        for (event in _ref1) {
          selector = _ref1[event];
          _results1.push(atom.workspaceView.off(event, selector, this.handleActivationEvent));
        }
        return _results1;
      }
    };

    Package.prototype.disableEventHandlersOnBubblePath = function(event) {
      var bubblePathEventHandlers, disabledHandler, element, eventHandler, eventHandlers, _i, _len, _ref;
      bubblePathEventHandlers = [];
      disabledHandler = function() {};
      element = $(event.target);
      while (element.length) {
        if (eventHandlers = (_ref = element.handlers()) != null ? _ref[event.type] : void 0) {
          for (_i = 0, _len = eventHandlers.length; _i < _len; _i++) {
            eventHandler = eventHandlers[_i];
            eventHandler.disabledHandler = eventHandler.handler;
            eventHandler.handler = disabledHandler;
            bubblePathEventHandlers.push(eventHandler);
          }
        }
        element = element.parent();
      }
      return bubblePathEventHandlers;
    };

    Package.prototype.restoreEventHandlersOnBubblePath = function(eventHandlers) {
      var eventHandler, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = eventHandlers.length; _i < _len; _i++) {
        eventHandler = eventHandlers[_i];
        eventHandler.handler = eventHandler.disabledHandler;
        _results.push(delete eventHandler.disabledHandler);
      }
      return _results;
    };

    return Package;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/package.js.map
