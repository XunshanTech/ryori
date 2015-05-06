
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Restaurant = mongoose.model('Restaurant');
var Event = mongoose.model('Event');
var Coupon = mongoose.model('Coupon');
var CouponSend = mongoose.model('CouponSend');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");

/**
 * Load temp media for next
 */
exports.loadCoupon = function(req, res, next, couponId) {
  Coupon.load(couponId, function (err, coupon) {
    if (err) return next(err);
    if (!coupon) return next(new Error('not found'));
    req.tempCoupon = coupon;
    next();
  });
}

exports.getCoupon = function(req, res) {
  var coupon = req.tempCoupon;
  return res.send(coupon);
}

exports.getCoupons = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 10;
  var selTabIndex = req.param('selTabIndex') ? req.param('selTabIndex') : 0;
  var options = {
    page: page,
    perPage: perPage,
    criteria: {
      is_del: {
        $ne: true
      },
      send_status: selTabIndex
    }
  };
  Coupon.list(options, function(err, coupons) {
    Coupon.count(options.criteria, function(err, count) {
      res.send({
        coupons: coupons,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}

exports.updateCoupons = function(req, res) {
  var coupon;
  if(req.tempCoupon) {
    coupon = req.tempCoupon;
    coupon = extend(coupon, req.body);
  } else {
    coupon = new Coupon(req.body);
  }

  coupon.save(function(err, couponObj) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: !err && true,
      restaurant: couponObj
    })
  })
}

exports.getGroup = function(req, res) {
  var couponIds = req.param('ids');
  if(typeof couponIds === 'string') {
    couponIds = [couponIds];
  }
  var couponsTemp = [];
  var restaurantTemp = [];
  if(couponIds && couponIds.length > 0) {

    //find coupons by ids
    Coupon.find({
      _id: {
        $in: couponIds
      }
    })
    .populate('restaurant')
    .sort({'createdAt': -1})
    .exec(function(err, coupons) {
      for(var i = 0; i < coupons.length; i++) {
        if(restaurantTemp[coupons[i].restaurant._id]) continue;
        restaurantTemp[coupons[i].restaurant._id] = true;
        couponsTemp.push({
          couponId: coupons[i]._id,
          couponTitle: coupons[i].title,
          restaurantId: coupons[i].restaurant._id,
          restaurantName: coupons[i].restaurant.name,
          sleepMonth: coupons[i].sleep_month
        })
      }
      var allTempAppIds = [];
      var thieMonthStart = moment().startOf('month').toDate();
      CouponSend.find({
        createdAt: {
          $gt: thieMonthStart
        }
      }, function(err, couponSends) {
        var app_ids = [];
        for(var i = 0; i < couponSends.length; i++) {
          app_ids.push(couponSends[i].app_id);
        }
        async.each(couponsTemp, function(couponData, callback) {
          var compareDate = moment().startOf('day').subtract(couponData.sleepMonth, 'days');
          Event.find({
            restaurant: couponData.restaurantId,
            event: {
              $in: ['subscribe', 'SCAN']
            },
            app_id: {
              $nin: app_ids
            }
          }).exec(function(err, events) {
              var tempAppIds = {};
              events = events.sort(function(a, b) {
                return (new Date(b.createdAt)).getTime() - (new Date(a.createdAt)).getTime();
              }).filter(function(e) {
                  //check other coupon has this app_id and filter it
                  if(allTempAppIds[e.app_id]) return false;

                  if(typeof tempAppIds[e.app_id] !== 'undefined') return false;

                  if((new Date(e.createdAt)).getTime() > compareDate.toDate().getTime()) {
                    tempAppIds[e.app_id] = false;
                  } else {
                    tempAppIds[e.app_id] = true;
                    allTempAppIds[e.app_id] = true;
                  }
                  return tempAppIds[e.app_id];
                })
              couponData.events = events;
              callback(null);
            })
        }, function(err) {
          res.send({
            success: true,
            couponsTemp: couponsTemp
          })
        })
      })
    })
  }
}

var _sendCoupon = function(coupon, app_ids, callback) {
  async.each(app_ids, function(app_id, cb) {
    var couponSend = new CouponSend({
      coupon: coupon,
      restaurant: coupon.restaurant,
      app_id: app_id
    });
    couponSend.save(function(err) {
      cb(null);
    })
  }, function(err) {
    callback(null);
  })

}

exports.postGroup = function(req, res) {
  var wx_api = req.wx_api;
  var coupons = req.param('coupons');
  if(!coupons || coupons.length <= 0) {
    return res.send({
      success: false
    })
  }
  async.each(coupons, function(coupon, cb) {
    Coupon.load(coupon.couponId, function(err, _coupon) {
      var app_ids = [];
      for(var i = 0; i < coupon.events.length; i++) {
        app_ids.push(coupon.events[i].app_id);
      }
      var endDate = moment(_coupon.end_at).format('YYYY-MM-DD');
      var msg = '您收到一张"' + _coupon.restaurant.name + '"优惠券，请于' + endDate + '前到店，扫描店内二维码或者打开本应用获取。'
      wx_api.massSendText(msg, app_ids, function(err, result) {
        _sendCoupon(_coupon, app_ids, function(err) {
          _coupon.send_status = 1;
          _coupon.send_at = new Date();
          _coupon.app_ids = app_ids;
          _coupon.save(function(err) {
            cb(err);
          })
        });
      })
    })
  }, function() {
    res.send({
      success: true
    })
  })
}