(function() {
  var AtomProtocolHandler, app, fs, path, protocol;

  app = require('app');

  fs = require('fs-plus');

  path = require('path');

  protocol = require('protocol');

  module.exports = AtomProtocolHandler = (function() {
    function AtomProtocolHandler(resourcePath) {
      this.resourcePath = resourcePath;
      this.loadPaths = [path.join(app.getHomeDir(), '.atom', 'dev', 'packages'), path.join(app.getHomeDir(), '.atom', 'packages'), path.join(this.resourcePath, 'node_modules')];
      this.registerAtomProtocol();
    }

    AtomProtocolHandler.prototype.registerAtomProtocol = function() {
      return protocol.registerProtocol('atom', (function(_this) {
        return function(request) {
          var filePath, loadPath, relativePath, _i, _len, _ref;
          relativePath = path.normalize(request.url.substr(7));
          _ref = _this.loadPaths;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            loadPath = _ref[_i];
            filePath = path.join(loadPath, relativePath);
            if (fs.isFileSync(filePath)) {
              break;
            }
          }
          return new protocol.RequestFileJob(filePath);
        };
      })(this));
    };

    return AtomProtocolHandler;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/browser/atom-protocol-handler.js.map
