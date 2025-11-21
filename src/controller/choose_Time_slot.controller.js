const ChooseTimeSlot = require('../models/choose_Time_slot.model');
const ChooseDayAdvisor = require('../models/choose_day_Advisor.model');
const User = require('../models/User.model');

// Create choose time slot
const createChooseTimeSlot = async (req, res) => {
  try {
    const { choose_day_Advisor_id, advisor_id, Time_slot, Status } = req.body;

    // Validate required fields
    if (!choose_day_Advisor_id || !advisor_id || !Time_slot || !Array.isArray(Time_slot)) {
      return res.status(400).json({
        success: false,
        message: 'choose_day_Advisor_id, advisor_id, and Time_slot (array) are required'
      });
    }

    // Check if choose day advisor exists
    const dayAdvisor = await ChooseDayAdvisor.findOne({ choose_day_Advisor_id });
    if (!dayAdvisor) {
      return res.status(404).json({
        success: false,
        message: 'Choose day advisor not found'
      });
    }

    // Check if advisor exists
    const advisor = await User.findOne({ user_id: advisor_id, role_id: 2 });
    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: 'Advisor not found'
      });
    }

    // Check if time slot already exists for this day
    const existingTimeSlot = await ChooseTimeSlot.findOne({ 
      choose_day_Advisor_id,
      advisor_id
    });
    
    if (existingTimeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Time slot already exists for this day and advisor'
      });
    }

    // Create new choose time slot
    const chooseTimeSlot = new ChooseTimeSlot({
      choose_day_Advisor_id,
      advisor_id,
      Time_slot,
      Status: Status !== undefined ? Status : true,
      created_by: req.user.user_id
    });

    await chooseTimeSlot.save();

    // Re-fetch with populated references using numeric local/foreign fields
    const populated = await ChooseTimeSlot.findOne({ choose_Time_slot_id: chooseTimeSlot.choose_Time_slot_id })
      .populate({ path: 'choose_day_Advisor_id', model: 'choose_day_Advisor', localField: 'choose_day_Advisor_id', foreignField: 'choose_day_Advisor_id', select: 'choose_day_Advisor_id DayName advisor_id' })
      .populate({ path: 'advisor_id', model: 'User', localField: 'advisor_id', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .populate({ path: 'created_by', model: 'User', localField: 'created_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .populate({ path: 'updated_by', model: 'User', localField: 'updated_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' });

    res.status(201).json({
      success: true,
      message: 'Choose time slot created successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update choose time slot
const updateChooseTimeSlot = async (req, res) => {
  try {
    const { choose_Time_slot_id } = req.params;
    const { Time_slot, Status } = req.body;

    // Check if choose time slot exists
    const existingTimeSlot = await ChooseTimeSlot.findOne({ choose_Time_slot_id });
    if (!existingTimeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Choose time slot not found'
      });
    }

    // Check if user is the creator or admin
    if (existingTimeSlot.created_by !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this record'
      });
    }

    // Build update data
    const updateData = {
      updated_by: req.user.user_id,
      updated_at: new Date()
    };

    if (Time_slot !== undefined) {
      if (!Array.isArray(Time_slot)) {
        return res.status(400).json({
          success: false,
          message: 'Time_slot must be an array'
        });
      }
      updateData.Time_slot = Time_slot;
    }
    if (Status !== undefined) updateData.Status = Status;

    // Update choose time slot
    const updatedTimeSlot = await ChooseTimeSlot.findOneAndUpdate(
      { choose_Time_slot_id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Choose time slot updated successfully',
      data: updatedTimeSlot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get choose time slot by ID
const getChooseTimeSlotById = async (req, res) => {
  try {
    const { choose_Time_slot_id } = req.params;

    const chooseTimeSlot = await ChooseTimeSlot.findOne({ choose_Time_slot_id })
      .populate('choose_day_Advisor_id', 'choose_day_Advisor_id DayName advisor_id')
      .populate('advisor_id', 'user_id name email mobile role_id')
      .populate('created_by', 'user_id name email mobile role_id')
      .populate('updated_by', 'user_id name email mobile role_id');

    if (!chooseTimeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Choose time slot not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Choose time slot retrieved successfully',
      data: chooseTimeSlot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all choose time slots
const getAllChooseTimeSlots = async (req, res) => {
  try {
    const {
      advisor_id,
      choose_day_Advisor_id,
      status,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (advisor_id) query.advisor_id = parseInt(advisor_id);
    if (choose_day_Advisor_id) query.choose_day_Advisor_id = parseInt(choose_day_Advisor_id);
    if (status !== undefined) query.Status = status === 'true';

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get choose time slots
    const chooseTimeSlots = await ChooseTimeSlot.find(query)
      .populate('choose_day_Advisor_id', 'choose_day_Advisor_id DayName advisor_id')
      .populate('advisor_id', 'user_id name email mobile role_id')
      .populate('created_by', 'user_id name email mobile role_id')
      .populate('updated_by', 'user_id name email mobile role_id')
      .sort(sortObj);

    res.status(200).json({
      success: true,
      message: 'Choose time slots retrieved successfully',
      data: chooseTimeSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get choose time slots by authenticated user
const getChooseTimeSlotsByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      status,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build query for user's records
    const query = { created_by: userId };

    if (status !== undefined) query.Status = status === 'true';

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get choose time slots
    const chooseTimeSlots = await ChooseTimeSlot.find(query)
      .populate('choose_day_Advisor_id', 'choose_day_Advisor_id DayName advisor_id')
      .populate('advisor_id', 'user_id name email mobile role_id')
      .populate('created_by', 'user_id name email mobile role_id')
      .populate('updated_by', 'user_id name email mobile role_id')
      .sort(sortObj);

    res.status(200).json({
      success: true,
      message: 'Your choose time slots retrieved successfully',
      data: chooseTimeSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete choose time slot
const deleteChooseTimeSlot = async (req, res) => {
  try {
    const { choose_Time_slot_id } = req.params;

    // Check if choose time slot exists
    const existingTimeSlot = await ChooseTimeSlot.findOne({ choose_Time_slot_id });
    if (!existingTimeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Choose time slot not found'
      });
    }

    // Check if user is the creator or admin
    if (existingTimeSlot.created_by !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this record'
      });
    }

    // Delete choose time slot
    await ChooseTimeSlot.findOneAndDelete({ choose_Time_slot_id });

    res.status(200).json({
      success: true,
      message: 'Choose time slot deleted successfully',
      data: {
        choose_Time_slot_id: existingTimeSlot.choose_Time_slot_id,
        Time_slot: existingTimeSlot.Time_slot
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get choose time slots by day ID
const getChooseTimeSlotsByDayId = async (req, res) => {
  try {
    const { day_id } = req.params;

    // Validate day_id
    if (!day_id) {
      return res.status(400).json({
        success: false,
        message: 'day_id is required'
      });
    }

    // Get time slots for the specific day
    const timeSlots = await ChooseTimeSlot.find({ 
      choose_day_Advisor_id: Number(day_id),
      Status: true 
    })
      .populate({ path: 'choose_day_Advisor_id', model: 'choose_day_Advisor', localField: 'choose_day_Advisor_id', foreignField: 'choose_day_Advisor_id', select: 'choose_day_Advisor_id DayName' })
      .populate({ path: 'advisor_id', model: 'User', localField: 'advisor_id', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .populate({ path: 'created_by', model: 'User', localField: 'created_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .populate({ path: 'updated_by', model: 'User', localField: 'updated_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: 'Time slots retrieved successfully for the specified day',
      data: timeSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createChooseTimeSlot,
  updateChooseTimeSlot,
  getChooseTimeSlotById,
  getAllChooseTimeSlots,
  getChooseTimeSlotsByAuth,
  getChooseTimeSlotsByDayId,
  deleteChooseTimeSlot
};
