(function() {
  var getCharacterCount, hasSurrogatePair, isHighSurrogate, isLowSurrogate, isSurrogatePair;

  isHighSurrogate = function(string, index) {
    var _ref;
    return (0xD800 <= (_ref = string.charCodeAt(index)) && _ref <= 0xDBFF);
  };

  isLowSurrogate = function(string, index) {
    var _ref;
    return (0xDC00 <= (_ref = string.charCodeAt(index)) && _ref <= 0xDFFF);
  };

  isSurrogatePair = function(string, index) {
    if (index == null) {
      index = 0;
    }
    return isHighSurrogate(string, index) && isLowSurrogate(string, index + 1);
  };

  getCharacterCount = function(string) {
    var count, index, _i, _ref;
    count = string.length;
    for (index = _i = 0, _ref = string.length; 0 <= _ref ? _i < _ref : _i > _ref; index = 0 <= _ref ? ++_i : --_i) {
      if (isSurrogatePair(string, index)) {
        count--;
      }
    }
    return count;
  };

  hasSurrogatePair = function(string) {
    return string.length !== getCharacterCount(string);
  };

  module.exports = {
    getCharacterCount: getCharacterCount,
    isSurrogatePair: isSurrogatePair,
    hasSurrogatePair: hasSurrogatePair
  };

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/text-utils.js.map
