const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const TransactionSchema = new mongoose.Schema({
  TRANSACTION_ID: { type: Number, unique: true },
  user_id: { type: Number, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  payment_method: { type: String, required: true },
  transactionType: { type: String, enum: ['registration_fee', 'deposit', 'withdraw', 'RechargeByAdmin', 'Call', 'Package_Buy', 'Recharge', 'Refund'], required: true },
  transaction_date: { type: Date, default: Date.now },
  reference_number: { type: String},
  CGST: { type: Number, default: 0, min: 0 }, // Central Goods and Services Tax
  SGST: { type: Number, default: 0, min: 0 }, // State Goods and Services Tax
  TotalGST: { type: Number, default: 0, min: 0 }, // Total GST (CGST + SGST)
  created_at: { type: Date, default: Date.now },
  created_by: { type: Number, ref: 'User', required: true },
  updated_at: { type: Date },
  bank_id: { type: Number, ref: 'AdvisorBankAccountDetails' },
  PaymentDetails_id: { type: Number, ref: 'PaymentDetails', default: null },
  isDownloaded: { type: Boolean, default: false },
  fileDownlodedPath: { type: String, default: null },
}, {
  collection: 'transactions',
});

TransactionSchema.plugin(AutoIncrement, { inc_field: 'TRANSACTION_ID' });

module.exports = mongoose.model('Transaction', TransactionSchema); 