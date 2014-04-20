(function() {
  var Emitter, Git, GitUtils, Subscriber, Task, fs, _, _ref;

  _ = require('underscore-plus');

  fs = require('fs-plus');

  Task = require('./task');

  _ref = require('emissary'), Emitter = _ref.Emitter, Subscriber = _ref.Subscriber;

  GitUtils = require('git-utils');

  module.exports = Git = (function() {
    Emitter.includeInto(Git);

    Subscriber.includeInto(Git);

    Git.open = function(path, options) {
      if (!path) {
        return null;
      }
      try {
        return new Git(path, options);
      } catch (_error) {
        return null;
      }
    };

    Git.exists = function(path) {
      var git;
      if (git = this.open(path)) {
        git.destroy();
        return true;
      } else {
        return false;
      }
    };

    function Git(path, options) {
      var $, refreshOnWindowFocus;
      if (options == null) {
        options = {};
      }
      this.repo = GitUtils.open(path);
      if (this.repo == null) {
        throw new Error("No Git repository found searching path: " + path);
      }
      this.statuses = {};
      this.upstream = {
        ahead: 0,
        behind: 0
      };
      this.project = options.project, refreshOnWindowFocus = options.refreshOnWindowFocus;
      if (refreshOnWindowFocus == null) {
        refreshOnWindowFocus = true;
      }
      if (refreshOnWindowFocus) {
        $ = require('./space-pen-extensions').$;
        this.subscribe($(window), 'focus', (function(_this) {
          return function() {
            _this.refreshIndex();
            return _this.refreshStatus();
          };
        })(this));
      }
      if (this.project != null) {
        this.subscribe(this.project.eachBuffer((function(_this) {
          return function(buffer) {
            return _this.subscribeToBuffer(buffer);
          };
        })(this)));
      }
    }

    Git.prototype.subscribeToBuffer = function(buffer) {
      this.subscribe(buffer, 'saved reloaded path-changed', (function(_this) {
        return function() {
          var path;
          if (path = buffer.getPath()) {
            return _this.getPathStatus(path);
          }
        };
      })(this));
      return this.subscribe(buffer, 'destroyed', (function(_this) {
        return function() {
          return _this.unsubscribe(buffer);
        };
      })(this));
    };

    Git.prototype.destroy = function() {
      if (this.statusTask != null) {
        this.statusTask.terminate();
        this.statusTask = null;
      }
      if (this.repo != null) {
        this.repo.release();
        this.repo = null;
      }
      return this.unsubscribe();
    };

    Git.prototype.getRepo = function() {
      if (this.repo == null) {
        throw new Error("Repository has been destroyed");
      }
      return this.repo;
    };

    Git.prototype.refreshIndex = function() {
      return this.getRepo().refreshIndex();
    };

    Git.prototype.getPath = function() {
      return this.path != null ? this.path : this.path = fs.absolute(this.getRepo().getPath());
    };

    Git.prototype.getWorkingDirectory = function() {
      return this.getRepo().getWorkingDirectory();
    };

    Git.prototype.getPathStatus = function(path) {
      var currentPathStatus, pathStatus, _ref1, _ref2;
      currentPathStatus = (_ref1 = this.statuses[path]) != null ? _ref1 : 0;
      pathStatus = (_ref2 = this.getRepo().getStatus(this.relativize(path))) != null ? _ref2 : 0;
      if (pathStatus > 0) {
        this.statuses[path] = pathStatus;
      } else {
        delete this.statuses[path];
      }
      if (currentPathStatus !== pathStatus) {
        this.emit('status-changed', path, pathStatus);
      }
      return pathStatus;
    };

    Git.prototype.isPathIgnored = function(path) {
      return this.getRepo().isIgnored(this.relativize(path));
    };

    Git.prototype.isStatusModified = function(status) {
      return this.getRepo().isStatusModified(status);
    };

    Git.prototype.isPathModified = function(path) {
      return this.isStatusModified(this.getPathStatus(path));
    };

    Git.prototype.isStatusNew = function(status) {
      return this.getRepo().isStatusNew(status);
    };

    Git.prototype.isPathNew = function(path) {
      return this.isStatusNew(this.getPathStatus(path));
    };

    Git.prototype.isProjectAtRoot = function() {
      var _ref1;
      return this.projectAtRoot != null ? this.projectAtRoot : this.projectAtRoot = ((_ref1 = this.project) != null ? _ref1.relativize(this.getWorkingDirectory()) : void 0) === '';
    };

    Git.prototype.relativize = function(path) {
      return this.getRepo().relativize(path);
    };

    Git.prototype.getShortHead = function() {
      return this.getRepo().getShortHead();
    };

    Git.prototype.checkoutHead = function(path) {
      var headCheckedOut;
      headCheckedOut = this.getRepo().checkoutHead(this.relativize(path));
      if (headCheckedOut) {
        this.getPathStatus(path);
      }
      return headCheckedOut;
    };

    Git.prototype.checkoutReference = function(reference, create) {
      return this.getRepo().checkoutReference(reference, create);
    };

    Git.prototype.getDiffStats = function(path) {
      return this.getRepo().getDiffStats(this.relativize(path));
    };

    Git.prototype.isSubmodule = function(path) {
      return this.getRepo().isSubmodule(this.relativize(path));
    };

    Git.prototype.getDirectoryStatus = function(directoryPath) {
      var directoryStatus, path, sep, status, _ref1;
      sep = require('path').sep;
      directoryPath = "" + directoryPath + sep;
      directoryStatus = 0;
      _ref1 = this.statuses;
      for (path in _ref1) {
        status = _ref1[path];
        if (path.indexOf(directoryPath) === 0) {
          directoryStatus |= status;
        }
      }
      return directoryStatus;
    };

    Git.prototype.getLineDiffs = function(path, text) {
      var options;
      options = {
        ignoreEolWhitespace: process.platform === 'win32'
      };
      return this.getRepo().getLineDiffs(this.relativize(path), text, options);
    };

    Git.prototype.getConfigValue = function(key) {
      return this.getRepo().getConfigValue(key);
    };

    Git.prototype.getOriginUrl = function() {
      return this.getConfigValue('remote.origin.url');
    };

    Git.prototype.getUpstreamBranch = function() {
      return this.getRepo().getUpstreamBranch();
    };

    Git.prototype.getReferenceTarget = function(reference) {
      return this.getRepo().getReferenceTarget(reference);
    };

    Git.prototype.getReferences = function() {
      return this.getRepo().getReferences();
    };

    Git.prototype.getAheadBehindCount = function(reference) {
      return this.getRepo().getAheadBehindCount(reference);
    };

    Git.prototype.hasBranch = function(branch) {
      return this.getReferenceTarget("refs/heads/" + branch) != null;
    };

    Git.prototype.refreshStatus = function() {
      return this.statusTask = Task.once(require.resolve('./repository-status-handler'), this.getPath(), (function(_this) {
        return function(_arg) {
          var branch, statuses, statusesUnchanged, upstream;
          statuses = _arg.statuses, upstream = _arg.upstream, branch = _arg.branch;
          statusesUnchanged = _.isEqual(statuses, _this.statuses) && _.isEqual(upstream, _this.upstream) && _.isEqual(branch, _this.branch);
          _this.statuses = statuses;
          _this.upstream = upstream;
          _this.branch = branch;
          if (!statusesUnchanged) {
            return _this.emit('statuses-changed');
          }
        };
      })(this));
    };

    return Git;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/git.js.map
