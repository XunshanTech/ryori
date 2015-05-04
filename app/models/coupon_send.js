var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CouponSendSchema = new Schema({
  restaurant: {type: Schema.ObjectId, ref: 'Restaurant'},
  coupon: {type: Schema.ObjectId, ref: 'Coupon'},
  app_id: {type: String, trim: true},
  createdAt: {type: Date, default: Date.now}
});

mongoose.model('CouponSend', CouponSendSchema);
