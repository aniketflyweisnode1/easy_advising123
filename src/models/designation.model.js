const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const designationSchema = new mongoose.Schema({
  designation_id: {
    type: Number,
    unique: true
  },
  Designation_name: {
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

designationSchema.plugin(AutoIncrement, { inc_field: 'designation_id' });

const Designation = mongoose.model('Designation', designationSchema);

module.exports = Designation; 