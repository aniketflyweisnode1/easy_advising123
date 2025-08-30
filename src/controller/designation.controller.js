const Designation = require('../models/designation.model');

const createDesignation = async (req, res) => {
  try {
    const { Designation_name } = req.body;
    if (!Designation_name) return res.status(400).json({ success: false, message: 'Designation_name is required' });
    const designation = new Designation({
      Designation_name,
      created_by: req.user.user_id
    });
    await designation.save();
    res.status(201).json({ success: true, data: designation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const { designation_id, ...rest } = req.body;
    if (!designation_id) return res.status(400).json({ success: false, message: 'designation_id is required in body' });
    const updateData = { ...rest, updated_by: req.user.user_id, updated_at: new Date() };
    const designation = await Designation.findOneAndUpdate({ designation_id }, updateData, { new: true });
    if (!designation) return res.status(404).json({ success: false, message: 'Designation not found' });
    res.status(200).json({ success: true, data: designation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDesignationById = async (req, res) => {
  try {
    const { designation_id } = req.params;
    const designation = await Designation.findOne({ designation_id });
    if (!designation) return res.status(404).json({ success: false, message: 'Designation not found' });
    res.status(200).json({ success: true, data: designation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllDesignations = async (req, res) => {
  try {
    const designations = await Designation.find();
    res.status(200).json({ success: true, data: designations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createDesignation, updateDesignation, getDesignationById, getAllDesignations }; 