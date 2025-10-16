const ChooseDayAdvisor = require('../models/choose_day_Advisor.model');
const User = require('../models/User.model');

// Create choose day advisor
const createChooseDayAdvisor = async (req, res) => {
  try {
    const { DayName, Status } = req.body;

    // Validate required fields
    if (!DayName) {
      return res.status(400).json({
        success: false,
        message: 'DayName is required'
      });
    }

    // Check if day already exists
    const existingDay = await ChooseDayAdvisor.findOne({ 
      DayName: { $regex: new RegExp(`^${DayName}$`, 'i') } 
    });
    
    if (existingDay) {
      return res.status(400).json({
        success: false,
        message: 'Day already exists'
      });
    }

    // Create new choose day advisor
    const chooseDayAdvisor = new ChooseDayAdvisor({
      DayName,
      Status: Status !== undefined ? Status : true,
      created_by: req.user.user_id
    });

    await chooseDayAdvisor.save();

    res.status(201).json({
      success: true,
      message: 'Choose day advisor created successfully',
      data: chooseDayAdvisor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update choose day advisor
const updateChooseDayAdvisor = async (req, res) => {
  try {
    const { choose_day_Advisor_id } = req.params;
    const { DayName, Status } = req.body;

    // Check if choose day advisor exists
    const existingDay = await ChooseDayAdvisor.findOne({ choose_day_Advisor_id });
    if (!existingDay) {
      return res.status(404).json({
        success: false,
        message: 'Choose day advisor not found'
      });
    }

    // Check if user is the creator or admin
    if (existingDay.created_by !== req.user.user_id && req.user.role_id !== 1) {
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

    if (DayName !== undefined) updateData.DayName = DayName;
    if (Status !== undefined) updateData.Status = Status;

    // Update choose day advisor
    const updatedDay = await ChooseDayAdvisor.findOneAndUpdate(
      { choose_day_Advisor_id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Choose day advisor updated successfully',
      data: updatedDay
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get choose day advisor by ID
const getChooseDayAdvisorById = async (req, res) => {
  try {
    const { choose_day_Advisor_id } = req.params;

    const chooseDayAdvisor = await ChooseDayAdvisor.findOne({ choose_day_Advisor_id })
      .populate({ path: 'created_by', model: 'User', localField: 'created_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .populate({ path: 'updated_by', model: 'User', localField: 'updated_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' });

    if (!chooseDayAdvisor) {
      return res.status(404).json({
        success: false,
        message: 'Choose day advisor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Choose day advisor retrieved successfully',
      data: chooseDayAdvisor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all choose day advisors
const getAllChooseDayAdvisors = async (req, res) => {
  try {
    

    // Build query
   

    

    // Get all choose day advisors
    const chooseDayAdvisors = await ChooseDayAdvisor.find()
      .populate({ path: 'created_by', model: 'User', localField: 'created_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .populate({ path: 'updated_by', model: 'User', localField: 'updated_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: 'Choose day advisors retrieved successfully',
      data: chooseDayAdvisors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get choose day advisors by authenticated user
const getChooseDayAdvisorsByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { status } = req.query;

    // Build query for user's records
    const query = { created_by: userId };

    if (status !== undefined) query.Status = status === 'true';

    // Get choose day advisors
    const chooseDayAdvisors = await ChooseDayAdvisor.find(query)
      .populate({ path: 'created_by', model: 'User', localField: 'created_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .populate({ path: 'updated_by', model: 'User', localField: 'updated_by', foreignField: 'user_id', select: 'user_id name email mobile role_id' })
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: 'Your choose day advisors retrieved successfully',
      data: chooseDayAdvisors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete choose day advisor
const deleteChooseDayAdvisor = async (req, res) => {
  try {
    const { choose_day_Advisor_id } = req.params;

    // Check if choose day advisor exists
    const existingDay = await ChooseDayAdvisor.findOne({ choose_day_Advisor_id });
    if (!existingDay) {
      return res.status(404).json({
        success: false,
        message: 'Choose day advisor not found'
      });
    }

    // Check if user is the creator or admin
    if (existingDay.created_by !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this record'
      });
    }

    // Delete choose day advisor
    await ChooseDayAdvisor.findOneAndDelete({ choose_day_Advisor_id });

    res.status(200).json({
      success: true,
      message: 'Choose day advisor deleted successfully',
      data: {
        choose_day_Advisor_id: existingDay.choose_day_Advisor_id,
        DayName: existingDay.DayName
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

module.exports = {
  createChooseDayAdvisor,
  updateChooseDayAdvisor,
  getChooseDayAdvisorById,
  getAllChooseDayAdvisors,
  getChooseDayAdvisorsByAuth,
  deleteChooseDayAdvisor
};
