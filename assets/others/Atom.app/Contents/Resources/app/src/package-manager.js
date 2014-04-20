(function() {
  var Emitter, Package, PackageManager, Q, ThemePackage, fs, path, _,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  path = require('path');

  _ = require('underscore-plus');

  Emitter = require('emissary').Emitter;

  fs = require('fs-plus');

  Q = require('q');

  Package = require('./package');

  ThemePackage = require('./theme-package');

  module.exports = PackageManager = (function() {
    Emitter.includeInto(PackageManager);

    function PackageManager(_arg) {
      var configDirPath, devMode;
      configDirPath = _arg.configDirPath, devMode = _arg.devMode, this.resourcePath = _arg.resourcePath;
      this.packageDirPaths = [path.join(configDirPath, "packages")];
      if (devMode) {
        this.packageDirPaths.unshift(path.join(configDirPath, "dev", "packages"));
      }
      this.loadedPackages = {};
      this.activePackages = {};
      this.packageStates = {};
      this.packageActivators = [];
      this.registerPackageActivator(this, ['atom', 'textmate']);
    }

    PackageManager.prototype.getApmPath = function() {
      return this.apmPath != null ? this.apmPath : this.apmPath = require.resolve('atom-package-manager/bin/apm');
    };

    PackageManager.prototype.getPackageDirPaths = function() {
      return _.clone(this.packageDirPaths);
    };

    PackageManager.prototype.getPackageState = function(name) {
      return this.packageStates[name];
    };

    PackageManager.prototype.setPackageState = function(name, state) {
      return this.packageStates[name] = state;
    };

    PackageManager.prototype.enablePackage = function(name) {
      var pack;
      pack = this.loadPackage(name);
      if (pack != null) {
        pack.enable();
      }
      return pack;
    };

    PackageManager.prototype.disablePackage = function(name) {
      var pack;
      pack = this.loadPackage(name);
      if (pack != null) {
        pack.disable();
      }
      return pack;
    };

    PackageManager.prototype.activate = function() {
      var activator, packages, types, _i, _len, _ref, _ref1;
      _ref = this.packageActivators;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], activator = _ref1[0], types = _ref1[1];
        packages = this.getLoadedPackagesForTypes(types);
        activator.activatePackages(packages);
      }
      return this.emit('activated');
    };

    PackageManager.prototype.registerPackageActivator = function(activator, types) {
      return this.packageActivators.push([activator, types]);
    };

    PackageManager.prototype.activatePackages = function(packages) {
      var pack, _i, _len;
      for (_i = 0, _len = packages.length; _i < _len; _i++) {
        pack = packages[_i];
        this.activatePackage(pack.name);
      }
      return this.observeDisabledPackages();
    };

    PackageManager.prototype.activatePackage = function(name) {
      var pack;
      if (pack = this.getActivePackage(name)) {
        return Q(pack);
      } else {
        pack = this.loadPackage(name);
        return pack.activate().then((function(_this) {
          return function() {
            _this.activePackages[pack.name] = pack;
            return pack;
          };
        })(this));
      }
    };

    PackageManager.prototype.deactivatePackages = function() {
      var pack, _i, _len, _ref;
      _ref = this.getLoadedPackages();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pack = _ref[_i];
        this.deactivatePackage(pack.name);
      }
      return this.unobserveDisabledPackages();
    };

    PackageManager.prototype.deactivatePackage = function(name) {
      var pack, state;
      pack = this.getLoadedPackage(name);
      if (this.isPackageActive(name)) {
        if (state = typeof pack.serialize === "function" ? pack.serialize() : void 0) {
          this.setPackageState(pack.name, state);
        }
      }
      pack.deactivate();
      return delete this.activePackages[pack.name];
    };

    PackageManager.prototype.getActivePackages = function() {
      return _.values(this.activePackages);
    };

    PackageManager.prototype.getActivePackage = function(name) {
      return this.activePackages[name];
    };

    PackageManager.prototype.isPackageActive = function(name) {
      return this.getActivePackage(name) != null;
    };

    PackageManager.prototype.unobserveDisabledPackages = function() {
      var _ref;
      if ((_ref = this.disabledPackagesSubscription) != null) {
        _ref.off();
      }
      return this.disabledPackagesSubscription = null;
    };

    PackageManager.prototype.observeDisabledPackages = function() {
      return this.disabledPackagesSubscription != null ? this.disabledPackagesSubscription : this.disabledPackagesSubscription = atom.config.observe('core.disabledPackages', {
        callNow: false
      }, (function(_this) {
        return function(disabledPackages, _arg) {
          var packageName, packagesToDisable, packagesToEnable, previous, _i, _j, _len, _len1;
          previous = _arg.previous;
          packagesToEnable = _.difference(previous, disabledPackages);
          packagesToDisable = _.difference(disabledPackages, previous);
          for (_i = 0, _len = packagesToDisable.length; _i < _len; _i++) {
            packageName = packagesToDisable[_i];
            if (_this.getActivePackage(packageName)) {
              _this.deactivatePackage(packageName);
            }
          }
          for (_j = 0, _len1 = packagesToEnable.length; _j < _len1; _j++) {
            packageName = packagesToEnable[_j];
            _this.activatePackage(packageName);
          }
          return null;
        };
      })(this));
    };

    PackageManager.prototype.loadPackages = function() {
      var packagePath, packagePaths, _i, _len;
      require('../exports/atom');
      packagePaths = this.getAvailablePackagePaths();
      packagePaths = packagePaths.filter((function(_this) {
        return function(packagePath) {
          return !_this.isPackageDisabled(path.basename(packagePath));
        };
      })(this));
      packagePaths = _.uniq(packagePaths, function(packagePath) {
        return path.basename(packagePath);
      });
      for (_i = 0, _len = packagePaths.length; _i < _len; _i++) {
        packagePath = packagePaths[_i];
        this.loadPackage(packagePath);
      }
      return this.emit('loaded');
    };

    PackageManager.prototype.loadPackage = function(nameOrPath) {
      var error, metadata, name, pack, packagePath, _ref, _ref1;
      if (packagePath = this.resolvePackagePath(nameOrPath)) {
        name = path.basename(nameOrPath);
        if (pack = this.getLoadedPackage(name)) {
          return pack;
        }
        try {
          metadata = (_ref = Package.loadMetadata(packagePath)) != null ? _ref : {};
          if (metadata.theme) {
            pack = new ThemePackage(packagePath, metadata);
          } else {
            pack = new Package(packagePath, metadata);
          }
          pack.load();
          this.loadedPackages[pack.name] = pack;
          return pack;
        } catch (_error) {
          error = _error;
          return console.warn("Failed to load package.json '" + (path.basename(packagePath)) + "'", (_ref1 = error.stack) != null ? _ref1 : error);
        }
      } else {
        throw new Error("Could not resolve '" + nameOrPath + "' to a package path");
      }
    };

    PackageManager.prototype.unloadPackages = function() {
      var name, _i, _len, _ref;
      _ref = _.keys(this.loadedPackages);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        this.unloadPackage(name);
      }
      return null;
    };

    PackageManager.prototype.unloadPackage = function(name) {
      var pack;
      if (this.isPackageActive(name)) {
        throw new Error("Tried to unload active package '" + name + "'");
      }
      if (pack = this.getLoadedPackage(name)) {
        return delete this.loadedPackages[pack.name];
      } else {
        throw new Error("No loaded package for name '" + name + "'");
      }
    };

    PackageManager.prototype.getLoadedPackage = function(name) {
      return this.loadedPackages[name];
    };

    PackageManager.prototype.isPackageLoaded = function(name) {
      return this.getLoadedPackage(name) != null;
    };

    PackageManager.prototype.getLoadedPackages = function() {
      return _.values(this.loadedPackages);
    };

    PackageManager.prototype.getLoadedPackagesForTypes = function(types) {
      var pack, _i, _len, _ref, _ref1, _results;
      _ref = this.getLoadedPackages();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pack = _ref[_i];
        if (_ref1 = pack.getType(), __indexOf.call(types, _ref1) >= 0) {
          _results.push(pack);
        }
      }
      return _results;
    };

    PackageManager.prototype.resolvePackagePath = function(name) {
      var packagePath;
      if (fs.isDirectorySync(name)) {
        return name;
      }
      packagePath = fs.resolve.apply(fs, __slice.call(this.packageDirPaths).concat([name]));
      if (fs.isDirectorySync(packagePath)) {
        return packagePath;
      }
      packagePath = path.join(this.resourcePath, 'node_modules', name);
      if (this.hasAtomEngine(packagePath)) {
        return packagePath;
      }
    };

    PackageManager.prototype.isPackageDisabled = function(name) {
      var _ref;
      return _.include((_ref = atom.config.get('core.disabledPackages')) != null ? _ref : [], name);
    };

    PackageManager.prototype.hasAtomEngine = function(packagePath) {
      var metadata, _ref;
      metadata = Package.loadMetadata(packagePath, true);
      return (metadata != null ? (_ref = metadata.engines) != null ? _ref.atom : void 0 : void 0) != null;
    };

    PackageManager.prototype.isBundledPackage = function(name) {
      return this.getPackageDependencies().hasOwnProperty(name);
    };

    PackageManager.prototype.getPackageDependencies = function() {
      var metadataPath, _ref;
      if (this.packageDependencies == null) {
        try {
          metadataPath = path.join(this.resourcePath, 'package.json');
          this.packageDependencies = ((_ref = JSON.parse(fs.readFileSync(metadataPath))) != null ? _ref : {}).packageDependencies;
        } catch (_error) {}
        if (this.packageDependencies == null) {
          this.packageDependencies = {};
        }
      }
      return this.packageDependencies;
    };

    PackageManager.prototype.getAvailablePackagePaths = function() {
      var packageDirPath, packageName, packagePath, packagePaths, packageVersion, packagesPath, _i, _j, _len, _len1, _ref, _ref1, _ref2;
      packagePaths = [];
      _ref = this.packageDirPaths;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        packageDirPath = _ref[_i];
        _ref1 = fs.listSync(packageDirPath);
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          packagePath = _ref1[_j];
          if (fs.isDirectorySync(packagePath)) {
            packagePaths.push(packagePath);
          }
        }
      }
      packagesPath = path.join(this.resourcePath, 'node_modules');
      _ref2 = this.getPackageDependencies();
      for (packageName in _ref2) {
        packageVersion = _ref2[packageName];
        packagePath = path.join(packagesPath, packageName);
        if (fs.isDirectorySync(packagePath)) {
          packagePaths.push(packagePath);
        }
      }
      return _.uniq(packagePaths);
    };

    PackageManager.prototype.getAvailablePackageNames = function() {
      return _.uniq(_.map(this.getAvailablePackagePaths(), function(packagePath) {
        return path.basename(packagePath);
      }));
    };

    PackageManager.prototype.getAvailablePackageMetadata = function() {
      var metadata, name, packagePath, packages, _i, _len, _ref, _ref1, _ref2;
      packages = [];
      _ref = this.getAvailablePackagePaths();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        packagePath = _ref[_i];
        name = path.basename(packagePath);
        metadata = (_ref1 = (_ref2 = this.getLoadedPackage(name)) != null ? _ref2.metadata : void 0) != null ? _ref1 : Package.loadMetadata(packagePath, true);
        packages.push(metadata);
      }
      return packages;
    };

    return PackageManager;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/package-manager.js.map
