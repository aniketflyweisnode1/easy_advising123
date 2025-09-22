const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const roleSchema = new mongoose.Schema({
  role_id: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  permissions: {
    type: Array,
    default: []
  },
  description: {
    type: String,
    trim: true,
    default: ''
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

// Auto-increment for role_id
roleSchema.plugin(AutoIncrement, { 
  inc_field: 'role_id',
  start_seq: 1
});

// Update the updated_on field before saving
roleSchema.pre('save', function(next) {
  this.updated_on = new Date();
  next();
});

// Update the updated_on field before updating
roleSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_on: new Date() });
  next();
});

module.exports = mongoose.model('Role', roleSchema); 