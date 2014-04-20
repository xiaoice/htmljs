(function() {
  var $, $$, $$$, Point, Range, View, _ref, _ref1;

  _ref = require('text-buffer'), Point = _ref.Point, Range = _ref.Range;

  module.exports = {
    BufferedNodeProcess: require('../src/buffered-node-process'),
    BufferedProcess: require('../src/buffered-process'),
    Git: require('../src/git'),
    Point: Point,
    Range: Range
  };

  if (!process.env.ATOM_SHELL_INTERNAL_RUN_AS_NODE) {
    _ref1 = require('../src/space-pen-extensions'), $ = _ref1.$, $$ = _ref1.$$, $$$ = _ref1.$$$, View = _ref1.View;
    module.exports.$ = $;
    module.exports.$$ = $$;
    module.exports.$$$ = $$$;
    module.exports.EditorView = require('../src/editor-view');
    module.exports.ScrollView = require('../src/scroll-view');
    module.exports.SelectListView = require('../src/select-list-view');
    module.exports.Task = require('../src/task');
    module.exports.View = View;
    module.exports.WorkspaceView = require('../src/workspace-view');
  }

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/exports/atom.js.map
