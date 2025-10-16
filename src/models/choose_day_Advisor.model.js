const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const chooseDayAdvisorSchema = new mongoose.Schema({
  choose_day_Advisor_id: {
    type: Number,
    unique: true
  },
  DayName: {
    type: String,
    required: true,
    trim: true
  },
  Status: {
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
    ref: 'User',
    default: null
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We're using custom timestamp fields
});

// Add auto-increment plugin
chooseDayAdvisorSchema.plugin(AutoIncrement, { 
  inc_field: 'choose_day_Advisor_id',
  start_seq: 1
});

// Index for better performance
chooseDayAdvisorSchema.index({ choose_day_Advisor_id: 1 });

module.exports = mongoose.model('choose_day_Advisor', chooseDayAdvisorSchema);
