
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Restaurant = mongoose.model('Restaurant');
var Event = mongoose.model('Event');
var Coupon = mongoose.model('Coupon');
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
      async.each(couponsTemp, function(couponData, callback) {
        var compareDate = moment().startOf('day').subtract(couponData.sleepMonth, 'days');
        Event.find({
          restaurant: couponData.restaurantId,
          event: {
            $in: ['subscribe', 'SCAN']
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
  }
}

exports.postGroup = function(req, res) {
  console.log(req.param('coupons'));
  res.send({
    success: true
  })
}