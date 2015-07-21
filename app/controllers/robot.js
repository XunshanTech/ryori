
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Restaurant = mongoose.model('Restaurant');
var Event = mongoose.model('Event');
var Dish = mongoose.model('Dish');
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
  //console.log(JSON.stringify(topics));
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

var _getDishName = function(ret) {
  for(var i = 0; i < ret.length; i++) {
    if(ret[i].p && ret[i].p === 9) {
      return ret[i].w;
    }
  }
  return '';
}

var _getDishAnswer = function(dish, text) {
  var dishPro = {
    infos: ['name', 'des', 'eat', 'nameFrom', 'categories'],
    link: 'link',
    img: 'img'
  }
  for(var i = 0; i < dishPro.infos.length; i++) {
    var proName = dishPro.infos[i];
    text = text.replace((new RegExp('#dish.' + proName + '#', 'i')), dish[proName]);
  }
  if(text.indexOf('#dish.img#') > -1) {
    var imgStr = ''
    if(dish.img) {
      imgStr = '<img src="' + dish.img + '" />';
    }
    text = imgStr;
  }
  if(text.indexOf('#dish.link#') > -1) {
    var linkStr = '';
    if(dish.link) {
      linkStr = '<a href="' + dish.link + '" target="_blank">详情</a>';
    }
    text = text.replace(new RegExp('#dish.link#', 'i'), linkStr);
  }
  return text;
}

var formatAiml = function(ret, text, cb) {
  var tempAry = text.split('#');
  var dishAry = [];
  for(var i = 0; i < tempAry.length; i++) {
    if(tempAry[i].indexOf('dish.') === 0) {
      dishAry.push(tempAry[i]);
    }
  }
  var dishName = _getDishName(ret);
  if(dishAry.length > 0 && dishName !== '') {
    Dish.findByName(dishName, function(err, dish) {
      if(err) {
        return cb(text);
      }
      text = _getDishAnswer(dish, text);
      cb(text);
    })
  } else {
    cb(text);
  }
}

exports.segment = function(req, res) {
  var segment = new Segment();
  segment
    .useDefault()
    .loadDict('../../../config/dicts/dish.txt');
  var question = req.body.question || '';
  var t = Date.now();

  var ret = segment.doSegment(question);

  doAiml(ret, function(result) {
    formatAiml(ret, result, function(fResult) {
      res.send({
        result: fResult,
        question: question,
        words: ret,
        spent: Date.now() - t});
    })
  });
}