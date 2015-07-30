
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
  //'config/aimls/test.aiml'
  'config/aimls/alice.aiml',
  'config/aimls/dish.aiml'
];
var engine;

aiml.parseFiles(filenames, function(err, topics){
  //console.log(JSON.stringify(topics));
  engine = new aiml.AiEngine('Default', topics, {name: '李栈栈', sex: '男', old: '1'});
});

exports.index = function(req, res) {
  res.render('robot/index');
}

//分词
var _doSegment = function(question) {
  var segment = new Segment();
  segment
    .use('URLTokenizer')            // URL识别
    .use('WildcardTokenizer')       // 通配符，必须在标点符号识别之前
    .use('PunctuationTokenizer')    // 标点符号识别
    //.use('ForeignTokenizer')        // 外文字符、数字识别，必须在标点符号识别之后
    // 中文单词识别
    .use('DictTokenizer')           // 词典识别
    .use('ChsNameTokenizer')        // 人名识别，建议在词典识别之后

    // 优化模块
    .use('EmailOptimizer')          // 邮箱地址识别
    .use('ChsNameOptimizer')        // 人名识别优化
    .use('DictOptimizer')           // 词典识别优化
    .use('DatetimeOptimizer')       // 日期时间识别优化
    .loadDict('../../../config/dicts/dish.txt');
    // 字典文件
/*
  segment
    .useDefault()
    .loadDict('../../../config/dicts/dish.txt');
*/
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
    if(!aimlResult) return false;

    var _tempAry = aimlResult.split('#');
    for(var i = 0; i < _tempAry.length; i++) {
      if(_tempAry[i].indexOf('dish.') === 0) {
        return true;
      }
    }
    return false;
  }

  var dishName = __getDishName(words);
  if(__textHasDish()) {
    if(dishName !== '') {
      Dish.findByName(dishName, function(err, dish) {
        cb(dish, true);
      })
    } else {
      cb(null, true);
    }
  } else {
    cb(null);
  }
}

//为机器人 格式化aiml答案
var _formatAnswer = function(aimlResult, words, isWx, cb) {
  _getDish(aimlResult, words, function(dish, hasDish) {
    if(dish) {
      _formatDishAnswer(dish, aimlResult, isWx, function(answer, isWxImg) {
        cb(answer, isWxImg);
      });
    } else {
      //判断如果回复字段中包括#dish.xxx# 但是又没有找到dish 则返回空串
      cb(hasDish ? '' : aimlResult);
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
exports.askWxRobot = function(question, cb) {
  _getOrignalResult(question, function(aimlResult, words) {
    _formatAnswer(aimlResult, words, true, function(answer, isWxImg) {
      cb(answer, isWxImg);
    })
  })
}