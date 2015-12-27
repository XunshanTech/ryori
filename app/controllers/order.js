
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Order = mongoose.model('Order');
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
        console.log(moment(order.createdAt).format('YYYY-MM-DD'));
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
  return res.send(order);
}
