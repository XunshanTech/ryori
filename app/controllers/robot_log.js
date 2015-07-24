
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var RobotLog = mongoose.model('RobotLog');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');

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
      res.send({
        robotLogs: robotLogs,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}