const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const advisorPackageSchema = new mongoose.Schema({
  Advisor_Package_id: {
    type: Number,
    unique: true
  },
  advisor_id: {
    type: Number,
    ref: 'User',
    required: true
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
  Basic_price: {
    type: Number,
    default: 0,
    min: 0
  },
  Basic_packageExpriyDays: {
    type: Number,
    default: 30,
    min: 1
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
  Economy_price: {
    type: Number,
    default: 0,
    min: 0
  },
  Economy_packageExpriyDays: {
    type: Number,
    default: 60,
    min: 1
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
  Pro_price: {
    type: Number,
    default: 0,
    min: 0
  },
  Pro_packageExpriyDays: {
    type: Number,
    default: 90,
    min: 1
  },
  
  status: {
    type: Boolean,
    default: true
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

advisorPackageSchema.plugin(AutoIncrement, { inc_field: 'Advisor_Package_id' });

advisorPackageSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

advisorPackageSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

const AdvisorPackage = mongoose.model('AdvisorPackage', advisorPackageSchema);

module.exports = AdvisorPackage;

