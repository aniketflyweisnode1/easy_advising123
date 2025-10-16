const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const chooseTimeSlotSchema = new mongoose.Schema({
  choose_Time_slot_id: {
    type: Number,
    unique: true
  },
  choose_day_Advisor_id: {
    type: Number,
    ref: 'choose_day_Advisor',
    required: true
  },
  advisor_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  Time_slot: [{
    type: String,
    required: true
  }],
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
chooseTimeSlotSchema.plugin(AutoIncrement, { 
  inc_field: 'choose_Time_slot_id',
  start_seq: 1
});

// Index for better performance
chooseTimeSlotSchema.index({ advisor_id: 1 });
chooseTimeSlotSchema.index({ choose_day_Advisor_id: 1 });
chooseTimeSlotSchema.index({ choose_Time_slot_id: 1 });

module.exports = mongoose.model('choose_Time_slot', chooseTimeSlotSchema);
