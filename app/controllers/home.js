
/**
 * Module dependencies.
 */
var crypto = require('crypto');
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var User = mongoose.model('User');
var utils = require('../../lib/utils');
var extend = require('util')._extend;

exports.index = function(req, res) {
  var signature = req.param('signature');
  var timestamp = req.param('timestamp');
  var nonce = req.param('nonce');
  var echostr = req.param('echostr');
  var token = 'ryoriweixin';

  if(signature && signature !== '') {
    var tmpStr = [token, timestamp, nonce].sort().join('');
    var shasum = crypto.createHash('sha1');
    shasum.update(tmpStr);
    var ret = shasum.digest('hex');
    if(signature === ret) {
      res.writeHead(200, {"Content-Type": "text/plain"});
      res.write(echostr);
      res.end();
      return ;
    }
  }

  var options = {
    perPage: 10,
    page: 0,
    sort: {
      'index': 1
    }
  };

  var userOptions = {
    perPage: 6,
    page: 0
  };

  res.render('home/index', {
    title: 'Home',
    isHome: true
  });
}