const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const withdrawMethodSchema = new mongoose.Schema({
  method_id: {
    type: Number,
    unique: true
  },
  method_name: {
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

withdrawMethodSchema.plugin(AutoIncrement, { inc_field: 'method_id', start_seq: 1 });

module.exports = mongoose.model('WithdrawMethod', withdrawMethodSchema); 