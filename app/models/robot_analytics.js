
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var tree = require('mongoose-tree');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var RobotAnalyticsSchema = new Schema({
  app_id: {type: String, default: '', trim: true},
  dish: {type: Schema.ObjectId, ref: 'Dish'},
  answerType: {type: String, default: '', trim: true}, // des eat img nameFrom categories restaurants
  createdAt: {type: Date, default: Date.now}
});

RobotAnalyticsSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }
}

RobotAnalyticsSchema.statics = {

  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb);
  },

  findLast: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.findOne(criteria)
      .populate('dish')
      .sort(sort)
      .exec(cb);
  }
}


mongoose.model('RobotAnalytics', RobotAnalyticsSchema);
