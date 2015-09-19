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
  if(scope.search) {
    params.search = scope.search;
  }
  if(scope.isTopic !== '') {
    params.isTopic = scope.isTopic;
  }
  if(scope.isJoin !== '') {
    params.isJoin = scope.isJoin;
  }
  if(scope.joinType) {
    params.joinType = scope.joinType;
  }
  if(scope.city) {
    params.city = scope.city;
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
  var navs = [
    //'Data', 'Restaurant', 'Voice', 'Coupon', 'Season', 'Food',
    'Dish', 'Question', 'RobotLog', 'Fetch', 'Admin', 'User', 'Tool'];
  for(var i = 0; i < navs.length; i++) {
    var fullName = 'nav' + navs[i] + 'Sel';
    rootScope[fullName] = (name === navs[i] && true);
  }
}

var _citys = [{
  name: '北京', key: 2
}, {
  name: '上海', key: 1
}, {
  name: '广州', key: 4
}, {
  name: '深圳', key: 7
}, {
  name: '大连', key: 19
}, {
  name: '天津', key: 10
}, {
  name: '沈阳', key: 18
}, {
  name: '青岛', key: 21
}, {
  name: '杭州', key: 3
}, {
  name: '香港', key: 'hongkong'
}]
