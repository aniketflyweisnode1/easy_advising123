const express = require('express');
const router = express.Router();
const { auth } = require('../../utils/jwtUtils.js');
const {
    createScheduleCall,
    updateScheduleCall,
    getScheduleCallById,
    getAllScheduleCalls,
    getScheduleCallsByCreator,
    getScheduleCallsByAdvisor,
    getScheduleCallsByType,
    getSchedulecallByuserAuth,
    getSchedulecallByAdvisorAuth,
    getCallByadvisorId,
    endCall
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
// Get by schedule type (Schedule/Instant) 2025-01-15
router.get('/getByType/:schedule_type', auth, getScheduleCallsByType);
// Get by authenticated user (creator) 2025-01-15
router.get('/getByUserAuth', auth, getSchedulecallByuserAuth);
// Get by authenticated advisor 2025-01-15
router.get('/getByAdvisorAuth', auth, getSchedulecallByAdvisorAuth);
// Get pending calls by advisor ID (date, time, advisor_id, schedule_id only) 2025-01-15
router.get('/getCallByadvisorId/:advisor_id', auth, getCallByadvisorId);
// End call and process payment 2025-07-14
router.post('/endcall', auth, endCall);

module.exports = router; 