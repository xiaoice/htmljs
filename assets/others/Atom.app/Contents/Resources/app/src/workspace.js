(function() {
  var Delegator, Model, Pane, PaneContainer, Q, Serializable, Workspace, join, last, remove, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('underscore-plus'), remove = _ref.remove, last = _ref.last;

  join = require('path').join;

  Model = require('theorist').Model;

  Q = require('q');

  Serializable = require('serializable');

  Delegator = require('delegato');

  PaneContainer = require('./pane-container');

  Pane = require('./pane');

  module.exports = Workspace = (function(_super) {
    __extends(Workspace, _super);

    atom.deserializers.add(Workspace);

    Serializable.includeInto(Workspace);

    Workspace.delegatesProperty('activePane', 'activePaneItem', {
      toProperty: 'paneContainer'
    });

    Workspace.delegatesMethod('getPanes', 'saveAll', 'activateNextPane', 'activatePreviousPane', {
      toProperty: 'paneContainer'
    });

    Workspace.properties({
      paneContainer: function() {
        return new PaneContainer;
      },
      fullScreen: false,
      destroyedItemUris: function() {
        return [];
      }
    });

    function Workspace() {
      this.onPaneItemDestroyed = __bind(this.onPaneItemDestroyed, this);
      Workspace.__super__.constructor.apply(this, arguments);
      this.subscribe(this.paneContainer, 'item-destroyed', this.onPaneItemDestroyed);
      this.registerOpener((function(_this) {
        return function(filePath) {
          switch (filePath) {
            case 'atom://.atom/stylesheet':
              return _this.open(atom.themes.getUserStylesheetPath());
            case 'atom://.atom/keymap':
              return _this.open(atom.keymap.getUserKeymapPath());
            case 'atom://.atom/config':
              return _this.open(atom.config.getUserConfigPath());
            case 'atom://.atom/init-script':
              return _this.open(atom.getUserInitScriptPath());
          }
        };
      })(this));
    }

    Workspace.prototype.deserializeParams = function(params) {
      params.paneContainer = PaneContainer.deserialize(params.paneContainer);
      return params;
    };

    Workspace.prototype.serializeParams = function() {
      return {
        paneContainer: this.paneContainer.serialize(),
        fullScreen: atom.isFullScreen()
      };
    };

    Workspace.prototype.eachEditor = function(callback) {
      return atom.project.eachEditor(callback);
    };

    Workspace.prototype.getEditors = function() {
      return atom.project.getEditors();
    };

    Workspace.prototype.open = function(uri, options) {
      var pane, searchAllPanes, split;
      if (uri == null) {
        uri = '';
      }
      if (options == null) {
        options = {};
      }
      searchAllPanes = options.searchAllPanes;
      split = options.split;
      uri = atom.project.resolve(uri);
      if (searchAllPanes) {
        pane = this.paneContainer.paneForUri(uri);
      }
      if (pane == null) {
        pane = (function() {
          switch (split) {
            case 'left':
              return this.activePane.findLeftmostSibling();
            case 'right':
              return this.activePane.findOrCreateRightmostSibling();
            default:
              return this.activePane;
          }
        }).call(this);
      }
      return this.openUriInPane(uri, pane, options);
    };

    Workspace.prototype.openLicense = function() {
      return this.open(join(atom.getLoadSettings().resourcePath, 'LICENSE'));
    };

    Workspace.prototype.openSync = function(uri, options) {
      var activatePane, initialLine, item, opener, _i, _len, _ref1, _ref2, _ref3;
      if (uri == null) {
        uri = '';
      }
      if (options == null) {
        options = {};
      }
      initialLine = options.initialLine;
      activatePane = (_ref1 = (_ref2 = options.activatePane) != null ? _ref2 : options.changeFocus) != null ? _ref1 : true;
      uri = atom.project.resolve(uri);
      item = this.activePane.itemForUri(uri);
      if (uri) {
        _ref3 = this.getOpeners();
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          opener = _ref3[_i];
          if (!item) {
            if (item == null) {
              item = opener(uri, options);
            }
          }
        }
      }
      if (item == null) {
        item = atom.project.openSync(uri, {
          initialLine: initialLine
        });
      }
      this.activePane.activateItem(item);
      this.itemOpened(item);
      if (activatePane) {
        this.activePane.activate();
      }
      return item;
    };

    Workspace.prototype.openUriInPane = function(uri, pane, options) {
      var changeFocus, item, opener, _i, _len, _ref1, _ref2;
      if (options == null) {
        options = {};
      }
      changeFocus = (_ref1 = options.changeFocus) != null ? _ref1 : true;
      item = pane.itemForUri(uri);
      if (uri) {
        _ref2 = this.getOpeners();
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          opener = _ref2[_i];
          if (!item) {
            if (item == null) {
              item = opener(atom.project.resolve(uri), options);
            }
          }
        }
      }
      if (item == null) {
        item = atom.project.open(uri, options);
      }
      return Q(item).then((function(_this) {
        return function(item) {
          if (!pane) {
            pane = new Pane({
              items: [item]
            });
            _this.paneContainer.root = pane;
          }
          _this.itemOpened(item);
          pane.activateItem(item);
          if (changeFocus) {
            pane.activate();
          }
          _this.emit("uri-opened");
          return item;
        };
      })(this))["catch"](function(error) {
        var _ref3;
        return console.error((_ref3 = error.stack) != null ? _ref3 : error);
      });
    };

    Workspace.prototype.reopenItemSync = function() {
      var uri;
      if (uri = this.destroyedItemUris.pop()) {
        return this.openSync(uri);
      }
    };

    Workspace.prototype.registerOpener = function(opener) {
      return atom.project.registerOpener(opener);
    };

    Workspace.prototype.unregisterOpener = function(opener) {
      return atom.project.unregisterOpener(opener);
    };

    Workspace.prototype.getOpeners = function() {
      return atom.project.openers;
    };

    Workspace.prototype.getActivePane = function() {
      return this.paneContainer.activePane;
    };

    Workspace.prototype.paneForUri = function(uri) {
      return this.paneContainer.paneForUri(uri);
    };

    Workspace.prototype.saveActivePaneItem = function() {
      var _ref1;
      return (_ref1 = this.activePane) != null ? _ref1.saveActiveItem() : void 0;
    };

    Workspace.prototype.saveActivePaneItemAs = function() {
      var _ref1;
      return (_ref1 = this.activePane) != null ? _ref1.saveActiveItemAs() : void 0;
    };

    Workspace.prototype.destroyActivePaneItem = function() {
      var _ref1;
      return (_ref1 = this.activePane) != null ? _ref1.destroyActiveItem() : void 0;
    };

    Workspace.prototype.destroyActivePane = function() {
      var _ref1;
      return (_ref1 = this.activePane) != null ? _ref1.destroy() : void 0;
    };

    Workspace.prototype.getActiveEditor = function() {
      var _ref1;
      return (_ref1 = this.activePane) != null ? _ref1.getActiveEditor() : void 0;
    };

    Workspace.prototype.increaseFontSize = function() {
      return atom.config.set("editor.fontSize", atom.config.get("editor.fontSize") + 1);
    };

    Workspace.prototype.decreaseFontSize = function() {
      var fontSize;
      fontSize = atom.config.get("editor.fontSize");
      if (fontSize > 1) {
        return atom.config.set("editor.fontSize", fontSize - 1);
      }
    };

    Workspace.prototype.resetFontSize = function() {
      return atom.config.restoreDefault("editor.fontSize");
    };

    Workspace.prototype.itemOpened = function(item) {
      var uri;
      if (uri = typeof item.getUri === "function" ? item.getUri() : void 0) {
        return remove(this.destroyedItemUris, uri);
      }
    };

    Workspace.prototype.onPaneItemDestroyed = function(item) {
      var uri;
      if (uri = typeof item.getUri === "function" ? item.getUri() : void 0) {
        return this.destroyedItemUris.push(uri);
      }
    };

    Workspace.prototype.destroyed = function() {
      return this.paneContainer.destroy();
    };

    return Workspace;

  })(Model);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/workspace.js.map
