const express = require('express');
const router = express.Router();
const { createReasonSummary, updateReasonSummary, getReasonSummaryById, getAllReasonSummaries, getReasonSummariesByAdviserId, getReasonByScheduleCallId } = require('../../controller/reason_summary.controller');
const { auth } = require('../../middleware/authMiddleware');

router.post('/', auth, createReasonSummary);
router.put('/', auth, updateReasonSummary);
router.get('/:summary_id', auth, getReasonSummaryById);
router.get('/', auth, getAllReasonSummaries);
router.get('/adviser/:adviser_id', auth, getReasonSummariesByAdviserId);
// Get reason by schedule_call_id
router.get('/schedule/:schedule_call_id', auth, getReasonByScheduleCallId);

module.exports = router; 