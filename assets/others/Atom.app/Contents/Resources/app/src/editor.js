(function() {
  var Cursor, Delegator, DisplayBuffer, Editor, LanguageMode, Model, Point, Range, Selection, Serializable, TextMateScopeSelector, path, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  path = require('path');

  Serializable = require('serializable');

  Delegator = require('delegato');

  Model = require('theorist').Model;

  _ref = require('text-buffer'), Point = _ref.Point, Range = _ref.Range;

  LanguageMode = require('./language-mode');

  DisplayBuffer = require('./display-buffer');

  Cursor = require('./cursor');

  Selection = require('./selection');

  TextMateScopeSelector = require('first-mate').ScopeSelector;

  module.exports = Editor = (function(_super) {
    __extends(Editor, _super);

    Serializable.includeInto(Editor);

    atom.deserializers.add(Editor);

    Delegator.includeInto(Editor);

    Editor.properties({
      scrollTop: 0,
      scrollLeft: 0
    });

    Editor.prototype.deserializing = false;

    Editor.prototype.callDisplayBufferCreatedHook = false;

    Editor.prototype.registerEditor = false;

    Editor.prototype.buffer = null;

    Editor.prototype.languageMode = null;

    Editor.prototype.cursors = null;

    Editor.prototype.selections = null;

    Editor.prototype.suppressSelectionMerging = false;

    Editor.delegatesMethods('foldAll', 'unfoldAll', 'foldAllAtIndentLevel', 'foldBufferRow', 'unfoldBufferRow', 'suggestedIndentForBufferRow', 'autoIndentBufferRow', 'autoIndentBufferRows', 'autoDecreaseIndentForBufferRow', 'toggleLineCommentForBufferRow', 'toggleLineCommentsForBufferRows', 'isFoldableAtBufferRow', {
      toProperty: 'languageMode'
    });

    function Editor(_arg) {
      var buffer, initialLine, marker, position, registerEditor, softWrap, suppressCursorCreation, tabLength, _i, _len, _ref1, _ref2, _ref3, _ref4;
      this.softTabs = _arg.softTabs, initialLine = _arg.initialLine, tabLength = _arg.tabLength, softWrap = _arg.softWrap, this.displayBuffer = _arg.displayBuffer, buffer = _arg.buffer, registerEditor = _arg.registerEditor, suppressCursorCreation = _arg.suppressCursorCreation;
      this.handleMarkerCreated = __bind(this.handleMarkerCreated, this);
      Editor.__super__.constructor.apply(this, arguments);
      this.cursors = [];
      this.selections = [];
      if (this.displayBuffer == null) {
        this.displayBuffer = new DisplayBuffer({
          buffer: buffer,
          tabLength: tabLength,
          softWrap: softWrap
        });
      }
      this.buffer = this.displayBuffer.buffer;
      this.softTabs = (_ref1 = (_ref2 = (_ref3 = this.buffer.usesSoftTabs()) != null ? _ref3 : this.softTabs) != null ? _ref2 : atom.config.get('editor.softTabs')) != null ? _ref1 : true;
      _ref4 = this.findMarkers(this.getSelectionMarkerAttributes());
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        marker = _ref4[_i];
        marker.setAttributes({
          preserveFolds: true
        });
        this.addSelection(marker);
      }
      this.subscribeToBuffer();
      this.subscribeToDisplayBuffer();
      if (this.getCursors().length === 0 && !suppressCursorCreation) {
        if (initialLine) {
          position = [initialLine, 0];
        } else {
          position = [0, 0];
        }
        this.addCursorAtBufferPosition(position);
      }
      this.languageMode = new LanguageMode(this);
      this.subscribe(this.$scrollTop, (function(_this) {
        return function(scrollTop) {
          return _this.emit('scroll-top-changed', scrollTop);
        };
      })(this));
      this.subscribe(this.$scrollLeft, (function(_this) {
        return function(scrollLeft) {
          return _this.emit('scroll-left-changed', scrollLeft);
        };
      })(this));
      if (registerEditor) {
        atom.project.addEditor(this);
      }
    }

    Editor.prototype.serializeParams = function() {
      return {
        id: this.id,
        softTabs: this.softTabs,
        scrollTop: this.scrollTop,
        scrollLeft: this.scrollLeft,
        displayBuffer: this.displayBuffer.serialize()
      };
    };

    Editor.prototype.deserializeParams = function(params) {
      params.displayBuffer = DisplayBuffer.deserialize(params.displayBuffer);
      params.registerEditor = true;
      return params;
    };

    Editor.prototype.subscribeToBuffer = function() {
      this.buffer.retain();
      this.subscribe(this.buffer, "path-changed", (function(_this) {
        return function() {
          if (atom.project.getPath() == null) {
            atom.project.setPath(path.dirname(_this.getPath()));
          }
          _this.emit("title-changed");
          return _this.emit("path-changed");
        };
      })(this));
      this.subscribe(this.buffer, "contents-modified", (function(_this) {
        return function() {
          return _this.emit("contents-modified");
        };
      })(this));
      this.subscribe(this.buffer, "contents-conflicted", (function(_this) {
        return function() {
          return _this.emit("contents-conflicted");
        };
      })(this));
      this.subscribe(this.buffer, "modified-status-changed", (function(_this) {
        return function() {
          return _this.emit("modified-status-changed");
        };
      })(this));
      this.subscribe(this.buffer, "destroyed", (function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this));
      return this.preserveCursorPositionOnBufferReload();
    };

    Editor.prototype.subscribeToDisplayBuffer = function() {
      this.subscribe(this.displayBuffer, 'marker-created', this.handleMarkerCreated);
      this.subscribe(this.displayBuffer, "changed", (function(_this) {
        return function(e) {
          return _this.emit('screen-lines-changed', e);
        };
      })(this));
      this.subscribe(this.displayBuffer, "markers-updated", (function(_this) {
        return function() {
          return _this.mergeIntersectingSelections();
        };
      })(this));
      this.subscribe(this.displayBuffer, 'grammar-changed', (function(_this) {
        return function() {
          return _this.handleGrammarChange();
        };
      })(this));
      return this.subscribe(this.displayBuffer, 'soft-wrap-changed', (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return _this.emit.apply(_this, ['soft-wrap-changed'].concat(__slice.call(args)));
        };
      })(this));
    };

    Editor.prototype.getViewClass = function() {
      return require('./editor-view');
    };

    Editor.prototype.destroyed = function() {
      var selection, _i, _len, _ref1, _ref2;
      this.unsubscribe();
      _ref1 = this.getSelections();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        selection = _ref1[_i];
        selection.destroy();
      }
      this.buffer.release();
      this.displayBuffer.destroy();
      this.languageMode.destroy();
      return (_ref2 = atom.project) != null ? _ref2.removeEditor(this) : void 0;
    };

    Editor.prototype.copy = function() {
      var displayBuffer, marker, newEditor, softTabs, tabLength, _i, _len, _ref1;
      tabLength = this.getTabLength();
      displayBuffer = this.displayBuffer.copy();
      softTabs = this.getSoftTabs();
      newEditor = new Editor({
        buffer: this.buffer,
        displayBuffer: displayBuffer,
        tabLength: tabLength,
        softTabs: softTabs,
        suppressCursorCreation: true
      });
      newEditor.setScrollTop(this.getScrollTop());
      newEditor.setScrollLeft(this.getScrollLeft());
      _ref1 = this.findMarkers({
        editorId: this.id
      });
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        marker.copy({
          editorId: newEditor.id,
          preserveFolds: true
        });
      }
      atom.project.addEditor(newEditor);
      return newEditor;
    };

    Editor.prototype.getTitle = function() {
      var sessionPath;
      if (sessionPath = this.getPath()) {
        return path.basename(sessionPath);
      } else {
        return 'untitled';
      }
    };

    Editor.prototype.getLongTitle = function() {
      var directory, fileName, sessionPath;
      if (sessionPath = this.getPath()) {
        fileName = path.basename(sessionPath);
        directory = path.basename(path.dirname(sessionPath));
        return "" + fileName + " - " + directory;
      } else {
        return 'untitled';
      }
    };

    Editor.prototype.isEqual = function(other) {
      if (!(other instanceof Editor)) {
        return false;
      }
      return this.isAlive() === other.isAlive() && this.buffer.getPath() === other.buffer.getPath() && this.getScrollTop() === other.getScrollTop() && this.getScrollLeft() === other.getScrollLeft() && this.getCursorScreenPosition().isEqual(other.getCursorScreenPosition());
    };

    Editor.prototype.setVisible = function(visible) {
      return this.displayBuffer.setVisible(visible);
    };

    Editor.prototype.setScrollTop = function(scrollTop) {
      this.scrollTop = scrollTop;
      return this.scrollTop;
    };

    Editor.prototype.getScrollTop = function() {
      return this.scrollTop;
    };

    Editor.prototype.setScrollLeft = function(scrollLeft) {
      this.scrollLeft = scrollLeft;
      return this.scrollLeft;
    };

    Editor.prototype.getScrollLeft = function() {
      return this.scrollLeft;
    };

    Editor.prototype.setEditorWidthInChars = function(editorWidthInChars) {
      return this.displayBuffer.setEditorWidthInChars(editorWidthInChars);
    };

    Editor.prototype.getSoftWrapColumn = function() {
      return this.displayBuffer.getSoftWrapColumn();
    };

    Editor.prototype.getSoftTabs = function() {
      return this.softTabs;
    };

    Editor.prototype.setSoftTabs = function(softTabs) {
      this.softTabs = softTabs;
      return this.softTabs;
    };

    Editor.prototype.getSoftWrap = function() {
      return this.displayBuffer.getSoftWrap();
    };

    Editor.prototype.setSoftWrap = function(softWrap) {
      return this.displayBuffer.setSoftWrap(softWrap);
    };

    Editor.prototype.getTabText = function() {
      return this.buildIndentString(1);
    };

    Editor.prototype.getTabLength = function() {
      return this.displayBuffer.getTabLength();
    };

    Editor.prototype.setTabLength = function(tabLength) {
      return this.displayBuffer.setTabLength(tabLength);
    };

    Editor.prototype.clipBufferPosition = function(bufferPosition) {
      return this.buffer.clipPosition(bufferPosition);
    };

    Editor.prototype.clipBufferRange = function(range) {
      return this.buffer.clipRange(range);
    };

    Editor.prototype.indentationForBufferRow = function(bufferRow) {
      return this.indentLevelForLine(this.lineForBufferRow(bufferRow));
    };

    Editor.prototype.setIndentationForBufferRow = function(bufferRow, newLevel) {
      var currentIndentLength, newIndentString;
      currentIndentLength = this.lineForBufferRow(bufferRow).match(/^\s*/)[0].length;
      newIndentString = this.buildIndentString(newLevel);
      return this.buffer.change([[bufferRow, 0], [bufferRow, currentIndentLength]], newIndentString);
    };

    Editor.prototype.indentLevelForLine = function(line) {
      var leadingWhitespace, match, spaceCount, tabCount, _ref1, _ref2, _ref3, _ref4;
      if (match = line.match(/^[\t ]+/)) {
        leadingWhitespace = match[0];
        tabCount = (_ref1 = (_ref2 = leadingWhitespace.match(/\t/g)) != null ? _ref2.length : void 0) != null ? _ref1 : 0;
        spaceCount = (_ref3 = (_ref4 = leadingWhitespace.match(/[ ]/g)) != null ? _ref4.length : void 0) != null ? _ref3 : 0;
        return tabCount + (spaceCount / this.getTabLength());
      } else {
        return 0;
      }
    };

    Editor.prototype.buildIndentString = function(number) {
      if (this.getSoftTabs()) {
        return _.multiplyString(" ", number * this.getTabLength());
      } else {
        return _.multiplyString("\t", Math.floor(number));
      }
    };

    Editor.prototype.save = function() {
      return this.buffer.save();
    };

    Editor.prototype.saveAs = function(path) {
      return this.buffer.saveAs(path);
    };

    Editor.prototype.getPath = function() {
      return this.buffer.getPath();
    };

    Editor.prototype.getText = function() {
      return this.buffer.getText();
    };

    Editor.prototype.setText = function(text) {
      return this.buffer.setText(text);
    };

    Editor.prototype.getTextInRange = function(range) {
      return this.buffer.getTextInRange(range);
    };

    Editor.prototype.getLineCount = function() {
      return this.buffer.getLineCount();
    };

    Editor.prototype.getBuffer = function() {
      return this.buffer;
    };

    Editor.prototype.getUri = function() {
      return this.buffer.getUri();
    };

    Editor.prototype.isBufferRowBlank = function(bufferRow) {
      return this.buffer.isRowBlank(bufferRow);
    };

    Editor.prototype.isBufferRowCommented = function(bufferRow) {
      var match, scopes;
      if (match = this.lineForBufferRow(bufferRow).match(/\S/)) {
        scopes = this.tokenForBufferPosition([bufferRow, match.index]).scopes;
        return new TextMateScopeSelector('comment.*').matches(scopes);
      }
    };

    Editor.prototype.nextNonBlankBufferRow = function(bufferRow) {
      return this.buffer.nextNonBlankRow(bufferRow);
    };

    Editor.prototype.getEofBufferPosition = function() {
      return this.buffer.getEofPosition();
    };

    Editor.prototype.getLastBufferRow = function() {
      return this.buffer.getLastRow();
    };

    Editor.prototype.bufferRangeForBufferRow = function(row, options) {
      return this.buffer.rangeForRow(row, options);
    };

    Editor.prototype.lineForBufferRow = function(row) {
      return this.buffer.lineForRow(row);
    };

    Editor.prototype.lineLengthForBufferRow = function(row) {
      return this.buffer.lineLengthForRow(row);
    };

    Editor.prototype.scan = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.buffer).scan.apply(_ref1, args);
    };

    Editor.prototype.scanInBufferRange = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.buffer).scanInRange.apply(_ref1, args);
    };

    Editor.prototype.backwardsScanInBufferRange = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.buffer).backwardsScanInRange.apply(_ref1, args);
    };

    Editor.prototype.isModified = function() {
      return this.buffer.isModified();
    };

    Editor.prototype.shouldPromptToSave = function() {
      return this.isModified() && !this.buffer.hasMultipleEditors();
    };

    Editor.prototype.screenPositionForBufferPosition = function(bufferPosition, options) {
      return this.displayBuffer.screenPositionForBufferPosition(bufferPosition, options);
    };

    Editor.prototype.bufferPositionForScreenPosition = function(screenPosition, options) {
      return this.displayBuffer.bufferPositionForScreenPosition(screenPosition, options);
    };

    Editor.prototype.screenRangeForBufferRange = function(bufferRange) {
      return this.displayBuffer.screenRangeForBufferRange(bufferRange);
    };

    Editor.prototype.bufferRangeForScreenRange = function(screenRange) {
      return this.displayBuffer.bufferRangeForScreenRange(screenRange);
    };

    Editor.prototype.clipScreenPosition = function(screenPosition, options) {
      return this.displayBuffer.clipScreenPosition(screenPosition, options);
    };

    Editor.prototype.lineForScreenRow = function(row) {
      return this.displayBuffer.lineForRow(row);
    };

    Editor.prototype.linesForScreenRows = function(start, end) {
      return this.displayBuffer.linesForRows(start, end);
    };

    Editor.prototype.getScreenLineCount = function() {
      return this.displayBuffer.getLineCount();
    };

    Editor.prototype.getMaxScreenLineLength = function() {
      return this.displayBuffer.getMaxLineLength();
    };

    Editor.prototype.getLastScreenRow = function() {
      return this.displayBuffer.getLastRow();
    };

    Editor.prototype.bufferRowsForScreenRows = function(startRow, endRow) {
      return this.displayBuffer.bufferRowsForScreenRows(startRow, endRow);
    };

    Editor.prototype.bufferRowForScreenRow = function(row) {
      return this.displayBuffer.bufferRowForScreenRow(row);
    };

    Editor.prototype.scopesForBufferPosition = function(bufferPosition) {
      return this.displayBuffer.scopesForBufferPosition(bufferPosition);
    };

    Editor.prototype.bufferRangeForScopeAtCursor = function(selector) {
      return this.displayBuffer.bufferRangeForScopeAtPosition(selector, this.getCursorBufferPosition());
    };

    Editor.prototype.tokenForBufferPosition = function(bufferPosition) {
      return this.displayBuffer.tokenForBufferPosition(bufferPosition);
    };

    Editor.prototype.getCursorScopes = function() {
      return this.getCursor().getScopes();
    };

    Editor.prototype.insertText = function(text, options) {
      if (options == null) {
        options = {};
      }
      if (options.autoIndentNewline == null) {
        options.autoIndentNewline = this.shouldAutoIndent();
      }
      if (options.autoDecreaseIndent == null) {
        options.autoDecreaseIndent = this.shouldAutoIndent();
      }
      return this.mutateSelectedText(function(selection) {
        return selection.insertText(text, options);
      });
    };

    Editor.prototype.insertNewline = function() {
      return this.insertText('\n');
    };

    Editor.prototype.insertNewlineBelow = function() {
      return this.transact((function(_this) {
        return function() {
          _this.moveCursorToEndOfLine();
          return _this.insertNewline();
        };
      })(this));
    };

    Editor.prototype.insertNewlineAbove = function() {
      return this.transact((function(_this) {
        return function() {
          var onFirstLine;
          onFirstLine = _this.getCursorBufferPosition().row === 0;
          _this.moveCursorToBeginningOfLine();
          _this.moveCursorLeft();
          _this.insertNewline();
          if (onFirstLine) {
            return _this.moveCursorUp();
          }
        };
      })(this));
    };

    Editor.prototype.indent = function(options) {
      if (options == null) {
        options = {};
      }
      if (options.autoIndent == null) {
        options.autoIndent = this.shouldAutoIndent();
      }
      return this.mutateSelectedText(function(selection) {
        return selection.indent(options);
      });
    };

    Editor.prototype.backspace = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.backspace();
      });
    };

    Editor.prototype.backspaceToBeginningOfWord = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.backspaceToBeginningOfWord();
      });
    };

    Editor.prototype.backspaceToBeginningOfLine = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.backspaceToBeginningOfLine();
      });
    };

    Editor.prototype["delete"] = function() {
      return this.mutateSelectedText(function(selection) {
        return selection["delete"]();
      });
    };

    Editor.prototype.deleteToEndOfWord = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToEndOfWord();
      });
    };

    Editor.prototype.deleteLine = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteLine();
      });
    };

    Editor.prototype.indentSelectedRows = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.indentSelectedRows();
      });
    };

    Editor.prototype.outdentSelectedRows = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.outdentSelectedRows();
      });
    };

    Editor.prototype.toggleLineCommentsInSelection = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.toggleLineComments();
      });
    };

    Editor.prototype.autoIndentSelectedRows = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.autoIndentSelectedRows();
      });
    };

    Editor.prototype.normalizeTabsInBufferRange = function(bufferRange) {
      if (!this.getSoftTabs()) {
        return;
      }
      return this.scanInBufferRange(/\t/, bufferRange, (function(_this) {
        return function(_arg) {
          var replace;
          replace = _arg.replace;
          return replace(_this.getTabText());
        };
      })(this));
    };

    Editor.prototype.cutToEndOfLine = function() {
      var maintainClipboard;
      maintainClipboard = false;
      return this.mutateSelectedText(function(selection) {
        selection.cutToEndOfLine(maintainClipboard);
        return maintainClipboard = true;
      });
    };

    Editor.prototype.cutSelectedText = function() {
      var maintainClipboard;
      maintainClipboard = false;
      return this.mutateSelectedText(function(selection) {
        selection.cut(maintainClipboard);
        return maintainClipboard = true;
      });
    };

    Editor.prototype.copySelectedText = function() {
      var maintainClipboard, selection, _i, _len, _ref1, _results;
      maintainClipboard = false;
      _ref1 = this.getSelections();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        selection = _ref1[_i];
        selection.copy(maintainClipboard);
        _results.push(maintainClipboard = true);
      }
      return _results;
    };

    Editor.prototype.pasteText = function(options) {
      var containsNewlines, metadata, text, _ref1;
      if (options == null) {
        options = {};
      }
      _ref1 = atom.clipboard.readWithMetadata(), text = _ref1.text, metadata = _ref1.metadata;
      containsNewlines = text.indexOf('\n') !== -1;
      if (atom.config.get('editor.normalizeIndentOnPaste') && metadata) {
        if (!this.getCursor().hasPrecedingCharactersOnLine() || containsNewlines) {
          if (options.indentBasis == null) {
            options.indentBasis = metadata.indentBasis;
          }
        }
      }
      return this.insertText(text, options);
    };

    Editor.prototype.undo = function() {
      this.getCursor().needsAutoscroll = true;
      return this.buffer.undo(this);
    };

    Editor.prototype.redo = function() {
      this.getCursor().needsAutoscroll = true;
      return this.buffer.redo(this);
    };

    Editor.prototype.foldCurrentRow = function() {
      var bufferRow;
      bufferRow = this.bufferPositionForScreenPosition(this.getCursorScreenPosition()).row;
      return this.foldBufferRow(bufferRow);
    };

    Editor.prototype.unfoldCurrentRow = function() {
      var bufferRow;
      bufferRow = this.bufferPositionForScreenPosition(this.getCursorScreenPosition()).row;
      return this.unfoldBufferRow(bufferRow);
    };

    Editor.prototype.foldSelection = function() {
      var selection, _i, _len, _ref1, _results;
      _ref1 = this.getSelections();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        selection = _ref1[_i];
        _results.push(selection.fold());
      }
      return _results;
    };

    Editor.prototype.createFold = function(startRow, endRow) {
      return this.displayBuffer.createFold(startRow, endRow);
    };

    Editor.prototype.destroyFoldWithId = function(id) {
      return this.displayBuffer.destroyFoldWithId(id);
    };

    Editor.prototype.destroyFoldsContainingBufferRow = function(bufferRow) {
      return this.displayBuffer.destroyFoldsContainingBufferRow(bufferRow);
    };

    Editor.prototype.destroyFoldsIntersectingBufferRange = function(bufferRange) {
      var row, _i, _ref1, _ref2, _results;
      _results = [];
      for (row = _i = _ref1 = bufferRange.start.row, _ref2 = bufferRange.end.row; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; row = _ref1 <= _ref2 ? ++_i : --_i) {
        _results.push(this.destroyFoldsContainingBufferRow(row));
      }
      return _results;
    };

    Editor.prototype.toggleFoldAtBufferRow = function(bufferRow) {
      if (this.isFoldedAtBufferRow(bufferRow)) {
        return this.unfoldBufferRow(bufferRow);
      } else {
        return this.foldBufferRow(bufferRow);
      }
    };

    Editor.prototype.isFoldedAtCursorRow = function() {
      return this.isFoldedAtScreenRow(this.getCursorScreenRow());
    };

    Editor.prototype.isFoldedAtBufferRow = function(bufferRow) {
      return this.displayBuffer.isFoldedAtBufferRow(bufferRow);
    };

    Editor.prototype.isFoldedAtScreenRow = function(screenRow) {
      return this.displayBuffer.isFoldedAtScreenRow(screenRow);
    };

    Editor.prototype.largestFoldContainingBufferRow = function(bufferRow) {
      return this.displayBuffer.largestFoldContainingBufferRow(bufferRow);
    };

    Editor.prototype.largestFoldStartingAtScreenRow = function(screenRow) {
      return this.displayBuffer.largestFoldStartingAtScreenRow(screenRow);
    };

    Editor.prototype.moveLineUp = function() {
      var lastRow, selection;
      selection = this.getSelectedBufferRange();
      if (selection.start.row === 0) {
        return;
      }
      lastRow = this.buffer.getLastRow();
      if (selection.isEmpty() && selection.start.row === lastRow && this.buffer.getLastLine() === '') {
        return;
      }
      return this.transact((function(_this) {
        return function() {
          var bufferRange, endPosition, endRow, fold, foldedRow, foldedRows, insertDelta, insertPosition, lines, precedingBufferRow, precedingScreenRow, row, rows, startRow, _i, _j, _k, _len, _len1, _ref1, _ref2, _results;
          foldedRows = [];
          rows = (function() {
            _results = [];
            for (var _i = _ref1 = selection.start.row, _ref2 = selection.end.row; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; _ref1 <= _ref2 ? _i++ : _i--){ _results.push(_i); }
            return _results;
          }).apply(this);
          if (selection.start.row !== selection.end.row && selection.end.column === 0) {
            if (!_this.isFoldedAtBufferRow(selection.end.row)) {
              rows.pop();
            }
          }
          precedingScreenRow = _this.screenPositionForBufferPosition([selection.start.row]).translate([-1]);
          precedingBufferRow = _this.bufferPositionForScreenPosition(precedingScreenRow).row;
          if (fold = _this.largestFoldContainingBufferRow(precedingBufferRow)) {
            insertDelta = fold.getBufferRange().getRowCount();
          } else {
            insertDelta = 1;
          }
          for (_j = 0, _len = rows.length; _j < _len; _j++) {
            row = rows[_j];
            if (fold = _this.displayBuffer.largestFoldStartingAtBufferRow(row)) {
              bufferRange = fold.getBufferRange();
              startRow = bufferRange.start.row;
              endRow = bufferRange.end.row;
              foldedRows.push(startRow - insertDelta);
            } else {
              startRow = row;
              endRow = row;
            }
            insertPosition = Point.fromObject([startRow - insertDelta]);
            endPosition = Point.min([endRow + 1], _this.buffer.getEofPosition());
            lines = _this.buffer.getTextInRange([[startRow], endPosition]);
            if (endPosition.row === lastRow && endPosition.column > 0 && !_this.buffer.lineEndingForRow(endPosition.row)) {
              lines = "" + lines + "\n";
            }
            _this.buffer.deleteRows(startRow, endRow);
            if (fold = _this.displayBuffer.largestFoldStartingAtBufferRow(insertPosition.row)) {
              _this.destroyFoldsContainingBufferRow(insertPosition.row);
              foldedRows.push(insertPosition.row + endRow - startRow + fold.getBufferRange().getRowCount());
            }
            _this.buffer.insert(insertPosition, lines);
          }
          for (_k = 0, _len1 = foldedRows.length; _k < _len1; _k++) {
            foldedRow = foldedRows[_k];
            if ((0 <= foldedRow && foldedRow <= _this.getLastBufferRow())) {
              _this.foldBufferRow(foldedRow);
            }
          }
          return _this.setSelectedBufferRange(selection.translate([-insertDelta]), {
            preserveFolds: true
          });
        };
      })(this));
    };

    Editor.prototype.moveLineDown = function() {
      var lastRow, selection;
      selection = this.getSelectedBufferRange();
      lastRow = this.buffer.getLastRow();
      if (selection.end.row === lastRow) {
        return;
      }
      if (selection.end.row === lastRow - 1 && this.buffer.getLastLine() === '') {
        return;
      }
      return this.transact((function(_this) {
        return function() {
          var bufferRange, endPosition, endRow, fold, foldedRow, foldedRows, followingBufferRow, followingScreenRow, insertDelta, insertPosition, lines, row, rows, startRow, _i, _j, _k, _len, _len1, _ref1, _ref2, _results;
          foldedRows = [];
          rows = (function() {
            _results = [];
            for (var _i = _ref1 = selection.end.row, _ref2 = selection.start.row; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; _ref1 <= _ref2 ? _i++ : _i--){ _results.push(_i); }
            return _results;
          }).apply(this);
          if (selection.start.row !== selection.end.row && selection.end.column === 0) {
            if (!_this.isFoldedAtBufferRow(selection.end.row)) {
              rows.shift();
            }
          }
          followingScreenRow = _this.screenPositionForBufferPosition([selection.end.row]).translate([1]);
          followingBufferRow = _this.bufferPositionForScreenPosition(followingScreenRow).row;
          if (fold = _this.largestFoldContainingBufferRow(followingBufferRow)) {
            insertDelta = fold.getBufferRange().getRowCount();
          } else {
            insertDelta = 1;
          }
          for (_j = 0, _len = rows.length; _j < _len; _j++) {
            row = rows[_j];
            if (fold = _this.displayBuffer.largestFoldStartingAtBufferRow(row)) {
              bufferRange = fold.getBufferRange();
              startRow = bufferRange.start.row;
              endRow = bufferRange.end.row;
              foldedRows.push(endRow + insertDelta);
            } else {
              startRow = row;
              endRow = row;
            }
            if (endRow + 1 === lastRow) {
              endPosition = [endRow, _this.buffer.lineLengthForRow(endRow)];
            } else {
              endPosition = [endRow + 1];
            }
            lines = _this.buffer.getTextInRange([[startRow], endPosition]);
            _this.buffer.deleteRows(startRow, endRow);
            insertPosition = Point.min([startRow + insertDelta], _this.buffer.getEofPosition());
            if (insertPosition.row === _this.buffer.getLastRow() && insertPosition.column > 0) {
              lines = "\n" + lines;
            }
            if (fold = _this.displayBuffer.largestFoldStartingAtBufferRow(insertPosition.row)) {
              _this.destroyFoldsContainingBufferRow(insertPosition.row);
              foldedRows.push(insertPosition.row + fold.getBufferRange().getRowCount());
            }
            _this.buffer.insert(insertPosition, lines);
          }
          for (_k = 0, _len1 = foldedRows.length; _k < _len1; _k++) {
            foldedRow = foldedRows[_k];
            if ((0 <= foldedRow && foldedRow <= _this.getLastBufferRow())) {
              _this.foldBufferRow(foldedRow);
            }
          }
          return _this.setSelectedBufferRange(selection.translate([insertDelta]), {
            preserveFolds: true
          });
        };
      })(this));
    };

    Editor.prototype.duplicateLine = function() {
      if (!this.getSelection().isEmpty()) {
        return;
      }
      return this.transact((function(_this) {
        return function() {
          var bufferRange, cursorPosition, cursorRowFolded, insertPosition, screenRow;
          cursorPosition = _this.getCursorBufferPosition();
          cursorRowFolded = _this.isFoldedAtCursorRow();
          if (cursorRowFolded) {
            screenRow = _this.screenPositionForBufferPosition(cursorPosition).row;
            bufferRange = _this.bufferRangeForScreenRange([[screenRow], [screenRow + 1]]);
          } else {
            bufferRange = new Range([cursorPosition.row], [cursorPosition.row + 1]);
          }
          insertPosition = new Point(bufferRange.end.row);
          if (insertPosition.row > _this.buffer.getLastRow()) {
            if (cursorRowFolded) {
              _this.unfoldCurrentRow();
            }
            _this.buffer.append("\n" + (_this.getTextInBufferRange(bufferRange)));
            if (cursorRowFolded) {
              _this.foldCurrentRow();
            }
          } else {
            _this.buffer.insert(insertPosition, _this.getTextInBufferRange(bufferRange));
          }
          _this.setCursorScreenPosition(_this.getCursorScreenPosition().translate([1]));
          if (cursorRowFolded) {
            return _this.foldCurrentRow();
          }
        };
      })(this));
    };

    Editor.prototype.mutateSelectedText = function(fn) {
      return this.transact((function(_this) {
        return function() {
          var selection, _i, _len, _ref1, _results;
          _ref1 = _this.getSelections();
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            selection = _ref1[_i];
            _results.push(fn(selection));
          }
          return _results;
        };
      })(this));
    };

    Editor.prototype.replaceSelectedText = function(options, fn) {
      var selectWordIfEmpty;
      if (options == null) {
        options = {};
      }
      selectWordIfEmpty = options.selectWordIfEmpty;
      return this.mutateSelectedText(function(selection) {
        var range, text;
        range = selection.getBufferRange();
        if (selectWordIfEmpty && selection.isEmpty()) {
          selection.selectWord();
        }
        text = selection.getText();
        selection.deleteSelectedText();
        selection.insertText(fn(text));
        return selection.setBufferRange(range);
      });
    };

    Editor.prototype.getMarker = function(id) {
      return this.displayBuffer.getMarker(id);
    };

    Editor.prototype.getMarkers = function() {
      return this.displayBuffer.getMarkers();
    };

    Editor.prototype.findMarkers = function(attributes) {
      return this.displayBuffer.findMarkers(attributes);
    };

    Editor.prototype.markScreenRange = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.displayBuffer).markScreenRange.apply(_ref1, args);
    };

    Editor.prototype.markBufferRange = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.displayBuffer).markBufferRange.apply(_ref1, args);
    };

    Editor.prototype.markScreenPosition = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.displayBuffer).markScreenPosition.apply(_ref1, args);
    };

    Editor.prototype.markBufferPosition = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.displayBuffer).markBufferPosition.apply(_ref1, args);
    };

    Editor.prototype.destroyMarker = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.displayBuffer).destroyMarker.apply(_ref1, args);
    };

    Editor.prototype.getMarkerCount = function() {
      return this.buffer.getMarkerCount();
    };

    Editor.prototype.hasMultipleCursors = function() {
      return this.getCursors().length > 1;
    };

    Editor.prototype.getCursors = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, this.cursors, function(){});
    };

    Editor.prototype.getCursor = function() {
      return _.last(this.cursors);
    };

    Editor.prototype.addCursorAtScreenPosition = function(screenPosition) {
      this.markScreenPosition(screenPosition, this.getSelectionMarkerAttributes());
      return this.getLastSelection().cursor;
    };

    Editor.prototype.addCursorAtBufferPosition = function(bufferPosition) {
      this.markBufferPosition(bufferPosition, this.getSelectionMarkerAttributes());
      return this.getLastSelection().cursor;
    };

    Editor.prototype.addCursor = function(marker) {
      var cursor;
      cursor = new Cursor({
        editor: this,
        marker: marker
      });
      this.cursors.push(cursor);
      this.emit('cursor-added', cursor);
      return cursor;
    };

    Editor.prototype.removeCursor = function(cursor) {
      return _.remove(this.cursors, cursor);
    };

    Editor.prototype.addSelection = function(marker, options) {
      var cursor, selection, selectionBufferRange, _i, _len, _ref1;
      if (options == null) {
        options = {};
      }
      if (!marker.getAttributes().preserveFolds) {
        this.destroyFoldsIntersectingBufferRange(marker.getBufferRange());
      }
      cursor = this.addCursor(marker);
      selection = new Selection(_.extend({
        editor: this,
        marker: marker,
        cursor: cursor
      }, options));
      this.selections.push(selection);
      selectionBufferRange = selection.getBufferRange();
      this.mergeIntersectingSelections();
      if (selection.destroyed) {
        _ref1 = this.getSelections();
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          selection = _ref1[_i];
          if (selection.intersectsBufferRange(selectionBufferRange)) {
            return selection;
          }
        }
      } else {
        this.emit('selection-added', selection);
        return selection;
      }
    };

    Editor.prototype.addSelectionForBufferRange = function(bufferRange, options) {
      if (options == null) {
        options = {};
      }
      this.markBufferRange(bufferRange, _.defaults(this.getSelectionMarkerAttributes(), options));
      return this.getLastSelection();
    };

    Editor.prototype.setSelectedBufferRange = function(bufferRange, options) {
      return this.setSelectedBufferRanges([bufferRange], options);
    };

    Editor.prototype.setSelectedBufferRanges = function(bufferRanges, options) {
      var selection, selections, _i, _len, _ref1;
      if (options == null) {
        options = {};
      }
      if (!bufferRanges.length) {
        throw new Error("Passed an empty array to setSelectedBufferRanges");
      }
      selections = this.getSelections();
      _ref1 = selections.slice(bufferRanges.length);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        selection = _ref1[_i];
        selection.destroy();
      }
      return this.mergeIntersectingSelections(options, (function(_this) {
        return function() {
          var bufferRange, i, _j, _len1, _results;
          _results = [];
          for (i = _j = 0, _len1 = bufferRanges.length; _j < _len1; i = ++_j) {
            bufferRange = bufferRanges[i];
            bufferRange = Range.fromObject(bufferRange);
            if (selections[i]) {
              _results.push(selections[i].setBufferRange(bufferRange, options));
            } else {
              _results.push(_this.addSelectionForBufferRange(bufferRange, options));
            }
          }
          return _results;
        };
      })(this));
    };

    Editor.prototype.removeSelection = function(selection) {
      return _.remove(this.selections, selection);
    };

    Editor.prototype.clearSelections = function() {
      this.consolidateSelections();
      return this.getSelection().clear();
    };

    Editor.prototype.consolidateSelections = function() {
      var selection, selections, _i, _len, _ref1;
      selections = this.getSelections();
      if (selections.length > 1) {
        _ref1 = selections.slice(0, -1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          selection = _ref1[_i];
          selection.destroy();
        }
        return true;
      } else {
        return false;
      }
    };

    Editor.prototype.getSelections = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, this.selections, function(){});
    };

    Editor.prototype.getSelection = function(index) {
      if (index == null) {
        index = this.selections.length - 1;
      }
      return this.selections[index];
    };

    Editor.prototype.getLastSelection = function() {
      return _.last(this.selections);
    };

    Editor.prototype.getSelectionsOrderedByBufferPosition = function() {
      return this.getSelections().sort(function(a, b) {
        return a.compare(b);
      });
    };

    Editor.prototype.getLastSelectionInBuffer = function() {
      return _.last(this.getSelectionsOrderedByBufferPosition());
    };

    Editor.prototype.selectionIntersectsBufferRange = function(bufferRange) {
      return _.any(this.getSelections(), function(selection) {
        return selection.intersectsBufferRange(bufferRange);
      });
    };

    Editor.prototype.setCursorScreenPosition = function(position, options) {
      return this.moveCursors(function(cursor) {
        return cursor.setScreenPosition(position, options);
      });
    };

    Editor.prototype.getCursorScreenPosition = function() {
      return this.getCursor().getScreenPosition();
    };

    Editor.prototype.getCursorScreenRow = function() {
      return this.getCursor().getScreenRow();
    };

    Editor.prototype.setCursorBufferPosition = function(position, options) {
      return this.moveCursors(function(cursor) {
        return cursor.setBufferPosition(position, options);
      });
    };

    Editor.prototype.getCursorBufferPosition = function() {
      return this.getCursor().getBufferPosition();
    };

    Editor.prototype.getSelectedScreenRange = function() {
      return this.getLastSelection().getScreenRange();
    };

    Editor.prototype.getSelectedBufferRange = function() {
      return this.getLastSelection().getBufferRange();
    };

    Editor.prototype.getSelectedBufferRanges = function() {
      var selection, _i, _len, _ref1, _results;
      _ref1 = this.getSelectionsOrderedByBufferPosition();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        selection = _ref1[_i];
        _results.push(selection.getBufferRange());
      }
      return _results;
    };

    Editor.prototype.getSelectedText = function() {
      return this.getLastSelection().getText();
    };

    Editor.prototype.getTextInBufferRange = function(range) {
      return this.buffer.getTextInRange(range);
    };

    Editor.prototype.setTextInBufferRange = function(range, text) {
      return this.getBuffer().change(range, text);
    };

    Editor.prototype.getCurrentParagraphBufferRange = function() {
      return this.getCursor().getCurrentParagraphBufferRange();
    };

    Editor.prototype.getWordUnderCursor = function(options) {
      return this.getTextInBufferRange(this.getCursor().getCurrentWordBufferRange(options));
    };

    Editor.prototype.moveCursorUp = function(lineCount) {
      return this.moveCursors(function(cursor) {
        return cursor.moveUp(lineCount, {
          moveToEndOfSelection: true
        });
      });
    };

    Editor.prototype.moveCursorDown = function(lineCount) {
      return this.moveCursors(function(cursor) {
        return cursor.moveDown(lineCount, {
          moveToEndOfSelection: true
        });
      });
    };

    Editor.prototype.moveCursorLeft = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveLeft({
          moveToEndOfSelection: true
        });
      });
    };

    Editor.prototype.moveCursorRight = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveRight({
          moveToEndOfSelection: true
        });
      });
    };

    Editor.prototype.moveCursorToTop = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToTop();
      });
    };

    Editor.prototype.moveCursorToBottom = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBottom();
      });
    };

    Editor.prototype.moveCursorToBeginningOfScreenLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfScreenLine();
      });
    };

    Editor.prototype.moveCursorToBeginningOfLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfLine();
      });
    };

    Editor.prototype.moveCursorToFirstCharacterOfLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToFirstCharacterOfLine();
      });
    };

    Editor.prototype.moveCursorToEndOfScreenLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToEndOfScreenLine();
      });
    };

    Editor.prototype.moveCursorToEndOfLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToEndOfLine();
      });
    };

    Editor.prototype.moveCursorToBeginningOfWord = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfWord();
      });
    };

    Editor.prototype.moveCursorToEndOfWord = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToEndOfWord();
      });
    };

    Editor.prototype.moveCursorToBeginningOfNextWord = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfNextWord();
      });
    };

    Editor.prototype.moveCursorToPreviousWordBoundary = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToPreviousWordBoundary();
      });
    };

    Editor.prototype.moveCursorToNextWordBoundary = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToNextWordBoundary();
      });
    };

    Editor.prototype.moveCursors = function(fn) {
      var cursor, _i, _len, _ref1;
      _ref1 = this.getCursors();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        cursor = _ref1[_i];
        fn(cursor);
      }
      return this.mergeCursors();
    };

    Editor.prototype.selectToScreenPosition = function(position) {
      var lastSelection;
      lastSelection = this.getLastSelection();
      lastSelection.selectToScreenPosition(position);
      return this.mergeIntersectingSelections({
        isReversed: lastSelection.isReversed()
      });
    };

    Editor.prototype.selectRight = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectRight();
        };
      })(this));
    };

    Editor.prototype.selectLeft = function() {
      return this.expandSelectionsBackward((function(_this) {
        return function(selection) {
          return selection.selectLeft();
        };
      })(this));
    };

    Editor.prototype.selectUp = function(rowCount) {
      return this.expandSelectionsBackward((function(_this) {
        return function(selection) {
          return selection.selectUp(rowCount);
        };
      })(this));
    };

    Editor.prototype.selectDown = function(rowCount) {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectDown(rowCount);
        };
      })(this));
    };

    Editor.prototype.selectToTop = function() {
      return this.expandSelectionsBackward((function(_this) {
        return function(selection) {
          return selection.selectToTop();
        };
      })(this));
    };

    Editor.prototype.selectAll = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectAll();
        };
      })(this));
    };

    Editor.prototype.selectToBottom = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectToBottom();
        };
      })(this));
    };

    Editor.prototype.selectToBeginningOfLine = function() {
      return this.expandSelectionsBackward((function(_this) {
        return function(selection) {
          return selection.selectToBeginningOfLine();
        };
      })(this));
    };

    Editor.prototype.selectToFirstCharacterOfLine = function() {
      return this.expandSelectionsBackward((function(_this) {
        return function(selection) {
          return selection.selectToFirstCharacterOfLine();
        };
      })(this));
    };

    Editor.prototype.selectToEndOfLine = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectToEndOfLine();
        };
      })(this));
    };

    Editor.prototype.selectToPreviousWordBoundary = function() {
      return this.expandSelectionsBackward((function(_this) {
        return function(selection) {
          return selection.selectToPreviousWordBoundary();
        };
      })(this));
    };

    Editor.prototype.selectToNextWordBoundary = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectToNextWordBoundary();
        };
      })(this));
    };

    Editor.prototype.selectLine = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectLine();
        };
      })(this));
    };

    Editor.prototype.addSelectionBelow = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.addSelectionBelow();
        };
      })(this));
    };

    Editor.prototype.addSelectionAbove = function() {
      return this.expandSelectionsBackward((function(_this) {
        return function(selection) {
          return selection.addSelectionAbove();
        };
      })(this));
    };

    Editor.prototype.splitSelectionsIntoLines = function() {
      var end, range, row, selection, start, _i, _len, _ref1, _results;
      _ref1 = this.getSelections();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        selection = _ref1[_i];
        range = selection.getBufferRange();
        if (range.isSingleLine()) {
          continue;
        }
        selection.destroy();
        start = range.start, end = range.end;
        this.addSelectionForBufferRange([start, [start.row, Infinity]]);
        row = start.row;
        while (++row < end.row) {
          this.addSelectionForBufferRange([[row, 0], [row, Infinity]]);
        }
        _results.push(this.addSelectionForBufferRange([[end.row, 0], [end.row, end.column]]));
      }
      return _results;
    };

    Editor.prototype.transpose = function() {
      return this.mutateSelectedText((function(_this) {
        return function(selection) {
          var text;
          if (selection.isEmpty()) {
            selection.selectRight();
            text = selection.getText();
            selection["delete"]();
            selection.cursor.moveLeft();
            return selection.insertText(text);
          } else {
            return selection.insertText(selection.getText().split('').reverse().join(''));
          }
        };
      })(this));
    };

    Editor.prototype.upperCase = function() {
      return this.replaceSelectedText({
        selectWordIfEmpty: true
      }, (function(_this) {
        return function(text) {
          return text.toUpperCase();
        };
      })(this));
    };

    Editor.prototype.lowerCase = function() {
      return this.replaceSelectedText({
        selectWordIfEmpty: true
      }, (function(_this) {
        return function(text) {
          return text.toLowerCase();
        };
      })(this));
    };

    Editor.prototype.joinLine = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.joinLine();
      });
    };

    Editor.prototype.expandLastSelectionOverLine = function() {
      return this.getLastSelection().expandOverLine();
    };

    Editor.prototype.selectToBeginningOfWord = function() {
      return this.expandSelectionsBackward((function(_this) {
        return function(selection) {
          return selection.selectToBeginningOfWord();
        };
      })(this));
    };

    Editor.prototype.selectToEndOfWord = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectToEndOfWord();
        };
      })(this));
    };

    Editor.prototype.selectToBeginningOfNextWord = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectToBeginningOfNextWord();
        };
      })(this));
    };

    Editor.prototype.selectWord = function() {
      return this.expandSelectionsForward((function(_this) {
        return function(selection) {
          return selection.selectWord();
        };
      })(this));
    };

    Editor.prototype.expandLastSelectionOverWord = function() {
      return this.getLastSelection().expandOverWord();
    };

    Editor.prototype.selectMarker = function(marker) {
      var range;
      if (marker.isValid()) {
        range = marker.getBufferRange();
        this.setSelectedBufferRange(range);
        return range;
      }
    };

    Editor.prototype.mergeCursors = function() {
      var cursor, position, positions, _i, _len, _ref1, _results;
      positions = [];
      _ref1 = this.getCursors();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        cursor = _ref1[_i];
        position = cursor.getBufferPosition().toString();
        if (__indexOf.call(positions, position) >= 0) {
          _results.push(cursor.destroy());
        } else {
          _results.push(positions.push(position));
        }
      }
      return _results;
    };

    Editor.prototype.expandSelectionsForward = function(fn) {
      return this.mergeIntersectingSelections((function(_this) {
        return function() {
          var selection, _i, _len, _ref1, _results;
          _ref1 = _this.getSelections();
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            selection = _ref1[_i];
            _results.push(fn(selection));
          }
          return _results;
        };
      })(this));
    };

    Editor.prototype.expandSelectionsBackward = function(fn) {
      return this.mergeIntersectingSelections({
        isReversed: true
      }, (function(_this) {
        return function() {
          var selection, _i, _len, _ref1, _results;
          _ref1 = _this.getSelections();
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            selection = _ref1[_i];
            _results.push(fn(selection));
          }
          return _results;
        };
      })(this));
    };

    Editor.prototype.finalizeSelections = function() {
      var selection, _i, _len, _ref1, _results;
      _ref1 = this.getSelections();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        selection = _ref1[_i];
        _results.push(selection.finalize());
      }
      return _results;
    };

    Editor.prototype.mergeIntersectingSelections = function() {
      var args, fn, options, reducer, result, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (_.isFunction(_.last(args))) {
        fn = args.pop();
      }
      options = (_ref1 = args.pop()) != null ? _ref1 : {};
      if (this.suppressSelectionMerging) {
        return typeof fn === "function" ? fn() : void 0;
      }
      if (fn != null) {
        this.suppressSelectionMerging = true;
        result = fn();
        this.suppressSelectionMerging = false;
      }
      reducer = function(disjointSelections, selection) {
        var intersectingSelection;
        intersectingSelection = _.find(disjointSelections, function(s) {
          return s.intersectsWith(selection);
        });
        if (intersectingSelection != null) {
          intersectingSelection.merge(selection, options);
          return disjointSelections;
        } else {
          return disjointSelections.concat([selection]);
        }
      };
      return _.reduce(this.getSelections(), reducer, []);
    };

    Editor.prototype.preserveCursorPositionOnBufferReload = function() {
      var cursorPosition;
      cursorPosition = null;
      this.subscribe(this.buffer, "will-reload", (function(_this) {
        return function() {
          return cursorPosition = _this.getCursorBufferPosition();
        };
      })(this));
      return this.subscribe(this.buffer, "reloaded", (function(_this) {
        return function() {
          if (cursorPosition) {
            _this.setCursorBufferPosition(cursorPosition);
          }
          return cursorPosition = null;
        };
      })(this));
    };

    Editor.prototype.getGrammar = function() {
      return this.displayBuffer.getGrammar();
    };

    Editor.prototype.setGrammar = function(grammar) {
      return this.displayBuffer.setGrammar(grammar);
    };

    Editor.prototype.reloadGrammar = function() {
      return this.displayBuffer.reloadGrammar();
    };

    Editor.prototype.shouldAutoIndent = function() {
      return atom.config.get("editor.autoIndent");
    };

    Editor.prototype.transact = function(fn) {
      return this.buffer.transact(fn);
    };

    Editor.prototype.beginTransaction = function() {
      return this.buffer.beginTransaction();
    };

    Editor.prototype.commitTransaction = function() {
      return this.buffer.commitTransaction();
    };

    Editor.prototype.abortTransaction = function() {
      return this.buffer.abortTransaction();
    };

    Editor.prototype.inspect = function() {
      return "<Editor " + this.id + ">";
    };

    Editor.prototype.logScreenLines = function(start, end) {
      return this.displayBuffer.logLines(start, end);
    };

    Editor.prototype.handleGrammarChange = function() {
      this.unfoldAll();
      return this.emit('grammar-changed');
    };

    Editor.prototype.handleMarkerCreated = function(marker) {
      if (marker.matchesAttributes(this.getSelectionMarkerAttributes())) {
        return this.addSelection(marker);
      }
    };

    Editor.prototype.getSelectionMarkerAttributes = function() {
      return {
        type: 'selection',
        editorId: this.id,
        invalidate: 'never'
      };
    };

    return Editor;

  })(Model);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/editor.js.map
