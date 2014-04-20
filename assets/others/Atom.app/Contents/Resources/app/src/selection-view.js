(function() {
  var $$, Point, Range, SelectionView, View, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('text-buffer'), Point = _ref.Point, Range = _ref.Range;

  _ref1 = require('./space-pen-extensions'), View = _ref1.View, $$ = _ref1.$$;

  module.exports = SelectionView = (function(_super) {
    __extends(SelectionView, _super);

    function SelectionView() {
      return SelectionView.__super__.constructor.apply(this, arguments);
    }

    SelectionView.content = function() {
      return this.div({
        "class": 'selection'
      });
    };

    SelectionView.prototype.regions = null;

    SelectionView.prototype.needsRemoval = false;

    SelectionView.prototype.initialize = function(_arg) {
      var _ref2;
      _ref2 = _arg != null ? _arg : {}, this.editorView = _ref2.editorView, this.selection = _ref2.selection;
      this.regions = [];
      this.selection.on('screen-range-changed', (function(_this) {
        return function() {
          return _this.editorView.requestDisplayUpdate();
        };
      })(this));
      return this.selection.on('destroyed', (function(_this) {
        return function() {
          _this.needsRemoval = true;
          return _this.editorView.requestDisplayUpdate();
        };
      })(this));
    };

    SelectionView.prototype.updateDisplay = function() {
      var range, rowSpan;
      this.clearRegions();
      range = this.getScreenRange();
      this.trigger('selection:changed');
      this.editorView.highlightFoldsContainingBufferRange(this.getBufferRange());
      if (range.isEmpty()) {
        return;
      }
      rowSpan = range.end.row - range.start.row;
      if (rowSpan === 0) {
        return this.appendRegion(1, range.start, range.end);
      } else {
        this.appendRegion(1, range.start, null);
        if (rowSpan > 1) {
          this.appendRegion(rowSpan - 1, {
            row: range.start.row + 1,
            column: 0
          }, null);
        }
        return this.appendRegion(1, {
          row: range.end.row,
          column: 0
        }, range.end);
      }
    };

    SelectionView.prototype.appendRegion = function(rows, start, end) {
      var charWidth, css, lineHeight, region, _ref2;
      _ref2 = this.editorView, lineHeight = _ref2.lineHeight, charWidth = _ref2.charWidth;
      css = this.editorView.pixelPositionForScreenPosition(start);
      css.height = lineHeight * rows;
      if (end) {
        css.width = this.editorView.pixelPositionForScreenPosition(end).left - css.left;
      } else {
        css.right = 0;
      }
      region = ($$(function() {
        return this.div({
          "class": 'region'
        });
      })).css(css);
      this.append(region);
      return this.regions.push(region);
    };

    SelectionView.prototype.getCenterPixelPosition = function() {
      var end, endRow, start, startRow, _ref2;
      _ref2 = this.getScreenRange(), start = _ref2.start, end = _ref2.end;
      startRow = start.row;
      endRow = end.row;
      if (end.column === 0) {
        endRow--;
      }
      return this.editorView.pixelPositionForScreenPosition([(startRow + endRow + 1) / 2, start.column]);
    };

    SelectionView.prototype.clearRegions = function() {
      var region, _i, _len, _ref2;
      _ref2 = this.regions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        region = _ref2[_i];
        region.remove();
      }
      return this.regions = [];
    };

    SelectionView.prototype.getScreenRange = function() {
      return this.selection.getScreenRange();
    };

    SelectionView.prototype.getBufferRange = function() {
      return this.selection.getBufferRange();
    };

    SelectionView.prototype.needsAutoscroll = function() {
      return this.selection.needsAutoscroll;
    };

    SelectionView.prototype.clearAutoscroll = function() {
      return this.selection.clearAutoscroll();
    };

    SelectionView.prototype.highlight = function() {
      this.unhighlight();
      this.addClass('highlighted');
      clearTimeout(this.unhighlightTimeout);
      return this.unhighlightTimeout = setTimeout(((function(_this) {
        return function() {
          return _this.unhighlight();
        };
      })(this)), 1000);
    };

    SelectionView.prototype.unhighlight = function() {
      return this.removeClass('highlighted');
    };

    SelectionView.prototype.remove = function() {
      this.editorView.removeSelectionView(this);
      return SelectionView.__super__.remove.apply(this, arguments);
    };

    return SelectionView;

  })(View);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/selection-view.js.map
