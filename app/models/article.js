
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Imager = require('imager');
var config = require('config');

var imagerConfig = require(config.root + '/config/imager.js');
var utils = require('../../lib/utils');
var jsdom = require('jsdom');

var Schema = mongoose.Schema;

/**
 * Article Schema
 */

var ArticleSchema = new Schema({
  title: {type: String, default: '', trim: true},
  content: {type: String, default: '', trim: true},
  content_source_url: {type: String, default: '', trim: true},
  thumb_media_id: {type: String, default: '', trim: true},
  digest: {type: String, default: '', trim: true},
  show_cover_pic: {type: Boolean, default: true},
  author: {type: Schema.ObjectId, ref: 'User'},
  createdAt: {type: Date, default: Date.now}
});

/**
 * virtual
 */
ArticleSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

/**
 * Validations
 */

ArticleSchema.path('title').required(true, 'Article title cannot be blank');
ArticleSchema.path('content').required(true, 'Article content cannot be blank');

/**
 * Pre-save hook
 */
ArticleSchema.pre('save', function(next) {
  var self = this;
  jsdom.env(
    self.body,
    [config.root + "/public/lib/jquery/dist/jquery.min.js"],
    function(errors, window) {
      if(errors) {
        return next(errors);
      }
      var imgPath = '';
      window.$('img').each(function(index, img) {
        var src = window.$(img).attr('src');
        var lastStr = '.580.png';
        if(src.lastIndexOf(lastStr) === (src.length - lastStr.length)) {
          imgPath = src;
          return false;
        }
      });
      self.brief.img = imgPath;
      self.brief.text = window.$(window.document).text();
      console.log('Success filter img and text on brief!');
      next();
    }
  );
});

/**
 * Pre-remove hook
 */

ArticleSchema.pre('remove', function (next) {
  var imager = new Imager(imagerConfig, 'S3');
  var files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  imager.remove(files, function (err) {
    if (err) return next(err);
  }, 'article');

  next();
});

/**
 * Methods
 */

ArticleSchema.methods = {

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

ArticleSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('user', 'wx_name wx_app_id city tel location')
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
      .populate('user', 'wx_name wx_app_id city')
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
      .populate('user', 'wx_name wx_app_id city')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('Article', ArticleSchema);
