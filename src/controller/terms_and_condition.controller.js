const TermsAndCondition = require('../models/terms_and_condition.model');

const createTermsAndCondition = async (req, res) => {
  try {
    const { title, Description, Status } = req.body;
    if (!title || !Description) {
      return res.status(400).json({ success: false, message: 'title and Description are required' });
    }
    const doc = await TermsAndCondition.create({
      title,
      Description,
      Status: Status !== undefined ? Status : true,
      CreateBy: req.user.user_id,
      CreateAt: new Date()
    });
    return res.status(201).json({ success: true, message: 'Terms and Condition created', data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTermsAndCondition = async (req, res) => {
  try {
    const { TermsAndCondition_id, title, Description, Status } = req.body;
    if (!TermsAndCondition_id) {
      return res.status(400).json({ success: false, message: 'TermsAndCondition_id is required' });
    }
    const updateData = { UpdatedBy: req.user.user_id };
    if (title !== undefined) updateData.title = title;
    if (Description !== undefined) updateData.Description = Description;
    if (Status !== undefined) updateData.Status = Status;

    const doc = await TermsAndCondition.findOneAndUpdate(
      { TermsAndCondition_id: parseInt(TermsAndCondition_id) },
      updateData,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Terms and Condition not found' });
    return res.status(200).json({ success: true, message: 'Terms and Condition updated', data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTermsAndConditionById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await TermsAndCondition.findOne({ TermsAndCondition_id: parseInt(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Terms and Condition not found' });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTermsAndConditions = async (req, res) => {
  try {
    const docs = await TermsAndCondition.find().sort({ CreateAt: -1 });
    return res.status(200).json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTermsAndCondition = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await TermsAndCondition.findOneAndDelete({ TermsAndCondition_id: parseInt(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Terms and Condition not found' });
    return res.status(200).json({ success: true, message: 'Terms and Condition deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTermsAndCondition,
  updateTermsAndCondition,
  getTermsAndConditionById,
  getAllTermsAndConditions,
  deleteTermsAndCondition
};


