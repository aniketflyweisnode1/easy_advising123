const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createChooseTimeSlot,
  updateChooseTimeSlot,
  getChooseTimeSlotById,
  getAllChooseTimeSlots,
  getChooseTimeSlotsByAuth,
  getChooseTimeSlotsByDayId,
  deleteChooseTimeSlot
} = require('../../controller/choose_Time_slot.controller');



// Create choose time slot (with auth)
router.post('/create', auth, createChooseTimeSlot);

// Update choose time slot (with auth)
router.put('/update/:choose_Time_slot_id', auth, updateChooseTimeSlot);

// Get choose time slot by ID (with auth)
router.get('/get/:choose_Time_slot_id', auth, getChooseTimeSlotById);

// Get all choose time slots
router.get('/getall', getAllChooseTimeSlots);

// Get choose time slots by day ID
router.get('/getbyday/:day_id', getChooseTimeSlotsByDayId);

// Get choose time slots by authenticated user (with auth)
router.get('/getbyauth', auth, getChooseTimeSlotsByAuth);

// Delete choose time slot (with auth)
router.delete('/delete/:choose_Time_slot_id', auth, deleteChooseTimeSlot);

module.exports = router;
