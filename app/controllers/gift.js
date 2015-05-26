
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Gift = mongoose.model('Gift');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');

exports.getDataGift = function(req, res) {
  var restaurantId = req.param('restaurantId');
  var time = 1000 * 60 * 60 * 24;
  var showNum = 30;
  var cond = {}
  if(restaurantId) {
    cond.restaurant_id = restaurantId;
  }
  var group = {
    initial: { count: 0 },
    cond: cond,
    keyf: function(x) {
      return {
        //to do 分组的时间需要减去8小时时区差
        day: parseInt((new Date(x.createdAt)).getTime() / (1000 * 60 * 60 * 24))
      }
    },
    reduce: function(doc, prev) {
      prev.count++;
    }
  }

  Gift.collection.group(group.keyf, group.cond, group.initial, group.reduce, {}, true, function(err, rets) {
    var gifts = [];
    if(!err) {
      rets.sort(function(a, b) {
        return a.day - b.day;
      });
      if(rets.length > showNum) {
        rets.splice(0, rets.length - showNum);
      }
      for(var i = 0; i < rets.length; i++) {
        gifts.push([rets[i].day * time, rets[i].count]);
      }
      res.send({
        gifts: gifts
      })
    }
  });
}

exports.getDataGiftDetail = function(req, res) {
  var restaurantId = req.param('restaurantId');
  var time = 1000 * 60 * 60 * 24;
  var cond = {};
  if(restaurantId) {
    cond = {
      restaurant_id: restaurantId
    }
  }
  var group = {
    initial: { count: 0 },
    cond: cond,
    keyf: function(x) {
      return {
        day: parseInt((new Date(x.createdAt)).getTime() / (1000 * 60 * 60 * 24))
      }
    },
    reduce: function(doc, prev) {
      prev.count++;
    }
  }

  Gift.collection.group(group.keyf, group.cond, group.initial, group.reduce, {}, true, function(err, rets) {
    var gifts = [];
    if(!err) {
      rets.sort(function(a, b) {
        return a.week - b.week;
      });
      for(var i = 0; i < rets.length; i++) {
        var ret = rets[i];
        gifts.push([(ret.day) * time, ret.count]);
      }
    }
    res.send({
      gifts: gifts
    })
  });
}

exports.getGifts = function(req, res) {
  var options = {
    criteria: {}
  }
  Gift.listAll(options, function(err, gifts) {
    Gift.count(options.criteria, function(err, count) {
      res.send({
        gifts: gifts,
        count: count
      })
    })
  });
}

exports.createGift = function(req, res) {
  var gift = new Gift(req.body);
  gift.save(function(err) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: err ? false : true
    })
  })
}