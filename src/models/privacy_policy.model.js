const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const privacyPolicySchema = new mongoose.Schema({
  PrivacyPolicy_id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  Description: {
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

privacyPolicySchema.plugin(AutoIncrement, { inc_field: 'PrivacyPolicy_id' });

privacyPolicySchema.pre('save', function(next) {
  this.UpdatedAt = new Date();
  next();
});

privacyPolicySchema.pre('findOneAndUpdate', function(next) {
  this.set({ UpdatedAt: new Date() });
  next();
});

module.exports = mongoose.model('PrivacyPolicy', privacyPolicySchema);


