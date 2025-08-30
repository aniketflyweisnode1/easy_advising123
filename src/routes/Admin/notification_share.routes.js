const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createNotificationShare,
  updateNotificationShare,
  getNotificationShareById,
  getAllNotificationShares
} = require('../../controller/notification_share.controller');

// Create notification  2025-07-16
router.post('/create', auth, createNotificationShare);
// Update notification share 2025-07-16
router.put('/update', auth, updateNotificationShare);
// Get notification share by ID 2025-07-16
router.get('/getById/:share_id', auth, getNotificationShareById);
// Get all notification shares 2025-07-16
router.get('/getAll', getAllNotificationShares);

module.exports = router; 