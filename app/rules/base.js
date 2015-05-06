var mongoose = require('mongoose');
var User = mongoose.model('User');
var Event = mongoose.model('Event');
var Media = mongoose.model('Media');
var Play = mongoose.model('Play');
var Gift = mongoose.model('Gift');
var Restaurant = mongoose.model('Restaurant');
var bw = require ("buffered-writer");
var extend = require('util')._extend;
var Msg = require('./msg');

module.exports = function(wx_api) {
  /**
   * 记录用户的各类操作
   */
  var _saveEvent = function(info, restaurantId, isMediaPlay) {
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
    if(isMediaPlay) {
      event.is_media_play = true;
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

  /**
   * 设置info session：restaurant、from(subscribe, SCAN, LOCATION)
   */
  var _setSession = function(info, restaurant, from, mediaRestaurant, media) {
    if(from) {
      info.session.from = from;
    }
    //check is restaurantId
    if(restaurant) {
      if(typeof restaurant === 'string') {
        Restaurant.load(restaurant, function(err, retObj) {
          if(!err) {
            info.session.restaurant = retObj;
          }
        })
      } else {
        info.session.restaurant = restaurant;
      }
    }
    if(mediaRestaurant) {
      info.session.mediaRestaurant = mediaRestaurant;
    }
    if(media) {
      if(!restaurant && mediaRestaurant) {
        info.session.restaurant = mediaRestaurant;
      }
      info.session.media = media;
    }
  }

  /**
   * 返回info session，如果没有设置过，则返回null
   */
  var _getSession = function(info) {
    if(info.session.restaurant) {
      return info.session;
    } else {
      return null;
    }
  }

  /**
   * 根据传回的推广码 过滤出餐厅所对应的id值
   */
  var _getEventKey = function(eventKey) {
    if(eventKey && eventKey.indexOf('qrscene_') === 0) {
      eventKey = eventKey.substring(8);
    }
    return eventKey;
  }

  /**
   * 保存 or 更新 用户信息
   */
  var _saveOrUpdateUser = function(wx_user, restaurantId, time, webot_next) {
    var userData = {
      wx_name: wx_user.nickname,
      wx_app_id: wx_user.openid,
      wx_img: wx_user.headimgurl,
      wx_remark: wx_user.remark,
      sex: wx_user.sex,
      city: wx_user.city,
      province: wx_user.province,
      country: wx_user.country,
      provider: 'wx'
    };
    if(restaurantId) {
      userData.default_restaurant = restaurantId;
    }
    User.findOne({
      'wx_app_id': wx_user.openid
    }, function(err, find_user) {
      if(!find_user) {
        //新增的用户 则增加创建时间 老用户不修改
        userData.createdAt = time ? new Date(time * 1000) : new Date();
      }
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
        if(restaurantId) {
          var gift = new Gift({
            restaurant_id: restaurantId,
            app_id: wx_user.openid
          });
          gift.save(function(err) {
            if(err) {
              console.log(err);
            }
          });
        }
        webot_next(null, Msg.getSubscribe(restaurantId && true));
      }
    })
  }

  /**
   * 根据名称 模糊查找餐厅
   */
  var _findRestaurant = function(text, next) {
    Restaurant.find()
      .nor([{isDel: true}])
      .where('name').regex(text.trim())
      .exec(function(err, restaurants) {
        next(restaurants.length > 0 ? restaurants[0] : null);
      })
  }

  /**
   * 根据三小时内打开应用时所处的地理位置信息，返回附近的餐厅信息
   */
  var _findRecentRestaurantByLocation = function(info, cb) {
    var last3Hours = new Date((new Date()).getTime() - 1000 * 60 * 60 * 3);
    Event.listLocation({
      criteria: {
        event: 'LOCATION',
        app_id: info.uid,
        createdAt: {
          $gte: last3Hours
        },
        lng: { $ne: '' },
        lat: { $ne: '' }
      }
    }, function(err, events) {
      if(!err && events.length > 0) {
        var event = events[0]
        Restaurant.listAll({
          criteria: {
            lng: { $ne: '' },
            lat: { $ne: '' }
          }
        }, function(err, restaurants) {
          if(!err && restaurants.length > 0) {
            restaurants.sort(function(a, b) {
              return (Math.abs(a.lng - event.lng) + Math.abs(a.lat - event.lat)) -
                (Math.abs(b.lng - event.lng) + Math.abs(b.lat - event.lat));
            });
            if(Math.abs(restaurants[0].lng - event.lng) <= 0.002 &&
              Math.abs(restaurants[0].lat - event.lat) <= 0.002) {
              cb(restaurants[0]);
            } else {
              cb(null);
            }
          } else {
            cb(null);
          }
        })
      } else {
        cb(null);
      }
    })
  }

  /**
   * 根据三小时内扫描二维码的记录，返回二维码对应的餐厅
   */
  var _findRecentRestaurantByScan = function(info, cb) {
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
        var event = events[0];
        cb(event.restaurant);
      } else {
        cb(null);
      }
    })
  }

  /**
   * 根据最近的扫码信息 or 打开应用时的地址位置信息，找到对应的餐厅
   */
  var _findRecentRestaurant = function(info, cb) {
    var session = _getSession(info);
    if(!session) {
      _findRecentRestaurantByLocation(info, function(restaurant) {
        if(restaurant) {
          Base.setSession(info, restaurant, 'LOCATION');
          cb(restaurant, Msg.getFeedbackGuess(restaurant.name));
        } else {
          cb(null, Msg.noGuess);
        }
      })
/*
      _findRecentRestaurantByScan(info, function(restaurant) {
        if(restaurant) {
          cb(restaurant, Msg.getFeedback(restaurant.name));
        } else {
          _findRecentRestaurantByLocation(info, function(restaurant) {
            if(restaurant) {
              cb(restaurant, Msg.getFeedbackGuess(restaurant.name));
            } else {
              cb(null, Msg.noGuess);
            }
          })
        }
      })
*/
    } else {
      var restaurant = session.restaurant;
      if(session.from === 'LOCATION') {
        cb(restaurant, Msg.getFeedbackGuess(restaurant.name));
      } else {
        cb(restaurant, Msg.getFeedback(restaurant.name));
      }
    }
  }

  /**
   * 查找微信用户30分钟内上传的语音评论
   */
  var _findRecentMedia = function(info, next) {
    var last30Minutes = new Date((new Date()).getTime() - 1000 * 60 * 30);
    Media.listRecent({
      criteria: {
        app_id: info.uid,
        createdAt: {
          $gte: last30Minutes
        }
      }
    }, function(err, medias) {
      next((!err && medias.length > 0) ? medias[0] : null);
    })
  }

  /**
   * 保存语音信息
   */
  var _saveMedia = function(restaurant, info, next) {
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

  /**
   * 更新播放次数的信息 避免用户多次重复收听同一语音
   */
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
        if(_play.media && _media._id.equals(_play.media._id)) {
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

  /**
   * 发送语音到微信用户
   */
  var _sendMedia = function(media, info, restaurant, next, msg, isText) {
    var __send = function(media, info) {
      if(!isText) {
        _setSession(null, null, null, restaurant, media);
      }
      next(null, isText ? media.recognition : info.reply);
    }
    //_saveEvent(info, (restaurant ? restaurant._id : null), true);
    info.reply = {
      type: media.type,
      mediaId: media.media_id
    }
    if(restaurant) {
      wx_api.sendText(info.uid, (msg ? msg : Msg.getFeedback(restaurant.name)),
        function() {
          __send(media, info);
        }
      )
    } else {
      __send(media, info);
    }
  }

  /**
   * 检查语音有效期 过期的话 重新更新到微信 之后播放给用户
   */
  var _checkMediaAndSend = function(media, info, restaurant, next, msg, isText) {
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
              _sendMedia(mediaObj, info, restaurant, next, msg, isText);
            } else {
              info.noReply = true;
              return ;
            }
          })
        })
    } else {
      _sendMedia(media, info, restaurant, next, msg, isText);
    }
  }

  /**
   * 查找餐厅所对应的语音信息 并播放
   */
  var _findMediaAndPlay = function(info, restaurant, next, msg, isText) {
    Media.list({
      criteria: {
        restaurant: restaurant._id,
        checked_status: 1
      }
    }, function(err, medias) {
      if(err || medias.length === 0) {
        next(null, '这家店目前还没有评价，你可以抢先发送语音评价成为第一人。');
        return ;
      }
      Play.list({
        criteria: {
          restaurant: restaurant._id,
          app_id: info.uid
        }
      }, function(err, plays) {
        var media = _getMinPlayedMedia(medias, plays, restaurant, info.uid);
        _checkMediaAndSend(media, info, restaurant, next, msg, isText);
      })
    })
  }

  /**
   * 根据文本 模糊查找语音信息
   */
  var _findMediaByText = function(text, cb) {
    Media.findOne({})
      .where('recognition').regex(text.trim())
      .populate('restaurant')
      .exec(function(err, media) {
        if(err || !media) {
          cb(null);
        } else {
          cb(media);
        }
      })
  }

  return {
    getEventKey: _getEventKey,
    setSession: _setSession,
    getSession: _getSession,
    saveEvent: _saveEvent,
    saveOrUpdateUser: _saveOrUpdateUser,
    findRecentRestaurant: _findRecentRestaurant,
    findRecentMedia: _findRecentMedia,
    findMediaAndPlay: _findMediaAndPlay,
    saveMedia: _saveMedia,
    findRestaurant: _findRestaurant,
    findMediaByText: _findMediaByText,
    checkMediaAndSend: _checkMediaAndSend
  }
}