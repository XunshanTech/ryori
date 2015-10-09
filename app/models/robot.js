
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var tree = require('mongoose-tree');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

var RobotSchema = new Schema({
  img_media_id: {type: String, default: '', trim: true},
  img_media_updated: {type: Date, default: null},
  createdAt: {type: Date, default: null}
});

RobotSchema.statics = {

  findRobot: function(cb) {
    this.findOne()
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

RobotSchema.plugin(tree);

mongoose.model('Robot', RobotSchema);
