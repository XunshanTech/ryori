var mongoose = require('mongoose');
var User = mongoose.model('User');
var Event = mongoose.model('Event');
var Media = mongoose.model('Media');
var Restaurant = mongoose.model('Restaurant');
var bw = require ("buffered-writer");

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
    createdAt: info.createTime ? new Date(info.createTime * 1000) : new Date()
  })
  if(restaurantId) {
    event.restaurant = restaurantId;
  }
  event.save(function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log('Save wx event success!');
    }
  })
}

var _saveFromWx = function(wx_user, restaurantId, time) {
  var user = new User({
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
  });
  if(restaurantId) {
    user.default_restaurant = restaurantId;
  }
  User.findOneAndUpdate({
    'wx_app_id': wx_user.openid
  }, user, {
    upsert: true
  }, function() {
    if(err) {
      console.log(err)
    } else {
      console.log('Create user from wx success!');
    }
  });
}

var _getEventKey = function(eventKey) {
  if(eventKey && eventKey.indexOf('qrscene_') === 0) {
    eventKey = eventKey.substring(8);
  } else {
    eventKey = null;
  }
  return eventKey;
}

var _findRestaurant = function(info, next) {
  Restaurant.find()
    .where('name').regex(info.text)
    .exec(function(err, restaurants) {
      next(restaurants.length > 0 ? restaurants[0] : null);
    })
}

var _findLastRestaurant = function(info, next) {
  Event.listRecent({
    options: {
      criteria: {
        app_id: info.uid
      }
    }
  }, function(err, events) {
    next((!err && events.length > 0) ? events[0].restaurant : null);
  })
}

var _saveMedia = function(restaurant, info, wx_api, next) {
  var media = new Media({
    media_id: info.param.mediaId,
    type: info.type,
    format: info.param.format,
    recognition: info.param.recognition,
    createdAt: info.createTime * 1000
  });
  if(restaurant) {
    media.restaurant = restaurant;
  }
  media.save(function(err, mediaObj) {
    //保存媒体到本地...
    wx_api.getMedia(mediaObj.media_id, function(err, data) {
      bw.open('./public/upload/voice/' + mediaObj.media_id + '.' + 'amr').write(data).close();
    });

    next();
  })
}

module.exports = exports = function(webot, wx_api) {
  webot.set('subscribe', {
    pattern: function(info) {
      return info.is('event') && info.param.event === 'subscribe';
    },
    handler: function(info) {
      var uid = info.uid;
      var eventKey = _getEventKey(info.param.eventKey);

      _saveEvent(info, eventKey);

      //保存user到本地
      wx_api.getUser(uid, function(err, result) {
        _saveFromWx(result, eventKey, result.subscribe_time);
      })

      var date = new Date();
      return ['欢迎关注日料栈, 今天是' + (date.getMonth() + 1) + '月' + date.getDate() + '日',
        '您可以通过这条消息向服务员领取一份精美日料餐具。',
        '在这里，可以收听别人对日料餐厅的语音趣评。',
        '点击语音点评收听当前餐厅，或者输入其他餐厅名字来收听。',
        '想让你的声音出现在日料栈吗？直接发送语音评论给我们吧。'].join('\n');
    }
  });

  webot.set('test', {
    pattern: /^test/i,
    handler: function(info, next) {
      _saveEvent(info);
      next(null, 'roger that!')
    }
  })

  webot.set('hi', {
    pattern: /^hi/i,
    handler: function(info, next) {
      _saveEvent(info);
      wx_api.sendText(info.uid, '这是一条测试语音', function() {
        info.reply = {
          type: 'voice',
          mediaId: 'E699XYa8TjXTHA8SAD9YgL7Y9ce8S8kIa1W9_KIyu2XDSUnzcE9enGVB_G6X6BPa'
        }
        next(null, info.reply);
      });
    }
  })

  webot.set('media', {
    pattern: function(info) {
      return info.is('voice');
    },
    handler: function(info, next) {
      _findLastRestaurant(info, function(restaurant) {
        _saveEvent(info, (restaurant ? restaurant._id : null));
        _saveMedia(restaurant, info, wx_api, function() {
          next(null, '感谢您提交语音评价！');
        })
      })
    }
  });

  //匹配用户输入店铺名 回复语音
  webot.set('restaurant', {
    pattern: /.*/,
    handler: function(info, next) {
      _findRestaurant(info, function(restaurant) {
        _saveEvent(info, (restaurant ? restaurant._id : null));
        var errorMsg = '你说的这是什么话？伦家听不懂啦！';
        if(restaurant) {
          Media.list({
            criteria: {
              restaurant: restaurant._id
            }
          }, function(err, medias) {
            if(medias.length > 0) {
              var randIndex = parseInt(Math.random() * medias.length);
              var media = medias[randIndex];
              wx_api.sendText(info.uid, '这是关于“' + restaurant.name + '”的用户点评', function() {
                info.reply = {
                  type: media.type,
                  mediaId: media.media_id
                }
                next(null, info.reply);
              })
            } else {
              next(null, errorMsg);
            }
          })
        } else {
          next(null, errorMsg);
        }
      })
    }
  })

}