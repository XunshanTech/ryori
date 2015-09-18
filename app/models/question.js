
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var tree = require('mongoose-tree');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var getQuestion = function(question) {
  return question.replace(/[\*]/, ' ');
}

var setQuestion = function(question) {
  var questions = question.split(' ');
  var rets = [];
  for(var i = 0; i < questions.length; i++) {
    if(questions[i] !== '') {
      rets.push(questions[i]);
    }
  }
  return rets.join('*');
}

var getSubQuestions = function(subQuestions) {
  subQuestions.forEach(function(question, index) {
    subQuestions[index] = question.replace(/[\*]/, ' ');
  })
  return subQuestions;
}

var setSubQuestions = function(subQuestions) {
  subQuestions.forEach(function(question, index) {
    var questions = question.split(' ');
    var rets = [];
    for(var i = 0; i < questions.length; i++) {
      if(questions[i] !== '') {
        rets.push(questions[i]);
      }
    }
    subQuestions[index] = rets.join('*');
  })
  return subQuestions;
}

var QuestionSchema = new Schema({
  question: {type: String, default: '', get: getQuestion, set: setQuestion, trim: true},
  sub_questions: {type: [], get: getSubQuestions, set: setSubQuestions, trim: true},
  text: {type: String, default: '', trim: true},
  img: {type: String, default: '', trim: true},
  img_media_id: {type: String, default: '', trim: true},
  img_media_updated: {type: Date, default: null},
  answer_type: {type: Number, default: 0}, // 0 - 文字, 1 - 图片
  createdAt: {type: Date, default: null}
});

QuestionSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }

}

QuestionSchema.statics = {

  /*findByName: function(name, cb) {
    this.findOne({
      $or: [{
        name: name
      }, {
        tags: {
          $in: [name]
        }
      }, {
        error_names: {
          $in: [name]
        }
      }]
    }).exec(cb);
  },*/

  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('Question', QuestionSchema);
