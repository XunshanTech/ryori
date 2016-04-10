'use strict';

function DataCtrl($scope, $rootScope, SuperDataUser) {
  _toggleRootNav($rootScope, 'Data');
  $scope.init = function() {
    SuperDataUser.get(function(retData) {
      Chart.drawUser(retData.users);
    })
  }
  $scope.init();
}

function RestaurantDataCtrl($scope, $rootScope, $route, SuperRestaurant, SuperDataUser, SuperDataPlay, SuperDataGift) {
  _toggleRootNav($rootScope, 'Data');
  $scope.restaurant = null;
  $scope.restaurantId = '';
  $scope.getData = function() {
    var params = {};
    if($scope.restaurantId !== '') {
      params.restaurantId = $scope.restaurantId;
    }
    SuperDataUser.get(params, function(retData) {
      Chart.drawUser(retData.users);
    })
    SuperDataPlay.get(params, function(retData) {
      Chart.drawPlay(retData.plays);
    })
    SuperDataGift.get(params, function(retData) {
      Chart.drawGift(retData.gifts);
    })
  }
  $scope.init = function() {
    var restaurantId = $route.current.params['restaurantId'];
    if(restaurantId) {
      $scope.restaurantId = restaurantId;
      $scope.restaurant = SuperRestaurant.get({restaurantId: restaurantId});
    }
    $scope.getData();
  }

  $scope.init();
}

function ViewUserDataCtrl($scope, $rootScope, $route, SuperDataUserDetail, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Data');
  $scope.restaurant = null;
  $scope.restaurantId = '';
  $scope.getData = function() {
    var params = {};
    if($scope.restaurantId !== '') {
      params.restaurantId = $scope.restaurantId;
    }
    SuperDataUserDetail.get(params, function(retData) {
      Chart.drawUserDetail(retData.users);
    })
  }
  $scope.init = function() {
    var restaurantId = $route.current.params['restaurantId'];
    if(restaurantId) {
      $scope.restaurantId = restaurantId;
      $scope.restaurant = SuperRestaurant.get({restaurantId: restaurantId});
    }
    $scope.getData();
  }

  $scope.init();
}

function ViewPlayDataCtrl($scope, $rootScope, $route, SuperDataPlayDetail, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Data');
  $scope.restaurant = null;
  $scope.restaurantId = '';
  $scope.getData = function() {
    var params = {};
    if($scope.restaurantId !== '') {
      params.restaurantId = $scope.restaurantId;
    }
    SuperDataPlayDetail.get(params, function(retData) {
      Chart.drawPlayDetail(retData.plays);
    })
  }
  $scope.init = function() {
    var restaurantId = $route.current.params['restaurantId'];
    if(restaurantId) {
      $scope.restaurantId = restaurantId;
      $scope.restaurant = SuperRestaurant.get({restaurantId: restaurantId});
    }
    $scope.getData();
  }

  $scope.init();
}

function ViewGiftDataCtrl($scope, $rootScope, $route, SuperDataGiftDetail, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Data');
  $scope.restaurant = null;
  $scope.restaurantId = '';
  $scope.getData = function() {
    var params = {};
    if($scope.restaurantId !== '') {
      params.restaurantId = $scope.restaurantId;
    }
    SuperDataGiftDetail.get(params, function(retData) {
      Chart.drawGiftDetail(retData.gifts);
    })
  }
  $scope.init = function() {
    var restaurantId = $route.current.params['restaurantId'];
    if(restaurantId) {
      $scope.restaurantId = restaurantId;
      $scope.restaurant = SuperRestaurant.get({restaurantId: restaurantId});
    }
    $scope.getData();
  }
  $scope.init();
}