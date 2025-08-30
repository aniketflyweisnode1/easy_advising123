const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const pageManagementSchema = new mongoose.Schema({
  pageMg_id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  ToBoth: [{
    type: Number,
    ref: 'User'
  }],
  ToRole_id: {
    type: Number,
    ref: 'Role'
  },
  postedby: {
    type: Number,
    ref: 'User'

  },
  content: {
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
}, { timestamps: false });

pageManagementSchema.plugin(AutoIncrement, { inc_field: 'pageMg_id', start_seq: 1 });

module.exports = mongoose.model('PageManagement', pageManagementSchema); 