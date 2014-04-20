(function() {
  var Model, PaneAxis, PaneColumnView, PaneRowView, Sequence, Serializable, flatten, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('theorist'), Model = _ref.Model, Sequence = _ref.Sequence;

  flatten = require('underscore-plus').flatten;

  Serializable = require('serializable');

  PaneRowView = null;

  PaneColumnView = null;

  module.exports = PaneAxis = (function(_super) {
    __extends(PaneAxis, _super);

    atom.deserializers.add(PaneAxis);

    Serializable.includeInto(PaneAxis);

    function PaneAxis(_arg) {
      var children;
      this.container = _arg.container, this.orientation = _arg.orientation, children = _arg.children;
      this.children = Sequence.fromArray(children != null ? children : []);
      this.subscribe(this.children.onEach((function(_this) {
        return function(child) {
          child.parent = _this;
          child.container = _this.container;
          return _this.subscribe(child, 'destroyed', function() {
            return _this.removeChild(child);
          });
        };
      })(this)));
      this.subscribe(this.children.onRemoval((function(_this) {
        return function(child) {
          return _this.unsubscribe(child);
        };
      })(this)));
      this.when(this.children.$length.becomesLessThan(2), 'reparentLastChild');
      this.when(this.children.$length.becomesLessThan(1), 'destroy');
    }

    PaneAxis.prototype.deserializeParams = function(params) {
      var container;
      container = params.container;
      params.children = params.children.map(function(childState) {
        return atom.deserializers.deserialize(childState, {
          container: container
        });
      });
      return params;
    };

    PaneAxis.prototype.serializeParams = function() {
      return {
        children: this.children.map(function(child) {
          return child.serialize();
        }),
        orientation: this.orientation
      };
    };

    PaneAxis.prototype.getViewClass = function() {
      if (this.orientation === 'vertical') {
        return PaneColumnView != null ? PaneColumnView : PaneColumnView = require('./pane-column-view');
      } else {
        return PaneRowView != null ? PaneRowView : PaneRowView = require('./pane-row-view');
      }
    };

    PaneAxis.prototype.getPanes = function() {
      return flatten(this.children.map(function(child) {
        return child.getPanes();
      }));
    };

    PaneAxis.prototype.addChild = function(child, index) {
      if (index == null) {
        index = this.children.length;
      }
      return this.children.splice(index, 0, child);
    };

    PaneAxis.prototype.removeChild = function(child) {
      var index;
      index = this.children.indexOf(child);
      if (index === -1) {
        throw new Error("Removing non-existent child");
      }
      return this.children.splice(index, 1);
    };

    PaneAxis.prototype.replaceChild = function(oldChild, newChild) {
      var index;
      index = this.children.indexOf(oldChild);
      if (index === -1) {
        throw new Error("Replacing non-existent child");
      }
      return this.children.splice(index, 1, newChild);
    };

    PaneAxis.prototype.insertChildBefore = function(currentChild, newChild) {
      var index;
      index = this.children.indexOf(currentChild);
      return this.children.splice(index, 0, newChild);
    };

    PaneAxis.prototype.insertChildAfter = function(currentChild, newChild) {
      var index;
      index = this.children.indexOf(currentChild);
      return this.children.splice(index + 1, 0, newChild);
    };

    PaneAxis.prototype.reparentLastChild = function() {
      return this.parent.replaceChild(this, this.children[0]);
    };

    return PaneAxis;

  })(Model);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/pane-axis.js.map
