const ReasonSummary = require('../models/reason_summary.model');
const ScheduleCall = require('../models/schedule_call.model');

// Create reason summary
const createReasonSummary = async (req, res) => {
  try {
    const data = req.body;
    if (req.user && req.user.user_id) {
      data.created_by = req.user.user_id;
    }
    // Auto-fill fields from schedule_call
    const schedule = await ScheduleCall.findOne({ schedule_id: data.schedule_call_id });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule call not found', status: 404 });
    }
    data.adviser_name_id = schedule.advisor_id;
    data.user_name_id = schedule.created_by;
    data.category_id = schedule.category_id;
    data.subCategory_id = schedule.subcategory_id;
    data.date = schedule.date;
    data.time = schedule.time;

    // Create the reason summary
    const reasonSummary = new ReasonSummary(data);
    await reasonSummary.save();

    // Update schedule_call model with summary_status = 1 and summary_type = "Reason"
    await ScheduleCall.findOneAndUpdate(
      { schedule_id: data.schedule_call_id },
      {
        summary_status: 1,
        summary_type: data.summary_type,
        updated_at: new Date()
      }
    );

    return res.status(201).json({ message: 'Reason summary created and schedule call updated', reasonSummary, status: 201 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Update reason summary
const updateReasonSummary = async (req, res) => {
  try {
    const { summary_id, ...updateData } = req.body;
    if (req.user && req.user.user_id) {
      updateData.updated_by = req.user.user_id;
      updateData.updated_at = new Date();
    }
    const reasonSummary = await ReasonSummary.findOneAndUpdate({ summary_id }, updateData, { new: true });
    if (!reasonSummary) {
      return res.status(404).json({ message: 'Reason summary not found', status: 404 });
    }
    return res.status(200).json({ message: 'Reason summary updated', reasonSummary, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get reason summary by ID
const getReasonSummaryById = async (req, res) => {
  try {
    const { summary_id } = req.params;
    const reasonSummary = await ReasonSummary.findOne({ summary_id });
    if (!reasonSummary) {
      return res.status(404).json({ message: 'Reason summary not found', status: 404 });
    }
    return res.status(200).json({ reasonSummary, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get all reason summaries
const getAllReasonSummaries = async (req, res) => {
  try {
    const reasonSummaries = await ReasonSummary.find();
    return res.status(200).json({ reasonSummaries, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get reason summaries by adviser ID
const getReasonSummariesByAdviserId = async (req, res) => {
  try {
    const { adviser_id } = req.params;
    const reasonSummaries = await ReasonSummary.find({ adviser_name_id: Number(adviser_id) });
    return res.status(200).json({ reasonSummaries, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get reason summary by schedule_call_id
const getReasonByScheduleCallId = async (req, res) => {
  try {
    const { schedule_call_id } = req.params;

    // Validate schedule_call_id
    if (!schedule_call_id) {
      return res.status(400).json({
        success: false,
        message: 'schedule_call_id is required'
      });
    }

    // Find reason summary by schedule_call_id
    const reasonSummary = await ReasonSummary.findOne({
      schedule_call_id: parseInt(schedule_call_id)
    });

    if (!reasonSummary) {
      return res.status(404).json({
        success: false,
        message: 'Reason summary not found for this schedule call'
      });
    }

    // Get user details for adviser and user
    const User = require('../models/User.model');
    const adviser = await User.findOne({ user_id: reasonSummary.adviser_name_id });
    const user = await User.findOne({ user_id: reasonSummary.user_name_id });

    // Get category and subcategory details
    const Category = require('../models/category.model');
    const Subcategory = require('../models/subcategory.model');

    const category = reasonSummary.category_id ?
      await Category.findOne({ category_id: reasonSummary.category_id }) : null;
    const subcategory = reasonSummary.subCategory_id ?
      await Subcategory.findOne({ subcategory_id: reasonSummary.subCategory_id }) : null;

    // Get schedule call details
    const scheduleCall = await ScheduleCall.findOne({
      schedule_id: reasonSummary.schedule_call_id
    });

    // Prepare response with populated data
    const response = {
      summary_id: reasonSummary.summary_id,
      schedule_call_id: reasonSummary.schedule_call_id,
      adviser: adviser ? {
        user_id: adviser.user_id,
        name: adviser.name,
        email: adviser.email,
        mobile: adviser.mobile
      } : null,
      user: user ? {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      } : null,
      category: category ? {
        category_id: category.category_id,
        category_name: category.category_name
      } : null,
      subcategory: subcategory ? {
        subcategory_id: subcategory.subcategory_id,
        subcategory_name: subcategory.subcategory_name
      } : null,
      date: reasonSummary.date,
      time: reasonSummary.time,
      summary: reasonSummary.summary,
      status: reasonSummary.status,
      created_by: reasonSummary.created_by,
      created_at: reasonSummary.created_at,
      updated_by: reasonSummary.updated_by,
      updated_at: reasonSummary.updated_at,
      schedule_call_details: scheduleCall ? {
        schedule_id: scheduleCall.schedule_id,
        callStatus: scheduleCall.callStatus,
        call_type: scheduleCall.call_type,
        duration: scheduleCall.duration,
        amount: scheduleCall.amount
      } : null
    };

    return res.status(200).json({
      success: true,
      message: 'Reason summary retrieved successfully',
      data: response,
      status: 200
    });

  } catch (error) {
    console.error('Get reason by schedule call ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = { createReasonSummary, updateReasonSummary, getReasonSummaryById, getAllReasonSummaries, getReasonSummariesByAdviserId, getReasonByScheduleCallId }; 