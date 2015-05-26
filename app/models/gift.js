
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var GiftSchema = new Schema({
  restaurant_id: {type: String, default: '', trim: true},
  app_id: {type: String, default: '', trim: true},
  createdAt: {type: Date, default: Date.now}
});

//设置该项后 才可以返回virtual设置的内容
GiftSchema.set('toObject', { getters: true });

GiftSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

GiftSchema.statics = {

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

  listAll: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .exec(cb);
  }
}

mongoose.model('Gift', GiftSchema);
