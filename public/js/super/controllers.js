'use strict';

/* Controllers */

function AdminCtrl($scope, $rootScope, SuperAdmin) {
  _toggleRootNav($rootScope, 'Admin');
  $scope.selTabIndex = 'all';

  var _setProperty = function(index, property, flag) {
    flag = flag && true;
    var user = $scope.wrapData.users[index];
    user[property] = flag;
    SuperAdmin.update(user, function(data) {
      if(data && data.success) {
        if(property === 'isDel' && flag) {
          $scope.wrapData.users.splice(index, 1);
        }
      }
    });
  }

  $scope.init = function() {
    _basePaginations($scope, SuperAdmin);
  }

  $scope.selTab = function(tabId) {
    $scope.selTabIndex = tabId;
    $scope.init();
  }

  $scope.delAdmin = function(index) {
    _setProperty(index, 'isDel', true);
  }

  $scope.resetPassword = function(index) {
    var user = $scope.wrapData.users[index];
    var newPass = (new Date()).getTime() % 1000000;
    user.newPassword = newPass;
    user.first_password = newPass;
    SuperAdmin.update(user, function(data) {
      if(data && data.success) {
        $scope.wrapData.users[index] = data.user;
      }
    });
  }

  $scope.init();
}

function AddAdminCtrl($scope, $rootScope, $location, SuperAdmin, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Admin');

  $scope.admin = {
    isAdmin: true,
    isSuperAdmin: false
  };
  $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true });

  $scope.createAdmin = function() {
    SuperAdmin.save($scope.admin, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toAdmins');
      }
    })
  }

  $scope.changeRestaurant = function() {
    var restaurantId = $scope.selRestaurant;
    if(restaurantId) {
      $scope.admin.default_restaurant = restaurantId;
    } else {
      $scope.admin.default_restaurant = null;
    }
  }
}

function UpdateAdminCtrl($scope, $rootScope, $route, $location, SuperAdmin, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Admin');

  $scope.updateAdmin = function() {
    SuperAdmin.save($scope.admin, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toAdmins');
      }
    })
  }

  $scope.changeRestaurant = function() {
    var restaurantId = $scope.selRestaurant;
    if(restaurantId) {
      $scope.admin.default_restaurant = restaurantId;
    } else {
      $scope.admin.default_restaurant = null;
    }
  }

  $scope.init = function() {
    $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true });
    var adminId = $route.current.params['adminId'];
    $scope.admin = SuperAdmin.get({adminId: adminId}, function() {
      if($scope.admin.default_restaurant) {
        $scope.selRestaurant = $scope.admin.default_restaurant._id;
      }
    });
  }

  $scope.init();
}

function RestaurantCtrl($scope, $rootScope, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Restaurant');

  $scope.search = '';
  $scope.isTopic = '';
  $scope.isJoin = '';

  $scope.reload = function() {
    _basePaginations($scope, SuperRestaurant);
  }

  $scope.searchRestaurant = function() {
    $scope.reload();
  }

  $scope.delRestaurant = function(index) {
    var restaurant = $scope.wrapData.restaurants[index];
    restaurant.isDel = true;
    restaurant._csrf = $scope._csrf;
    SuperRestaurant.update(restaurant, function() {
      $scope.wrapData.restaurants.splice(index, 1);
    });
  }

  $scope.reload();
}

var _changeBaidu = function(scope, http) {
  var baidu = scope.baidu;
  if(baidu.trim() === '') return null;
  var locations = baidu.trim().split(',');
  var baidu_lng = locations[0];
  var baidu_lat = locations[1];
  http({
    url: '/super/getLocationFromBaidu',
    method: 'GET',
    params: {
      lat: baidu_lat,
      lng: baidu_lng
    }
  }).success(function(data) {
    if(data && data.lat && data.lng) {
      scope.restaurant.lat = data.lat.toFixed(6);
      scope.restaurant.lng = data.lng.toFixed(6);
    }
  })
}

