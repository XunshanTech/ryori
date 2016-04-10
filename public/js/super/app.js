'use strict';

// Declare app level module which depends on filters, and services
angular.module('superApp', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.datetimepicker',
    'ngFileUpload',
    'superRestaurantServices', 'superUserServices', 'superMediaServices', 'superTuiServices',
    'superMenuDataServices',
    //'superDataServices', 'superDataUserServices', 'superDataPlayServices', 'superDataGiftServices',
    //'superDataUserDetailServices', 'superDataPlayDetailServices', 'superDataGiftDetailServices',
    //'superCouponServices', 'superSeasonServices', 'superFoodServices',
    'superFetchServices', 'superJapanRestaurantServices', 'superDishServices', 'superDishRestaurantServices',
    'superQuestionServices', 'superOrderServices', 'superWxNewServices', 'superPaperServices',
    'superFetchRestaurantOtherServices', 'superRobotLogServices', 'superAdminServices']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/super/to-data',
        controller: DataCtrl
        //templateUrl: '/super/to-index',
        //controller: IndexCtrl
      }).
      when('/toTuis', {
        templateUrl: '/super/to-tuis',
        controller: TuiCtrl
      }).
      when('/toAddTui', {
        templateUrl: '/super/to-update-tui',
        controller: UpdateTuiCtrl
      }).
      when('/toAddTui/:parentTuiId', {
        templateUrl: '/super/to-update-tui',
        controller: UpdateTuiCtrl
      }).
      when('/toUpdateTui/:tuiId', {
        templateUrl: '/super/to-update-tui',
        controller: UpdateTuiCtrl
      }).
      when('/toDishs', {
        templateUrl: '/super/to-dishs',
        controller: DishCtrl
      }).
      when('/toAddDish', {
        templateUrl: '/super/to-update-dish',
        controller: UpdateDishCtrl
      }).
      when('/toAddDish/:parentDishId', {
        templateUrl: '/super/to-update-dish',
        controller: UpdateDishCtrl
      }).
      when('/toUpdateDish/:dishId', {
        templateUrl: '/super/to-update-dish',
        controller: UpdateDishCtrl
      }).
      when('/toRobotLogs', {
        templateUrl: '/super/to-robot-logs',
        controller: RobotLogCtrl
      }).
      when('/toFetchs', {
        templateUrl: '/super/to-fetchs',
        controller: FetchCtrl
      }).
      when('/toJapanRestaurants', {
        templateUrl: '/super/to-japan-restaurants',
        controller: JapanRestaurantCtrl
      }).
      when('/toUpdateJapanRestaurant/:japanRestaurantId', {
        templateUrl: '/super/to-update-japan-restaurant',
        controller: UpdateJapanRestaurantCtrl
      }).
      when('/toQuestions', {
        templateUrl: '/super/to-questions',
        controller: QuestionCtrl
      }).
      when('/toOrders', {
        templateUrl: '/super/to-orders',
        controller: OrderCtrl
      }).
      when('/toUpdateOrder/:orderId', {
        templateUrl: '/super/to-update-order',
        controller: UpdateOrderCtrl
      }).
      when('/toPapers', {
        templateUrl: '/super/to-papers',
        controller: PaperCtrl
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
      when('/toUsers', {
        templateUrl: '/super/to-users',
        controller: UserCtrl
      }).
      when('/toUsers/restaurant/:restaurantId', {
        templateUrl: '/super/to-users',
        controller: UserCtrl
      }).
      when('/toTools', {
        templateUrl: '/super/to-tools',
        controller: ToolCtrl
      }).
      otherwise({
        redirectTo: '/'
      });
      /*when('/toRestaurantData', {
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
        templateUrl: '/super/to-update-season',
        controller: UpdateSeasonCtrl
      }).
      when('/toUpdateSeason/:seasonId', {
        templateUrl: '/super/to-update-season',
        controller: UpdateSeasonCtrl
      }).
      when('/toFoods', {
        templateUrl: '/super/to-foods',
        controller: FoodCtrl
      }).
      when('/toAddFood', {
        templateUrl: '/super/to-update-food',
        controller: UpdateFoodCtrl
      }).
      when('/toUpdateFood/:foodId', {
        templateUrl: '/super/to-update-food',
        controller: UpdateFoodCtrl
      }).*/
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