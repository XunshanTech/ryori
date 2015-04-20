
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Imager = require('imager');
var config = require('config');
var request = require('request');

var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

/**
 * Restaurant Schema
 */

var RestaurantSchema = new Schema({
  name: {type: String, default: '', trim: true},
  sub_name: {type: String, default: '', trim: true},
  location: {type: String, default: '', trim: true},
  tel: {type: String, default: '', trim: true},
  des: {type: String, default: '', trim: true},
  qrcode_ticket: {type: String, default: '', trim: true},
  scene_str: {type: String, default: '', trim: true},
  lng: {type: String, default: '', trim: true}, //真实经度
  lat: {type: String, default: '', trim: true}, //真实纬度
  manager: {type: Schema.ObjectId, ref: 'User'},
  createdAt: {type: Date, default: Date.now}
});

RestaurantSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

/**
 * Statics
 */

RestaurantSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('manager', 'name wx_name wx_app_id')
      .exec(cb);
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('manager', 'name wx_name wx_app_id')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  listAll: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('manager', 'name wx_name wx_app_id')
      .sort(sort)
      .exec(cb);
  }
}

mongoose.model('Restaurant', RestaurantSchema);
