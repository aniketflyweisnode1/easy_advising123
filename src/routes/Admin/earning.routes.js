const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { getAdviserEarning, filterByCallTypeEarning } = require('../../controller/earning.controller');

// Get all adviser earnings 2025-07-15
router.get('/getAdviserEarning', auth, getAdviserEarning);
// Filter earnings by call type 2025-07-15
router.get('/filterbycalltype_earning/:call_type', auth, filterByCallTypeEarning);

module.exports = router; 