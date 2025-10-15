const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const packageSchema = new mongoose.Schema({
  package_id: {
    type: Number,
    unique: true
  },
  // Package names
  Basic_packege_name: {
    type: String,
    default: 'Basic'
  },
  Economy_packege_name: {
    type: String,
    default: 'Economy'
  },
  Pro_packege_name: {
    type: String,
    default: 'Pro'
  },
  
  // Basic package fields
  Basic_minute: {
    type: Number,
    default: 0,
    min: 0
  },
  Basic_Schedule: {
    type: Number,
    default: 0,
    min: 0
  },
  Basic_discription: {
    type: String
  },
  
  // Economy package fields
  Economy_minute: {
    type: Number,
    default: 0,
    min: 0
  },
  Economy_Schedule: {
    type: Number,
    default: 0,
    min: 0
  },
  Economy_discription: {
    type: String
  },
  
  // Pro package fields
  Pro_minute: {
    type: Number,
    default: 0,
    min: 0
  },
  Pro_Schedule: {
    type: Number,
    default: 0,
    min: 0
  },
  Pro_discription: {
    type: String
  },
  // Rate fields
 
  approve_status: {
    type: Boolean,
    default: false
  },
  approve_by: {
    type: Number,
    ref: 'User'
  },
  approve_at: {
    type: Date
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
});

packageSchema.plugin(AutoIncrement, { inc_field: 'package_id' });

const Package = mongoose.model('Package', packageSchema);

module.exports = Package; 