
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

var _getAimlBody = function(question) {
  var _match = /[\*|\s]/;
  var _questionAry = question.question.split(_match);
  var _mainQuestion = _questionAry.join('*');
  var _aimlMain = ['<category>',
      '<pattern>', _mainQuestion, '</pattern>',
      '<template>', 'QUESTIONID_', question._id, '</template>',
    '</category>'].join('');
  question.sub_questions.forEach(function(subQuestion) {
    if(subQuestion === '') return ;
    var _subQuestionAry = subQuestion.split(_match);
    _aimlMain += ['\n<category>',
        '<pattern>', _subQuestionAry.join('*'), '</pattern>',
        '<template><srai>', _mainQuestion, '</srai></template>',
      '</category>'].join('');
  });
  return _aimlMain;
}

var _exportAiml = function() {
  var _aiml = [];
  var _aimlHead = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<aiml version="1.0">'].join('');
  var _aimlTail = '</aiml>';
  _aiml.push(_aimlHead);
  Question.listAll({}, function(err, questions) {
    questions.forEach(function(question) {
      var _aimlBody = _getAimlBody(question);
      _aiml.push(_aimlBody);
    })
    _aiml.push(_aimlTail);
    fs.writeFile('./config/aimls/question.aiml', _aiml.join('\n'), function(err) {
      console.log(err || "The our question aiml file was saved!");
    })
  })
}

exports.editQuestion = function(req, res) {
  var question = req.tempQuestion ?
    extend(req.tempQuestion, req.body) :
    new Question(extend({createdAt: new Date()}, req.body));
  question.save(function(err, questionObj) {
    if(err) {
      console.log(err);
    }
    _exportAiml();
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