(function() {
  var CSON, Config, Emitter, async, fs, path, pathWatcher, _;

  _ = require('underscore-plus');

  fs = require('fs-plus');

  Emitter = require('emissary').Emitter;

  CSON = require('season');

  path = require('path');

  async = require('async');

  pathWatcher = require('pathwatcher');

  module.exports = Config = (function() {
    Emitter.includeInto(Config);

    function Config(_arg) {
      var _ref;
      _ref = _arg != null ? _arg : {}, this.configDirPath = _ref.configDirPath, this.resourcePath = _ref.resourcePath;
      this.defaultSettings = {};
      this.settings = {};
      this.configFileHasErrors = false;
      this.configFilePath = fs.resolve(this.configDirPath, 'config', ['json', 'cson']);
      if (this.configFilePath == null) {
        this.configFilePath = path.join(this.configDirPath, 'config.cson');
      }
    }

    Config.prototype.initializeConfigDirectory = function(done) {
      var onConfigDirFile, queue, templateConfigDirPath;
      if (fs.existsSync(this.configDirPath)) {
        return;
      }
      fs.makeTreeSync(this.configDirPath);
      queue = async.queue((function(_this) {
        return function(_arg, callback) {
          var destinationPath, sourcePath;
          sourcePath = _arg.sourcePath, destinationPath = _arg.destinationPath;
          return fs.copy(sourcePath, destinationPath, callback);
        };
      })(this));
      queue.drain = done;
      templateConfigDirPath = fs.resolve(this.resourcePath, 'dot-atom');
      onConfigDirFile = (function(_this) {
        return function(sourcePath) {
          var destinationPath, relativePath;
          relativePath = sourcePath.substring(templateConfigDirPath.length + 1);
          destinationPath = path.join(_this.configDirPath, relativePath);
          return queue.push({
            sourcePath: sourcePath,
            destinationPath: destinationPath
          });
        };
      })(this);
      return fs.traverseTree(templateConfigDirPath, onConfigDirFile, function(path) {
        return true;
      });
    };

    Config.prototype.load = function() {
      this.initializeConfigDirectory();
      this.loadUserConfig();
      return this.observeUserConfig();
    };

    Config.prototype.loadUserConfig = function() {
      var e, userConfig;
      if (!fs.existsSync(this.configFilePath)) {
        fs.makeTreeSync(path.dirname(this.configFilePath));
        CSON.writeFileSync(this.configFilePath, {});
      }
      try {
        userConfig = CSON.readFileSync(this.configFilePath);
        _.extend(this.settings, userConfig);
        this.configFileHasErrors = false;
        return this.emit('updated');
      } catch (_error) {
        e = _error;
        this.configFileHasErrors = true;
        console.error("Failed to load user config '" + this.configFilePath + "'", e.message);
        return console.error(e.stack);
      }
    };

    Config.prototype.observeUserConfig = function() {
      return this.watchSubscription != null ? this.watchSubscription : this.watchSubscription = pathWatcher.watch(this.configFilePath, (function(_this) {
        return function(eventType) {
          if (eventType === 'change' && (_this.watchSubscription != null)) {
            return _this.loadUserConfig();
          }
        };
      })(this));
    };

    Config.prototype.unobserveUserConfig = function() {
      var _ref;
      if ((_ref = this.watchSubscription) != null) {
        _ref.close();
      }
      return this.watchSubscription = null;
    };

    Config.prototype.setDefaults = function(keyPath, defaults) {
      var hash, key, keys, _i, _len;
      keys = keyPath.split('.');
      hash = this.defaultSettings;
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (hash[key] == null) {
          hash[key] = {};
        }
        hash = hash[key];
      }
      _.extend(hash, defaults);
      return this.update();
    };

    Config.prototype.getUserConfigPath = function() {
      return this.configFilePath;
    };

    Config.prototype.getSettings = function() {
      return _.deepExtend(this.settings, this.defaultSettings);
    };

    Config.prototype.get = function(keyPath) {
      var value, _ref;
      value = (_ref = _.valueForKeyPath(this.settings, keyPath)) != null ? _ref : _.valueForKeyPath(this.defaultSettings, keyPath);
      return _.deepClone(value);
    };

    Config.prototype.getInt = function(keyPath) {
      return parseInt(this.get(keyPath));
    };

    Config.prototype.getPositiveInt = function(keyPath, defaultValue) {
      if (defaultValue == null) {
        defaultValue = 0;
      }
      return Math.max(this.getInt(keyPath), 0) || defaultValue;
    };

    Config.prototype.set = function(keyPath, value) {
      if (this.get(keyPath) !== value) {
        if (_.valueForKeyPath(this.defaultSettings, keyPath) === value) {
          value = void 0;
        }
        _.setValueForKeyPath(this.settings, keyPath, value);
        this.update();
      }
      return value;
    };

    Config.prototype.toggle = function(keyPath) {
      return this.set(keyPath, !this.get(keyPath));
    };

    Config.prototype.restoreDefault = function(keyPath) {
      return this.set(keyPath, _.valueForKeyPath(this.defaultSettings, keyPath));
    };

    Config.prototype.pushAtKeyPath = function(keyPath, value) {
      var arrayValue, result, _ref;
      arrayValue = (_ref = this.get(keyPath)) != null ? _ref : [];
      result = arrayValue.push(value);
      this.set(keyPath, arrayValue);
      return result;
    };

    Config.prototype.unshiftAtKeyPath = function(keyPath, value) {
      var arrayValue, result, _ref;
      arrayValue = (_ref = this.get(keyPath)) != null ? _ref : [];
      result = arrayValue.unshift(value);
      this.set(keyPath, arrayValue);
      return result;
    };

    Config.prototype.removeAtKeyPath = function(keyPath, value) {
      var arrayValue, result, _ref;
      arrayValue = (_ref = this.get(keyPath)) != null ? _ref : [];
      result = _.remove(arrayValue, value);
      this.set(keyPath, arrayValue);
      return result;
    };

    Config.prototype.observe = function(keyPath, options, callback) {
      var eventName, previousValue, subscription, updateCallback, value, _ref;
      if (options == null) {
        options = {};
      }
      if (_.isFunction(options)) {
        callback = options;
        options = {};
      }
      value = this.get(keyPath);
      previousValue = _.clone(value);
      updateCallback = (function(_this) {
        return function() {
          var previous;
          value = _this.get(keyPath);
          if (!_.isEqual(value, previousValue)) {
            previous = previousValue;
            previousValue = _.clone(value);
            return callback(value, {
              previous: previous
            });
          }
        };
      })(this);
      eventName = "updated." + (keyPath.replace(/\./, '-'));
      subscription = this.on(eventName, updateCallback);
      if ((_ref = options.callNow) != null ? _ref : true) {
        callback(value);
      }
      return subscription;
    };

    Config.prototype.unobserve = function(keyPath) {
      return this.off("updated." + (keyPath.replace(/\./, '-')));
    };

    Config.prototype.update = function() {
      if (this.configFileHasErrors) {
        return;
      }
      this.save();
      return this.emit('updated');
    };

    Config.prototype.save = function() {
      return CSON.writeFileSync(this.configFilePath, this.settings);
    };

    return Config;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/config.js.map
