
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
var aiml = require('aiml')

var filenames = [
  //'config/aimls/general.aiml',
  'config/aimls/alice.aiml'
];
var engine;

aiml.parseFiles(filenames, function(err, topics){
  engine = new aiml.AiEngine('Default', topics, {name: 'Buddy'});
});

exports.index = function(req, res) {
  res.render('robot/index');
}

var doAiml = function(words, next) {
  var wordsAry = [];
  for(var i = 0; i < words.length; i++) {
    wordsAry.push(words[i].w);
  }
  engine.reply({name: 'You'}, wordsAry.join(' '), function(err, result){
    next(result);
  });
}

exports.segment = function(req, res) {
  var segment = new Segment();
  segment.useDefault();
  var question = req.body.question || '';
  var t = Date.now();

  var ret = segment.doSegment(question);

  doAiml(ret, function(result) {
    res.send({
      result: result,
      question: question,
      words: ret,
      spent: Date.now() - t});
  });
}