function AddRestaurantCtrl($scope, $http, $location, SuperRestaurant) {
  $scope.restaurant = { name: '' };
  $scope.baidu = '';
  $scope.changeBaidu = function() {
    _changeBaidu($scope, $http);
  }

  $scope.createRestaurant = function() {
    SuperRestaurant.save($scope.restaurant, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toRestaurants');
      }
    })
  }
}

function UpdateRestaurantCtrl($scope, $http, $route, $location, SuperRestaurant) {
  $scope.baidu = '';
  $scope.changeBaidu = function() {
    _changeBaidu($scope, $http);
  }

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


function UserCtrl($scope, $rootScope, $route, SuperUser, SuperRestaurant) {
  _toggleRootNav($rootScope, 'User');
  $scope.joinType = '';
  $scope.selTabIndex = 'all';

  var _setProperty = function(index, property, flag) {
    flag = flag && true;
    var user = $scope.wrapData.users[index];
    user[property] = flag;
    user._csrf = $scope._csrf;
    SuperUser.update(user, function(data) {
      $scope.wrapData.users[index] = data.user;
    });
  }

  $scope.changeJoinType = function() {
    $scope.loadData();
  }

  $scope.loadData = function() {
    _basePaginations($scope, SuperUser);
  }

  $scope.changeRestaurant = function() {
    var restaurant = $scope.wrapRestaurants.selRestaurant;
    if(restaurant) {
      $scope.selRestaurantId = restaurant._id;
    } else {
      $scope.selRestaurantId = null;
    }
    $scope.loadData();
  }

  $scope.init = function() {
    $scope.selRestaurantId = $route.current.params['restaurantId'];
    $scope.loadData();
    $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true }, function() {
      if($scope.selRestaurantId) {
        angular.forEach($scope.wrapRestaurants.restaurants, function(restaurant) {
          if($scope.selRestaurantId === restaurant._id) {
            $scope.wrapRestaurants.selRestaurant = restaurant;
            //return false;
          }
        })
      }
    });
  }

  $scope.init();

  $scope.selTab = function(tabId) {
    $scope.selTabIndex = tabId;
    $scope.loadData();
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

function CheckVoiceCtrl($scope, $rootScope, $route, $http, SuperMedia, SuperRestaurant, Upload) {
  _toggleRootNav($rootScope, 'Voice');
  $scope.uploadPic = function(index, file) {
    var media = $scope.wrapData.medias[index];
    Upload.upload({
      url: '/super/uploadPic',
      fields: {'mediaId': media._id},
      file: file
    }).success(function(result) {
      if(result && result.success) {
        media.imgTime = (new Date()).getTime();
        media.image_media_id = result.image_media_id;
      } else {
        alert('上传失败，请重新尝试！');
      }
    });
  }

  $scope.showTime = function(t) {
    return moment(t).format('YYYY-MM-DD, HH:mm:ss');
  }

  $scope.selTabIndex = 'all';

  $scope.getData = function() {
    _basePaginations($scope, SuperMedia);
    angular.forEach($scope.wrapData.medias, function(media, key) {
      media.imgTime = '';
      media.isEditRec = false;
      media.isEditImg = false;
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

  $scope.toggleEditImg = function(index, flag) {
    var media = $scope.wrapData.medias[index];
    media.isEditImg = flag && true;
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
    }).success(function(data) {});
  }

  $scope.getMp3Path = function(index) {
    var media = $scope.wrapData.medias[index];
    return '/upload/mp3/' + media._id + '.mp3';
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

function CouponCtrl($scope, $rootScope, $http, $modal, SuperCoupon) {
  _toggleRootNav($rootScope, 'Coupon');
  $scope.selTabIndex = 0;

  $scope.loadData = function() {
    _basePaginations($scope, SuperCoupon);
  }

  $scope.loadData();

  $scope.selTab = function(tabIndex) {
    $scope.selTabIndex = tabIndex;
    $scope.loadData();
  }

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
        $scope.open(data.couponsTemp);
      })
  }

  $scope.open = function(coupons) {
    var couponsInstance = $modal.open({
      templateUrl: '/super/to-check-coupons',
      controller: CheckCouponsInstanceCtrl,
      size: 'lg',
      resolve: {
        coupons: function() {
          return coupons;
        }
      }
    });

    couponsInstance.result.then(function (result) {
      $scope.loadData();
    }, function () {
      console.log('Modal dismissed at: ' + new Date());
    });
  };
}

function CheckCouponsInstanceCtrl($scope, $http, $modalInstance, coupons) {
  $scope.coupons = coupons;
  $scope.checked = function() {
    $http({
      method: 'POST',
      url: '/super/coupon/group',
      data: {
        coupons: coupons
      }
    }).success(function(data) {
        console.log(data);
        $modalInstance.close();
      })
  }

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
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

function SeasonCtrl($scope, $rootScope, SuperSeason, SuperRestaurant) {
  _toggleRootNav($rootScope, 'Season');

  $scope.foods = {}; // 临时对象 用于存储餐厅id与名称

  $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true }, function(result) {
    angular.forEach(result.restaurants, function(restaurant) {
      $scope.foods[restaurant._id] = restaurant.name;
    })
  });

  $scope.loadData = function() {
    _basePaginations($scope, SuperSeason);
  }

  $scope.loadData();

  $scope.delSeason = function(index) {
    var season = $scope.wrapData.seasons[index];
    season.is_del = true;
    SuperSeason.update(season, function(data) {
      if(data && data.success) {
        $scope.wrapData.seasons.splice(index, 1);
      }
    })
  }
}

