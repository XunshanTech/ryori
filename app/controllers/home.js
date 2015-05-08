
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

  if(req.user && req.user.isSuperAdmin) {
    return res.redirect('/super');
  }

  res.render('home/index', {
    title: 'Home',
    isHome: true
  });
}