
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

exports.create = function(question, answer, app_id) {
  var robotLog = new RobotLog({
    app_id: app_id,
    question: question,
    answer: answer
  });

  robotLog.save(function(err) {
    console.log(err ? err : 'Create robot log success!');
  })
}