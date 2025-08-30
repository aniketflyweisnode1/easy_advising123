const State = require('../models/state.model');

const createState = async (req, res) => {
  try {
    const { country_id, state_name } = req.body;
    if (!country_id || !state_name) return res.status(400).json({ success: false, message: 'country_id and state_name are required' });
    const state = new State({
      country_id,
      state_name,
      created_by: req.user.user_id
    });
    await state.save();
    res.status(201).json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateState = async (req, res) => {
  try {
    const { state_id, ...rest } = req.body;
    if (!state_id) return res.status(400).json({ success: false, message: 'state_id is required in body' });
    const updateData = { ...rest, updated_by: req.user.user_id, updated_at: new Date() };
    const state = await State.findOneAndUpdate({ state_id }, updateData, { new: true });
    if (!state) return res.status(404).json({ success: false, message: 'State not found' });
    res.status(200).json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStateById = async (req, res) => {
  try {
    const { state_id } = req.params;
    const state = await State.findOne({ state_id });
    if (!state) return res.status(404).json({ success: false, message: 'State not found' });
    res.status(200).json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllStates = async (req, res) => {
  try {
    const states = await State.find();
    res.status(200).json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createState, updateState, getStateById, getAllStates }; 