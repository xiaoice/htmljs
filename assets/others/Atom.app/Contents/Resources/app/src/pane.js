(function() {
  var Editor, Model, Pane, PaneAxis, PaneView, Sequence, Serializable, compact, dirname, extend, find, last, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('underscore-plus'), find = _ref.find, compact = _ref.compact, extend = _ref.extend, last = _ref.last;

  dirname = require('path').dirname;

  _ref1 = require('theorist'), Model = _ref1.Model, Sequence = _ref1.Sequence;

  Serializable = require('serializable');

  PaneAxis = require('./pane-axis');

  Editor = require('./editor');

  PaneView = null;

  module.exports = Pane = (function(_super) {
    __extends(Pane, _super);

    atom.deserializers.add(Pane);

    Serializable.includeInto(Pane);

    Pane.properties({
      container: void 0,
      activeItem: void 0,
      focused: false
    });

    Pane.behavior('active', function() {
      return this.$container["switch"](function(container) {
        return container != null ? container.$activePane : void 0;
      }).map((function(_this) {
        return function(activePane) {
          return activePane === _this;
        };
      })(this)).distinctUntilChanged();
    });

    function Pane(params) {
      var _ref2;
      Pane.__super__.constructor.apply(this, arguments);
      this.items = Sequence.fromArray(compact((_ref2 = params != null ? params.items : void 0) != null ? _ref2 : []));
      if (this.activeItem == null) {
        this.activeItem = this.items[0];
      }
      this.subscribe(this.items.onEach((function(_this) {
        return function(item) {
          if (typeof item.on === 'function') {
            return _this.subscribe(item, 'destroyed', function() {
              return _this.removeItem(item, true);
            });
          }
        };
      })(this)));
      this.subscribe(this.items.onRemoval((function(_this) {
        return function(item, index) {
          if (typeof item.on === 'function') {
            return _this.unsubscribe(item);
          }
        };
      })(this)));
      if (params != null ? params.active : void 0) {
        this.activate();
      }
    }

    Pane.prototype.serializeParams = function() {
      var _ref2;
      return {
        items: compact(this.items.map(function(item) {
          return typeof item.serialize === "function" ? item.serialize() : void 0;
        })),
        activeItemUri: (_ref2 = this.activeItem) != null ? typeof _ref2.getUri === "function" ? _ref2.getUri() : void 0 : void 0,
        focused: this.focused,
        active: this.active
      };
    };

    Pane.prototype.deserializeParams = function(params) {
      var activeItemUri, items;
      items = params.items, activeItemUri = params.activeItemUri;
      params.items = compact(items.map(function(itemState) {
        return atom.deserializers.deserialize(itemState);
      }));
      params.activeItem = find(params.items, function(item) {
        return (typeof item.getUri === "function" ? item.getUri() : void 0) === activeItemUri;
      });
      return params;
    };

    Pane.prototype.getViewClass = function() {
      return PaneView != null ? PaneView : PaneView = require('./pane-view');
    };

    Pane.prototype.isActive = function() {
      return this.active;
    };

    Pane.prototype.focus = function() {
      this.focused = true;
      if (!this.isActive()) {
        return this.activate();
      }
    };

    Pane.prototype.blur = function() {
      this.focused = false;
      return true;
    };

    Pane.prototype.activate = function() {
      var _ref2;
      if ((_ref2 = this.container) != null) {
        _ref2.activePane = this;
      }
      return this.emit('activated');
    };

    Pane.prototype.getPanes = function() {
      return [this];
    };

    Pane.prototype.getItems = function() {
      return this.items.slice();
    };

    Pane.prototype.getActiveItem = function() {
      return this.activeItem;
    };

    Pane.prototype.getActiveEditor = function() {
      if (this.activeItem instanceof Editor) {
        return this.activeItem;
      }
    };

    Pane.prototype.itemAtIndex = function(index) {
      return this.items[index];
    };

    Pane.prototype.activateNextItem = function() {
      var index;
      index = this.getActiveItemIndex();
      if (index < this.items.length - 1) {
        return this.activateItemAtIndex(index + 1);
      } else {
        return this.activateItemAtIndex(0);
      }
    };

    Pane.prototype.activatePreviousItem = function() {
      var index;
      index = this.getActiveItemIndex();
      if (index > 0) {
        return this.activateItemAtIndex(index - 1);
      } else {
        return this.activateItemAtIndex(this.items.length - 1);
      }
    };

    Pane.prototype.getActiveItemIndex = function() {
      return this.items.indexOf(this.activeItem);
    };

    Pane.prototype.activateItemAtIndex = function(index) {
      return this.activateItem(this.itemAtIndex(index));
    };

    Pane.prototype.activateItem = function(item) {
      if (item != null) {
        this.addItem(item);
        return this.activeItem = item;
      }
    };

    Pane.prototype.addItem = function(item, index) {
      if (index == null) {
        index = this.getActiveItemIndex() + 1;
      }
      if (__indexOf.call(this.items, item) >= 0) {
        return;
      }
      this.items.splice(index, 0, item);
      this.emit('item-added', item, index);
      if (this.activeItem == null) {
        this.activeItem = item;
      }
      return item;
    };

    Pane.prototype.addItems = function(items, index) {
      var i, item, _i, _len;
      if (index == null) {
        index = this.getActiveItemIndex() + 1;
      }
      items = items.filter((function(_this) {
        return function(item) {
          return !(__indexOf.call(_this.items, item) >= 0);
        };
      })(this));
      for (i = _i = 0, _len = items.length; _i < _len; i = ++_i) {
        item = items[i];
        this.addItem(item, index + i);
      }
      return items;
    };

    Pane.prototype.removeItem = function(item, destroying) {
      var index, _ref2;
      index = this.items.indexOf(item);
      if (index === -1) {
        return;
      }
      if (item === this.activeItem) {
        if (this.items.length === 1) {
          this.activeItem = void 0;
        } else if (index === 0) {
          this.activateNextItem();
        } else {
          this.activatePreviousItem();
        }
      }
      this.items.splice(index, 1);
      this.emit('item-removed', item, index, destroying);
      if (destroying) {
        if ((_ref2 = this.container) != null) {
          _ref2.itemDestroyed(item);
        }
      }
      if (this.items.length === 0 && atom.config.get('core.destroyEmptyPanes')) {
        return this.destroy();
      }
    };

    Pane.prototype.moveItem = function(item, newIndex) {
      var oldIndex;
      oldIndex = this.items.indexOf(item);
      this.items.splice(oldIndex, 1);
      this.items.splice(newIndex, 0, item);
      return this.emit('item-moved', item, newIndex);
    };

    Pane.prototype.moveItemToPane = function(item, pane, index) {
      pane.addItem(item, index);
      return this.removeItem(item);
    };

    Pane.prototype.destroyActiveItem = function() {
      this.destroyItem(this.activeItem);
      return false;
    };

    Pane.prototype.destroyItem = function(item) {
      if (item != null) {
        this.emit('before-item-destroyed', item);
        if (this.promptToSaveItem(item)) {
          this.removeItem(item, true);
          if (typeof item.destroy === "function") {
            item.destroy();
          }
          return true;
        } else {
          return false;
        }
      }
    };

    Pane.prototype.destroyItems = function() {
      var item, _i, _len, _ref2, _results;
      _ref2 = this.getItems();
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        item = _ref2[_i];
        _results.push(this.destroyItem(item));
      }
      return _results;
    };

    Pane.prototype.destroyInactiveItems = function() {
      var item, _i, _len, _ref2, _results;
      _ref2 = this.getItems();
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        item = _ref2[_i];
        if (item !== this.activeItem) {
          _results.push(this.destroyItem(item));
        }
      }
      return _results;
    };

    Pane.prototype.destroy = function() {
      var _ref2, _ref3;
      if (!(((_ref2 = this.container) != null ? _ref2.isAlive() : void 0) && ((_ref3 = this.container) != null ? _ref3.getPanes().length : void 0) === 1)) {
        return Pane.__super__.destroy.apply(this, arguments);
      }
    };

    Pane.prototype.destroyed = function() {
      var item, _i, _len, _ref2, _results;
      if (this.isActive()) {
        this.container.activateNextPane();
      }
      _ref2 = this.items.slice();
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        item = _ref2[_i];
        _results.push(typeof item.destroy === "function" ? item.destroy() : void 0);
      }
      return _results;
    };

    Pane.prototype.promptToSaveItem = function(item) {
      var chosen, uri, _ref2;
      if (!(typeof item.shouldPromptToSave === "function" ? item.shouldPromptToSave() : void 0)) {
        return true;
      }
      uri = item.getUri();
      chosen = atom.confirm({
        message: "'" + ((_ref2 = typeof item.getTitle === "function" ? item.getTitle() : void 0) != null ? _ref2 : item.getUri()) + "' has changes, do you want to save them?",
        detailedMessage: "Your changes will be lost if you close this item without saving.",
        buttons: ["Save", "Cancel", "Don't Save"]
      });
      switch (chosen) {
        case 0:
          return this.saveItem(item, function() {
            return true;
          });
        case 1:
          return false;
        case 2:
          return true;
      }
    };

    Pane.prototype.saveActiveItem = function() {
      return this.saveItem(this.activeItem);
    };

    Pane.prototype.saveActiveItemAs = function() {
      return this.saveItemAs(this.activeItem);
    };

    Pane.prototype.saveItem = function(item, nextAction) {
      if (item != null ? typeof item.getUri === "function" ? item.getUri() : void 0 : void 0) {
        if (typeof item.save === "function") {
          item.save();
        }
        return typeof nextAction === "function" ? nextAction() : void 0;
      } else {
        return this.saveItemAs(item, nextAction);
      }
    };

    Pane.prototype.saveItemAs = function(item, nextAction) {
      var itemPath, path;
      if ((item != null ? item.saveAs : void 0) == null) {
        return;
      }
      itemPath = typeof item.getPath === "function" ? item.getPath() : void 0;
      if (itemPath) {
        itemPath = dirname(itemPath);
      }
      path = atom.showSaveDialogSync(itemPath);
      if (path) {
        item.saveAs(path);
        return typeof nextAction === "function" ? nextAction() : void 0;
      }
    };

    Pane.prototype.saveItems = function() {
      var item, _i, _len, _ref2, _results;
      _ref2 = this.getItems();
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        item = _ref2[_i];
        _results.push(this.saveItem(item));
      }
      return _results;
    };

    Pane.prototype.itemForUri = function(uri) {
      return find(this.items, function(item) {
        return (typeof item.getUri === "function" ? item.getUri() : void 0) === uri;
      });
    };

    Pane.prototype.activateItemForUri = function(uri) {
      var item;
      if (item = this.itemForUri(uri)) {
        this.activateItem(item);
        return true;
      } else {
        return false;
      }
    };

    Pane.prototype.copyActiveItem = function() {
      var _base, _ref2;
      if (this.activeItem != null) {
        return (_ref2 = typeof (_base = this.activeItem).copy === "function" ? _base.copy() : void 0) != null ? _ref2 : atom.deserializers.deserialize(this.activeItem.serialize());
      }
    };

    Pane.prototype.splitLeft = function(params) {
      return this.split('horizontal', 'before', params);
    };

    Pane.prototype.splitRight = function(params) {
      return this.split('horizontal', 'after', params);
    };

    Pane.prototype.splitUp = function(params) {
      return this.split('vertical', 'before', params);
    };

    Pane.prototype.splitDown = function(params) {
      return this.split('vertical', 'after', params);
    };

    Pane.prototype.split = function(orientation, side, params) {
      var newPane;
      if (this.parent.orientation !== orientation) {
        this.parent.replaceChild(this, new PaneAxis({
          container: this.container,
          orientation: orientation,
          children: [this]
        }));
      }
      newPane = new this.constructor(extend({
        focused: true
      }, params));
      switch (side) {
        case 'before':
          this.parent.insertChildBefore(this, newPane);
          break;
        case 'after':
          this.parent.insertChildAfter(this, newPane);
      }
      newPane.activate();
      return newPane;
    };

    Pane.prototype.findLeftmostSibling = function() {
      if (this.parent.orientation === 'horizontal') {
        return this.parent.children[0];
      } else {
        return this;
      }
    };

    Pane.prototype.findOrCreateRightmostSibling = function() {
      if (this.parent.orientation === 'horizontal') {
        return last(this.parent.children);
      } else {
        return this.splitRight();
      }
    };

    return Pane;

  })(Model);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/pane.js.map
