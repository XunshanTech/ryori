
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
  var options = {
    criteria: {
      parent: {
        $exists: false
      }
    }
  };
  Dish.list(options, function(err, dishs) {
    async.each(dishs, function(dish, callback) {
      dish.getChildren(function(err, subDishs) {
        if(subDishs.length > 0) {
          dish.children = subDishs;
        }
        callback();
      })
    }, function(err) {
      if(err) {
        console.log(err);
      }
      res.send({
        dishs: dishs
      })
    })
  });
}

exports.editDish = function(req, res) {
  var dish = req.tempDish ?
    extend(req.tempDish, req.body) :
    new Dish(extend({createdAt: new Date()}, req.body));
  var parentDishId = req.param('parentDishId');
  var _saveDish = function() {
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

  if(parentDishId && parentDishId !== '') {
    Dish.load(parentDishId, function (err, parentDish) {
      if (err) return next(err);
      if (!dish) return next(new Error('dish not found'));
      dish.parent = parentDish;
      _saveDish();
    });
  } else {
    _saveDish();
  }
}

exports.getDish = function(req, res) {
  var dish = req.tempDish;
  return res.send(dish);
}