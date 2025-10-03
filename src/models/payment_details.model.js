const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const PaymentDetailsSchema = new mongoose.Schema({
  PaymentDetails_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  appToapp: {
    type: Boolean,
    default: false
  },
  UPI_id: {
    type: String,
    default: null
  },
  Bankname: {
    type: String,
    default: null
  },
  accountno: {
    type: String,
    default: null
  },
  ifsccode: {
    type: String,
    default: null
  },
  branchname: {
    type: String,
    default: null
  },
  ChackNo: {
    type: String,
    default: null
  },
  QRpay: {
    type: String,
    default: null
  },
  Status: {
    type: Boolean,
    default: true
  },
  CreateBy: {
    type: Number,
    ref: 'User',
    required: true
  },
  CreateAt: {
    type: Date,
    default: Date.now
  },
  UpdatedBy: {
    type: Number,
    ref: 'User',
    default: null
  },
  UpdatedAt: {
    type: Date,
    default: null
  }
}, {
  collection: 'payment_details'
});

PaymentDetailsSchema.plugin(AutoIncrement, { inc_field: 'PaymentDetails_id', start_seq: 1 });

module.exports = mongoose.model('PaymentDetails', PaymentDetailsSchema);

