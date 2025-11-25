const express = require('express');
const router = express.Router();
const { auth } = require('../utils/jwtUtils');
const {
  sendFirebaseNotificationToAuth,
  sendFirebaseNotificationToUser,
  sendFirebaseNotificationToMultipleUsers,
  sendFirebaseNotificationToAllUsers
} = require('../controller/firebase_notification.controller');


router.post('/send-to-auth', auth, sendFirebaseNotificationToAuth);
router.post('/send-to-user/:user_id', sendFirebaseNotificationToUser);
router.post('/send-to-multiple', auth, sendFirebaseNotificationToMultipleUsers);
router.post('/send-to-all', auth, sendFirebaseNotificationToAllUsers);

module.exports = router;