function UpdateSeasonCtrl($scope, $rootScope, $location, $route,
                          SuperSeason, SuperFood, SuperRestaurant, $modal) {
  _toggleRootNav($rootScope, 'Season');
  $scope.season = {
    title: '应季食材推荐 - ' + moment().format('YYYYDDMM'),
    foods: []
  };
  $scope.foods = []; // 用于接受全部食材列表
  $scope.tempFoods = {}; // 临时对象 用于存储餐厅id与名称
  $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true }, function(result) {
    angular.forEach(result.restaurants, function(restaurant) {
      $scope.tempFoods[restaurant._id] = restaurant.name;
    })
  });
  SuperFood.query({
    getAll: true
  }, function(result) {
    $scope.foods = result.foods;
  });

  $scope.loadSeason = function() {
    var seasonId = $route.current.params['seasonId'];
    if(!seasonId) {
      SuperFood.get({lastSeason: true, getAll: true}, function(result) {
        if(result && result.foods) {
          $scope.season.foods = result.foods;
        }
      });
    } else {
      $scope.season = SuperSeason.get({seasonId: seasonId});
    }
  }

  $scope.loadSeason();

  var _getSeasonObj = function(season) {
    var seasonObj = {};
    angular.copy(season, seasonObj);
    for(var i = 0; i < seasonObj.foods.length; i++) {
      if(typeof seasonObj.foods[i] === 'object') {
        seasonObj.foods[i] = seasonObj.foods[i]._id;
      }
    }
    return seasonObj
  }

  var _createSeason = function(isEditFood) {
    SuperSeason.save(_getSeasonObj($scope.season), function(retDate) {
      if(retDate && retDate.success) {
        $scope.season._id = retDate.season._id;
        if(!isEditFood) {
          $location.path('/toSeasons');
        }
      }
    })
  }

  var _updateSeason = function(isEditFood) {
    SuperSeason.update($scope.season, function(retDate) {
      if(retDate && retDate.success && !isEditFood) {
        $location.path('/toSeasons');
      }
    })
  }

  $scope.saveOrUpdateSeason = function(flag) {
    if(!$scope.season._id) {
      _createSeason(flag);
    } else {
      _updateSeason(flag);
    }
  }

  $scope.open = function(index) {
    var foodsInstance = $modal.open({
      templateUrl: '/super/to-sel-foods',
      controller: SelFoodsInstanceCtrl,
      size: 'lg',
      resolve: {
        foods: function() {
          return $scope.foods;
        }
      }
    });

    foodsInstance.result.then(function (result) {
      if(typeof index !== 'undefined') {
        $scope.season.foods[index] = result;
      } else {
        $scope.season.foods.push(result);
      }
      $scope.saveOrUpdateSeason(true)
    }, function () {
      console.log('Modal dismissed at: ' + new Date());
    });
  };

  $scope.toCreateFood = function() {
    $scope.open();
  }

  $scope.toEditFood = function(index) {
    $scope.open(index);
  }

  $scope.delFood = function(index) {
    $scope.season.foods.splice(index, 1);
    $scope.saveOrUpdateSeason(true);
  }
}

