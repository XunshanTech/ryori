
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');

var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

/**
 * Articles Schema
 */

var ArticlesSchema = new Schema({
  title: {type: String, default: '', trim: true},
  articles: [{type: Schema.ObjectId, ref: 'Article'}],
  des: {type: String, default: '', trim: true},
  createdAt: {type: Date, default: Date.now}
});

/**
 * virtual
 */
ArticlesSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

/**
 * Validations
 */

ArticlesSchema.path('title').required(true, 'Articles title cannot be blank');

/**
 * Methods
 */

ArticlesSchema.methods = {

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

ArticlesSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('articles', 'title media_id')
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
      .populate('articles', 'title media_id')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  /**
   * list article contains comments and comment's user
   */
  listAll: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('articles', 'title media_id')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('Articles', ArticlesSchema);
