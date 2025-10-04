const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { getAdvisorList } = require('../../controller/userController');
const { advisorDashboard } = require('../../controller/advisor_dashboard.controller');
const { getAdvisorNotifications } = require('../../controller/advisor_notification.controller');
const { advisorWallet } = require('../../controller/advisor_wall.controller');

// Get users by role (default: advisors role_id = 2) 2025-07-15
router.get('/getAdvisorList', auth, getAdvisorList);

// Advisor dashboard API 2025-07-17
router.get('/dashboard', auth, advisorDashboard);

// Advisor notification list API 2025-07-17
router.get('/notifications', auth, getAdvisorNotifications);

// Advisor wall API 2025-07-17
router.get('/wallet', auth, advisorWallet);

module.exports = router; 