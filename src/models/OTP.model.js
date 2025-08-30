const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const otpSchema = new mongoose.Schema({
  otp_id: {
    type: Number,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  otptype_id: {
    type: Number,
    ref: 'OTPType',
    required: true
  },
  expiry: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  purpose: {
    type: String,
    enum: ['login', 'registration'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Auto-increment for otp_id
otpSchema.plugin(AutoIncrement, { 
  inc_field: 'otp_id',
  start_seq: 1
});

// Index for faster queries
otpSchema.index({ mobile: 1, created_at: -1 });
otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-delete expired OTPs

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return Date.now() > this.expiry;
};

// Method to mark OTP as used
otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

module.exports = mongoose.model('OTP', otpSchema); 