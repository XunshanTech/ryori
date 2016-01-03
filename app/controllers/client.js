
/**
 * Module dependencies.
 */
var crypto = require('crypto');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var User = mongoose.model('User');
var Order = mongoose.model('Order');
var moment = require('moment');
var utils = require('../../lib/utils');
var extend = require('util')._extend;

var OAuth = require('wechat-oauth');
var client = new OAuth('wxd8cbe99c62f3c75d', 'ef485616bc8b555057109dd143d7115d');

exports.order = function(req, res) {
  //var url = client.getAuthorizeURL('http://ryoristack.com/client/order', '', 'snsapi_base');
  var code = req.param('code');
  var openid = req.param('openid');
  var wx_api = req.wx_api;

  var _toOrder = function(_openid) {
    wx_api.getUser(_openid, function(err, result) {
      res.render('client/order', {
        title: 'Order',
        open_id: _openid,
        open_name: result.nickname
      });
    })
  }

  if(openid && openid !== '') {
    _toOrder(openid);
  } else {
    client.getAccessToken(code, function (err, result) {
      //var accessToken = result.data.access_token;
      var openid = result.data.openid;

      Order.findByParams({
        criteria: { open_id: openid }
      }, function(err, orders) {
        if(orders && orders.length) {
          orders.forEach(function(order, index) {
            orders[index].showCreatedAt = moment(order.createdAt).format('YYYY-MM-DD');
          })
          res.render('client/orders', {
            title: 'My Orders',
            orders: orders,
            openid: openid
          })
        } else {
          _toOrder(openid);
        }
      });
    })
  }

}

exports.createOrder = function(req, res) {
  var order = new Order(extend({createdAt: new Date()}, req.body));
  order.save(function(err) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: true
    });
  })
}

exports.orderSuccess = function(req, res) {
  res.render('client/order-success');
}