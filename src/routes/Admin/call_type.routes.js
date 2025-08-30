const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { createCallType, updateCallType, getCallTypeById, getAllCallTypes } = require('../../controller/call_type.controller');

// Create call type 2025-07-15
router.post('/create', auth, createCallType);
// Update call type 2025-07-15
router.put('/update', auth, updateCallType);
// Get call type by ID 2025-07-15
router.get('/getById/:call_type_id', auth, getCallTypeById);
// Get all call types 2025-07-15
router.get('/getAll', auth, getAllCallTypes);

module.exports = router; 