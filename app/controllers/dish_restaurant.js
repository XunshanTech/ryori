
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Dish = mongoose.model('Dish');
var DishRestaurant = mongoose.model('DishRestaurant');
var FetchRestaurantOther = mongoose.model('FetchRestaurantOther');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var moment = require('moment');
var async = require('async');
var bw = require ("buffered-writer");
var fs = require('fs');
var redis = require('./redis');

exports.loadDishRestaurant = function(req, res, next, dishRestaurantId) {
  DishRestaurant.load(dishRestaurantId, function (err, dishRestaurant) {
    if (err) return next(err);
    if (!dishRestaurant) return next(new Error('dish_restaurant not found'));
    req.tempDishRestaurant = dishRestaurant;
    next();
  });
}

exports.loadFetchRestaurantOther = function(req, res, next, fetchRestaurantOtherId) {
  FetchRestaurantOther.load(fetchRestaurantOtherId, function(err, fetchRestaurantOther) {
    if(err) return next(err);
    if(!fetchRestaurantOther) return next(new Err('fetch_restaurant_other not found'));
    req.tempFetchRestaurantOther = fetchRestaurantOther;
    next();
  })
}

exports.getTopDishRestaurants = function(dish, cityKey, next) {
  var dishId = dish._id;
  var dishName = dish.name;
  async.parallel({
    fetchRestaurants: function(cb) {
      if(dish.dish_type === 2) {
        cb(null, []);
      } else {
        redis.getDishRestaurants(dishName, cityKey, function(err, fetchRestaurants) {
          fetchRestaurants.splice(3);
          cb(err, fetchRestaurants);
        })
      }
    },
    dishRestaurants: function(cb) {
      DishRestaurant.listAll({
        criteria: {
          city_key: cityKey,
          dish: ObjectId(dishId),
          disable: false
        },
        sort: {
          order: 1
        }
      }, function(err, dishRestaurants) {
        dishRestaurants.splice(3);
        cb(err, dishRestaurants);
      })
    }
  }, function(err, results) {
    if(err) return next(err);

    var fetchRestaurants = results.fetchRestaurants;
    var dishRestaurants = results.dishRestaurants;

    var _retRestaurants = dishRestaurants;
    for(var i = 0; i < fetchRestaurants.length; i++) {
      if(_retRestaurants.length < 3) {
        _retRestaurants.push({
          fetch_restaurant: fetchRestaurants[i]
        });
      } else {
        break;
      }
    }
    next(null, _retRestaurants)
  })
}

exports.getDishRestaurants = function(req, res) {
  var key = req.param('key');
  var dishId = req.param('dishId');
  var _dishLength = 3;

  async.parallel({
    fetchRestaurants: function(cb) {
      redis.getDishRestaurants(req.tempTui.name, key, function(err, fetchRestaurants) {
        fetchRestaurants.splice(3);
        cb(err, fetchRestaurants);
      })
    },
    dishRestaurants: function(cb) {
      DishRestaurant.listAll({
        criteria: {
          city_key: key,
          dish: ObjectId(dishId),
          disable: false
        },
        sort: {
          order: 1
        }
      }, function(err, dishRestaurants) {
        dishRestaurants.splice(_dishLength);
        //循环获取每个餐厅的推荐原因
        async.each(dishRestaurants, function(dishRestaurant, callback) {
          var criteria = {
            fetch_restaurant: ObjectId(dishRestaurant.fetch_restaurant._id)
          };
          FetchRestaurantOther.findOne(criteria, function(err, fetchRestaurantOther) {
            if(err || !fetchRestaurantOther) {
              var fetchRestaurantOther = new FetchRestaurantOther(criteria);
              fetchRestaurantOther.save(function(err, newObject) {
                dishRestaurant.fetch_restaurant_other = newObject;
                callback();
              })
            } else {
              dishRestaurant.fetch_restaurant_other = fetchRestaurantOther;
              callback();
            }
          });
        }, function(err) {
          var rets = [];
          for(var i = 0; i < _dishLength; i++) {
            var _flag = false;
            for(var j = 0; j < dishRestaurants.length; j++) {
              if(dishRestaurants[j].order == i) {
                rets.push(dishRestaurants[j]);
                _flag = true;
                break;
              }
            }
            if(!_flag) {
              rets.push({});
            }
          }
          cb(err, rets);
        })
      })
    }
  }, function(err, results) {
    if(err) {
      return res.send({
        success: false,
        message: err
      })
    }
    var fetchRestaurants = results.fetchRestaurants;
    var dishRestaurants = results.dishRestaurants;
    res.send({
      success: true,
      fetchRestaurants: fetchRestaurants,
      dishRestaurants: dishRestaurants
    })
  })
}

exports.editDishRestaurantOther = function(req, res) {
  var dishRestaurant = extend(req.tempDishRestaurant, req.body);
  dishRestaurant.save(function(err, dishRestaurantObj) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: !err && true,
      dishRestaurant: dishRestaurantObj
    })
  })
}

exports.editDishRestaurant = function(req, res) {
  var dishId = req.param('dishId');
  var fetchRestaurantId = req.param('fetchRestaurantId');
  var cityKey = req.param('cityKey');
  var order = req.param('order');

  var _saveDishRestaurant = function(dishRestaurant) {
    dishRestaurant.save(function(err, dishRestaurant) {
      if(err) {
        res.send({
          success: false,
          message: err
        })
      } else {
        res.send({
          success: true,
          dishRestaurant: dishRestaurant
        })
      }
    })
  }

  //判断是否已存有该餐厅的这个菜品推荐 存在：修改为有效状态 修改位置信息 不存在：增加该项推荐
  var _checkAndSaveDishRestaurant = function() {

    DishRestaurant.findOne({
      dish: ObjectId(dishId),
      fetch_restaurant: ObjectId(fetchRestaurantId),
      city_key: cityKey
    }, function(err, dishRestaurant) {
      if(dishRestaurant) {
        dishRestaurant.disable = false;
        dishRestaurant.order = order;
        _saveDishRestaurant(dishRestaurant);
      } else {
        var dishRestaurant = new DishRestaurant({
          dish: ObjectId(dishId),
          fetch_restaurant: ObjectId(fetchRestaurantId),
          city_key: cityKey,
          order: order,
          createdAt: new Date()
        });
        _saveDishRestaurant(dishRestaurant);
      }
    })
  }

  //判断该位置是否已有了餐厅 如果已有餐厅 将该餐厅置为失效状态
  DishRestaurant.findOne({
    dish: ObjectId(dishId),
    city_key: cityKey,
    order: order
  }, function(err, dishRestaurant) {
    if(dishRestaurant) {
      dishRestaurant.disable = true;
      dishRestaurant.save(function(err, dishRestaurant) {
        _checkAndSaveDishRestaurant();
      })
    } else {
      _checkAndSaveDishRestaurant();
    }
  })
}

exports.updateFetchRestaurantOther = function(req, res) {
  var fetchRestaurantOther = extend(req.tempFetchRestaurantOther, req.body);
  fetchRestaurantOther.save(function(err, newObject) {
    res.send({
      success: !err,
      fetchRestaurantOther: newObject
    })
  })
}