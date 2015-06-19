'use strict';

// Declare app level module which depends on filters, and services
angular.module('superApp', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.datetimepicker',
    'ngFileUpload',
    'superRestaurantServices', 'superUserServices',
    'superMediaServices', 'superDataServices',
    'superDataUserServices', 'superDataPlayServices', 'superDataGiftServices',
    'superDataUserDetailServices', 'superDataPlayDetailServices', 'superDataGiftDetailServices',
    'superCouponServices', 'superSeasonServices', 'superFoodServices', 'superAdminServices']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/super/to-data',
        controller: DataCtrl
      }).
      when('/toRestaurantData', {
        templateUrl: '/super/to-data',
        controller: DataCtrl
      }).
      when('/toRestaurantData/:restaurantId', {
        templateUrl: '/super/to-restaurant-data',
        controller: RestaurantDataCtrl
      }).
      when('/toViewUserData', {
        templateUrl: '/super/to-view-user-data',
        controller: ViewUserDataCtrl
      }).
      when('/toViewUserData/:restaurantId', {
        templateUrl: '/super/to-view-user-data',
        controller: ViewUserDataCtrl
      }).
      when('/toViewPlayData', {
        templateUrl: '/super/to-view-play-data',
        controller: ViewPlayDataCtrl
      }).
      when('/toViewPlayData/:restaurantId', {
        templateUrl: '/super/to-view-play-data',
        controller: ViewPlayDataCtrl
      }).
      when('/toViewGiftData', {
        templateUrl: '/super/to-view-gift-data',
        controller: ViewGiftDataCtrl
      }).
      when('/toViewGiftData/:restaurantId', {
        templateUrl: '/super/to-view-gift-data',
        controller: ViewGiftDataCtrl
      }).
      when('/toAdmins', {
        templateUrl: '/super/to-admins',
        controller: AdminCtrl
      }).
      when('/toAddAdmin', {
        templateUrl: '/super/to-add-admin',
        controller: AddAdminCtrl
      }).
      when('/toUpdateAdmin/:adminId', {
        templateUrl: '/super/to-update-admin',
        controller: UpdateAdminCtrl
      }).
      when('/toRestaurants', {
        templateUrl: '/super/to-restaurants',
        controller: RestaurantCtrl
      }).
      when('/toAddRestaurant', {
        templateUrl: '/super/to-add-restaurant',
        controller: AddRestaurantCtrl
      }).
      when('/toUpdateRestaurant/:restaurantId', {
        templateUrl: '/super/to-update-restaurant',
        controller: UpdateRestaurantCtrl
      }).
      when('/toUsers', {
        templateUrl: '/super/to-users',
        controller: UserCtrl
      }).
      when('/toUsers/restaurant/:restaurantId', {
        templateUrl: '/super/to-users',
        controller: UserCtrl
      }).
      when('/toCheckVoice', {
        templateUrl: '/super/to-check-voice',
        controller: CheckVoiceCtrl
      }).
      when('/toCheckVoice/restaurant/:restaurantId', {
        templateUrl: '/super/to-check-voice',
        controller: CheckVoiceCtrl
      }).
      when('/toCheckVoice/user/:appId', {
        templateUrl: '/super/to-check-voice',
        controller: CheckVoiceCtrl
      }).
      when('/toCoupons', {
        templateUrl: '/super/to-coupons',
        controller: CouponCtrl
      }).
      when('/toAddCoupon', {
        templateUrl: '/super/to-add-coupon',
        controller: AddCouponCtrl
      }).
      when('/toUpdateCoupon/:couponId', {
        templateUrl: '/super/to-update-coupon',
        controller: UpdateCouponCtrl
      }).
      when('/toSeasons', {
        templateUrl: '/super/to-seasons',
        controller: SeasonCtrl
      }).
      when('/toAddSeason', {
        templateUrl: '/super/to-add-season',
        controller: UpdateSeasonCtrl
      }).
      when('/toUpdateSeason/:seasonId', {
        templateUrl: '/super/to-update-season',
        controller: UpdateSeasonCtrl
      }).
      when('/toTools', {
        templateUrl: '/super/to-tools',
        controller: ToolCtrl
      }).
      otherwise({
        redirectTo: '/'
      });
  }]).
  factory('superFactory', function() {
    var service = {};
    service.hasBriefImg = function(img) {
      return img !== '' && true;
    };
    return service;
  }).
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