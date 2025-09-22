const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { getAdviserById, updateUser } = require('../../controller/userController');

// Get full advisor details by ID (admin) 2025-07-15
router.get('/getAdviserById/:advisor_id', auth, getAdviserById);

// Update user by ID (admin) - can update all user information
router.put('/updateUser', auth, updateUser);

module.exports = router; 