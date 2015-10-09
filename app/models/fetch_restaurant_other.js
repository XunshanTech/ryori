/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var FetchRestaurantOtherSchema = new Schema({
  fetch_restaurant: {type: Schema.ObjectId, ref: 'FetchRestaurant'},
  recommend: {type: String, default: '', trim: true},
  createdAt: {type: Date, default: Date.now}
});


FetchRestaurantOtherSchema.statics = {
  load: function (options, cb) {
    this.findOne(options.criteria)
      .exec(cb);
  }
}

mongoose.model('FetchRestaurantOther', FetchRestaurantOtherSchema);
