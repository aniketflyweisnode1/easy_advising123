const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createTermsAndCondition,
  updateTermsAndCondition,
  getTermsAndConditionById,
  getAllTermsAndConditions,
  deleteTermsAndCondition
} = require('../../controller/terms_and_condition.controller');

// Create with auth
router.post('/', auth, createTermsAndCondition);
// Update with auth
router.put('/', auth, updateTermsAndCondition);
// Get by id with auth
router.get('/:id', auth, getTermsAndConditionById);
// Get all
router.get('/', getAllTermsAndConditions);
// Delete
router.delete('/:id', auth, deleteTermsAndCondition);

module.exports = router;


