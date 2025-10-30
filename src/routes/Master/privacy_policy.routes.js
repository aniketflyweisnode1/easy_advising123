const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createPrivacyPolicy,
  updatePrivacyPolicy,
  getPrivacyPolicyById,
  getAllPrivacyPolicies,
  deletePrivacyPolicy
} = require('../../controller/privacy_policy.controller');

// Create with auth
router.post('/', auth, createPrivacyPolicy);
// Update with auth
router.put('/', auth, updatePrivacyPolicy);
// Get by id with auth
router.get('/:id', auth, getPrivacyPolicyById);
// Get all
router.get('/', getAllPrivacyPolicies);
// Delete
router.delete('/:id', auth, deletePrivacyPolicy);

module.exports = router;


