
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Restaurant = mongoose.model('Restaurant');
var Event = mongoose.model('Event');
var User = mongoose.model('User');
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
var msg = require('../rules/msg');
var map = require('./map');
var redis = require('./redis');
var dishRestaurant = require('./dish_restaurant');
var robotAnalytics = require('./robot_analytics');

var OpenCC = require('opencc');

var zht2zhs = new OpenCC('t2s.json');

// 确保都是简体字
function fanjian(text, cb) {
  zht2zhs.convert(text, function(err, converted) {
    if (err) console.log(err);
    cb(converted || text);
  });
}


var filenames = [
  //'config/aimls/test.aiml'
  'config/aimls/alice.aiml',
  'config/aimls/dish.aiml'
];
var engine;
var Base;

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
    .loadDict('../../../config/dicts/city.txt')
    .loadDict('../../../config/dicts/dish.txt')
    .loadDict('../../../config/dicts/dish_error_name.txt');
    // 字典文件
/*
  segment
    .useDefault()
    .loadDict('../../../config/dicts/dish.txt');
*/
  return segment.doSegment(question);
}

var _getDishSegment = function(ret) {
  for(var i = 0; i < ret.length; i++) {
    if(ret[i].p && (ret[i].p === 9 || ret[i].p === 5)) {
      return ret[i];
    }
  }
  return null;
}

var _getCityName = function(ret) {
  for(var i = 0; i < ret.length; i++) {
    if(ret[i].p && ret[i].p === 7) {
      return ret[i].w;
    }
  }
  return null;
}

/*
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
*/

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
    if(!dish[proName] || dish[proName] === '') {
      if(proName === 'eat') {
        dish[proName] = '这个就没啥特殊讲究啦，跟着你的直觉去吃吧~';
      } else if(proName === 'categories') {
        dish[proName] = '栈栈目前也没获得“' + inputName + '”种类的数据呢T_T';
      }
    }
    text = text.replace((new RegExp('#dish.' + proName + '#', 'i')), dish[proName]);
  }
  if(text.indexOf('#dish.link#') > -1) {
    var linkStr = dish.link ? ('<a href="' + dish.link + '">相关文章</a>') : '';
    text = text.replace(new RegExp('#dish.link#', 'i'), linkStr).trim();
    //详情后 附加的内容
    if(text === '') cb('');

    text += '\n\n想了解“' + dish.name + '”' +
      (dish.dish_type === 0 ? '长啥样、怎么吃、去哪吃也可以问我哦~' : '长啥样也可以问我哦~');
  }
  if(text.indexOf('#dish.img#') > -1) {
    text = dish.img ? ('<img src="' + dish.img + '" />') : '';
  }

  cb(text.trim());
}

//构造餐厅推荐的答案
function _formatRestaurantAnswer(dish, cityObj, _dishSegment, isWx, cb) {
  dishRestaurant.getTopDishRestaurants(dish, cityObj.key, function (err, dishRestaurants) {
    if(dishRestaurants.length === 0) {
      cb('抱歉啊，这个我还没来得及考察，请再给我些时间吧！');
    } else {
      var rets = [];
      var _answer = '';
      if(dish.name !== _dishSegment.w) {
        if(_dishSegment.p === 5) { // error input name
          _answer = '我猜你要问的是“' + dish.name + '”，';
        } else {
          _answer = _dishSegment.w + '也称' + dish.name + '。';
        }
      }

      rets.push(_answer + '在' + cityObj.name + '吃“' + dish.name + '”的话我推荐下面这几家店：');

      for (var i = 0; i < dishRestaurants.length; i++) {
        var _restaurant = dishRestaurants[i].fetch_restaurant;
        var _local_name = _restaurant.local_name === '' ?
          '' : ('(' + _restaurant.local_name + ')');
        var _recommend = (dishRestaurants[i].recommend && dishRestaurants[i].recommend !== '') ?
          (' ' + dishRestaurants[i].recommend) : '';
        var _href = (isWx ? 'http://ryoristack.com' : '') + '/dishRestaurant/' + dish._id + '/' + _restaurant._id;

        rets.push('<a href="' + _href + '">' + _restaurant.name + _local_name + '</a>' + _recommend);
      }

      rets.push('你吃过的最好吃的店不在上面？可以告诉我们。');

      return cb(rets.join('\n\n'));
    }
  });
}

var _findCityByInfo = function(info, words, cb) {
  var _cityName = _getCityName(words);
  if(_cityName) {
    var _city = map.getCityByName(_cityName);
    return cb(null, _city);
  } else if(info) {
    User.findOne({
      'wx_app_id': info.uid
    }, function(err, find_user) {
      var __nextByUser = function(user) {
        if(user.user_temp_city !== '') {
          var _city = map.getCityByName(user.user_temp_city);
          cb(null, _city);
        }
      }
      if((!find_user || find_user.user_temp_city === '') && Base) {
        Base.updateUserByWx(info, function(err, msg, user) {
          if(!err && user) __nextByUser(user);
        })
      } else __nextByUser(find_user);
    });
  } else {
    return cb('find city by info arguments is undefined!');
  }
}

