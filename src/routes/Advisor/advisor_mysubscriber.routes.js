const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createMySubscriber,
  updateMySubscriber,
  getMySubscriberById,
  getAllMySubscribers,
  deleteMySubscriber,
  Subscribergroupbyplanname
} = require('../../controller/advisor_mysubscriber.controller');

// Create with auth
router.post('/', auth, createMySubscriber);
// Update with auth
router.put('/', auth, updateMySubscriber);
// Get by id with auth
router.get('/:id', auth, getMySubscriberById);
// Get all
router.get('/', getAllMySubscribers);
// Delete
router.delete('/:id', auth, deleteMySubscriber);
// Group by plan name
router.get('/group/by-plan-name', Subscribergroupbyplanname);

module.exports = router;


