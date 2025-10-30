const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const adminConnectCallSchema = new mongoose.Schema({
  AdminConnectCall_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  mobileNo: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  topic: {
    type: String
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

adminConnectCallSchema.plugin(AutoIncrement, { inc_field: 'AdminConnectCall_id' });

adminConnectCallSchema.pre('save', function(next) {
  this.UpdatedAt = new Date();
  next();
});

adminConnectCallSchema.pre('findOneAndUpdate', function(next) {
  this.set({ UpdatedAt: new Date() });
  next();
});

module.exports = mongoose.model('AdminConnectCall', adminConnectCallSchema);


