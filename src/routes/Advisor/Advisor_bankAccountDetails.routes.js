const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createBankAccountDetails,
  updateBankAccountDetails,
  getBankAccountDetailsByAuth,
  getAllBankAccountDetails,
  getBankAccountDetailsById
} = require('../../controller/advisor_bankAccountDetails.controller');

// Create bank account details (auth required) 2025-07-17
router.post('/create', auth, createBankAccountDetails);
// Update bank account details (auth required) 2025-07-17
router.put('/update', auth, updateBankAccountDetails);
// Get all bank account details for logged-in advisor (auth required) 2025-07-17
router.get('/me', auth, getBankAccountDetailsByAuth);
// Get all bank account details (admin use, no auth) 2025-07-17
router.get('/all', getAllBankAccountDetails);
// Get bank account details by id (no auth) 2025-07-17
router.get('/byid/:AccountDetails_id', getBankAccountDetailsById);

module.exports = router; 