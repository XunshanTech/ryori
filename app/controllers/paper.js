
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Paper = mongoose.model('Paper');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');

var _exportsPaper = function() {
  var options = {
    criteria: {}
  };

  Paper.listAll(options, function(err, papers) {
    var infoAry = [];
    var tail = '|0x000d|0';
    for(var i = 0; i < papers.length; i++) {
      var paper = papers[i];
      var tags = paper.tags;
      if(typeof tags === 'string') {
        tags = tags.split(/[,，]/);
      }
      for(var j = 0; j < tags.length; j++) {
        if(tags[j] !== '') {
          infoAry.push(tags[j] + tail);
        }
      }
    }
    fs.writeFile('./config/dicts/paper.txt', infoAry.join('\n'), function(err) {
      console.log(err || "The paper file was saved!");
    })
  });
}

exports.loadPaper = function(req, res, next, paperId) {
  Paper.load(paperId, function (err, paper) {
    if (err) return next(err);
    if (!paper) return next(new Error('paper not found'));
    req.tempPaper = paper;
    next();
  });
}

exports.getPapers = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 100;
  var paper_search = req.param('paper_search');

  var criteria = {};
  if(paper_search && paper_search !== '') {
    var reg = new RegExp(paper_search.trim(), 'i');
    criteria = {
      name: {
        $regex: reg
      }
    }
  }
  var options = {
    page: page,
    perPage: perPage,
    criteria: criteria
  };

  Paper.list(options, function(err, papers) {
    Paper.count(options.criteria, function(err, count) {
      res.send({
        papers: papers,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}

exports.updatePaper = function(req, res) {
  var paper = req.tempPaper ?
    extend(req.tempPaper, req.body) :
    new Paper(extend({createdAt: new Date()}, req.body));

  paper.save(function(err, paperObj) {
    if(err) {
      console.log(err);
    }
    _exportsPaper();
    res.send({
      success: !err && true,
      paper: paperObj
    })
  })
}

exports.getPaper = function(req, res) {
  var paper = req.tempPaper;
  return res.send(paper);
}