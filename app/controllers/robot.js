
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
var Question = mongoose.model('Question');
var Paper = mongoose.model('Paper');

var utils = require('../../lib/utils');
var map = require('../../lib/map');
var ai = require('../../lib/ai');
var seg = require('../../lib/seg');

var msg = require('../rules/msg');
var redis = require('./redis');
var async = require('async');
var dishRestaurant = require('./dish_restaurant');
var robotAnalytics = require('./robot_analytics');

var Base;

exports.index = function(req, res) {
  res.render('robot/index');
}

function _formatDishAnswer(dish, text, inputName, cb) {
  dish.inputName = inputName; //用于替换 用户输入的原始菜品名称#dish.inputName#
  var dishPro = {
    infos: ['name', 'des', 'eat', 'nameFrom', 'categories', 'inputName'],
    link: 'link',
    img: 'img'
  }
  //如果期望返回的是微信端的图片 返回dish对象
  if(text.indexOf('#dish.img#') > -1 && dish.imgs) {
    return cb(dish, true);
  }

  dishPro.infos.forEach(function(proName) {
    if(!dish[proName] || dish[proName] === '') {
      if(proName === 'eat') {
        dish[proName] = '这个就没啥特殊讲究啦，跟着你的直觉去吃吧~';
      } else if(proName === 'categories') {
        dish[proName] = '栈栈目前也没获得“' + inputName + '”种类的数据呢T_T';
      }
    }
    text = text.replace((new RegExp('#dish.' + proName + '#', 'i')), dish[proName]);
  })

  if(text.indexOf('#dish.link#') > -1) {
    var linkStr = dish.link ? ('<a href="' + dish.link + '">相关文章</a>') : '';
    text = text.replace(new RegExp('#dish.link#', 'i'), linkStr).trim();
    //详情后 附加的内容
    if(text === '') return cb('');

    text += '\n\n想了解“' + dish.name + '”' +
      (dish.dish_type === 0 ? '长啥样、怎么吃、去哪吃也可以问我哦~' : '长啥样也可以问我哦~');
  }

  cb(text.trim());
}

//构造推荐餐厅的链接和推荐语
function _getDishRestaurantLink(dish, dishRestaurant, cb) {
  var _restaurant = dishRestaurant.fetch_restaurant;
  var _local_name = _restaurant.local_name === '' ?
    '' : ('(' + _restaurant.local_name + ')');
  var _recommend = (dishRestaurant.recommend && dishRestaurant.recommend !== '') ?
    (' ' + dishRestaurant.recommend) : '';
  var _href = 'http://ryoristack.com/dishRestaurant/' + dish._id + '/' + _restaurant._id;

  var _restaurantLink = '<a href="' + _href + '">' + _restaurant.name + _local_name + '</a>' + _recommend;
  var _paperLink = '';

  var _getPaperLink = function(papers) {
    var url = '';
    if(papers.length > 1) {
      url = 'http://ryoristack.com/restaurantPaper/' + _restaurant._id;
    } else if(papers.length === 1) {
      url = papers[0].url;
    }
    return url === '' ? '' : '(<a href="' + url +  '">证据</a>)';
  }

  Paper.listAll({
    criteria: {
      fetchRestaurants: {
        $in: [new ObjectId(_restaurant._id)]
      }
    }
  }, function(err, papers) {
    _paperLink = _getPaperLink(papers);
    cb(_restaurantLink + _paperLink);
  })
}

//构造餐厅推荐的答案
function _formatRestaurantAnswer(dish, cityObj, _dishSegment, cb) {
  dishRestaurant.getTopDishRestaurants(dish, cityObj.key, function (err, dishRestaurants) {
    if(dishRestaurants.length === 0) {
      cb('抱歉啊，这个我还没来得及考察，请再给我些时间吧！');
    } else {
      var rets = [], _answer = '';
      if(dish.name !== _dishSegment.w) {
        _answer = _dishSegment.p === 5 ? ('我猜你要问的是“' + dish.name + '”，') :
          (_dishSegment.w + '也称' + dish.name + '。');
      }
      rets.push(_answer + '在' + cityObj.name + '吃“' + dish.name + '”的话我推荐下面这几家店：');

      async.each(dishRestaurants, function(dishRestaurant, callback) {
        _getDishRestaurantLink(dish, dishRestaurant, function(link) {
          rets.push(link);
          callback();
        });
      }, function(err) {
        if(err) {
          console.log(err);
        }
        rets.push('你吃过的最好吃的店不在上面？可以告诉我们。');

        cb(rets.join('\n\n'));
      });
    }
  });
}

