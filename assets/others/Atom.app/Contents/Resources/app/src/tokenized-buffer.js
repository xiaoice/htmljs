(function() {
  var Model, Point, Range, Serializable, Token, TokenizedBuffer, TokenizedLine, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('underscore-plus');

  Model = require('theorist').Model;

  _ref = require('text-buffer'), Point = _ref.Point, Range = _ref.Range;

  Serializable = require('serializable');

  TokenizedLine = require('./tokenized-line');

  Token = require('./token');

  module.exports = TokenizedBuffer = (function(_super) {
    __extends(TokenizedBuffer, _super);

    Serializable.includeInto(TokenizedBuffer);

    TokenizedBuffer.property('tabLength');

    TokenizedBuffer.prototype.grammar = null;

    TokenizedBuffer.prototype.currentGrammarScore = null;

    TokenizedBuffer.prototype.buffer = null;

    TokenizedBuffer.prototype.tokenizedLines = null;

    TokenizedBuffer.prototype.chunkSize = 50;

    TokenizedBuffer.prototype.invalidRows = null;

    TokenizedBuffer.prototype.visible = false;

    function TokenizedBuffer(_arg) {
      var _ref1;
      this.buffer = _arg.buffer, this.tabLength = _arg.tabLength;
      if (this.tabLength == null) {
        this.tabLength = (_ref1 = atom.config.get('editor.tabLength')) != null ? _ref1 : 2;
      }
      this.subscribe(atom.syntax, 'grammar-added grammar-updated', (function(_this) {
        return function(grammar) {
          var newScore;
          if (grammar.injectionSelector != null) {
            if (_this.hasTokenForSelector(grammar.injectionSelector)) {
              return _this.resetTokenizedLines();
            }
          } else {
            newScore = grammar.getScore(_this.buffer.getPath(), _this.buffer.getText());
            if (newScore > _this.currentGrammarScore) {
              return _this.setGrammar(grammar, newScore);
            }
          }
        };
      })(this));
      this.on('grammar-changed grammar-updated', (function(_this) {
        return function() {
          return _this.resetTokenizedLines();
        };
      })(this));
      this.subscribe(this.buffer, "changed", (function(_this) {
        return function(e) {
          return _this.handleBufferChange(e);
        };
      })(this));
      this.subscribe(this.buffer, "path-changed", (function(_this) {
        return function() {
          return _this.bufferPath = _this.buffer.getPath();
        };
      })(this));
      this.subscribe(this.$tabLength.changes, (function(_this) {
        return function(tabLength) {
          var lastRow;
          lastRow = _this.buffer.getLastRow();
          _this.tokenizedLines = _this.buildPlaceholderTokenizedLinesForRows(0, lastRow);
          _this.invalidateRow(0);
          return _this.emit("changed", {
            start: 0,
            end: lastRow,
            delta: 0
          });
        };
      })(this));
      this.subscribe(atom.config.observe('editor.tabLength', {
        callNow: false
      }, (function(_this) {
        return function() {
          return _this.setTabLength(atom.config.getPositiveInt('editor.tabLength'));
        };
      })(this)));
      this.reloadGrammar();
    }

    TokenizedBuffer.prototype.serializeParams = function() {
      return {
        bufferPath: this.buffer.getPath(),
        tabLength: this.tabLength
      };
    };

    TokenizedBuffer.prototype.deserializeParams = function(params) {
      params.buffer = atom.project.bufferForPathSync(params.bufferPath);
      return params;
    };

    TokenizedBuffer.prototype.setGrammar = function(grammar, score) {
      if (grammar === this.grammar) {
        return;
      }
      if (this.grammar) {
        this.unsubscribe(this.grammar);
      }
      this.grammar = grammar;
      this.currentGrammarScore = score != null ? score : grammar.getScore(this.buffer.getPath(), this.buffer.getText());
      this.subscribe(this.grammar, 'grammar-updated', (function(_this) {
        return function() {
          return _this.resetTokenizedLines();
        };
      })(this));
      return this.emit('grammar-changed', grammar);
    };

    TokenizedBuffer.prototype.reloadGrammar = function() {
      var grammar;
      if (grammar = atom.syntax.selectGrammar(this.buffer.getPath(), this.buffer.getText())) {
        return this.setGrammar(grammar);
      } else {
        throw new Error("No grammar found for path: " + path);
      }
    };

    TokenizedBuffer.prototype.hasTokenForSelector = function(selector) {
      var token, tokens, _i, _j, _len, _len1, _ref1;
      _ref1 = this.tokenizedLines;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        tokens = _ref1[_i].tokens;
        for (_j = 0, _len1 = tokens.length; _j < _len1; _j++) {
          token = tokens[_j];
          if (selector.matches(token.scopes)) {
            return true;
          }
        }
      }
      return false;
    };

    TokenizedBuffer.prototype.resetTokenizedLines = function() {
      this.tokenizedLines = this.buildPlaceholderTokenizedLinesForRows(0, this.buffer.getLastRow());
      this.invalidRows = [];
      return this.invalidateRow(0);
    };

    TokenizedBuffer.prototype.setVisible = function(visible) {
      this.visible = visible;
      if (this.visible) {
        return this.tokenizeInBackground();
      }
    };

    TokenizedBuffer.prototype.getTabLength = function() {
      return this.tabLength;
    };

    TokenizedBuffer.prototype.setTabLength = function(tabLength) {
      this.tabLength = tabLength;
    };

    TokenizedBuffer.prototype.tokenizeInBackground = function() {
      if (!this.visible || this.pendingChunk || !this.isAlive()) {
        return;
      }
      this.pendingChunk = true;
      return _.defer((function(_this) {
        return function() {
          _this.pendingChunk = false;
          if (_this.isAlive() && _this.buffer.isAlive()) {
            return _this.tokenizeNextChunk();
          }
        };
      })(this));
    };

    TokenizedBuffer.prototype.tokenizeNextChunk = function() {
      var filledRegion, invalidRow, lastRow, previousStack, row, rowsRemaining;
      rowsRemaining = this.chunkSize;
      while ((this.firstInvalidRow() != null) && rowsRemaining > 0) {
        invalidRow = this.invalidRows.shift();
        lastRow = this.getLastRow();
        if (invalidRow > lastRow) {
          continue;
        }
        row = invalidRow;
        while (true) {
          previousStack = this.stackForRow(row);
          this.tokenizedLines[row] = this.buildTokenizedTokenizedLineForRow(row, this.stackForRow(row - 1));
          if (--rowsRemaining === 0) {
            filledRegion = false;
            break;
          }
          if (row === lastRow || _.isEqual(this.stackForRow(row), previousStack)) {
            filledRegion = true;
            break;
          }
          row++;
        }
        this.validateRow(row);
        if (!filledRegion) {
          this.invalidateRow(row + 1);
        }
        this.emit("changed", {
          start: invalidRow,
          end: row,
          delta: 0
        });
      }
      if (this.firstInvalidRow() != null) {
        return this.tokenizeInBackground();
      }
    };

    TokenizedBuffer.prototype.firstInvalidRow = function() {
      return this.invalidRows[0];
    };

    TokenizedBuffer.prototype.validateRow = function(row) {
      var _results;
      _results = [];
      while (this.invalidRows[0] <= row) {
        _results.push(this.invalidRows.shift());
      }
      return _results;
    };

    TokenizedBuffer.prototype.invalidateRow = function(row) {
      this.invalidRows.push(row);
      this.invalidRows.sort(function(a, b) {
        return a - b;
      });
      return this.tokenizeInBackground();
    };

    TokenizedBuffer.prototype.updateInvalidRows = function(start, end, delta) {
      return this.invalidRows = this.invalidRows.map(function(row) {
        if (row < start) {
          return row;
        } else if ((start <= row && row <= end)) {
          return end + delta + 1;
        } else if (row > end) {
          return row + delta;
        }
      });
    };

    TokenizedBuffer.prototype.handleBufferChange = function(e) {
      var delta, end, newEndStack, newRange, newTokenizedLines, oldRange, previousEndStack, start;
      oldRange = e.oldRange, newRange = e.newRange;
      start = oldRange.start.row;
      end = oldRange.end.row;
      delta = newRange.end.row - oldRange.end.row;
      this.updateInvalidRows(start, end, delta);
      previousEndStack = this.stackForRow(end);
      newTokenizedLines = this.buildTokenizedLinesForRows(start, end + delta, this.stackForRow(start - 1));
      _.spliceWithArray(this.tokenizedLines, start, end - start + 1, newTokenizedLines);
      newEndStack = this.stackForRow(end + delta);
      if (newEndStack && !_.isEqual(newEndStack, previousEndStack)) {
        this.invalidateRow(end + delta + 1);
      }
      return this.emit("changed", {
        start: start,
        end: end,
        delta: delta,
        bufferChange: e
      });
    };

    TokenizedBuffer.prototype.buildTokenizedLinesForRows = function(startRow, endRow, startingStack) {
      var row, ruleStack, screenLine, stopTokenizingAt, tokenizedLines;
      ruleStack = startingStack;
      stopTokenizingAt = startRow + this.chunkSize;
      tokenizedLines = (function() {
        var _i, _results;
        _results = [];
        for (row = _i = startRow; startRow <= endRow ? _i <= endRow : _i >= endRow; row = startRow <= endRow ? ++_i : --_i) {
          if ((ruleStack || row === 0) && row < stopTokenizingAt) {
            screenLine = this.buildTokenizedTokenizedLineForRow(row, ruleStack);
            ruleStack = screenLine.ruleStack;
          } else {
            screenLine = this.buildPlaceholderTokenizedLineForRow(row);
          }
          _results.push(screenLine);
        }
        return _results;
      }).call(this);
      if (endRow >= stopTokenizingAt) {
        this.invalidateRow(stopTokenizingAt);
        this.tokenizeInBackground();
      }
      return tokenizedLines;
    };

    TokenizedBuffer.prototype.buildPlaceholderTokenizedLinesForRows = function(startRow, endRow) {
      var row, _i, _results;
      _results = [];
      for (row = _i = startRow; startRow <= endRow ? _i <= endRow : _i >= endRow; row = startRow <= endRow ? ++_i : --_i) {
        _results.push(this.buildPlaceholderTokenizedLineForRow(row));
      }
      return _results;
    };

    TokenizedBuffer.prototype.buildPlaceholderTokenizedLineForRow = function(row) {
      var line, tabLength, tokens;
      line = this.buffer.lineForRow(row);
      tokens = [
        new Token({
          value: line,
          scopes: [this.grammar.scopeName]
        })
      ];
      tabLength = this.getTabLength();
      return new TokenizedLine({
        tokens: tokens,
        tabLength: tabLength
      });
    };

    TokenizedBuffer.prototype.buildTokenizedTokenizedLineForRow = function(row, ruleStack) {
      var line, lineEnding, tabLength, tokens, _ref1;
      line = this.buffer.lineForRow(row);
      lineEnding = this.buffer.lineEndingForRow(row);
      tabLength = this.getTabLength();
      _ref1 = this.grammar.tokenizeLine(line, ruleStack, row === 0), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      return new TokenizedLine({
        tokens: tokens,
        ruleStack: ruleStack,
        tabLength: tabLength,
        lineEnding: lineEnding
      });
    };

    TokenizedBuffer.prototype.lineForScreenRow = function(row) {
      return this.linesForScreenRows(row, row)[0];
    };

    TokenizedBuffer.prototype.linesForScreenRows = function(startRow, endRow) {
      return this.tokenizedLines.slice(startRow, +endRow + 1 || 9e9);
    };

    TokenizedBuffer.prototype.stackForRow = function(row) {
      var _ref1;
      return (_ref1 = this.tokenizedLines[row]) != null ? _ref1.ruleStack : void 0;
    };

    TokenizedBuffer.prototype.scopesForPosition = function(position) {
      return this.tokenForPosition(position).scopes;
    };

    TokenizedBuffer.prototype.tokenForPosition = function(position) {
      var column, row, _ref1;
      _ref1 = Point.fromObject(position), row = _ref1.row, column = _ref1.column;
      return this.tokenizedLines[row].tokenAtBufferColumn(column);
    };

    TokenizedBuffer.prototype.tokenStartPositionForPosition = function(position) {
      var column, row, _ref1;
      _ref1 = Point.fromObject(position), row = _ref1.row, column = _ref1.column;
      column = this.tokenizedLines[row].tokenStartColumnForBufferColumn(column);
      return new Point(row, column);
    };

    TokenizedBuffer.prototype.bufferRangeForScopeAtPosition = function(selector, position) {
      var endColumn, firstToken, index, lastToken, startColumn, startIndex, token, tokenizedLine, _i, _j, _ref1;
      position = Point.fromObject(position);
      tokenizedLine = this.tokenizedLines[position.row];
      startIndex = tokenizedLine.tokenIndexAtBufferColumn(position.column);
      for (index = _i = startIndex; startIndex <= 0 ? _i <= 0 : _i >= 0; index = startIndex <= 0 ? ++_i : --_i) {
        token = tokenizedLine.tokenAtIndex(index);
        if (!token.matchesScopeSelector(selector)) {
          break;
        }
        firstToken = token;
      }
      for (index = _j = startIndex, _ref1 = tokenizedLine.getTokenCount(); startIndex <= _ref1 ? _j < _ref1 : _j > _ref1; index = startIndex <= _ref1 ? ++_j : --_j) {
        token = tokenizedLine.tokenAtIndex(index);
        if (!token.matchesScopeSelector(selector)) {
          break;
        }
        lastToken = token;
      }
      if (!((firstToken != null) && (lastToken != null))) {
        return;
      }
      startColumn = tokenizedLine.bufferColumnForToken(firstToken);
      endColumn = tokenizedLine.bufferColumnForToken(lastToken) + lastToken.bufferDelta;
      return new Range([position.row, startColumn], [position.row, endColumn]);
    };

    TokenizedBuffer.prototype.iterateTokensInBufferRange = function(bufferRange, iterator) {
      var bufferColumn, bufferRow, end, keepLooping, start, startOfToken, stop, token, _i, _j, _len, _ref1, _ref2, _ref3;
      bufferRange = Range.fromObject(bufferRange);
      start = bufferRange.start, end = bufferRange.end;
      keepLooping = true;
      stop = function() {
        return keepLooping = false;
      };
      for (bufferRow = _i = _ref1 = start.row, _ref2 = end.row; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; bufferRow = _ref1 <= _ref2 ? ++_i : --_i) {
        bufferColumn = 0;
        _ref3 = this.tokenizedLines[bufferRow].tokens;
        for (_j = 0, _len = _ref3.length; _j < _len; _j++) {
          token = _ref3[_j];
          startOfToken = new Point(bufferRow, bufferColumn);
          if (bufferRange.containsPoint(startOfToken)) {
            iterator(token, startOfToken, {
              stop: stop
            });
          }
          if (!keepLooping) {
            return;
          }
          bufferColumn += token.bufferDelta;
        }
      }
    };

    TokenizedBuffer.prototype.backwardsIterateTokensInBufferRange = function(bufferRange, iterator) {
      var bufferColumn, bufferRow, end, keepLooping, start, startOfToken, stop, token, _i, _j, _len, _ref1, _ref2, _ref3;
      bufferRange = Range.fromObject(bufferRange);
      start = bufferRange.start, end = bufferRange.end;
      keepLooping = true;
      stop = function() {
        return keepLooping = false;
      };
      for (bufferRow = _i = _ref1 = end.row, _ref2 = start.row; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; bufferRow = _ref1 <= _ref2 ? ++_i : --_i) {
        bufferColumn = this.buffer.lineLengthForRow(bufferRow);
        _ref3 = (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })(Array, this.tokenizedLines[bufferRow].tokens, function(){}).reverse();
        for (_j = 0, _len = _ref3.length; _j < _len; _j++) {
          token = _ref3[_j];
          bufferColumn -= token.bufferDelta;
          startOfToken = new Point(bufferRow, bufferColumn);
          if (bufferRange.containsPoint(startOfToken)) {
            iterator(token, startOfToken, {
              stop: stop
            });
          }
          if (!keepLooping) {
            return;
          }
        }
      }
    };

    TokenizedBuffer.prototype.findOpeningBracket = function(startBufferPosition) {
      var depth, position, range;
      range = [[0, 0], startBufferPosition];
      position = null;
      depth = 0;
      this.backwardsIterateTokensInBufferRange(range, function(token, startPosition, _arg) {
        var stop;
        stop = _arg.stop;
        if (token.isBracket()) {
          if (token.value === '}') {
            return depth++;
          } else if (token.value === '{') {
            depth--;
            if (depth === 0) {
              position = startPosition;
              return stop();
            }
          }
        }
      });
      return position;
    };

    TokenizedBuffer.prototype.findClosingBracket = function(startBufferPosition) {
      var depth, position, range;
      range = [startBufferPosition, this.buffer.getEofPosition()];
      position = null;
      depth = 0;
      this.iterateTokensInBufferRange(range, function(token, startPosition, _arg) {
        var stop;
        stop = _arg.stop;
        if (token.isBracket()) {
          if (token.value === '{') {
            return depth++;
          } else if (token.value === '}') {
            depth--;
            if (depth === 0) {
              position = startPosition;
              return stop();
            }
          }
        }
      });
      return position;
    };

    TokenizedBuffer.prototype.getLastRow = function() {
      return this.buffer.getLastRow();
    };

    TokenizedBuffer.prototype.logLines = function(start, end) {
      var line, row, _i, _results;
      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = this.buffer.getLastRow();
      }
      _results = [];
      for (row = _i = start; start <= end ? _i <= end : _i >= end; row = start <= end ? ++_i : --_i) {
        line = this.lineForScreenRow(row).text;
        _results.push(console.log(row, line, line.length));
      }
      return _results;
    };

    return TokenizedBuffer;

  })(Model);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/tokenized-buffer.js.map
