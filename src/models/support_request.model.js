const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const supportRequestSchema = new mongoose.Schema({
  Support_Request_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  mobileno: {
    type: String,
    required: true
  },
  Emailaddress: {
    type: String,
    required: true
  },
  Status: {
    type: Boolean,
    default: true
  },
  CreateBy: {
    type: Number,
    ref: 'User',
    required: true
  },
  CreateAt: {
    type: Date,
    default: Date.now
  },
  UpdatedBy: {
    type: Number,
    ref: 'User'
  },
  UpdatedAt: {
    type: Date
  }
}, { timestamps: false });

supportRequestSchema.plugin(AutoIncrement, { inc_field: 'Support_Request_id' });

supportRequestSchema.pre('save', function(next) {
  this.UpdatedAt = new Date();
  next();
});

supportRequestSchema.pre('findOneAndUpdate', function(next) {
  this.set({ UpdatedAt: new Date() });
  next();
});

module.exports = mongoose.model('SupportRequest', supportRequestSchema);

