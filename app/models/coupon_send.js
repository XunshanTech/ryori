var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CouponSendSchema = new Schema({
  restaurant: {type: Schema.ObjectId, ref: 'Restaurant'},
  coupon: {type: Schema.ObjectId, ref: 'Coupon'},
  app_id: {type: String, trim: true},
  used: {type: Boolean, default: false},
  used_at: {type: Date, default: null},
  createdAt: {type: Date, default: Date.now}
});

CouponSendSchema.statics = {

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('restaurant')
      .populate('coupon')
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('restaurant')
      .populate('coupon')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  listRecent: function(options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('restaurant')
      .populate('coupon')
      .sort(sort)
      .limit(1)
      .exec(cb);
  }
}


mongoose.model('CouponSend', CouponSendSchema);
