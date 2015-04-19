var mongoose = require('mongoose');
var User = mongoose.model('User');
var Event = mongoose.model('Event');
var Media = mongoose.model('Media');
var Play = mongoose.model('Play');
var Restaurant = mongoose.model('Restaurant');
var bw = require ("buffered-writer");
var extend = require('util')._extend;

var _saveEvent = function(info, restaurantId) {
  var event = new Event({
    app_id: info.uid,
    event: info.param.event,
    media_id: info.param.mediaId,
    msg_id: info.id,
    msg_type: info.type,
    format: info.param.format,
    pic_url: info.param.picUrl,
    content: info.text,
    createdAt: info.createTime ? new Date(info.createTime) : new Date()
  })
  if(restaurantId) {
    event.restaurant = restaurantId;
  }
  if(info.param.event === 'LOCATION') {
    event.lng = info.param.lng;
    event.lat = info.param.lat;
    event.precision = info.param.precision;
  }
  event.save(function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log('Save wx event success!');
    }
  })
}

var _saveUserFromWx = function(wx_user, restaurantId, time, webot_next) {
  var userData = {
    wx_name: wx_user.nickname,
    wx_app_id: wx_user.openid,
    wx_img: wx_user.headimgurl,
    wx_remark: wx_user.remark,
    sex: wx_user.sex,
    city: wx_user.city,
    province: wx_user.province,
    country: wx_user.country,
    provider: 'wx',
    createdAt: time ? new Date(time * 1000) : new Date()
  };
  if(restaurantId) {
    userData.default_restaurant = restaurantId;
  }
  User.findOne({
    'wx_app_id': wx_user.openid
  }, function(err, find_user) {
    var user = extend(find_user || new User(), userData);
    user.save(function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log('Update wx user success!');
      }
    })
    if(find_user) {
      webot_next(null, user.wx_name + ', 欢迎你回来！');
    } else {
      var date = new Date();
      webot_next(null, ['欢迎关注日料栈, 今天是' + (date.getMonth() + 1) + '月' + date.getDate() + '日',
        '您可以通过这条消息向服务员领取一份精美日料餐具。',
        '在这里，可以收听别人对日料餐厅的语音趣评。',
        '点击语音点评收听当前餐厅，或者输入其他餐厅名字来收听。',
        '想让你的声音出现在日料栈吗？直接发送语音评论给我们吧。'].join('\n'));
    }
  })
}

var _getEventKey = function(eventKey) {
  if(eventKey && eventKey.indexOf('qrscene_') === 0) {
    eventKey = eventKey.substring(8);
  }
  return eventKey;
}

var _findRestaurant = function(text, next) {
  Restaurant.find()
    .where('name').regex(text.trim())
    .exec(function(err, restaurants) {
      next(restaurants.length > 0 ? restaurants[0] : null);
    })
}

var _findRestaurantByLocation = function(info, cb) {
  Event.listLocation({
    event: 'LOCATION',
    app_id: info.uid
  }, function(err, events) {
    if(!err && events.length > 0) {
      Restaurant.list({
        criteria: {
          $where: 'Math.abs(this.lng - ' + info.lng + ') > 0.0002 && ' +
            'Math.abs(this.lat - ' + info.lat + ') > 0.0002'
        }
      }, function(err, restaurants) {
        if(!err && restaurants.length > 0) {
          restaurants.sort(function(a, b) {
            return Math.abs(a.lng - info.lng) + Math.abs(a.lat - info.lat) -
              Math.abs(b.lng - info.lng) + Math.abs(b.lat - info.lat);
          });
          cb(null, restaurants[0]);
        } else {
          cb(err, null);
        }
      })
    } else {
      cb(err, null);
    }
  })
}

