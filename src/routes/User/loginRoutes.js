const express = require('express');
const router = express.Router();
const { login, verifyOTP, adminLogin } = require('../../controller/loginController');
const { getAdminDashboard } = require('../../controller/userController');
const { auth } = require('../../middleware/authMiddleware');

// Route to initiate login/registration process
router.post('/login', login);

// Route to verify OTP and complete login/registration
router.post('/verify-otp', verifyOTP);

// Admin login route
router.post('/admin_login', adminLogin);

// Admin dashboard route
router.get('/admin-dashboard', auth, getAdminDashboard);

module.exports = router; 