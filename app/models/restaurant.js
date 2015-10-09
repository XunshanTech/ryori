
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
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
  isDel: {type: Boolean, default: false},
  isJoin: {type: Boolean, default: false}, //是否已入店推广
  isTopic: {type: Boolean, default: false},
  topicKey: {type: String, default: '', trim: true},
  gift_no: {type: Number, default: 0}, //临时属性 用于计算发放的礼品数量
  user_no: {type: Number, default: 0}, //临时属性 用于计算会员数量
  voice_no: {type: Number, default: 0}, //临时属性 用于审核通过的语音数量
  voice_wait_no: {type: Number, default: 0}, //临时属性 用于待审核的语音数量
  createdAt: {type: Date, default: Date.now}
});

RestaurantSchema.virtual('fromNow').get(function() {
  return utils.fromNow(this.createdAt);
});

RestaurantSchema.statics = {

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('manager', 'name wx_name wx_app_id')
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {isTopic: -1, isJoin: -1, 'createdAt': -1};
    this.find(criteria)
      .nor([{isDel: true}])
      .populate('manager', 'name wx_name wx_app_id')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  listAll: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {isTopic: -1, isJoin: -1, 'createdAt': -1};
    this.find(criteria)
      .nor([{isDel: true}])
      .populate('manager', 'name wx_name wx_app_id')
      .sort(sort)
      .exec(cb);
  }
}

mongoose.model('Restaurant', RestaurantSchema);
