(function() {
  var $, $$, GrammarRegistry, ScopeSelector, Subscriber, Syntax, Token, specificity, _, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  _ = require('underscore-plus');

  specificity = require('clear-cut').specificity;

  Subscriber = require('emissary').Subscriber;

  _ref = require('first-mate'), GrammarRegistry = _ref.GrammarRegistry, ScopeSelector = _ref.ScopeSelector;

  _ref1 = require('./space-pen-extensions'), $ = _ref1.$, $$ = _ref1.$$;

  Token = require('./token');

  module.exports = Syntax = (function(_super) {
    __extends(Syntax, _super);

    Subscriber.includeInto(Syntax);

    atom.deserializers.add(Syntax);

    Syntax.deserialize = function(_arg) {
      var grammarOverridesByPath, syntax;
      grammarOverridesByPath = _arg.grammarOverridesByPath;
      syntax = new Syntax();
      syntax.grammarOverridesByPath = grammarOverridesByPath;
      return syntax;
    };

    function Syntax() {
      Syntax.__super__.constructor.apply(this, arguments);
      this.scopedPropertiesIndex = 0;
      this.scopedProperties = [];
    }

    Syntax.prototype.serialize = function() {
      return {
        deserializer: this.constructor.name,
        grammarOverridesByPath: this.grammarOverridesByPath
      };
    };

    Syntax.prototype.createToken = function(value, scopes) {
      return new Token({
        value: value,
        scopes: scopes
      });
    };

    Syntax.prototype.addProperties = function() {
      var args, name, properties, selector;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length > 2) {
        name = args.shift();
      }
      selector = args[0], properties = args[1];
      return this.scopedProperties.unshift({
        name: name,
        selector: selector,
        properties: properties,
        specificity: specificity(selector),
        index: this.scopedPropertiesIndex++
      });
    };

    Syntax.prototype.removeProperties = function(name) {
      var properties, _i, _len, _ref2, _results;
      _ref2 = this.scopedProperties.filter(function(properties) {
        return properties.name === name;
      });
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        properties = _ref2[_i];
        _results.push(_.remove(this.scopedProperties, properties));
      }
      return _results;
    };

    Syntax.prototype.clearProperties = function() {
      this.scopedProperties = [];
      return this.scopedPropertiesIndex = 0;
    };

    Syntax.prototype.getProperty = function(scope, keyPath) {
      var object, value, _i, _len, _ref2;
      _ref2 = this.propertiesForScope(scope, keyPath);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        object = _ref2[_i];
        value = _.valueForKeyPath(object, keyPath);
        if (value != null) {
          return value;
        }
      }
      return void 0;
    };

    Syntax.prototype.propertiesForScope = function(scope, keyPath) {
      var candidates, element, matchingProperties;
      matchingProperties = [];
      candidates = this.scopedProperties.filter(function(_arg) {
        var properties;
        properties = _arg.properties;
        return _.valueForKeyPath(properties, keyPath) != null;
      });
      if (candidates.length) {
        element = this.buildScopeElement(scope);
        while (element) {
          matchingProperties.push.apply(matchingProperties, this.matchingPropertiesForElement(element, candidates));
          element = element.parentNode;
        }
      }
      return matchingProperties;
    };

    Syntax.prototype.matchingPropertiesForElement = function(element, candidates) {
      var matchingScopedProperties;
      matchingScopedProperties = candidates.filter(function(_arg) {
        var selector;
        selector = _arg.selector;
        return $.find.matchesSelector(element, selector);
      });
      matchingScopedProperties.sort(function(a, b) {
        if (a.specificity === b.specificity) {
          return b.index - a.index;
        } else {
          return b.specificity - a.specificity;
        }
      });
      return _.pluck(matchingScopedProperties, 'properties');
    };

    Syntax.prototype.buildScopeElement = function(scope) {
      var deepestChild, element;
      scope = scope.slice();
      element = $$(function() {
        var elementsForRemainingScopes;
        elementsForRemainingScopes = (function(_this) {
          return function() {
            var classString, classes;
            classString = scope.shift();
            classes = classString.replace(/^\./, '').replace(/\./g, ' ');
            if (scope.length) {
              return _this.div({
                "class": classes
              }, elementsForRemainingScopes);
            } else {
              return _this.div({
                "class": classes
              });
            }
          };
        })(this);
        return elementsForRemainingScopes();
      });
      deepestChild = element.find(":not(:has(*))");
      if (deepestChild.length) {
        return deepestChild[0];
      } else {
        return element[0];
      }
    };

    Syntax.prototype.cssSelectorFromScopeSelector = function(scopeSelector) {
      return new ScopeSelector(scopeSelector).toCssSelector();
    };

    return Syntax;

  })(GrammarRegistry);

}).call(this);

//# sourceMappingURL=/../../../../../../..//tmp/atom-build/Atom.app/Contents/Resources/app/src/syntax.js.map
