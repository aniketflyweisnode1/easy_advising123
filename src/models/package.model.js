const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const packageSchema = new mongoose.Schema({
  package_id: {
    type: Number,
    unique: true
  },
  packege_name: {
    type: String,
    required: true
  },

  //Chat
  Chat_price: {
    type: Number
  },
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

  //Audio
  Audio_price: {
    type: Number
  },
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

  //video
  Video_price: {
    type: Number
  },
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