(function() {
  var app, crashReporter, dialog, fs, module, nslog, optimist, parseCommandLine, path, setupCrashReporter, start,
    __slice = [].slice;

  global.shellStartTime = Date.now();

  crashReporter = require('crash-reporter');

  app = require('app');

  fs = require('fs');

  module = require('module');

  path = require('path');

  optimist = require('optimist');

  nslog = require('nslog');

  dialog = require('dialog');

  console.log = function() {
    var args, output;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    output = args.map(function(arg) {
      return JSON.stringify(arg);
    }).join(" ");
    nslog(output);
    if (process.platform !== 'darwin') {
      return fs.writeFileSync('debug.log', output, {
        flag: 'a'
      });
    }
  };

  process.on('uncaughtException', function(error) {
    if (error == null) {
      error = {};
    }
    if (error.message != null) {
      nslog(error.message);
    }
    if (error.stack != null) {
      return nslog(error.stack);
    }
  });

  start = function() {
    var addPathToOpen, addUrlToOpen, args;
    args = parseCommandLine();
    addPathToOpen = function(event, pathToOpen) {
      event.preventDefault();
      return args.pathsToOpen.push(pathToOpen);
    };
    args.urlsToOpen = [];
    addUrlToOpen = function(event, urlToOpen) {
      event.preventDefault();
      return args.urlsToOpen.push(urlToOpen);
    };
    app.on('open-url', function(event, urlToOpen) {
      event.preventDefault();
      return args.urlsToOpen.push(urlToOpen);
    });
    app.on('open-file', addPathToOpen);
    app.on('open-url', addUrlToOpen);
    app.on('will-finish-launching', function() {
      return setupCrashReporter();
    });
    return app.on('finish-launching', function() {
      var AtomApplication;
      app.removeListener('open-file', addPathToOpen);
      app.removeListener('open-url', addUrlToOpen);
      args.pathsToOpen = args.pathsToOpen.map(function(pathToOpen) {
        var _ref;
        return path.resolve((_ref = args.executedFrom) != null ? _ref : process.cwd(), pathToOpen);
      });
      require('coffee-script').register();
      if (args.devMode) {
        require(path.join(args.resourcePath, 'src', 'coffee-cache')).register();
        AtomApplication = require(path.join(args.resourcePath, 'src', 'browser', 'atom-application'));
      } else {
        AtomApplication = require('./atom-application');
      }
      AtomApplication.open(args);
      if (!args.test) {
        return console.log("App load time: " + (Date.now() - global.shellStartTime) + "ms");
      }
    });
  };

  global.devResourcePath = path.join(app.getHomeDir(), 'github', 'atom');

  setupCrashReporter = function() {
    return crashReporter.start({
      productName: 'Atom',
      companyName: 'GitHub'
    });
  };

  parseCommandLine = function() {
    var args, devMode, executedFrom, logFile, newWindow, options, pathsToOpen, pidToKillWhenClosed, resourcePath, specDirectory, test, version;
    version = app.getVersion();
    options = optimist(process.argv.slice(1));
    options.usage("Atom Editor v" + version + "\n\nUsage: atom [options] [file ...]");
    options.alias('d', 'dev').boolean('d').describe('d', 'Run in development mode.');
    options.alias('f', 'foreground').boolean('f').describe('f', 'Keep the browser process in the foreground.');
    options.alias('h', 'help').boolean('h').describe('h', 'Print this usage message.');
    options.alias('l', 'log-file').string('l').describe('l', 'Log all output to file.');
    options.alias('n', 'new-window').boolean('n').describe('n', 'Open a new window.');
    options.alias('s', 'spec-directory').string('s').describe('s', 'Set the directory from which specs are loaded (default: Atom\'s spec directory).');
    options.alias('t', 'test').boolean('t').describe('t', 'Run the specified specs and exit with error code on failures.');
    options.alias('v', 'version').boolean('v').describe('v', 'Print the version.');
    options.alias('w', 'wait').boolean('w').describe('w', 'Wait for window to be closed before returning.');
    args = options.argv;
    if (args.help) {
      process.stdout.write(options.help());
      process.exit(0);
    }
    if (args.version) {
      process.stdout.write("" + version + "\n");
      process.exit(0);
    }
    executedFrom = args['executed-from'];
    devMode = args['dev'];
    pathsToOpen = args._;
    if (executedFrom && pathsToOpen.length === 0) {
      pathsToOpen = [executedFrom];
    }
    test = args['test'];
    specDirectory = args['spec-directory'];
    newWindow = args['new-window'];
    if (args['wait']) {
      pidToKillWhenClosed = args['pid'];
    }
    logFile = args['log-file'];
    if (args['resource-path']) {
      devMode = true;
      resourcePath = args['resource-path'];
    } else if (devMode) {
      resourcePath = global.devResourcePath;
    }
    try {
      fs.statSync(resourcePath);
    } catch (_error) {
      resourcePath = path.dirname(path.dirname(__dirname));
    }
    return {
      resourcePath: resourcePath,
      pathsToOpen: pathsToOpen,
      executedFrom: executedFrom,
      test: test,
      version: version,
      pidToKillWhenClosed: pidToKillWhenClosed,
      devMode: devMode,
      newWindow: newWindow,
      specDirectory: specDirectory,
      logFile: logFile
    };
  };

  start();

}).call(this);

//# sourceMappingURL=/../../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/browser/main.js.map
