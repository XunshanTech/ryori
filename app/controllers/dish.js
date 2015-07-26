
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
var fsTools = require('fs-tools');

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
  Dish.listAll(options, function(err, dishs) {
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

var _exportsDish = function() {
  var options = {
    criteria: {}
  };

  Dish.listAll(options, function(err, dishs) {
    var infoAry = [];
    for(var i = 0; i < dishs.length; i++) {
      infoAry.push(dishs[i].name + '|0x0009|0');
    }
    fs.writeFile('./config/dicts/dish.txt', infoAry.join('\n'), function(err) {
      console.log(err || "The file was saved!");
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
      _exportsDish();
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

exports.uploadDishPic = function(req, res) {
  var image_path = req.files.file.path;
  var base_path = './public/upload/dish/';
  fsTools.mkdirSync(base_path);

  var image_name = (new Date()).getTime() + '.jpg';
  var real_path = base_path + image_name;
  var target_path = '/upload/dish/' + image_name;

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