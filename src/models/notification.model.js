const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const notificationSchema = new mongoose.Schema({
  notification_id: {
    type: Number,
    unique: true,
  },
  user_id: [{
    type: Number,
    ref: 'User',
    required: true
  }],
  content: {
    type: String,
    required: true
  },
  otherinfo: {
    type: String
  },
  status: {
    type: Number,
    default: 1
  },
  created_By: {
    type: Number,
    ref: 'User',
    required: true
  },
  created_At: {
    type: Date,
    default: Date.now
  },
  updated_By: {
    type: Number,
    ref: 'User'
  },
  updated_At: {
    type: Date
  }
}, {
  timestamps: false
});

// Auto-increment for notification_id
notificationSchema.plugin(AutoIncrement, { 
  inc_field: 'notification_id',
  start_seq: 1
});

// Update the updated_At field before saving
notificationSchema.pre('save', function(next) {
  this.updated_At = new Date();
  next();
});

// Update the updated_At field before updating
notificationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_At: new Date() });
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 