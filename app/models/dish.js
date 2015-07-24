
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var tree = require('mongoose-tree');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var DishSchema = new Schema({
  name: {type: String, default: '', trim: true},
  des: {type: String, default: '', trim: true},
  eat: {type: String, default: '', trim: true},
  img: {type: String, default: '', trim: true},
  img_media_id: {type: String, default: '', trim: true},
  img_media_updated: {type: Date, default: null},
  nameFrom: {type: String, default: '', trim: true},
  categories: {type: String, default: '', trim: true},
  link: {type: String, default: '', trim: true},
  children: {type: Array},
  createdAt: {type: Date, default: null}
});

DishSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }

}

DishSchema.statics = {

  findByName: function(name, cb) {
    this.findOne({
      name: name
    }).exec(cb);
  },

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

DishSchema.plugin(tree);

mongoose.model('Dish', DishSchema);
