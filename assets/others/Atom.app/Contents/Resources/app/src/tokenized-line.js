(function() {
  var TokenizedLine, _;

  _ = require('underscore-plus');

  module.exports = TokenizedLine = (function() {
    function TokenizedLine(_arg) {
      var tabLength, tokens;
      tokens = _arg.tokens, this.lineEnding = _arg.lineEnding, this.ruleStack = _arg.ruleStack, this.startBufferColumn = _arg.startBufferColumn, this.fold = _arg.fold, tabLength = _arg.tabLength;
      this.tokens = this.breakOutAtomicTokens(tokens, tabLength);
      if (this.startBufferColumn == null) {
        this.startBufferColumn = 0;
      }
      this.text = _.pluck(this.tokens, 'value').join('');
    }

    TokenizedLine.prototype.copy = function() {
      return new TokenizedLine({
        tokens: this.tokens,
        lineEnding: this.lineEnding,
        ruleStack: this.ruleStack,
        startBufferColumn: this.startBufferColumn,
        fold: this.fold
      });
    };

    TokenizedLine.prototype.clipScreenColumn = function(column, options) {
      var skipAtomicTokens, token, tokenStartColumn, _i, _len, _ref;
      if (options == null) {
        options = {};
      }
      if (this.tokens.length === 0) {
        return 0;
      }
      skipAtomicTokens = options.skipAtomicTokens;
      column = Math.min(column, this.getMaxScreenColumn());
      tokenStartColumn = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (tokenStartColumn + token.screenDelta > column) {
          break;
        }
        tokenStartColumn += token.screenDelta;
      }
      if (token.isAtomic && tokenStartColumn < column) {
        if (skipAtomicTokens) {
          return tokenStartColumn + token.screenDelta;
        } else {
          return tokenStartColumn;
        }
      } else {
        return column;
      }
    };

    TokenizedLine.prototype.screenColumnForBufferColumn = function(bufferColumn, options) {
      var currentBufferColumn, screenColumn, token, _i, _len, _ref;
      bufferColumn = bufferColumn - this.startBufferColumn;
      screenColumn = 0;
      currentBufferColumn = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (currentBufferColumn > bufferColumn) {
          break;
        }
        screenColumn += token.screenDelta;
        currentBufferColumn += token.bufferDelta;
      }
      return this.clipScreenColumn(screenColumn + (bufferColumn - currentBufferColumn));
    };

    TokenizedLine.prototype.bufferColumnForScreenColumn = function(screenColumn, options) {
      var bufferColumn, currentScreenColumn, token, _i, _len, _ref;
      bufferColumn = this.startBufferColumn;
      currentScreenColumn = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (currentScreenColumn + token.screenDelta > screenColumn) {
          break;
        }
        bufferColumn += token.bufferDelta;
        currentScreenColumn += token.screenDelta;
      }
      return bufferColumn + (screenColumn - currentScreenColumn);
    };

    TokenizedLine.prototype.getMaxScreenColumn = function() {
      if (this.fold) {
        return 0;
      } else {
        return this.text.length;
      }
    };

    TokenizedLine.prototype.getMaxBufferColumn = function() {
      return this.startBufferColumn + this.getMaxScreenColumn();
    };

    TokenizedLine.prototype.softWrapAt = function(column) {
      var leftFragment, leftTextLength, leftTokens, nextToken, rightFragment, rightTokens, _ref;
      if (column === 0) {
        return [new TokenizedLine([], '', [0, 0], [0, 0]), this];
      }
      rightTokens = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, this.tokens, function(){});
      leftTokens = [];
      leftTextLength = 0;
      while (leftTextLength < column) {
        if (leftTextLength + rightTokens[0].value.length > column) {
          [].splice.apply(rightTokens, [0, 1].concat(_ref = rightTokens[0].splitAt(column - leftTextLength))), _ref;
        }
        nextToken = rightTokens.shift();
        leftTextLength += nextToken.value.length;
        leftTokens.push(nextToken);
      }
      leftFragment = new TokenizedLine({
        tokens: leftTokens,
        startBufferColumn: this.startBufferColumn,
        ruleStack: this.ruleStack,
        lineEnding: null
      });
      rightFragment = new TokenizedLine({
        tokens: rightTokens,
        startBufferColumn: this.startBufferColumn + column,
        ruleStack: this.ruleStack,
        lineEnding: this.lineEnding
      });
      return [leftFragment, rightFragment];
    };

    TokenizedLine.prototype.isSoftWrapped = function() {
      return this.lineEnding === null;
    };

    TokenizedLine.prototype.tokenAtBufferColumn = function(bufferColumn) {
      return this.tokens[this.tokenIndexAtBufferColumn(bufferColumn)];
    };

    TokenizedLine.prototype.tokenIndexAtBufferColumn = function(bufferColumn) {
      var delta, index, token, _i, _len, _ref;
      delta = 0;
      _ref = this.tokens;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        token = _ref[index];
        delta += token.bufferDelta;
        if (delta > bufferColumn) {
          return index;
        }
      }
      return index - 1;
    };

    TokenizedLine.prototype.tokenStartColumnForBufferColumn = function(bufferColumn) {
      var delta, nextDelta, token, _i, _len, _ref;
      delta = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        nextDelta = delta + token.bufferDelta;
        if (nextDelta > bufferColumn) {
          break;
        }
        delta = nextDelta;
      }
      return delta;
    };

    TokenizedLine.prototype.breakOutAtomicTokens = function(inputTokens, tabLength) {
      var breakOutLeadingWhitespace, outputTokens, token, _i, _len;
      outputTokens = [];
      breakOutLeadingWhitespace = true;
      for (_i = 0, _len = inputTokens.length; _i < _len; _i++) {
        token = inputTokens[_i];
        outputTokens.push.apply(outputTokens, token.breakOutAtomicTokens(tabLength, breakOutLeadingWhitespace));
        if (breakOutLeadingWhitespace) {
          breakOutLeadingWhitespace = token.isOnlyWhitespace();
        }
      }
      return outputTokens;
    };

    TokenizedLine.prototype.isComment = function() {
      var scope, token, _i, _j, _len, _len1, _ref, _ref1;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (token.scopes.length === 1) {
          continue;
        }
        if (token.isOnlyWhitespace()) {
          continue;
        }
        _ref1 = token.scopes;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          scope = _ref1[_j];
          if (_.contains(scope.split('.'), 'comment')) {
            return true;
          }
        }
        break;
      }
      return false;
    };

    TokenizedLine.prototype.tokenAtIndex = function(index) {
      return this.tokens[index];
    };

    TokenizedLine.prototype.getTokenCount = function() {
      return this.tokens.length;
    };

    TokenizedLine.prototype.bufferColumnForToken = function(targetToken) {
      var column, token, _i, _len, _ref;
      column = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (token === targetToken) {
          return column;
        }
        column += token.bufferDelta;
      }
    };

    return TokenizedLine;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/tokenized-line.js.map
