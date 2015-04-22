'use strict';

// Declare app level module which depends on filters, and services
angular.module('superApp', ['ngRoute', 'ui.bootstrap',
    'superRestaurantServices', 'superUserServices',
    'superMediaServices', 'superDataServices']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/super/to-data',
        controller: DataCtrl
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