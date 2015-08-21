
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Dish = mongoose.model('Dish');
var DishRestaurant = mongoose.model('DishRestaurant');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');
var redis = require('./redis');

exports.getDishRestaurants = function(req, res) {
  var key = req.param('key');

  redis.getDishRestaurants(req.tempDish.name, key, function(err, fetchRestaurants) {
    if(err) {
      res.send({
        success: false,
        message: err
      })
    } else {
      res.send({
        success: true,
        restaurants: fetchRestaurants
      })
    }
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