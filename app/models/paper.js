
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var getTags = function (tags) {
  return tags.join(',');
};

var setTags = function (tags) {
  if(typeof tags === 'object') return tags;
  tags = tags.split(/[,，]/);
  for(var i = 0; i < tags.length; i++) {
    tags[i] = tags[i].trim();
  }
  return tags;
};

var PaperSchema = new Schema({
  name: {type: String, default: '', trim: true},
  tags: {type: [], get: getTags, set: setTags, trim: true},
  url: {type: String, default: '', trim: true},
  short_url: {type: String, default: '', trim: true},
  fetchRestaurants: [{type: Schema.ObjectId, ref: 'FetchRestaurant'}],
  createdAt: {type: Date, default: null}
});

PaperSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }
}

PaperSchema.statics = {

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
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('fetchRestaurants')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('Paper', PaperSchema);
