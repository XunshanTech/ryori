
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