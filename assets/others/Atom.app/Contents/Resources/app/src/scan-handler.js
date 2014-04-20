(function() {
  var PathScanner, PathSearcher, search, _ref;

  _ref = require('scandal'), PathSearcher = _ref.PathSearcher, PathScanner = _ref.PathScanner, search = _ref.search;

  module.exports = function(rootPath, regexSource, options) {
    var PATHS_COUNTER_SEARCHED_CHUNK, callback, flags, pathsSearched, regex, scanner, searcher;
    callback = this.async();
    PATHS_COUNTER_SEARCHED_CHUNK = 50;
    pathsSearched = 0;
    searcher = new PathSearcher();
    scanner = new PathScanner(rootPath, options);
    searcher.on('results-found', function(result) {
      return emit('scan:result-found', result);
    });
    scanner.on('path-found', function() {
      pathsSearched++;
      if (pathsSearched % PATHS_COUNTER_SEARCHED_CHUNK === 0) {
        return emit('scan:paths-searched', pathsSearched);
      }
    });
    flags = "g";
    if (options.ignoreCase) {
      flags += "i";
    }
    regex = new RegExp(regexSource, flags);
    return search(regex, scanner, searcher, function() {
      emit('scan:paths-searched', pathsSearched);
      return callback();
    });
  };

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/scan-handler.js.map
