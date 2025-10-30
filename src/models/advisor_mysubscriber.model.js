const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const advisorMySubscriberSchema = new mongoose.Schema({
  MySubscriber_id: {
    type: Number,
    unique: true
  },
  advisorPackage_id: {
    type: Number,
    ref: 'AdvisorPackage',
    required: true
  },
  subscribed_by: {
    type: Number,
    ref: 'User',
    required: true
  },
  trangection_id: {
    type: Number,
    ref: 'Transaction'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  isActive: {
    type: String,
    enum: ['Active', 'inActive'],
    default: 'inActive'
  },
  ExpiryDate: {
    type: Date
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

advisorMySubscriberSchema.plugin(AutoIncrement, { inc_field: 'MySubscriber_id' });

advisorMySubscriberSchema.pre('save', function(next) {
  this.UpdatedAt = new Date();
  next();
});

advisorMySubscriberSchema.pre('findOneAndUpdate', function(next) {
  this.set({ UpdatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Advisor_MySubscriber', advisorMySubscriberSchema);


