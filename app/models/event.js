
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Imager = require('imager');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

/**
 * Event Schema
 */

var EventSchema = new Schema({
  restaurant: { type: Schema.ObjectId, ref: 'Restaurant'},
  app_id: {type: String, default: '', trim: true},
  event: {type: String, default: '', trim: true},
  media_id: {type: String, default: '', trim: true},
  msg_id: {type: String, default: '', trim: true},
  msg_type: {type: String, default: '', trim: true},
  format: {type: String, default: '', trim: true},
  pic_url: {type: String, default: '', trim: true},
  content: {type: String, default: '', trim: true},
  createdAt: {type: Date, default: Date.now}
});

/**
 * virtual
 */
EventSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

/**
 * Methods
 */

EventSchema.methods = {

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

EventSchema.statics = {

  /**
   * Find event by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb);
  },

  /**
   * List events
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('restaurant', 'name')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  /**
   * List recent events
   * @param options
   * @param cb
   */
  listRecent: function(options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .where('restaurant').ne(null)
      .populate('restaurant')
      .sort(sort)
      .limit(1)
      .exec(cb);
  }

}

mongoose.model('Event', EventSchema);
