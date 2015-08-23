
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var DishRestaurantSchema = new Schema({
  dish: {type: Schema.ObjectId, ref: 'Dish'},
  fetch_restaurant: {type: Schema.ObjectId, ref: 'FetchRestaurant'},
  city_key: {type: String, default: '', trim: true},
  recommend: {type: String, default: '', trim: true},
  img: {type: String, default: '', trim: true},
  order: {type: Number, default: 0},
  disable: {type: Boolean, default: false},
  createdAt: {type: Date, default: null},
  fetch_restaurant_other: {type: Object} // 临时参数
});

DishRestaurantSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }

}

DishRestaurantSchema.statics = {

  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb);
  },

  listAll: function(options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('dish')
      .populate('fetch_restaurant')
      .sort(sort)
      .exec(cb);
  }
}

mongoose.model('DishRestaurant', DishRestaurantSchema);
