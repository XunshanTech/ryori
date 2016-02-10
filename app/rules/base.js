var mongoose = require('mongoose');
var User = mongoose.model('User');
var Event = mongoose.model('Event');
var Media = mongoose.model('Media');
var Play = mongoose.model('Play');
var Gift = mongoose.model('Gift');
var Coupon = mongoose.model('Coupon');
var CouponSend = mongoose.model('CouponSend');
var Restaurant = mongoose.model('Restaurant');
var Season = mongoose.model('Season');
var Food = mongoose.model('Food');
var Dish = mongoose.model('Dish');
var Robot = mongoose.model('Robot');
var Paper = mongoose.model('Paper');
var bw = require('buffered-writer');
var fsTools = require('fs-tools');
var async = require('async');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var Msg = require('./msg');
var map = require('../../lib/map')
var robotAnalytics = require('../controllers/robot_analytics');
var moment = require('moment');

module.exports = function(wx_api) {
  function _updateUserByWx(info, next) {
    wx_api.getUser(info.uid, function (err, result) {
      _saveOrUpdateUser(result, null, null, function (err, message, user) {
        if(next) {
          next(err, message, user)
        }
      });
    })
  }

  function __updateUserTempCity(info, cityObj) {
    User.findOne({
      'wx_app_id': info.uid
    }, function (err, find_user) {
      if (find_user) {
        find_user.user_temp_city = cityObj.name;
        find_user.save(function (err) {
          console.log(err || 'Update wx user success!');
        })
      } else {
        //未存储过的用户 存储之
        _updateUserByWx(info);
      }
    })
  }

  /**
   * 记录用户的各类操作
   */
  var _saveEvent = function(info, eventKey) {
    var event = new Event({
      app_id: info.uid,
      event: info.param.event,
      event_key: eventKey,
      media_id: info.param.mediaId,
      msg_id: info.id,
      msg_type: info.type,
      format: info.param.format,
      pic_url: info.param.picUrl,
      content: info.text,
      createdAt: info.createTime ? new Date(info.createTime) : new Date()
    })
    /*if(restaurantId) {
      event.restaurant = restaurantId;
    }
    if(isMediaPlay) {
      event.is_media_play = true;
    }*/
    if(info.param.event === 'LOCATION') {
      event.lng = info.param.lng;
      event.lat = info.param.lat;
      event.precision = info.param.precision;

      //获取经纬度 同时更新用户的user_temp_city信息
      map.getCityByCoords(event.lat, event.lng, function(err, cityObj) {
        if(!err) {
          __updateUserTempCity(info, cityObj);
        }
      })
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

    //更新user_temp_city，用于为用户推荐餐厅菜品
    var citys = map.citys;
    var user_temp_city = wx_user.city;
    for(var i = 0; i < citys.length; i++) {
      if(wx_user.province.indexOf(citys[i].name) > -1) {
        user_temp_city = citys[i].name;
        break;
      }
    }
    if(user_temp_city === '') {
      //如果城市为空 依次取省 省为空 取国家
      user_temp_city = wx_user.province !== '' ? wx_user.province :
        (wx_user.country !== '' ? wx_user.country : '中国');
    }
    userData.user_temp_city = user_temp_city;

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
        console.log(err || 'Update wx user success!');
      })
      if(find_user) {
        webot_next(null, Msg.getSubscribe(true, user.wx_name), find_user);
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
        webot_next(null, Msg.getSubscribe(true), null);
      }
    })
  }

  /**
   * 根据名称 模糊查找餐厅
   */
  var _findRestaurant = function(text, next) {
    var cond = {
      name: {
        $regex: text.trim(),
        $options: 'i'
      }
    }
    Restaurant.count(cond)
      .nor([{isDel: true}])
      .exec(function(err, count) {
        var random = Math.round(Math.random() * (count - 1));
        Restaurant.findOne(cond)
          .nor([{isDel: true}])
          .skip(random)
          .exec(function(err, restaurant) {
            next(restaurant);
          })
      })
  }

  var _findRecentLocation = function(info, cb) {
    //var last3Hours = new Date((new Date()).getTime() - 1000 * 60 * 60 * 3);
    Event.listLocation({
      criteria: {
        event: 'LOCATION',
        app_id: info.uid,
        /*createdAt: {
          $gte: last3Hours
        },*/
        lng: { $ne: '' },
        lat: { $ne: '' }
      }
    }, function(err, events) {
      cb(err, events);
    });
  }

  /**
   * 根据三小时内打开应用时所处的地理位置信息，返回附近的餐厅信息
   */
  var _findRecentRestaurantByLocation = function(info, cb) {
    _findRecentLocation(info, function(err, events) {
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
              cb(restaurants[0], events[0].createdAt);
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
   * 根据key查找对应的专题餐厅
   */
  var _findTopicRestaurant = function(eventKey, cb) {
    Restaurant.list({
      criteria: {
        isTopic: true,
        topicKey: eventKey
      }
    }, function(err, restaurants) {
      if(!err && restaurants.length > 0) {
        cb(restaurants[0]);
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
        cb(event.restaurant, event.createdAt);
      } else {
        cb(null);
      }
    })
  }

  /**
   * 根据最近的扫码信息 or 打开应用时的地址位置信息，找到对应的餐厅
   */
  var _findRecentRestaurant = function(info, cb) {
    _findRecentRestaurantByScan(info, function(restaurant, createdAt) {
      if(restaurant) {
        cb(restaurant, createdAt, false);
      } else {
        _findRecentRestaurantByLocation(info, function(restaurant, createdAt) {
          if(restaurant) {
            cb(restaurant, createdAt, true);
          } else {
            cb(null, null);
          }
        })
      }
    })
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
   * 查找5分钟内 最近收听的语音评论
   */
  var _findRecentPlay = function(info, cb) {
    var last5Minutes = new Date((new Date()).getTime() - 1000 * 60 * 5);
    Play.listRecent({
      criteria: {
        app_id: info.uid,
        createdAt: {
          $gte: last5Minutes
        }
      }
    }, function(err, plays) {
      cb(err, (!err && plays.length > 0) ? plays[0] : null);
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
      updatedAt: new Date(info.createTime),
      createdAt: new Date(info.createTime)
    });
    if(restaurant) {
      media.restaurant = restaurant;
    }
    media.save(function(err, mediaObj) {
      //保存媒体到本地...
      fsTools.mkdirSync('./public/upload/voice');
      wx_api.getMedia(mediaObj.media_id, function(err, data) {
        bw.open('./public/upload/voice/' + mediaObj._id + '.' + mediaObj.format)
          .write(data)
          .close(function() {
            if(mediaObj.format === 'amr') {
              utils.convertAmrToMp3(mediaObj._id);
            }
          });
      });

      next(mediaObj);
    })
  }

  /**
   * 绑定图片到语音 并且保存图片到本地 以mediaId做为图片名
   */
  var _bindMediaImage = function(media, info, next) {
    media.image_media_id = info.param.mediaId;
    media.image_pic_url = info.param.picUrl;
    media.updatedAt = new Date(info.createTime);
    media.save(function(err, mediaObj) {
      //保存图片到本地
      fsTools.mkdirSync('./public/upload/pic');
      wx_api.getMedia(mediaObj.image_media_id, function(err, data) {
        bw.open('./public/upload/pic/' + mediaObj._id + '.jpg')
          .write(data)
          .close(function() {});
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
      play.createdAt = new Date();
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
  var _sendMedia = function(media, info, restaurant, isLocation, next, isText) {
    var __send = function(media, info) {
      console.log((new Date()).getTime());
      console.log('before play media-------------');
      return next(null, isText ? media.recognition : info.reply);
    }
    info.reply = {
      type: media.type,
      mediaId: media.media_id
    }
    if(restaurant) {
      User.findOne({
        app_id: media.app_id
      }, function(err, user) {
        var msg = Msg.getFeedback(restaurant.name, (user ? user.group : null), media._id);
        if(restaurant.isTopic) {
          if(restaurant.topicKey === 'INFO') {
            msg = Msg.getTopicInfo(media._id);
          } else {
            msg = Msg.getTopic(media._id);
          }
        }
        wx_api.sendText(info.uid, msg, function() {
          __send(media, info);
        })
      })

    } else {
      __send(media, info);
    }
  }

  /**
   * 检查语音有效期 过期的话 重新更新到微信 之后播放给用户
   */
  var _checkMediaAndSend = function(media, info, restaurant, isLocation, next, isText) {
    _saveEvent(info, restaurant._id, true);
    // 判断创建时间是否超过2天 (微信文档中有效期为三天 但是好像不准确)
    if((new Date()).getTime() - (new Date(media.updatedAt || media.createdAt)).getTime() > 1000 * 60 * 60 * 24 * 2) {
      wx_api.uploadMedia('./public/upload/voice/' + media._id + '.' + media.format, media.type,
        function(err, result) {
          if(err) {
            info.noReply = true;
            return ;
          }
          //保存媒体到本地...
          /*wx_api.getMedia(result.media_id, function(err, data) {
            bw.open('./public/upload/voice/' + result.media_id + '.' + media.format).write(data).close();
          });*/
          media.media_id = result.media_id;
          media.updatedAt = new Date();
          media.save(function(err, mediaObj) {
            if(!err) {
              _sendMedia(mediaObj, info, restaurant, isLocation, next, isText);
            } else {
              info.noReply = true;
              return ;
            }
          })
        })
    } else {
      _sendMedia(media, info, restaurant, isLocation, next, isText);
    }
  }

  /**
   * 查找餐厅所对应的语音信息 并播放
   */
  var _findMediaAndPlay = function(info, restaurant, isLocation, next, isText) {
    Media.list({
      criteria: {
        restaurant: restaurant._id,
        checked_status: 1
      },
      sort: {
        createdAt: 1 //优先播放较早上传的
      }
    }, function(err, medias) {
      if(err || medias.length === 0) {
        next(null, Msg.noFeedback(restaurant.name, isLocation));
        return ;
      }
      Play.list({
        criteria: {
          restaurant: restaurant._id,
          app_id: info.uid
        }
      }, function(err, plays) {
        var media = _getMinPlayedMedia(medias, plays, restaurant, info.uid);
        _checkMediaAndSend(media, info, restaurant, isLocation, next, isText);
      })
    })
  }

  /**
   * 根据文本 模糊查找语音信息
   */
  var _findMediaByText = function(text, cb) {
    var cond = {
      checked_status: 1,
      recognition: {
        $regex: text.trim(),
        $options: 'i'
      }
    };
    Media.count(cond)
      .exec(function(err, count) {
        if(count == 0) {
          return cb(null);
        }
        var random = Math.round(Math.random() * (count - 1));
        Media.findOne(cond)
          .skip(random)
          .populate('restaurant')
          .exec(function(err, media) {
            if(err || !media) {
              cb(null);
            } else {
              cb(media);
            }
          })
      })
  }

  var _findCouponSend = function(app_id, restaurantId, cb) {
    var last1Month = new Date((new Date()).getTime() - 1000 * 60 * 60 * 24 * 31);
    var params = {
      app_id: app_id,
      used: false,
      createdAt: {
        $gte: last1Month
      }
    };
    if(restaurantId) {
      params.restaurant = restaurantId;
    }

    CouponSend.listRecent({
      criteria: params
    }, function(err, couponSends) {
      cb(err, (!err && couponSends.length > 0) ? couponSends[0] : null);
    })
  }

  var _sendCouponSend = function(couponSend, next) {
    couponSend.used = true;
    couponSend.used_at = new Date();
    var now = moment().format('YYYY-MM-DD');
    couponSend.save();
    return next(null, '优惠券“' + couponSend.coupon.title + '”于' + now + '被激活，请向服务员出示使用，回复N可以撤销');
  }

  var _findRecentCouponSend = function(info, cb) {
    var lastMinutes = new Date((new Date()).getTime() - 1000 * 60);
    CouponSend.listRecent({
      criteria: {
        app_id: info.uid,
        used: true,
        used_at: {
          $gte: lastMinutes
        }
      }
    }, function(err, couponSends) {
      var couponSend = couponSends && couponSends.length > 0 ? couponSends[0] : null;
      cb(err, couponSend);
    })
  }

  var _cancelCouponSend = function(couponSend) {
    couponSend.used = false;
    couponSend.save();
  }

  var _findSeasonAndReturn = function(cb) {
    Season.findLatest(function(err, season) {
      cb(err ? null : season);
    })
  }

  //返回robot对应的数据
  var _findRobot = function(cb) {
    Robot.findRobot(function(err, robot) {
      if(robot) return cb(robot);
      var robot = new Robot({createdAt: new Date()});
      robot.save(function(err, robotObj) {
        if(!err && robotObj) {
          cb(robotObj);
        } else {
          console.log(err);
        }
      })
    })
  }

  //返回robot图片给客户端
  var _checkAndSendRobotImg = function(info, next) {
    var __sendImg = function(media_id) {
      info.reply = {
        type: 'image',
        mediaId: media_id
      }
      next(null, info.reply);
    }
    _findRobot(function(robot) {
      if(!robot.img_media_updated ||
        (new Date()).getTime() - (new Date(robot.img_media_updated)).getTime() > 1000 * 60 * 60 * 24 * 2) {
        wx_api.uploadMedia('./public/img/robot/robot.jpg', 'image',
          function(err, result) {
            if(err) {
              info.noReply = true;
              return ;
            }
            robot.img_media_id = result.media_id;
            robot.img_media_updated = new Date();
            robot.save(function(err, robotObj) {
              if(!err) {
                __sendImg(robotObj.img_media_id);
              } else {
                info.noReply = true;
                return ;
              }
            })
          })
      } else {
        __sendImg(robot.img_media_id);
      }
    })
  }

  var _checkAndSendDishImg = function(dish, info, wx_api, isSingle, next) {
    var imgs = dish.imgs, _imgIndex = 0, _isUpdate = false;

    var __sendImg = function(media_id) {
      var ___send = function() {
        wx_api.sendImage(info.uid, media_id, function() {
          _imgIndex++;
          _sendImgs();
        })
      }
      if(!isSingle && dish.dish_type &&
          dish.dish_type === 2 && (_imgIndex === 0 || _imgIndex === 1)) {
        var _text = _imgIndex === 0 ? '生前 \\(^o^)/' : '身后 (＞﹏＜)';
        wx_api.sendText(info.uid, _text, function() {
          ___send();
        })
      } else {
        ___send();
      }
    }

    var _sendImgs = function() {
      if(imgs.length > 0) {
        if((isSingle && _imgIndex === 0) || (!isSingle && imgs.length > _imgIndex)) {
          var img = imgs[_imgIndex];
          if(isSingle) {
            img = imgs[parseInt(imgs.length * Math.random())];
          }
          if(!img.img_media_updated ||
            (new Date()).getTime() - (new Date(img.img_media_updated)).getTime() > 1000 * 60 * 60 * 24 * 2) {
            _isUpdate = true;
            wx_api.uploadMedia('./public' + img.img, 'image',
              function(err, result) {
                if(!err) {
                  img.img_media_id = result.media_id;
                  img.img_media_updated = new Date();
                  __sendImg(img.img_media_id);
                }
              })
          } else {
            __sendImg(img.img_media_id);
          }
        } else {
          if(_isUpdate) {
            dish.save(function(err, dishObj) {});
          }
        }
      }
    }

    _sendImgs();

    info.noReply = true;
    next(null);
  }

  //返回question图片给客户端
  var _checkAndSendQuestionImg = function(question, info, next) {
    var __sendImg = function(media_id) {
      info.reply = {
        type: 'image',
        mediaId: media_id
      }
      next(null, info.reply);
    }
    // 判断创建时间是否超过2天 (微信文档中有效期为三天 但是好像不准确)
    if(!question.img_media_updated ||
      (new Date()).getTime() - (new Date(question.img_media_updated)).getTime() > 1000 * 60 * 60 * 24 * 2) {
      wx_api.uploadMedia('./public' + question.img, 'image',
        function(err, result) {
          if(err) {
            info.noReply = true;
            return ;
          }
          question.img_media_id = result.media_id;
          question.img_media_updated = new Date();
          question.save(function(err, questionObj) {
            if(!err) {
              __sendImg(questionObj.img_media_id);
            } else {
              info.noReply = true;
              return ;
            }
          })
        })
    } else {
      __sendImg(question.img_media_id);
    }
  }

  var _getQuestionText = function(question) {
    var returnText = '';
    var text = question.text;
    var links = question.links;
    if(text !== '') {
      returnText += text;
    }
    links.forEach(function(link) {
      if(link.name === '' || link.url === '') return ;
      if(returnText !== '') {
        returnText += '\n\n';
      }
      returnText += ['<a href="', link.url, '">', link.name, '</a>'].join('');
    })
    return returnText;
  }

  var _findDishOrPaperShort = function(info, cb) {
    Event.count({
      app_id: info.uid,
      event_key: 'MENU_SBKK'
    }, function(err, count) {
      if(parseInt((count + 1) % 5) === 0) {
        var criteria = {}
        Paper.count(criteria, function(err, count) {
          var _skip = parseInt(count * Math.random());
          Paper.findOne(criteria).skip(_skip)
            .exec(function(err, paper) {
              cb(err, null, paper);
            });
        })
      } else {
        var criteria = {
          /*dish_type: {
           $ne: 1 //筛选不是原材料的菜品
           },*/
          imgs: {
            $exists: true
          }
        }
        Dish.count(criteria, function(err, count) {
          var _skip = parseInt(count * Math.random());
          Dish.findOne(criteria).skip(_skip)
            .exec(function(err, dish) {
              cb(err, dish);
            });
        })
      }
    })
  }

  var _sendDishShort = function(dish, info, wx_api, cb) {
    robotAnalytics.create(dish, '#dish.des# #dish.link#', info.uid);

    wx_api.sendText(info.uid, '这是一张“' + dish.name + '”照片 输入“更多”可获得该菜品的详情', function() {
      _checkAndSendDishImg(dish, info, wx_api, true, cb);
    })
  }

  var _sendPaperShort = function(paper, info, wx_api, cb) {
    var text = ['居然达成了连看4条的成就！看你这么无聊给你一篇增进食欲的文章消磨下时间吧',
      '<a href="' + paper.url + '">' + paper.name + '</a>'].join('\n');
    wx_api.sendText(info.uid, text, cb);
  }

  return {
    getEventKey: _getEventKey,
    saveEvent: _saveEvent,
    saveOrUpdateUser: _saveOrUpdateUser,
    updateUserByWx: _updateUserByWx,
    findRecentRestaurant: _findRecentRestaurant,
    findRecentRestaurantByLocation: _findRecentRestaurantByLocation,
    findTopicRestaurant: _findTopicRestaurant,
    findRecentMedia: _findRecentMedia,
    findRecentPlay: _findRecentPlay,
    findMediaAndPlay: _findMediaAndPlay,
    saveMedia: _saveMedia,
    bindMediaImage: _bindMediaImage,
    findRestaurant: _findRestaurant,
    findMediaByText: _findMediaByText,
    checkMediaAndSend: _checkMediaAndSend,
    findCouponSend: _findCouponSend,
    sendCouponSend: _sendCouponSend,
    findRecentCouponSend: _findRecentCouponSend,
    cancelCouponSend: _cancelCouponSend,
    findSeasonAndReturn: _findSeasonAndReturn,
    checkAndSendDishImg: _checkAndSendDishImg,
    checkAndSendQuestionImg: _checkAndSendQuestionImg,
    checkAndSendRobotImg: _checkAndSendRobotImg,
    getQuestionText: _getQuestionText,
    findDishOrPaperShort: _findDishOrPaperShort,
    sendDishShort: _sendDishShort,
    sendPaperShort: _sendPaperShort
  }
}