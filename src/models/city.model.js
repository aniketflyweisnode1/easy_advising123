const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const citySchema = new mongoose.Schema({
  city_id: {
    type: Number,
    unique: true
  },
  state_id: {
    type: Number,
    ref: 'State',
    required: true
  },
  city_name: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 1
  },
  created_by: {
    type: Number,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: Number,
    ref: 'User'
  },
  updated_at: {
    type: Date
  }
});

citySchema.plugin(AutoIncrement, { inc_field: 'city_id' });

const City = mongoose.model('City', citySchema);

module.exports = City; 