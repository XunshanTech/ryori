
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Restaurant = mongoose.model('Restaurant');
var Event = mongoose.model('Event');
var Dish = mongoose.model('Dish');
var DishRestaurant = mongoose.model('DishRestaurant');
var Robot = mongoose.model('Robot');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var Segment = require('segment');
var aiml = require('aiml');
var map = require('./map');
var redis = require('./redis');
var dishRestaurant = require('./dish_restaurant');

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

var _formatDishAnswer = function(dish, text, isWx, inputName, cb) {
  var isWx = isWx || false;
  dish.inputName = inputName; //用于替换 用户输入的原始菜品名称#dish.inputName#
  var dishPro = {
    infos: ['name', 'des', 'eat', 'nameFrom', 'categories', 'inputName'],
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
    var target = isWx ? '' : 'target="_blank"';
    if(dish.link) {
      linkStr = '<a href="' + dish.link + '" ' + target + '>相关文章</a>';
    }
    text = text.replace(new RegExp('#dish.link#', 'i'), linkStr).trim();
    //详情后 附加的内容
    if(text !== '') {
      if(dish.dish_type === 0) {
        text += '\n\n想了解“' + inputName + '”长啥样、怎么吃、去哪吃也可以问我哦~';
      } else {
        text += '\n\n想了解“' + inputName + '”长啥样也可以问我哦~';
      }
    }
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

var _getDishName = function(ret) {
  for(var i = 0; i < ret.length; i++) {
    if(ret[i].p && ret[i].p === 9) {
      return ret[i].w;
    }
  }
  return '';
}

//根据分词和aiml的答案 判断并获取菜品数据
var _getDish = function(aimlResult, words, cb) {

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

  var dishName = _getDishName(words);
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

var _findLocation = function(info, cb) {
  //var last3Hours = new Date((new Date()).getTime() - 1000 * 60 * 60 * 3);
  Event.listLocation({
    criteria: {
      event: 'LOCATION',
      app_id: info.uid,
      /*createdAt: {
       $gte: last3Hours
       },*/
      lng: { $ne: '' },
      lat: { $ne: '' }
    }
  }, function(err, events) {
    cb(err, events);
  });
}

var _getCitys = function(isWx, dishId) {
  var _href = (isWx ? 'http://ryoristack.com' : '') + '/cityRestaurants/';
  var _citys = map.citys;
  var ret = [];
  for(var i = 0; i < _citys.length; i++) {
    var cityLink = _href + _citys[i].key + '/' + dishId;
    ret.push('<a href="' + cityLink + '">' + _citys[i].name + '</a>');
  }
  return ret.join('\n');
}

//为机器人 格式化aiml答案
var _formatAnswer = function(aimlResult, words, info, isWx, cb) {
  if(aimlResult.indexOf('#robot.img#') > -1) {
    //返回机器人的照片
    cb(aimlResult, false, true);
  } else if(aimlResult.indexOf('#dish.restaurants#') > -1) {
    //查找特定城市的菜品对应的餐厅列表
    var _dishName = _getDishName(words);
    if(_dishName === '') return cb('');
    Dish.findByName(_dishName, function(err, dish) {
      var dishId = dish._id;
      var _retCitys = _getCitys(isWx, dishId);
      //info = {uid: 'oQWZBs4zccQ2Lzsoou68ie-kPbao'};
      if(info) {
        _findLocation(info, function(err, events) {
          if(!err && events.length > 0) {
            var _event = events[0];
            var _lng = _event.lng;
            var _lat = _event.lat;
            map.getCityKey(_lat, _lng, function(err, cityKey, cityName) {
              if(err) return cb(_retCitys);

              dishRestaurant.getTopDishRestaurants(dish, cityKey, function(err, dishRestaurants) {
                var rets = ['在' + cityName + '吃“' + _dishName + '”的话我推荐下面这几家店：'];
                for(var i = 0; i < dishRestaurants.length; i++) {
                  var _restaurant = dishRestaurants[i].fetch_restaurant;
                  var _local_name = _restaurant.local_name === '' ?
                    '' : ('(' + _restaurant.local_name + ')');
                  var _recommend = '';
                  if(i === 0 && dishRestaurants[i].recommend && dishRestaurants[i].recommend !== '') {
                    _recommend = ' ' + dishRestaurants[i].recommend;
                  }
                  var _href = (isWx ? 'http://ryoristack.com' : '') + '/dishRestaurant/' + dishId + '/' + _restaurant._id;
                  rets.push('<a href="' + _href + '">' + _restaurant.name + _local_name + '</a>' + _recommend);
                }
                rets.push('你吃过的最好吃的店不在上面？可以告诉我们。');
                return cb(rets.join('\n\n'));
              });
            })
          } else {
            return cb(_retCitys);
          }
        })
      } else {
        return cb(_retCitys);
      }
    })
  } else if(aimlResult.indexOf('#dish.') > -1) {
    //返回菜品的相关信息
    _getDish(aimlResult, words, function(dish, hasDish) {
      if(dish) {
        var _name = _getDishName(words);
        _formatDishAnswer(dish, aimlResult, isWx, _name, function(answer, isWxImg) {
          if(!isWxImg) {
            if(_name !== dish.name) {
              answer = _name + '也称' + dish.name + '。\n' + answer;
            }
          }
          cb(answer, isWxImg);
        });
      } else {
        //判断如果回复字段中包括#dish.xxx# 但是又没有找到dish 则返回空串
        cb(hasDish ? '' : aimlResult);
      }
    });
  } else {
    //默认返回aiml里设置的答案
    cb(aimlResult);
  }
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
    _formatAnswer(aimlResult, words, null, false, function(answer) {
      res.send({
        result: answer,
        question: question,
        words: words,
        spent: Date.now() - t});
    })
  })
}

//微信端机器人
exports.askWxRobot = function(info, question, cb) {
  _getOrignalResult(question, function(aimlResult, words) {
    _formatAnswer(aimlResult, words, info, true, function(answer, isWxImg, isRobotImg) {
      cb(answer, isWxImg, isRobotImg);
    })
  })
}