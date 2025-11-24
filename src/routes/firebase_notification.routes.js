const express = require('express');
const router = express.Router();
const { auth } = require('../utils/jwtUtils');
const {
  sendFirebaseNotificationToAuth,
  sendFirebaseNotificationToUser,
  sendFirebaseNotificationToMultipleUsers,
  sendFirebaseNotificationToAllUsers
} = require('../controller/firebase_notification.controller');

/**
 * Send Firebase notification to authenticated user
 * GET firebase_token from database for logged-in user
 * POST /api/firebase-notification/send-to-auth
 */
router.post('/send-to-auth', auth, sendFirebaseNotificationToAuth);

/**
 * Send Firebase notification to specific user by user_id
 * GET firebase_token from database
 * POST /api/firebase-notification/send-to-user/:user_id
 */
router.post('/send-to-user/:user_id', auth, sendFirebaseNotificationToUser);

/**
 * Send Firebase notification to multiple users by user_ids
 * GET firebase_tokens from database
 * POST /api/firebase-notification/send-to-multiple
 */
router.post('/send-to-multiple', auth, sendFirebaseNotificationToMultipleUsers);

/**
 * Send Firebase notification to all users with firebase_token
 * GET firebase_tokens from database
 * POST /api/firebase-notification/send-to-all
 */
router.post('/send-to-all', auth, sendFirebaseNotificationToAllUsers);

module.exports = router;

