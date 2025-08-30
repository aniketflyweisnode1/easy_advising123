const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createFaq,
  updateFaq,
  getFaqById,
  getAllFaqs
} = require('../../controller/faq.controller');

// Create FAQ 2025-07-16
router.post('/create', auth, createFaq);
// Update FAQ 2025-07-16
router.put('/update', auth, updateFaq);
// Get FAQ by ID 2025-07-16
router.get('/getById/:faq_id', auth, getFaqById);
// Get all FAQs 2025-07-16
router.get('/getAll', getAllFaqs);

module.exports = router; 