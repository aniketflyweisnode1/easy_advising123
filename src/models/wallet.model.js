const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const walletSchema = new mongoose.Schema({
  wallet_id: {
    type: Number,
    unique: true,
  },
  user_id: [{
    type: Number,
    ref: 'User',
    required: true
  }],
  role_id: {
    type: Number,
    ref: 'Role',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  hold_amount: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 1
  },
  created_At: {
    type: Date,
    default: Date.now
  },
  updated_At: {
    type: Date
  },
  updated_by: {
    type: Number,
    ref: 'User'
  }
}, {
  timestamps: false
});

// Auto-increment for wallet_id
walletSchema.plugin(AutoIncrement, { 
  inc_field: 'wallet_id',
  start_seq: 1
});

// Update the updated_At field before saving
walletSchema.pre('save', function(next) {
  this.updated_At = new Date();
  next();
});

// Update the updated_At field before updating
walletSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_At: new Date() });
  next();
});

module.exports = mongoose.model('Wallet', walletSchema); 