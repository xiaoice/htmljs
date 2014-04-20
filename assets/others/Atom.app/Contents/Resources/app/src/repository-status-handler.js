(function() {
  var Git, path;

  Git = require('git-utils');

  path = require('path');

  module.exports = function(repoPath) {
    var branch, filePath, repo, status, statuses, upstream, workingDirectoryPath, _ref;
    repo = Git.open(repoPath);
    if (repo != null) {
      workingDirectoryPath = repo.getWorkingDirectory();
      statuses = {};
      _ref = repo.getStatus();
      for (filePath in _ref) {
        status = _ref[filePath];
        statuses[path.join(workingDirectoryPath, filePath)] = status;
      }
      upstream = repo.getAheadBehindCount();
      branch = repo.getHead();
      repo.release();
    } else {
      upstream = {};
      statuses = {};
      branch = null;
    }
    return {
      statuses: statuses,
      upstream: upstream,
      branch: branch
    };
  };

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/repository-status-handler.js.map
