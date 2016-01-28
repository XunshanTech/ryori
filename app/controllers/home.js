
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
var Paper = mongoose.model('Paper');
var JapanRestaurant = mongoose.model('JapanRestaurant');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var redis = require('./redis');
var dishRestaurant = require('./dish_restaurant');
var map = require('../../lib/map');

exports.index = function(req, res) {
  res.render('home/index', {
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

exports.flex = function(req, res) {
  res.render('flex');
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

exports.restaurantPaper = function(req, res) {
  var fetchRestaurant = req.tempFetchRestaurant;
  Paper.listAll({
    criteria: {
      fetchRestaurants: {
        $in: [new ObjectId(fetchRestaurant._id)]
      }
    }
  }, function(err, papers) {
    res.render('home/restaurant_paper', {
      papers: papers,
      fetchRestaurant: fetchRestaurant
    })
  })
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

exports.toLink = function(req, res) {
  var linkId = parseInt(req.params['linkId']);
  res.render('home/to-link', {
    linkId: linkId
  })
}

exports.getMichilinData = function(req, res) {
  JapanRestaurant.listAll({
    criteria: {
      city: 'tokyo',
      michelin_level: 3
    },
    fields: 'name en_name michelin_level city area address tel open_time price lunch des img lng lat'
  }, function(err, japanRestaurants) {
    res.send(japanRestaurants);
  })
}

var resultForOther = {
  "_id": "56758036becadb83378954dc",
  //店铺地址：ryoristack.com/michelin/56758036becadb83378954dc
  "img": "/upload/japanRestaurant/1453802243899.jpg",
  //图片地址：ryoristack.com/upload/japanRestaurant/1453802243899.jpg
  "des": "", //店铺描述
  "lat": "35.6714252",
  "lng": "139.7630091",
  "price": 1392, //晚餐人均价格
  "lunch": 1392, //午餐人均价格
  "open_time": "昼12時～13時（L.O） 夜18時～21時半（L.O", //营业时间
  "tel":"050-5869-7616", //电话
  "address":"中央区 中央区銀座5-4-8  カリオカビル 4F", //地址
  "area": "", //所在区域
  "city":"tokyo", //城市
  "en_name": "", //店铺英文名称
  "michelin_level": 3, //米其林星级
  "name":"银座小十" //店铺名称
}