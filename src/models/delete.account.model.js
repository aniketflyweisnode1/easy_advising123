const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const deleteStatusEnum = ["Panding", "Approve", "Reject"];

const deleteAccountSchema = new mongoose.Schema({
  Daccountid_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  Delete_account_Reason: {
    type: String,
    required: true
  },
  Delete_status: {
    type: String,
    enum: deleteStatusEnum,
    default: "Panding"
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
}, {
  timestamps: false
});

deleteAccountSchema.plugin(AutoIncrement, {
  inc_field: 'Daccountid_id',
  start_seq: 1
});

deleteAccountSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

deleteAccountSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('DeleteAccount', deleteAccountSchema); 