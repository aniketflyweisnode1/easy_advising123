const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const stateSchema = new mongoose.Schema({
  state_id: {
    type: Number,
    unique: true
  },
  country_id: {
    type: Number,
    required: true
  },
  state_name: {
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

stateSchema.plugin(AutoIncrement, { inc_field: 'state_id' });

const State = mongoose.model('State', stateSchema);

module.exports = State; 