//查找菜品及问题类型
function _findDishAndAnswerIt(aimlResult, info, words, isWx, cb) {
  var _dishSegment = _getDishSegment(words);

  //var _retCitys = _getCitys(isWx, dish._id);
  //info = {uid: 'oQWZBs4zccQ2Lzsoou68ie-kPbao'};

  var _renderResult = function(info, dish, aiml, isWx) {
    if (!dish) return cb('');

    //过滤掉不必要的关键字
    aiml = aiml.replace(new RegExp('#dish.other#', 'i'), '');

    if(info) {
      //只记录微信用户的操作
      robotAnalytics.create(dish, aiml, info.uid);
    }

    if (aiml.indexOf('#dish.restaurants#') > -1) {

      if(dish.dish_type === 1) {
        return cb('调味料哪家好吃这种问题太非主流啦，不如问我寿司哪家好吃~');
      }

      _findCityByInfo(info, words, function (err, cityObj) {
        //if(err) return cb(_retCitys);
        if (cityObj && cityObj.key) {
          _formatRestaurantAnswer(dish, cityObj, _dishSegment, isWx, cb);
        } else {
          // 获取的用户所在城市 不在系统支持的城市列表中
          cb(msg.unknowCity(dish.name));
        }
      })
    } else {
      _formatDishAnswer(dish, aiml, isWx, _dishSegment.w, function (answer, isWxImg) {
        if (!isWxImg && _dishSegment.w !== dish.name) {
          if (_dishSegment.p === 5) { // error input name
            answer = '我猜你要问的是“' + dish.name + '”，' + answer;
          } else {
            answer = _dishSegment.w + '也称' + dish.name + '。\n' + answer;
          }
        }
        cb(answer, isWxImg);
      });
    }
  }

  if(!info) {
    //页面测试机器人
    if(!_dishSegment) return cb('');
    Dish.findByName(_dishSegment.w, function (err, dish) {
      _renderResult(info, dish, aimlResult, isWx);
    })
  } else if(aimlResult.indexOf('#dish.last#') > -1) {
    if(!_dishSegment) {
      //1. 寿司是什么 2. 天天呢
      return cb('');
    } else {
      //1. 寿司是什么 2. 天妇罗呢
      robotAnalytics.getLast(info.uid, function(err, _robotAnalytics) {
        // 如果查询到前一次的菜品相关问题 返回前次的提问内容 未找到的话按照默认的查询逻辑
        var result = (err || !_robotAnalytics) ?
            aimlResult.replace(new RegExp('#dish.last#', 'i'), '') : _robotAnalytics.answerType;

        Dish.findByName(_dishSegment.w, function (err, dish) {
          _renderResult(info, dish, result, isWx);
        })
      })
    }
  } else {
    if(_dishSegment) {
      //原有的根据分词查询逻辑
      Dish.findByName(_dishSegment.w, function (err, dish) {
        _renderResult(info, dish, aimlResult, isWx);
      })
    } else {
      if(aimlResult.indexOf('#dish.other#') > -1) {
        //没有菜品分词 也没有匹配上通常的菜品问题
        cb('');
      } else {
        //1. 寿司是什么 2. 怎么吃 or 什么样 or 去哪儿吃
        robotAnalytics.getLast(info.uid, function(err, _robotAnalytics) {
          if(err || !_robotAnalytics) return cb('');
          //模拟分词结果
          _dishSegment = {
            w: _robotAnalytics.dish.name,
            p: 8
          }
          _renderResult(info, _robotAnalytics.dish, aimlResult, isWx);
        })
      }
    }
  }
}

//为机器人 格式化aiml答案
var _formatAnswer = function(aimlResult, words, info, isWx, cb) {
  //返回机器人的照片
  if(aimlResult.indexOf('#robot.img#') > -1) return cb(aimlResult, false, true);
  //返回机器人使用帮助
  if(aimlResult === 'help') return cb(msg.robotHelp);
  //默认返回aiml里设置的答案
  if(aimlResult.indexOf('#dish.') < 0) return cb(aimlResult);

  _findDishAndAnswerIt(aimlResult, info, words, isWx, cb);
}

//根据问题，获取aiml语料库对应的原始答案，以及分词结果
var _getOrignalResult = function(question, cb) {
  fanjian(question, function(text) {
    var words = _doSegment(text);

    var wordsAry = [];
    for(var i = 0; i < words.length; i++) {
      wordsAry.push(words[i].w);
    }

    engine.reply({name: 'You'}, wordsAry.join(' '), function(err, aimlResult){
      cb(aimlResult, words);
    });
  })
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
exports.askWxRobot = function(info, base, question, cb) {
  Base = base;
  _getOrignalResult(question, function(aimlResult, words) {
    _formatAnswer(aimlResult, words, info, true, function(answer, isWxImg, isRobotImg) {
      cb(answer, isWxImg, isRobotImg);
    })
  })
}