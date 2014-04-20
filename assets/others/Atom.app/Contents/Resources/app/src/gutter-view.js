(function() {
  var $, $$, $$$, GutterView, Range, View, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('./space-pen-extensions'), View = _ref.View, $ = _ref.$, $$ = _ref.$$, $$$ = _ref.$$$;

  Range = require('text-buffer').Range;

  _ = require('underscore-plus');

  module.exports = GutterView = (function(_super) {
    __extends(GutterView, _super);

    function GutterView() {
      this.buildLineElementsHtml = __bind(this.buildLineElementsHtml, this);
      return GutterView.__super__.constructor.apply(this, arguments);
    }

    GutterView.content = function() {
      return this.div({
        "class": 'gutter'
      }, (function(_this) {
        return function() {
          return _this.div({
            outlet: 'lineNumbers',
            "class": 'line-numbers'
          });
        };
      })(this));
    };

    GutterView.prototype.firstScreenRow = null;

    GutterView.prototype.lastScreenRow = null;

    GutterView.prototype.initialize = function() {
      return this.elementBuilder = document.createElement('div');
    };

    GutterView.prototype.afterAttach = function(onDom) {
      var highlightLines;
      if (this.attached || !onDom) {
        return;
      }
      this.attached = true;
      highlightLines = (function(_this) {
        return function() {
          return _this.highlightLines();
        };
      })(this);
      this.getEditorView().on('cursor:moved', highlightLines);
      this.getEditorView().on('selection:changed', highlightLines);
      return this.on('mousedown', (function(_this) {
        return function(e) {
          return _this.handleMouseEvents(e);
        };
      })(this));
    };

    GutterView.prototype.beforeRemove = function() {
      return $(document).off(".gutter-" + (this.getEditorView().id));
    };

    GutterView.prototype.handleMouseEvents = function(e) {
      var editor, editorView, moveHandler, startRow;
      editorView = this.getEditorView();
      editor = this.getEditor();
      startRow = editorView.screenPositionFromMouseEvent(e).row;
      if (e.shiftKey) {
        editor.selectToScreenPosition([startRow + 1, 0]);
        return;
      } else {
        editor.getSelection().setScreenRange([[startRow, 0], [startRow, 0]]);
      }
      moveHandler = (function(_this) {
        return function(e) {
          var end, start;
          start = startRow;
          end = editorView.screenPositionFromMouseEvent(e).row;
          if (end > start) {
            end++;
          } else {
            start++;
          }
          return editor.getSelection().setScreenRange([[start, 0], [end, 0]]);
        };
      })(this);
      $(document).on("mousemove.gutter-" + editorView.id, moveHandler);
      return $(document).one("mouseup.gutter-" + editorView.id, (function(_this) {
        return function() {
          return $(document).off('mousemove', moveHandler);
        };
      })(this));
    };

    GutterView.prototype.getEditorView = function() {
      return this.parentView;
    };

    GutterView.prototype.getEditor = function() {
      return this.getEditorView().getEditor();
    };

    GutterView.prototype.setShowLineNumbers = function(showLineNumbers) {
      if (showLineNumbers) {
        return this.lineNumbers.show();
      } else {
        return this.lineNumbers.hide();
      }
    };

    GutterView.prototype.getLineNumberElements = function() {
      return this.lineNumbers[0].children;
    };

    GutterView.prototype.getLineNumberElementsForClass = function(klass) {
      return this.lineNumbers[0].getElementsByClassName(klass);
    };

    GutterView.prototype.getLineNumberElement = function(bufferRow) {
      return this.getLineNumberElementsForClass("line-number-" + bufferRow);
    };

    GutterView.prototype.addClassToAllLines = function(klass) {
      var el, elements, _i, _len;
      elements = this.getLineNumberElements();
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        el.classList.add(klass);
      }
      return !!elements.length;
    };

    GutterView.prototype.removeClassFromAllLines = function(klass) {
      var elements, willRemoveClasses;
      elements = this.getLineNumberElementsForClass(klass);
      willRemoveClasses = !!elements.length;
      while (elements.length > 0) {
        elements[0].classList.remove(klass);
      }
      return willRemoveClasses;
    };

    GutterView.prototype.addClassToLine = function(bufferRow, klass) {
      var el, elements, _i, _len;
      elements = this.getLineNumberElement(bufferRow);
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        el.classList.add(klass);
      }
      return !!elements.length;
    };

    GutterView.prototype.removeClassFromLine = function(bufferRow, klass) {
      var classesRemoved, el, elements, hasClass, _i, _len;
      classesRemoved = false;
      elements = this.getLineNumberElement(bufferRow);
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        hasClass = el.classList.contains(klass);
        classesRemoved |= hasClass;
        if (hasClass) {
          el.classList.remove(klass);
        }
      }
      return classesRemoved;
    };

    GutterView.prototype.updateLineNumbers = function(changes, startScreenRow, endScreenRow) {
      var change, updateAllLines, _i, _len;
      updateAllLines = !((startScreenRow != null) && (endScreenRow != null));
      updateAllLines |= endScreenRow <= this.firstScreenRow || startScreenRow >= this.lastScreenRow;
      if (!updateAllLines) {
        for (_i = 0, _len = changes.length; _i < _len; _i++) {
          change = changes[_i];
          if (change.screenDelta || change.bufferDelta) {
            updateAllLines = true;
            break;
          }
        }
      }
      if (updateAllLines) {
        this.lineNumbers[0].innerHTML = this.buildLineElementsHtml(startScreenRow, endScreenRow);
      } else {
        if (startScreenRow < this.firstScreenRow) {
          this.prependLineElements(this.buildLineElements(startScreenRow, this.firstScreenRow - 1));
        } else if (startScreenRow !== this.firstScreenRow) {
          this.removeLineElements(startScreenRow - this.firstScreenRow);
        }
        if (endScreenRow > this.lastScreenRow) {
          this.appendLineElements(this.buildLineElements(this.lastScreenRow + 1, endScreenRow));
        } else if (endScreenRow !== this.lastScreenRow) {
          this.removeLineElements(endScreenRow - this.lastScreenRow);
        }
        this.updateFoldableClasses(changes);
      }
      this.firstScreenRow = startScreenRow;
      this.lastScreenRow = endScreenRow;
      this.highlightedRows = null;
      return this.highlightLines();
    };

    GutterView.prototype.prependLineElements = function(lineElements) {
      var anchor;
      anchor = this.lineNumbers[0].children[0];
      if (anchor == null) {
        return appendLineElements(lineElements);
      }
      while (lineElements.length > 0) {
        this.lineNumbers[0].insertBefore(lineElements[0], anchor);
      }
      return null;
    };

    GutterView.prototype.appendLineElements = function(lineElements) {
      while (lineElements.length > 0) {
        this.lineNumbers[0].appendChild(lineElements[0]);
      }
      return null;
    };

    GutterView.prototype.removeLineElements = function(numberOfElements) {
      var children;
      children = this.getLineNumberElements();
      if (numberOfElements < 0) {
        while (numberOfElements++) {
          this.lineNumbers[0].removeChild(children[children.length - 1]);
        }
      } else if (numberOfElements > 0) {
        while (numberOfElements--) {
          this.lineNumbers[0].removeChild(children[0]);
        }
      }
      return null;
    };

    GutterView.prototype.buildLineElements = function(startScreenRow, endScreenRow) {
      this.elementBuilder.innerHTML = this.buildLineElementsHtml(startScreenRow, endScreenRow);
      return this.elementBuilder.children;
    };

    GutterView.prototype.buildLineElementsHtml = function(startScreenRow, endScreenRow) {
      var classes, editor, html, lastRow, maxDigits, row, rowValue, rowValuePadding, rows, _i, _len;
      editor = this.getEditor();
      maxDigits = editor.getLineCount().toString().length;
      rows = editor.bufferRowsForScreenRows(startScreenRow, endScreenRow);
      html = '';
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        if (row === lastRow) {
          rowValue = '•';
        } else {
          rowValue = (row + 1).toString();
        }
        classes = "line-number line-number-" + row;
        if (row !== lastRow && editor.isFoldableAtBufferRow(row)) {
          classes += ' foldable';
        }
        if (editor.isFoldedAtBufferRow(row)) {
          classes += ' folded';
        }
        rowValuePadding = _.multiplyString('&nbsp;', maxDigits - rowValue.length);
        html += "<div class=\"" + classes + "\" data-buffer-row=" + row + ">" + rowValuePadding + rowValue + "<div class=\"icon-right\"></div></div>";
        lastRow = row;
      }
      return html;
    };

    GutterView.prototype.updateFoldableClasses = function(changes) {
      var bufferRow, editor, end, endScreenRow, lastBufferRow, lineNumberElement, start, startScreenRow, _i, _len, _ref1, _results;
      editor = this.getEditor();
      _results = [];
      for (_i = 0, _len = changes.length; _i < _len; _i++) {
        _ref1 = changes[_i], start = _ref1.start, end = _ref1.end;
        if (!(start <= this.lastScreenRow && end >= this.firstScreenRow)) {
          continue;
        }
        startScreenRow = Math.max(start - 1, this.firstScreenRow);
        endScreenRow = Math.min(end + 1, this.lastScreenRow);
        lastBufferRow = null;
        _results.push((function() {
          var _j, _len1, _ref2, _results1;
          _ref2 = editor.bufferRowsForScreenRows(startScreenRow, endScreenRow);
          _results1 = [];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            bufferRow = _ref2[_j];
            if (!(bufferRow !== lastBufferRow)) {
              continue;
            }
            lastBufferRow = bufferRow;
            if (lineNumberElement = this.getLineNumberElement(bufferRow)[0]) {
              if (editor.isFoldableAtBufferRow(bufferRow)) {
                _results1.push(lineNumberElement.classList.add('foldable'));
              } else {
                _results1.push(lineNumberElement.classList.remove('foldable'));
              }
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    GutterView.prototype.removeLineHighlights = function() {
      var line, _i, _len, _ref1;
      if (!this.highlightedLineNumbers) {
        return;
      }
      _ref1 = this.highlightedLineNumbers;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        line = _ref1[_i];
        line.classList.remove('cursor-line');
        line.classList.remove('cursor-line-no-selection');
      }
      return this.highlightedLineNumbers = null;
    };

    GutterView.prototype.addLineHighlight = function(row, emptySelection) {
      var highlightedLineNumber;
      if (row < this.firstScreenRow || row > this.lastScreenRow) {
        return;
      }
      if (this.highlightedLineNumbers == null) {
        this.highlightedLineNumbers = [];
      }
      if (highlightedLineNumber = this.lineNumbers[0].children[row - this.firstScreenRow]) {
        highlightedLineNumber.classList.add('cursor-line');
        if (emptySelection) {
          highlightedLineNumber.classList.add('cursor-line-no-selection');
        }
        return this.highlightedLineNumbers.push(highlightedLineNumber);
      }
    };

    GutterView.prototype.highlightLines = function() {
      var editor, endRow, row, rowRange, selectedRows, _i, _ref1, _ref2, _ref3, _ref4;
      editor = this.getEditor();
      if (!(editor != null ? editor.isAlive() : void 0)) {
        return;
      }
      if (editor.getSelection().isEmpty()) {
        row = editor.getCursorScreenPosition().row;
        rowRange = new Range([row, 0], [row, 0]);
        if (this.selectionEmpty && ((_ref1 = this.highlightedRows) != null ? _ref1.isEqual(rowRange) : void 0)) {
          return;
        }
        this.removeLineHighlights();
        this.addLineHighlight(row, true);
        this.highlightedRows = rowRange;
        return this.selectionEmpty = true;
      } else {
        selectedRows = editor.getSelection().getScreenRange();
        endRow = selectedRows.end.row;
        if (selectedRows.end.column === 0) {
          endRow--;
        }
        selectedRows = new Range([selectedRows.start.row, 0], [endRow, 0]);
        if (!this.selectionEmpty && ((_ref2 = this.highlightedRows) != null ? _ref2.isEqual(selectedRows) : void 0)) {
          return;
        }
        this.removeLineHighlights();
        for (row = _i = _ref3 = selectedRows.start.row, _ref4 = selectedRows.end.row; _ref3 <= _ref4 ? _i <= _ref4 : _i >= _ref4; row = _ref3 <= _ref4 ? ++_i : --_i) {
          this.addLineHighlight(row, false);
        }
        this.highlightedRows = selectedRows;
        return this.selectionEmpty = false;
      }
    };

    return GutterView;

  })(View);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/gutter-view.js.map
