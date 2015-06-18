
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
