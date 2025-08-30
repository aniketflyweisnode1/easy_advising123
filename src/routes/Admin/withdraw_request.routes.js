const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { createWithdrawRequest, updateWithdrawRequest, getWithdrawRequestById, getAllWithdrawRequests } = require('../../controller/withdraw_request.controller');

// Create withdraw request 2025-07-15
router.post('/create', auth, createWithdrawRequest);
// Update withdraw request 2025-07-15
router.put('/update', auth, updateWithdrawRequest);
// Get withdraw request by ID 2025-07-15
router.get('/getById/:request_id', getWithdrawRequestById);
// Get all withdraw requests 2025-07-15
router.get('/getAll', getAllWithdrawRequests);

module.exports = router; 