(function() {
  var DisplayBufferMarker, Emitter, Range, Subscriber, _, _ref;

  Range = require('text-buffer').Range;

  _ = require('underscore-plus');

  _ref = require('emissary'), Emitter = _ref.Emitter, Subscriber = _ref.Subscriber;

  module.exports = DisplayBufferMarker = (function() {
    Emitter.includeInto(DisplayBufferMarker);

    Subscriber.includeInto(DisplayBufferMarker);

    DisplayBufferMarker.prototype.bufferMarkerSubscription = null;

    DisplayBufferMarker.prototype.oldHeadBufferPosition = null;

    DisplayBufferMarker.prototype.oldHeadScreenPosition = null;

    DisplayBufferMarker.prototype.oldTailBufferPosition = null;

    DisplayBufferMarker.prototype.oldTailScreenPosition = null;

    DisplayBufferMarker.prototype.wasValid = true;

    function DisplayBufferMarker(_arg) {
      this.bufferMarker = _arg.bufferMarker, this.displayBuffer = _arg.displayBuffer;
      this.id = this.bufferMarker.id;
      this.oldHeadBufferPosition = this.getHeadBufferPosition();
      this.oldHeadScreenPosition = this.getHeadScreenPosition();
      this.oldTailBufferPosition = this.getTailBufferPosition();
      this.oldTailScreenPosition = this.getTailScreenPosition();
      this.wasValid = this.isValid();
      this.subscribe(this.bufferMarker, 'destroyed', (function(_this) {
        return function() {
          return _this.destroyed();
        };
      })(this));
      this.subscribe(this.bufferMarker, 'changed', (function(_this) {
        return function(event) {
          return _this.notifyObservers(event);
        };
      })(this));
    }

    DisplayBufferMarker.prototype.copy = function(attributes) {
      return this.displayBuffer.getMarker(this.bufferMarker.copy(attributes).id);
    };

    DisplayBufferMarker.prototype.getScreenRange = function() {
      return this.displayBuffer.screenRangeForBufferRange(this.getBufferRange(), {
        wrapAtSoftNewlines: true
      });
    };

    DisplayBufferMarker.prototype.setScreenRange = function(screenRange, options) {
      return this.setBufferRange(this.displayBuffer.bufferRangeForScreenRange(screenRange), options);
    };

    DisplayBufferMarker.prototype.getBufferRange = function() {
      return this.bufferMarker.getRange();
    };

    DisplayBufferMarker.prototype.setBufferRange = function(bufferRange, options) {
      return this.bufferMarker.setRange(bufferRange, options);
    };

    DisplayBufferMarker.prototype.getHeadScreenPosition = function() {
      return this.displayBuffer.screenPositionForBufferPosition(this.getHeadBufferPosition(), {
        wrapAtSoftNewlines: true
      });
    };

    DisplayBufferMarker.prototype.setHeadScreenPosition = function(screenPosition, options) {
      screenPosition = this.displayBuffer.clipScreenPosition(screenPosition, options);
      return this.setHeadBufferPosition(this.displayBuffer.bufferPositionForScreenPosition(screenPosition, options));
    };

    DisplayBufferMarker.prototype.getHeadBufferPosition = function() {
      return this.bufferMarker.getHeadPosition();
    };

    DisplayBufferMarker.prototype.setHeadBufferPosition = function(bufferPosition) {
      return this.bufferMarker.setHeadPosition(bufferPosition);
    };

    DisplayBufferMarker.prototype.getTailScreenPosition = function() {
      return this.displayBuffer.screenPositionForBufferPosition(this.getTailBufferPosition(), {
        wrapAtSoftNewlines: true
      });
    };

    DisplayBufferMarker.prototype.setTailScreenPosition = function(screenPosition, options) {
      screenPosition = this.displayBuffer.clipScreenPosition(screenPosition, options);
      return this.setTailBufferPosition(this.displayBuffer.bufferPositionForScreenPosition(screenPosition, options));
    };

    DisplayBufferMarker.prototype.getTailBufferPosition = function() {
      return this.bufferMarker.getTailPosition();
    };

    DisplayBufferMarker.prototype.setTailBufferPosition = function(bufferPosition) {
      return this.bufferMarker.setTailPosition(bufferPosition);
    };

    DisplayBufferMarker.prototype.plantTail = function() {
      return this.bufferMarker.plantTail();
    };

    DisplayBufferMarker.prototype.clearTail = function() {
      return this.bufferMarker.clearTail();
    };

    DisplayBufferMarker.prototype.hasTail = function() {
      return this.bufferMarker.hasTail();
    };

    DisplayBufferMarker.prototype.isReversed = function() {
      return this.bufferMarker.isReversed();
    };

    DisplayBufferMarker.prototype.isValid = function() {
      return this.bufferMarker.isValid();
    };

    DisplayBufferMarker.prototype.isDestroyed = function() {
      return this.bufferMarker.isDestroyed();
    };

    DisplayBufferMarker.prototype.getAttributes = function() {
      return this.bufferMarker.getAttributes();
    };

    DisplayBufferMarker.prototype.setAttributes = function(attributes) {
      return this.bufferMarker.setAttributes(attributes);
    };

    DisplayBufferMarker.prototype.matchesAttributes = function(attributes) {
      attributes = this.displayBuffer.translateToBufferMarkerAttributes(attributes);
      return this.bufferMarker.matchesAttributes(attributes);
    };

    DisplayBufferMarker.prototype.destroy = function() {
      this.bufferMarker.destroy();
      return this.unsubscribe();
    };

    DisplayBufferMarker.prototype.isEqual = function(other) {
      if (!(other instanceof this.constructor)) {
        return false;
      }
      return this.bufferMarker.isEqual(other.bufferMarker);
    };

    DisplayBufferMarker.prototype.compare = function(other) {
      return this.bufferMarker.compare(other.bufferMarker);
    };

    DisplayBufferMarker.prototype.inspect = function() {
      return "DisplayBufferMarker(id: " + this.id + ", bufferRange: " + (this.getBufferRange()) + ")";
    };

    DisplayBufferMarker.prototype.destroyed = function() {
      delete this.displayBuffer.markers[this.id];
      return this.emit('destroyed');
    };

    DisplayBufferMarker.prototype.notifyObservers = function(_arg) {
      var isValid, newHeadBufferPosition, newHeadScreenPosition, newTailBufferPosition, newTailScreenPosition, textChanged;
      textChanged = _arg.textChanged;
      if (textChanged == null) {
        textChanged = false;
      }
      newHeadBufferPosition = this.getHeadBufferPosition();
      newHeadScreenPosition = this.getHeadScreenPosition();
      newTailBufferPosition = this.getTailBufferPosition();
      newTailScreenPosition = this.getTailScreenPosition();
      isValid = this.isValid();
      if (_.isEqual(isValid, this.wasValid) && _.isEqual(newHeadBufferPosition, this.oldHeadBufferPosition) && _.isEqual(newHeadScreenPosition, this.oldHeadScreenPosition) && _.isEqual(newTailBufferPosition, this.oldTailBufferPosition) && _.isEqual(newTailScreenPosition, this.oldTailScreenPosition)) {
        return;
      }
      this.emit('changed', {
        oldHeadScreenPosition: this.oldHeadScreenPosition,
        newHeadScreenPosition: newHeadScreenPosition,
        oldTailScreenPosition: this.oldTailScreenPosition,
        newTailScreenPosition: newTailScreenPosition,
        oldHeadBufferPosition: this.oldHeadBufferPosition,
        newHeadBufferPosition: newHeadBufferPosition,
        oldTailBufferPosition: this.oldTailBufferPosition,
        newTailBufferPosition: newTailBufferPosition,
        textChanged: textChanged,
        isValid: isValid
      });
      this.oldHeadBufferPosition = newHeadBufferPosition;
      this.oldHeadScreenPosition = newHeadScreenPosition;
      this.oldTailBufferPosition = newTailBufferPosition;
      this.oldTailScreenPosition = newTailScreenPosition;
      return this.wasValid = isValid;
    };

    return DisplayBufferMarker;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/display-buffer-marker.js.map
