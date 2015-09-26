
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var WxNew = mongoose.model('WxNew');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');

var _checkAndSaveFile = function(item, newsItem) {
  var media_id = item.media_id;
  var thumb_media_id = newsItem.thumb_media_id;
  WxNew.loadByThumbMediaId(thumb_media_id, function(err, wxNew) {
    if(!wxNew) {
      var wxNew = new WxNew({
        media_id: media_id,
        thumb_media_id: thumb_media_id,
        title: newsItem.title,
        author: newsItem.author,
        url: newsItem.url
      });
      wxNew.save(function(err, newWxNew) {
        if(!err) {
          console.log('success addon news: ' + newWxNew.title);
        }
      })
    }
  })
}

exports.reload = function(req, res) {
  var wx_api = req.wx_api;
  var offset = 0;
  var count = 20;
  var _load = function() {
    wx_api.getMaterials('news', offset, count, function(err, result) {
      if(result.item_count === 0) {
        return res.send({
          success: true
        })
      };
      offset += count;
      result.item.forEach(function(item) {
        var newsItem = item.content.news_item;
        newsItem.forEach(function(newsItem) {
          _checkAndSaveFile(item, newsItem);
        })
      })
      _load();
    });
  }
  _load();
}

exports.getWxNews = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 100;

  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };

  WxNew.list(options, function(err, wxNews) {
    WxNew.count(options.criteria, function(err, count) {
      res.send({
        wxNews: wxNews,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}