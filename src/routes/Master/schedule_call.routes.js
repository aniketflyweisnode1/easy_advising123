const express = require('express');
const router = express.Router();
const { auth } = require('../../utils/jwtUtils.js');
const {
    createScheduleCall,
    updateScheduleCall,
    getScheduleCallById,
    getAllScheduleCalls,
    getScheduleCallsByCreator,
    getScheduleCallsByAdvisor
} = require('../../controller/schedule_call.controller.js');

// Create  2025-07-14
router.post('/create', auth, createScheduleCall);
// Update 2025-07-14
router.put('/update', auth, updateScheduleCall);
// Get by ID 2025-07-14
router.get('/getById/:schedule_id', auth, getScheduleCallById);
// Get all 2025-07-14
router.get('/getAll', auth, getAllScheduleCalls);
// Get by creator 2025-07-14
router.get('/getByCreated', auth, getScheduleCallsByCreator);
// Get by advisor 2025-07-14
router.get('/getByAdvisor/:advisor_id', auth, getScheduleCallsByAdvisor);

module.exports = router; 