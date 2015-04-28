'use strict';

// Declare app level module which depends on filters, and services
angular.module('superApp', ['ngRoute', 'ui.bootstrap',
    'superRestaurantServices', 'superUserServices',
    'superMediaServices', 'superDataServices',
    'superDataUserServices', 'superDataPlayServices',
    'superDataUserDetailServices', 'superDataPlayDetailServices',
    'superCouponServices']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/super/to-data',
        controller: DataCtrl
      }).
      when('/toViewUserData', {
        templateUrl: '/super/to-view-user-data',
        controller: ViewUserDataCtrl
      }).
      when('/toViewPlayData', {
        templateUrl: '/super/to-view-play-data',
        controller: ViewPlayDataCtrl
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
      when('/toCheckVoice', {
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
  });