function _findCityByInfo(info, _citySegment, cb) {
  var __nextByCityName = function(cityName) {
    var _city = map.getCityByName(cityName);
    cb(null, _city);
  }

  if(_citySegment) {
    var _cityName = _citySegment.isOther ? 'other' : _citySegment.w;
    __nextByCityName(_cityName);
  } else {
    User.findOne({
      'wx_app_id': info.uid
    }, function(err, find_user) {
      if((err || !find_user || find_user.user_temp_city === '') && Base) {
        Base.updateUserByWx(info, function(err, message, user) {
          if(!err && user) __nextByCityName(user.user_temp_city);
        })
      } else __nextByCityName(find_user.user_temp_city);
    });
  }
}

//根据question id查找并返回相应的question答案
function _answerByQuestion(aimlResult, cb) {
  var questionId = aimlResult.replace('QUESTIONID_', '');
  Question.load(questionId, function(err, question) {
    if(!err && question) {
      question.isQuestion = true;
      cb(question);
    }
  })
}

var _findPaperBySegment = function(_dishSegment, _paperSegment, cb) {
  var _segment = _paperSegment ? _paperSegment : _dishSegment;
  var criteria = {
    tags: {
      $in: [_segment.w]
    }
  }
  Paper.listAll({
    criteria: criteria
  }, function(err, papers) {
    cb(err, papers)
  })
}

var _formatPaperAnswer = function(papers, cb) {
  if(papers.length > 0) {
    var rets = [];
    var len = papers.length > 3 ? 3 : papers.length;
    for(var i = 0; i < len; i++) {
      var paper = papers[i];
      var url = (paper.short_url && paper.short_url !== '') ? paper.short_url : paper.url;
      rets.push(['<a href="', url, '">', paper.name, '</a>'].join(''));
    }
    cb(rets.join('\n\n'));
  } else {
    cb(msg.paperNull);
  }
}

var _renderPaperResult = function(info, _dishSegment, _paperSegment, aiml, cb) {
  if(!_dishSegment && !_paperSegment) return cb(msg.paperNull);

  _findPaperBySegment(_dishSegment, _paperSegment, function(err, papers) {
    _formatPaperAnswer(papers, cb);
  })
}

var _renderResult = function(info, dish, _dishSegment, _citySegment, aiml, cb) {
  if (!dish) return cb('');

  //过滤掉不必要的关键字
  aiml = aiml.replace(new RegExp('#dish.other#', 'i'), '');

  robotAnalytics.create(dish, aiml, info.uid);

  if (aiml.indexOf('#dish.restaurants#') > -1) {

    if(dish.dish_type === 1) {
      return cb('调味料哪家好吃这种问题太非主流啦，不如问我寿司哪家好吃~');
    }
    _findCityByInfo(info, _citySegment, function (err, cityObj) {
      if (cityObj && cityObj.key) {
        _formatRestaurantAnswer(dish, cityObj, _dishSegment, cb);
      } else {
        // 获取的用户所在城市 不在系统支持的城市列表中
        cb(msg.unknowCity(dish.name));
      }
    })
  } else {
    _formatDishAnswer(dish, aiml, _dishSegment.w, function (answer, isWxImg) {
      if (!isWxImg && _dishSegment.w !== dish.name) {
        answer = (_dishSegment.p === 5 ? ('我猜你要问的是“' + dish.name + '”，') :
          (_dishSegment.w + '也称' + dish.name + '。\n')) + answer;
      }
      cb(answer, isWxImg);
    });
  }
}

var _formatSegment = function(name) {
  return {p: 9, w: name || '日本料理'}
}

function _answerOnlyCity(info, _dishSegment, _citySegment, cb) {
  var _restaurantsAiml = '#dish.restaurants#';
  robotAnalytics.getLast(info.uid, function (err, _robotAnalytics) {
    if (err || !_robotAnalytics) {
      _dishSegment = _formatSegment();
      Dish.findByName(_dishSegment.w, function (err, dish) {
        _renderResult(info, dish, _dishSegment, _citySegment, _restaurantsAiml, cb);
      })
    } else {
      //模拟分词结果
      _dishSegment = _formatSegment(_robotAnalytics.dish.name);
      _renderResult(info, _robotAnalytics.dish, _dishSegment, _citySegment, _restaurantsAiml, cb);
    }
  })
}

//查找菜品及问题类型
function _answerOnlyDish(info, _dishSegment, _citySegment, _isMore, cb) {
  var _restaurantsAiml = '#dish.des# #dish.link#';
  robotAnalytics.getLast(info.uid, function (err, _robotAnalytics) {
    // 如果查询到前一次的菜品相关问题 返回前次的提问内容 未找到的话按照默认的查询逻辑
    _restaurantsAiml = (err || !_robotAnalytics || _isMore) ? _restaurantsAiml :
      _robotAnalytics.answerType;
    if(_isMore) {
      _dishSegment = {w: _robotAnalytics.dish.name, p: 9};
    }
    Dish.findByName(_dishSegment.w, function (err, dish) {
      _renderResult(info, dish, _dishSegment, _citySegment, _restaurantsAiml, cb);
    })
  })
}

