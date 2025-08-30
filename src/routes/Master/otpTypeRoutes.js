const express = require('express');
const router = express.Router();
const { 
  createOTPType, 
  updateOTPType, 
  getOTPTypeById, 
  getAllOTPTypes 
} = require('../../controller/otpTypeController');
const { auth } = require('../../middleware/authMiddleware');

// Create OTP type (with auth)
router.post('/', auth, createOTPType);

// Update OTP type (with auth)
router.put('/:otptype_id', auth, updateOTPType);

// Get OTP type by ID (public)
router.get('/:otptype_id', getOTPTypeById);

// Get all OTP types (public)
router.get('/', getAllOTPTypes);

module.exports = router; 