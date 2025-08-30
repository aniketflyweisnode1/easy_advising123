const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const skillSchema = new mongoose.Schema({
  skill_id: {
    type: Number,
    unique: true
  },
  skill_name: {
    type: String,
    required: true
  },
  use_count: {
    type: Number,
    default: 0
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

skillSchema.plugin(AutoIncrement, { inc_field: 'skill_id', start_seq: 1 });

module.exports = mongoose.model('Skill', skillSchema); 