var _findLastRestaurant = function(info, cb) {
  var last3Hours = new Date((new Date()).getTime() - 1000 * 60 * 60 * 3);
  Event.listRecent({
    criteria: {
      app_id: info.uid,
      createdAt: {
        $gte: last3Hours
      },
      event: {
        $in: ['subscribe', 'SCAN']
      }
    }
  }, function(err, events) {
    if(!err && events.length > 0) {
      cb(events[0].restaurant);
    } else {
      _findRestaurantByLocation(info, function(err, restaurant) {
        if(!err && restaurant) {
          cb(restaurant);
        } else {
          cb(null);
        }
      })
    }
  })
}

var _findLastMedia = function(info, next) {
  var last3Minutes = new Date((new Date()).getTime() - 1000 * 60 * 3);
  Media.listRecent({
    criteria: {
      app_id: info.uid,
      createdAt: {
        $gte: last3Minutes
      }
    }
  }, function(err, medias) {
    next((!err && medias.length > 0) ? medias[0] : null);
  })
}

var _saveMedia = function(restaurant, info, wx_api, next) {
  var media = new Media({
    media_id: info.param.mediaId,
    app_id: info.uid,
    type: info.type,
    format: info.param.format,
    recognition: info.param.recognition,
    createdAt: new Date(info.createTime)
  });
  if(restaurant) {
    media.restaurant = restaurant;
  }
  media.save(function(err, mediaObj) {
    //保存媒体到本地...
    wx_api.getMedia(mediaObj.media_id, function(err, data) {
      bw.open('./public/upload/voice/' + mediaObj.media_id + '.' + mediaObj.format).write(data).close();
    });

    next(mediaObj);
  })
}

var _saveOrUpdatePlay = function(media, media_play, restaurant, app_id) {
  var play;
  if(!media_play) {
    play = new Play({
      media: media,
      restaurant: restaurant,
      play_count: 1,
      app_id: app_id
    });
  } else {
    play = media_play;
    play.play_count += 1;
  }
  play.save(function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log('Save play success!');
    }
  })
}
/**
 * 返回播放次数最少的语音 并且更新播放记录
 */
var _getMinPlayedMedia = function(medias, plays, restaurant, app_id) {
  var _tempMedias = {}; // key: media._id; value: {play_count;play}
  for(var i = 0; i < medias.length; i++) {
    var _media = medias[i];
    _tempMedias[_media._id] = {
      play_count: 0
    }
    for(var j = 0; j < plays.length; j++) {
      var _play = plays[j];
      if(_media._id.equals(_play.media._id)) {
        _tempMedias[_media._id].play_count += _play.play_count || 0;
        _tempMedias[_media._id].play = _play;
        break;
      }
    }
  }
  var media = medias.sort(function(a, b) {
      return _tempMedias[a._id].play_count - _tempMedias[b._id].play_count;
    })[0];

  _saveOrUpdatePlay(media, _tempMedias[media._id].play, restaurant, app_id);

  return media;
}

var _sendMedia = function(media, info, restaurant, wx_api, next) {
  wx_api.sendText(info.uid, '这是关于“' + restaurant.name + '”的用户点评', function() {
    info.reply = {
      type: media.type,
      mediaId: media.media_id
    }
    next(null, info.reply);
  })
}

/**
 * 检查语音有效期 过期的话 重新更新到微信 之后播放给用户
 */
var _checkMediaAndSend = function(media, info, restaurant, wx_api, next) {
  // 判断创建时间是否超过3天
  if((new Date()).getTime() - (new Date(media.createdAt)).getTime() > 1000 * 60 * 60 * 24 * 3) {
    wx_api.uploadMedia('./public/upload/voice/' + media.media_id + '.' + media.format, media.type,
      function(err, result) {
        if(err) {
          info.noReply = true;
          return ;
        }
        //保存媒体到本地...
        wx_api.getMedia(result.media_id, function(err, data) {
          bw.open('./public/upload/voice/' + result.media_id + '.' + result.format).write(data).close();
        });
        media.media_id = result.media_id;
        media.createdAt = new Date(result.created_at * 1000);
        media.save(function(err, mediaObj) {
          if(!err) {
            _sendMedia(mediaObj, info, restaurant, wx_api, next);
          } else {
            info.noReply = true;
            return ;
          }
        })
    })
  } else {
    _sendMedia(media, info, restaurant, wx_api, next);
  }
}

