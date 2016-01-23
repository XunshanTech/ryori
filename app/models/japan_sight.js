/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

/**
 * Japan Sight Schema
 */

var JapanSightSchema = new Schema({
  //景点名字
  name: {type: String, default: '', trim: true},
  //景点英文名字
  en_name: {type: String, default: '', trim: true},
  //景点类型 sight - 景点  shopping - 购物
  category: {type: String, default: 'sight', trim: true},
  //所在城市
  city: {type: String, default: '', trim: true},
  //所在国家
  country: {type: String, default: 'japan', trim: true},
  //景点简介
  des: {type: String, default: '', trim: true},
  //景点地点
  address: {type: String, default: '', trim: true},
  //景点到达方式
  access: {type: String, default: '', trim: true},
  //开放时间
  open_time: {type: String, default: '', trim: true},
  //门票
  ticket: {type: String, default: '', trim: true},
  //在该城市中的排名
  rank: {type: Number, default: 10000, trim: true},
  //景点链接地址
  link: {type: String, default: '', trim: true},
  lng: {type: String, default: '', trim: true}, //真实经度
  lat: {type: String, default: '', trim: true}, //真实纬度
  createdAt: {type: Date, default: Date.now}
});


JapanSightSchema.statics = {

  load: function (options, cb) {
    this.findOne(options.criteria)
      .exec(cb);
  },

  findByLink: function(link, cb) {
    this.findOne({
      link: link
    }).exec(cb);
  },

  listAll: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': 1};
    this.find(criteria)
      .sort(sort)
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': 1};
    this.find(criteria)
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('JapanSight', JapanSightSchema);
