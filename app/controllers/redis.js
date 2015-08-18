
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var http = require("http");
var FetchRestaurant = mongoose.model('FetchRestaurant');
var Dish = mongoose.model('Dish');
var redis = require("redis"),
  client = redis.createClient();

var redisHKey = 'ryori_dish_restaurants';

client.on("error", function (err) {
  console.log("Error " + err);
});

var _saveDishRestaurants = function(dishName, cityKey, cb) {
  var _topDish = 5;
  var _topRestaurants = 10;
  FetchRestaurant.listByDishName(dishName, cityKey, function(err, fetchRestaurants) {
    if(err) return cb(err);

    var _fetchRestaurantsFilter = fetchRestaurants.filter(function(fetchRestaurant) {
      var dishes = fetchRestaurant.dishes;
      dishes.sort(function(a, b) {
        return b.score - a.score;
      })
      var _isHint = false;
      for(var i = 0; i < _topDish; i++) {
        if(dishes.length <= i) {
          break;
        }
        if((new RegExp(dishName)).test(dishes[i])) {
          _isHint = true;
          break;
        }
      }
      return _isHint;
    })

    _fetchRestaurantsFilter.sort(function(a, b) {
      return (b.taste * 0.6 + b.env * 0.2 + b.service * 0.2) -
        (a.taste * 0.6 + a.env * 0.2 + a.service * 0.2);
    })
    _fetchRestaurantsFilter.splice(_topRestaurants, _fetchRestaurantsFilter.length - 1);

    var _hkey = dishName + '_' + cityKey;
    client.hset([redisHKey, _hkey, JSON.stringify(_fetchRestaurantsFilter)], redis.print);

    return cb(null, _fetchRestaurantsFilter);
  })
}

var _getDishRestaurants = function(dishName, cityKey, cb) {
  var _hkey = dishName + '_' + cityKey;
  client.hget(redisHKey, _hkey, function(err, restaurants) {
    if(err) return cb(err);

    if(!restaurants) {
      _saveDishRestaurants(dishName, cityKey, function(err, fetchRestaurants) {
        console.log(err || 'Can not hint redis ' + dishName + ',' + cityKey +
          ', save into redis first and return restaurants');
        return cb(err, fetchRestaurants);
      })
    } else {
      return cb(err, JSON.parse(restaurants));
    }
  });
}

exports.saveDishRestaurants = _saveDishRestaurants;
exports.getDishRestaurants = _getDishRestaurants;