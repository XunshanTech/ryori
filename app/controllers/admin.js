
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var Restaurant = mongoose.model('Restaurant');
var User = mongoose.model('User');
var Media = mongoose.model('Media');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var fsTools = require('fs-tools');

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

exports.getUsers = function(req, res) {
  var options = {
    criteria: {
      provider: 'wx'
    }
  }
  _fetchUsers(req, res, options);
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

exports.getRestaurants = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 10;
  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };
  Restaurant.list(options, function(err, restaurants) {
    Restaurant.count(options.criteria, function(err, count) {
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
  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };
  Media.list(options, function(err, medias) {
    Media.count(options.criteria, function(err, count) {
      res.send({
        medias: medias,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
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
  var media = req.tempMedia;
  media = extend(media, req.body);
  media.checked_user = req.user;
  media.checked_at = new Date();
  media.save(function(err) {
    if(err) {
      return res.send({
        message: 'Update media error!'
      });
    }
    res.send({
      media: media
    });
  })
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