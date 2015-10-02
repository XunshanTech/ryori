
/**
 * Module dependencies.
 */
var crypto = require('crypto');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Article = mongoose.model('Article');
var User = mongoose.model('User');
var FetchRestaurant = mongoose.model('FetchRestaurant');
var DishRestaurant = mongoose.model('DishRestaurant');
var FetchRestaurantOther = mongoose.model('FetchRestaurantOther');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var redis = require('./redis');
var dishRestaurant = require('./dish_restaurant');
var map = require('../../lib/map');

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

exports.dishRestaurant = function(req, res) {
  var criteria = {
    dish: req.tempDish,
    fetch_restaurant: req.tempFetchRestaurant
  }
  DishRestaurant.findOne(criteria)
    .populate('dish')
    .populate('fetch_restaurant')
    .exec(function(err, dishRestaurant) {
      if(!err && dishRestaurant) {
        FetchRestaurantOther.findOne({
          fetch_restaurant: ObjectId(dishRestaurant.fetch_restaurant._id)
        }, function(err, fetchRestaurantOther) {
          res.render('home/dish_restaurant', {
            dishRestaurant: dishRestaurant || criteria,
            fetchRestaurantOther: fetchRestaurantOther
          })
        })
      } else {
        res.render('home/dish_restaurant', {
          dishRestaurant: criteria,
          fetchRestaurantOther: null
        })
      }
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
  var cityKey = req.params['cityKey'];
  var dish = req.tempDish;
  var cityName = _getCityName(cityKey);

  dishRestaurant.getTopDishRestaurants(dish, cityKey, function(err, dishRestaurants) {
    res.render('home/city-restaurants', {
      dishRestaurants: dishRestaurants,
      cityName: cityName,
      dish: dish
    });
  })
}