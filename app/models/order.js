
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var tree = require('mongoose-tree');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var OrderSchema = new Schema({
  //预定用户 微信id
  open_id: {type: String, default: '', trim: true},
  //预定用户 微信名称
  open_name: {type: String, default: '', trim: true},
  //预订人姓名
  name: {type: String, default: '', trim: true},
  //电话
  tel: {type: String, default: '', trim: true},
  //预定几个座位
  no: {type: String, default: '', trim: true},
  //儿童数量
  child: {type: String, default: '', trim: true},

  //是否来自推荐
  is_tui: {type: Boolean, default: false},

  //各类料理的推荐预算
  hsll: {type: String, default: '', trim: true},
  ss: {type: String, default: '', trim: true},
  tfl: {type: String, default: '', trim: true},
  hnll: {type: String, default: '', trim: true},
  htll: {type: String, default: '', trim: true},
  qt: {type: String, default: '', trim: true},

  //订单详情
  orders: [{
    city: String,
    date: String,
    isLunch: Boolean,
    lunch: String,
    isDinner: Boolean,
    dinner: String,
    time: String,
    restaurant: String
  }],

  //建议
  advice: {type: String, default: '', trim: true},
  //备注
  other: {type: String, default: '', trim: true},
  //预定结果
  order_result: {type: String, default: '', trim: true},
  //状态 0 - 预定 1 - 预定完成 2 - 订单结束
  order_state: {type: Number, default: 0},
  createdAt: {type: Date, default: null},
  //临时变量 用于展示
  showCreatedAt: {type: String, default: '', trim: true}
});

OrderSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }

}

OrderSchema.statics = {

  findByParams: function(options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .exec(cb);
  },

  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  listAll: function(options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .sort(sort)
      .exec(cb);
  }
}

mongoose.model('Order', OrderSchema);