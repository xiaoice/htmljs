(function() {
  var PathReplacer;

  PathReplacer = require('scandal').PathReplacer;

  module.exports = function(filePaths, regexSource, regexFlags, replacementText) {
    var callback, regex, replacer;
    callback = this.async();
    replacer = new PathReplacer();
    regex = new RegExp(regexSource, regexFlags);
    replacer.on('path-replaced', function(result) {
      return emit('replace:path-replaced', result);
    });
    return replacer.replacePaths(regex, replacementText, filePaths, function() {
      return callback();
    });
  };

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/replace-handler.js.map
