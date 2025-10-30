const PrivacyPolicy = require('../models/privacy_policy.model');

const createPrivacyPolicy = async (req, res) => {
  try {
    const { title, Description, Status } = req.body;
    if (!title || !Description) {
      return res.status(400).json({ success: false, message: 'title and Description are required' });
    }
    const doc = await PrivacyPolicy.create({
      title,
      Description,
      Status: Status !== undefined ? Status : true,
      CreateBy: req.user.user_id,
      CreateAt: new Date()
    });
    return res.status(201).json({ success: true, message: 'Privacy policy created', data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePrivacyPolicy = async (req, res) => {
  try {
    const { PrivacyPolicy_id, title, Description, Status } = req.body;
    if (!PrivacyPolicy_id) {
      return res.status(400).json({ success: false, message: 'PrivacyPolicy_id is required' });
    }
    const updateData = { UpdatedBy: req.user.user_id };
    if (title !== undefined) updateData.title = title;
    if (Description !== undefined) updateData.Description = Description;
    if (Status !== undefined) updateData.Status = Status;

    const doc = await PrivacyPolicy.findOneAndUpdate(
      { PrivacyPolicy_id: parseInt(PrivacyPolicy_id) },
      updateData,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Privacy policy not found' });
    return res.status(200).json({ success: true, message: 'Privacy policy updated', data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPrivacyPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await PrivacyPolicy.findOne({ PrivacyPolicy_id: parseInt(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Privacy policy not found' });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPrivacyPolicies = async (req, res) => {
  try {
    const docs = await PrivacyPolicy.find().sort({ CreateAt: -1 });
    return res.status(200).json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deletePrivacyPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await PrivacyPolicy.findOneAndDelete({ PrivacyPolicy_id: parseInt(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Privacy policy not found' });
    return res.status(200).json({ success: true, message: 'Privacy policy deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPrivacyPolicy,
  updatePrivacyPolicy,
  getPrivacyPolicyById,
  getAllPrivacyPolicies,
  deletePrivacyPolicy
};


