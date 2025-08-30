const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createTicketReply,
  updateTicketReply,
  getTicketReplyById,
  getAllTicketReplies
} = require('../../controller/ticket_Reply.controller');

// Create ticket reply 2025-07-16
router.post('/create', auth, createTicketReply);
// Update ticket reply 2025-07-16
router.put('/update', auth, updateTicketReply);
// Get ticket reply by ID 2025-07-16
router.get('/getById/:reply_id', auth, getTicketReplyById);
// Get all ticket replies 2025-07-16
router.get('/getAll', getAllTicketReplies);

module.exports = router; 