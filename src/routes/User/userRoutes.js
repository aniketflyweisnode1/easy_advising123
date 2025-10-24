const express = require('express');
const router = express.Router();
const { registerUser,updateUserOnlineStatus, getProfile, updateProfile, logout, getUsersByRoleId, getUserFullDetails, getAllUserFullDetails, deleteUser, updateUserStatus, getAllEmployees, updateUser, updateVendorRates, updateVendorSchedule, getVendorCallStatistics } = require('../../controller/userController');
const { auth } = require('../../middleware/authMiddleware');

router.post('/register', registerUser);
router.get('/profile', auth, getProfile);
router.put('/update-profile', auth, updateProfile);
router.post('/logout', auth, logout);
// Created: 2025-07-14
router.get('/byRole/:role_id', auth, getUsersByRoleId);
// Created: 2025-07-14
router.get('/getuserfulldetails/:user_id', auth, getUserFullDetails);
// Get all users full details
router.get('/getalluserfulldetails', auth, getAllUserFullDetails);

// Delete user by admin
router.delete('/delete/:user_id', auth, deleteUser);
// Update user status and login permission status
router.patch('/Userstatus', auth, updateUserStatus);

// Update user online status
router.patch('/user-online', auth, updateUserOnlineStatus);

// Get all employees (excluding role_id 1, 2, 3)
router.get('/getallemployees', getAllEmployees);

// Update user (Admin function)
router.put('/update', auth, updateUser);

// Update vendor rates and packages
router.put('/update-vendor-rates', auth, updateVendorRates);

// Update vendor schedule and availability
router.put('/updatevendordaytimeschedule', auth, updateVendorSchedule);

// Get vendor call statistics
router.get('/vendor-call-statistics/:vendor_id', auth, getVendorCallStatistics);

module.exports = router; 