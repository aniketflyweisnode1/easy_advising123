const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const reasonSummarySchema = new mongoose.Schema({
  summary_id: {
    type: Number,
    unique: true
  },
  schedule_call_id: {
    type: Number,
    ref: 'ScheduleCall',
    required: true
  },
  adviser_name_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  user_name_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  category_id: {
    type: Number,
    ref: 'Category',
   
  },
  subCategory_id: {
    type: Number,
    ref: 'Subcategory',
    
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  summary: {
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
});

reasonSummarySchema.plugin(AutoIncrement, { inc_field: 'summary_id', start_seq: 1 });

module.exports = mongoose.model('ReasonSummary', reasonSummarySchema); 