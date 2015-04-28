
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Restaurant = mongoose.model('Restaurant');
var Coupon = mongoose.model('Coupon');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');

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
  var options = {
    page: page,
    perPage: perPage,
    criteria: {
      is_del: {
        $ne: true
      }
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
    console.log(req.body.restaurant);
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