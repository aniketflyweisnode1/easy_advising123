const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { getAdvisorList, updateAdvisorRate, getAdvisorRatesById } = require('../../controller/userController');
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

// Advisor instant rate update and fetch
router.put('/Advisor/call/rates', auth, updateAdvisorRate);
router.get('/rates/:advisor_id', getAdvisorRatesById);

module.exports = router; 