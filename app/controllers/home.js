
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
  res.render('home/index', {
    title: 'Home',
    isHome: true
  });
}

exports.play = function(req, res) {
  var media = req.tempMedia;
  if(!media.user) {
    User.findOne({
      wx_app_id: media.app_id
    }).exec(function(err, user) {
      media.user = user || null;
      res.render('home/play', {
        media: media
      });
    });
  }
}