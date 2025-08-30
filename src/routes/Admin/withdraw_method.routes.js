const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { createWithdrawMethod, updateWithdrawMethod, getWithdrawMethodById, getAllWithdrawMethods } = require('../../controller/withdraw_method.controller');

// Create withdraw method 2025-07-15
router.post('/create', auth, createWithdrawMethod);
// Update withdraw method 2025-07-15
router.put('/update', auth, updateWithdrawMethod);
// Get withdraw method by ID 2025-07-15
router.get('/getById/:method_id', getWithdrawMethodById);
// Get all withdraw methods 2025-07-15
router.get('/getAll', getAllWithdrawMethods);

module.exports = router; 