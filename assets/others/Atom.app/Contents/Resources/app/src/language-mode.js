(function() {
  var Emitter, LanguageMode, OnigRegExp, Range, Subscriber, _, _ref;

  Range = require('text-buffer').Range;

  _ = require('underscore-plus');

  OnigRegExp = require('oniguruma').OnigRegExp;

  _ref = require('emissary'), Emitter = _ref.Emitter, Subscriber = _ref.Subscriber;

  module.exports = LanguageMode = (function() {
    Emitter.includeInto(LanguageMode);

    Subscriber.includeInto(LanguageMode);

    function LanguageMode(editor) {
      this.editor = editor;
      this.buffer = this.editor.buffer;
    }

    LanguageMode.prototype.destroy = function() {
      return this.unsubscribe();
    };

    LanguageMode.prototype.toggleLineCommentForBufferRow = function(row) {
      return this.toggleLineCommentsForBufferRows(row, row);
    };

    LanguageMode.prototype.toggleLineCommentsForBufferRows = function(start, end) {
      var buffer, columnEnd, columnStart, commentEndRegex, commentEndRegexString, commentEndString, commentStartRegex, commentStartRegexString, commentStartString, endMatch, indent, indentLength, indentRegex, indentString, line, match, properties, row, scopes, shouldUncomment, startMatch, tabLength, _i, _j, _k, _ref1, _ref2, _results, _results1, _results2;
      scopes = this.editor.scopesForBufferPosition([start, 0]);
      properties = atom.syntax.propertiesForScope(scopes, "editor.commentStart")[0];
      if (!properties) {
        return;
      }
      commentStartString = _.valueForKeyPath(properties, "editor.commentStart");
      commentEndString = _.valueForKeyPath(properties, "editor.commentEnd");
      if (!commentStartString) {
        return;
      }
      buffer = this.editor.buffer;
      commentStartRegexString = _.escapeRegExp(commentStartString).replace(/(\s+)$/, '($1)?');
      commentStartRegex = new OnigRegExp("^(\\s*)(" + commentStartRegexString + ")");
      shouldUncomment = commentStartRegex.test(buffer.lineForRow(start));
      if (commentEndString) {
        if (shouldUncomment) {
          commentEndRegexString = _.escapeRegExp(commentEndString).replace(/^(\s+)/, '($1)?');
          commentEndRegex = new OnigRegExp("(" + commentEndRegexString + ")(\\s*)$");
          startMatch = commentStartRegex.search(buffer.lineForRow(start));
          endMatch = commentEndRegex.search(buffer.lineForRow(end));
          if (startMatch && endMatch) {
            return buffer.transact(function() {
              var columnEnd, columnStart, endColumn, endLength;
              columnStart = startMatch[1].length;
              columnEnd = columnStart + startMatch[2].length;
              buffer.change([[start, columnStart], [start, columnEnd]], "");
              endLength = buffer.lineLengthForRow(end) - endMatch[2].length;
              endColumn = endLength - endMatch[1].length;
              return buffer.change([[end, endColumn], [end, endLength]], "");
            });
          }
        } else {
          return buffer.transact(function() {
            buffer.insert([start, 0], commentStartString);
            return buffer.insert([end, buffer.lineLengthForRow(end)], commentEndString);
          });
        }
      } else {
        if (shouldUncomment && start !== end) {
          shouldUncomment = (function() {
            _results = [];
            for (var _i = _ref1 = start + 1; _ref1 <= end ? _i <= end : _i >= end; _ref1 <= end ? _i++ : _i--){ _results.push(_i); }
            return _results;
          }).apply(this).every(function(row) {
            var line;
            line = buffer.lineForRow(row);
            return !line || commentStartRegex.test(line);
          });
        }
        if (shouldUncomment) {
          _results1 = [];
          for (row = _j = start; start <= end ? _j <= end : _j >= end; row = start <= end ? ++_j : --_j) {
            if (match = commentStartRegex.search(buffer.lineForRow(row))) {
              columnStart = match[1].length;
              columnEnd = columnStart + match[2].length;
              _results1.push(buffer.change([[row, columnStart], [row, columnEnd]], ""));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        } else {
          indent = this.minIndentLevelForRowRange(start, end);
          indentString = this.editor.buildIndentString(indent);
          tabLength = this.editor.getTabLength();
          indentRegex = new RegExp("(\t|[ ]{" + tabLength + "}){" + (Math.floor(indent)) + "}");
          _results2 = [];
          for (row = _k = start; start <= end ? _k <= end : _k >= end; row = start <= end ? ++_k : --_k) {
            line = buffer.lineForRow(row);
            if (indentLength = (_ref2 = line.match(indentRegex)) != null ? _ref2[0].length : void 0) {
              _results2.push(buffer.insert([row, indentLength], commentStartString));
            } else {
              _results2.push(buffer.change([[row, 0], [row, indentString.length]], indentString + commentStartString));
            }
          }
          return _results2;
        }
      }
    };

    LanguageMode.prototype.foldAll = function() {
      var currentRow, endRow, startRow, _i, _ref1, _ref2, _ref3, _results;
      _results = [];
      for (currentRow = _i = 0, _ref1 = this.buffer.getLastRow(); 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; currentRow = 0 <= _ref1 ? ++_i : --_i) {
        _ref3 = (_ref2 = this.rowRangeForFoldAtBufferRow(currentRow)) != null ? _ref2 : [], startRow = _ref3[0], endRow = _ref3[1];
        if (startRow == null) {
          continue;
        }
        _results.push(this.editor.createFold(startRow, endRow));
      }
      return _results;
    };

    LanguageMode.prototype.unfoldAll = function() {
      var fold, row, _i, _ref1, _results;
      _results = [];
      for (row = _i = _ref1 = this.buffer.getLastRow(); _ref1 <= 0 ? _i <= 0 : _i >= 0; row = _ref1 <= 0 ? ++_i : --_i) {
        _results.push((function() {
          var _j, _len, _ref2, _results1;
          _ref2 = this.editor.displayBuffer.foldsStartingAtBufferRow(row);
          _results1 = [];
          for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
            fold = _ref2[_j];
            _results1.push(fold.destroy());
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    LanguageMode.prototype.foldAllAtIndentLevel = function(indentLevel) {
      var currentRow, endRow, startRow, _i, _ref1, _ref2, _ref3, _results;
      _results = [];
      for (currentRow = _i = 0, _ref1 = this.buffer.getLastRow(); 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; currentRow = 0 <= _ref1 ? ++_i : --_i) {
        _ref3 = (_ref2 = this.rowRangeForFoldAtBufferRow(currentRow)) != null ? _ref2 : [], startRow = _ref3[0], endRow = _ref3[1];
        if (startRow == null) {
          continue;
        }
        if (this.editor.indentationForBufferRow(startRow) === indentLevel) {
          _results.push(this.editor.createFold(startRow, endRow));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    LanguageMode.prototype.foldBufferRow = function(bufferRow) {
      var currentRow, endRow, fold, startRow, _i, _ref1, _ref2;
      for (currentRow = _i = bufferRow; bufferRow <= 0 ? _i <= 0 : _i >= 0; currentRow = bufferRow <= 0 ? ++_i : --_i) {
        _ref2 = (_ref1 = this.rowRangeForFoldAtBufferRow(currentRow)) != null ? _ref1 : [], startRow = _ref2[0], endRow = _ref2[1];
        if (!((startRow != null) && (startRow <= bufferRow && bufferRow <= endRow))) {
          continue;
        }
        fold = this.editor.displayBuffer.largestFoldStartingAtBufferRow(startRow);
        if (!fold) {
          return this.editor.createFold(startRow, endRow);
        }
      }
    };

    LanguageMode.prototype.unfoldBufferRow = function(bufferRow) {
      var _ref1;
      return (_ref1 = this.editor.displayBuffer.largestFoldContainingBufferRow(bufferRow)) != null ? _ref1.destroy() : void 0;
    };

    LanguageMode.prototype.rowRangeForFoldAtBufferRow = function(bufferRow) {
      var rowRange;
      rowRange = this.rowRangeForCommentAtBufferRow(bufferRow);
      if (rowRange == null) {
        rowRange = this.rowRangeForCodeFoldAtBufferRow(bufferRow);
      }
      return rowRange;
    };

    LanguageMode.prototype.rowRangeForCommentAtBufferRow = function(bufferRow) {
      var currentRow, endRow, startRow, _i, _j, _ref1, _ref2, _ref3;
      if (!this.editor.displayBuffer.tokenizedBuffer.lineForScreenRow(bufferRow).isComment()) {
        return;
      }
      startRow = bufferRow;
      for (currentRow = _i = _ref1 = bufferRow - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; currentRow = _ref1 <= 0 ? ++_i : --_i) {
        if (this.buffer.isRowBlank(currentRow)) {
          break;
        }
        if (!this.editor.displayBuffer.tokenizedBuffer.lineForScreenRow(currentRow).isComment()) {
          break;
        }
        startRow = currentRow;
      }
      endRow = bufferRow;
      for (currentRow = _j = _ref2 = bufferRow + 1, _ref3 = this.buffer.getLastRow(); _ref2 <= _ref3 ? _j <= _ref3 : _j >= _ref3; currentRow = _ref2 <= _ref3 ? ++_j : --_j) {
        if (this.buffer.isRowBlank(currentRow)) {
          break;
        }
        if (!this.editor.displayBuffer.tokenizedBuffer.lineForScreenRow(currentRow).isComment()) {
          break;
        }
        endRow = currentRow;
      }
      if (startRow !== endRow) {
        return [startRow, endRow];
      }
    };

    LanguageMode.prototype.rowRangeForCodeFoldAtBufferRow = function(bufferRow) {
      var foldEndRow, includeRowInFold, indentation, row, scopes, startIndentLevel, _i, _ref1, _ref2, _ref3;
      if (!this.isFoldableAtBufferRow(bufferRow)) {
        return null;
      }
      startIndentLevel = this.editor.indentationForBufferRow(bufferRow);
      scopes = this.editor.scopesForBufferPosition([bufferRow, 0]);
      for (row = _i = _ref1 = bufferRow + 1, _ref2 = this.editor.getLastBufferRow(); _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; row = _ref1 <= _ref2 ? ++_i : --_i) {
        if (this.editor.isBufferRowBlank(row)) {
          continue;
        }
        indentation = this.editor.indentationForBufferRow(row);
        if (indentation <= startIndentLevel) {
          includeRowInFold = indentation === startIndentLevel && ((_ref3 = this.foldEndRegexForScopes(scopes)) != null ? _ref3.search(this.editor.lineForBufferRow(row)) : void 0);
          if (includeRowInFold) {
            foldEndRow = row;
          }
          break;
        }
        foldEndRow = row;
      }
      return [bufferRow, foldEndRow];
    };

    LanguageMode.prototype.isFoldableAtBufferRow = function(bufferRow) {
      return this.isFoldableCodeAtBufferRow(bufferRow) || this.isFoldableCommentAtBufferRow(bufferRow);
    };

    LanguageMode.prototype.isFoldableCodeAtBufferRow = function(bufferRow) {
      var nextNonEmptyRow;
      if (this.editor.isBufferRowBlank(bufferRow) || this.isLineCommentedAtBufferRow(bufferRow)) {
        return false;
      }
      nextNonEmptyRow = this.editor.nextNonBlankBufferRow(bufferRow);
      if (nextNonEmptyRow == null) {
        return false;
      }
      return this.editor.indentationForBufferRow(nextNonEmptyRow) > this.editor.indentationForBufferRow(bufferRow);
    };

    LanguageMode.prototype.isFoldableCommentAtBufferRow = function(bufferRow) {
      return this.isLineCommentedAtBufferRow(bufferRow) && this.isLineCommentedAtBufferRow(bufferRow + 1) && !this.isLineCommentedAtBufferRow(bufferRow - 1);
    };

    LanguageMode.prototype.isLineCommentedAtBufferRow = function(bufferRow) {
      if (!((0 <= bufferRow && bufferRow <= this.editor.getLastBufferRow()))) {
        return false;
      }
      return this.editor.displayBuffer.tokenizedBuffer.lineForScreenRow(bufferRow).isComment();
    };

    LanguageMode.prototype.rowRangeForParagraphAtBufferRow = function(bufferRow) {
      var endRow, firstRow, isOriginalRowComment, lastRow, range, startRow, _ref1, _ref2;
      if (!/\w/.test(this.editor.lineForBufferRow(bufferRow))) {
        return;
      }
      if (this.isLineCommentedAtBufferRow(bufferRow)) {
        isOriginalRowComment = true;
        range = this.rowRangeForCommentAtBufferRow(bufferRow);
        _ref1 = range || [bufferRow, bufferRow], firstRow = _ref1[0], lastRow = _ref1[1];
      } else {
        isOriginalRowComment = false;
        _ref2 = [0, this.editor.getLastBufferRow() - 1], firstRow = _ref2[0], lastRow = _ref2[1];
      }
      startRow = bufferRow;
      while (startRow > firstRow) {
        if (this.isLineCommentedAtBufferRow(startRow - 1) !== isOriginalRowComment) {
          break;
        }
        if (!/\w/.test(this.editor.lineForBufferRow(startRow - 1))) {
          break;
        }
        startRow--;
      }
      endRow = bufferRow;
      lastRow = this.editor.getLastBufferRow();
      while (endRow < lastRow) {
        if (this.isLineCommentedAtBufferRow(endRow + 1) !== isOriginalRowComment) {
          break;
        }
        if (!/\w/.test(this.editor.lineForBufferRow(endRow + 1))) {
          break;
        }
        endRow++;
      }
      return new Range([startRow, 0], [endRow, this.editor.lineLengthForBufferRow(endRow)]);
    };

    LanguageMode.prototype.suggestedIndentForBufferRow = function(bufferRow) {
      var currentIndentLevel, currentLine, decreaseIndentRegex, desiredIndentLevel, increaseIndentRegex, precedingLine, precedingRow, scopes;
      currentIndentLevel = this.editor.indentationForBufferRow(bufferRow);
      scopes = this.editor.scopesForBufferPosition([bufferRow, 0]);
      if (!(increaseIndentRegex = this.increaseIndentRegexForScopes(scopes))) {
        return currentIndentLevel;
      }
      currentLine = this.buffer.lineForRow(bufferRow);
      precedingRow = bufferRow > 0 ? bufferRow - 1 : null;
      if (precedingRow == null) {
        return currentIndentLevel;
      }
      precedingLine = this.buffer.lineForRow(precedingRow);
      desiredIndentLevel = this.editor.indentationForBufferRow(precedingRow);
      if (increaseIndentRegex.test(precedingLine) && !this.editor.isBufferRowCommented(precedingRow)) {
        desiredIndentLevel += 1;
      }
      if (!(decreaseIndentRegex = this.decreaseIndentRegexForScopes(scopes))) {
        return desiredIndentLevel;
      }
      if (decreaseIndentRegex.test(currentLine)) {
        desiredIndentLevel -= 1;
      }
      return Math.max(desiredIndentLevel, 0);
    };

    LanguageMode.prototype.minIndentLevelForRowRange = function(startRow, endRow) {
      var indents, row;
      indents = (function() {
        var _i, _results;
        _results = [];
        for (row = _i = startRow; startRow <= endRow ? _i <= endRow : _i >= endRow; row = startRow <= endRow ? ++_i : --_i) {
          if (!this.editor.isBufferRowBlank(row)) {
            _results.push(this.editor.indentationForBufferRow(row));
          }
        }
        return _results;
      }).call(this);
      if (!indents.length) {
        indents = [0];
      }
      return Math.min.apply(Math, indents);
    };

    LanguageMode.prototype.autoIndentBufferRows = function(startRow, endRow) {
      var row, _i, _results;
      _results = [];
      for (row = _i = startRow; startRow <= endRow ? _i <= endRow : _i >= endRow; row = startRow <= endRow ? ++_i : --_i) {
        _results.push(this.autoIndentBufferRow(row));
      }
      return _results;
    };

    LanguageMode.prototype.autoIndentBufferRow = function(bufferRow) {
      var indentLevel;
      indentLevel = this.suggestedIndentForBufferRow(bufferRow);
      return this.editor.setIndentationForBufferRow(bufferRow, indentLevel);
    };

    LanguageMode.prototype.autoDecreaseIndentForBufferRow = function(bufferRow) {
      var currentIndentLevel, decreaseIndentRegex, desiredIndentLevel, increaseIndentRegex, line, precedingLine, precedingRow, scopes;
      scopes = this.editor.scopesForBufferPosition([bufferRow, 0]);
      increaseIndentRegex = this.increaseIndentRegexForScopes(scopes);
      decreaseIndentRegex = this.decreaseIndentRegexForScopes(scopes);
      if (!(increaseIndentRegex && decreaseIndentRegex)) {
        return;
      }
      line = this.buffer.lineForRow(bufferRow);
      if (!decreaseIndentRegex.test(line)) {
        return;
      }
      currentIndentLevel = this.editor.indentationForBufferRow(bufferRow);
      if (currentIndentLevel === 0) {
        return;
      }
      precedingRow = this.buffer.previousNonBlankRow(bufferRow);
      if (precedingRow == null) {
        return;
      }
      precedingLine = this.buffer.lineForRow(precedingRow);
      desiredIndentLevel = this.editor.indentationForBufferRow(precedingRow);
      if (!increaseIndentRegex.test(precedingLine)) {
        desiredIndentLevel -= 1;
      }
      if (desiredIndentLevel >= 0 && desiredIndentLevel < currentIndentLevel) {
        return this.editor.setIndentationForBufferRow(bufferRow, desiredIndentLevel);
      }
    };

    LanguageMode.prototype.getRegexForProperty = function(scopes, property) {
      var pattern;
      if (pattern = atom.syntax.getProperty(scopes, property)) {
        return new OnigRegExp(pattern);
      }
    };

    LanguageMode.prototype.increaseIndentRegexForScopes = function(scopes) {
      return this.getRegexForProperty(scopes, 'editor.increaseIndentPattern');
    };

    LanguageMode.prototype.decreaseIndentRegexForScopes = function(scopes) {
      return this.getRegexForProperty(scopes, 'editor.decreaseIndentPattern');
    };

    LanguageMode.prototype.foldEndRegexForScopes = function(scopes) {
      return this.getRegexForProperty(scopes, 'editor.foldEndPattern');
    };

    return LanguageMode;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/language-mode.js.map
