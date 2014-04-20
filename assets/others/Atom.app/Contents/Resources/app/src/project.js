(function() {
  var Directory, Editor, Emitter, Git, Model, Project, Q, Serializable, Subscriber, Task, TextBuffer, fs, path, url, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  path = require('path');

  url = require('url');

  _ = require('underscore-plus');

  fs = require('fs-plus');

  Q = require('q');

  Model = require('theorist').Model;

  _ref = require('emissary'), Emitter = _ref.Emitter, Subscriber = _ref.Subscriber;

  Serializable = require('serializable');

  TextBuffer = require('text-buffer');

  Directory = require('pathwatcher').Directory;

  Editor = require('./editor');

  Task = require('./task');

  Git = require('./git');

  module.exports = Project = (function(_super) {
    __extends(Project, _super);

    atom.deserializers.add(Project);

    Serializable.includeInto(Project);

    Project.pathForRepositoryUrl = function(repoUrl) {
      var repoName;
      repoName = url.parse(repoUrl).path.split('/').slice(-1)[0];
      repoName = repoName.replace(/\.git$/, '');
      return path.join(atom.config.get('core.projectHome'), repoName);
    };

    function Project(_arg) {
      var buffer, path, _fn, _i, _len, _ref1, _ref2;
      _ref1 = _arg != null ? _arg : {}, path = _ref1.path, this.buffers = _ref1.buffers;
      if (this.buffers == null) {
        this.buffers = [];
      }
      this.openers = [];
      _ref2 = this.buffers;
      _fn = (function(_this) {
        return function(buffer) {
          return buffer.once('destroyed', function() {
            return _this.removeBuffer(buffer);
          });
        };
      })(this);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        buffer = _ref2[_i];
        _fn(buffer);
      }
      this.editors = [];
      this.setPath(path);
    }

    Project.prototype.serializeParams = function() {
      return {
        path: this.path,
        buffers: _.compact(this.buffers.map(function(buffer) {
          if (buffer.isRetained()) {
            return buffer.serialize();
          }
        }))
      };
    };

    Project.prototype.deserializeParams = function(params) {
      params.buffers = params.buffers.map(function(bufferState) {
        return atom.deserializers.deserialize(bufferState);
      });
      return params;
    };

    Project.prototype.destroyed = function() {
      var buffer, editor, _i, _j, _len, _len1, _ref1, _ref2;
      _ref1 = this.getEditors();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        editor = _ref1[_i];
        editor.destroy();
      }
      _ref2 = this.getBuffers();
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        buffer = _ref2[_j];
        buffer.destroy();
      }
      return this.destroyRepo();
    };

    Project.prototype.destroyRepo = function() {
      if (this.repo != null) {
        this.repo.destroy();
        return this.repo = null;
      }
    };

    Project.prototype.destroyUnretainedBuffers = function() {
      var buffer, _i, _len, _ref1, _results;
      _ref1 = this.getBuffers();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        buffer = _ref1[_i];
        if (!buffer.isRetained()) {
          _results.push(buffer.destroy());
        }
      }
      return _results;
    };

    Project.prototype.getRepo = function() {
      return this.repo;
    };

    Project.prototype.getPath = function() {
      var _ref1;
      return (_ref1 = this.rootDirectory) != null ? _ref1.path : void 0;
    };

    Project.prototype.setPath = function(projectPath) {
      var directory, _ref1;
      this.path = projectPath;
      if ((_ref1 = this.rootDirectory) != null) {
        _ref1.off();
      }
      this.destroyRepo();
      if (projectPath != null) {
        directory = fs.isDirectorySync(projectPath) ? projectPath : path.dirname(projectPath);
        this.rootDirectory = new Directory(directory);
        if (this.repo = Git.open(projectPath, {
          project: this
        })) {
          this.repo.refreshIndex();
          this.repo.refreshStatus();
        }
      } else {
        this.rootDirectory = null;
      }
      return this.emit("path-changed");
    };

    Project.prototype.getRootDirectory = function() {
      return this.rootDirectory;
    };

    Project.prototype.resolve = function(uri) {
      if (!uri) {
        return;
      }
      if (uri != null ? uri.match(/[A-Za-z0-9+-.]+:\/\//) : void 0) {
        return uri;
      } else {
        if (!fs.isAbsolute(uri)) {
          uri = path.join(this.getPath(), uri);
        }
        return fs.absolute(uri);
      }
    };

    Project.prototype.relativize = function(fullPath) {
      var _ref1, _ref2;
      if (fullPath != null ? fullPath.match(/[A-Za-z0-9+-.]+:\/\//) : void 0) {
        return fullPath;
      }
      return (_ref1 = (_ref2 = this.rootDirectory) != null ? _ref2.relativize(fullPath) : void 0) != null ? _ref1 : fullPath;
    };

    Project.prototype.contains = function(pathToCheck) {
      var _ref1, _ref2;
      return (_ref1 = (_ref2 = this.rootDirectory) != null ? _ref2.contains(pathToCheck) : void 0) != null ? _ref1 : false;
    };

    Project.prototype.open = function(filePath, options) {
      if (options == null) {
        options = {};
      }
      filePath = this.resolve(filePath);
      return this.bufferForPath(filePath).then((function(_this) {
        return function(buffer) {
          return _this.buildEditorForBuffer(buffer, options);
        };
      })(this));
    };

    Project.prototype.openSync = function(filePath, options) {
      if (options == null) {
        options = {};
      }
      filePath = this.resolve(filePath);
      return this.buildEditorForBuffer(this.bufferForPathSync(filePath), options);
    };

    Project.prototype.addEditor = function(editor) {
      this.editors.push(editor);
      return this.emit('editor-created', editor);
    };

    Project.prototype.removeEditor = function(editor) {
      return _.remove(this.editors, editor);
    };

    Project.prototype.getBuffers = function() {
      return this.buffers.slice();
    };

    Project.prototype.isPathModified = function(filePath) {
      var _ref1;
      return (_ref1 = this.findBufferForPath(this.resolve(filePath))) != null ? _ref1.isModified() : void 0;
    };

    Project.prototype.findBufferForPath = function(filePath) {
      return _.find(this.buffers, function(buffer) {
        return buffer.getPath() === filePath;
      });
    };

    Project.prototype.bufferForPathSync = function(filePath) {
      var absoluteFilePath, existingBuffer;
      absoluteFilePath = this.resolve(filePath);
      if (filePath) {
        existingBuffer = this.findBufferForPath(absoluteFilePath);
      }
      return existingBuffer != null ? existingBuffer : this.buildBufferSync(absoluteFilePath);
    };

    Project.prototype.bufferForPath = function(filePath) {
      var absoluteFilePath, existingBuffer;
      absoluteFilePath = this.resolve(filePath);
      if (absoluteFilePath) {
        existingBuffer = this.findBufferForPath(absoluteFilePath);
      }
      return Q(existingBuffer != null ? existingBuffer : this.buildBuffer(absoluteFilePath));
    };

    Project.prototype.bufferForId = function(id) {
      return _.find(this.buffers, function(buffer) {
        return buffer.id === id;
      });
    };

    Project.prototype.buildBufferSync = function(absoluteFilePath) {
      var buffer;
      buffer = new TextBuffer({
        filePath: absoluteFilePath
      });
      this.addBuffer(buffer);
      buffer.loadSync();
      return buffer;
    };

    Project.prototype.buildBuffer = function(absoluteFilePath) {
      var buffer;
      if (fs.getSizeSync(absoluteFilePath) >= 2 * 1048576) {
        throw new Error("Atom can only handle files < 2MB, for now.");
      }
      buffer = new TextBuffer({
        filePath: absoluteFilePath
      });
      this.addBuffer(buffer);
      return buffer.load().then(function(buffer) {
        return buffer;
      })["catch"]((function(_this) {
        return function() {
          return _this.removeBuffer(buffer);
        };
      })(this));
    };

    Project.prototype.addBuffer = function(buffer, options) {
      if (options == null) {
        options = {};
      }
      this.addBufferAtIndex(buffer, this.buffers.length, options);
      return buffer.once('destroyed', (function(_this) {
        return function() {
          return _this.removeBuffer(buffer);
        };
      })(this));
    };

    Project.prototype.addBufferAtIndex = function(buffer, index, options) {
      if (options == null) {
        options = {};
      }
      this.buffers.splice(index, 0, buffer);
      buffer.once('destroyed', (function(_this) {
        return function() {
          return _this.removeBuffer(buffer);
        };
      })(this));
      this.emit('buffer-created', buffer);
      return buffer;
    };

    Project.prototype.removeBuffer = function(buffer) {
      var index;
      index = this.buffers.indexOf(buffer);
      if (index !== -1) {
        return this.removeBufferAtIndex(index);
      }
    };

    Project.prototype.removeBufferAtIndex = function(index, options) {
      var buffer;
      if (options == null) {
        options = {};
      }
      buffer = this.buffers.splice(index, 1)[0];
      return buffer != null ? buffer.destroy() : void 0;
    };

    Project.prototype.scan = function(regex, options, iterator) {
      var buffer, deferred, filePath, matches, promise, searchOptions, task, _i, _len, _ref1;
      if (options == null) {
        options = {};
      }
      if (_.isFunction(options)) {
        iterator = options;
        options = {};
      }
      deferred = Q.defer();
      searchOptions = {
        ignoreCase: regex.ignoreCase,
        inclusions: options.paths,
        includeHidden: true,
        excludeVcsIgnores: atom.config.get('core.excludeVcsIgnoredPaths'),
        exclusions: atom.config.get('core.ignoredNames')
      };
      task = Task.once(require.resolve('./scan-handler'), this.getPath(), regex.source, searchOptions, function() {
        return deferred.resolve();
      });
      task.on('scan:result-found', (function(_this) {
        return function(result) {
          if (!_this.isPathModified(result.filePath)) {
            return iterator(result);
          }
        };
      })(this));
      if (_.isFunction(options.onPathsSearched)) {
        task.on('scan:paths-searched', function(numberOfPathsSearched) {
          return options.onPathsSearched(numberOfPathsSearched);
        });
      }
      _ref1 = this.getBuffers();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        buffer = _ref1[_i];
        if (!(buffer.isModified())) {
          continue;
        }
        filePath = buffer.getPath();
        if (!this.contains(filePath)) {
          continue;
        }
        matches = [];
        buffer.scan(regex, function(match) {
          return matches.push(match);
        });
        if (matches.length > 0) {
          iterator({
            filePath: filePath,
            matches: matches
          });
        }
      }
      promise = deferred.promise;
      promise.cancel = function() {
        task.terminate();
        return deferred.resolve('cancelled');
      };
      return promise;
    };

    Project.prototype.replace = function(regex, replacementText, filePaths, iterator) {
      var buffer, checkFinished, deferred, flags, inProcessFinished, openPaths, outOfProcessFinished, outOfProcessPaths, replacements, task, _i, _len, _ref1, _ref2;
      deferred = Q.defer();
      openPaths = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.getBuffers();
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          buffer = _ref1[_i];
          _results.push(buffer.getPath());
        }
        return _results;
      }).call(this);
      outOfProcessPaths = _.difference(filePaths, openPaths);
      inProcessFinished = !openPaths.length;
      outOfProcessFinished = !outOfProcessPaths.length;
      checkFinished = function() {
        if (outOfProcessFinished && inProcessFinished) {
          return deferred.resolve();
        }
      };
      if (!outOfProcessFinished.length) {
        flags = 'g';
        if (regex.ignoreCase) {
          flags += 'i';
        }
        task = Task.once(require.resolve('./replace-handler'), outOfProcessPaths, regex.source, flags, replacementText, function() {
          outOfProcessFinished = true;
          return checkFinished();
        });
        task.on('replace:path-replaced', iterator);
      }
      _ref1 = this.getBuffers();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        buffer = _ref1[_i];
        if (_ref2 = buffer.getPath(), __indexOf.call(filePaths, _ref2) < 0) {
          continue;
        }
        replacements = buffer.replace(regex, replacementText, iterator);
        if (replacements) {
          iterator({
            filePath: buffer.getPath(),
            replacements: replacements
          });
        }
      }
      inProcessFinished = true;
      checkFinished();
      return deferred.promise;
    };

    Project.prototype.buildEditorForBuffer = function(buffer, editorOptions) {
      var editor;
      editor = new Editor(_.extend({
        buffer: buffer
      }, editorOptions));
      this.addEditor(editor);
      return editor;
    };

    Project.prototype.eachBuffer = function() {
      var args, buffer, callback, subscriber, _i, _len, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length > 1) {
        subscriber = args.shift();
      }
      callback = args.shift();
      _ref1 = this.getBuffers();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        buffer = _ref1[_i];
        callback(buffer);
      }
      if (subscriber) {
        return subscriber.subscribe(this, 'buffer-created', function(buffer) {
          return callback(buffer);
        });
      } else {
        return this.on('buffer-created', function(buffer) {
          return callback(buffer);
        });
      }
    };

    Project.prototype.registerOpener = function(opener) {
      return this.openers.push(opener);
    };

    Project.prototype.unregisterOpener = function(opener) {
      return _.remove(this.openers, opener);
    };

    Project.prototype.eachEditor = function(callback) {
      var editor, _i, _len, _ref1;
      _ref1 = this.getEditors();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        editor = _ref1[_i];
        callback(editor);
      }
      return this.on('editor-created', function(editor) {
        return callback(editor);
      });
    };

    Project.prototype.getEditors = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, this.editors, function(){});
    };

    return Project;

  })(Model);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/project.js.map
