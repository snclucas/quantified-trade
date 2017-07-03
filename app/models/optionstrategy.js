var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OptionSchema = new Schema({
  symbol: String,
  strike: Number,
  expiry: String,
  bid: Number,
  ask: Number,
  side: String,
  type: String,
});

var OptionStrategySchema = new Schema({
  symbol: String,
  name: String,
  description: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  expiry: String,
  strategyoptions: [OptionSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
});

/*
OptionStrategySchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});
*/

module.exports = mongoose.model('OptionStrategy', OptionStrategySchema)