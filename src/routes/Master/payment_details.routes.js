const express = require('express');
const router = express.Router();
const {
  createPaymentDetails,
  updatePaymentDetails,
  getPaymentDetailsById,
  getAllPaymentDetails,
  getPaymentDetailsByAuth,
  deletePaymentDetails
} = require('../../controller/payment_details.controller');
const { auth } = require('../../utils/jwtUtils');

// Create payment details with authentication
router.post('/create', auth, createPaymentDetails);

// Update payment details with authentication
router.put('/update', auth, updatePaymentDetails);

// Get payment details by authenticated user (must come before /:PaymentDetails_id)
router.get('/auth/user', auth, getPaymentDetailsByAuth);

// Delete payment details with authentication
router.delete('/delete/:PaymentDetails_id', auth, deletePaymentDetails);

// Get payment details by ID with authentication
router.get('/:PaymentDetails_id', auth, getPaymentDetailsById);

// Get all payment details (no authentication, should be last)
router.get('/', getAllPaymentDetails);

module.exports = router;

