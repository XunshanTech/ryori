
/**
 * Module dependencies.
 */
var crypto = require('crypto');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var JapanRestaurant = mongoose.model('JapanRestaurant');
var moment = require('moment');
var utils = require('../../lib/utils');
var extend = require('util')._extend;

exports.loadMichelin = function(req, res, next, michelinId) {
  var options = {
    criteria: { _id : michelinId }
  };
  JapanRestaurant.load(options, function (err, michelin) {
    if (err) return next(err);
    if (!michelin) return next(new Error('Failed to load michelin ' + michelin));
    req.tempMichelin = michelin;
    next();
  });
}

exports.getMichelins = function(req, res) {
  var michelinList = {
    tokyo: { level_1: [], level_2: [], level_3: [] },
    kyoto: { level_1: [], level_2: [], level_3: [] },
    osaka: { level_1: [], level_2: [], level_3: [] }
  };
  JapanRestaurant.listAll({}, function(err, michelins) {
    michelins.forEach(function(michelin) {
      if(michelin.michelin_level > 0 && michelinList[michelin.city]) {
        michelinList[michelin.city]['level_' + michelin.michelin_level].push(michelin);
      }
    })
    res.render('michelin/michelin_list', {
      michelinList: michelinList
    });
  })

}

exports.getMichelin = function(req, res) {
  res.render('michelin/michelin', req.tempMichelin);
}