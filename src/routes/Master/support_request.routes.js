const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createSupportRequest,
  updateSupportRequest,
  getSupportRequestById,
  getAllSupportRequests,
  deleteSupportRequest,
  getSupportRequestsByAuth
} = require('../../controller/support_request.controller.js');

// Get Support Requests by Authenticated User (must be before /:id route)
router.get('/getByAuth', auth, getSupportRequestsByAuth);

// Create with auth
router.post('/create', auth, createSupportRequest);

// Update with auth
router.put('/update', auth, updateSupportRequest);

// Get by id with auth
router.get('/getById/:id', auth, getSupportRequestById);

// Get all
router.get('/getAll', getAllSupportRequests);

// Delete
router.delete('/delete/:id', auth, deleteSupportRequest);

module.exports = router;

