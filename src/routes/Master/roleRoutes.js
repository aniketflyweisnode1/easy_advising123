const express = require('express');
const router = express.Router();
const { 
  createRole, 
  updateRole, 
  getRoleById, 
  getAllRoles, 
  getUsersByRoleId 
} = require('../../controller/roleController');
const { auth } = require('../../middleware/authMiddleware');

// Create role (with auth)
router.post('/', auth, createRole);

// Update role (with auth)
router.put('/:role_id', auth, updateRole);

// Get role by ID (public)
router.get('/:role_id', getRoleById);

// Get all roles (public)
router.get('/', getAllRoles);

// Get users by role ID (with auth)
router.get('/:role_id/users', auth, getUsersByRoleId);

module.exports = router; 