const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const withdrawRequestSchema = new mongoose.Schema({
  request_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method_id: {
    type: Number,
    ref: 'WithdrawMethod',
    required: true
  },
  details: {
    type: String
  },
  last_status: {
    type: String,
    enum: ["Release", "Panding", "Failed", "Success", "Reject", "Approved"],
    default: "Panding",
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
  },
  transaction_id: {
    type: Number,
    ref: 'Transaction'
  }
});

withdrawRequestSchema.plugin(AutoIncrement, { inc_field: 'request_id', start_seq: 1 });

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema); 