(function() {
  var Emitter, Task, child_process, _,
    __slice = [].slice;

  _ = require('underscore-plus');

  child_process = require('child_process');

  Emitter = require('emissary').Emitter;

  module.exports = Task = (function() {
    Emitter.includeInto(Task);

    Task.once = function() {
      var args, task, taskPath;
      taskPath = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      task = new Task(taskPath);
      task.once('task:completed', function() {
        return task.terminate();
      });
      task.start.apply(task, args);
      return task;
    };

    Task.prototype.callback = null;

    function Task(taskPath) {
      var args, bootstrap, coffeeCacheRequire, coffeeScriptRequire, env, taskBootstrapRequire;
      coffeeCacheRequire = "require('" + (require.resolve('./coffee-cache')) + "').register();";
      coffeeScriptRequire = "require('" + (require.resolve('coffee-script')) + "').register();";
      taskBootstrapRequire = "require('" + (require.resolve('./task-bootstrap')) + "');";
      bootstrap = "" + coffeeScriptRequire + "\n" + coffeeCacheRequire + "\n" + taskBootstrapRequire;
      bootstrap = bootstrap.replace(/\\/g, "\\\\");
      taskPath = require.resolve(taskPath);
      taskPath = taskPath.replace(/\\/g, "\\\\");
      env = _.extend({}, process.env, {
        taskPath: taskPath,
        userAgent: navigator.userAgent
      });
      args = [bootstrap, '--harmony_collections'];
      this.childProcess = child_process.fork('--eval', args, {
        env: env,
        cwd: __dirname
      });
      this.on("task:log", function() {
        return console.log.apply(console, arguments);
      });
      this.on("task:warn", function() {
        return console.warn.apply(console, arguments);
      });
      this.on("task:error", function() {
        return console.error.apply(console, arguments);
      });
      this.on("task:completed", (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return typeof _this.callback === "function" ? _this.callback.apply(_this, args) : void 0;
        };
      })(this));
      this.handleEvents();
    }

    Task.prototype.handleEvents = function() {
      this.childProcess.removeAllListeners();
      return this.childProcess.on('message', (function(_this) {
        return function(_arg) {
          var args, event;
          event = _arg.event, args = _arg.args;
          return _this.emit.apply(_this, [event].concat(__slice.call(args)));
        };
      })(this));
    };

    Task.prototype.start = function() {
      var args, callback, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      if (this.childProcess == null) {
        throw new Error("Cannot start terminated process");
      }
      this.handleEvents();
      if (_.isFunction(callback)) {
        this.callback = callback;
      } else {
        args = arguments;
      }
      return this.send({
        event: 'start',
        args: args
      });
    };

    Task.prototype.send = function(message) {
      if (this.childProcess == null) {
        throw new Error("Cannot send message to terminated process");
      }
      return this.childProcess.send(message);
    };

    Task.prototype.terminate = function() {
      if (this.childProcess == null) {
        return;
      }
      this.childProcess.removeAllListeners();
      this.childProcess.kill();
      this.childProcess = null;
      return this.off();
    };

    return Task;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/task.js.map
