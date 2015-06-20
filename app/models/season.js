
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var config = require('config');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var SeasonSchema = new Schema({
  title: {type: String, default: ''},
  foods: [{type: Schema.ObjectId, ref: 'Food'}],
  is_del: {type: Boolean, default: false},
  createdAt: {type: Date, default: null}
});

SeasonSchema.methods = {

  upAndSave: function(cb) {
    var self = this;
    this.validate(function (err) {
      if (err) return cb(err);
      self.save(cb);
    });
  }

}

SeasonSchema.statics = {


  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('foods')
      .exec(cb);
  },

  findLatest: function(cb) {
    this.findOne({
      is_del: {
        $ne: true
      }
    })
      .populate('foods')
      .sort({
        'createdAt': -1
      })
      .limit(1)
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('foods')
      .sort(sort)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  listAll: function(options, cb) {
    var criteria = options.criteria || {};
    var sort = options.sort || {'createdAt': -1};
    this.find(criteria)
      .populate('foods')
      .sort(sort)
      .exec(cb);
  }
}

mongoose.model('Season', SeasonSchema);
