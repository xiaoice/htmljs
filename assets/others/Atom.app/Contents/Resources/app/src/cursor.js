(function() {
  var Cursor, Emitter, Point, Range, _, _ref;

  _ref = require('text-buffer'), Point = _ref.Point, Range = _ref.Range;

  Emitter = require('emissary').Emitter;

  _ = require('underscore-plus');

  module.exports = Cursor = (function() {
    Emitter.includeInto(Cursor);

    Cursor.prototype.screenPosition = null;

    Cursor.prototype.bufferPosition = null;

    Cursor.prototype.goalColumn = null;

    Cursor.prototype.visible = true;

    Cursor.prototype.needsAutoscroll = null;

    function Cursor(_arg) {
      this.editor = _arg.editor, this.marker = _arg.marker;
      this.updateVisibility();
      this.marker.on('changed', (function(_this) {
        return function(e) {
          var movedEvent, newHeadBufferPosition, newHeadScreenPosition, oldHeadBufferPosition, oldHeadScreenPosition, textChanged;
          _this.updateVisibility();
          oldHeadScreenPosition = e.oldHeadScreenPosition, newHeadScreenPosition = e.newHeadScreenPosition;
          oldHeadBufferPosition = e.oldHeadBufferPosition, newHeadBufferPosition = e.newHeadBufferPosition;
          textChanged = e.textChanged;
          if (oldHeadScreenPosition.isEqual(newHeadScreenPosition)) {
            return;
          }
          if (_this.needsAutoscroll == null) {
            _this.needsAutoscroll = _this.isLastCursor() && !textChanged;
          }
          _this.goalColumn = null;
          movedEvent = {
            oldBufferPosition: oldHeadBufferPosition,
            oldScreenPosition: oldHeadScreenPosition,
            newBufferPosition: newHeadBufferPosition,
            newScreenPosition: newHeadScreenPosition,
            textChanged: textChanged
          };
          _this.emit('moved', movedEvent);
          return _this.editor.emit('cursor-moved', movedEvent);
        };
      })(this));
      this.marker.on('destroyed', (function(_this) {
        return function() {
          _this.destroyed = true;
          _this.editor.removeCursor(_this);
          return _this.emit('destroyed');
        };
      })(this));
      this.needsAutoscroll = true;
    }

    Cursor.prototype.destroy = function() {
      return this.marker.destroy();
    };

    Cursor.prototype.changePosition = function(options, fn) {
      var _ref1;
      this.clearSelection();
      this.needsAutoscroll = (_ref1 = options.autoscroll) != null ? _ref1 : this.isLastCursor();
      if (!fn()) {
        if (this.needsAutoscroll) {
          return this.emit('autoscrolled');
        }
      }
    };

    Cursor.prototype.setScreenPosition = function(screenPosition, options) {
      if (options == null) {
        options = {};
      }
      return this.changePosition(options, (function(_this) {
        return function() {
          return _this.marker.setHeadScreenPosition(screenPosition, options);
        };
      })(this));
    };

    Cursor.prototype.getScreenPosition = function() {
      return this.marker.getHeadScreenPosition();
    };

    Cursor.prototype.setBufferPosition = function(bufferPosition, options) {
      if (options == null) {
        options = {};
      }
      return this.changePosition(options, (function(_this) {
        return function() {
          return _this.marker.setHeadBufferPosition(bufferPosition, options);
        };
      })(this));
    };

    Cursor.prototype.getBufferPosition = function() {
      return this.marker.getHeadBufferPosition();
    };

    Cursor.prototype.updateVisibility = function() {
      return this.setVisible(this.marker.getBufferRange().isEmpty());
    };

    Cursor.prototype.setVisible = function(visible) {
      if (this.visible !== visible) {
        this.visible = visible;
        if (this.visible && this.isLastCursor()) {
          if (this.needsAutoscroll == null) {
            this.needsAutoscroll = true;
          }
        }
        return this.emit('visibility-changed', this.visible);
      }
    };

    Cursor.prototype.isVisible = function() {
      return this.visible;
    };

    Cursor.prototype.wordRegExp = function(_arg) {
      var includeNonWordCharacters, nonWordCharacters, segments;
      includeNonWordCharacters = (_arg != null ? _arg : {}).includeNonWordCharacters;
      if (includeNonWordCharacters == null) {
        includeNonWordCharacters = true;
      }
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      segments = ["^[\t ]*$"];
      segments.push("[^\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+");
      if (includeNonWordCharacters) {
        segments.push("[" + (_.escapeRegExp(nonWordCharacters)) + "]+");
      }
      return new RegExp(segments.join("|"), "g");
    };

    Cursor.prototype.isLastCursor = function() {
      return this === this.editor.getCursor();
    };

    Cursor.prototype.isSurroundedByWhitespace = function() {
      var column, range, row, _ref1;
      _ref1 = this.getBufferPosition(), row = _ref1.row, column = _ref1.column;
      range = [[row, Math.min(0, column - 1)], [row, Math.max(0, column + 1)]];
      return /^\s+$/.test(this.editor.getTextInBufferRange(range));
    };

    Cursor.prototype.isBetweenWordAndNonWord = function() {
      var after, before, column, nonWordCharacters, range, row, _ref1, _ref2;
      if (this.isAtBeginningOfLine() || this.isAtEndOfLine()) {
        return false;
      }
      _ref1 = this.getBufferPosition(), row = _ref1.row, column = _ref1.column;
      range = [[row, column - 1], [row, column + 1]];
      _ref2 = this.editor.getTextInBufferRange(range), before = _ref2[0], after = _ref2[1];
      if (/\s/.test(before) || /\s/.test(after)) {
        return false;
      }
      nonWordCharacters = atom.config.get('editor.nonWordCharacters').split('');
      return _.contains(nonWordCharacters, before) !== _.contains(nonWordCharacters, after);
    };

    Cursor.prototype.isInsideWord = function() {
      var column, range, row, _ref1;
      _ref1 = this.getBufferPosition(), row = _ref1.row, column = _ref1.column;
      range = [[row, column], [row, Infinity]];
      return this.editor.getTextInBufferRange(range).search(this.wordRegExp()) === 0;
    };

    Cursor.prototype.clearAutoscroll = function() {
      return this.needsAutoscroll = null;
    };

    Cursor.prototype.clearSelection = function() {
      var _ref1;
      return (_ref1 = this.selection) != null ? _ref1.clear() : void 0;
    };

    Cursor.prototype.getScreenRow = function() {
      return this.getScreenPosition().row;
    };

    Cursor.prototype.getScreenColumn = function() {
      return this.getScreenPosition().column;
    };

    Cursor.prototype.getBufferRow = function() {
      return this.getBufferPosition().row;
    };

    Cursor.prototype.getBufferColumn = function() {
      return this.getBufferPosition().column;
    };

    Cursor.prototype.getCurrentBufferLine = function() {
      return this.editor.lineForBufferRow(this.getBufferRow());
    };

    Cursor.prototype.moveUp = function(rowCount, _arg) {
      var column, moveToEndOfSelection, range, row, _ref1, _ref2;
      if (rowCount == null) {
        rowCount = 1;
      }
      moveToEndOfSelection = (_arg != null ? _arg : {}).moveToEndOfSelection;
      range = this.marker.getScreenRange();
      if (moveToEndOfSelection && !range.isEmpty()) {
        _ref1 = range.start, row = _ref1.row, column = _ref1.column;
      } else {
        _ref2 = this.getScreenPosition(), row = _ref2.row, column = _ref2.column;
      }
      if (this.goalColumn != null) {
        column = this.goalColumn;
      }
      this.setScreenPosition({
        row: row - rowCount,
        column: column
      });
      return this.goalColumn = column;
    };

    Cursor.prototype.moveDown = function(rowCount, _arg) {
      var column, moveToEndOfSelection, range, row, _ref1, _ref2;
      if (rowCount == null) {
        rowCount = 1;
      }
      moveToEndOfSelection = (_arg != null ? _arg : {}).moveToEndOfSelection;
      range = this.marker.getScreenRange();
      if (moveToEndOfSelection && !range.isEmpty()) {
        _ref1 = range.end, row = _ref1.row, column = _ref1.column;
      } else {
        _ref2 = this.getScreenPosition(), row = _ref2.row, column = _ref2.column;
      }
      if (this.goalColumn != null) {
        column = this.goalColumn;
      }
      this.setScreenPosition({
        row: row + rowCount,
        column: column
      });
      return this.goalColumn = column;
    };

    Cursor.prototype.moveLeft = function(_arg) {
      var column, moveToEndOfSelection, range, row, _ref1, _ref2;
      moveToEndOfSelection = (_arg != null ? _arg : {}).moveToEndOfSelection;
      range = this.marker.getScreenRange();
      if (moveToEndOfSelection && !range.isEmpty()) {
        return this.setScreenPosition(range.start);
      } else {
        _ref1 = this.getScreenPosition(), row = _ref1.row, column = _ref1.column;
        _ref2 = column > 0 ? [row, column - 1] : [row - 1, Infinity], row = _ref2[0], column = _ref2[1];
        return this.setScreenPosition({
          row: row,
          column: column
        });
      }
    };

    Cursor.prototype.moveRight = function(_arg) {
      var column, moveToEndOfSelection, range, row, _ref1;
      moveToEndOfSelection = (_arg != null ? _arg : {}).moveToEndOfSelection;
      range = this.marker.getScreenRange();
      if (moveToEndOfSelection && !range.isEmpty()) {
        return this.setScreenPosition(range.end);
      } else {
        _ref1 = this.getScreenPosition(), row = _ref1.row, column = _ref1.column;
        return this.setScreenPosition([row, column + 1], {
          skipAtomicTokens: true,
          wrapBeyondNewlines: true,
          wrapAtSoftNewlines: true
        });
      }
    };

    Cursor.prototype.moveToTop = function() {
      return this.setBufferPosition([0, 0]);
    };

    Cursor.prototype.moveToBottom = function() {
      return this.setBufferPosition(this.editor.getEofBufferPosition());
    };

    Cursor.prototype.moveToBeginningOfScreenLine = function() {
      return this.setScreenPosition([this.getScreenRow(), 0]);
    };

    Cursor.prototype.moveToBeginningOfLine = function() {
      return this.setBufferPosition([this.getBufferRow(), 0]);
    };

    Cursor.prototype.moveToFirstCharacterOfLine = function() {
      var column, goalColumn, row, screenline, _ref1;
      _ref1 = this.getScreenPosition(), row = _ref1.row, column = _ref1.column;
      screenline = this.editor.lineForScreenRow(row);
      goalColumn = screenline.text.search(/\S/);
      if (goalColumn === column || goalColumn === -1) {
        goalColumn = 0;
      }
      return this.setScreenPosition([row, goalColumn]);
    };

    Cursor.prototype.skipLeadingWhitespace = function() {
      var endOfLeadingWhitespace, position, scanRange;
      position = this.getBufferPosition();
      scanRange = this.getCurrentLineBufferRange();
      endOfLeadingWhitespace = null;
      this.editor.scanInBufferRange(/^[ \t]*/, scanRange, (function(_this) {
        return function(_arg) {
          var range;
          range = _arg.range;
          return endOfLeadingWhitespace = range.end;
        };
      })(this));
      if (endOfLeadingWhitespace.isGreaterThan(position)) {
        return this.setBufferPosition(endOfLeadingWhitespace);
      }
    };

    Cursor.prototype.moveToEndOfScreenLine = function() {
      return this.setScreenPosition([this.getScreenRow(), Infinity]);
    };

    Cursor.prototype.moveToEndOfLine = function() {
      return this.setBufferPosition([this.getBufferRow(), Infinity]);
    };

    Cursor.prototype.moveToBeginningOfWord = function() {
      return this.setBufferPosition(this.getBeginningOfCurrentWordBufferPosition());
    };

    Cursor.prototype.moveToEndOfWord = function() {
      var position;
      if (position = this.getEndOfCurrentWordBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToBeginningOfNextWord = function() {
      var position;
      if (position = this.getBeginningOfNextWordBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToPreviousWordBoundary = function() {
      var position;
      if (position = this.getPreviousWordBoundaryBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToNextWordBoundary = function() {
      var position;
      if (position = this.getMoveNextWordBoundaryBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.getBeginningOfCurrentWordBufferPosition = function(options) {
      var allowPrevious, beginningOfWordPosition, currentBufferPosition, previousNonBlankRow, scanRange, _ref1, _ref2;
      if (options == null) {
        options = {};
      }
      allowPrevious = (_ref1 = options.allowPrevious) != null ? _ref1 : true;
      currentBufferPosition = this.getBufferPosition();
      previousNonBlankRow = this.editor.buffer.previousNonBlankRow(currentBufferPosition.row);
      scanRange = [[previousNonBlankRow, 0], currentBufferPosition];
      beginningOfWordPosition = null;
      this.editor.backwardsScanInBufferRange((_ref2 = options.wordRegex) != null ? _ref2 : this.wordRegExp(options), scanRange, (function(_this) {
        return function(_arg) {
          var range, stop;
          range = _arg.range, stop = _arg.stop;
          if (range.end.isGreaterThanOrEqual(currentBufferPosition) || allowPrevious) {
            beginningOfWordPosition = range.start;
          }
          if (!(beginningOfWordPosition != null ? beginningOfWordPosition.isEqual(currentBufferPosition) : void 0)) {
            return stop();
          }
        };
      })(this));
      return beginningOfWordPosition || currentBufferPosition;
    };

    Cursor.prototype.getPreviousWordBoundaryBufferPosition = function(options) {
      var beginningOfWordPosition, currentBufferPosition, previousNonBlankRow, scanRange, _ref1;
      if (options == null) {
        options = {};
      }
      currentBufferPosition = this.getBufferPosition();
      previousNonBlankRow = this.editor.buffer.previousNonBlankRow(currentBufferPosition.row);
      scanRange = [[previousNonBlankRow, 0], currentBufferPosition];
      beginningOfWordPosition = null;
      this.editor.backwardsScanInBufferRange((_ref1 = options.wordRegex) != null ? _ref1 : this.wordRegExp(), scanRange, (function(_this) {
        return function(_arg) {
          var range, stop;
          range = _arg.range, stop = _arg.stop;
          if (range.start.row < currentBufferPosition.row && currentBufferPosition.column > 0) {
            beginningOfWordPosition = new Point(currentBufferPosition.row, 0);
          } else if (range.end.isLessThan(currentBufferPosition)) {
            beginningOfWordPosition = range.end;
          } else {
            beginningOfWordPosition = range.start;
          }
          if (!(beginningOfWordPosition != null ? beginningOfWordPosition.isEqual(currentBufferPosition) : void 0)) {
            return stop();
          }
        };
      })(this));
      return beginningOfWordPosition || currentBufferPosition;
    };

    Cursor.prototype.getMoveNextWordBoundaryBufferPosition = function(options) {
      var currentBufferPosition, endOfWordPosition, scanRange, _ref1;
      if (options == null) {
        options = {};
      }
      currentBufferPosition = this.getBufferPosition();
      scanRange = [currentBufferPosition, this.editor.getEofBufferPosition()];
      endOfWordPosition = null;
      this.editor.scanInBufferRange((_ref1 = options.wordRegex) != null ? _ref1 : this.wordRegExp(), scanRange, (function(_this) {
        return function(_arg) {
          var range, stop;
          range = _arg.range, stop = _arg.stop;
          if (range.start.row > currentBufferPosition.row) {
            endOfWordPosition = new Point(range.start.row, 0);
          } else if (range.start.isGreaterThan(currentBufferPosition)) {
            endOfWordPosition = range.start;
          } else {
            endOfWordPosition = range.end;
          }
          if (!(endOfWordPosition != null ? endOfWordPosition.isEqual(currentBufferPosition) : void 0)) {
            return stop();
          }
        };
      })(this));
      return endOfWordPosition || currentBufferPosition;
    };

    Cursor.prototype.getEndOfCurrentWordBufferPosition = function(options) {
      var allowNext, currentBufferPosition, endOfWordPosition, scanRange, _ref1, _ref2;
      if (options == null) {
        options = {};
      }
      allowNext = (_ref1 = options.allowNext) != null ? _ref1 : true;
      currentBufferPosition = this.getBufferPosition();
      scanRange = [currentBufferPosition, this.editor.getEofBufferPosition()];
      endOfWordPosition = null;
      this.editor.scanInBufferRange((_ref2 = options.wordRegex) != null ? _ref2 : this.wordRegExp(options), scanRange, (function(_this) {
        return function(_arg) {
          var range, stop;
          range = _arg.range, stop = _arg.stop;
          if (range.start.isLessThanOrEqual(currentBufferPosition) || allowNext) {
            endOfWordPosition = range.end;
          }
          if (!(endOfWordPosition != null ? endOfWordPosition.isEqual(currentBufferPosition) : void 0)) {
            return stop();
          }
        };
      })(this));
      return endOfWordPosition != null ? endOfWordPosition : currentBufferPosition;
    };

    Cursor.prototype.getBeginningOfNextWordBufferPosition = function(options) {
      var beginningOfNextWordPosition, currentBufferPosition, scanRange, start, _ref1;
      if (options == null) {
        options = {};
      }
      currentBufferPosition = this.getBufferPosition();
      start = this.isInsideWord() ? this.getEndOfCurrentWordBufferPosition() : currentBufferPosition;
      scanRange = [start, this.editor.getEofBufferPosition()];
      beginningOfNextWordPosition = null;
      this.editor.scanInBufferRange((_ref1 = options.wordRegex) != null ? _ref1 : this.wordRegExp(), scanRange, (function(_this) {
        return function(_arg) {
          var range, stop;
          range = _arg.range, stop = _arg.stop;
          beginningOfNextWordPosition = range.start;
          return stop();
        };
      })(this));
      return beginningOfNextWordPosition || currentBufferPosition;
    };

    Cursor.prototype.getCurrentWordBufferRange = function(options) {
      var endOptions, startOptions;
      if (options == null) {
        options = {};
      }
      startOptions = _.extend(_.clone(options), {
        allowPrevious: false
      });
      endOptions = _.extend(_.clone(options), {
        allowNext: false
      });
      return new Range(this.getBeginningOfCurrentWordBufferPosition(startOptions), this.getEndOfCurrentWordBufferPosition(endOptions));
    };

    Cursor.prototype.getCurrentLineBufferRange = function(options) {
      return this.editor.bufferRangeForBufferRow(this.getBufferRow(), options);
    };

    Cursor.prototype.getCurrentParagraphBufferRange = function() {
      return this.editor.languageMode.rowRangeForParagraphAtBufferRow(this.getBufferRow());
    };

    Cursor.prototype.getCurrentWordPrefix = function() {
      return this.editor.getTextInBufferRange([this.getBeginningOfCurrentWordBufferPosition(), this.getBufferPosition()]);
    };

    Cursor.prototype.isAtBeginningOfLine = function() {
      return this.getBufferPosition().column === 0;
    };

    Cursor.prototype.getIndentLevel = function() {
      if (this.editor.getSoftTabs()) {
        return this.getBufferColumn() / this.editor.getTabLength();
      } else {
        return this.getBufferColumn();
      }
    };

    Cursor.prototype.isAtEndOfLine = function() {
      return this.getBufferPosition().isEqual(this.getCurrentLineBufferRange().end);
    };

    Cursor.prototype.getScopes = function() {
      return this.editor.scopesForBufferPosition(this.getBufferPosition());
    };

    Cursor.prototype.hasPrecedingCharactersOnLine = function() {
      var bufferPosition, firstCharacterColumn, line;
      bufferPosition = this.getBufferPosition();
      line = this.editor.lineForBufferRow(bufferPosition.row);
      firstCharacterColumn = line.search(/\S/);
      if (firstCharacterColumn === -1) {
        return false;
      } else {
        return bufferPosition.column > firstCharacterColumn;
      }
    };

    return Cursor;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/cursor.js.map
