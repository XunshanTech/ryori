/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

/**
 * DP_Restaurant Schema
 */

var JapanRestaurantSchema = new Schema({
  //餐厅名字
  name: {type: String, default: '', trim: true},
  //米其林星级 1, 2, 3
  michelin_level: {type: Number, default: 0},
  //餐厅英文名字
  en_name: {type: String, default: '', trim: true},
  //所在城市
  city: {type: String, default: '', trim: true},
  //所在国家
  country: {type: String, default: 'japan', trim: true},
  //所在地区
  area: {type: String, default: '', trim: true},
  //餐厅地点
  address: {type: String, default: '', trim: true},
  //餐厅电话
  tel: {type: String, default: '', trim: true},
  //营业时间
  open_time: {type: String, default: '', trim: true},
  //人均消费
  price: {type: Number, default: 0, trim: true},
  //口味评分
  taste: {type: Number, default: 0, trim: true},
  //环境评分
  env: {type: Number, default: 0, trim: true},
  //服务评分
  service: {type: Number, default: 0, trim: true},
  //餐厅在大众点评的链接地址
  dp_link: {type: String, default: '', trim: true},
  lng: {type: String, default: '', trim: true}, //真实经度
  lat: {type: String, default: '', trim: true}, //真实纬度
  //餐厅详情
  des: {type: String, default: '', trim: true},
  //餐厅图片
  img: {type: String, default: '', trim: true},
  createdAt: {type: Date, default: Date.now}
});


JapanRestaurantSchema.statics = {

  load: function (options, cb) {
    this.findOne(options.criteria)
      .exec(cb);
  },

  findByLink: function(link, cb) {
    this.findOne({
      dp_link: link
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

mongoose.model('JapanRestaurant', JapanRestaurantSchema);
