
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var FoodSchema = new Schema({
  name: {type: String, default: '', trim: true},
  des: {type: String, default: '', trim: true},
  images: [{type: String, default: '', trim: true}],
  restaurants: [{type: Schema.ObjectId, ref: 'Restaurant'}],
  createdAt: {type: Date, default: null}
});

FoodSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }

}

FoodSchema.statics = {

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('restaurants')
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('restaurants')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  listAll: function(options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('restaurants')
      .sort(sort)
      .exec(cb);
  }
}

mongoose.model('Food', FoodSchema);
