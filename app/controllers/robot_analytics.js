
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var User = mongoose.model('User');
var RobotAnalytics = mongoose.model('RobotAnalytics');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');

exports.create = function(dish, answerType, app_id) {
  var robotAnalytics = new RobotAnalytics({
    app_id: app_id,
    dish: ObjectId(dish._id),
    answerType: answerType
  });

  robotAnalytics.save(function(err) {
    console.log(err ? err : 'Create robot analytics success!');
  })
}

exports.getLast = function(app_id, cb) {
  RobotAnalytics.listLast({
    criteria: {
      app_id: app_id
    }
  }, function(err, robotAnalytics) {
    if(err || !robotAnalytics) return cb(err, '');

    return cb(null, robotAnalytics);
  })
}