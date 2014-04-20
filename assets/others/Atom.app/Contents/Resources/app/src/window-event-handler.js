(function() {
  var $, Subscriber, WindowEventHandler, fs, ipc, shell, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  $ = require('./space-pen-extensions').$;

  _ = require('underscore-plus');

  ipc = require('ipc');

  shell = require('shell');

  Subscriber = require('emissary').Subscriber;

  fs = require('fs-plus');

  module.exports = WindowEventHandler = (function() {
    Subscriber.includeInto(WindowEventHandler);

    function WindowEventHandler() {
      this.focusPrevious = __bind(this.focusPrevious, this);
      this.focusNext = __bind(this.focusNext, this);
      this.openLink = __bind(this.openLink, this);
      this.reloadRequested = false;
      this.subscribe(ipc, 'command', function() {
        var activeElement, args, command, _ref;
        command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        activeElement = document.activeElement;
        if (activeElement === document.body && (atom.workspaceView != null)) {
          activeElement = atom.workspaceView;
        }
        return (_ref = $(activeElement)).trigger.apply(_ref, [command].concat(__slice.call(args)));
      });
      this.subscribe(ipc, 'context-command', function() {
        var args, command, _ref;
        command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        return (_ref = $(atom.contextMenu.activeElement)).trigger.apply(_ref, [command].concat(__slice.call(args)));
      });
      this.subscribe($(window), 'focus', function() {
        return $("body").removeClass('is-blurred');
      });
      this.subscribe($(window), 'blur', function() {
        return $("body").addClass('is-blurred');
      });
      this.subscribe($(window), 'window:open-path', function(event, _arg) {
        var initialLine, pathToOpen, _ref;
        pathToOpen = _arg.pathToOpen, initialLine = _arg.initialLine;
        if (!fs.isDirectorySync(pathToOpen)) {
          return (_ref = atom.workspaceView) != null ? _ref.open(pathToOpen, {
            initialLine: initialLine
          }) : void 0;
        }
      });
      this.subscribe($(window), 'beforeunload', (function(_this) {
        return function() {
          var confirmed, _ref;
          confirmed = (_ref = atom.workspaceView) != null ? _ref.confirmClose() : void 0;
          if (confirmed && !_this.reloadRequested && atom.getCurrentWindow().isWebViewFocused()) {
            atom.hide();
          }
          _this.reloadRequested = false;
          return confirmed;
        };
      })(this));
      this.subscribe($(window), 'unload', function() {
        return atom.storeWindowDimensions();
      });
      this.subscribeToCommand($(window), 'window:toggle-full-screen', (function(_this) {
        return function() {
          return atom.toggleFullScreen();
        };
      })(this));
      this.subscribeToCommand($(window), 'window:close', (function(_this) {
        return function() {
          return atom.close();
        };
      })(this));
      this.subscribeToCommand($(window), 'window:reload', (function(_this) {
        return function() {
          _this.reloadRequested = true;
          return atom.reload();
        };
      })(this));
      this.subscribeToCommand($(window), 'window:toggle-dev-tools', (function(_this) {
        return function() {
          return atom.toggleDevTools();
        };
      })(this));
      this.subscribeToCommand($(document), 'core:focus-next', this.focusNext);
      this.subscribeToCommand($(document), 'core:focus-previous', this.focusPrevious);
      this.subscribe($(document), 'keydown', function(event) {
        return atom.keymap.handleKeyEvent(event);
      });
      this.subscribe($(document), 'drop', function(e) {
        var pathsToOpen;
        e.preventDefault();
        e.stopPropagation();
        pathsToOpen = _.pluck(e.originalEvent.dataTransfer.files, 'path');
        if (pathsToOpen.length > 0) {
          return atom.open({
            pathsToOpen: pathsToOpen
          });
        }
      });
      this.subscribe($(document), 'dragover', function(e) {
        e.preventDefault();
        return e.stopPropagation();
      });
      this.subscribe($(document), 'click', 'a', this.openLink);
      this.subscribe($(document), 'contextmenu', function(e) {
        e.preventDefault();
        return atom.contextMenu.showForEvent(e);
      });
      this.handleNativeKeybindings();
    }

    WindowEventHandler.prototype.handleNativeKeybindings = function() {
      var bindCommandToAction, menu;
      menu = null;
      bindCommandToAction = (function(_this) {
        return function(command, action) {
          return _this.subscribe($(document), command, function(event) {
            if (event.target.webkitMatchesSelector('.native-key-bindings')) {
              if (menu == null) {
                menu = require('remote').require('menu');
              }
              menu.sendActionToFirstResponder(action);
            }
            return true;
          });
        };
      })(this);
      bindCommandToAction('core:copy', 'copy:');
      bindCommandToAction('core:paste', 'paste:');
      bindCommandToAction('core:undo', 'undo:');
      bindCommandToAction('core:redo', 'redo:');
      return bindCommandToAction('core:select-all', 'selectAll:');
    };

    WindowEventHandler.prototype.openLink = function(event) {
      var location;
      location = $(event.target).attr('href');
      if (location && location[0] !== '#' && /^https?:\/\//.test(location)) {
        shell.openExternal(location);
      }
      return false;
    };

    WindowEventHandler.prototype.eachTabIndexedElement = function(callback) {
      var element, tabIndex, _i, _len, _ref, _results;
      _ref = $('[tabindex]');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        element = _ref[_i];
        element = $(element);
        if (element.isDisabled()) {
          continue;
        }
        tabIndex = parseInt(element.attr('tabindex'));
        if (!(tabIndex >= 0)) {
          continue;
        }
        _results.push(callback(element, tabIndex));
      }
      return _results;
    };

    WindowEventHandler.prototype.focusNext = function() {
      var focusedTabIndex, lowestElement, lowestTabIndex, nextElement, nextTabIndex;
      focusedTabIndex = parseInt($(':focus').attr('tabindex')) || -Infinity;
      nextElement = null;
      nextTabIndex = Infinity;
      lowestElement = null;
      lowestTabIndex = Infinity;
      this.eachTabIndexedElement(function(element, tabIndex) {
        if (tabIndex < lowestTabIndex) {
          lowestTabIndex = tabIndex;
          lowestElement = element;
        }
        if ((focusedTabIndex < tabIndex && tabIndex < nextTabIndex)) {
          nextTabIndex = tabIndex;
          return nextElement = element;
        }
      });
      if (nextElement != null) {
        return nextElement.focus();
      } else if (lowestElement != null) {
        return lowestElement.focus();
      }
    };

    WindowEventHandler.prototype.focusPrevious = function() {
      var focusedTabIndex, highestElement, highestTabIndex, previousElement, previousTabIndex;
      focusedTabIndex = parseInt($(':focus').attr('tabindex')) || Infinity;
      previousElement = null;
      previousTabIndex = -Infinity;
      highestElement = null;
      highestTabIndex = -Infinity;
      this.eachTabIndexedElement(function(element, tabIndex) {
        if (tabIndex > highestTabIndex) {
          highestTabIndex = tabIndex;
          highestElement = element;
        }
        if ((focusedTabIndex > tabIndex && tabIndex > previousTabIndex)) {
          previousTabIndex = tabIndex;
          return previousElement = element;
        }
      });
      if (previousElement != null) {
        return previousElement.focus();
      } else if (highestElement != null) {
        return highestElement.focus();
      }
    };

    return WindowEventHandler;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/window-event-handler.js.map
