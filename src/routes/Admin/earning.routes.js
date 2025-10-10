const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { getAdviserEarning, filterByCallTypeEarning, filterByCategoryEarning, getEarningsByAdvisorId } = require('../../controller/earning.controller');

// Get all adviser earnings 2025-07-15
router.get('/getAdviserEarning', auth, getAdviserEarning);
// Get earnings by advisor ID
router.get('/advisor/:advisor_id', auth, getEarningsByAdvisorId);
// Filter earnings by call type 2025-07-15
router.get('/filterbycalltype_earning/:call_type', auth, filterByCallTypeEarning);
// Filter earnings by call type with date range 2025-01-15
router.get('/filterbycalltype_earning/:call_type/:date_from/:date_to', auth, filterByCallTypeEarning);
// Filter earnings by category 2025-01-15
router.get('/filterbycategory_earning/:category_id', auth, filterByCategoryEarning);
// Filter earnings by category with date range 2025-01-15
router.get('/filterbycategory_earning/:category_id/:date_from/:date_to', auth, filterByCategoryEarning);


module.exports = router; 