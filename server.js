
/*!
 * nodejs-express-mongoose-demo
 * Copyright(c) 2013 Madhusudhan Srinivasa <madhums8@gmail.com>
 * MIT Licensed
 */
/**
 * Module dependencies
 */

var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('config');

var webot = require('weixin-robot');

var WechatAPI = require('wechat-api');
var wx_api = new WechatAPI('wxd8cbe99c62f3c75d', 'ef485616bc8b555057109dd143d7115d');

var app = express();

webot.set('subscribe', {
  pattern: function(info) {
    return info.is('event') && info.param.event === 'subscribe';
  },
  handler: function(info) {
    return '欢迎关注日料栈！';
  }
});

webot.set('test', {
  pattern: /^test/i,
  handler: function(info, next) {
    next(null, 'roger that!')
  }
})

webot.set('media', {
  pattern: function(info) {
    if(info.is('voice')) {
      console.log(info);
    }
    return info.is('voice');
  },
  handler: function(info) {
    return '感谢您提交语音评价';
  }
});

webot.set('hi', {
  pattern: /^hi/i,
  handler: function(info, next) {
    info.replay = {
      type: 'music',
      title: 'test music',
      musicUrl: 'http://wx.applesstt.com/upload/voice/E699XYa8TjXTHA8SAD9YgL7Y9ce8S8kIa1W9_KIyu2XDSUnzcE9enGVB_G6X6BPa.amr'
    }
  }
})

webot.watch(app, { token: 'ryoriweixin', path: '/wechat' });

var port = process.env.PORT || 3000;

// Connect to mongodb
var connect = function () {
  var options = {
    server: { socketOptions: { keepAlive: 1 } }
    //user: 'ryori_db_user',
    //pass: 'BJxskj1104'
  };
  mongoose.connect(config.db, options);
};
connect();

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file);
});

// Bootstrap passport config
require('./config/passport')(passport, config);

// Bootstrap application settings
require('./config/express')(app, passport);

// Bootstrap routes
require('./config/routes')(app, passport, wx_api);

app.listen(port);
console.log('Express app started on port ' + port);

/**
 * Expose
 */

module.exports = app;
