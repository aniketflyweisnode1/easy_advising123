const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createDeleteAccount,
  updateDeleteAccount,
  getDeleteAccountById,
  getAllDeleteAccounts,
  updateDeleteStatus,
  activateAccount
} = require('../../controller/delete.account.controller');

// Create delete account request 2025-07-16
router.post('/create', auth, createDeleteAccount);
// Update delete account request 2025-07-16
router.put('/update', auth, updateDeleteAccount);
// Update delete status and block user if approved 2025-07-16
// Get delete account request by ID 2025-07-16
router.get('/getById/:Daccountid_id', auth,  getDeleteAccountById);
// Get all delete account requests 2025-07-16
router.get('/getAll', getAllDeleteAccounts);
// update delete account status 2025-07-16
router.put('/update_delete_status', auth, updateDeleteStatus);
// Activate account and set user status to active 2025-07-16
router.post('/activate_account', auth,  activateAccount);

module.exports = router; 