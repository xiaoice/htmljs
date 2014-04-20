(function() {
  var $, $$$, CursorView, Editor, EditorView, GutterView, LongLineLength, MeasureRange, NoScope, Point, Range, SelectionView, TextBuffer, TextNodeFilter, View, fs, _, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('./space-pen-extensions'), View = _ref.View, $ = _ref.$, $$$ = _ref.$$$;

  GutterView = require('./gutter-view');

  _ref1 = require('text-buffer'), Point = _ref1.Point, Range = _ref1.Range;

  Editor = require('./editor');

  CursorView = require('./cursor-view');

  SelectionView = require('./selection-view');

  fs = require('fs-plus');

  _ = require('underscore-plus');

  TextBuffer = require('text-buffer');

  MeasureRange = document.createRange();

  TextNodeFilter = {
    acceptNode: function() {
      return NodeFilter.FILTER_ACCEPT;
    }
  };

  NoScope = ['no-scope'];

  LongLineLength = 1000;

  module.exports = EditorView = (function(_super) {
    __extends(EditorView, _super);

    function EditorView() {
      return EditorView.__super__.constructor.apply(this, arguments);
    }

    EditorView.characterWidthCache = {};

    EditorView.configDefaults = {
      fontFamily: '',
      fontSize: 16,
      showInvisibles: false,
      showIndentGuide: false,
      showLineNumbers: true,
      autoIndent: true,
      normalizeIndentOnPaste: true,
      nonWordCharacters: "./\\()\"':,.;<>~!@#$%^&*|+=[]{}`~?-",
      preferredLineLength: 80,
      tabLength: 2,
      softWrap: false,
      softTabs: true,
      softWrapAtPreferredLineLength: false
    };

    EditorView.nextEditorId = 1;

    EditorView.content = function(params) {
      var attributes;
      attributes = {
        "class": this.classes(params),
        tabindex: -1
      };
      if (params.attributes) {
        _.extend(attributes, params.attributes);
      }
      return this.div(attributes, (function(_this) {
        return function() {
          _this.subview('gutter', new GutterView);
          _this.div({
            "class": 'scroll-view',
            outlet: 'scrollView'
          }, function() {
            _this.div({
              "class": 'overlayer',
              outlet: 'overlayer'
            });
            _this.div({
              "class": 'lines',
              outlet: 'renderedLines'
            });
            return _this.div({
              "class": 'underlayer',
              outlet: 'underlayer'
            }, function() {
              return _this.input({
                "class": 'hidden-input',
                outlet: 'hiddenInput'
              });
            });
          });
          return _this.div({
            "class": 'vertical-scrollbar',
            outlet: 'verticalScrollbar'
          }, function() {
            return _this.div({
              outlet: 'verticalScrollbarContent'
            });
          });
        };
      })(this));
    };

    EditorView.classes = function(_arg) {
      var classes, mini;
      mini = (_arg != null ? _arg : {}).mini;
      classes = ['editor', 'editor-colors'];
      if (mini) {
        classes.push('mini');
      }
      return classes.join(' ');
    };

    EditorView.prototype.vScrollMargin = 2;

    EditorView.prototype.hScrollMargin = 10;

    EditorView.prototype.lineHeight = null;

    EditorView.prototype.charWidth = null;

    EditorView.prototype.charHeight = null;

    EditorView.prototype.cursorViews = null;

    EditorView.prototype.selectionViews = null;

    EditorView.prototype.lineCache = null;

    EditorView.prototype.isFocused = false;

    EditorView.prototype.editor = null;

    EditorView.prototype.attached = false;

    EditorView.prototype.lineOverdraw = 10;

    EditorView.prototype.pendingChanges = null;

    EditorView.prototype.newCursors = null;

    EditorView.prototype.newSelections = null;

    EditorView.prototype.redrawOnReattach = false;

    EditorView.prototype.bottomPaddingInLines = 10;

    EditorView.prototype.initialize = function(editorOrOptions) {
      var editor, placeholderText, _ref2;
      if (editorOrOptions instanceof Editor) {
        editor = editorOrOptions;
      } else {
        _ref2 = editorOrOptions != null ? editorOrOptions : {}, editor = _ref2.editor, this.mini = _ref2.mini, placeholderText = _ref2.placeholderText;
      }
      this.id = EditorView.nextEditorId++;
      this.lineCache = [];
      this.configure();
      this.bindKeys();
      this.handleEvents();
      this.handleInputEvents();
      this.cursorViews = [];
      this.selectionViews = [];
      this.pendingChanges = [];
      this.newCursors = [];
      this.newSelections = [];
      if (placeholderText) {
        this.setPlaceholderText(placeholderText);
      }
      if (editor != null) {
        return this.edit(editor);
      } else if (this.mini) {
        return this.edit(new Editor({
          buffer: new TextBuffer,
          softWrap: false,
          tabLength: 2,
          softTabs: true
        }));
      } else {
        throw new Error("Must supply an Editor or mini: true");
      }
    };

    EditorView.prototype.bindKeys = function() {
      var documentation, editorBindings, method, name, _results;
      editorBindings = {
        'core:move-left': (function(_this) {
          return function() {
            return _this.editor.moveCursorLeft();
          };
        })(this),
        'core:move-right': (function(_this) {
          return function() {
            return _this.editor.moveCursorRight();
          };
        })(this),
        'core:select-left': (function(_this) {
          return function() {
            return _this.editor.selectLeft();
          };
        })(this),
        'core:select-right': (function(_this) {
          return function() {
            return _this.editor.selectRight();
          };
        })(this),
        'core:select-all': (function(_this) {
          return function() {
            return _this.editor.selectAll();
          };
        })(this),
        'core:backspace': (function(_this) {
          return function() {
            return _this.editor.backspace();
          };
        })(this),
        'core:delete': (function(_this) {
          return function() {
            return _this.editor["delete"]();
          };
        })(this),
        'core:undo': (function(_this) {
          return function() {
            return _this.editor.undo();
          };
        })(this),
        'core:redo': (function(_this) {
          return function() {
            return _this.editor.redo();
          };
        })(this),
        'core:cut': (function(_this) {
          return function() {
            return _this.editor.cutSelectedText();
          };
        })(this),
        'core:copy': (function(_this) {
          return function() {
            return _this.editor.copySelectedText();
          };
        })(this),
        'core:paste': (function(_this) {
          return function() {
            return _this.editor.pasteText();
          };
        })(this),
        'editor:move-to-previous-word': (function(_this) {
          return function() {
            return _this.editor.moveCursorToPreviousWord();
          };
        })(this),
        'editor:select-word': (function(_this) {
          return function() {
            return _this.editor.selectWord();
          };
        })(this),
        'editor:consolidate-selections': (function(_this) {
          return function(event) {
            return _this.consolidateSelections(event);
          };
        })(this),
        'editor:backspace-to-beginning-of-word': (function(_this) {
          return function() {
            return _this.editor.backspaceToBeginningOfWord();
          };
        })(this),
        'editor:backspace-to-beginning-of-line': (function(_this) {
          return function() {
            return _this.editor.backspaceToBeginningOfLine();
          };
        })(this),
        'editor:delete-to-end-of-word': (function(_this) {
          return function() {
            return _this.editor.deleteToEndOfWord();
          };
        })(this),
        'editor:delete-line': (function(_this) {
          return function() {
            return _this.editor.deleteLine();
          };
        })(this),
        'editor:cut-to-end-of-line': (function(_this) {
          return function() {
            return _this.editor.cutToEndOfLine();
          };
        })(this),
        'editor:move-to-beginning-of-screen-line': (function(_this) {
          return function() {
            return _this.editor.moveCursorToBeginningOfScreenLine();
          };
        })(this),
        'editor:move-to-beginning-of-line': (function(_this) {
          return function() {
            return _this.editor.moveCursorToBeginningOfLine();
          };
        })(this),
        'editor:move-to-end-of-screen-line': (function(_this) {
          return function() {
            return _this.editor.moveCursorToEndOfScreenLine();
          };
        })(this),
        'editor:move-to-end-of-line': (function(_this) {
          return function() {
            return _this.editor.moveCursorToEndOfLine();
          };
        })(this),
        'editor:move-to-first-character-of-line': (function(_this) {
          return function() {
            return _this.editor.moveCursorToFirstCharacterOfLine();
          };
        })(this),
        'editor:move-to-beginning-of-word': (function(_this) {
          return function() {
            return _this.editor.moveCursorToBeginningOfWord();
          };
        })(this),
        'editor:move-to-end-of-word': (function(_this) {
          return function() {
            return _this.editor.moveCursorToEndOfWord();
          };
        })(this),
        'editor:move-to-beginning-of-next-word': (function(_this) {
          return function() {
            return _this.editor.moveCursorToBeginningOfNextWord();
          };
        })(this),
        'editor:move-to-previous-word-boundary': (function(_this) {
          return function() {
            return _this.editor.moveCursorToPreviousWordBoundary();
          };
        })(this),
        'editor:move-to-next-word-boundary': (function(_this) {
          return function() {
            return _this.editor.moveCursorToNextWordBoundary();
          };
        })(this),
        'editor:select-to-end-of-line': (function(_this) {
          return function() {
            return _this.editor.selectToEndOfLine();
          };
        })(this),
        'editor:select-to-beginning-of-line': (function(_this) {
          return function() {
            return _this.editor.selectToBeginningOfLine();
          };
        })(this),
        'editor:select-to-end-of-word': (function(_this) {
          return function() {
            return _this.editor.selectToEndOfWord();
          };
        })(this),
        'editor:select-to-beginning-of-word': (function(_this) {
          return function() {
            return _this.editor.selectToBeginningOfWord();
          };
        })(this),
        'editor:select-to-beginning-of-next-word': (function(_this) {
          return function() {
            return _this.editor.selectToBeginningOfNextWord();
          };
        })(this),
        'editor:select-to-next-word-boundary': (function(_this) {
          return function() {
            return _this.editor.selectToNextWordBoundary();
          };
        })(this),
        'editor:select-to-previous-word-boundary': (function(_this) {
          return function() {
            return _this.editor.selectToPreviousWordBoundary();
          };
        })(this),
        'editor:select-to-first-character-of-line': (function(_this) {
          return function() {
            return _this.editor.selectToFirstCharacterOfLine();
          };
        })(this),
        'editor:select-line': (function(_this) {
          return function() {
            return _this.editor.selectLine();
          };
        })(this),
        'editor:transpose': (function(_this) {
          return function() {
            return _this.editor.transpose();
          };
        })(this),
        'editor:upper-case': (function(_this) {
          return function() {
            return _this.editor.upperCase();
          };
        })(this),
        'editor:lower-case': (function(_this) {
          return function() {
            return _this.editor.lowerCase();
          };
        })(this)
      };
      if (!this.mini) {
        _.extend(editorBindings, {
          'core:move-up': (function(_this) {
            return function() {
              return _this.editor.moveCursorUp();
            };
          })(this),
          'core:move-down': (function(_this) {
            return function() {
              return _this.editor.moveCursorDown();
            };
          })(this),
          'core:move-to-top': (function(_this) {
            return function() {
              return _this.editor.moveCursorToTop();
            };
          })(this),
          'core:move-to-bottom': (function(_this) {
            return function() {
              return _this.editor.moveCursorToBottom();
            };
          })(this),
          'core:page-down': (function(_this) {
            return function() {
              return _this.pageDown();
            };
          })(this),
          'core:page-up': (function(_this) {
            return function() {
              return _this.pageUp();
            };
          })(this),
          'core:select-up': (function(_this) {
            return function() {
              return _this.editor.selectUp();
            };
          })(this),
          'core:select-down': (function(_this) {
            return function() {
              return _this.editor.selectDown();
            };
          })(this),
          'core:select-to-top': (function(_this) {
            return function() {
              return _this.editor.selectToTop();
            };
          })(this),
          'core:select-to-bottom': (function(_this) {
            return function() {
              return _this.editor.selectToBottom();
            };
          })(this),
          'editor:indent': (function(_this) {
            return function() {
              return _this.editor.indent();
            };
          })(this),
          'editor:auto-indent': (function(_this) {
            return function() {
              return _this.editor.autoIndentSelectedRows();
            };
          })(this),
          'editor:indent-selected-rows': (function(_this) {
            return function() {
              return _this.editor.indentSelectedRows();
            };
          })(this),
          'editor:outdent-selected-rows': (function(_this) {
            return function() {
              return _this.editor.outdentSelectedRows();
            };
          })(this),
          'editor:newline': (function(_this) {
            return function() {
              return _this.editor.insertNewline();
            };
          })(this),
          'editor:newline-below': (function(_this) {
            return function() {
              return _this.editor.insertNewlineBelow();
            };
          })(this),
          'editor:newline-above': (function(_this) {
            return function() {
              return _this.editor.insertNewlineAbove();
            };
          })(this),
          'editor:add-selection-below': (function(_this) {
            return function() {
              return _this.editor.addSelectionBelow();
            };
          })(this),
          'editor:add-selection-above': (function(_this) {
            return function() {
              return _this.editor.addSelectionAbove();
            };
          })(this),
          'editor:split-selections-into-lines': (function(_this) {
            return function() {
              return _this.editor.splitSelectionsIntoLines();
            };
          })(this),
          'editor:toggle-soft-tabs': (function(_this) {
            return function() {
              return _this.toggleSoftTabs();
            };
          })(this),
          'editor:toggle-soft-wrap': (function(_this) {
            return function() {
              return _this.toggleSoftWrap();
            };
          })(this),
          'editor:fold-all': (function(_this) {
            return function() {
              return _this.editor.foldAll();
            };
          })(this),
          'editor:unfold-all': (function(_this) {
            return function() {
              return _this.editor.unfoldAll();
            };
          })(this),
          'editor:fold-current-row': (function(_this) {
            return function() {
              return _this.editor.foldCurrentRow();
            };
          })(this),
          'editor:unfold-current-row': (function(_this) {
            return function() {
              return _this.editor.unfoldCurrentRow();
            };
          })(this),
          'editor:fold-selection': (function(_this) {
            return function() {
              return _this.editor.foldSelection();
            };
          })(this),
          'editor:fold-at-indent-level-1': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(0);
            };
          })(this),
          'editor:fold-at-indent-level-2': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(1);
            };
          })(this),
          'editor:fold-at-indent-level-3': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(2);
            };
          })(this),
          'editor:fold-at-indent-level-4': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(3);
            };
          })(this),
          'editor:fold-at-indent-level-5': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(4);
            };
          })(this),
          'editor:fold-at-indent-level-6': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(5);
            };
          })(this),
          'editor:fold-at-indent-level-7': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(6);
            };
          })(this),
          'editor:fold-at-indent-level-8': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(7);
            };
          })(this),
          'editor:fold-at-indent-level-9': (function(_this) {
            return function() {
              return _this.editor.foldAllAtIndentLevel(8);
            };
          })(this),
          'editor:toggle-line-comments': (function(_this) {
            return function() {
              return _this.toggleLineCommentsInSelection();
            };
          })(this),
          'editor:log-cursor-scope': (function(_this) {
            return function() {
              return _this.logCursorScope();
            };
          })(this),
          'editor:checkout-head-revision': (function(_this) {
            return function() {
              return _this.checkoutHead();
            };
          })(this),
          'editor:copy-path': (function(_this) {
            return function() {
              return _this.copyPathToClipboard();
            };
          })(this),
          'editor:move-line-up': (function(_this) {
            return function() {
              return _this.editor.moveLineUp();
            };
          })(this),
          'editor:move-line-down': (function(_this) {
            return function() {
              return _this.editor.moveLineDown();
            };
          })(this),
          'editor:duplicate-line': (function(_this) {
            return function() {
              return _this.editor.duplicateLine();
            };
          })(this),
          'editor:join-line': (function(_this) {
            return function() {
              return _this.editor.joinLine();
            };
          })(this),
          'editor:toggle-indent-guide': (function(_this) {
            return function() {
              return atom.config.toggle('editor.showIndentGuide');
            };
          })(this),
          'editor:toggle-line-numbers': (function(_this) {
            return function() {
              return atom.config.toggle('editor.showLineNumbers');
            };
          })(this),
          'editor:scroll-to-cursor': (function(_this) {
            return function() {
              return _this.scrollToCursorPosition();
            };
          })(this)
        });
      }
      documentation = {};
      _results = [];
      for (name in editorBindings) {
        method = editorBindings[name];
        _results.push((function(_this) {
          return function(name, method) {
            return _this.command(name, function(e) {
              method(e);
              return false;
            });
          };
        })(this)(name, method));
      }
      return _results;
    };

    EditorView.prototype.getEditor = function() {
      return this.editor;
    };

    EditorView.prototype.getText = function() {
      return this.editor.getText();
    };

    EditorView.prototype.setText = function(text) {
      return this.editor.setText(text);
    };

    EditorView.prototype.insertText = function(text, options) {
      return this.editor.insertText(text, options);
    };

    EditorView.prototype.setHeightInLines = function(heightInLines) {
      if (heightInLines == null) {
        heightInLines = this.calculateHeightInLines();
      }
      if (heightInLines) {
        return this.heightInLines = heightInLines;
      }
    };

    EditorView.prototype.setWidthInChars = function(widthInChars) {
      if (widthInChars == null) {
        widthInChars = this.calculateWidthInChars();
      }
      if (widthInChars) {
        return this.editor.setEditorWidthInChars(widthInChars);
      }
    };

    EditorView.prototype.pageDown = function() {
      var newScrollTop;
      newScrollTop = this.scrollTop() + this.scrollView[0].clientHeight;
      this.editor.moveCursorDown(this.getPageRows());
      return this.scrollTop(newScrollTop, {
        adjustVerticalScrollbar: true
      });
    };

    EditorView.prototype.pageUp = function() {
      var newScrollTop;
      newScrollTop = this.scrollTop() - this.scrollView[0].clientHeight;
      this.editor.moveCursorUp(this.getPageRows());
      return this.scrollTop(newScrollTop, {
        adjustVerticalScrollbar: true
      });
    };

    EditorView.prototype.getPageRows = function() {
      return Math.max(1, Math.ceil(this.scrollView[0].clientHeight / this.lineHeight));
    };

    EditorView.prototype.setShowInvisibles = function(showInvisibles) {
      if (showInvisibles === this.showInvisibles) {
        return;
      }
      this.showInvisibles = showInvisibles;
      return this.resetDisplay();
    };

    EditorView.prototype.setInvisibles = function(invisibles) {
      this.invisibles = invisibles != null ? invisibles : {};
      _.defaults(this.invisibles, {
        eol: '\u00ac',
        space: '\u00b7',
        tab: '\u00bb',
        cr: '\u00a4'
      });
      return this.resetDisplay();
    };

    EditorView.prototype.setShowIndentGuide = function(showIndentGuide) {
      if (showIndentGuide === this.showIndentGuide) {
        return;
      }
      this.showIndentGuide = showIndentGuide;
      return this.resetDisplay();
    };

    EditorView.prototype.setPlaceholderText = function(placeholderText) {
      if (!this.mini) {
        return;
      }
      this.placeholderText = placeholderText;
      return this.requestDisplayUpdate();
    };

    EditorView.prototype.getPlaceholderText = function() {
      return this.placeholderText;
    };

    EditorView.prototype.checkoutHead = function() {
      var path, _ref2;
      if (path = this.editor.getPath()) {
        return (_ref2 = atom.project.getRepo()) != null ? _ref2.checkoutHead(path) : void 0;
      }
    };

    EditorView.prototype.configure = function() {
      this.subscribe(atom.config.observe('editor.showLineNumbers', (function(_this) {
        return function(showLineNumbers) {
          return _this.gutter.setShowLineNumbers(showLineNumbers);
        };
      })(this)));
      this.subscribe(atom.config.observe('editor.showInvisibles', (function(_this) {
        return function(showInvisibles) {
          return _this.setShowInvisibles(showInvisibles);
        };
      })(this)));
      this.subscribe(atom.config.observe('editor.showIndentGuide', (function(_this) {
        return function(showIndentGuide) {
          return _this.setShowIndentGuide(showIndentGuide);
        };
      })(this)));
      this.subscribe(atom.config.observe('editor.invisibles', (function(_this) {
        return function(invisibles) {
          return _this.setInvisibles(invisibles);
        };
      })(this)));
      this.subscribe(atom.config.observe('editor.fontSize', (function(_this) {
        return function(fontSize) {
          return _this.setFontSize(fontSize);
        };
      })(this)));
      return this.subscribe(atom.config.observe('editor.fontFamily', (function(_this) {
        return function(fontFamily) {
          return _this.setFontFamily(fontFamily);
        };
      })(this)));
    };

    EditorView.prototype.handleEvents = function() {
      var updateWidthInChars;
      this.on('focus', (function(_this) {
        return function() {
          _this.hiddenInput.focus();
          return false;
        };
      })(this));
      this.hiddenInput.on('focus', (function(_this) {
        return function() {
          _this.bringHiddenInputIntoView();
          _this.isFocused = true;
          return _this.addClass('is-focused');
        };
      })(this));
      this.hiddenInput.on('focusout', (function(_this) {
        return function() {
          _this.bringHiddenInputIntoView();
          _this.isFocused = false;
          return _this.removeClass('is-focused');
        };
      })(this));
      this.underlayer.on('mousedown', (function(_this) {
        return function(e) {
          _this.renderedLines.trigger(e);
          if (_this.isFocused) {
            return false;
          }
        };
      })(this));
      this.overlayer.on('mousedown', (function(_this) {
        return function(e) {
          var clickedElement;
          _this.overlayer.hide();
          clickedElement = document.elementFromPoint(e.pageX, e.pageY);
          _this.overlayer.show();
          e.target = clickedElement;
          $(clickedElement).trigger(e);
          if (_this.isFocused) {
            return false;
          }
        };
      })(this));
      this.renderedLines.on('mousedown', '.fold.line', (function(_this) {
        return function(e) {
          var id, marker;
          id = $(e.currentTarget).attr('fold-id');
          marker = _this.editor.displayBuffer.getMarker(id);
          _this.editor.setCursorBufferPosition(marker.getBufferRange().start);
          _this.editor.destroyFoldWithId(id);
          return false;
        };
      })(this));
      this.gutter.on('mousedown', '.foldable .icon-right', (function(_this) {
        return function(e) {
          var bufferRow;
          bufferRow = $(e.target).parent().data('bufferRow');
          _this.editor.toggleFoldAtBufferRow(bufferRow);
          return false;
        };
      })(this));
      this.renderedLines.on('mousedown', (function(_this) {
        return function(e) {
          var clickCount, screenPosition;
          clickCount = e.originalEvent.detail;
          screenPosition = _this.screenPositionFromMouseEvent(e);
          if (clickCount === 1) {
            if (e.metaKey) {
              _this.editor.addCursorAtScreenPosition(screenPosition);
            } else if (e.shiftKey) {
              _this.editor.selectToScreenPosition(screenPosition);
            } else {
              _this.editor.setCursorScreenPosition(screenPosition);
            }
          } else if (clickCount === 2) {
            if (!e.shiftKey) {
              _this.editor.selectWord();
            }
          } else if (clickCount === 3) {
            if (!e.shiftKey) {
              _this.editor.selectLine();
            }
          }
          if (!(e.ctrlKey || e.originalEvent.which > 1)) {
            return _this.selectOnMousemoveUntilMouseup();
          }
        };
      })(this));
      if (!this.mini) {
        this.scrollView.on('mousewheel', (function(_this) {
          return function(e) {
            var delta;
            if (delta = e.originalEvent.wheelDeltaY) {
              _this.scrollTop(_this.scrollTop() - delta);
              return false;
            }
          };
        })(this));
      }
      this.verticalScrollbar.on('scroll', (function(_this) {
        return function() {
          return _this.scrollTop(_this.verticalScrollbar.scrollTop(), {
            adjustVerticalScrollbar: false
          });
        };
      })(this));
      this.scrollView.on('scroll', (function(_this) {
        return function() {
          if (_this.scrollLeft() === 0) {
            return _this.gutter.removeClass('drop-shadow');
          } else {
            return _this.gutter.addClass('drop-shadow');
          }
        };
      })(this));
      updateWidthInChars = _.debounce(((function(_this) {
        return function() {
          return _this.setWidthInChars();
        };
      })(this)), 100);
      return this.scrollView.on('overflowchanged', (function(_this) {
        return function() {
          if (_this[0].classList.contains('soft-wrap')) {
            return updateWidthInChars();
          }
        };
      })(this));
    };

    EditorView.prototype.handleInputEvents = function() {
      var lastInput, selectedText;
      this.on('cursor:moved', (function(_this) {
        return function() {
          var cursorView, style;
          if (!_this.isFocused) {
            return;
          }
          cursorView = _this.getCursorView();
          if (cursorView.isVisible()) {
            style = cursorView[0].style;
            _this.hiddenInput[0].style.top = style.top;
            return _this.hiddenInput[0].style.left = style.left;
          }
        };
      })(this));
      selectedText = null;
      this.hiddenInput.on('compositionstart', (function(_this) {
        return function() {
          selectedText = _this.editor.getSelectedText();
          return _this.hiddenInput.css('width', '100%');
        };
      })(this));
      this.hiddenInput.on('compositionupdate', (function(_this) {
        return function(e) {
          return _this.editor.insertText(e.originalEvent.data, {
            select: true,
            undo: 'skip'
          });
        };
      })(this));
      this.hiddenInput.on('compositionend', (function(_this) {
        return function() {
          _this.editor.insertText(selectedText, {
            select: true,
            undo: 'skip'
          });
          return _this.hiddenInput.css('width', '1px');
        };
      })(this));
      lastInput = '';
      return this.on("textInput", (function(_this) {
        return function(e) {
          var selectedLength;
          selectedLength = _this.hiddenInput[0].selectionEnd - _this.hiddenInput[0].selectionStart;
          if (selectedLength === 1 && lastInput === _this.hiddenInput.val()) {
            _this.editor.selectLeft();
          }
          lastInput = e.originalEvent.data;
          _this.editor.insertText(lastInput);
          if (lastInput === ' ') {
            return true;
          } else {
            _this.hiddenInput.val(lastInput);
            return false;
          }
        };
      })(this));
    };

    EditorView.prototype.bringHiddenInputIntoView = function() {
      return this.hiddenInput.css({
        top: this.scrollTop(),
        left: this.scrollLeft()
      });
    };

    EditorView.prototype.selectOnMousemoveUntilMouseup = function() {
      var interval, lastMoveEvent, moveHandler;
      lastMoveEvent = null;
      moveHandler = (function(_this) {
        return function(event) {
          if (event == null) {
            event = lastMoveEvent;
          }
          if (event) {
            _this.editor.selectToScreenPosition(_this.screenPositionFromMouseEvent(event));
            return lastMoveEvent = event;
          }
        };
      })(this);
      $(document).on("mousemove.editor-" + this.id, moveHandler);
      interval = setInterval(moveHandler, 20);
      return $(document).one("mouseup.editor-" + this.id, (function(_this) {
        return function() {
          clearInterval(interval);
          $(document).off('mousemove', moveHandler);
          _this.editor.mergeIntersectingSelections({
            isReversed: _this.editor.getLastSelection().isReversed()
          });
          _this.editor.finalizeSelections();
          return _this.syncCursorAnimations();
        };
      })(this));
    };

    EditorView.prototype.afterAttach = function(onDom) {
      var pane;
      if (!onDom) {
        return;
      }
      if (!this.editor.isAlive()) {
        if (atom.isReleasedVersion()) {
          return;
        } else {
          throw new Error("Assertion failure: EditorView is getting attached to a dead editor. Why?");
        }
      }
      if (this.redrawOnReattach) {
        this.redraw();
      }
      if (this.attached) {
        return;
      }
      this.attached = true;
      this.calculateDimensions();
      this.setWidthInChars();
      this.subscribe($(window), "resize.editor-" + this.id, (function(_this) {
        return function() {
          _this.setHeightInLines();
          _this.setWidthInChars();
          _this.updateLayerDimensions();
          return _this.requestDisplayUpdate();
        };
      })(this));
      if (this.isFocused) {
        this.focus();
      }
      if (pane = this.getPane()) {
        this.active = this.is(pane.activeView);
        this.subscribe(pane, 'pane:active-item-changed', (function(_this) {
          return function(event, item) {
            var wasActive;
            wasActive = _this.active;
            _this.active = _this.is(pane.activeView);
            if (_this.active && !wasActive) {
              return _this.redraw();
            }
          };
        })(this));
      }
      this.resetDisplay();
      return this.trigger('editor:attached', [this]);
    };

    EditorView.prototype.edit = function(editor) {
      if (editor === this.editor) {
        return;
      }
      if (this.editor) {
        this.saveScrollPositionForEditor();
        this.editor.off(".editor");
      }
      this.editor = editor;
      if (this.editor == null) {
        return;
      }
      this.editor.setVisible(true);
      this.editor.on("destroyed", (function(_this) {
        return function() {
          return _this.remove();
        };
      })(this));
      this.editor.on("contents-conflicted.editor", (function(_this) {
        return function() {
          return _this.showBufferConflictAlert(_this.editor);
        };
      })(this));
      this.editor.on("path-changed.editor", (function(_this) {
        return function() {
          _this.editor.reloadGrammar();
          return _this.trigger('editor:path-changed');
        };
      })(this));
      this.editor.on("grammar-changed.editor", (function(_this) {
        return function() {
          return _this.trigger('editor:grammar-changed');
        };
      })(this));
      this.editor.on('selection-added.editor', (function(_this) {
        return function(selection) {
          _this.newCursors.push(selection.cursor);
          _this.newSelections.push(selection);
          return _this.requestDisplayUpdate();
        };
      })(this));
      this.editor.on('screen-lines-changed.editor', (function(_this) {
        return function(e) {
          return _this.handleScreenLinesChange(e);
        };
      })(this));
      this.editor.on('scroll-top-changed.editor', (function(_this) {
        return function(scrollTop) {
          return _this.scrollTop(scrollTop);
        };
      })(this));
      this.editor.on('scroll-left-changed.editor', (function(_this) {
        return function(scrollLeft) {
          return _this.scrollLeft(scrollLeft);
        };
      })(this));
      this.editor.on('soft-wrap-changed.editor', (function(_this) {
        return function(softWrap) {
          return _this.setSoftWrap(softWrap);
        };
      })(this));
      this.trigger('editor:path-changed');
      this.resetDisplay();
      if (this.attached && this.editor.buffer.isInConflict()) {
        return _.defer((function(_this) {
          return function() {
            return _this.showBufferConflictAlert(_this.editor);
          };
        })(this));
      }
    };

    EditorView.prototype.getModel = function() {
      return this.editor;
    };

    EditorView.prototype.setModel = function(editor) {
      return this.edit(editor);
    };

    EditorView.prototype.showBufferConflictAlert = function(editor) {
      return atom.confirm({
        message: editor.getPath(),
        detailedMessage: "Has changed on disk. Do you want to reload it?",
        buttons: {
          Reload: function() {
            return editor.getBuffer().reload();
          },
          Cancel: null
        }
      });
    };

    EditorView.prototype.scrollTop = function(scrollTop, options) {
      var maxScrollTop, _ref2;
      if (options == null) {
        options = {};
      }
      if (scrollTop == null) {
        return this.cachedScrollTop || 0;
      }
      maxScrollTop = this.verticalScrollbar.prop('scrollHeight') - this.verticalScrollbar.height();
      scrollTop = Math.floor(Math.max(0, Math.min(maxScrollTop, scrollTop)));
      if (scrollTop === this.cachedScrollTop) {
        return;
      }
      this.cachedScrollTop = scrollTop;
      if (this.attached) {
        this.updateDisplay();
      }
      this.renderedLines.css('top', -scrollTop);
      this.underlayer.css('top', -scrollTop);
      this.overlayer.css('top', -scrollTop);
      this.gutter.lineNumbers.css('top', -scrollTop);
      if ((_ref2 = options != null ? options.adjustVerticalScrollbar : void 0) != null ? _ref2 : true) {
        this.verticalScrollbar.scrollTop(scrollTop);
      }
      return this.editor.setScrollTop(this.scrollTop());
    };

    EditorView.prototype.scrollBottom = function(scrollBottom) {
      if (scrollBottom != null) {
        return this.scrollTop(scrollBottom - this.scrollView.height());
      } else {
        return this.scrollTop() + this.scrollView.height();
      }
    };

    EditorView.prototype.scrollLeft = function(scrollLeft) {
      if (scrollLeft != null) {
        this.scrollView.scrollLeft(scrollLeft);
        return this.editor.setScrollLeft(this.scrollLeft());
      } else {
        return this.scrollView.scrollLeft();
      }
    };

    EditorView.prototype.scrollRight = function(scrollRight) {
      if (scrollRight != null) {
        this.scrollView.scrollRight(scrollRight);
        return this.editor.setScrollLeft(this.scrollLeft());
      } else {
        return this.scrollView.scrollRight();
      }
    };

    EditorView.prototype.scrollToBottom = function() {
      return this.scrollBottom(this.editor.getScreenLineCount() * this.lineHeight);
    };

    EditorView.prototype.scrollToCursorPosition = function() {
      return this.scrollToBufferPosition(this.editor.getCursorBufferPosition(), {
        center: true
      });
    };

    EditorView.prototype.scrollToBufferPosition = function(bufferPosition, options) {
      return this.scrollToPixelPosition(this.pixelPositionForBufferPosition(bufferPosition), options);
    };

    EditorView.prototype.scrollToScreenPosition = function(screenPosition, options) {
      return this.scrollToPixelPosition(this.pixelPositionForScreenPosition(screenPosition), options);
    };

    EditorView.prototype.scrollToPixelPosition = function(pixelPosition, options) {
      if (!this.attached) {
        return;
      }
      this.scrollVertically(pixelPosition, options);
      return this.scrollHorizontally(pixelPosition);
    };

    EditorView.prototype.highlightFoldsContainingBufferRange = function(bufferRange) {
      var element, fold, i, screenLine, screenLines, screenRow, _i, _len, _results;
      screenLines = this.editor.linesForScreenRows(this.firstRenderedScreenRow, this.lastRenderedScreenRow);
      _results = [];
      for (i = _i = 0, _len = screenLines.length; _i < _len; i = ++_i) {
        screenLine = screenLines[i];
        if (fold = screenLine.fold) {
          screenRow = this.firstRenderedScreenRow + i;
          element = this.lineElementForScreenRow(screenRow);
          if (bufferRange.intersectsWith(fold.getBufferRange())) {
            _results.push(element.addClass('fold-selected'));
          } else {
            _results.push(element.removeClass('fold-selected'));
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    EditorView.prototype.saveScrollPositionForEditor = function() {
      if (this.attached) {
        this.editor.setScrollTop(this.scrollTop());
        return this.editor.setScrollLeft(this.scrollLeft());
      }
    };

    EditorView.prototype.toggleSoftTabs = function() {
      return this.editor.setSoftTabs(!this.editor.getSoftTabs());
    };

    EditorView.prototype.toggleSoftWrap = function() {
      this.setWidthInChars();
      return this.editor.setSoftWrap(!this.editor.getSoftWrap());
    };

    EditorView.prototype.calculateWidthInChars = function() {
      return Math.floor(this.scrollView.width() / this.charWidth);
    };

    EditorView.prototype.calculateHeightInLines = function() {
      return Math.ceil($(window).height() / this.lineHeight);
    };

    EditorView.prototype.setSoftWrap = function(softWrap) {
      if (softWrap) {
        this.addClass('soft-wrap');
        return this.scrollLeft(0);
      } else {
        return this.removeClass('soft-wrap');
      }
    };

    EditorView.prototype.setFontSize = function(fontSize) {
      this.css('font-size', "" + fontSize + "px");
      this.clearCharacterWidthCache();
      if (this.isOnDom()) {
        return this.redraw();
      } else {
        return this.redrawOnReattach = this.attached;
      }
    };

    EditorView.prototype.getFontSize = function() {
      return parseInt(this.css("font-size"));
    };

    EditorView.prototype.setFontFamily = function(fontFamily) {
      if (fontFamily == null) {
        fontFamily = '';
      }
      this.css('font-family', fontFamily);
      this.clearCharacterWidthCache();
      return this.redraw();
    };

    EditorView.prototype.getFontFamily = function() {
      return this.css("font-family");
    };

    EditorView.prototype.redraw = function() {
      if (!this.hasParent()) {
        return;
      }
      if (!this.attached) {
        return;
      }
      this.redrawOnReattach = false;
      this.calculateDimensions();
      this.updatePaddingOfRenderedLines();
      this.updateLayerDimensions();
      return this.requestDisplayUpdate();
    };

    EditorView.prototype.splitLeft = function() {
      var pane;
      pane = this.getPane();
      return pane != null ? pane.splitLeft(pane != null ? pane.copyActiveItem() : void 0).activeView : void 0;
    };

    EditorView.prototype.splitRight = function() {
      var pane;
      pane = this.getPane();
      return pane != null ? pane.splitRight(pane != null ? pane.copyActiveItem() : void 0).activeView : void 0;
    };

    EditorView.prototype.splitUp = function() {
      var pane;
      pane = this.getPane();
      return pane != null ? pane.splitUp(pane != null ? pane.copyActiveItem() : void 0).activeView : void 0;
    };

    EditorView.prototype.splitDown = function() {
      var pane;
      pane = this.getPane();
      return pane != null ? pane.splitDown(pane != null ? pane.copyActiveItem() : void 0).activeView : void 0;
    };

    EditorView.prototype.getPane = function() {
      return this.parent('.item-views').parents('.pane').view();
    };

    EditorView.prototype.remove = function(selector, keepData) {
      var _ref2;
      if (keepData || this.removed) {
        return EditorView.__super__.remove.apply(this, arguments);
      }
      EditorView.__super__.remove.apply(this, arguments);
      return (_ref2 = atom.workspaceView) != null ? _ref2.focus() : void 0;
    };

    EditorView.prototype.beforeRemove = function() {
      var _ref2;
      this.trigger('editor:will-be-removed');
      this.removed = true;
      if ((_ref2 = this.editor) != null) {
        _ref2.destroy();
      }
      $(window).off(".editor-" + this.id);
      return $(document).off(".editor-" + this.id);
    };

    EditorView.prototype.getCursorView = function(index) {
      if (index == null) {
        index = this.cursorViews.length - 1;
      }
      return this.cursorViews[index];
    };

    EditorView.prototype.getCursorViews = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, this.cursorViews, function(){});
    };

    EditorView.prototype.addCursorView = function(cursor, options) {
      var cursorView;
      cursorView = new CursorView(cursor, this, options);
      this.cursorViews.push(cursorView);
      this.overlayer.append(cursorView);
      return cursorView;
    };

    EditorView.prototype.removeCursorView = function(cursorView) {
      return _.remove(this.cursorViews, cursorView);
    };

    EditorView.prototype.getSelectionView = function(index) {
      if (index == null) {
        index = this.selectionViews.length - 1;
      }
      return this.selectionViews[index];
    };

    EditorView.prototype.getSelectionViews = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, this.selectionViews, function(){});
    };

    EditorView.prototype.addSelectionView = function(selection) {
      var selectionView;
      selectionView = new SelectionView({
        editorView: this,
        selection: selection
      });
      this.selectionViews.push(selectionView);
      this.underlayer.append(selectionView);
      return selectionView;
    };

    EditorView.prototype.removeSelectionView = function(selectionView) {
      return _.remove(this.selectionViews, selectionView);
    };

    EditorView.prototype.removeAllCursorAndSelectionViews = function() {
      var cursorView, selectionView, _i, _j, _len, _len1, _ref2, _ref3, _results;
      _ref2 = this.getCursorViews();
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        cursorView = _ref2[_i];
        cursorView.remove();
      }
      _ref3 = this.getSelectionViews();
      _results = [];
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        selectionView = _ref3[_j];
        _results.push(selectionView.remove());
      }
      return _results;
    };

    EditorView.prototype.appendToLinesView = function(view) {
      return this.overlayer.append(view);
    };

    EditorView.prototype.scrollVertically = function(pixelPosition, _arg) {
      var center, desiredBottom, desiredTop, linesInView, margin, maxScrollMargin, scrollBottom, scrollMargin, scrollTop, scrollViewHeight, _ref2;
      center = (_arg != null ? _arg : {}).center;
      scrollViewHeight = this.scrollView.height();
      scrollTop = this.scrollTop();
      scrollBottom = scrollTop + scrollViewHeight;
      if (center) {
        if (!((scrollTop < (_ref2 = pixelPosition.top) && _ref2 < scrollBottom))) {
          return this.scrollTop(pixelPosition.top - (scrollViewHeight / 2));
        }
      } else {
        linesInView = this.scrollView.height() / this.lineHeight;
        maxScrollMargin = Math.floor((linesInView - 1) / 2);
        scrollMargin = Math.min(this.vScrollMargin, maxScrollMargin);
        margin = scrollMargin * this.lineHeight;
        desiredTop = pixelPosition.top - margin;
        desiredBottom = pixelPosition.top + this.lineHeight + margin;
        if (desiredBottom > scrollBottom) {
          return this.scrollTop(desiredBottom - scrollViewHeight);
        } else if (desiredTop < scrollTop) {
          return this.scrollTop(desiredTop);
        }
      }
    };

    EditorView.prototype.scrollHorizontally = function(pixelPosition) {
      var charsInView, desiredLeft, desiredRight, margin, maxScrollMargin, scrollMargin;
      if (this.editor.getSoftWrap()) {
        return;
      }
      charsInView = this.scrollView.width() / this.charWidth;
      maxScrollMargin = Math.floor((charsInView - 1) / 2);
      scrollMargin = Math.min(this.hScrollMargin, maxScrollMargin);
      margin = scrollMargin * this.charWidth;
      desiredRight = pixelPosition.left + this.charWidth + margin;
      desiredLeft = pixelPosition.left - margin;
      if (desiredRight > this.scrollRight()) {
        this.scrollRight(desiredRight);
      } else if (desiredLeft < this.scrollLeft()) {
        this.scrollLeft(desiredLeft);
      }
      return this.saveScrollPositionForEditor();
    };

    EditorView.prototype.calculateDimensions = function() {
      var charRect, fragment, lineRect;
      fragment = $('<div class="line" style="position: absolute; visibility: hidden;"><span>x</span></div>');
      this.renderedLines.append(fragment);
      lineRect = fragment[0].getBoundingClientRect();
      charRect = fragment.find('span')[0].getBoundingClientRect();
      this.lineHeight = lineRect.height;
      this.charWidth = charRect.width;
      this.charHeight = charRect.height;
      fragment.remove();
      return this.setHeightInLines();
    };

    EditorView.prototype.updateLayerDimensions = function() {
      var height, minWidth;
      height = this.lineHeight * this.editor.getScreenLineCount();
      if (this.layerHeight !== height) {
        this.layerHeight = height;
        this.underlayer.height(this.layerHeight);
        this.renderedLines.height(this.layerHeight);
        this.overlayer.height(this.layerHeight);
        this.verticalScrollbarContent.height(this.layerHeight);
        if (this.scrollBottom() > height) {
          this.scrollBottom(height);
        }
      }
      minWidth = Math.max(this.charWidth * this.editor.getMaxScreenLineLength() + 20, this.scrollView.width());
      if (this.layerMinWidth !== minWidth) {
        this.renderedLines.css('min-width', minWidth);
        this.underlayer.css('min-width', minWidth);
        this.overlayer.css('min-width', minWidth);
        this.layerMinWidth = minWidth;
        return this.trigger('editor:min-width-changed');
      }
    };

    EditorView.prototype.isHidden = function() {
      var style;
      style = this[0].style;
      if (style.display === 'none' || !this.isOnDom()) {
        return true;
      } else {
        return false;
      }
    };

    EditorView.prototype.clearRenderedLines = function() {
      this.renderedLines.empty();
      this.firstRenderedScreenRow = null;
      return this.lastRenderedScreenRow = null;
    };

    EditorView.prototype.resetDisplay = function() {
      var editorScrollLeft, editorScrollTop, _ref2, _ref3;
      if (!this.attached) {
        return;
      }
      this.clearRenderedLines();
      this.removeAllCursorAndSelectionViews();
      editorScrollTop = (_ref2 = this.editor.getScrollTop()) != null ? _ref2 : 0;
      editorScrollLeft = (_ref3 = this.editor.getScrollLeft()) != null ? _ref3 : 0;
      this.updateLayerDimensions();
      this.scrollTop(editorScrollTop);
      this.scrollLeft(editorScrollLeft);
      this.setSoftWrap(this.editor.getSoftWrap());
      this.newCursors = this.editor.getCursors();
      this.newSelections = this.editor.getSelections();
      return this.updateDisplay({
        suppressAutoScroll: true
      });
    };

    EditorView.prototype.requestDisplayUpdate = function() {
      if (this.pendingDisplayUpdate) {
        return;
      }
      if (!this.isVisible()) {
        return;
      }
      this.pendingDisplayUpdate = true;
      return setImmediate((function(_this) {
        return function() {
          _this.updateDisplay();
          return _this.pendingDisplayUpdate = false;
        };
      })(this));
    };

    EditorView.prototype.updateDisplay = function(options) {
      if (options == null) {
        options = {};
      }
      if (!(this.attached && this.editor)) {
        return;
      }
      if (this.editor.isDestroyed()) {
        return;
      }
      if (!(this.isOnDom() && this.isVisible())) {
        this.redrawOnReattach = true;
        return;
      }
      this.updateRenderedLines();
      this.updatePlaceholderText();
      this.highlightCursorLine();
      this.updateCursorViews();
      this.updateSelectionViews();
      this.autoscroll(options);
      return this.trigger('editor:display-updated');
    };

    EditorView.prototype.updateCursorViews = function() {
      var cursor, cursorView, _i, _j, _len, _len1, _ref2, _ref3, _results;
      if (this.newCursors.length > 0) {
        _ref2 = this.newCursors;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          cursor = _ref2[_i];
          if (!cursor.destroyed) {
            this.addCursorView(cursor);
          }
        }
        this.syncCursorAnimations();
        this.newCursors = [];
      }
      _ref3 = this.getCursorViews();
      _results = [];
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        cursorView = _ref3[_j];
        if (cursorView.needsRemoval) {
          _results.push(cursorView.remove());
        } else if (this.shouldUpdateCursor(cursorView)) {
          _results.push(cursorView.updateDisplay());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    EditorView.prototype.shouldUpdateCursor = function(cursorView) {
      var pos;
      if (!cursorView.needsUpdate) {
        return false;
      }
      pos = cursorView.getScreenPosition();
      return pos.row >= this.firstRenderedScreenRow && pos.row <= this.lastRenderedScreenRow;
    };

    EditorView.prototype.updateSelectionViews = function() {
      var selection, selectionView, _i, _j, _len, _len1, _ref2, _ref3, _results;
      if (this.newSelections.length > 0) {
        _ref2 = this.newSelections;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          selection = _ref2[_i];
          if (!selection.destroyed) {
            this.addSelectionView(selection);
          }
        }
        this.newSelections = [];
      }
      _ref3 = this.getSelectionViews();
      _results = [];
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        selectionView = _ref3[_j];
        if (selectionView.needsRemoval) {
          _results.push(selectionView.remove());
        } else if (this.shouldUpdateSelection(selectionView)) {
          _results.push(selectionView.updateDisplay());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    EditorView.prototype.shouldUpdateSelection = function(selectionView) {
      var endRow, screenRange, startRow;
      screenRange = selectionView.getScreenRange();
      startRow = screenRange.start.row;
      endRow = screenRange.end.row;
      return (startRow >= this.firstRenderedScreenRow && startRow <= this.lastRenderedScreenRow) || (endRow >= this.firstRenderedScreenRow && endRow <= this.lastRenderedScreenRow) || (startRow <= this.firstRenderedScreenRow && endRow >= this.lastRenderedScreenRow);
    };

    EditorView.prototype.syncCursorAnimations = function() {
      var cursorView, _i, _len, _ref2, _results;
      _ref2 = this.getCursorViews();
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        cursorView = _ref2[_i];
        _results.push((function(cursorView) {
          return cursorView.resetBlinking();
        })(cursorView));
      }
      return _results;
    };

    EditorView.prototype.autoscroll = function(options) {
      var cursorView, selectionView, _i, _j, _len, _len1, _ref2, _ref3, _results;
      if (options == null) {
        options = {};
      }
      _ref2 = this.getCursorViews();
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        cursorView = _ref2[_i];
        if (!options.suppressAutoScroll && cursorView.needsAutoscroll()) {
          this.scrollToPixelPosition(cursorView.getPixelPosition());
        }
        cursorView.clearAutoscroll();
      }
      _ref3 = this.getSelectionViews();
      _results = [];
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        selectionView = _ref3[_j];
        if (!options.suppressAutoScroll && selectionView.needsAutoscroll()) {
          this.scrollToPixelPosition(selectionView.getCenterPixelPosition(), {
            center: true
          });
          selectionView.highlight();
        }
        _results.push(selectionView.clearAutoscroll());
      }
      return _results;
    };

    EditorView.prototype.updatePlaceholderText = function() {
      var element;
      if (!this.mini) {
        return;
      }
      if ((!this.placeholderText) || this.editor.getText()) {
        return this.find('.placeholder-text').remove();
      } else if (this.placeholderText && !this.editor.getText()) {
        element = this.find('.placeholder-text');
        if (element.length) {
          return element.text(this.placeholderText);
        } else {
          return this.underlayer.append($('<span/>', {
            "class": 'placeholder-text',
            text: this.placeholderText
          }));
        }
      }
    };

    EditorView.prototype.updateRenderedLines = function() {
      var changes, firstVisibleScreenRow, intactRanges, lastScreenRow, lastScreenRowToRender, renderFrom, renderTo;
      firstVisibleScreenRow = this.getFirstVisibleScreenRow();
      lastScreenRowToRender = firstVisibleScreenRow + this.heightInLines - 1;
      lastScreenRow = this.editor.getLastScreenRow();
      if ((this.firstRenderedScreenRow != null) && firstVisibleScreenRow >= this.firstRenderedScreenRow && lastScreenRowToRender <= this.lastRenderedScreenRow) {
        renderFrom = Math.min(lastScreenRow, this.firstRenderedScreenRow);
        renderTo = Math.min(lastScreenRow, this.lastRenderedScreenRow);
      } else {
        renderFrom = Math.min(lastScreenRow, Math.max(0, firstVisibleScreenRow - this.lineOverdraw));
        renderTo = Math.min(lastScreenRow, lastScreenRowToRender + this.lineOverdraw);
      }
      if (this.pendingChanges.length === 0 && this.firstRenderedScreenRow && this.firstRenderedScreenRow <= renderFrom && renderTo <= this.lastRenderedScreenRow) {
        return;
      }
      changes = this.pendingChanges;
      intactRanges = this.computeIntactRanges(renderFrom, renderTo);
      this.gutter.updateLineNumbers(changes, renderFrom, renderTo);
      this.clearDirtyRanges(intactRanges);
      this.fillDirtyRanges(intactRanges, renderFrom, renderTo);
      this.firstRenderedScreenRow = renderFrom;
      this.lastRenderedScreenRow = renderTo;
      this.updateLayerDimensions();
      return this.updatePaddingOfRenderedLines();
    };

    EditorView.prototype.computeSurroundingEmptyLineChanges = function(change) {
      var afterEnd, afterStart, beforeEnd, beforeStart, emptyLineChanges;
      emptyLineChanges = [];
      if (change.bufferDelta != null) {
        afterStart = change.end + change.bufferDelta + 1;
        if (this.editor.lineForBufferRow(afterStart) === '') {
          afterEnd = afterStart;
          while (this.editor.lineForBufferRow(afterEnd + 1) === '') {
            afterEnd++;
          }
          emptyLineChanges.push({
            start: afterStart,
            end: afterEnd,
            screenDelta: 0
          });
        }
        beforeEnd = change.start - 1;
        if (this.editor.lineForBufferRow(beforeEnd) === '') {
          beforeStart = beforeEnd;
          while (this.editor.lineForBufferRow(beforeStart - 1) === '') {
            beforeStart--;
          }
          emptyLineChanges.push({
            start: beforeStart,
            end: beforeEnd,
            screenDelta: 0
          });
        }
      }
      return emptyLineChanges;
    };

    EditorView.prototype.computeIntactRanges = function(renderFrom, renderTo) {
      var change, emptyLineChanges, intactRanges, newIntactRanges, range, _i, _j, _k, _len, _len1, _len2, _ref2, _ref3, _ref4;
      if ((this.firstRenderedScreenRow == null) && (this.lastRenderedScreenRow == null)) {
        return [];
      }
      intactRanges = [
        {
          start: this.firstRenderedScreenRow,
          end: this.lastRenderedScreenRow,
          domStart: 0
        }
      ];
      if (!this.mini && this.showIndentGuide) {
        emptyLineChanges = [];
        _ref2 = this.pendingChanges;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          change = _ref2[_i];
          emptyLineChanges.push.apply(emptyLineChanges, this.computeSurroundingEmptyLineChanges(change));
        }
        (_ref3 = this.pendingChanges).push.apply(_ref3, emptyLineChanges);
      }
      _ref4 = this.pendingChanges;
      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
        change = _ref4[_j];
        newIntactRanges = [];
        for (_k = 0, _len2 = intactRanges.length; _k < _len2; _k++) {
          range = intactRanges[_k];
          if (change.end < range.start && change.screenDelta !== 0) {
            newIntactRanges.push({
              start: range.start + change.screenDelta,
              end: range.end + change.screenDelta,
              domStart: range.domStart
            });
          } else if (change.end < range.start || change.start > range.end) {
            newIntactRanges.push(range);
          } else {
            if (change.start > range.start) {
              newIntactRanges.push({
                start: range.start,
                end: change.start - 1,
                domStart: range.domStart
              });
            }
            if (change.end < range.end) {
              newIntactRanges.push({
                start: change.end + change.screenDelta + 1,
                end: range.end + change.screenDelta,
                domStart: range.domStart + change.end + 1 - range.start
              });
            }
          }
        }
        intactRanges = newIntactRanges;
      }
      this.truncateIntactRanges(intactRanges, renderFrom, renderTo);
      this.pendingChanges = [];
      return intactRanges;
    };

    EditorView.prototype.truncateIntactRanges = function(intactRanges, renderFrom, renderTo) {
      var i, range;
      i = 0;
      while (i < intactRanges.length) {
        range = intactRanges[i];
        if (range.start < renderFrom) {
          range.domStart += renderFrom - range.start;
          range.start = renderFrom;
        }
        if (range.end > renderTo) {
          range.end = renderTo;
        }
        if (range.start >= range.end) {
          intactRanges.splice(i--, 1);
        }
        i++;
      }
      return intactRanges.sort(function(a, b) {
        return a.domStart - b.domStart;
      });
    };

    EditorView.prototype.clearDirtyRanges = function(intactRanges) {
      var currentLine, domPosition, i, intactRange, _i, _j, _len, _ref2, _ref3, _results;
      if (intactRanges.length === 0) {
        return this.renderedLines[0].innerHTML = '';
      } else if (currentLine = this.renderedLines[0].firstChild) {
        domPosition = 0;
        for (_i = 0, _len = intactRanges.length; _i < _len; _i++) {
          intactRange = intactRanges[_i];
          while (intactRange.domStart > domPosition) {
            currentLine = this.clearLine(currentLine);
            domPosition++;
          }
          for (i = _j = _ref2 = intactRange.start, _ref3 = intactRange.end; _ref2 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = _ref2 <= _ref3 ? ++_j : --_j) {
            currentLine = currentLine.nextSibling;
            domPosition++;
          }
        }
        _results = [];
        while (currentLine) {
          _results.push(currentLine = this.clearLine(currentLine));
        }
        return _results;
      }
    };

    EditorView.prototype.clearLine = function(lineElement) {
      var next;
      next = lineElement.nextSibling;
      this.renderedLines[0].removeChild(lineElement);
      return next;
    };

    EditorView.prototype.fillDirtyRanges = function(intactRanges, renderFrom, renderTo) {
      var currentLine, dirtyRangeEnd, i, lineElement, nextIntact, row, _results;
      i = 0;
      nextIntact = intactRanges[i];
      currentLine = this.renderedLines[0].firstChild;
      row = renderFrom;
      _results = [];
      while (row <= renderTo) {
        if (row === (nextIntact != null ? nextIntact.end : void 0) + 1) {
          nextIntact = intactRanges[++i];
        }
        if (!nextIntact || row < nextIntact.start) {
          if (nextIntact) {
            dirtyRangeEnd = nextIntact.start - 1;
          } else {
            dirtyRangeEnd = renderTo;
          }
          _results.push((function() {
            var _i, _len, _ref2, _results1;
            _ref2 = this.buildLineElementsForScreenRows(row, dirtyRangeEnd);
            _results1 = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              lineElement = _ref2[_i];
              this.renderedLines[0].insertBefore(lineElement, currentLine);
              _results1.push(row++);
            }
            return _results1;
          }).call(this));
        } else {
          currentLine = currentLine.nextSibling;
          _results.push(row++);
        }
      }
      return _results;
    };

    EditorView.prototype.updatePaddingOfRenderedLines = function() {
      var paddingBottom, paddingTop;
      paddingTop = this.firstRenderedScreenRow * this.lineHeight;
      this.renderedLines.css('padding-top', paddingTop);
      this.gutter.lineNumbers.css('padding-top', paddingTop);
      paddingBottom = (this.editor.getLastScreenRow() - this.lastRenderedScreenRow) * this.lineHeight;
      this.renderedLines.css('padding-bottom', paddingBottom);
      return this.gutter.lineNumbers.css('padding-bottom', paddingBottom);
    };

    EditorView.prototype.getFirstVisibleScreenRow = function() {
      var screenRow;
      screenRow = Math.floor(this.scrollTop() / this.lineHeight);
      if (isNaN(screenRow)) {
        screenRow = 0;
      }
      return screenRow;
    };

    EditorView.prototype.getLastVisibleScreenRow = function() {
      var calculatedRow, screenRow;
      calculatedRow = Math.ceil((this.scrollTop() + this.scrollView.height()) / this.lineHeight) - 1;
      screenRow = Math.max(0, Math.min(this.editor.getScreenLineCount() - 1, calculatedRow));
      if (isNaN(screenRow)) {
        screenRow = 0;
      }
      return screenRow;
    };

    EditorView.prototype.isScreenRowVisible = function(row) {
      return (this.getFirstVisibleScreenRow() <= row && row <= this.getLastVisibleScreenRow());
    };

    EditorView.prototype.handleScreenLinesChange = function(change) {
      this.pendingChanges.push(change);
      return this.requestDisplayUpdate();
    };

    EditorView.prototype.buildLineElementForScreenRow = function(screenRow) {
      return this.buildLineElementsForScreenRows(screenRow, screenRow)[0];
    };

    EditorView.prototype.buildLineElementsForScreenRows = function(startRow, endRow) {
      var div;
      div = document.createElement('div');
      div.innerHTML = this.htmlForScreenRows(startRow, endRow);
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, div.children, function(){});
    };

    EditorView.prototype.htmlForScreenRows = function(startRow, endRow) {
      var htmlLines, line, screenRow, _i, _len, _ref2;
      htmlLines = '';
      screenRow = startRow;
      _ref2 = this.editor.linesForScreenRows(startRow, endRow);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        line = _ref2[_i];
        htmlLines += this.htmlForScreenLine(line, screenRow++);
      }
      return htmlLines;
    };

    EditorView.prototype.htmlForScreenLine = function(screenLine, screenRow) {
      var attributes, eolInvisibles, fold, htmlEolInvisibles, indentation, invisibles, isSoftWrapped, lineEnding, text, tokens;
      tokens = screenLine.tokens, text = screenLine.text, lineEnding = screenLine.lineEnding, fold = screenLine.fold, isSoftWrapped = screenLine.isSoftWrapped;
      if (fold) {
        attributes = {
          "class": 'fold line',
          'fold-id': fold.id
        };
      } else {
        attributes = {
          "class": 'line'
        };
      }
      if (this.showInvisibles) {
        invisibles = this.invisibles;
      }
      eolInvisibles = this.getEndOfLineInvisibles(screenLine);
      htmlEolInvisibles = this.buildHtmlEndOfLineInvisibles(screenLine);
      indentation = EditorView.buildIndentation(screenRow, this.editor);
      return EditorView.buildLineHtml({
        tokens: tokens,
        text: text,
        lineEnding: lineEnding,
        fold: fold,
        isSoftWrapped: isSoftWrapped,
        invisibles: invisibles,
        eolInvisibles: eolInvisibles,
        htmlEolInvisibles: htmlEolInvisibles,
        attributes: attributes,
        showIndentGuide: this.showIndentGuide,
        indentation: indentation,
        editor: this.editor,
        mini: this.mini
      });
    };

    EditorView.buildIndentation = function(screenRow, editor) {
      var bufferLine, bufferRow, indentation, nextRow, previousRow;
      bufferRow = editor.bufferPositionForScreenPosition([screenRow]).row;
      bufferLine = editor.lineForBufferRow(bufferRow);
      if (bufferLine === '') {
        indentation = 0;
        nextRow = screenRow + 1;
        while (nextRow < editor.getBuffer().getLineCount()) {
          bufferRow = editor.bufferPositionForScreenPosition([nextRow]).row;
          bufferLine = editor.lineForBufferRow(bufferRow);
          if (bufferLine !== '') {
            indentation = Math.ceil(editor.indentLevelForLine(bufferLine));
            break;
          }
          nextRow++;
        }
        previousRow = screenRow - 1;
        while (previousRow >= 0) {
          bufferRow = editor.bufferPositionForScreenPosition([previousRow]).row;
          bufferLine = editor.lineForBufferRow(bufferRow);
          if (bufferLine !== '') {
            indentation = Math.max(indentation, Math.ceil(editor.indentLevelForLine(bufferLine)));
            break;
          }
          previousRow--;
        }
        return indentation;
      } else {
        return Math.ceil(editor.indentLevelForLine(bufferLine));
      }
    };

    EditorView.prototype.buildHtmlEndOfLineInvisibles = function(screenLine) {
      var invisible, invisibles, _i, _len, _ref2;
      invisibles = [];
      _ref2 = this.getEndOfLineInvisibles(screenLine);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        invisible = _ref2[_i];
        invisibles.push("<span class='invisible-character'>" + invisible + "</span>");
      }
      return invisibles.join('');
    };

    EditorView.prototype.getEndOfLineInvisibles = function(screenLine) {
      var invisibles;
      if (!(this.showInvisibles && this.invisibles)) {
        return [];
      }
      if (this.mini || screenLine.isSoftWrapped()) {
        return [];
      }
      invisibles = [];
      if (this.invisibles.cr && screenLine.lineEnding === '\r\n') {
        invisibles.push(this.invisibles.cr);
      }
      if (this.invisibles.eol) {
        invisibles.push(this.invisibles.eol);
      }
      return invisibles;
    };

    EditorView.prototype.lineElementForScreenRow = function(screenRow) {
      return this.renderedLines.children(":eq(" + (screenRow - this.firstRenderedScreenRow) + ")");
    };

    EditorView.prototype.toggleLineCommentsInSelection = function() {
      return this.editor.toggleLineCommentsInSelection();
    };

    EditorView.prototype.pixelPositionForBufferPosition = function(position) {
      return this.pixelPositionForScreenPosition(this.editor.screenPositionForBufferPosition(position));
    };

    EditorView.prototype.pixelPositionForScreenPosition = function(position) {
      var actualRow, column, existingLineElement, left, lineElement, row, _ref2;
      if (!(this.isOnDom() && this.isVisible())) {
        return {
          top: 0,
          left: 0
        };
      }
      _ref2 = Point.fromObject(position), row = _ref2.row, column = _ref2.column;
      actualRow = Math.floor(row);
      lineElement = existingLineElement = this.lineElementForScreenRow(actualRow)[0];
      if (!existingLineElement) {
        lineElement = this.buildLineElementForScreenRow(actualRow);
        this.renderedLines.append(lineElement);
      }
      left = this.positionLeftForLineAndColumn(lineElement, actualRow, column);
      if (!existingLineElement) {
        this.renderedLines[0].removeChild(lineElement);
      }
      return {
        top: row * this.lineHeight,
        left: left
      };
    };

    EditorView.prototype.positionLeftForLineAndColumn = function(lineElement, screenRow, screenColumn) {
      var char, index, left, token, tokenizedLine, val, _i, _j, _len, _len1, _ref2, _ref3;
      if (screenColumn === 0) {
        return 0;
      }
      tokenizedLine = this.editor.displayBuffer.lineForRow(screenRow);
      left = 0;
      index = 0;
      _ref2 = tokenizedLine.tokens;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        token = _ref2[_i];
        _ref3 = token.value;
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          char = _ref3[_j];
          if (index >= screenColumn) {
            return left;
          }
          val = this.getCharacterWidthCache(token.scopes, char);
          if (val != null) {
            left += val;
          } else {
            return this.measureToColumn(lineElement, tokenizedLine, screenColumn);
          }
          index++;
        }
      }
      return left;
    };

    EditorView.prototype.measureToColumn = function(lineElement, tokenizedLine, screenColumn) {
      var cachedCharWidth, char, content, i, index, iterator, left, offsetLeft, oldLeft, paddingLeft, rects, returnLeft, scopes, textNode, _i, _len, _ref2;
      left = oldLeft = index = 0;
      iterator = document.createNodeIterator(lineElement, NodeFilter.SHOW_TEXT, TextNodeFilter);
      returnLeft = null;
      offsetLeft = this.scrollView.offset().left;
      paddingLeft = parseInt(this.scrollView.css('padding-left'));
      while (textNode = iterator.nextNode()) {
        content = textNode.textContent;
        for (i = _i = 0, _len = content.length; _i < _len; i = ++_i) {
          char = content[i];
          if (index > LongLineLength && screenColumn < index) {
            break;
          }
          if (index === screenColumn) {
            returnLeft = left;
          }
          oldLeft = left;
          scopes = (_ref2 = tokenizedLine.tokenAtBufferColumn(index)) != null ? _ref2.scopes : void 0;
          cachedCharWidth = this.getCharacterWidthCache(scopes, char);
          if (cachedCharWidth != null) {
            left = oldLeft + cachedCharWidth;
          } else {
            MeasureRange.setEnd(textNode, i + 1);
            MeasureRange.collapse();
            rects = MeasureRange.getClientRects();
            if (rects.length === 0) {
              return 0;
            }
            left = rects[0].left - Math.floor(offsetLeft) + Math.floor(this.scrollLeft()) - paddingLeft;
            if (scopes != null) {
              cachedCharWidth = left - oldLeft;
              this.setCharacterWidthCache(scopes, char, cachedCharWidth);
            }
          }
          if (index > LongLineLength) {
            return screenColumn * cachedCharWidth;
          }
          index++;
        }
      }
      return returnLeft != null ? returnLeft : left;
    };

    EditorView.prototype.getCharacterWidthCache = function(scopes, char) {
      var obj, scope, _i, _len;
      if (scopes == null) {
        scopes = NoScope;
      }
      obj = this.constructor.characterWidthCache;
      for (_i = 0, _len = scopes.length; _i < _len; _i++) {
        scope = scopes[_i];
        obj = obj[scope];
        if (obj == null) {
          return null;
        }
      }
      return obj[char];
    };

    EditorView.prototype.setCharacterWidthCache = function(scopes, char, val) {
      var obj, scope, _i, _len;
      if (scopes == null) {
        scopes = NoScope;
      }
      obj = this.constructor.characterWidthCache;
      for (_i = 0, _len = scopes.length; _i < _len; _i++) {
        scope = scopes[_i];
        if (obj[scope] == null) {
          obj[scope] = {};
        }
        obj = obj[scope];
      }
      return obj[char] = val;
    };

    EditorView.prototype.clearCharacterWidthCache = function() {
      return this.constructor.characterWidthCache = {};
    };

    EditorView.prototype.pixelOffsetForScreenPosition = function(position) {
      var left, offset, top, _ref2;
      _ref2 = this.pixelPositionForScreenPosition(position), top = _ref2.top, left = _ref2.left;
      offset = this.renderedLines.offset();
      return {
        top: top + offset.top,
        left: left + offset.left
      };
    };

    EditorView.prototype.screenPositionFromMouseEvent = function(e) {
      var characterPosition, column, editorRelativeTop, iterator, left, lineElement, node, offset, pageX, pageY, range, right, row, width, _i, _ref2, _ref3, _ref4, _ref5;
      pageX = e.pageX, pageY = e.pageY;
      offset = this.scrollView.offset();
      editorRelativeTop = pageY - offset.top + this.scrollTop();
      row = Math.floor(editorRelativeTop / this.lineHeight);
      column = 0;
      if (pageX > offset.left && (lineElement = this.lineElementForScreenRow(row)[0])) {
        range = document.createRange();
        iterator = document.createNodeIterator(lineElement, NodeFilter.SHOW_TEXT, {
          acceptNode: function() {
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        while (node = iterator.nextNode()) {
          range.selectNodeContents(node);
          column += node.textContent.length;
          _ref2 = range.getClientRects()[0], left = _ref2.left, right = _ref2.right;
          if ((left <= pageX && pageX <= right)) {
            break;
          }
        }
        if (node) {
          for (characterPosition = _i = _ref3 = node.textContent.length; _ref3 <= 0 ? _i < 0 : _i > 0; characterPosition = _ref3 <= 0 ? ++_i : --_i) {
            range.setStart(node, characterPosition - 1);
            range.setEnd(node, characterPosition);
            _ref4 = range.getClientRects()[0], left = _ref4.left, right = _ref4.right, width = _ref4.width;
            if ((left <= (_ref5 = pageX - width / 2) && _ref5 <= right)) {
              break;
            }
            column--;
          }
        }
        range.detach();
      }
      return new Point(row, column);
    };

    EditorView.prototype.highlightCursorLine = function() {
      var _ref2;
      if (this.mini) {
        return;
      }
      if ((_ref2 = this.highlightedLine) != null) {
        _ref2.removeClass('cursor-line');
      }
      if (this.editor.getSelection().isEmpty()) {
        this.highlightedLine = this.lineElementForScreenRow(this.editor.getCursorScreenRow());
        return this.highlightedLine.addClass('cursor-line');
      } else {
        return this.highlightedLine = null;
      }
    };

    EditorView.prototype.copyPathToClipboard = function() {
      var path;
      path = this.editor.getPath();
      if (path != null) {
        return atom.clipboard.write(path);
      }
    };

    EditorView.buildLineHtml = function(_arg) {
      var attributeName, attributePairs, attributes, editor, eolInvisibles, firstNonWhitespacePosition, firstTrailingWhitespacePosition, fold, hasIndentGuide, hasLeadingWhitespace, hasTrailingWhitespace, html, htmlEolInvisibles, indentation, invisibles, isSoftWrapped, line, lineEnding, lineIsWhitespaceOnly, mini, position, scopeStack, showIndentGuide, text, token, tokens, value, _i, _len;
      tokens = _arg.tokens, text = _arg.text, lineEnding = _arg.lineEnding, fold = _arg.fold, isSoftWrapped = _arg.isSoftWrapped, invisibles = _arg.invisibles, eolInvisibles = _arg.eolInvisibles, htmlEolInvisibles = _arg.htmlEolInvisibles, attributes = _arg.attributes, showIndentGuide = _arg.showIndentGuide, indentation = _arg.indentation, editor = _arg.editor, mini = _arg.mini;
      scopeStack = [];
      line = [];
      attributePairs = '';
      for (attributeName in attributes) {
        value = attributes[attributeName];
        attributePairs += " " + attributeName + "=\"" + value + "\"";
      }
      line.push("<div " + attributePairs + ">");
      if (text === '') {
        html = this.buildEmptyLineHtml(showIndentGuide, eolInvisibles, htmlEolInvisibles, indentation, editor, mini);
        if (html) {
          line.push(html);
        }
      } else {
        firstNonWhitespacePosition = text.search(/\S/);
        firstTrailingWhitespacePosition = text.search(/\s*$/);
        lineIsWhitespaceOnly = firstTrailingWhitespacePosition === 0;
        position = 0;
        for (_i = 0, _len = tokens.length; _i < _len; _i++) {
          token = tokens[_i];
          this.updateScopeStack(line, scopeStack, token.scopes);
          hasLeadingWhitespace = position < firstNonWhitespacePosition;
          hasTrailingWhitespace = position + token.value.length > firstTrailingWhitespacePosition;
          hasIndentGuide = !mini && showIndentGuide && (hasLeadingWhitespace || lineIsWhitespaceOnly);
          line.push(token.getValueAsHtml({
            invisibles: invisibles,
            hasLeadingWhitespace: hasLeadingWhitespace,
            hasTrailingWhitespace: hasTrailingWhitespace,
            hasIndentGuide: hasIndentGuide
          }));
          position += token.value.length;
        }
      }
      while (scopeStack.length > 0) {
        this.popScope(line, scopeStack);
      }
      if (text !== '') {
        line.push(htmlEolInvisibles);
      }
      if (fold) {
        line.push("<span class='fold-marker'/>");
      }
      line.push('</div>');
      return line.join('');
    };

    EditorView.updateScopeStack = function(line, scopeStack, desiredScopes) {
      var excessScopes, i, j, _i, _j, _ref2, _ref3;
      excessScopes = scopeStack.length - desiredScopes.length;
      if (excessScopes > 0) {
        while (excessScopes--) {
          this.popScope(line, scopeStack);
        }
      }
      for (i = _i = _ref2 = scopeStack.length; _ref2 <= 0 ? _i <= 0 : _i >= 0; i = _ref2 <= 0 ? ++_i : --_i) {
        if (_.isEqual(scopeStack.slice(0, i), desiredScopes.slice(0, i))) {
          break;
        }
        this.popScope(line, scopeStack);
      }
      for (j = _j = i, _ref3 = desiredScopes.length; i <= _ref3 ? _j < _ref3 : _j > _ref3; j = i <= _ref3 ? ++_j : --_j) {
        this.pushScope(line, scopeStack, desiredScopes[j]);
      }
      return null;
    };

    EditorView.pushScope = function(line, scopeStack, scope) {
      scopeStack.push(scope);
      return line.push("<span class=\"" + (scope.replace(/\./g, ' ')) + "\">");
    };

    EditorView.popScope = function(line, scopeStack) {
      scopeStack.pop();
      return line.push("</span>");
    };

    EditorView.buildEmptyLineHtml = function(showIndentGuide, eolInvisibles, htmlEolInvisibles, indentation, editor, mini) {
      var characterPosition, indentCharIndex, indentGuideHtml, indentLevelHtml, invisible, level, tabLength, _i, _j;
      indentCharIndex = 0;
      if (!mini && showIndentGuide) {
        if (indentation > 0) {
          tabLength = editor.getTabLength();
          indentGuideHtml = '';
          for (level = _i = 0; 0 <= indentation ? _i < indentation : _i > indentation; level = 0 <= indentation ? ++_i : --_i) {
            indentLevelHtml = "<span class='indent-guide'>";
            for (characterPosition = _j = 0; 0 <= tabLength ? _j < tabLength : _j > tabLength; characterPosition = 0 <= tabLength ? ++_j : --_j) {
              if (invisible = eolInvisibles[indentCharIndex++]) {
                indentLevelHtml += "<span class='invisible-character'>" + invisible + "</span>";
              } else {
                indentLevelHtml += ' ';
              }
            }
            indentLevelHtml += "</span>";
            indentGuideHtml += indentLevelHtml;
          }
          while (indentCharIndex < eolInvisibles.length) {
            indentGuideHtml += "<span class='invisible-character'>" + eolInvisibles[indentCharIndex++] + "</span>";
          }
          return indentGuideHtml;
        }
      }
      if (htmlEolInvisibles.length > 0) {
        return htmlEolInvisibles;
      } else {
        return '&nbsp;';
      }
    };

    EditorView.prototype.replaceSelectedText = function(replaceFn) {
      var selection, text;
      selection = this.editor.getSelection();
      if (selection.isEmpty()) {
        return false;
      }
      text = replaceFn(this.editor.getTextInRange(selection.getBufferRange()));
      if (text === null || text === void 0) {
        return false;
      }
      this.editor.insertText(text, {
        select: true
      });
      return true;
    };

    EditorView.prototype.consolidateSelections = function(e) {
      if (!this.editor.consolidateSelections()) {
        return e.abortKeyBinding();
      }
    };

    EditorView.prototype.logCursorScope = function() {
      return console.log(this.editor.getCursorScopes());
    };

    EditorView.prototype.logScreenLines = function(start, end) {
      return this.editor.logScreenLines(start, end);
    };

    EditorView.prototype.logRenderedLines = function() {
      return this.renderedLines.find('.line').each(function(n) {
        return console.log(n, $(this).text());
      });
    };

    return EditorView;

  })(View);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/editor-view.js.map
