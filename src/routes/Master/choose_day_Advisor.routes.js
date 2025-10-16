const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createChooseDayAdvisor,
  updateChooseDayAdvisor,
  getChooseDayAdvisorById,
  getAllChooseDayAdvisors,
  getChooseDayAdvisorsByAuth,
  deleteChooseDayAdvisor
} = require('../../controller/choose_day_Advisor.controller');

// Create choose day advisor (with auth)
router.post('/create', auth, createChooseDayAdvisor);

// Update choose day advisor (with auth)
router.put('/update/:choose_day_Advisor_id', auth, updateChooseDayAdvisor);

// Get choose day advisor by ID (with auth)
router.get('/get/:choose_day_Advisor_id', auth, getChooseDayAdvisorById);

// Get all choose day advisors
router.get('/getall', getAllChooseDayAdvisors);

// Get choose day advisors by authenticated user (with auth)
router.get('/getbyauth', auth, getChooseDayAdvisorsByAuth);

// Delete choose day advisor (with auth)
router.delete('/delete/:choose_day_Advisor_id', auth, deleteChooseDayAdvisor);

module.exports = router;
