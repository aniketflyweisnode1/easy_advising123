const express = require('express');
const router = express.Router();
const { 
  createRole, 
  updateRole, 
  getRoleById, 
  getAllRoles, 
  getUsersByRoleId,
  updateRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getAvailablePermissions,
  checkUserPermission
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

// Permission management routes
// Update role permissions (with auth)
router.put('/:role_id/permissions', auth, updateRolePermissions);

// Add permission to role (with auth)
router.post('/:role_id/permissions', auth, addPermissionToRole);

// Remove permission from role (with auth)
router.delete('/:role_id/permissions', auth, removePermissionFromRole);

// Get available permissions/modules (public)
router.get('/permissions/available', getAvailablePermissions);

// Check user permission (with auth)
router.get('/users/:user_id/permission', auth, checkUserPermission);

module.exports = router; 