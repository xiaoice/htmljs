(function() {
  var $, $$, CommandInstaller, Delegator, Editor, EditorView, PaneColumnView, PaneContainerView, PaneRowView, PaneView, Q, View, Workspace, WorkspaceView, fs, ipc, path, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ipc = require('ipc');

  path = require('path');

  Q = require('q');

  _ = require('underscore-plus');

  Delegator = require('delegato');

  _ref = require('./space-pen-extensions'), $ = _ref.$, $$ = _ref.$$, View = _ref.View;

  fs = require('fs-plus');

  Workspace = require('./workspace');

  CommandInstaller = require('./command-installer');

  EditorView = require('./editor-view');

  PaneView = require('./pane-view');

  PaneColumnView = require('./pane-column-view');

  PaneRowView = require('./pane-row-view');

  PaneContainerView = require('./pane-container-view');

  Editor = require('./editor');

  module.exports = WorkspaceView = (function(_super) {
    __extends(WorkspaceView, _super);

    function WorkspaceView() {
      return WorkspaceView.__super__.constructor.apply(this, arguments);
    }

    Delegator.includeInto(WorkspaceView);

    WorkspaceView.delegatesProperty('fullScreen', 'destroyedItemUris', {
      toProperty: 'model'
    });

    WorkspaceView.delegatesMethods('open', 'openSync', 'reopenItemSync', 'saveActivePaneItem', 'saveActivePaneItemAs', 'saveAll', 'destroyActivePaneItem', 'destroyActivePane', 'increaseFontSize', 'decreaseFontSize', {
      toProperty: 'model'
    });

    WorkspaceView.version = 4;

    WorkspaceView.configDefaults = {
      ignoredNames: [".git", ".svn", ".DS_Store"],
      excludeVcsIgnoredPaths: true,
      disabledPackages: [],
      themes: ['atom-dark-ui', 'atom-dark-syntax'],
      projectHome: path.join(fs.getHomeDirectory(), 'github'),
      audioBeep: true,
      destroyEmptyPanes: true
    };

    WorkspaceView.content = function() {
      return this.div({
        "class": 'workspace',
        tabindex: -1
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'horizontal',
            outlet: 'horizontal'
          }, function() {
            return _this.div({
              "class": 'vertical',
              outlet: 'vertical'
            }, function() {
              return _this.div({
                "class": 'panes',
                outlet: 'panes'
              });
            });
          });
        };
      })(this));
    };

    WorkspaceView.prototype.initialize = function(model) {
      var panes;
      this.model = model;
      if (this.model == null) {
        this.model = new Workspace;
      }
      panes = new PaneContainerView(this.model.paneContainer);
      this.panes.replaceWith(panes);
      this.panes = panes;
      this.subscribe(this.model, 'uri-opened', (function(_this) {
        return function() {
          return _this.trigger('uri-opened');
        };
      })(this));
      this.updateTitle();
      this.on('focus', (function(_this) {
        return function(e) {
          return _this.handleFocus(e);
        };
      })(this));
      this.subscribe($(window), 'focus', (function(_this) {
        return function(e) {
          if (document.activeElement === document.body) {
            return _this.handleFocus(e);
          }
        };
      })(this));
      atom.project.on('path-changed', (function(_this) {
        return function() {
          return _this.updateTitle();
        };
      })(this));
      this.on('pane-container:active-pane-item-changed', (function(_this) {
        return function() {
          return _this.updateTitle();
        };
      })(this));
      this.on('pane:active-item-title-changed', '.active.pane', (function(_this) {
        return function() {
          return _this.updateTitle();
        };
      })(this));
      this.command('application:about', function() {
        return ipc.sendChannel('command', 'application:about');
      });
      this.command('application:run-all-specs', function() {
        return ipc.sendChannel('command', 'application:run-all-specs');
      });
      this.command('application:run-benchmarks', function() {
        return ipc.sendChannel('command', 'application:run-benchmarks');
      });
      this.command('application:show-settings', function() {
        return ipc.sendChannel('command', 'application:show-settings');
      });
      this.command('application:quit', function() {
        return ipc.sendChannel('command', 'application:quit');
      });
      this.command('application:hide', function() {
        return ipc.sendChannel('command', 'application:hide');
      });
      this.command('application:hide-other-applications', function() {
        return ipc.sendChannel('command', 'application:hide-other-applications');
      });
      this.command('application:unhide-all-applications', function() {
        return ipc.sendChannel('command', 'application:unhide-all-applications');
      });
      this.command('application:new-window', function() {
        return ipc.sendChannel('command', 'application:new-window');
      });
      this.command('application:new-file', function() {
        return ipc.sendChannel('command', 'application:new-file');
      });
      this.command('application:open', function() {
        return ipc.sendChannel('command', 'application:open');
      });
      this.command('application:open-dev', function() {
        return ipc.sendChannel('command', 'application:open-dev');
      });
      this.command('application:minimize', function() {
        return ipc.sendChannel('command', 'application:minimize');
      });
      this.command('application:zoom', function() {
        return ipc.sendChannel('command', 'application:zoom');
      });
      this.command('application:bring-all-windows-to-front', function() {
        return ipc.sendChannel('command', 'application:bring-all-windows-to-front');
      });
      this.command('application:open-your-config', function() {
        return ipc.sendChannel('command', 'application:open-your-config');
      });
      this.command('application:open-your-init-script', function() {
        return ipc.sendChannel('command', 'application:open-your-init-script');
      });
      this.command('application:open-your-keymap', function() {
        return ipc.sendChannel('command', 'application:open-your-keymap');
      });
      this.command('application:open-your-snippets', function() {
        return ipc.sendChannel('command', 'application:open-your-snippets');
      });
      this.command('application:open-your-stylesheet', function() {
        return ipc.sendChannel('command', 'application:open-your-stylesheet');
      });
      this.command('application:open-license', (function(_this) {
        return function() {
          return _this.model.openLicense();
        };
      })(this));
      this.command('window:install-shell-commands', (function(_this) {
        return function() {
          return _this.installShellCommands();
        };
      })(this));
      this.command('window:run-package-specs', (function(_this) {
        return function() {
          return ipc.sendChannel('run-package-specs', path.join(atom.project.getPath(), 'spec'));
        };
      })(this));
      this.command('window:increase-font-size', (function(_this) {
        return function() {
          return _this.increaseFontSize();
        };
      })(this));
      this.command('window:decrease-font-size', (function(_this) {
        return function() {
          return _this.decreaseFontSize();
        };
      })(this));
      this.command('window:reset-font-size', (function(_this) {
        return function() {
          return _this.model.resetFontSize();
        };
      })(this));
      this.command('window:focus-next-pane', (function(_this) {
        return function() {
          return _this.focusNextPaneView();
        };
      })(this));
      this.command('window:focus-previous-pane', (function(_this) {
        return function() {
          return _this.focusPreviousPaneView();
        };
      })(this));
      this.command('window:focus-pane-above', (function(_this) {
        return function() {
          return _this.focusPaneViewAbove();
        };
      })(this));
      this.command('window:focus-pane-below', (function(_this) {
        return function() {
          return _this.focusPaneViewBelow();
        };
      })(this));
      this.command('window:focus-pane-on-left', (function(_this) {
        return function() {
          return _this.focusPaneViewOnLeft();
        };
      })(this));
      this.command('window:focus-pane-on-right', (function(_this) {
        return function() {
          return _this.focusPaneViewOnRight();
        };
      })(this));
      this.command('window:save-all', (function(_this) {
        return function() {
          return _this.saveAll();
        };
      })(this));
      this.command('window:toggle-invisibles', (function(_this) {
        return function() {
          return atom.config.toggle("editor.showInvisibles");
        };
      })(this));
      this.command('window:toggle-auto-indent', (function(_this) {
        return function() {
          return atom.config.toggle("editor.autoIndent");
        };
      })(this));
      this.command('pane:reopen-closed-item', (function(_this) {
        return function() {
          return _this.reopenItemSync();
        };
      })(this));
      this.command('core:close', (function(_this) {
        return function() {
          if (_this.getActivePaneItem() != null) {
            return _this.destroyActivePaneItem();
          } else {
            return _this.destroyActivePane();
          }
        };
      })(this));
      this.command('core:save', (function(_this) {
        return function() {
          return _this.saveActivePaneItem();
        };
      })(this));
      return this.command('core:save-as', (function(_this) {
        return function() {
          return _this.saveActivePaneItemAs();
        };
      })(this));
    };

    WorkspaceView.prototype.installShellCommands = function() {
      var resourcePath, showErrorDialog;
      showErrorDialog = function(error) {
        var installDirectory;
        installDirectory = CommandInstaller.getInstallDirectory();
        return atom.confirm({
          message: "Failed to install shell commands",
          detailedMessage: error.message
        });
      };
      resourcePath = atom.getLoadSettings().resourcePath;
      return CommandInstaller.installAtomCommand(resourcePath, true, (function(_this) {
        return function(error) {
          if (error != null) {
            return showErrorDialog(error);
          } else {
            return CommandInstaller.installApmCommand(resourcePath, true, function(error) {
              if (error != null) {
                return showErrorDialog(error);
              } else {
                return atom.confirm({
                  message: "Commands installed.",
                  detailedMessage: "The shell commands `atom` and `apm` are installed."
                });
              }
            });
          }
        };
      })(this));
    };

    WorkspaceView.prototype.handleFocus = function() {
      var focusableChild;
      if (this.getActivePane()) {
        this.getActivePane().focus();
        return false;
      } else {
        this.updateTitle();
        focusableChild = this.find("[tabindex=-1]:visible:first");
        if (focusableChild.length) {
          focusableChild.focus();
          return false;
        } else {
          $(document.body).focus();
          return true;
        }
      }
    };

    WorkspaceView.prototype.afterAttach = function(onDom) {
      if (onDom) {
        return this.focus();
      }
    };

    WorkspaceView.prototype.confirmClose = function() {
      return this.panes.confirmClose();
    };

    WorkspaceView.prototype.updateTitle = function() {
      var item, projectPath, _ref1;
      if (projectPath = atom.project.getPath()) {
        if (item = this.getActivePaneItem()) {
          return this.setTitle("" + ((_ref1 = typeof item.getTitle === "function" ? item.getTitle() : void 0) != null ? _ref1 : 'untitled') + " - " + projectPath);
        } else {
          return this.setTitle(projectPath);
        }
      } else {
        return this.setTitle('untitled');
      }
    };

    WorkspaceView.prototype.setTitle = function(title) {
      return document.title = title;
    };

    WorkspaceView.prototype.getEditorViews = function() {
      return this.panes.find('.pane > .item-views > .editor').map(function() {
        return $(this).view();
      }).toArray();
    };

    WorkspaceView.prototype.prependToTop = function(element) {
      return this.vertical.prepend(element);
    };

    WorkspaceView.prototype.appendToTop = function(element) {
      return this.panes.before(element);
    };

    WorkspaceView.prototype.prependToBottom = function(element) {
      return this.panes.after(element);
    };

    WorkspaceView.prototype.appendToBottom = function(element) {
      return this.vertical.append(element);
    };

    WorkspaceView.prototype.prependToLeft = function(element) {
      return this.horizontal.prepend(element);
    };

    WorkspaceView.prototype.appendToLeft = function(element) {
      return this.vertical.before(element);
    };

    WorkspaceView.prototype.prependToRight = function(element) {
      return this.vertical.after(element);
    };

    WorkspaceView.prototype.appendToRight = function(element) {
      return this.horizontal.append(element);
    };

    WorkspaceView.prototype.getActivePaneView = function() {
      return this.panes.getActivePane();
    };

    WorkspaceView.prototype.getActivePaneItem = function() {
      return this.model.activePaneItem;
    };

    WorkspaceView.prototype.getActiveView = function() {
      return this.panes.getActiveView();
    };

    WorkspaceView.prototype.focusPreviousPaneView = function() {
      return this.model.activatePreviousPane();
    };

    WorkspaceView.prototype.focusNextPaneView = function() {
      return this.model.activateNextPane();
    };

    WorkspaceView.prototype.focusPaneViewAbove = function() {
      return this.panes.focusPaneViewAbove();
    };

    WorkspaceView.prototype.focusPaneViewBelow = function() {
      return this.panes.focusPaneViewBelow();
    };

    WorkspaceView.prototype.focusPaneViewOnLeft = function() {
      return this.panes.focusPaneViewOnLeft();
    };

    WorkspaceView.prototype.focusPaneViewOnRight = function() {
      return this.panes.focusPaneViewOnRight();
    };

    WorkspaceView.prototype.eachPaneView = function(callback) {
      return this.panes.eachPaneView(callback);
    };

    WorkspaceView.prototype.getPaneViews = function() {
      return this.panes.getPanes();
    };

    WorkspaceView.prototype.eachEditorView = function(callback) {
      var attachedCallback, editor, _i, _len, _ref1;
      _ref1 = this.getEditorViews();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        editor = _ref1[_i];
        callback(editor);
      }
      attachedCallback = function(e, editor) {
        return callback(editor);
      };
      this.on('editor:attached', attachedCallback);
      return {
        off: (function(_this) {
          return function() {
            return _this.off('editor:attached', attachedCallback);
          };
        })(this)
      };
    };

    WorkspaceView.prototype.beforeRemove = function() {
      return this.model.destroy();
    };

    WorkspaceView.prototype.eachPane = function(callback) {
      return this.eachPaneView(callback);
    };

    WorkspaceView.prototype.getPanes = function() {
      return this.getPaneViews();
    };

    WorkspaceView.prototype.getActivePane = function() {
      return this.getActivePaneView();
    };

    return WorkspaceView;

  })(View);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/workspace-view.js.map
