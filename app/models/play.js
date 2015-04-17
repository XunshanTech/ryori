
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Imager = require('imager');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var PlaySchema = new Schema({
  media: { type: Schema.ObjectId, ref: 'Media'},
  restaurant: { type: Schema.ObjectId, ref: 'Restaurant'},
  app_id: {type: String, default: '', trim: true},
  play_count: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
});

PlaySchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

/**
 * Statics
 */

PlaySchema.statics = {

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
    var sort = {'play_count': 1};
    this.find(criteria)
      .sort(sort)
      .exec(cb);
  }

}

mongoose.model('Play', PlaySchema);
