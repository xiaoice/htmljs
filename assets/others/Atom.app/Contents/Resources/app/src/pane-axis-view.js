(function() {
  var PaneAxisView, PaneView, View,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('./space-pen-extensions').View;

  PaneView = null;

  module.exports = PaneAxisView = (function(_super) {
    __extends(PaneAxisView, _super);

    function PaneAxisView() {
      this.onChildRemoved = __bind(this.onChildRemoved, this);
      this.onChildAdded = __bind(this.onChildAdded, this);
      this.onChildrenChanged = __bind(this.onChildrenChanged, this);
      return PaneAxisView.__super__.constructor.apply(this, arguments);
    }

    PaneAxisView.prototype.initialize = function(model) {
      var child, _i, _len, _ref;
      this.model = model;
      _ref = this.model.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        this.onChildAdded(child);
      }
      return this.subscribe(this.model.children, 'changed', this.onChildrenChanged);
    };

    PaneAxisView.prototype.afterAttach = function() {
      return this.container = this.closest('.panes').view();
    };

    PaneAxisView.prototype.viewForModel = function(model) {
      var viewClass;
      viewClass = model.getViewClass();
      return model._view != null ? model._view : model._view = new viewClass(model);
    };

    PaneAxisView.prototype.onChildrenChanged = function(_arg) {
      var child, focusedElement, i, index, insertedValues, removedValues, _i, _j, _len, _len1;
      index = _arg.index, removedValues = _arg.removedValues, insertedValues = _arg.insertedValues;
      if (this.hasFocus()) {
        focusedElement = document.activeElement;
      }
      for (_i = 0, _len = removedValues.length; _i < _len; _i++) {
        child = removedValues[_i];
        this.onChildRemoved(child, index);
      }
      for (i = _j = 0, _len1 = insertedValues.length; _j < _len1; i = ++_j) {
        child = insertedValues[i];
        this.onChildAdded(child, index + i);
      }
      if (document.activeElement === document.body) {
        return focusedElement != null ? focusedElement.focus() : void 0;
      }
    };

    PaneAxisView.prototype.onChildAdded = function(child, index) {
      var view;
      view = this.viewForModel(child);
      return this.insertAt(index, view);
    };

    PaneAxisView.prototype.onChildRemoved = function(child) {
      var view, _ref;
      view = this.viewForModel(child);
      view.detach();
      if (PaneView == null) {
        PaneView = require('./pane-view');
      }
      if (view instanceof PaneView && view.model.isDestroyed()) {
        return (_ref = this.container) != null ? _ref.trigger('pane:removed', [view]) : void 0;
      }
    };

    return PaneAxisView;

  })(View);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/pane-axis-view.js.map