function SelFoodsInstanceCtrl($scope, $modalInstance, foods) {
  $scope.foods = foods;

  $scope.selFood = function(index) {
    var _food = $scope.foods[index];
    $modalInstance.close(_food);
  }

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}


function FoodCtrl($scope, $rootScope, SuperFood) {
  _toggleRootNav($rootScope, 'Food');
  _basePaginations($scope, SuperFood);

  $scope.delFood = function(index) {
    var food = $scope.wrapData.foods[index];
    food.is_del = true;
    SuperFood.update(food, function(data) {
      if(data && data.success) {
        $scope.wrapData.foods.splice(index, 1);
      }
    })
  }
}
function UpdateFoodCtrl($scope, $rootScope, $location, $route,
                        SuperFood, SuperRestaurant, Upload) {
  _toggleRootNav($rootScope, 'Food');
  var _isNew = true;
  $scope.food = {};

  $scope.loadFood = function() {
    var foodId = $route.current.params['foodId'];
    if(!foodId) return ;
    _isNew = false;
    $scope.food = SuperFood.get({foodId: foodId});
  }

  $scope.loadFood();

  $scope.wrapRestaurants = SuperRestaurant.query({ getAll: true });

  $scope.createFood = function() {
    var foodObj = {};
    angular.copy($scope.food, foodObj);
    if(foodObj.restaurants) {
      for(var i = 0; i < foodObj.restaurants.length; i++) {
        if(typeof foodObj.restaurants[i] === 'object') {
          foodObj.restaurants[i] = foodObj.restaurants[i]._id;
        }
      }
    }
    SuperFood.save(foodObj, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toFoods');
      }
    })
  }

  $scope.updateFood = function() {
    SuperFood.update($scope.food, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toFoods');
      }
    })
  }

  $scope.addOrUpdate = function() {
    if(_isNew) {
      $scope.createFood();
    } else {
      $scope.updateFood();
    }
  }

  $scope.uploadPic = function(index, file) {
    Upload.upload({
      url: '/super/uploadFoodPic',
      file: file
    }).success(function(result) {
        if(result && result.success) {
          $scope.food.imgTime = (new Date()).getTime();
          $scope.food.images = [result.image];
        } else {
          alert('上传失败，请重新尝试！');
        }
      });
  }

  $scope.createRestaurant = function() {
    if(!$scope.food.restaurants) {
      $scope.food.restaurants = [];
    }
    $scope.food.restaurants.push({});
  }

  $scope.delRestaurant = function(index) {
    $scope.food.restaurants.splice(index, 1);
  }
}

function DishCtrl($scope, $rootScope, SuperDish) {
  _toggleRootNav($rootScope, 'Dish');

  $scope.loadData = function() {
    _basePaginations($scope, SuperDish);
  }

  $scope.loadData();

}

