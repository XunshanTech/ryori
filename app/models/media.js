
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Imager = require('imager');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

/**
 * Article Schema
 */

var MediaSchema = new Schema({
  restaurant: {type: Schema.ObjectId, ref: 'Restaurant'},
  app_id: {type: String, default: '', trim: true},
  media_id: {type: String, default: '', trim: true},
  format: {type: String, default: '', trim: true},
  type: {type: String, default: '', trim: true},
  recognition: {type: String, default: '', trim: true},
  checked_status: {type: Number, default: 0}, //0 - 未审核；1 - 审核通过； 2 - 审核未通过
  checked_user: {type: Schema.ObjectId, ref: 'User'},
  checked_at: {type: Date, default: null},
  createdAt: {type: Date, default: Date.now}
});

/**
 * virtual
 */
MediaSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

/**
 * Methods
 */

MediaSchema.methods = {

  /**
   * Save article and upload image
   *
   * @param {Object} images
   * @param {Function} cb
   * @api private
   */

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }

}

/**
 * Statics
 */

MediaSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('restaurant', 'name sub_name tel')
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
      .populate('restaurant', 'name sub_name tel')
      .sort(sort)
      .exec(cb);
  }
}

mongoose.model('Media', MediaSchema);
