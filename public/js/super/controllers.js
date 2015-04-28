'use strict';

var _basePaginations = function(scope, resource, success) {
  var params = {};
  //for media list select by check_status
  if(typeof scope.selTabIndex !== 'undefined') {
    params.selTabIndex = scope.selTabIndex;
  }
  //for media list select by restaurant
  if(scope.selRestaurantId) {
    params.restaurantId = scope.selRestaurantId;
  }
  success = typeof success === 'function' ? success : function() {};
  scope.wrapData = resource.query(params, success);
  scope.maxSize = 5;

  scope.pageChanged = function() {
    params.page = scope.wrapData.page;
    params.perPage = scope.wrapData.perPage;
    scope.wrapData = resource.query(params, success);
  }
}

var _toggleRootNav = function(rootScope, name) {
  var navs = ['Data', 'Restaurant', 'User', 'Voice'];
  for(var i = 0; i < navs.length; i++) {
    var fullName = 'nav' + navs[i] + 'Sel';
    rootScope[fullName] = (name === navs[i] && true);
  }
}
/* Controllers */

function DataCtrl($scope, $rootScope, SuperData, SuperDataUser, SuperDataPlay) {
  _toggleRootNav($rootScope, 'Data');
  $scope.init = function() {
    SuperDataUser.get(function(retData) {
      Chart.drawUser(retData.users);
    })
    SuperDataPlay.get(function(retData) {
      Chart.drawPlay(retData.plays);
    })
  }
  $scope.wrapData = SuperData.get();
  $scope.init();
}

function ViewUserDataCtrl($scope, $rootScope, SuperDataUserDetail) {
  _toggleRootNav($rootScope, 'Data');
  $scope.init = function() {
    SuperDataUserDetail.get(function(retData) {
      Chart.drawUserDetail(retData.users);
    })
  }
  $scope.init();
}

function ViewPlayDataCtrl($scope, $rootScope, SuperDataPlayDetail) {
  _toggleRootNav($rootScope, 'Data');
  $scope.init = function() {
    SuperDataPlayDetail.get(function(retData) {
      Chart.drawPlayDetail(retData.plays);
    })
  }
  $scope.init();
}

function RestaurantCtrl($scope, $rootScope, SuperRestaurant) {
  _basePaginations($scope, SuperRestaurant);
  _toggleRootNav($rootScope, 'Restaurant');

  $scope.delRestaurant = function(index) {
    var restaurant = $scope.wrapData.restaurants[index];
    restaurant.isDel = true;
    restaurant._csrf = $scope._csrf;
    SuperRestaurant.update(restaurant, function() {
      $scope.wrapData.restaurants.splice(index, 1);
    });
  }

}

function AddRestaurantCtrl($scope, $location, SuperRestaurant) {
  $scope.restaurant = { name: '' };
  $scope.createRestaurant = function() {
    SuperRestaurant.save($scope.restaurant, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/');
      }
    })
  }
}

function UpdateRestaurantCtrl($scope, $route, $location, SuperRestaurant) {
  $scope.updateRestaurant = function() {
    SuperRestaurant.save($scope.restaurant, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/');
      }
    })
  }

  $scope.loadRestaurant = function() {
    var restaurantId = $route.current.params['restaurantId'];
    $scope.restaurant = SuperRestaurant.get({restaurantId: restaurantId});
  }

  $scope.loadRestaurant();
}


function UserCtrl($scope, $rootScope, SuperUser) {
  _toggleRootNav($rootScope, 'User');

  var _setProperty = function(index, property, flag) {
    flag = flag && true;
    var user = $scope.wrapData.users[index];
    user[property] = flag;
    user._csrf = $scope._csrf;
    SuperUser.update(user, function(data) {
      $scope.wrapData.users[index] = data.user;
    });
  }

  $scope.selTabIndex = 'all';

  $scope.init = function() {
    _basePaginations($scope, SuperUser);
  }

  $scope.init();

  $scope.selTab = function(tabId) {
    $scope.selTabIndex = tabId;
    $scope.init();
  }


  $scope.showTime = function(t) {
    return moment(t).format('YYYY-MM-DD, HH:mm:ss');
  }

  $scope.changeGroup = function(index) {
    var user = $scope.wrapData.users[index];
    user._csrf = $scope._csrf;
    SuperUser.update(user, function(data) {
      $scope.wrapData.users[index] = data.user;
    });
  }

  $scope.delUser = function(index, flag) {
    _setProperty(index, 'isDel', flag);
  }
}

