
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
  JapanRestaurant.listAll({}, function(err, michelins) {
    res.render('michelin/michelin_list', {
      michelins: michelins
    });
  })

}

exports.getMichelin = function(req, res) {
  console.log(req.tempMichelin);
  res.render('michelin/michelin', req.tempMichelin);
}