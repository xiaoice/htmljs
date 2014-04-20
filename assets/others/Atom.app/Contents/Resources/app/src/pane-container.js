(function() {
  var Model, Pane, PaneContainer, Serializable, find,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  find = require('underscore-plus').find;

  Model = require('theorist').Model;

  Serializable = require('serializable');

  Pane = require('./pane');

  module.exports = PaneContainer = (function(_super) {
    __extends(PaneContainer, _super);

    atom.deserializers.add(PaneContainer);

    Serializable.includeInto(PaneContainer);

    PaneContainer.properties({
      root: function() {
        return new Pane;
      },
      activePane: null
    });

    PaneContainer.prototype.previousRoot = null;

    PaneContainer.behavior('activePaneItem', function() {
      return this.$activePane["switch"](function(activePane) {
        return activePane != null ? activePane.$activeItem : void 0;
      }).distinctUntilChanged();
    });

    function PaneContainer(params) {
      this.onRootChanged = __bind(this.onRootChanged, this);
      PaneContainer.__super__.constructor.apply(this, arguments);
      this.subscribe(this.$root, this.onRootChanged);
      if (params != null ? params.destroyEmptyPanes : void 0) {
        this.destroyEmptyPanes();
      }
    }

    PaneContainer.prototype.deserializeParams = function(params) {
      params.root = atom.deserializers.deserialize(params.root, {
        container: this
      });
      params.destroyEmptyPanes = atom.config.get('core.destroyEmptyPanes');
      return params;
    };

    PaneContainer.prototype.serializeParams = function(params) {
      var _ref;
      return {
        root: (_ref = this.root) != null ? _ref.serialize() : void 0
      };
    };

    PaneContainer.prototype.replaceChild = function(oldChild, newChild) {
      if (oldChild !== this.root) {
        throw new Error("Replacing non-existent child");
      }
      return this.root = newChild;
    };

    PaneContainer.prototype.getPanes = function() {
      var _ref, _ref1;
      return (_ref = (_ref1 = this.root) != null ? _ref1.getPanes() : void 0) != null ? _ref : [];
    };

    PaneContainer.prototype.paneForUri = function(uri) {
      return find(this.getPanes(), function(pane) {
        return pane.itemForUri(uri) != null;
      });
    };

    PaneContainer.prototype.saveAll = function() {
      var pane, _i, _len, _ref, _results;
      _ref = this.getPanes();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _results.push(pane.saveItems());
      }
      return _results;
    };

    PaneContainer.prototype.activateNextPane = function() {
      var currentIndex, nextIndex, panes;
      panes = this.getPanes();
      if (panes.length > 1) {
        currentIndex = panes.indexOf(this.activePane);
        nextIndex = (currentIndex + 1) % panes.length;
        panes[nextIndex].activate();
        return true;
      } else {
        return false;
      }
    };

    PaneContainer.prototype.activatePreviousPane = function() {
      var currentIndex, panes, previousIndex;
      panes = this.getPanes();
      if (panes.length > 1) {
        currentIndex = panes.indexOf(this.activePane);
        previousIndex = currentIndex - 1;
        if (previousIndex < 0) {
          previousIndex = panes.length - 1;
        }
        panes[previousIndex].activate();
        return true;
      } else {
        return false;
      }
    };

    PaneContainer.prototype.onRootChanged = function(root) {
      if (this.previousRoot != null) {
        this.unsubscribe(this.previousRoot);
      }
      this.previousRoot = root;
      if (root == null) {
        this.activePane = null;
        return;
      }
      root.parent = this;
      root.container = this;
      if (root instanceof Pane) {
        return this.activePane != null ? this.activePane : this.activePane = root;
      }
    };

    PaneContainer.prototype.destroyEmptyPanes = function() {
      var pane, _i, _len, _ref, _results;
      _ref = this.getPanes();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        if (pane.items.length === 0) {
          _results.push(pane.destroy());
        }
      }
      return _results;
    };

    PaneContainer.prototype.itemDestroyed = function(item) {
      return this.emit('item-destroyed', item);
    };

    PaneContainer.prototype.destroyed = function() {
      var pane, _i, _len, _ref, _results;
      _ref = this.getPanes();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _results.push(pane.destroy());
      }
      return _results;
    };

    return PaneContainer;

  })(Model);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/pane-container.js.map
