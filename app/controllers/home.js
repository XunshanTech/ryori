
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
  res.render('home/index2', {
    title: 'Home',
    isHome: true
  });
}

exports.index2 = function(req, res) {
  res.render('home/index2', {
    title: 'Home',
    isHome: true
  })
}

exports.index3 = function(req, res) {
  res.render('home/index3', {
    title: 'Home',
    isHome: true
  })
}

exports.chef = function(req, res) {
  res.render('home/chef');
}

exports.chefFood = function(req, res) {
  res.render('home/chef-food');
}

exports.plan = function(req, res) {
  res.render('home/plan');
}

exports.play = function(req, res) {
  var media = req.tempMedia;
  if(!media.user.wx_name) {
    User.findOne({
      wx_app_id: media.app_id
    }).exec(function(err, user) {
      media.user = user || null;
      res.render('home/play', {
        media: media
      });
    });
  } else {
    res.render('home/play', {
      media: media
    });
  }
}