/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

/**
 * DP_Restaurant Schema
 */

var FetchRestaurantSchema = new Schema({
  //餐厅名字
  name: {type: String, default: '', trim: true},
  //餐厅分店位置
  local_name: {type: String, default: '', trim: true},
  //餐厅别名
  other_name: {type: String, default: '', trim: true},
  //所在城市 2 - 北京
  city: {type: String, default: '', trim: true},
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
  //菜品
  dishes: [{
    name: {type: String, default: '', trim: true},
    score: {type: Number, default: 0, trim: true}
  }],
  //餐厅在大众点评的地址
  dp_link: {type: String, default: '', trim: true},
  createdAt: {type: Date, default: Date.now}
});

FetchRestaurantSchema.statics = {

  findByLink: function(link, cb) {
    this.findOne({
      dp_link: link
    }).exec(cb);
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

mongoose.model('FetchRestaurant', FetchRestaurantSchema);
