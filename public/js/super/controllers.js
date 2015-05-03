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
  if(scope.selAppId) {
    params.appId = scope.selAppId;
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

function DataCtrl($scope, $rootScope, SuperData, SuperDataUser, SuperDataPlay, SuperDataGift) {
  _toggleRootNav($rootScope, 'Data');
  $scope.init = function() {
    SuperDataUser.get(function(retData) {
      Chart.drawUser(retData.users);
    })
    SuperDataPlay.get(function(retData) {
      Chart.drawPlay(retData.plays);
    })
    SuperDataGift.get(function(retData) {
      Chart.drawGift(retData.gifts);
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

function ViewGiftDataCtrl($scope, $rootScope, $route, SuperDataGiftDetail, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Data');
  $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true });
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
    }
    $scope.getData();
  }
  $scope.init();

  $scope.changeRestaurant = function() {
    $scope.getData();
  }
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
        $location.path('/toRestaurants');
      }
    })
  }
}

function UpdateRestaurantCtrl($scope, $route, $location, SuperRestaurant) {
  $scope.updateRestaurant = function() {
    SuperRestaurant.save($scope.restaurant, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toRestaurants');
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

function CheckVoiceCtrl($scope, $rootScope, $route, $http, SuperMedia, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Voice');

  $scope.showTime = function(t) {
    return moment(t).format('YYYY-MM-DD, HH:mm:ss');
  }

  $scope.selTabIndex = 'all';

  $scope.getData = function() {
    _basePaginations($scope, SuperMedia);
    angular.forEach($scope.wrapData.medias, function(media, key) {
      media.isEditRec = false;
      media.showSelRestaurant = false;
    })
  }

  $scope.changeAppId = function() {
    $scope.getData();
  }

  $scope.changeRestaurant = function() {
    var restaurant = $scope.wrapRestaurants.selRestaurant;
    if(restaurant) {
      $scope.selRestaurantId = restaurant._id;
    } else {
      $scope.selRestaurantId = null;
    }
    $scope.getData();
  }

  $scope.selTab = function(tabId) {
    $scope.selTabIndex = tabId;
    $scope.getData();
  }

  $scope.resetSelRestaurant = function(index) {
    var media = $scope.wrapData.medias[index];
    var restaurantId = media.restaurant._id;
    angular.forEach($scope.wrapRestaurants.restaurants, function(restaurant) {
      if(restaurantId === '') return;
      if(restaurantId === restaurant._id) {
        media.restaurant = restaurant;
        SuperMedia.update(media);
        return false;
      }
    })
    media.showSelRestaurant = false;
  }

  $scope.toggleSelRestaurant = function(index, showFlag) {
    var media = $scope.wrapData.medias[index];
    media.showSelRestaurant = showFlag;
  }

  $scope.checkVoice = function(index, flag) {
    var media = $scope.wrapData.medias[index];
    media.checked_status = flag ? 1 : 2;
    SuperMedia.update(media);
  }

  $scope.updateRec = function(index) {
    var media = $scope.wrapData.medias[index];
    SuperMedia.update(media, function() {
      media.isEditRec = false;
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

  $scope.init = function() {
    $scope.selRestaurantId = $route.current.params['restaurantId'];
    $scope.selAppId = $route.current.params['appId'];
    $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true }, function() {
      if($scope.selRestaurantId) {
        angular.forEach($scope.wrapRestaurants.restaurants, function(restaurant) {
          if($scope.selRestaurantId === restaurant._id) {
            $scope.wrapRestaurants.selRestaurant = restaurant;
            return false;
          }
        })
      }
      if($scope.selRestaurantId || $scope.selAppId) {
        $scope.selTabIndex = 1;
      }
      $scope.getData();
    });

  }

  $scope.init();
}

function CouponCtrl($scope, $rootScope, $http, SuperCoupon) {
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

  $scope.hasSelected = function(index) {
    var coupon = $scope.wrapData.coupons[index];
    return coupon.selected || false;
  }

  $scope.toggleSelection = function(index) {
    var coupon = $scope.wrapData.coupons[index];
    coupon.selected = !coupon.selected && true;
  }

  $scope.sendCoupons = function() {
    var _couponIds = [];
    var coupons = $scope.wrapData.coupons;
    for(var i = 0; i < coupons.length; i++) {
      if(coupons[i].selected) {
        _couponIds.push(coupons[i]._id);
      }
    }
    $http({
      method: 'GET',
      url: '/super/coupon/group',
      params: {
        ids: _couponIds
      }
    }).success(function(data) {
        console.log(data);
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
