const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const { generateTicketNo } = require('../utils/otpUtils');

const faqStatusEnum = ["Panding", "Open", "process", "closed", "assign"];

const faqSchema = new mongoose.Schema({
  faq_id: {
    type: Number,
    unique: true
  },
  faq_no: {
    type: String,
    unique: true,
    default: generateTicketNo
  },
  date: {
    type: Date,
    default: Date.now
  },
  postby_user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  faq_status: {
    type: String,
    enum: faqStatusEnum,
    default: "Panding"
  },
  faq_Question: {
    type: String,
    required: true
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

faqSchema.plugin(AutoIncrement, {
  inc_field: 'faq_id',
  start_seq: 1
});

faqSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

faqSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('Faq', faqSchema); 