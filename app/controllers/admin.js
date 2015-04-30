
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Article = mongoose.model('Article');
var Restaurant = mongoose.model('Restaurant');
var User = mongoose.model('User');
var Media = mongoose.model('Media');
var Event = mongoose.model('Event');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var fsTools = require('fs-tools');
var async = require('async');

var bw = require ("buffered-writer");

exports.superIndex = function(req, res) {
  res.render('super/index');
}

exports.superSub = function(req, res) {
  var sub = req.params.superSub;
  res.render('super/' + sub);
}

var _fetchUsers = function(req, res, options) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 10;
  //筛选用户级别
  var selTabIndex = parseInt(req.param('selTabIndex'));
  if(selTabIndex >= 1 && selTabIndex <= 3) {
    options.criteria.group = selTabIndex;
  }
  options.page = page;
  options.perPage = perPage;

  User.list(options, function(err, users) {
    User.count(options.criteria, function(err, count) {
      res.send({
        users: users,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}

exports.getData = function(req, res) {
  var getUserCount = function(callback) {
    User.count({provider: 'wx'}, function(err, count) {
      callback(null, count);
    })
  };
  var getVoiceCount = function(callback) {
    Media.count({checked_status: {
      $in: [0, 1]
    }}, function(err, count) {
      callback(null, count)
    })
  }
  var getPlayCount = function(callback) {
    Event.count({is_media_play: true}, function(err, count) {
      callback(null, count);
    })
  }
  var getRestaurantCount = function(callback) {
    Restaurant.count(function(err, count) {
      callback(null, count);
    })
  }
  async.parallel([getUserCount, getVoiceCount, getPlayCount, getRestaurantCount], function(err, results) {
    res.send({
      userCount: results[0],
      voiceCount: results[1],
      playCount: results[2],
      restaurantCount: results[3]
    })

  })
}

exports.getDataUser = function(req, res) {
  var time = 1000 * 60 * 60 * 24;
  var showNum = 8;
  var group = {
    initial: { count: 0 },
    cond: { provider: 'wx' },
    keyf: function(x) {
      return {
        week: parseInt((new Date(x.createdAt)).getTime() / (1000 * 60 * 60 * 24))
      }
    },
    reduce: function(doc, prev) {
      prev.count++;
    }
  }

  User.collection.group(group.keyf, group.cond, group.initial, group.reduce, {}, true, function(err, rets) {
    var users = [];
    if(!err) {
      rets.sort(function(a, b) {
        return a.week - b.week;
      });
      for(var i = 0; i < rets.length; i++) {
        var ret = rets[i];
        if(i === 0) users.push([(ret.week + 1) * time, ret.count]);
        if(i > 0) {
          var playLastIndex = users.length - 1;
          var lastWeek = parseInt(users[playLastIndex][0] / time);
          var lastCount = users[users.length - 1][1];
          while(ret.week > lastWeek) {
            lastWeek++;
            users.push([lastWeek * time, lastCount]);
          }
          users.push([(ret.week + 1) * time, ret.count + lastCount]);
        }
      }
    }
    if(users.length > showNum) {
      users.splice(0, users.length - showNum);
    }
    res.send({
      users: users
    })
  });
}

exports.getDataPlay = function(req, res) {
  var time = 1000 * 60 * 60 * 24;
  var showNum = 8;
  var group = {
    initial: { count: 0 },
    cond: { is_media_play: true },
    keyf: function(x) {
      return {
        week: parseInt((new Date(x.createdAt)).getTime() / (1000 * 60 * 60 * 24))
      }
    },
    reduce: function(doc, prev) {
      prev.count++;
    }
  }

  Event.collection.group(group.keyf, group.cond, group.initial, group.reduce, {}, true, function(err, rets) {
    var plays = [];
    if(!err) {
      rets.sort(function(a, b) {
        return a.week - b.week;
      });
      for(var i = 0; i < rets.length; i++) {
        var ret = rets[i];
        if(i === 0) plays.push([(ret.week + 1) * time, ret.count]);
        if(i > 0) {
          var playLastIndex = plays.length - 1;
          var lastWeek = parseInt(plays[playLastIndex][0] / time);
          var lastCount = plays[plays.length - 1][1];
          while(ret.week > lastWeek) {
            lastWeek++;
            plays.push([lastWeek * time, lastCount]);
          }
          plays.push([(ret.week + 1) * time, ret.count + lastCount]);
        }
      }
    }
    if(plays.length > showNum) {
      plays.splice(0, plays.length - showNum);
    }
    res.send({
      plays: plays
    })
  });
}

exports.getDataUserDetail = function(req, res) {
  var time = 1000 * 60 * 60 * 24;
  var group = {
    initial: { count: 0 },
    cond: { provider: 'wx' },
    keyf: function(x) {
      return {
        week: parseInt((new Date(x.createdAt)).getTime() / (1000 * 60 * 60 * 24))
      }
    },
    reduce: function(doc, prev) {
      prev.count++;
    }
  }

  User.collection.group(group.keyf, group.cond, group.initial, group.reduce, {}, true, function(err, rets) {
    var users = [];
    if(!err) {
      rets.sort(function(a, b) {
        return a.week - b.week;
      });
      for(var i = 0; i < rets.length; i++) {
        var ret = rets[i];
        users.push([(ret.week) * time, ret.count]);
      }
    }
    res.send({
      users: users
    })
  });
}

exports.getDataPlayDetail = function(req, res) {
  var time = 1000 * 60 * 60 * 24;
  var group = {
    initial: { count: 0 },
    cond: { is_media_play: true },
    keyf: function(x) {
      return {
        week: parseInt((new Date(x.createdAt)).getTime() / (1000 * 60 * 60 * 24))
      }
    },
    reduce: function(doc, prev) {
      prev.count++;
    }
  }

  Event.collection.group(group.keyf, group.cond, group.initial, group.reduce, {}, true, function(err, rets) {
    var plays = [];
    if(!err) {
      rets.sort(function(a, b) {
        return a.week - b.week;
      });
      for(var i = 0; i < rets.length; i++) {
        var ret = rets[i];
        plays.push([(ret.week) * time, ret.count]);
      }
    }
    res.send({
      plays: plays
    })
  });
}


exports.getUsers = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 10;
  //筛选用户级别
  var selTabIndex = parseInt(req.param('selTabIndex'));

  var options = {
    page: page,
    perPage: perPage,
    criteria: {
      provider: 'wx'
    }
  }
  if(selTabIndex >= 1 && selTabIndex <= 3) {
    options.criteria.group = selTabIndex;
  }

  User.list(options, function(err, users) {
    User.count(options.criteria, function(err, count) {
      res.send({
        users: users,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}

/**
 * Load temp user for next
 */
exports.loadUser = function(req, res, next, userId) {
  var options = {
    criteria: { _id : userId }
  };
  User.load(options, function (err, user) {
    if (err) return next(err);
    if (!user) return next(new Error('Failed to load User ' + userName));
    req.tempUser = user;
    next();
  });
}

/**
 * Load temp article for next
 */
exports.loadArticle = function(req, res, next, articleId) {
  Article.load(articleId, function (err, article) {
    if (err) return next(err);
    if (!article) return next(new Error('not found'));
    req.tempArticle = article;
    next();
  });
}

/**
 * Load temp media for next
 */
exports.loadMedia = function(req, res, next, mediaId) {
  Media.load(mediaId, function (err, media) {
    if (err) return next(err);
    if (!media) return next(new Error('not found'));
    req.tempMedia = media;
    next();
  });
}

exports.loadRestaurant = function(req, res, next, restaurantId) {
  Restaurant.load(restaurantId, function(err, restaurant) {
    if(err) return next(err);
    if(!restaurant) return next(new Error('not found'));
    req.tempRestaurant = restaurant;
    next();
  })
}

exports.updateUser = function(req, res) {
  var user = req.tempUser;
  var wrapData = user.wrapData;
  delete user.wrapData;
  delete user._csrf;
  user = extend(user, req.body);
  user.save(function(err) {
    if(err) {
      return res.send({
        message: 'Update user error!'
      });
    }
    user.wrapData = wrapData;
    res.send({
      user: user
    });
  })
}

exports.getAdmins = function(req, res) {
  var options = {
    criteria: {
      '$where': function() {
        return this.isAdmin || this.isSuperAdmin;
      }
    }
  };
  _fetchUsers(req, res, options);
}

exports.wxtest = function(req, res) {
  Restaurant.find({
    $where: function() {
      //this.size = 100;
      return true;
    }
  }).exec(function(err, docs) {
      console.log(docs);
    });
}

exports.setMenu = function(req, res) {
  var wx_api = req.wx_api;
  wx_api.createMenu({
    "button":[
      {
        "type":"click",
        "name":"收听评论",
        "key":"MENU_STPL"
      }, {
        "type":"click",
        "name":"玩法介绍",
        "key":"MENU_WFJS"
      }, {
        "type":"click",
        "name":"关于我们",
        "key":"MENU_GYWM"
      }]

  }, function(err, result) {
    res.send({
      success: !err && true
    })
  })
}

exports.updateRestaurant = function(req, res) {
  var restaurant =req.tempRestaurant;
  restaurant = extend(restaurant, req.body);
  restaurant.save(function(err, restaurantObj) {
    res.send({
      success: !err && true,
      restaurant: restaurantObj
    })
  })
}

exports.getRestaurant = function(req, res) {
  var restaurant = req.tempRestaurant;
  return res.send(restaurant);
}

exports.getRestaurants = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 10;
  var getAll = req.param('getAll') === 'true' ? true : false;
  var options = {
    page: page,
    perPage: perPage
  };
  if(getAll) {
    options = {};
  }
  Restaurant.list(options, function(err, restaurants) {
    Restaurant.count({}, function(err, count) {
      res.send({
        restaurants: restaurants,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}

var _wrapper = function (callback) {
  return function (err, data, res) {
    callback = callback || function () {};
    if (err) {
      err.name = 'WeChatAPI' + err.name;
      return callback(err, data, res);
    }
    if (data.errcode) {
      err = new Error(data.errmsg);
      err.name = 'WeChatAPIError';
      err.code = data.errcode;
      return callback(err, data, res);
    }
    callback(null, data, res);
  };
};
var _postJSON = function (data) {
  return {
    dataType: 'json',
    type: 'POST',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  };
};
exports.createRestaurant = function(req, res) {
  var restaurant = new Restaurant(extend({
    manager: req.user
  }, req.body));
  restaurant.save(function(err, obj) {
    var wx_api = req.wx_api;
    wx_api.getLatestToken(function(err, token) {
      var url = wx_api.prefix + 'qrcode/create?access_token=' + token.accessToken;
      var data = {
        "action_name": "QR_LIMIT_STR_SCENE",
        "action_info": {"scene": {"scene_str": obj._id}}
      };
      wx_api.request(url, _postJSON(data), _wrapper(function(err, qrcode) {
        obj.qrcode_ticket = qrcode.ticket;
        obj.save(function(err) {
          res.send({
            success: true
          })
        })
      }));
    })
  });
}

exports.getMedias = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 10;
  var selTabIndex = parseInt(req.param('selTabIndex'));
  var restaurantId = req.param('restaurantId');
  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };
  if(selTabIndex >= 0 && selTabIndex <= 2) {
    options.criteria.checked_status = selTabIndex;
  }
  if(restaurantId) {
    options.criteria.restaurant = restaurantId;
  }
  Media.list(options, function(err, medias) {
    Media.count(options.criteria, function(err, count) {
      async.each(medias, function(media, callback) {
        User.findOne({
          wx_app_id: media.app_id
        }).exec(function(err, user) {
          media.user = user || null;
          callback();
        });
      }, function(err) {
        res.send({
          medias: medias,
          count: count,
          page: page + 1,
          perPage: perPage,
          pages: Math.ceil(count / perPage)
        })
      })
    })
  });
}

exports.deleteMedia = function(req, res) {
  var mediaId = req.param('_id');
  Media.findById(mediaId, function(err, media) {
    if(!media) return ;
    fsTools.remove('./public/upload/voice/' + media.media_id + '.' + media.format, function(err) {
      if(!err) {
        media.remove(function (err){
          res.send({
            success: (err ? false : true)
          })
        });
      } else {
        res.send({
          success: false
        })
      }
    })
  })
}

exports.updateMedia = function(req, res) {
  var tempMedia = req.tempMedia;
  var media = extend(tempMedia, req.body);
  if(!tempMedia.restaurant && req.body.restaurant) {
    Restaurant.findById(req.body.restaurant._id, function(err, doc) {
      if(!err) {
        Media.update({_id: media._id}, {$set: {restaurant: doc}}, function(err, obj) {
          if(err) {
            console.log(err);
            return res.send({
              message: 'Update media error!'
            });
          }
          res.send({
            success: true
          });
        })
      }
    })
  } else {
    if(tempMedia.checked_status !== media.checked_status) {
      media.checked_user = req.user;
      media.checked_at = new Date();
    }
    media.save(function(err) {
      if(err) {
        console.log(err);
        return res.send({
          message: 'Update media error!'
        });
      }
      res.send({
        media: media
      });
    })
  }
}

exports.sendVoice = function(req, res) {
  var media_id = req.param('media_id');
  var app_id = req.param('app_id');
  var wx_api = req.wx_api;
  wx_api.sendVoice(app_id, media_id, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log('成功发送语音用于审核！');
    }
  })
}

exports.getArticles = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 10;
  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };
  var userId = req.param('userId');
  if(typeof userId !== 'undefined' && userId !== '') {
    options.criteria.user = req.param('userId');
  }
  Article.list(options, function(err, articles) {
    Article.count(options.criteria, function(err, count) {
      res.send({
        articles: articles,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}

exports.updateArticle = function(req, res) {
  var article = req.tempArticle;
  delete req.body._csrf;
  delete req.body.tags;
  delete req.body.comments;
  article = extend(article, req.body);
  article.save(function(err) {
    if(err) {
      return res.send({
        message: 'Update article error!'
      });
    }
    res.send({
      article: article
    });
  })
}

// about admin manage

exports.index = function(req, res) {
  res.render('admin/index');
}

exports.home = function(req, res) {
  res.render('admin/home');
}