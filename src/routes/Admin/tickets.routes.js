const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createTicket,
  updateTicket,
  getTicketById,
  getAllTickets
} = require('../../controller/tickets.controller');

// Create ticket 2025-07-16
router.post('/create', auth, createTicket);
// Update ticket 2025-07-16
router.put('/update', auth, updateTicket);
// Get ticket by ID 2025-07-16
router.get('/getById/:ticket_id', auth, getTicketById);
// Get all tickets 2025-07-16
router.get('/getAll', getAllTickets);

// Get tickets with date filters as URL parameters
// Route with date range
router.get('/getAll/:date_from/:date_to', getAllTickets);

module.exports = router; 