
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var tree = require('mongoose-tree');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var WxNewSchema = new Schema({
  media_id: {type: String, default: '', trim: true},
  thumb_media_id: {type: String, default: '', trim: true},
  title: {type: String, default: '', trim: true},
  author: {type: String, default: '', trim: true},
  url: {type: String, default: '', trim: true},
  short_url: {type: String, default: '', trim: true},
  createdAt: {type: Date, default: Date.now}
});

WxNewSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }

}

WxNewSchema.statics = {

  loadByThumbMediaId: function (thumbMediaId, cb) {
    this.findOne({ thumb_media_id : thumbMediaId })
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
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('WxNew', WxNewSchema);
