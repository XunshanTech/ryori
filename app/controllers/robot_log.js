
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var User = mongoose.model('User');
var RobotLog = mongoose.model('RobotLog');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');

exports.loadRobotLog = function(req, res, next, robotLogId) {
  RobotLog.load(robotLogId, function (err, robotLog) {
    if (err) return next(err);
    if (!robotLog) return next(new Error('robotLog not found'));
    req.tempRobotLog = robotLog;
    next();
  });
}


exports.create = function(question, answer, isImg, app_id) {
  var robotLog = new RobotLog({
    app_id: app_id,
    question: question,
    answer: answer,
    isImg: isImg && true
  });

  robotLog.save(function(err) {
    console.log(err ? err : 'Create robot log success!');
  })
}

exports.updateRobotLog = function(req, res) {
  if(typeof req.body.answer === 'object') {
    req.body.answer = JSON.stringify(req.body.answer);
  }
  var robotLog = extend(req.tempRobotLog, req.body);
  robotLog.save(function(err, robotLogObj) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: !err && true,
      robotLog: robotLogObj
    })
  })

}

exports.getRobotLogs = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 20;
  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };
  RobotLog.list(options, function(err, robotLogs) {
    RobotLog.count(options.criteria, function(err, count) {
      async.each(robotLogs, function(robotLog, callback) {
        User.findOne({
          wx_app_id: robotLog.app_id
        }).exec(function(err, user) {
            robotLog.userName = user ? user.wx_name : null;
            callback();
          });
      }, function(err) {
        res.send({
          robotLogs: robotLogs,
          count: count,
          page: page + 1,
          perPage: perPage,
          pages: Math.ceil(count / perPage)
        })
      })
    })
  });
}