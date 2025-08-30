const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const filterSchema = new mongoose.Schema({
  filter_id: {
    type: Number,
    unique: true,
  },
  category_id: [{
    type: Number,
    ref: 'Category',
   
  }],
  subcategory_id: [{
    type: Number,
    ref: 'Subcategory',
    
  }],
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

filterSchema.plugin(AutoIncrement, {
  inc_field: 'filter_id',
  start_seq: 1
});

filterSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

filterSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('Filter', filterSchema); 