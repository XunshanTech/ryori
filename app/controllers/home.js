
/**
 * Module dependencies.
 */
var crypto = require('crypto');
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var User = mongoose.model('User');
var FetchRestaurant = mongoose.model('FetchRestaurant');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var redis = require('./redis');
var map = require('./map');

exports.index = function(req, res) {
  res.render('home/index2', {
    title: 'Home',
    isHome: true
  });
}

exports.index2 = function(req, res) {
  res.render('home/index2', {
    title: 'Home',
    isHome: true
  })
}

exports.index3 = function(req, res) {
  res.render('home/index3', {
    title: 'Home',
    isHome: true
  })
}

exports.chef = function(req, res) {
  res.render('home/chef');
}

exports.chefFood = function(req, res) {
  res.render('home/chef-food');
}

exports.plan = function(req, res) {
  res.render('home/plan');
}

exports.play = function(req, res) {
  var media = req.tempMedia;
  if(!media.user.wx_name) {
    User.findOne({
      wx_app_id: media.app_id
    }).exec(function(err, user) {
      media.user = user || null;
      res.render('home/play', {
        media: media
      });
    });
  } else {
    res.render('home/play', {
      media: media
    });
  }
}

exports.loadFetchRestaurant = function(req, res, next, fetchRestaurantId) {
  var options = {
    criteria: { _id : fetchRestaurantId }
  };
  FetchRestaurant.load(options, function (err, fetchRestaurant) {
    if (err) return next(err);
    if (!fetchRestaurant) return next(new Error('Failed to load FetchRestaurant ' + fetchRestaurantId));
    req.tempFetchRestaurant = fetchRestaurant;
    next();
  });
}

exports.restaurant = function(req, res) {
  var fetchRestaurant = req.tempFetchRestaurant;
  res.render('home/restaurant', {
    restaurant: fetchRestaurant
  })
}

var _getCityName = function(cityKey) {
  var citys = map.citys;
  for(var i = 0; i < citys.length; i++) {
    if(citys[i].key == cityKey) {
      return citys[i].name;
    }
  }
  return '';
}

exports.cityRestaurants = function(req, res) {
  console.log(req.params);
  var cityKey = req.params['cityKey'];
  var dishName = req.params['dishName'];
  var cityName = _getCityName(cityKey);
  redis.getDishRestaurants(dishName, cityKey, function(err, restaurants) {
    restaurants.splice(5);
    res.render('home/city-restaurants', {
      restaurants: restaurants,
      cityName: cityName,
      dishName: dishName
    });
  })
}