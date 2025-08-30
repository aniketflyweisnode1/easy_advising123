const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const languageSchema = new mongoose.Schema({
  language_id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  status: {
    type: Number,
    default: 1 // 1: active, 0: inactive
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
    ref: 'User',
    default: null
  },
  updated_on: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Auto-increment for language_id
languageSchema.plugin(AutoIncrement, { 
  inc_field: 'language_id',
  start_seq: 1
});

// Update the updated_on field before saving
languageSchema.pre('save', function(next) {
  this.updated_on = new Date();
  next();
});

// Update the updated_on field before updating
languageSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_on: new Date() });
  next();
});

module.exports = mongoose.model('Language', languageSchema); 