
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
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
    if(questions[i].trim() !== '') {
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
  var newQuestions = [];
  subQuestions.forEach(function(question) {
    if(question === '') return ;
    var questions = question.split(' ');
    var rets = [];
    for(var i = 0; i < questions.length; i++) {
      if(questions[i] !== '') {
        rets.push(questions[i]);
      }
    }
    newQuestions.push(rets.join('*'));
  })
  return newQuestions;
}

var setLinks = function(links) {
  var newLinks = [];
  links.forEach(function(link) {
    if(link.name !== '' && link.url !== '') {
      newLinks.push(link);
    }
  })
  return newLinks;
}

var QuestionSchema = new Schema({
  question: {type: String, default: '', get: getQuestion, set: setQuestion, trim: true},
  sub_questions: {type: [], get: getSubQuestions, set: setSubQuestions, trim: true},
  text: {type: String, default: '', trim: true},
  links: {
    type: [{
      name: {type: String, default: '', trim: true},
      url: {type: String, default: '', trim: true}
    }],
    set: setLinks
  },
  isSystem: {type: Boolean, default: false},
  category: {type: Number, default: 0}, //0 - 默认 1 - sys ...
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

  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb);
  },

  listAll: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'isSystem': 1, 'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('Question', QuestionSchema);
