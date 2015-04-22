angular.module('superRestaurantServices', ['ngResource']).factory('SuperRestaurant', ['$resource',
  function($resource){
    return $resource('/super/restaurant/:restaurantId', {restaurantId: '@_id'}, {
      query: {method: 'GET', isArray: false},
      save: {method: 'POST'},
      update: {method: 'PUT'}
    });
  }])

angular.module('superUserServices', ['ngResource']).factory('SuperUser', ['$resource',
  function($resource){
    return $resource('/super/user/:userId', {userId: '@_id'}, {
      query: {method: 'GET', isArray: false},
      update: {method: 'PUT'}
    });
  }]);

angular.module('superMediaServices', ['ngResource']).factory('SuperMedia', ['$resource',
  function($resource){
    return $resource('/super/media/:mediaId', {mediaId: '@_id'}, {
      query: {method: 'GET', isArray: false},
      update: {method: 'PUT'},
      remove: {method: 'DELETE'}
    });
  }]);

angular.module('superDataServices', ['ngResource']).factory('SuperData', ['$resource',
  function($resource){
    return $resource('/super/data');
  }])

angular.module('superDataUserServices', ['ngResource']).factory('SuperDataUser', ['$resource',
  function($resource){
    return $resource('/super/data/user');
  }])

angular.module('superDataUserDetailServices', ['ngResource']).factory('SuperDataUserDetail', ['$resource',
  function($resource){
    return $resource('/super/data/user/detail');
  }])

angular.module('superDataPlayServices', ['ngResource']).factory('SuperDataPlay', ['$resource',
  function($resource){
    return $resource('/super/data/play');
  }])