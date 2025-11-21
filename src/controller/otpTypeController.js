const OTPType = require('../models/otptype.model');

// Create OTP type (with auth)
const createOTPType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const created_by = req.user.user_id;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'OTP type name is required'
      });
    }

    // Check if OTP type name already exists
    const existingOTPType = await OTPType.findOne({ name });
    if (existingOTPType) {
      return res.status(400).json({
        success: false,
        message: 'OTP type with this name already exists'
      });
    }

    // Create new OTP type
    const newOTPType = new OTPType({
      name,
      description: description || '',
      created_by,
      updated_by: created_by
    });

    await newOTPType.save();

    return res.status(201).json({
      success: true,
      message: 'OTP type created successfully',
      data: {
        otptype_id: newOTPType.otptype_id,
        name: newOTPType.name,
        description: newOTPType.description,
        status: newOTPType.status,
        created_by: newOTPType.created_by,
        created_at: newOTPType.created_at,
        updated_by: newOTPType.updated_by,
        updated_on: newOTPType.updated_on
      }
    });

  } catch (error) {
    console.error('Create OTP type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update OTP type (with auth)
const updateOTPType = async (req, res) => {
  try {
    const { otptype_id } = req.params;
    const { name, description, status } = req.body;
    const updated_by = req.user.user_id;

    // Find OTP type by otptype_id
    const otpType = await OTPType.findOne({ otptype_id: parseInt(otptype_id) });
    if (!otpType) {
      return res.status(404).json({
        success: false,
        message: 'OTP type not found'
      });
    }

    // Check if new name already exists (if name is being updated)
    if (name && name !== otpType.name) {
      const existingOTPType = await OTPType.findOne({ name });
      if (existingOTPType) {
        return res.status(400).json({
          success: false,
          message: 'OTP type with this name already exists'
        });
      }
    }

    // Update OTP type
    const updateData = {
      updated_by,
      updated_on: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const updatedOTPType = await OTPType.findOneAndUpdate(
      { otptype_id: parseInt(otptype_id) },
      updateData,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP type updated successfully',
      data: {
        otptype_id: updatedOTPType.otptype_id,
        name: updatedOTPType.name,
        description: updatedOTPType.description,
        status: updatedOTPType.status,
        created_by: updatedOTPType.created_by,
        created_at: updatedOTPType.created_at,
        updated_by: updatedOTPType.updated_by,
        updated_on: updatedOTPType.updated_on
      }
    });

  } catch (error) {
    console.error('Update OTP type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get OTP type by ID
const getOTPTypeById = async (req, res) => {
  try {
    const { otptype_id } = req.params;

    const otpType = await OTPType.findOne({ otptype_id: parseInt(otptype_id) });
    if (!otpType) {
      return res.status(404).json({
        success: false,
        message: 'OTP type not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP type retrieved successfully',
      data: {
        otptype_id: otpType.otptype_id,
        name: otpType.name,
        description: otpType.description,
        status: otpType.status,
        created_by: otpType.created_by,
        created_at: otpType.created_at,
        updated_by: otpType.updated_by,
        updated_on: otpType.updated_on
      }
    });

  } catch (error) {
    console.error('Get OTP type by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all OTP types
const getAllOTPTypes = async (req, res) => {
  try {
    const { status } = req.query;

    // Build query
    const query = {};
    if (status !== undefined) {
      // Handle different status formats: 'true'/'false', '1'/'0', 1/0
      let statusValue;
      if (status === 'true' || status === true) {
        statusValue = 1;
      } else if (status === 'false' || status === false) {
        statusValue = 0;
      } else {
        statusValue = parseInt(status);
        // If parseInt returns NaN, don't add to query
        if (isNaN(statusValue)) {
          statusValue = undefined;
        }
      }
      if (statusValue !== undefined) {
        query.status = statusValue;
      }
    }

    // Get OTP types without pagination
    const otpTypes = await OTPType.find(query)
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      message: 'OTP types retrieved successfully',
      data: {
        otp_types: otpTypes.map(otpType => ({
          otptype_id: otpType.otptype_id,
          name: otpType.name,
          description: otpType.description,
          status: otpType.status,
          created_by: otpType.created_by,
          created_at: otpType.created_at,
          updated_by: otpType.updated_by,
          updated_on: otpType.updated_on
        }))
      }
    });

  } catch (error) {
    console.error('Get all OTP types error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createOTPType,
  updateOTPType,
  getOTPTypeById,
  getAllOTPTypes
}; 