function _answerOnlyMethod(info, aimlResult, _dishSegment, _citySegment, cb) {
  robotAnalytics.getLast(info.uid, function (err, _robotAnalytics) {
    if (err || !_robotAnalytics) {
      _dishSegment = _formatSegment();
      Dish.findByName(_dishSegment.w, function (err, dish) {
        _renderResult(info, dish, _dishSegment, _citySegment, aimlResult, cb);
      })
    } else {
      //模拟分词结果
      _dishSegment = _formatSegment(_robotAnalytics.dish.name);
      _renderResult(info, _robotAnalytics.dish, _dishSegment, _citySegment, aimlResult, cb);
    }
  })
}

function _findDishAndAnswerIt(aimlResult, info, words, cb) {
  var _dishSegment = seg.getDishSeg(words);
  var _citySegment = seg.getCitySeg(words);
  var _paperSegment = seg.getPaperSeg(words);
  var _isMore = seg.isMore(words);
  if(aimlResult.indexOf('#dish.last#') > -1) {
    if(!_dishSegment && !_isMore) {
      if(_citySegment) {
        //1. 寿司是什么 2. 北京呢
        _answerOnlyCity(info, _dishSegment, _citySegment, cb);
      } else {
        //1. 寿司是什么 2. 天天呢
        return cb('');
      }
    } else {
      //1. 寿司是什么 2. 天妇罗呢
      _answerOnlyDish(info, _dishSegment, _citySegment, _isMore, cb);
    }
  } else {
    if(aimlResult.indexOf('#dish.paper#') > -1) {
      _renderPaperResult(info, _dishSegment, _paperSegment, aimlResult, cb);
    } else if(_dishSegment) {
      //原有的根据分词查询逻辑
      Dish.findByName(_dishSegment.w, function (err, dish) {
        _renderResult(info, dish, _dishSegment, _citySegment, aimlResult, cb);
      })
    } else {
      if(aimlResult.indexOf('#dish.other#') > -1) {
        if(_citySegment) {
          //1. 寿司是什么 2. 北京  or 1. 北京
          _answerOnlyCity(info, _dishSegment, _citySegment, cb);
        } else {
          //没有菜品分词 也没有匹配上通常的菜品问题
          cb('');
        }
      } else {
        //1. 寿司是什么 2. 怎么吃 or 什么样 or 去哪儿吃
        _answerOnlyMethod(info, aimlResult, _dishSegment, _citySegment, cb);
      }
    }
  }
}

//为机器人 格式化aiml答案
var _formatAnswer = function(aimlResult, words, info, cb) {
  //返回机器人的照片
  if(aimlResult.indexOf('#robot.img#') > -1) return cb(aimlResult, false, true);
  //返回机器人使用帮助
  if(aimlResult === 'help') return cb(msg.robotHelp);

  if(aimlResult.indexOf('QUESTIONID_') > -1) {
    //匹配自定义的问题
    _answerByQuestion(aimlResult, function(question) {
      if(question && question.isSystem) {
        if(question.text === 'help') {
          cb(msg.robotHelp);
        } else {
          _findDishAndAnswerIt(question.text, info, words, cb);
        }
      } else {
        cb(question);
      }
    });
  } else if(aimlResult.indexOf('#dish.') < 0) {
    //默认返回aiml里设置的答案
    return cb(aimlResult);
  } else {
    _findDishAndAnswerIt(aimlResult, info, words, cb);
  }

}

//根据问题，获取aiml语料库对应的原始答案，以及分词结果
var _getOrignalResult = function(question, cb) {
  utils.fanjian(question, function(err, text) {
    var words = seg.doSeg(text);
    ai.reply(words, function(err, aimlResult) {
      cb(aimlResult, words);
    })
  })
}

//网页端机器人
exports.segment = function(req, res) {
  var question = req.body.question || '';
  var t = Date.now();
  var mockInfo = {
    uid: 'oQWZBs3-64Yrb3NCplva8j8vePic',
    isClient: true
  };
  _getOrignalResult(question, function(aimlResult, words) {
    _formatAnswer(aimlResult, words, mockInfo, function(answer, isWxImg, isRobotImg) {
      res.send({
        answer: answer,
        isWxImg: isWxImg,
        isRobotImg: isRobotImg,
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
    _formatAnswer(aimlResult, words, info, function(answer, isWxImg, isRobotImg) {
      cb(answer, isWxImg, isRobotImg);
    })
  })
}