module.exports = exports = function(webot, wx_api) {
  webot.set('subscribe', {
    pattern: function(info) {
      return info.is('event') &&
        (info.param.event === 'subscribe' || info.param.event === 'SCAN');
    },
    handler: function(info, webot_next) {
      var uid = info.uid;
      var eventKey = _getEventKey(info.param.eventKey);

      _saveEvent(info, eventKey);

      //保存user到本地
      wx_api.getUser(uid, function(err, result) {
        _saveUserFromWx(result, eventKey, result.subscribe_time, webot_next);
      })
    }
  });

  webot.set('location', {
    pattern: function(info) {
      return info.is('event') && info.param.event === 'LOCATION';
    },
    handler: function(info) {
      _saveEvent(info);
      info.noReply = true;
      return ;
    }
  })

  webot.set('media_bind_restaurant', {
    pattern: function(info) {
      return info.is('text') && info.text.indexOf('-') === 0;
    },
    handler: function(info, next) {
      _findLastMedia(info, function(media) {
        if(!media) {
          next();
          return ;
        }
        _findRestaurant(info.text.substring(1), function(restaurant) {
          if(!restaurant) {
            next(null,
              ['我们无法识别您输入的店铺名,', '您可以输入更完整的名字来匹配！'].join('\n'));
            return ;
          }
          media.restaurant = restaurant;
          media.save(function(err) {
            if(err) {
              next();
              return ;
            }
            next(null, '您的评论成功绑定到店铺 "' + restaurant.name + '"');
          })
        })
      })
    }
  })

  webot.set('media', {
    pattern: function(info) {
      return info.is('voice');
    },
    handler: function(info, next) {
      _findLastRestaurant(info, function(restaurant) {
        _saveEvent(info, (restaurant ? restaurant._id : null));
        _saveMedia(restaurant, info, wx_api, function(mediaObj) {
          var msgAry = [];
          if(restaurant) {
            msgAry = ['已收到您对"' + restaurant.name + '"的点评',
              '如果不是这个店，请输入',
              '-店铺名: 我们会根据您的输入匹配正确的店铺！']
          } else {
            msgAry = ['不知道你在评论哪家店铺',
              '输入',
              '-店铺名: 我们会根据您的输入匹配正确的店铺！']
          }

          next(null, msgAry.join('\n'));
        })
      })
    }
  });

  //匹配用户输入店铺名 回复语音
  webot.set('restaurant', {
    pattern: function(info) {
      return info.is('text');
    },
    handler: function(info, next) {
      _findRestaurant(info.text, function(restaurant) {
        _saveEvent(info, (restaurant ? restaurant._id : null));
        var errorMsg = '你说的这是什么话？伦家听不懂啦！';
        if(restaurant) {
          Media.list({
            criteria: {
              restaurant: restaurant._id,
              checked_status: 1
            }
          }, function(err, medias) {
            if(err) {
              info.noReply = true;
              return ;
            }
            if(medias.length === 0) {
              next(null, errorMsg);
              return ;
            }
            Play.list({
              criteria: {
                restaurant: restaurant._id,
                app_id: info.uid
              }
            }, function(err, plays) {
              var media = _getMinPlayedMedia(medias, plays, restaurant, info.uid);
              _checkMediaAndSend(media, info, restaurant, wx_api, next);
            })
          })
        } else {
          next(null, errorMsg);
        }
      })
    }
  })

  webot.set('other', {
    pattern: function(info) {
      return info.is('image') || info.is('vodeo') || info.is('music');
    },
    handler: function(info) {
      info.noReply = true;
      return ;
    }
  })
}