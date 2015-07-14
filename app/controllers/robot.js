
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Restaurant = mongoose.model('Restaurant');
var Event = mongoose.model('Event');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var Segment = require('segment');

exports.index = function(req, res) {
  res.render('robot/index');
}

exports.segment = function(req, res) {
  var segment = new Segment();
  segment.useDefault();
  var question = req.body.question || '';
  var t = Date.now();

  var ret = segment.doSegment(question);

  res.send({
    question: question,
    words: ret,
    spent: Date.now() - t});
}