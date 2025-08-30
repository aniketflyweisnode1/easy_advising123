const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const companySchema = new mongoose.Schema({
  company_id: {
    type: Number,
    unique: true
  },
  company_name: {
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

companySchema.plugin(AutoIncrement, { inc_field: 'company_id' });

const Company = mongoose.model('Company', companySchema);

module.exports = Company; 