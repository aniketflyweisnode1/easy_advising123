const CallType = require('../models/call_type.model');

// Create call type
const createCallType = async (req, res) => {
  try {
    const data = req.body;
    if (req.user && req.user.user_id) {
      data.created_by = req.user.user_id;
      
    }

    if(req.body.adviser_id){
      data.adviser_id = req.body.adviser_id;
    }
    else{
      data.adviser_id = req.user.user_id;
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
      if(req.body.adviser_id){
        updateData.adviser_id = req.body.adviser_id;
      }
      else{
        updateData.adviser_id = req.user.user_id;
      }
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
    const callType = await CallType.findOne({ call_type_id })
      .populate({
        path: 'adviser_id',
        model: 'User',
        localField: 'adviser_id',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      }).populate({
        path: 'created_by',
        model: 'User',
        localField: 'created_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      }).populate({
        path: 'updated_by',
        model: 'User',
        localField: 'updated_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      }).populate({
        path: 'approve_by',
        model: 'User',
        localField: 'approve_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
    });
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
    const callTypes = await CallType.find()
      .populate({
        path: 'adviser_id',
        model: 'User',
        localField: 'adviser_id',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      });
    return res.status(200).json({ callTypes, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get call types by adviser ID
const getCallTypesByAdviser = async (req, res) => {
  try {
    const { adviser_id } = req.params;

    if (!adviser_id) {
      return res.status(400).json({ message: 'adviser_id is required', status: 400 });
    }

    const callTypes = await CallType.find({ adviser_id: Number(adviser_id) })
      .populate({
        path: 'adviser_id',
        model: 'User',
        localField: 'adviser_id',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      });

    return res.status(200).json({
      callTypes,
      adviser_id: Number(adviser_id),
      count: callTypes.length,
      status: 200
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

module.exports = { createCallType, updateCallType, getCallTypeById, getAllCallTypes, getCallTypesByAdviser }; 