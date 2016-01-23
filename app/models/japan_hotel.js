/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var JapanHotelSchema = new Schema({
  //酒店名字
  name: {type: String, default: '', trim: true},
  //酒店英文名字
  en_name: {type: String, default: '', trim: true},
  //所在城市
  city: {type: String, default: '', trim: true},
  //所在国家
  country: {type: String, default: 'japan', trim: true},
  //地址
  address: {type: String, default: '', trim: true},
  //区域
  region: {type: String, default: '', trim: true},
  //地铁距离
  railway: {type: String, default: '', trim: true},
  //酒店在大众点评的链接地址
  link: {type: String, default: '', trim: true},
  //特点标签
  tags: [{type: String, default: '', trim: true}],
  lng: {type: String, default: '', trim: true}, //真实经度
  lat: {type: String, default: '', trim: true}, //真实纬度
  createdAt: {type: Date, default: Date.now}
});


JapanHotelSchema.statics = {

  load: function (options, cb) {
    this.findOne(options.criteria)
      .exec(cb);
  },

  findByNameAndCity: function(name, city, cb) {
    var reg = new RegExp(name.trim(), 'i');
    var criteria = {
      $or: [{
        name: {
          $regex: reg
        }
      }, {
        en_name: {
          $regex: reg
        }
      }]
    };
    if(city && city !== '') {
      criteria.city = city;
    }
    this.findOne(criteria).exec(cb);
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

mongoose.model('JapanHotel', JapanHotelSchema);