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
  packege_name: {
    type: String,
    required: true
  },
  
  // Chat fields
  Chat_minute: {
    type: Number,
    default: 0,
    min: 0
  },
  Chat_Schedule: {
    type: Number,
    default: 0,
    min: 0
  },
  Chat_discription: {
    type: String
  },
  Chat_price: {
    type: Number,
    default: 0
  },
  
  // Audio fields
  Audio_minute: {
    type: Number,
    default: 0,
    min: 0
  },
  Audio_Schedule: {
    type: Number,
    default: 0,
    min: 0
  },
  Audio_discription: {
    type: String
  },
  Audio_price: {
    type: Number,
    default: 0
  },
  
  // Video fields
  Video_minute: {
    type: Number,
    default: 0,
    min: 0
  },
  Video_Schedule: {
    type: Number,
    default: 0,
    min: 0
  },
  Video_discription: {
    type: String
  },
  Video_price: {
    type: Number,
    default: 0
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

