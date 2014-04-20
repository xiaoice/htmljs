(function() {
  var Atom, startTime;

  startTime = Date.now();

  require('./window');

  Atom = require('./atom');

  window.atom = Atom.loadOrCreate('editor');

  atom.initialize();

  atom.startEditorWindow();

  window.atom.loadTime = Date.now() - startTime;

  console.log("Window load time: " + (atom.getWindowLoadTime()) + "ms");

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/window-bootstrap.js.map
