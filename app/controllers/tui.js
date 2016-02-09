
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Tui = mongoose.model('Tui');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');
var fsTools = require('fs-tools');
var redis = require('./redis');

exports.loadTui = function(req, res, next, tuiId) {
  Tui.load(tuiId, function (err, tui) {
    if (err) return next(err);
    if (!tui) return next(new Error('tui not found'));
    req.tempTui = tui;
    next();
  });
}

exports.getTuis = function(req, res) {
  var options = {
    criteria: {
      parent: {
        $exists: false
      }
    }
  };
  Tui.listAll(options, function(err, tuis) {
    //第一层
    async.each(tuis, function(tui, callback) {
      tui.getChildren(function(err, subTuis) {
        if(subTuis.length > 0) {
          tui.children = subTuis;
        }
        callback();
      })
    }, function(err) {
      if(err) {
        console.log(err);
      }
      res.send({
        tuis: tuis
      })
    })
  });
}

exports.editTui = function(req, res) {
  var tui = req.tempTui ?
    extend(req.tempTui, req.body) :
    new Tui(extend({createdAt: new Date()}, req.body));
  var parentTuiId = req.param('parentTuiId');
  var _saveTui = function() {
    tui.save(function(err, tuiObj) {
      if(err) {
        console.log(err);
      }
      res.send({
        success: !err && true,
        tui: tuiObj
      })
    })
  }

  if(parentTuiId && parentTuiId !== '') {
    Tui.load(parentTuiId, function (err, parentTui) {
      if (err) return next(err);
      if (!tui) return next(new Error('tui not found'));
      tui.parent = parentTui;
      _saveTui();
    });
  } else {
    _saveTui();
  }
}

exports.getTui = function(req, res) {
  var tui = req.tempTui;
  return res.send(tui);
}