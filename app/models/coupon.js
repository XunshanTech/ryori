
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Imager = require('imager');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var CouponSchema = new Schema({
  title: {type: String, default: '', trim: true},
  des: {type: String, default: '', trim: true},
  restaurant: {type: Schema.ObjectId, ref: 'Restaurant'},
  sleep_month: {type: Number, default: 0}, //用户到店的间隔 单位：月
  is_del: {type: Boolean, default: false}, //逻辑删除
  start_at: {type: Date, default: null},
  end_at: {type: Date, default: null},
  createdAt: {type: Date, default: Date.now}
});

//设置该项后 才可以返回virtual设置的内容
CouponSchema.set('toObject', { getters: true });

CouponSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

CouponSchema.statics = {

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('restaurant')
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('restaurant')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('Coupon', CouponSchema);
