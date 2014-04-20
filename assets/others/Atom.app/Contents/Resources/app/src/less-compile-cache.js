(function() {
  var LessCache, LessCompileCache, Subscriber, os, path, tmpDir;

  path = require('path');

  os = require('os');

  LessCache = require('less-cache');

  Subscriber = require('emissary').Subscriber;

  tmpDir = process.platform === 'win32' ? os.tmpdir() : '/tmp';

  module.exports = LessCompileCache = (function() {
    Subscriber.includeInto(LessCompileCache);

    LessCompileCache.cacheDir = path.join(tmpDir, 'atom-compile-cache', 'less');

    function LessCompileCache(_arg) {
      var importPaths, resourcePath;
      resourcePath = _arg.resourcePath, importPaths = _arg.importPaths;
      this.lessSearchPaths = [path.join(resourcePath, 'static', 'variables'), path.join(resourcePath, 'static')];
      if (importPaths != null) {
        importPaths = importPaths.concat(this.lessSearchPaths);
      } else {
        importPaths = this.lessSearchPaths;
      }
      this.cache = new LessCache({
        cacheDir: this.constructor.cacheDir,
        importPaths: importPaths,
        resourcePath: resourcePath,
        fallbackDir: path.join(resourcePath, 'less-compile-cache')
      });
    }

    LessCompileCache.prototype.setImportPaths = function(importPaths) {
      if (importPaths == null) {
        importPaths = [];
      }
      return this.cache.setImportPaths(importPaths.concat(this.lessSearchPaths));
    };

    LessCompileCache.prototype.read = function(stylesheetPath) {
      return this.cache.readFileSync(stylesheetPath);
    };

    LessCompileCache.prototype.destroy = function() {
      return this.unsubscribe();
    };

    return LessCompileCache;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/less-compile-cache.js.map
