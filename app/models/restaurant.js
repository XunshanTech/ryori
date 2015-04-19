
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
  baidu_lng: {type: String, default: '', trim: true}, //百度经度
  baidu_lat: {type: String, default: '', trim: true}, //百度纬度
  manager: {type: Schema.ObjectId, ref: 'User'},
  createdAt: {type: Date, default: Date.now}
});

RestaurantSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

RestaurantSchema.pre('save', function(next) {
  var me = this;
  if(me.baidu_lat !== '' && me.baidu_lng !== '') {
    request('http://api.zdoz.net/bd2wgs.aspx?lat=' + me.baidu_lat + '&lng=' + me.baidu_lng,
      function(error, response, body) {
        if(!error && response.statusCode == 200) {
          var ret = JSON.parse(body);
          console.log(JSON.parse(body));
          console.log(ret.Lng);
          console.log(ret.Lat);
          if(ret && ret.Lng && ret.Lat) {
            me.lat = ret.Lat;
            me.lng = ret.Lng;
          }
        }
        console.log(me);
        next();
      });
  } else {
    next();
  }
})


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
