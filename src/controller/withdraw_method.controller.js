const WithdrawMethod = require('../models/withdraw_method.model');

// Create withdraw method
const createWithdrawMethod = async (req, res) => {
  try {
    const data = req.body;
    if (req.user && req.user.user_id) {
      data.created_by = req.user.user_id;
    }
    const method = new WithdrawMethod(data);
    await method.save();
    return res.status(201).json({ message: 'Withdraw method created', method, status: 201 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Update withdraw method
const updateWithdrawMethod = async (req, res) => {
  try {
    const { method_id, ...updateData } = req.body;
    if (req.user && req.user.user_id) {
      updateData.updated_by = req.user.user_id;
      updateData.updated_at = new Date();
    }
    const method = await WithdrawMethod.findOneAndUpdate({ method_id }, updateData, { new: true });
    if (!method) {
      return res.status(404).json({ message: 'Withdraw method not found', status: 404 });
    }
    return res.status(200).json({ message: 'Withdraw method updated', method, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get withdraw method by ID
const getWithdrawMethodById = async (req, res) => {
  try {
    const { method_id } = req.params;
    const method = await WithdrawMethod.findOne({ method_id });
    if (!method) {
      return res.status(404).json({ message: 'Withdraw method not found', status: 404 });
    }
    return res.status(200).json({ method, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get all withdraw methods
const getAllWithdrawMethods = async (req, res) => {
  try {
    const methods = await WithdrawMethod.find();
    return res.status(200).json({ methods, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

module.exports = { createWithdrawMethod, updateWithdrawMethod, getWithdrawMethodById, getAllWithdrawMethods }; 