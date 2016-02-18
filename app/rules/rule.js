var Msg = require('./msg');
var moment = require('moment');
var Robot = require('../controllers/robot');
var RobotLog = require('../controllers/robot_log');

module.exports = function(wx_api) {
  var Base = require('./base')(wx_api);

  var subscribe = function(info, next) {
    var uid = info.uid;
    var eventKey = Base.getEventKey(info.param.eventKey);
    Base.saveEvent(info, eventKey);
    //保存user到本地
    wx_api.getUser(uid, function(err, result) {
      Base.saveOrUpdateUser(result, eventKey, result.subscribe_time, function(err, msg) {
        return next(err, msg);
        /*Base.findCouponSend(uid, eventKey, function(err, couponSend) {
          if(err || !couponSend) return next(err, msg);
          Base.sendCouponSend(couponSend, next);
        })*/
      });
    })
  }

  var unsubscribe = function(info, next) {
    Base.saveEvent(info);

    Event.remove({
      app_id: info.uid,
      event: 'subscribe'
    })

    info.noReply = true;
    return ;
  }

  var location = function(info) {
    Base.saveEvent(info);
    info.noReply = true;
    return ;
  }

  var click = function(info, next) {
    var eventKey = info.param.eventKey;
    if(eventKey === 'MENU_SBKK') {
      Base.findDishOrPaperShort(info, function(err, dish, paper) {
        if(!err) {
          Base.saveEvent(info); //记录这次点击事件
          if(dish) {
            Base.sendDishShort(dish, info, wx_api, function() {});
          } else if(paper) {
            Base.sendPaperShort(paper, info, wx_api, function() {});
          }
        }
      })
      info.noReply = true;
      next(null);
    } else if(eventKey === 'MENU_BRDWZ') {
      Base.saveEvent(info); //记录这次点击事件
      _askRobot(info, '本周最新', next);
    } else if(eventKey === 'MENU_HELP') {
      _askRobot(info, '机器人怎么用', next);
    } else if(eventKey === 'MENU_MQL') {
      _askRobot(info, '订米其林', next);
    } else if(eventKey === 'MENU_STPL') {
      Base.findRecentRestaurant(info, function(restaurant, createdAt, isLocation) {
        if(restaurant) {
          Base.findMediaAndPlay(info, restaurant, isLocation, next);
        } else {
          Base.findTopicRestaurant('INFO',function(restaurant) {
            if(restaurant) {
              Base.findMediaAndPlay(info, restaurant, false, next);
            } else {
              info.noReply = true;
              next(null);
            }
          })
        }
      })
    } else if(eventKey === 'MENU_WFJS') {
      next(null, Msg.playIt);
    } else if(eventKey === 'MENU_GYWM') {
      next(null, Msg.aboutMe);
    } else if(eventKey === 'MENU_YJSC') {
      Base.findSeasonAndReturn(function(season) {
        if(season && season.foods.length > 0) {
          next(null, Msg.formSeason(season));
        } else {
          info.noReply = true;
          next(null);
        }
      });
    } else if(eventKey.indexOf('TOPIC_') === 0) {
      Base.findTopicRestaurant(eventKey, function(restaurant) {
        if(restaurant) {
          Base.findMediaAndPlay(info, restaurant, false, next);
        } else {
          info.noReply = true;
          next(null);
        }
      })
    } else {
      info.noReply = true;
      next(null);
    }
  }

  var t = function(info, next) {
    Base.findRecentPlay(info, function(err, play) {
      if(!err && play) {
        Base.checkMediaAndSend(play.media, info, play.restaurant, false, next, true);
      } else {
        return next(null, Msg.noT);
      }
    })
  }

  var n = function(info, next) {
    Base.findRecentCouponSend(info, function(err, couponSend) {
      if(!err && couponSend) {
        Base.cancelCouponSend(couponSend);
        var endDate = moment(couponSend.coupon.end_at).format('YYYY-MM-DD');
        return next(null, Msg.cancelCoupon(endDate));
      }
      info.noReplay = true;
      return ;
    })
  }

  var media = function(info, next) {
    _askRobot(info, info.param.recognition, next);
    Base.findRecentRestaurant(info, function(restaurant, createdAt) {
      Base.findRecentMedia(info, function(media) {
        //比较最近的店铺和最近的语音时间 取最接近的时间对应的店铺
        if(media && media.restaurant &&
          (new Date(media.createdAt)).getTime() > (new Date(createdAt)).getTime()) {
          restaurant = media.restaurant;
        }
        Base.saveMedia(restaurant, info, function(mediaObj) {
          /*next(null,
            restaurant ? Msg.getMedia(restaurant.name, mediaObj._id) : Msg.mediaNoRestaurant(mediaObj._id));*/
        })
      })
    })
  }

  var image = function(info, next) {
    return _sendQA(next);
/*
    Base.findRecentMedia(info, function(media) {
      if(!media) {
        info.noReplay = true;
        return ;
      }
      Base.bindMediaImage(media, info, function(mediaObj) {
        next(null, Msg.bindMediaImage(mediaObj._id));
      })
    })
*/
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
        media.save(function(err, media) {
          if(err) {
            info.noReply = true;
            return ;
          }
          var mediaId = media ? media._id : null;
          next(null, Msg.rebindRestaurant(restaurant.name, mediaId));
        })
      })
    })
  }

  var _sendQA = function(next) {
    var qa = ['截图已收到，我们会在元宵节后那一周抽奖'].join('\n');
    next(null, qa);
  }

  var restaurant = function(info, next) {
    /*if(info.text.indexOf('做完问卷') > -1) {
      return _sendQA(next);
    }*/
    Base.findRestaurant(info.text, function(restaurant) {
      if(restaurant) {
        Base.findMediaAndPlay(info, restaurant, false, next);
      } else {
        Base.findMediaByText(info.text, function(media) {
          if(media) {
            Base.checkMediaAndSend(media, info, media.restaurant, false, next);
          } else {
            //next(null, Msg.unKnow);
            var reply = {
              type: 'transfer_customer_service',
              content: info.text
            }
            next(null, reply);
            //return reply;
          }
        })
      }
    })
  }

  var robotHelp = function(info, next) {
    next(null, Msg.robotHelp);
  }

  var _askRobot = function(info, text, next) {
    Robot.askWxRobot(info, Base, text, function(answer, isWxImg, isRobotImg) {
      if(answer.isQuestion) {
        var _sendImg = function() {
          if(answer.img !== '') {
            Base.checkAndSendQuestionImg(answer, info, next);
          } else {
            info.noReply = true;
            next(null);
          }
        }
        //处理自定义的问题
        var questionText = Base.getQuestionText(answer);
        if(questionText !== '') {
          wx_api.sendText(info.uid, questionText, function() {
            _sendImg();
          })
        } else {
          _sendImg();
        }
      } else if(isRobotImg) {
        //处理提问栈栈图片的问题
        Base.checkAndSendRobotImg(info, next);
      } else if(isWxImg) {
        //处理提问菜品图片的问题
        Base.checkAndSendDishImg(answer, info, wx_api, false, next);
      } else {
        if(answer === '') {
          //处理未匹配问题
          wx_api.sendText(info.uid, Msg.robotUnknow, function() {
            var reply = {
              type: 'transfer_customer_service',
              content: text
            }
            next(null, reply);
          })
        } else {
          //返回aiml答案
          next(null, answer);
        }
      }

      //add to robot log
      RobotLog.create(text, isWxImg ? answer.img : answer, isWxImg, info.uid);
    })

  }

  var robot = function(info, next) {
    console.log((new Date()) + ': ' + info.uid + ' : ' + info.text);
    _askRobot(info, info.text, next);
  }

  return {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    location: location,
    click: click,
    t: t,
    n: n,
    media: media,
    image: image,
    mediaBindRestaurant: mediaBindRestaurant,
    restaurant: restaurant,
    robot: robot,
    robotHelp: robotHelp
  }
}