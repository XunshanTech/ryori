
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

//分词
var _doSegment = function(question) {
  var segment = new Segment();
  segment
    .useDefault()
    .loadDict('../../../config/dicts/dish.txt');
  return segment.doSegment(question);
}

var _formatDishAnswer = function(dish, text, isWx, cb) {
  var isWx = isWx || false;
  var dishPro = {
    infos: ['name', 'des', 'eat', 'nameFrom', 'categories'],
    link: 'link',
    img: 'img'
  }
  //如果期望返回的是微信端的图片 返回dish对象
  if(text.indexOf('#dish.img#') > -1 && dish.img && dish.img !== '' && isWx) {
    return cb(dish, true);
  }

  for(var i = 0; i < dishPro.infos.length; i++) {
    var proName = dishPro.infos[i];
    text = text.replace((new RegExp('#dish.' + proName + '#', 'i')), dish[proName]);
  }
  if(text.indexOf('#dish.link#') > -1) {
    var linkStr = '';
    if(dish.link) {
      linkStr = '<a href="' + dish.link + '" target="_blank">详情</a>';
    }
    text = text.replace(new RegExp('#dish.link#', 'i'), linkStr);
  }
  if(text.indexOf('#dish.img#') > -1) {
    var imgStr = ''
    if(dish.img) {
      imgStr = '<img src="' + dish.img + '" />';
    }
    text = imgStr;
  }

  cb(text);
}

//根据分词和aiml的答案 判断并获取菜品数据
var _getDish = function(aimlResult, words, cb) {
  var __getDishName = function(ret) {
    for(var i = 0; i < ret.length; i++) {
      if(ret[i].p && ret[i].p === 9) {
        return ret[i].w;
      }
    }
    return '';
  }
  var __textHasDish = function() {
    var _tempAry = aimlResult.split('#');
    for(var i = 0; i < _tempAry.length; i++) {
      if(_tempAry[i].indexOf('dish.') === 0) {
        return true;
      }
    }
    return false;
  }

  var dishName = __getDishName(words);
  if(__textHasDish() && dishName !== '') {
    Dish.findByName(dishName, function(err, dish) {
      cb(dish);
    })
  } else {
    cb(aimlResult);
  }
}

//为机器人 格式化aiml答案
var _formatAnswer = function(aimlResult, words, isWx, cb) {
  _getDish(aimlResult, words, function(dish) {
    if(dish) {
      _formatDishAnswer(dish, aimlResult, isWx, function(answer, isWxImg) {
        cb(answer, isWxImg);
      });
    } else {
      cb(aimlResult);
    }
  });
}

//根据问题，获取aiml语料库对应的原始答案，以及分词结果
var _getOrignalResult = function(question, cb) {
  var words = _doSegment(question);

  var wordsAry = [];
  for(var i = 0; i < words.length; i++) {
    wordsAry.push(words[i].w);
  }

  engine.reply({name: 'You'}, wordsAry.join(' '), function(err, aimlResult){
    cb(aimlResult, words);
  });
}

//网页端机器人
exports.segment = function(req, res) {
  var question = req.body.question || '';
  var t = Date.now();
  _getOrignalResult(question, function(aimlResult, words) {
    _formatAnswer(aimlResult, words, false, function(answer) {
      res.send({
        result: answer,
        question: question,
        words: words,
        spent: Date.now() - t});
    })
  })
}

//微信端机器人
exports.askWxRobot = function(question) {
  _getOrignalResult(question, function(aimlResult, words) {
    _formatAnswer(aimlResult, words, true, function(answer, isWxImg) {

    })
  })
}