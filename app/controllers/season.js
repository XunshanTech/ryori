
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
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 10;
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