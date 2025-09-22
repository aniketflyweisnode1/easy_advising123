const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const scheduleCallSchema = new mongoose.Schema({
  schedule_id: {
    type: Number,
    unique: true,
  },
  advisor_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  skills_id: {
    type: Number,
    ref: 'Skill',
    required: true
  },
  call_type_id: {
    type: Number,
    ref: 'CallType',
    required: true
  },
  schedule_type: {
    type: String,
    enum: ['Schedule', 'Instant'],
    default: 'Schedule',
    required: true
  },
  package_Subscription_id: {
    type: Number,
    ref: 'PackageSubscription',
    default: null
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  callStatus : {
    type: String,
    enum: ['Panding', 'Accepted', 'Completed', "Cancelled", "Upcoming", "Ongoing", "Not Answered"],
    default : 'Panding',
    required: true
  },
  approval_status: {
    type: Boolean,
    default: false
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
  },
  summary_status: {
    type: Number,
    default: 0
  },
  summary_type: {
    type: String,
    enum: ["Summary", "Reason", "Cancel", "Succeeded"],
    default : "Summary"
  },
  perminRate: {
    type: Number
  },
  Call_duration: {
    type: Number
  },
  Amount: {
    type: Number
  }
}, {
  timestamps: false
});

scheduleCallSchema.plugin(AutoIncrement, {
  inc_field: 'schedule_id',
  start_seq: 1
});

scheduleCallSchema.pre('save', function(next) {
  this.updated_at = new Date();
  if (this.perminRate && this.Call_duration) {
    this.Amount = this.perminRate * this.Call_duration;
  }
  next();
});

scheduleCallSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('ScheduleCall', scheduleCallSchema); 