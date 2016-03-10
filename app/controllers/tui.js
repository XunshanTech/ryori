
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Event = mongoose.model('Event');
var Tui = mongoose.model('Tui');
var User = mongoose.model('User');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');
var fsTools = require('fs-tools');
var redis = require('./redis');

exports.loadTui = function(req, res, next, tuiId) {
  Tui.load(tuiId, function (err, tui) {
    if (err) return next(err);
    if (!tui) return next(new Error('tui not found'));
    req.tempTui = tui;
    next();
  });
}

exports.getTuis = function(req, res) {
  var options = {
    criteria: {
      parent: {
        $exists: false
      }
    }
  };
  Tui.listAll(options, function(err, tuis) {
    //第一层
    async.each(tuis, function(tui, callback) {
      tui.getChildren(function(err, subTuis) {
        async.each(subTuis, function(subTui, cb) {
          Event.find({
            event_key: subTui._id,
            event: 'subscribe'
          }, function(err, events) {
            var last1Days = new Date((new Date()).getTime() - 1000 * 60 * 60 * 24);
            var last7Days = new Date((new Date()).getTime() - 1000 * 60 * 60 * 24 * 7);
            var last30Days = new Date((new Date()).getTime() - 1000 * 60 * 60 * 24 * 30);
            var day1 = 0, day7 = 0, day30 = 0, dayAll = 0;
            var tempUid = {}, tempUidAry = [], tempUid30 = {};
            events.forEach(function(event) {
              if(!tempUid[event.app_id]) {
                tempUid[event.app_id] = true;
                tempUidAry.push(event.app_id);
                var eventDate = new Date(event.createdAt);
                if(eventDate > last1Days) day1++;
                if(eventDate > last7Days) day7++;
                if(eventDate > last30Days) {
                  day30++;
                  tempUid30[event.app_id] = true;
                }
                dayAll++;
              }
            })
            subTui.day1 = day1;
            subTui.day7 = day7;
            subTui.day30 = day30;
            subTui.dayAll = dayAll;

            User.find({
              wx_app_id: {
                $in: tempUidAry
              }
            }, function(err, users) {
              var delCount = 0, day30Del = 0, usersAry = [];
              users.forEach(function(user) {
                if(user.isDelWx) {
                  delCount++;
                  if(tempUid30[user.wx_app_id]) {
                    day30Del++;
                  }
                } else {
                  usersAry.push(user);
                }
              })
              subTui.dayAllDel = delCount;
              subTui.cancelPer = subTui.dayAll === 0 ? 0 :
                ((delCount * 100 / subTui.dayAll).toFixed(2));
              subTui.users = usersAry;
              subTui.day30Del = day30Del;
              subTui.cancel30Per = subTui.day30 === 0 ? 0 :
                ((day30Del * 100 / subTui.day30).toFixed(2));

              if(dayAll === 0) {
                subTui.activePer = 0;
                cb();
              } else {
                var cond = {
                  event: 'CLICK',
                  app_id: {
                    $in: tempUidAry
                  }
                }
                var group = {
                  initial: { count: 0 },
                  cond: cond,
                  keyf: function(doc) {
                    return {
                      user_id: doc.app_id
                    }
                  },
                  reduce: function(doc, prev) {
                    prev.count++;
                  }
                }

                Event.collection.group(group.keyf, group.cond, group.initial, group.reduce, {}, true, function(err, rets) {
                  subTui.activePer = (rets.length * 100 / dayAll).toFixed(2);
                  cb();
                });
              }
            })
          })
        }, function() {
          subTuis.sort(function(a, b) {
            return b.dayAll - a.dayAll;
          })
          tui.children = subTuis;
          callback();
        })
      })
    }, function(err) {
      if(err) {
        console.log(err);
      }
      res.send({
        tuis: tuis
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

exports.editTui = function(req, res) {
  var tui = req.tempTui ?
    extend(req.tempTui, req.body) :
    new Tui(extend({createdAt: new Date()}, req.body));
  var parentTuiId = req.param('parentTuiId');
  var _saveTui = function() {
    tui.save(function(err, tuiObj) {
      if(err) {
        return console.log(err);
      }
      if(tuiObj.parent && !tuiObj.qrcode_ticket || tuiObj.qrcode_ticket === '') {
        var wx_api = req.wx_api;
        wx_api.getLatestToken(function(err, token) {
          var url = wx_api.prefix + 'qrcode/create?access_token=' + token.accessToken;
          var data = {
            "action_name": "QR_LIMIT_STR_SCENE",
            "action_info": {"scene": {"scene_str": tuiObj._id}}
          };
          wx_api.request(url, _postJSON(data), _wrapper(function(err, qrcode) {
            tuiObj.qrcode_ticket = qrcode.ticket;
            tuiObj.save(function(err, newObj) {
              res.send({
                success: !err && true,
                tui: newObj
              })
            })
          }));
        })
      } else {
        res.send({
          success: !err && true,
          tui: tuiObj
        })
      }
    })
  }

  if(parentTuiId && parentTuiId !== '') {
    Tui.load(parentTuiId, function (err, parentTui) {
      if (err) return next(err);
      if (!tui) return next(new Error('tui not found'));
      tui.parent = parentTui;
      _saveTui();
    });
  } else {
    _saveTui();
  }
}

exports.getTui = function(req, res) {
  var tui = req.tempTui;
  return res.send(tui);
}