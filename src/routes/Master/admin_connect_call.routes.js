const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createAdminConnectCall,
  updateAdminConnectCall,
  getAdminConnectCallById,
  getAllAdminConnectCalls,
  deleteAdminConnectCall
} = require('../../controller/admin_connect_call.controller');

// Create with auth
router.post('/', auth, createAdminConnectCall);
// Update with auth
router.put('/', auth, updateAdminConnectCall);
// Get by id with auth
router.get('/:id', auth, getAdminConnectCallById);
// Get all
router.get('/', getAllAdminConnectCalls);
// Delete
router.delete('/:id', auth, deleteAdminConnectCall);

module.exports = router;


