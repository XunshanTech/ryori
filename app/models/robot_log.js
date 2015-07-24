
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var tree = require('mongoose-tree');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var RobotLogSchema = new Schema({
  userName: {type: String, default: '', trim: true},
  question: {type: String, default: '', trim: true},
  answer: {type: String, default: '', trim: true},
  createdAt: {type: Date, default: Date.now}
});

RobotLogSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }
}

RobotLogSchema.statics = {

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
  },

  listAll: function(options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .exec(cb);
  }
}


mongoose.model('RobotLog', RobotLogSchema);