function UpdateDishCtrl($scope, $rootScope, $location, $route, $modal,
                        SuperDish, SuperDishRestaurant, Upload) {
  var dishId = $route.current.params['dishId'];
  _toggleRootNav($rootScope, 'Dish');
  $scope.dish = {};
  $scope.parentDishId = '';
  $scope.citys = _citys;
  $scope.restaurants = {};

  $scope.loadDish = function() {

    if(dishId) {
      $scope.dish = SuperDish.get({dishId: dishId});
    }
  }

  $scope.initParent = function() {
    $scope.parentDishId = $route.current.params['parentDishId'] || '';
  }

  $scope.toggleCity = function(key) {
    angular.forEach($scope.citys, function(city) {
      city.show = city.key == key ? true : false;
    })
    if(!$scope.restaurants[key]) {
      $scope.restaurants[key] = SuperDishRestaurant.get({key: key, dishId: dishId})
    }
  }

  $scope.init = function() {
    $scope.loadDish();
    $scope.initParent();
    $scope.toggleCity(2); // show beijing restaurants default
  }

  $scope.init();

  var _createDish = function() {
    $scope.dish.parentDishId = $scope.parentDishId;
    SuperDish.save($scope.dish, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toDishs');
      }
    })
  }

  var _updateDish = function() {
    SuperDish.update($scope.dish, function(retDate) {
      if(retDate && retDate.success) {
        $location.path('/toDishs');
      }
    })
  }

  $scope.saveOrUpdateDish = function() {
    if(!$scope.dish._id) {
      _createDish();
    } else {
      _updateDish();
    }
  }

  $scope.uploadPic = function(index, file) {
    Upload.upload({
      url: '/super/uploadDishPic',
      file: file
    }).success(function(result) {
        if(result && result.success) {
          $scope.dish.img = result.image;
          $scope.dish.img_media_updated = null;
          $scope.dish.img_media_id = '';
        } else {
          alert('上传失败，请重新尝试！');
        }
      });
  }

  $scope.open = function(key, index) {
    var checkDishRestaurantInstance = $modal.open({
      templateUrl: '/super/to-check-dish-restaurant',
      controller: CheckDishRestaurantInstanceCtrl,
      size: 'lg',
      resolve: {
        key: function() {
          return key;
        },
        index: function() {
          return index;
        }
      }
    });

    checkDishRestaurantInstance.result.then(function (result) {
      console.log(result);
      //$scope.loadData();
    }, function () {
      console.log('Modal dismissed at: ' + new Date());
    });
  }

}

function CheckDishRestaurantInstanceCtrl($scope, SuperFetch, key, $modalInstance) {
  $scope.city = key;
  $scope.search = '';

  $scope.loadData = function() {
    _basePaginations($scope, SuperFetch);
  }

  $scope.loadData();

  $scope.searchRestaurant = function() {
    $scope.loadData();
  }

  $scope.checked = function(restaurant) {
    $modalInstance.close(restaurant);
  }
}

function RobotLogCtrl($scope, $rootScope, SuperRobotLog) {
  _toggleRootNav($rootScope, 'RobotLog');

  $scope.loadData = function() {
    _basePaginations($scope, SuperRobotLog);
  }

  $scope.loadData();

  $scope.showTime = function(t) {
    return moment(t).format('YYYY-MM-DD, HH:mm:ss');
  }
}

function FetchCtrl($scope, $rootScope, SuperFetch) {
  _toggleRootNav($rootScope, 'Fetch');

  $scope.city = '';

  $scope.loadData = function() {
    _basePaginations($scope, SuperFetch);
  }

  $scope.loadData();
}


function ToolCtrl($scope, $rootScope, $http) {
  _toggleRootNav($rootScope, 'Tool');

  $scope.removeLocation = function() {
    $http({
      method: 'GET',
      url: '/super/tools/removeOldLocation'
    }).success(function(data) {
      alert('删除成功！');
    })
  }

  $scope.setMenu = function() {
    $http({
      method: 'GET',
      url: '/super/setMenu'
    }).success(function(data) {
        alert('设置成功！');
      })
  }

  $scope.convertVoice = function() {
    $http({
      method: 'GET',
      url: '/super/convertVoice'
    }).success(function(data) {
        alert('转换完毕！');
      })
  }

  $scope.exportsDish = function() {
    $http({
      method: 'GET',
      url: '/super/exportsDish'
    }).success(function(data) {
        alert('生成完毕');
      })
  }
}
