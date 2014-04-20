(function() {
  var CSON, ScopedProperties;

  CSON = require('season');

  module.exports = ScopedProperties = (function() {
    ScopedProperties.load = function(scopedPropertiesPath, callback) {
      return CSON.readFile(scopedPropertiesPath, function(error, scopedProperties) {
        if (scopedProperties == null) {
          scopedProperties = {};
        }
        if (error != null) {
          return callback(error);
        } else {
          return callback(null, new ScopedProperties(scopedPropertiesPath, scopedProperties));
        }
      });
    };

    function ScopedProperties(path, scopedProperties) {
      this.path = path;
      this.scopedProperties = scopedProperties;
    }

    ScopedProperties.prototype.activate = function() {
      var properties, selector, _ref, _results;
      _ref = this.scopedProperties;
      _results = [];
      for (selector in _ref) {
        properties = _ref[selector];
        _results.push(atom.syntax.addProperties(this.path, selector, properties));
      }
      return _results;
    };

    ScopedProperties.prototype.deactivate = function() {
      return atom.syntax.removeProperties(this.path);
    };

    return ScopedProperties;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/scoped-properties.js.map
