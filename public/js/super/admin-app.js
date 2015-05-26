'use strict';

// Declare app level module which depends on filters, and services
angular.module('superApp', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.datetimepicker',
    'superRestaurantServices', 'superDataServices',
    'superDataUserServices', 'superDataPlayServices', 'superDataGiftServices',
    'superDataUserDetailServices', 'superDataPlayDetailServices', 'superDataGiftDetailServices']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/toRestaurantData/:restaurantId', {
        templateUrl: '../super/to-restaurant-data',
        controller: RestaurantDataCtrl
      }).
      when('/toViewUserData', {
        templateUrl: '../super/to-view-user-data',
        controller: ViewUserDataCtrl
      }).
      when('/toViewUserData/:restaurantId', {
        templateUrl: '../super/to-view-user-data',
        controller: ViewUserDataCtrl
      }).
      when('/toViewPlayData', {
        templateUrl: '../super/to-view-play-data',
        controller: ViewPlayDataCtrl
      }).
      when('/toViewPlayData/:restaurantId', {
        templateUrl: '../super/to-view-play-data',
        controller: ViewPlayDataCtrl
      }).
      when('/toViewGiftData', {
        templateUrl: '../super/to-view-gift-data',
        controller: ViewGiftDataCtrl
      }).
      when('/toViewGiftData/:restaurantId', {
        templateUrl: '../super/to-view-gift-data',
        controller: ViewGiftDataCtrl
      }).
      otherwise({
        redirectTo: '/'
      });
  }]).
  directive('dateFormat', ['$filter',function($filter) {
    var dateFilter = $filter('date');
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {

        function formatter(value) {
          return dateFilter(value, 'yyyy-MM-dd'); //format
        }

        function parser() {
          return ctrl.$modelValue;
        }

        ctrl.$formatters.push(formatter);
        ctrl.$parsers.unshift(parser);

      }
    };
  }]).
  filter('dateFormat', ['$filter', function($filter) {
    var dateFilter = $filter('date');
    return function(val) {
      return dateFilter(val, 'yyyy-MM-dd');
    }
  }])