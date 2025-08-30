const CallType = require('../models/call_type.model');

// Create call type
const createCallType = async (req, res) => {
  try {
    const data = req.body;
    if (req.user && req.user.user_id) {
      data.created_by = req.user.user_id;
    }
    const callType = new CallType(data);
    await callType.save();
    return res.status(201).json({ message: 'Call type created', callType, status: 201 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Update call type
const updateCallType = async (req, res) => {
  try {
    const { call_type_id, ...updateData } = req.body;
    if (req.user && req.user.user_id) {
      updateData.updated_by = req.user.user_id;
      updateData.updated_at = new Date();
    }
    const callType = await CallType.findOneAndUpdate({ call_type_id }, updateData, { new: true });
    if (!callType) {
      return res.status(404).json({ message: 'Call type not found', status: 404 });
    }
    return res.status(200).json({ message: 'Call type updated', callType, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get call type by ID
const getCallTypeById = async (req, res) => {
  try {
    const { call_type_id } = req.params;
    const callType = await CallType.findOne({ call_type_id });
    if (!callType) {
      return res.status(404).json({ message: 'Call type not found', status: 404 });
    }
    return res.status(200).json({ callType, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get all call types
const getAllCallTypes = async (req, res) => {
  try {
    const callTypes = await CallType.find();
    return res.status(200).json({ callTypes, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

module.exports = { createCallType, updateCallType, getCallTypeById, getAllCallTypes }; 