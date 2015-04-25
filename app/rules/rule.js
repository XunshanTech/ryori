var Msg = require('./msg');

module.exports = function(wx_api) {
  var Base = require('./base')(wx_api);

  var subscribe = function(info, next) {
    var uid = info.uid;
    var eventKey = Base.getEventKey(info.param.eventKey);
    Base.saveEvent(info, eventKey);
    //保存user到本地
    wx_api.getUser(uid, function(err, result) {
      Base.saveOrUpdateUser(result, eventKey, result.subscribe_time, next);
    })
  }

  var location = function(info) {
    Base.saveEvent(info);
    info.noReply = true;
    return ;
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
    media: media,
    mediaBindRestaurant: mediaBindRestaurant,
    restaurant: restaurant
  }
}