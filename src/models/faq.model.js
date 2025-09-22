const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const faqSchema = new mongoose.Schema({
  faq_id: {
    type: Number,
    unique: true
  },
  faq_Question: {
    type: String,
    required: true
  },
  faq_Answer: {
    type: String,
    default: ""
  },
  role_id: {
    type: Number,
    ref: 'Role',
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