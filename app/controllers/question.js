
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Question = mongoose.model('Question');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var moment = require('moment');
var bw = require ("buffered-writer");
var fs = require('fs');
var fsTools = require('fs-tools');

exports.loadQuestion = function(req, res, next, questionId) {
  Question.load(questionId, function (err, question) {
    if (err) return next(err);
    if (!question) return next(new Error('question not found'));
    req.tempQuestion = question;
    next();
  });
}

exports.getQuestions = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 100;

  var options = {
    page: page,
    perPage: perPage,
    criteria: {}
  };

  Question.list(options, function(err, questions) {
    Question.count(options.criteria, function(err, count) {
      res.send({
        questions: questions,
        count: count,
        page: page + 1,
        perPage: perPage,
        pages: Math.ceil(count / perPage)
      })
    })
  });
}

exports.editQuestion = function(req, res) {
  var question = req.tempQuestion ?
    extend(req.tempQuestion, req.body) :
    new Question(extend({createdAt: new Date()}, req.body));
  question.save(function(err, questionObj) {
    if(err) {
      console.log(err);
    }
    res.send({
      success: !err && true,
      question: questionObj
    })
  })
}

exports.getQuestion = function(req, res) {
  var question = req.tempQuestion;
  return res.send(question);
}

exports.uploadQuestionImg = function(req, res) {
  var image_path = req.files.file.path;
  var base_path = './public/upload/dish/';
  fsTools.mkdirSync(base_path);

  var image_name = (new Date()).getTime() + '.jpg';
  var real_path = base_path + image_name;
  var target_path = '/upload/dish/' + image_name;

  try {
    fs.renameSync(image_path, real_path);
    return res.send({
      success: true,
      image: target_path
    })
  } catch(e) {
    console.log(e);
  }

  res.send({
    success: false
  })
}