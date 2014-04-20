(function() {
  var CursorView, View, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('./space-pen-extensions').View;

  _ = require('underscore-plus');

  module.exports = CursorView = (function(_super) {
    __extends(CursorView, _super);

    function CursorView() {
      return CursorView.__super__.constructor.apply(this, arguments);
    }

    CursorView.content = function() {
      return this.div({
        "class": 'cursor idle'
      }, (function(_this) {
        return function() {
          return _this.raw('&nbsp;');
        };
      })(this));
    };

    CursorView.blinkPeriod = 800;

    CursorView.blinkCursors = function() {
      var element, _i, _len, _ref, _results;
      _ref = this.cursorViews;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        element = _ref[_i][0];
        _results.push(element.classList.toggle('blink-off'));
      }
      return _results;
    };

    CursorView.startBlinking = function(cursorView) {
      if (this.cursorViews == null) {
        this.cursorViews = [];
      }
      this.cursorViews.push(cursorView);
      if (this.cursorViews.length === 1) {
        return this.blinkInterval = setInterval(this.blinkCursors.bind(this), this.blinkPeriod / 2);
      }
    };

    CursorView.stopBlinking = function(cursorView) {
      cursorView[0].classList.remove('blink-off');
      _.remove(this.cursorViews, cursorView);
      if (this.cursorViews.length === 0) {
        return clearInterval(this.blinkInterval);
      }
    };

    CursorView.prototype.blinking = false;

    CursorView.prototype.visible = true;

    CursorView.prototype.needsUpdate = true;

    CursorView.prototype.needsRemoval = false;

    CursorView.prototype.shouldPauseBlinking = false;

    CursorView.prototype.initialize = function(cursor, editorView) {
      this.cursor = cursor;
      this.editorView = editorView;
      this.subscribe(this.cursor, 'moved', (function(_this) {
        return function() {
          _this.needsUpdate = true;
          return _this.shouldPauseBlinking = true;
        };
      })(this));
      this.subscribe(this.cursor, 'visibility-changed', (function(_this) {
        return function() {
          return _this.needsUpdate = true;
        };
      })(this));
      this.subscribe(this.cursor, 'autoscrolled', (function(_this) {
        return function() {
          return _this.editorView.requestDisplayUpdate();
        };
      })(this));
      return this.subscribe(this.cursor, 'destroyed', (function(_this) {
        return function() {
          return _this.needsRemoval = true;
        };
      })(this));
    };

    CursorView.prototype.beforeRemove = function() {
      this.editorView.removeCursorView(this);
      return this.stopBlinking();
    };

    CursorView.prototype.updateDisplay = function() {
      var pixelPosition, screenPosition;
      screenPosition = this.getScreenPosition();
      pixelPosition = this.getPixelPosition();
      if (!_.isEqual(this.lastPixelPosition, pixelPosition)) {
        this.lastPixelPosition = pixelPosition;
        this.css(pixelPosition);
        this.trigger('cursor:moved');
      }
      if (this.shouldPauseBlinking) {
        this.resetBlinking();
      } else if (!this.startBlinkingTimeout) {
        this.startBlinking();
      }
      return this.setVisible(this.cursor.isVisible() && !this.editorView.getEditor().isFoldedAtScreenRow(screenPosition.row));
    };

    CursorView.prototype.isHidden = function() {
      return this[0].style.display === 'none' || !this.isOnDom();
    };

    CursorView.prototype.needsAutoscroll = function() {
      return this.cursor.needsAutoscroll;
    };

    CursorView.prototype.clearAutoscroll = function() {
      return this.cursor.clearAutoscroll();
    };

    CursorView.prototype.getPixelPosition = function() {
      return this.editorView.pixelPositionForScreenPosition(this.getScreenPosition());
    };

    CursorView.prototype.setVisible = function(visible) {
      if (this.visible !== visible) {
        this.visible = visible;
        return this.toggle(this.visible);
      }
    };

    CursorView.prototype.stopBlinking = function() {
      if (this.blinking) {
        this.constructor.stopBlinking(this);
      }
      return this.blinking = false;
    };

    CursorView.prototype.startBlinking = function() {
      if (!this.blinking) {
        this.constructor.startBlinking(this);
      }
      return this.blinking = true;
    };

    CursorView.prototype.resetBlinking = function() {
      this.stopBlinking();
      return this.startBlinking();
    };

    CursorView.prototype.getBufferPosition = function() {
      return this.cursor.getBufferPosition();
    };

    CursorView.prototype.getScreenPosition = function() {
      return this.cursor.getScreenPosition();
    };

    CursorView.prototype.removeIdleClassTemporarily = function() {
      this.removeClass('idle');
      if (this.idleTimeout) {
        window.clearTimeout(this.idleTimeout);
      }
      return this.idleTimeout = window.setTimeout(((function(_this) {
        return function() {
          return _this.addClass('idle');
        };
      })(this)), 200);
    };

    CursorView.prototype.resetCursorAnimation = function() {
      if (this.idleTimeout) {
        window.clearTimeout(this.idleTimeout);
      }
      this.removeClass('idle');
      return _.defer((function(_this) {
        return function() {
          return _this.addClass('idle');
        };
      })(this));
    };

    return CursorView;

  })(View);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/cursor-view.js.map
