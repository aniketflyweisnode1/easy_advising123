const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const otpTypeSchema = new mongoose.Schema({
  otptype_id: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: Number,
    default: 1 // 1: active, 0: inactive
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
    ref: 'User',
    default: null
  },
  updated_on: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Auto-increment for otptype_id
otpTypeSchema.plugin(AutoIncrement, { 
  inc_field: 'otptype_id',
  start_seq: 1
});

// Update the updated_on field before saving
otpTypeSchema.pre('save', function(next) {
  this.updated_on = new Date();
  next();
});

// Update the updated_on field before updating
otpTypeSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_on: new Date() });
  next();
});

module.exports = mongoose.model('OTPType', otpTypeSchema); 