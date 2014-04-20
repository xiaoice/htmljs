(function() {
  var $, PaneAxisView, PaneColumnView, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  $ = require('./space-pen-extensions').$;

  _ = require('underscore-plus');

  PaneAxisView = require('./pane-axis-view');

  module.exports = PaneColumnView = (function(_super) {
    __extends(PaneColumnView, _super);

    function PaneColumnView() {
      return PaneColumnView.__super__.constructor.apply(this, arguments);
    }

    PaneColumnView.content = function() {
      return this.div({
        "class": 'pane-column'
      });
    };

    PaneColumnView.prototype.className = function() {
      return "PaneColumn";
    };

    return PaneColumnView;

  })(PaneAxisView);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/pane-column-view.js.map
