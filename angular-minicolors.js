'format cjs';
'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['angular', '@claviska/jquery-minicolors'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('angular'), require('@claviska/jquery-minicolors'));
    module.exports = 'minicolors';
  } else {
    root.angularMinicolors = factory(root.angular, root.jqueryMinicolors);
  }
})(this, function (angular) {

  angular.module('minicolors', []);

  angular.module('minicolors').provider('minicolors', function () {
    this.defaults = {
      theme: 'bootstrap',
      position: 'top left',
      defaultValue: '',
      animationSpeed: 50,
      animationEasing: 'swing',
      change: null,
      changeDelay: 0,
      control: 'hue',
      hide: null,
      hideSpeed: 100,
      inline: false,
      letterCase: 'lowercase',
      opacity: false,
      show: null,
      showSpeed: 100,
      format: 'hex',
      keywords: '',
      swatches: []
    };

    this.$get = function () {
      return this;
    };

  });

  angular.module('minicolors').directive('minicolors', ['minicolors', '$timeout', function (minicolors, $timeout) {
    return {
      require: '?ngModel',
      restrict: 'A',
      priority: 1, //since we bind on an input element, we have to set a higher priority than angular-default input
      link: function (scope, element, attrs, ngModel) {

        let initialized = false;

        //gets the settings object
        const getSettings = function () {
          const config = angular.extend({}, minicolors.defaults, scope.$eval(attrs.minicolors));
          return config;
        };

        /**
         * check if value is valid color value
         * e.g.#fff000 or #fff
         * @param color
         */
        function isHEX(color, testShortHex) {
          return (testShortHex && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) ||
            /^#([A-Fa-f0-9]{6})$/.test(color);
        }

        function isRGB(color) {
          const rgb = (color || '').match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
          return (rgb && rgb.length === 4) ? true : false;
        }

        function isValidColor(color) {
          return isHEX(color, true) || isRGB(color);
        }

        function canSetValue() {
          return (element.data('minicolors-settings') !== null);
        }

        function isEmpty(value) {
          return value === null || value === undefined || String(value).trim() === '';
        }

        function fixCase(value) {

          if (!value) return null;

          switch ((getSettings().letterCase || '').toLowerCase()) {
            case 'uppercase':
              value = value.toUpperCase();
              break;
            case 'lowercase':
              value = value.toLowerCase();
              break;
          }

          return value;
        }

        /**
         * set color value as minicolors internal color value
         * @param color
         */
        function setMinicolorsValue(color) {

          if (!canSetValue()) return;

          if (isHEX(color, true)) {
            element.minicolors('value', {color: sanitizeColor(color), opacity: 1});
          } else {
            element.minicolors('value', sanitizeColor(color));
          }
        }

        function sanitizeColor(color) {

          // console.log('color -> ' + color);

          if (isEmpty(color) || !isValidColor(color)) {
            // console.log('invalid color -> ' + color);
            return null;
          }

          color = fixCase(color);
          // console.log('sanitizedColor -> ' + color);
          return color;
        }

        //what to do if the value changed
        ngModel.$render = function () {

          //we are in digest or apply, and therefore call a timeout function
          $timeout(function () {
            const color = ngModel.$viewValue;
            if (isValidColor(color)) {
              setMinicolorsValue(color);
            }
          }, 0, false);
        };

        //init method
        const initMinicolors = function () {

          if (!ngModel) {
            return;
          }
          const settings = getSettings();
          settings.change = function (color, opacity) {
            scope.$apply(function () {
              // console.log('change -> ' + color);
              ngModel.$setViewValue(sanitizeColor(color));
            });
          };

          //destroy the old colorpicker if one already exists
          if (element.hasClass('minicolors-input')) {
            element.minicolors('destroy');
            element.off('blur', onBlur);
          }

          // Create the new minicolors widget
          element.minicolors(settings);

          // hook up into the jquery-minicolors onBlur event.
          element.on('blur', onBlur);

          // are we initialized yet ?
          //needs to be wrapped in $timeout, to prevent $apply / $digest errors
          //$scope.$apply will be called by $timeout, so we don't have to handle that case
          if (!initialized) {
            $timeout(function () {
              const color = ngModel.$viewValue;
              setMinicolorsValue(color);
            }, 0);
            initialized = true;
            return;
          }

          function onBlur(e) {
            scope.$apply(function () {
              const color = sanitizeColor(element.minicolors('value'));
              // console.log('blur -> ' + color);
              ngModel.$setViewValue(color);
              setMinicolorsValue(color);
            });
          }

        };

        initMinicolors();

        // Watch for changes to the directives options and then call init method again
        const unbindWatch = scope.$watch(getSettings, initMinicolors, true);

        scope.$on('$destroy', function () {
          if (element.hasClass('minicolors-input')) {
            element.minicolors('destroy');
            element.remove();
          }
          if (unbindWatch) unbindWatch();
        });

      }
    };
  }]);
});
