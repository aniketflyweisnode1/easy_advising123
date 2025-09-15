const express = require('express');
const router = express.Router();
const { auth } = require('../../utils/jwtUtils.js');
const {
    createPackageSubscription,
    updatePackageSubscription,
    getPackageSubscriptionById,
    getPackageSubscriptionsBySubscribeBy,
    getPackageSubscriptionsByPackageId,
    getAllPackageSubscriptions,
    getAllActivedPackageSubscriptions,
    updateSubscriptionStatus,
    getSubscriptionsByStatus
} = require('../../controller/package_subscription.controller.js');

// create by data 2025-07-14
router.post('/create', auth, createPackageSubscription);
// create by data 2025-07-14
router.put('/update', auth, updatePackageSubscription);
// create by data 2025-07-14
router.get('/getById/:PkSubscription_id', auth, getPackageSubscriptionById);
// create by data 2025-07-14
router.get('/getBySubscribeBy/:subscribe_by', auth, getPackageSubscriptionsBySubscribeBy);
// create by data 2025-07-14
router.get('/getByPackageId/:package_id', auth, getPackageSubscriptionsByPackageId);
// create by data 2025-07-14
router.get('/getAll', auth, getAllPackageSubscriptions);
// create by data 2025-07-14
router.get('/getAllActived', auth, getAllActivedPackageSubscriptions);

// Update subscription status 2025-07-15
router.patch('/updateStatus', auth, updateSubscriptionStatus);
// Get subscriptions by status 2025-07-15
router.get('/getByStatus/:status', auth, getSubscriptionsByStatus);

module.exports = router; 