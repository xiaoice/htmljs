(function() {
  var $, Delegator, Pane, PaneView, PropertyAccessors, View, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  _ref = require('./space-pen-extensions'), $ = _ref.$, View = _ref.View;

  Delegator = require('delegato');

  PropertyAccessors = require('property-accessors');

  Pane = require('./pane');

  module.exports = PaneView = (function(_super) {
    __extends(PaneView, _super);

    function PaneView() {
      this.activeItemTitleChanged = __bind(this.activeItemTitleChanged, this);
      this.onBeforeItemDestroyed = __bind(this.onBeforeItemDestroyed, this);
      this.onItemMoved = __bind(this.onItemMoved, this);
      this.onItemRemoved = __bind(this.onItemRemoved, this);
      this.onItemAdded = __bind(this.onItemAdded, this);
      this.onActiveItemChanged = __bind(this.onActiveItemChanged, this);
      this.onActiveStatusChanged = __bind(this.onActiveStatusChanged, this);
      this.onActivated = __bind(this.onActivated, this);
      return PaneView.__super__.constructor.apply(this, arguments);
    }

    Delegator.includeInto(PaneView);

    PropertyAccessors.includeInto(PaneView);

    PaneView.version = 1;

    PaneView.content = function(wrappedView) {
      return this.div({
        "class": 'pane',
        tabindex: -1
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'item-views',
            outlet: 'itemViews'
          });
        };
      })(this));
    };

    PaneView.delegatesProperties('items', 'activeItem', {
      toProperty: 'model'
    });

    PaneView.delegatesMethods('getItems', 'activateNextItem', 'activatePreviousItem', 'getActiveItemIndex', 'activateItemAtIndex', 'activateItem', 'addItem', 'itemAtIndex', 'moveItem', 'moveItemToPane', 'destroyItem', 'destroyItems', 'destroyActiveItem', 'destroyInactiveItems', 'saveActiveItem', 'saveActiveItemAs', 'saveItem', 'saveItemAs', 'saveItems', 'itemForUri', 'activateItemForUri', 'promptToSaveItem', 'copyActiveItem', 'isActive', 'activate', 'getActiveItem', {
      toProperty: 'model'
    });

    PaneView.prototype.previousActiveItem = null;

    PaneView.prototype.initialize = function() {
      var args, item, _i, _len, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args[0] instanceof Pane) {
        this.model = args[0];
      } else {
        this.model = new Pane({
          items: args
        });
        this.model._view = this;
      }
      _ref1 = this.items;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        item = _ref1[_i];
        this.onItemAdded(item);
      }
      this.viewsByItem = new WeakMap();
      return this.handleEvents();
    };

    PaneView.prototype.handleEvents = function() {
      this.subscribe(this.model.$activeItem, this.onActiveItemChanged);
      this.subscribe(this.model, 'item-added', this.onItemAdded);
      this.subscribe(this.model, 'item-removed', this.onItemRemoved);
      this.subscribe(this.model, 'item-moved', this.onItemMoved);
      this.subscribe(this.model, 'before-item-destroyed', this.onBeforeItemDestroyed);
      this.subscribe(this.model, 'activated', this.onActivated);
      this.subscribe(this.model.$active, this.onActiveStatusChanged);
      this.subscribe(this, 'focusin', (function(_this) {
        return function() {
          return _this.model.focus();
        };
      })(this));
      this.subscribe(this, 'focusout', (function(_this) {
        return function() {
          return _this.model.blur();
        };
      })(this));
      this.subscribe(this, 'focus', (function(_this) {
        return function() {
          var _ref1;
          if ((_ref1 = _this.activeView) != null) {
            _ref1.focus();
          }
          return false;
        };
      })(this));
      this.command('pane:save-items', (function(_this) {
        return function() {
          return _this.saveItems();
        };
      })(this));
      this.command('pane:show-next-item', (function(_this) {
        return function() {
          return _this.activateNextItem();
        };
      })(this));
      this.command('pane:show-previous-item', (function(_this) {
        return function() {
          return _this.activatePreviousItem();
        };
      })(this));
      this.command('pane:show-item-1', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(0);
        };
      })(this));
      this.command('pane:show-item-2', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(1);
        };
      })(this));
      this.command('pane:show-item-3', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(2);
        };
      })(this));
      this.command('pane:show-item-4', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(3);
        };
      })(this));
      this.command('pane:show-item-5', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(4);
        };
      })(this));
      this.command('pane:show-item-6', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(5);
        };
      })(this));
      this.command('pane:show-item-7', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(6);
        };
      })(this));
      this.command('pane:show-item-8', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(7);
        };
      })(this));
      this.command('pane:show-item-9', (function(_this) {
        return function() {
          return _this.activateItemAtIndex(8);
        };
      })(this));
      this.command('pane:split-left', (function(_this) {
        return function() {
          return _this.splitLeft(_this.copyActiveItem());
        };
      })(this));
      this.command('pane:split-right', (function(_this) {
        return function() {
          return _this.splitRight(_this.copyActiveItem());
        };
      })(this));
      this.command('pane:split-up', (function(_this) {
        return function() {
          return _this.splitUp(_this.copyActiveItem());
        };
      })(this));
      this.command('pane:split-down', (function(_this) {
        return function() {
          return _this.splitDown(_this.copyActiveItem());
        };
      })(this));
      this.command('pane:close', (function(_this) {
        return function() {
          return _this.model.destroy();
        };
      })(this));
      return this.command('pane:close-other-items', (function(_this) {
        return function() {
          return _this.destroyInactiveItems();
        };
      })(this));
    };

    PaneView.prototype.removeItem = function(item) {
      return this.destroyItem(item);
    };

    PaneView.prototype.showItem = function(item) {
      return this.activateItem(item);
    };

    PaneView.prototype.showItemForUri = function(item) {
      return this.activateItemForUri(item);
    };

    PaneView.prototype.showItemAtIndex = function(index) {
      return this.activateItemAtIndex(index);
    };

    PaneView.prototype.showNextItem = function() {
      return this.activateNextItem();
    };

    PaneView.prototype.showPreviousItem = function() {
      return this.activatePreviousItem();
    };

    PaneView.prototype.afterAttach = function(onDom) {
      if (this.model.focused && onDom) {
        this.focus();
      }
      if (this.attached) {
        return;
      }
      this.container = this.closest('.panes').view();
      this.attached = true;
      return this.trigger('pane:attached', [this]);
    };

    PaneView.prototype.onActivated = function() {
      if (!this.hasFocus()) {
        return this.focus();
      }
    };

    PaneView.prototype.onActiveStatusChanged = function(active) {
      if (active) {
        this.addClass('active');
        return this.trigger('pane:became-active');
      } else {
        this.removeClass('active');
        return this.trigger('pane:became-inactive');
      }
    };

    PaneView.prototype.getNextPane = function() {
      var nextIndex, panes, _ref1;
      panes = (_ref1 = this.container) != null ? _ref1.getPaneViews() : void 0;
      if (!(panes.length > 1)) {
        return;
      }
      nextIndex = (panes.indexOf(this) + 1) % panes.length;
      return panes[nextIndex];
    };

    PaneView.prototype.getActivePaneItem = function() {
      return this.activeItem;
    };

    PaneView.prototype.onActiveItemChanged = function(item) {
      var hasFocus, view, _ref1;
      if ((_ref1 = this.previousActiveItem) != null) {
        if (typeof _ref1.off === "function") {
          _ref1.off('title-changed', this.activeItemTitleChanged);
        }
      }
      this.previousActiveItem = item;
      if (item == null) {
        return;
      }
      hasFocus = this.hasFocus();
      if (typeof item.on === "function") {
        item.on('title-changed', this.activeItemTitleChanged);
      }
      view = this.viewForItem(item);
      this.itemViews.children().not(view).hide();
      if (!view.parent().is(this.itemViews)) {
        this.itemViews.append(view);
      }
      if (this.attached) {
        view.show();
      }
      if (hasFocus) {
        view.focus();
      }
      return this.trigger('pane:active-item-changed', [item]);
    };

    PaneView.prototype.onItemAdded = function(item, index) {
      return this.trigger('pane:item-added', [item, index]);
    };

    PaneView.prototype.onItemRemoved = function(item, index, destroyed) {
      var viewToRemove;
      if (item instanceof $) {
        viewToRemove = item;
      } else if (viewToRemove = this.viewsByItem.get(item)) {
        this.viewsByItem["delete"](item);
      }
      if (viewToRemove != null) {
        if (destroyed) {
          viewToRemove.remove();
        } else {
          viewToRemove.detach();
        }
      }
      return this.trigger('pane:item-removed', [item, index]);
    };

    PaneView.prototype.onItemMoved = function(item, newIndex) {
      return this.trigger('pane:item-moved', [item, newIndex]);
    };

    PaneView.prototype.onBeforeItemDestroyed = function(item) {
      if (typeof item.off === 'function') {
        this.unsubscribe(item);
      }
      return this.trigger('pane:before-item-destroyed', [item]);
    };

    PaneView.prototype.activeItemTitleChanged = function() {
      return this.trigger('pane:active-item-title-changed');
    };

    PaneView.prototype.viewForItem = function(item) {
      var view, viewClass;
      if (item == null) {
        return;
      }
      if (item instanceof $) {
        return item;
      } else if (view = this.viewsByItem.get(item)) {
        return view;
      } else {
        viewClass = item.getViewClass();
        view = new viewClass(item);
        this.viewsByItem.set(item, view);
        return view;
      }
    };

    PaneView.prototype.accessor('activeView', function() {
      return this.viewForItem(this.activeItem);
    });

    PaneView.prototype.splitLeft = function() {
      var items;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.model.splitLeft({
        items: items
      })._view;
    };

    PaneView.prototype.splitRight = function() {
      var items;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.model.splitRight({
        items: items
      })._view;
    };

    PaneView.prototype.splitUp = function() {
      var items;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.model.splitUp({
        items: items
      })._view;
    };

    PaneView.prototype.splitDown = function() {
      var items;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.model.splitDown({
        items: items
      })._view;
    };

    PaneView.prototype.getContainer = function() {
      return this.closest('.panes').view();
    };

    PaneView.prototype.beforeRemove = function() {
      if (!this.model.isDestroyed()) {
        return this.model.destroy();
      }
    };

    PaneView.prototype.remove = function(selector, keepData) {
      if (keepData) {
        return PaneView.__super__.remove.apply(this, arguments);
      }
      this.unsubscribe();
      return PaneView.__super__.remove.apply(this, arguments);
    };

    return PaneView;

  })(View);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/pane-view.js.map
