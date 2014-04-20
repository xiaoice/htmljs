(function() {
  var $, PaneAxisView, PaneRowView, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  $ = require('./space-pen-extensions').$;

  _ = require('underscore-plus');

  PaneAxisView = require('./pane-axis-view');

  module.exports = PaneRowView = (function(_super) {
    __extends(PaneRowView, _super);

    function PaneRowView() {
      return PaneRowView.__super__.constructor.apply(this, arguments);
    }

    PaneRowView.content = function() {
      return this.div({
        "class": 'pane-row'
      });
    };

    PaneRowView.prototype.className = function() {
      return "PaneRow";
    };

    return PaneRowView;

  })(PaneAxisView);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/pane-row-view.js.map
