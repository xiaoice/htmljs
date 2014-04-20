(function() {
  var async, fs, mkdirp, path, runas, symlinkCommand, symlinkCommandWithPrivilegeSync, _;

  path = require('path');

  _ = require('underscore-plus');

  async = require('async');

  fs = require('fs-plus');

  mkdirp = require('mkdirp');

  runas = require('runas');

  symlinkCommand = function(sourcePath, destinationPath, callback) {
    return fs.unlink(destinationPath, function(error) {
      if ((error != null) && (error != null ? error.code : void 0) !== 'ENOENT') {
        return callback(error);
      } else {
        return mkdirp(path.dirname(destinationPath), function(error) {
          if (error != null) {
            return callback(error);
          } else {
            return fs.symlink(sourcePath, destinationPath, callback);
          }
        });
      }
    });
  };

  symlinkCommandWithPrivilegeSync = function(sourcePath, destinationPath) {
    if (runas('/bin/rm', ['-f', destinationPath], {
      admin: true
    }) !== 0) {
      throw new Error("Failed to remove '" + destinationPath + "'");
    }
    if (runas('/bin/mkdir', ['-p', path.dirname(destinationPath)], {
      admin: true
    }) !== 0) {
      throw new Error("Failed to create directory '" + destinationPath + "'");
    }
    if (runas('/bin/ln', ['-s', sourcePath, destinationPath], {
      admin: true
    }) !== 0) {
      throw new Error("Failed to symlink '" + sourcePath + "' to '" + destinationPath + "'");
    }
  };

  module.exports = {
    getInstallDirectory: function() {
      return "/usr/local/bin";
    },
    install: function(commandPath, askForPrivilege, callback) {
      var commandName, destinationPath;
      if (process.platform !== 'darwin') {
        return;
      }
      commandName = path.basename(commandPath, path.extname(commandPath));
      destinationPath = path.join(this.getInstallDirectory(), commandName);
      return fs.readlink(destinationPath, function(error, realpath) {
        if (realpath === commandPath) {
          callback();
          return;
        }
        return symlinkCommand(commandPath, destinationPath, (function(_this) {
          return function(error) {
            if (askForPrivilege && (error != null ? error.code : void 0) === 'EACCES') {
              try {
                error = null;
                symlinkCommandWithPrivilegeSync(commandPath, destinationPath);
              } catch (_error) {
                error = _error;
              }
            }
            return typeof callback === "function" ? callback(error) : void 0;
          };
        })(this));
      });
    },
    installAtomCommand: function(resourcePath, askForPrivilege, callback) {
      var commandPath;
      commandPath = path.join(resourcePath, 'atom.sh');
      return this.install(commandPath, askForPrivilege, callback);
    },
    installApmCommand: function(resourcePath, askForPrivilege, callback) {
      var commandPath;
      commandPath = path.join(resourcePath, 'apm', 'node_modules', '.bin', 'apm');
      return this.install(commandPath, askForPrivilege, callback);
    }
  };

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/command-installer.js.map
