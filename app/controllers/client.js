
/**
 * Module dependencies.
 */
var crypto = require('crypto');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var User = mongoose.model('User');
var utils = require('../../lib/utils');
var extend = require('util')._extend;

var OAuth = require('wechat-oauth');
var client = new OAuth('wxd8cbe99c62f3c75d', 'ef485616bc8b555057109dd143d7115d');

exports.order = function(req, res) {
  var code = req.param('code');
  //var url = client.getAuthorizeURL('http://ryoristack.com/client/order', '', 'snsapi_base');

/*
  client.getAccessToken(code, function (err, result) {
    var accessToken = result.data.access_token;
    var openid = result.data.openid;
    res.render('client/order', {
      title: 'Order',
      token: result.data
    });
  });
*/

  res.render('client/order', {
    title: 'Order',
    openid: 'xyz'
  });
}