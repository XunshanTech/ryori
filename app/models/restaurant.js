
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Imager = require('imager');
var config = require('config');

var imagerConfig = require(config.root + '/config/imager.js');
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
  qrcode_img: {type: String, default: '', trim: true},
  qrcode_ticket: {type: String, default: '', trim: true},
  scene_str: {type: String, default: '', trim: true},
  manager: {type: Schema.ObjectId, ref: 'User'}
});

/**
 * virtual
 */
RestaurantSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

/**
 * Pre-save hook
 */
RestaurantSchema.pre('save', function(next) {
  /*var self = this;
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
  );*/
});

/**
 * Pre-remove hook
 */

RestaurantSchema.pre('remove', function (next) {
  /*var imager = new Imager(imagerConfig, 'S3');
  var files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  imager.remove(files, function (err) {
    if (err) return next(err);
  }, 'article');

  next();*/
});

/**
 * Methods
 */

RestaurantSchema.methods = {

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
      .populate('manager', 'wx_name wx_app_id city')
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
      .populate('manager', 'wx_name wx_app_id city')
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
      .populate('manager', 'wx_name wx_app_id city')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('RestaurantSchema', RestaurantSchema);