function CheckVoiceCtrl($scope, $rootScope, $http, SuperMedia, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Voice');
  $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true });

  $scope.showTime = function(t) {
    return moment(t).format('YYYY-MM-DD, HH:mm:ss');
  }

  $scope.selTabIndex = 'all';

  $scope.init = function() {
    _basePaginations($scope, SuperMedia);
    angular.forEach($scope.wrapData.medias, function(media, key) {
      media.isEditRec = false;
    })
  }

  $scope.init();

  $scope.changeRestaurant = function() {
    var restaurant = $scope.wrapRestaurants.selRestaurant;
    if(restaurant) {
      $scope.selRestaurantId = restaurant._id;
    } else {
      $scope.selRestaurantId = null;
    }
    $scope.init();
  }

  $scope.selTab = function(tabId) {
    $scope.selTabIndex = tabId;
    $scope.init();
  }

  $scope.checkVoice = function(index, flag) {
    var media = $scope.wrapData.medias[index];
    media.checked_status = flag ? 1 : 2;
    SuperMedia.update(media, function(data) {
      $scope.wrapData.medias[index] = data.media;
    });
  }

  $scope.updateRec = function(index) {
    var media = $scope.wrapData.medias[index];
    SuperMedia.update(media, function(data) {
      data.media.isEditRec = false;
      $scope.wrapData.medias[index] = data.media;
    });
  }

  $scope.showEditMedia = function(index) {
    var media = $scope.wrapData.medias[index];
    media.isEditRec = true;
  }

  $scope.cancelRec = function(index) {
    var media = $scope.wrapData.medias[index];
    media.isEditRec = false;
  }

  $scope.deleteVoice = function(index) {
    var media = $scope.wrapData.medias[index];
    SuperMedia.delete(media, function(data) {
      if(data.success) {
        $scope.wrapData.medias.splice(index, 1);
      }
    })
  }

  $scope.sendVoice = function(index) {
    if(!$scope.app_id) return;
    var media = $scope.wrapData.medias[index];
    $http({
      method: 'GET',
      url: '/super/sendVoice?media_id=' + media.media_id + '&app_id=' + $scope.app_id
    }).success();
  }
}

function CouponCtrl($scope, $rootScope, SuperCoupon) {
  _basePaginations($scope, SuperCoupon);
  _toggleRootNav($rootScope, 'Coupon');

  $scope.delCoupon = function(index) {
    var coupon = $scope.wrapData.coupons[index];
    coupon.is_del = true;
    SuperCoupon.update(coupon, function(data) {
      if(data && data.success) {
        $scope.wrapData.coupons.splice(index, 1);
      }
    })
  }

}

function AddCouponCtrl($scope, $rootScope, $location, SuperCoupon, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Coupon');
  $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true });
  $scope.sleepMonths = [1,2,3];
  $scope.coupon = {};

  $scope.createCoupon = function() {
    SuperCoupon.save($scope.coupon, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toCoupons');
      }
    })
  }
}

function UpdateCouponCtrl($scope, $rootScope, $route, $location, SuperCoupon, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Coupon');
  $scope.sleepMonths = [1,2,3];

  $scope.loadCoupon = function() {
    var couponId = $route.current.params['couponId'];
    $scope.coupon = SuperCoupon.get({couponId: couponId});
    $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true }, function(result) {
      var restaurants = result.restaurants;
      for(var i = 0; i < restaurants.length; i++) {
        if($scope.coupon.restaurant._id === restaurants[i]._id) {
          $scope.coupon.restaurant = restaurants[i]._id;
          break;
        }
      }
    });
  }

  $scope.loadCoupon();

  $scope.updateCoupon = function() {
    SuperCoupon.update($scope.coupon, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toCoupons');
      }
    })
  }

}
