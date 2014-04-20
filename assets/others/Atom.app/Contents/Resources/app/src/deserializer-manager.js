(function() {
  var DeserializerManager,
    __slice = [].slice;

  module.exports = DeserializerManager = (function() {
    function DeserializerManager() {
      this.deserializers = {};
    }

    DeserializerManager.prototype.add = function() {
      var classes, klass, _i, _len, _results;
      classes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = classes.length; _i < _len; _i++) {
        klass = classes[_i];
        _results.push(this.deserializers[klass.name] = klass);
      }
      return _results;
    };

    DeserializerManager.prototype.remove = function() {
      var classes, name, _i, _len, _results;
      classes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = classes.length; _i < _len; _i++) {
        name = classes[_i].name;
        _results.push(delete this.deserializers[name]);
      }
      return _results;
    };

    DeserializerManager.prototype.deserialize = function(state, params) {
      var deserializer, stateVersion, _ref;
      if (state == null) {
        return;
      }
      if (deserializer = this.get(state)) {
        stateVersion = (_ref = typeof state.get === "function" ? state.get('version') : void 0) != null ? _ref : state.version;
        if ((deserializer.version != null) && deserializer.version !== stateVersion) {
          return;
        }
        return deserializer.deserialize(state, params);
      } else {
        return console.warn("No deserializer found for", state);
      }
    };

    DeserializerManager.prototype.get = function(state) {
      var name, _ref;
      if (state == null) {
        return;
      }
      name = (_ref = typeof state.get === "function" ? state.get('deserializer') : void 0) != null ? _ref : state.deserializer;
      return this.deserializers[name];
    };

    return DeserializerManager;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/deserializer-manager.js.map
