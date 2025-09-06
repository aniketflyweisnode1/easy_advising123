const express = require('express');
const router = express.Router();
const { createReasonSummary, updateReasonSummary, getReasonSummaryById, getAllReasonSummaries, getReasonSummariesByAdviserId, getReasonByScheduleCallId } = require('../../controller/reason_summary.controller');
const { auth } = require('../../middleware/authMiddleware');

router.post('/create', auth, createReasonSummary);
router.put('/update', auth, updateReasonSummary);
router.get('/getbyid/:summary_id', auth, getReasonSummaryById);
router.get('/getall', auth, getAllReasonSummaries);
router.get('/getbyadviser/:adviser_id', auth, getReasonSummariesByAdviserId);
// Get reason by schedule_call_id
router.get('/getbyschedule/:schedule_call_id', auth, getReasonByScheduleCallId);

module.exports = router; 