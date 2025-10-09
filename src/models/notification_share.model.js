const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const notificationShareSchema = new mongoose.Schema({
  share_id: {
    type: Number,
    unique: true
  },
  notification_id: {
    type: Number,
    ref: 'Notification',
    required: true
  },
  blog_id: {
    type: Number,
    ref: 'Blog',
  },
  user_id: [{
    type: Number,
    ref: 'User',
    required: true
  }],
  viewbyUser: {
    type: Number,
    default: 0
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

// Auto-increment for share_id
notificationShareSchema.plugin(AutoIncrement, {
  inc_field: 'share_id',
  start_seq: 1
});

// Update the updated_at field before saving
notificationShareSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Update the updated_at field before updating
notificationShareSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('NotificationShare', notificationShareSchema); 