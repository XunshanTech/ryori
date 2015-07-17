
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Season = mongoose.model('Season');
var Dish = mongoose.model('Dish');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fsTools = require('fs-tools');
var fs = require('fs');

exports.loadDish = function(req, res, next, dishId) {
  Dish.load(dishId, function (err, dish) {
    if (err) return next(err);
    if (!dish) return next(new Error('dish not found'));
    req.tempDish = dish;
    next();
  });
}

exports.getDishs = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 20;
  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };
  Dish.list(options, function(err, dishs) {
    Dish.count(options.criteria, function(err, count) {
      res.send({
        dishs: dishs,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}

exports.editDish = function(req, res) {
  var dish = req.tempDish ?
    extend(req.tempDish, req.body) :
    new Dish(extend({createdAt: new Date()}, req.body));

  dish.save(function(err, dishObj) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: !err && true,
      dish: dishObj
    })
  })
}

exports.getDish = function(req, res) {
  var dish = req.tempDish;
  return res.send(dish);
}