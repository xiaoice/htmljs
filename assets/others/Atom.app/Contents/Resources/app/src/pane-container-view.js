(function() {
  var $, Delegator, PaneContainer, PaneContainerView, PaneView, View, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Delegator = require('delegato');

  _ref = require('./space-pen-extensions'), $ = _ref.$, View = _ref.View;

  PaneView = require('./pane-view');

  PaneContainer = require('./pane-container');

  module.exports = PaneContainerView = (function(_super) {
    __extends(PaneContainerView, _super);

    function PaneContainerView() {
      this.onActivePaneItemChanged = __bind(this.onActivePaneItemChanged, this);
      this.onRootChanged = __bind(this.onRootChanged, this);
      return PaneContainerView.__super__.constructor.apply(this, arguments);
    }

    Delegator.includeInto(PaneContainerView);

    PaneContainerView.delegatesMethod('saveAll', {
      toProperty: 'model'
    });

    PaneContainerView.content = function() {
      return this.div({
        "class": 'panes'
      });
    };

    PaneContainerView.prototype.initialize = function(params) {
      var _ref1;
      if (params instanceof PaneContainer) {
        this.model = params;
      } else {
        this.model = new PaneContainer({
          root: params != null ? (_ref1 = params.root) != null ? _ref1.model : void 0 : void 0
        });
      }
      this.subscribe(this.model.$root, this.onRootChanged);
      return this.subscribe(this.model.$activePaneItem.changes, this.onActivePaneItemChanged);
    };

    PaneContainerView.prototype.viewForModel = function(model) {
      var viewClass;
      if (model != null) {
        viewClass = model.getViewClass();
        return model._view != null ? model._view : model._view = new viewClass(model);
      }
    };

    PaneContainerView.prototype.getRoot = function() {
      return this.children().first().view();
    };

    PaneContainerView.prototype.onRootChanged = function(root) {
      var focusedElement, oldRoot, view, _ref1;
      if (this.hasFocus()) {
        focusedElement = document.activeElement;
      }
      oldRoot = this.getRoot();
      if (oldRoot instanceof PaneView && oldRoot.model.isDestroyed()) {
        this.trigger('pane:removed', [oldRoot]);
      }
      if (oldRoot != null) {
        oldRoot.detach();
      }
      if (root != null) {
        view = this.viewForModel(root);
        this.append(view);
        return focusedElement != null ? focusedElement.focus() : void 0;
      } else {
        if (focusedElement != null) {
          return (_ref1 = atom.workspaceView) != null ? _ref1.focus() : void 0;
        }
      }
    };

    PaneContainerView.prototype.onActivePaneItemChanged = function(activeItem) {
      return this.trigger('pane-container:active-pane-item-changed', [activeItem]);
    };

    PaneContainerView.prototype.removeChild = function(child) {
      if (this.getRoot() !== child) {
        throw new Error("Removing non-existant child");
      }
      this.setRoot(null);
      if (child instanceof PaneView) {
        return this.trigger('pane:removed', [child]);
      }
    };

    PaneContainerView.prototype.confirmClose = function() {
      var item, pane, saved, _i, _j, _len, _len1, _ref1, _ref2;
      saved = true;
      _ref1 = this.getPaneViews();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pane = _ref1[_i];
        _ref2 = pane.getItems();
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          item = _ref2[_j];
          if (!pane.promptToSaveItem(item)) {
            saved = false;
            break;
          }
        }
      }
      return saved;
    };

    PaneContainerView.prototype.getPaneViews = function() {
      return this.find('.pane').views();
    };

    PaneContainerView.prototype.indexOfPane = function(pane) {
      return this.getPaneViews().indexOf(pane.view());
    };

    PaneContainerView.prototype.paneAtIndex = function(index) {
      return this.getPaneViews()[index];
    };

    PaneContainerView.prototype.eachPaneView = function(callback) {
      var pane, paneAttached, _i, _len, _ref1;
      _ref1 = this.getPaneViews();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pane = _ref1[_i];
        callback(pane);
      }
      paneAttached = function(e) {
        return callback($(e.target).view());
      };
      this.on('pane:attached', paneAttached);
      return {
        off: (function(_this) {
          return function() {
            return _this.off('pane:attached', paneAttached);
          };
        })(this)
      };
    };

    PaneContainerView.prototype.getFocusedPane = function() {
      return this.find('.pane:has(:focus)').view();
    };

    PaneContainerView.prototype.getActivePane = function() {
      return this.viewForModel(this.model.activePane);
    };

    PaneContainerView.prototype.getActivePaneItem = function() {
      return this.model.activePaneItem;
    };

    PaneContainerView.prototype.getActiveView = function() {
      var _ref1;
      return (_ref1 = this.getActivePane()) != null ? _ref1.activeView : void 0;
    };

    PaneContainerView.prototype.paneForUri = function(uri) {
      return this.viewForModel(this.model.paneForUri(uri));
    };

    PaneContainerView.prototype.focusNextPaneView = function() {
      return this.model.activateNextPane();
    };

    PaneContainerView.prototype.focusPreviousPaneView = function() {
      return this.model.activatePreviousPane();
    };

    PaneContainerView.prototype.focusPaneViewAbove = function() {
      var _ref1;
      return (_ref1 = this.nearestPaneInDirection('above')) != null ? _ref1.focus() : void 0;
    };

    PaneContainerView.prototype.focusPaneViewBelow = function() {
      var _ref1;
      return (_ref1 = this.nearestPaneInDirection('below')) != null ? _ref1.focus() : void 0;
    };

    PaneContainerView.prototype.focusPaneViewOnLeft = function() {
      var _ref1;
      return (_ref1 = this.nearestPaneInDirection('left')) != null ? _ref1.focus() : void 0;
    };

    PaneContainerView.prototype.focusPaneViewOnRight = function() {
      var _ref1;
      return (_ref1 = this.nearestPaneInDirection('right')) != null ? _ref1.focus() : void 0;
    };

    PaneContainerView.prototype.nearestPaneInDirection = function(direction) {
      var box, distance, pane, panes;
      distance = function(pointA, pointB) {
        var x, y;
        x = pointB.x - pointA.x;
        y = pointB.y - pointA.y;
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
      };
      pane = this.getActivePane();
      box = this.boundingBoxForPane(pane);
      panes = this.getPaneViews().filter((function(_this) {
        return function(otherPane) {
          var otherBox;
          otherBox = _this.boundingBoxForPane(otherPane);
          switch (direction) {
            case 'left':
              return otherBox.right.x <= box.left.x;
            case 'right':
              return otherBox.left.x >= box.right.x;
            case 'above':
              return otherBox.bottom.y <= box.top.y;
            case 'below':
              return otherBox.top.y >= box.bottom.y;
          }
        };
      })(this)).sort((function(_this) {
        return function(paneA, paneB) {
          var boxA, boxB;
          boxA = _this.boundingBoxForPane(paneA);
          boxB = _this.boundingBoxForPane(paneB);
          switch (direction) {
            case 'left':
              return distance(box.left, boxA.right) - distance(box.left, boxB.right);
            case 'right':
              return distance(box.right, boxA.left) - distance(box.right, boxB.left);
            case 'above':
              return distance(box.top, boxA.bottom) - distance(box.top, boxB.bottom);
            case 'below':
              return distance(box.bottom, boxA.top) - distance(box.bottom, boxB.top);
          }
        };
      })(this));
      return panes[0];
    };

    PaneContainerView.prototype.boundingBoxForPane = function(pane) {
      var boundingBox;
      boundingBox = pane[0].getBoundingClientRect();
      return {
        left: {
          x: boundingBox.left,
          y: boundingBox.top
        },
        right: {
          x: boundingBox.right,
          y: boundingBox.top
        },
        top: {
          x: boundingBox.left,
          y: boundingBox.top
        },
        bottom: {
          x: boundingBox.left,
          y: boundingBox.bottom
        }
      };
    };

    PaneContainerView.prototype.getPanes = function() {
      return this.getPaneViews();
    };

    return PaneContainerView;

  })(View);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/pane-container-view.js.map
