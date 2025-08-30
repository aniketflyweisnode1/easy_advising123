const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const advisorBankAccountDetailsSchema = new mongoose.Schema({
  AccountDetails_id: {
    type: Number,
    unique: true
  },
  holdername: {
    type: String,
    required: true
  },
  account_no: {
    type: String,
    required: true
  },
  bank_name: {
    type: String,
    required: true
  },
  ifsc_code: {
    type: String,
    required: true
  },
  ISFC_code: {
    type: String
  },
  bankaddress: {
    type: String
  },
  status: {
    type: Number,
    default: 1 // 1 = active, 0 = inactive
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
advisorBankAccountDetailsSchema.plugin(AutoIncrement, { inc_field: 'AccountDetails_id', start_seq: 1 });

module.exports = mongoose.model('AdvisorBankAccountDetails', advisorBankAccountDetailsSchema); 