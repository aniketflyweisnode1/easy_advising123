const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const callTypeSchema = new mongoose.Schema({
  call_type_id: {
    type: Number,
    unique: true
  },
  mode_name: {
    type: String,
    required: true
  },
  adviser_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  price_per_minute: {
    type: Number,
    required: true
  },
  adviser_commission: {
    type: Number,
    required: true
  },
  admin_commission: {
    type: Number,
    required: true
  },
  approval_status: {
    type: Boolean,
    default: false
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

callTypeSchema.plugin(AutoIncrement, { inc_field: 'call_type_id', start_seq: 1 });

module.exports = mongoose.model('CallType', callTypeSchema); 