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
  price: {
    type: Number
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