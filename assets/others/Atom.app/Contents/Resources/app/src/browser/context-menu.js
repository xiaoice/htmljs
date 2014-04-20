(function() {
  var ContextMenu, Menu;

  Menu = require('menu');

  module.exports = ContextMenu = (function() {
    function ContextMenu(template, browserWindow) {
      var menu;
      template = this.createClickHandlers(template);
      menu = Menu.buildFromTemplate(template);
      menu.popup(browserWindow);
    }

    ContextMenu.prototype.createClickHandlers = function(template) {
      var item, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = template.length; _i < _len; _i++) {
        item = template[_i];
        if (item.command) {
          (item.commandOptions != null ? item.commandOptions : item.commandOptions = {}).contextCommand = true;
          item.click = (function(item) {
            return (function(_this) {
              return function() {
                return global.atomApplication.sendCommand(item.command, item.commandOptions);
              };
            })(this);
          })(item);
        }
        _results.push(item);
      }
      return _results;
    };

    return ContextMenu;

  })();

}).call(this);

//# sourceMappingURL=/../../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/browser/context-menu.js.map
