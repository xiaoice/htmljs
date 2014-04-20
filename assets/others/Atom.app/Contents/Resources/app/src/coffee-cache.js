(function() {
  var CSON, CoffeeScript, cacheDir, coffeeCacheDir, compileCoffeeScript, crypto, fs, getCachePath, getCachedJavaScript, mkdir, os, path, requireCoffeeScript, tmpDir;

  crypto = require('crypto');

  fs = require('fs');

  path = require('path');

  os = require('os');

  CoffeeScript = require('coffee-script');

  CSON = require('season');

  mkdir = require('mkdirp').sync;

  tmpDir = process.platform === 'win32' ? os.tmpdir() : '/tmp';

  cacheDir = path.join(tmpDir, 'atom-compile-cache');

  coffeeCacheDir = path.join(cacheDir, 'coffee');

  CSON.setCacheDir(path.join(cacheDir, 'cson'));

  getCachePath = function(coffee) {
    var digest;
    digest = crypto.createHash('sha1').update(coffee, 'utf8').digest('hex');
    return path.join(coffeeCacheDir, "" + digest + ".coffee");
  };

  getCachedJavaScript = function(cachePath) {
    var stat;
    if (stat = fs.statSyncNoException(cachePath)) {
      try {
        if (stat.isFile()) {
          return fs.readFileSync(cachePath, 'utf8');
        }
      } catch (_error) {}
    }
  };

  compileCoffeeScript = function(coffee, filePath, cachePath) {
    var js, v3SourceMap, _ref;
    _ref = CoffeeScript.compile(coffee, {
      filename: filePath,
      sourceMap: true
    }), js = _ref.js, v3SourceMap = _ref.v3SourceMap;
    if ((typeof btoa !== "undefined" && btoa !== null) && (typeof JSON !== "undefined" && JSON !== null) && (typeof unescape !== "undefined" && unescape !== null) && (typeof encodeURIComponent !== "undefined" && encodeURIComponent !== null)) {
      js = "" + js + "\n//# sourceMappingURL=data:application/json;base64," + (btoa(unescape(encodeURIComponent(v3SourceMap)))) + "\n//# sourceURL=" + filePath;
    }
    try {
      mkdir(path.dirname(cachePath));
      fs.writeFileSync(cachePath, js);
    } catch (_error) {}
    return js;
  };

  requireCoffeeScript = function(module, filePath) {
    var cachePath, coffee, js, _ref;
    coffee = fs.readFileSync(filePath, 'utf8');
    cachePath = getCachePath(coffee);
    js = (_ref = getCachedJavaScript(cachePath)) != null ? _ref : compileCoffeeScript(coffee, filePath, cachePath);
    return module._compile(js, filePath);
  };

  module.exports = {
    cacheDir: cacheDir,
    register: function() {
      return Object.defineProperty(require.extensions, '.coffee', {
        writable: false,
        value: requireCoffeeScript
      });
    }
  };

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/coffee-cache.js.map
