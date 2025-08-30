const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const replyStatusEnum = ["Panding", "Open", "process", "closed", "assign"];

const faqReplySchema = new mongoose.Schema({
  faqreply_id: {
    type: Number,
    unique: true
  },
  faq_id: {
    type: Number,
    ref: 'Faq',
    required: true
  },
  reply_description: {
    type: String,
    required: true
  },
  reply_status: {
    type: String,
    enum: replyStatusEnum,
    default: "Panding"
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

faqReplySchema.plugin(AutoIncrement, {
  inc_field: 'faqreply_id',
  start_seq: 1
});

faqReplySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

faqReplySchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('FaqReply', faqReplySchema); 