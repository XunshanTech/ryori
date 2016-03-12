
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Order = mongoose.model('Order');
var JapanRestaurant = mongoose.model('JapanRestaurant');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');

exports.loadOrder = function(req, res, next, orderId) {
  Order.load(orderId, function (err, order) {
    if (err) return next(err);
    if (!order) return next(new Error('order not found'));
    req.tempOrder = order;
    next();
  });
}

exports.getOrders = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 100;

  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };

  Order.list(options, function(err, orders) {
    Order.count(options.criteria, function(err, count) {
      orders.forEach(function(order, index) {
        orders[index].showCreatedAt = moment(order.createdAt).format('YYYY-MM-DD');
      })
      res.send({
        orders: orders,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}

exports.editOrder = function(req, res) {
  var order = req.tempOrder ?
    extend(req.tempOrder, req.body) :
    new Order(extend({createdAt: new Date()}, req.body));
  if(order.orders.length) {
    order.orders.forEach(function(subOrder, orderIndex) {
      if(subOrder.bind_restaurants.length) {
        subOrder.bind_restaurants.forEach(function(restaurant, restaurantIndex) {
          if(restaurant && restaurant._id) {
            order.orders[orderIndex].bind_restaurants[restaurantIndex] = restaurant._id;
          }
        })
      }
    })
  }
  order.save(function(err, orderObj) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: !err && true,
      order: orderObj
    })
  })
}

exports.getOrder = function(req, res) {
  var order = req.tempOrder;
  if(order.orders && order.orders.length) {
    async.each(order.orders, function(subOrder, cb) {
      if(subOrder.bind_restaurants && subOrder.bind_restaurants.length) {
        async.each(subOrder.bind_restaurants, function(restaurantId, callback) {
          var index = subOrder.bind_restaurants.indexOf(restaurantId);
          JapanRestaurant.findOne({
            _id: restaurantId,
          }, function(err, japanRestaurant) {
            if(!err && japanRestaurant) {
              subOrder.bind_restaurants[index] = japanRestaurant;
            }
            callback();
          })
        }, function(err) {
          if(err) {
            console.log(err);
          }
          cb();
        })
      } else {
        cb();
      }
    }, function(err) {
      if(err) console.log(err);
      return res.send(order);
    })
  } else {
    return res.send(order);
  }
}
