(function() {
  var CharacterRegex, EscapeRegex, LeadingWhitespaceRegex, MaxTokenLength, StartCharacterRegex, StartDotRegex, Token, TrailingWhitespaceRegex, WhitespaceRegex, WhitespaceRegexesByTabLength, textUtils, _;

  _ = require('underscore-plus');

  textUtils = require('./text-utils');

  WhitespaceRegexesByTabLength = {};

  LeadingWhitespaceRegex = /^[ ]+/;

  TrailingWhitespaceRegex = /[ ]+$/;

  EscapeRegex = /[&"'<>]/g;

  CharacterRegex = /./g;

  StartCharacterRegex = /^./;

  StartDotRegex = /^\.?/;

  WhitespaceRegex = /\S/;

  MaxTokenLength = 20000;

  module.exports = Token = (function() {
    Token.prototype.value = null;

    Token.prototype.hasSurrogatePair = false;

    Token.prototype.scopes = null;

    Token.prototype.isAtomic = null;

    Token.prototype.isHardTab = null;

    function Token(_arg) {
      this.value = _arg.value, this.scopes = _arg.scopes, this.isAtomic = _arg.isAtomic, this.bufferDelta = _arg.bufferDelta, this.isHardTab = _arg.isHardTab;
      this.screenDelta = this.value.length;
      if (this.bufferDelta == null) {
        this.bufferDelta = this.screenDelta;
      }
      this.hasSurrogatePair = textUtils.hasSurrogatePair(this.value);
    }

    Token.prototype.isEqual = function(other) {
      return this.value === other.value && _.isEqual(this.scopes, other.scopes) && !!this.isAtomic === !!other.isAtomic;
    };

    Token.prototype.isBracket = function() {
      return /^meta\.brace\b/.test(_.last(this.scopes));
    };

    Token.prototype.splitAt = function(splitIndex) {
      var value1, value2;
      value1 = this.value.substring(0, splitIndex);
      value2 = this.value.substring(splitIndex);
      return [
        new Token({
          value: value1,
          scopes: this.scopes
        }), new Token({
          value: value2,
          scopes: this.scopes
        })
      ];
    };

    Token.prototype.whitespaceRegexForTabLength = function(tabLength) {
      return WhitespaceRegexesByTabLength[tabLength] != null ? WhitespaceRegexesByTabLength[tabLength] : WhitespaceRegexesByTabLength[tabLength] = new RegExp("([ ]{" + tabLength + "})|(\t)|([^\t]+)", "g");
    };

    Token.prototype.breakOutAtomicTokens = function(tabLength, breakOutLeadingWhitespace) {
      var fullMatch, hardTab, match, outputTokens, regex, softTab, token, value, _i, _len, _ref;
      if (this.hasSurrogatePair) {
        outputTokens = [];
        _ref = this.breakOutSurrogatePairs();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          token = _ref[_i];
          if (token.isAtomic) {
            outputTokens.push(token);
          } else {
            outputTokens.push.apply(outputTokens, token.breakOutAtomicTokens(tabLength, breakOutLeadingWhitespace));
          }
          if (breakOutLeadingWhitespace) {
            breakOutLeadingWhitespace = token.isOnlyWhitespace();
          }
        }
        return outputTokens;
      } else {
        if (this.isAtomic) {
          return [this];
        }
        if (breakOutLeadingWhitespace) {
          if (!/^[ ]|\t/.test(this.value)) {
            return [this];
          }
        } else {
          if (!/\t/.test(this.value)) {
            return [this];
          }
        }
        outputTokens = [];
        regex = this.whitespaceRegexForTabLength(tabLength);
        while (match = regex.exec(this.value)) {
          fullMatch = match[0], softTab = match[1], hardTab = match[2];
          if (softTab && breakOutLeadingWhitespace) {
            outputTokens.push(this.buildSoftTabToken(tabLength, false));
          } else if (hardTab) {
            breakOutLeadingWhitespace = false;
            outputTokens.push(this.buildHardTabToken(tabLength, true));
          } else {
            breakOutLeadingWhitespace = false;
            value = match[0];
            outputTokens.push(new Token({
              value: value,
              scopes: this.scopes
            }));
          }
        }
        return outputTokens;
      }
    };

    Token.prototype.breakOutSurrogatePairs = function() {
      var index, nonSurrogatePairStart, outputTokens;
      outputTokens = [];
      index = 0;
      nonSurrogatePairStart = 0;
      while (index < this.value.length) {
        if (textUtils.isSurrogatePair(this.value, index)) {
          if (nonSurrogatePairStart !== index) {
            outputTokens.push(new Token({
              value: this.value.slice(nonSurrogatePairStart, index),
              scopes: this.scopes
            }));
          }
          outputTokens.push(this.buildSurrogatePairToken(this.value, index));
          index += 2;
          nonSurrogatePairStart = index;
        } else {
          index++;
        }
      }
      if (nonSurrogatePairStart !== index) {
        outputTokens.push(new Token({
          value: this.value.slice(nonSurrogatePairStart, index),
          scopes: this.scopes
        }));
      }
      return outputTokens;
    };

    Token.prototype.buildSurrogatePairToken = function(value, index) {
      return new Token({
        value: value.slice(index, +(index + 1) + 1 || 9e9),
        scopes: this.scopes,
        isAtomic: true
      });
    };

    Token.prototype.buildHardTabToken = function(tabLength) {
      return this.buildTabToken(tabLength, true);
    };

    Token.prototype.buildSoftTabToken = function(tabLength) {
      return this.buildTabToken(tabLength, false);
    };

    Token.prototype.buildTabToken = function(tabLength, isHardTab) {
      return new Token({
        value: _.multiplyString(" ", tabLength),
        scopes: this.scopes,
        bufferDelta: isHardTab ? 1 : tabLength,
        isAtomic: true,
        isHardTab: isHardTab
      });
    };

    Token.prototype.isOnlyWhitespace = function() {
      return !WhitespaceRegex.test(this.value);
    };

    Token.prototype.matchesScopeSelector = function(selector) {
      var targetClasses;
      targetClasses = selector.replace(StartDotRegex, '').split('.');
      return _.any(this.scopes, function(scope) {
        var scopeClasses;
        scopeClasses = scope.split('.');
        return _.isSubset(targetClasses, scopeClasses);
      });
    };

    Token.prototype.getValueAsHtml = function(_arg) {
      var classes, endIndex, hasIndentGuide, hasLeadingWhitespace, hasTrailingWhitespace, html, invisibles, leadingHtml, match, startIndex, trailingHtml, value;
      invisibles = _arg.invisibles, hasLeadingWhitespace = _arg.hasLeadingWhitespace, hasTrailingWhitespace = _arg.hasTrailingWhitespace, hasIndentGuide = _arg.hasIndentGuide;
      if (invisibles == null) {
        invisibles = {};
      }
      if (this.isHardTab) {
        classes = 'hard-tab';
        if (hasIndentGuide) {
          classes += ' indent-guide';
        }
        if (invisibles.tab) {
          classes += ' invisible-character';
        }
        value = invisibles.tab ? this.value.replace(StartCharacterRegex, invisibles.tab) : this.value;
        html = "<span class='" + classes + "'>" + (this.escapeString(value)) + "</span>";
      } else {
        startIndex = 0;
        endIndex = this.value.length;
        leadingHtml = '';
        trailingHtml = '';
        if (hasLeadingWhitespace && (match = LeadingWhitespaceRegex.exec(this.value))) {
          classes = 'leading-whitespace';
          if (hasIndentGuide) {
            classes += ' indent-guide';
          }
          if (invisibles.space) {
            classes += ' invisible-character';
          }
          if (invisibles.space) {
            match[0] = match[0].replace(CharacterRegex, invisibles.space);
          }
          leadingHtml = "<span class='" + classes + "'>" + match[0] + "</span>";
          startIndex = match[0].length;
        }
        if (hasTrailingWhitespace && (match = TrailingWhitespaceRegex.exec(this.value))) {
          classes = 'trailing-whitespace';
          if (hasIndentGuide && !hasLeadingWhitespace) {
            classes += ' indent-guide';
          }
          if (invisibles.space) {
            classes += ' invisible-character';
          }
          if (invisibles.space) {
            match[0] = match[0].replace(CharacterRegex, invisibles.space);
          }
          trailingHtml = "<span class='" + classes + "'>" + match[0] + "</span>";
          endIndex = match.index;
        }
        html = leadingHtml;
        if (this.value.length > MaxTokenLength) {
          while (startIndex < endIndex) {
            html += "<span>" + this.escapeString(this.value, startIndex, startIndex + MaxTokenLength) + "</span>";
            startIndex += MaxTokenLength;
          }
        } else {
          html += this.escapeString(this.value, startIndex, endIndex);
        }
        html += trailingHtml;
      }
      return html;
    };

    Token.prototype.escapeString = function(str, startIndex, endIndex) {
      var strLength;
      strLength = str.length;
      if (startIndex == null) {
        startIndex = 0;
      }
      if (endIndex == null) {
        endIndex = strLength;
      }
      if (startIndex > 0 || endIndex < strLength) {
        str = str.slice(startIndex, endIndex);
      }
      return str.replace(EscapeRegex, this.escapeStringReplace);
    };

    Token.prototype.escapeStringReplace = function(match) {
      switch (match) {
        case '&':
          return '&amp;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        default:
          return match;
      }
    };

    return Token;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/token.js.map
