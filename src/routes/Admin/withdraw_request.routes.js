const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { createWithdrawRequest, updateWithdrawRequest, getWithdrawRequestById, getAllWithdrawRequests, getWithdrawRequestsByAuth } = require('../../controller/withdraw_request.controller');

// Create withdraw request 2025-07-15
router.post('/create', auth, createWithdrawRequest);
// Update withdraw request 2025-07-15
router.put('/update', auth, updateWithdrawRequest);
// Get withdraw request by ID 2025-07-15
router.get('/getById/:request_id', getWithdrawRequestById);
// Get all withdraw requests 2025-07-15
router.get('/getAll', getAllWithdrawRequests);
// Get withdraw requests by authenticated user 2025-07-15
router.get('/getByAuth', auth, getWithdrawRequestsByAuth);

// Get withdraw requests with filters as URL parameters
// Basic route with last_status only
router.get('/getAll/:last_status', getAllWithdrawRequests);

// Route with last_status and date range
router.get('/getAll/:last_status/:date_from/:date_to', getAllWithdrawRequests);

module.exports = router; 