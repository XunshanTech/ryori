
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Season = mongoose.model('Season');
var Food = mongoose.model('Food');
var Restaurant = mongoose.model('Restaurant');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fsTools = require('fs-tools');
var fs = require('fs');

exports.loadSeason = function(req, res, next, seasonId) {
  Season.load(seasonId, function (err, season) {
    if (err) return next(err);
    if (!season) return next(new Error('season not found'));
    req.tempSeason = season;
    next();
  });
}

exports.loadFood = function(req, res, next, foodId) {
  Food.load(foodId, function (err, food) {
    if (err) return next(err);
    if (!food) return next(new Error('food not found'));
    req.tempFood = food;
    next();
  });
}

exports.getSeasons = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 20;
  var options = {
    page: page,
    perPage: perPage,
    criteria: {
      is_del: {
        $ne: true
      }
    }
  };
  Season.list(options, function(err, seasons) {
    Season.count(options.criteria, function(err, count) {
      res.send({
        seasons: seasons,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}

exports.editSeason = function(req, res) {
  var season = req.tempSeason ?
    extend(req.tempSeason, req.body) :
    new Season(extend({createdAt: new Date()}, req.body));

  season.save(function(err, seasonObj) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: !err && true,
      season: seasonObj
    })
  })
}

exports.getSeason = function(req, res) {
  var season = req.tempSeason;
  return res.send(season);
}

exports.getFoods = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 20;
  var getAll = req.param('getAll') === 'true' ? true : false;
  var options = {
    criteria: {
      is_del: {
        $ne: true
      }
    }
  };
  if(!getAll) {
    options.page = page;
    options.perPage = perPage;
  }
  Food.list(options, function(err, foods) {
    Food.count(options.criteria, function(err, count) {
      res.send({
        foods: foods,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}


exports.getFood = function(req, res) {
  var food = req.tempFood;
  return res.send(food);
}

exports.editFood = function(req, res) {
  var food = req.tempFood ?
    extend(req.tempFood, req.body) :
    new Food(extend({createdAt: new Date()}, req.body));

  food.save(function(err, foodObj) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: !err && true,
      food: foodObj
    })
  })
}

exports.toViewFood = function(req, res) {
  res.render('home/food', {
    food: req.tempFood,
    season: req.tempSeason
  });
}

exports.uploadFoodPic = function(req, res) {
  var image_path = req.files.file.path;
  var base_path = './public/upload/food/';
  fsTools.mkdirSync(base_path);

  var image_name = (new Date()).getTime() + '.jpg';
  var real_path = base_path + image_name;
  var target_path = '/upload/food/' + image_name;

  try {
    fs.renameSync(image_path, real_path);
    return res.send({
      success: true,
      image: target_path
    })
  } catch(e) {
    console.log(e);
  }

  res.send({
    success: false
  })
}