const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const { generateTicketNo } = require('../utils/otpUtils');

const ticketStatusEnum = ["Panding", "Open", "process", "closed", "assign"];

const ticketsSchema = new mongoose.Schema({
  ticket_id: {
    type: Number,
    unique: true
  },
  ticket_no: {
    type: String,
    unique: true,
    default: generateTicketNo
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  ticket_status: {
    type: String,
    enum: ticketStatusEnum,
    default: "Panding"
  },
  ticket_Question: {
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
}, {
  timestamps: false
});

ticketsSchema.plugin(AutoIncrement, {
  inc_field: 'ticket_id',
  start_seq: 1
});

ticketsSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

ticketsSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('Tickets', ticketsSchema); 