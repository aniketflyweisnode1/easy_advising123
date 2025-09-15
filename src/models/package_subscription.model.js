const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const packageSubscriptionSchema = new mongoose.Schema({
  PkSubscription_id: {
    type: Number,
    unique: true,
  },
  package_id: {
    type: Number,
    ref: 'Package',
    required: true
  },
  subscribe_by: {
    type: Number,
    ref: 'User',
    required: true
  },
  Subscription_status: {
    type: String,
    enum: ['Actived', 'Expired', 'Panding'],
    default : 'Panding',
    required: true
  },
  Expire_status: {
    type: Boolean,
    default: false
  },
  Expire_Date: {
    type: Date
  },
  status: {
    type: Boolean,
    default: true
  },
  Remaining_minute: {
    type: Number,
    default: 0,
    min: 0
  },
  Remaining_Schedule: {
    type: Number,
    default: 0,
    min: 0
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

packageSubscriptionSchema.plugin(AutoIncrement, {
  inc_field: 'PkSubscription_id',
  start_seq: 1
});

packageSubscriptionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

packageSubscriptionSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('PackageSubscription', packageSubscriptionSchema); 