const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createFaqReply,
  updateFaqReply,
  getFaqReplyById,
  getAllFaqReplies
} = require('../../controller/faq_Reply.controller');

// Create FAQ reply 2025-07-16
router.post('/create', auth, createFaqReply);
// Update FAQ reply 2025-07-16
router.put('/update', auth, updateFaqReply);
// Get FAQ reply by ID 2025-07-16
router.get('/getById/:faqreply_id', auth, getFaqReplyById);
// Get all FAQ replies 2025-07-16
router.get('/getAll', getAllFaqReplies);

module.exports = router; 