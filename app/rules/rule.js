var Msg = require('./msg');

module.exports = function(wx_api) {
  var Base = require('./base')(wx_api);

  var subscribe = function(info, next) {
    var uid = info.uid;
    var eventKey = Base.getEventKey(info.param.eventKey);
    Base.saveEvent(info, eventKey);
    //保存user到本地
    wx_api.getUser(uid, function(err, result) {
      Base.saveOrUpdateUser(result, eventKey, result.subscribe_time, function(err, msg) {
        Base.findCouponSend(uid, eventKey, function(err, couponSend) {
          if(err || !couponSend) return next(err, msg);
          Base.sendCouponSend(couponSend, next);
        })
      });
    })
  }

  var location = function(info) {
    var _error = function() {
      info.noReply = true;
      return ;
    }
    Base.saveEvent(info);
    Base.findCouponSend(info.uid, null, function(err, couponSend) {
      if(!err && couponSend) {
        var lng = info.param.lng;
        var lat = info.param.lat;
        var restaurant = couponSend;
        if(restaurant.lng && restaurant.lat &&
          Math.abs(restaurant.lng - lng) <= 0.002 &&
          Math.abs(restaurant.lat - lat) <= 0.002) {
          return Base.sendCouponSend(couponSend, next);
        } else {
          _error();
        }
      } else {
        _error();
      }
    })
  }

  var click = function(info, next) {
    var eventKey = info.param.eventKey;
    if(eventKey === 'MENU_STPL') {
      Base.findRecentRestaurant(info, function(restaurant, createdAt, msg) {
        if(restaurant) {
          Base.findMediaAndPlay(info, restaurant, next, msg);
        } else {
          next(null, Msg.noGuess);
        }
      })
    } else if(eventKey === 'MENU_WFJS') {
      next(null, Msg.playIt);
    } else if(eventKey === 'MENU_GYWM') {
      next(null, Msg.aboutMe);
    } else {
      info.noReply = true;
      return ;
    }
  }

  var t = function(info, next) {
    Base.findRecentPlay(info, function(err, play) {
      if(!err && play) {
        Base.checkMediaAndSend(play.media, info, play.restaurant, next, null, true);
      } else {
        return next(null, Msg.noT);
      }
    })
  }

  var n = function(info, next) {
    Base.findRecentCouponSend(info, function(err, couponSend) {
      if(!err && couponSend) {
        Base.cancelCouponSend(couponSend);
        return next(null, Msg.cancelCoupon);
      }
      info.noReplay = true;
      return ;
    })
  }

  var media = function(info, next) {
    Base.findRecentRestaurant(info, function(restaurant, createdAt) {
      Base.findRecentMedia(info, function(media) {
        //比较最近的店铺和最近的语音时间 取最接近的时间对应的店铺
        if(media && media.restaurant &&
          (new Date(media.createdAt)).getTime() > (new Date(createdAt)).getTime()) {
          restaurant = media.restaurant;
        }
        Base.saveMedia(restaurant, info, function() {
          next(null,
            restaurant ? Msg.getMedia(restaurant.name) : Msg.mediaNoRestaurant);
        })
      })
    })
  }

  var mediaBindRestaurant = function(info, next) {
    Base.findRecentMedia(info, function(media) {
      if(!media) {
        info.noReply = true;
        return ;
      }
      Base.findRestaurant(info.text.substring(1), function(restaurant) {
        if(!restaurant) {
          next(null, Msg.unKnowBind);
          return ;
        }
        media.restaurant = restaurant;
        media.save(function(err) {
          if(err) {
            info.noReply = true;
            return ;
          }
          next(null, Msg.rebindRestaurant(restaurant.name));
        })
      })
    })
  }

  var restaurant = function(info, next) {
    Base.findRestaurant(info.text, function(restaurant) {
      if(restaurant) {
        Base.findMediaAndPlay(info, restaurant, next);
      } else {
        Base.findMediaByText(info.text, function(media) {
          if(media) {
            Base.checkMediaAndSend(media, info, media.restaurant, next);
          } else {
            next(null, Msg.unKnow);
          }
        })

      }
    })
  }

  return {
    subscribe: subscribe,
    location: location,
    click: click,
    t: t,
    n: n,
    media: media,
    mediaBindRestaurant: mediaBindRestaurant,
    restaurant: restaurant
  }
}