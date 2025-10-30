const AdminConnectCall = require('../models/admin_connect_call.model');

const createAdminConnectCall = async (req, res) => {
  try {
    const { user_id, mobileNo, date, time, topic, Status } = req.body;
    if (!user_id || !mobileNo || !date || !time) {
      return res.status(400).json({ success: false, message: 'user_id, mobileNo, date, time are required' });
    }
    const doc = await AdminConnectCall.create({
      user_id: parseInt(user_id),
      mobileNo,
      date,
      time,
      topic,
      Status: Status !== undefined ? Status : true,
      CreateBy: req.user.user_id,
      CreateAt: new Date()
    });
    return res.status(201).json({ success: true, message: 'Admin connect call created', data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAdminConnectCall = async (req, res) => {
  try {
    const { AdminConnectCall_id, user_id, mobileNo, date, time, topic, Status } = req.body;
    if (!AdminConnectCall_id) {
      return res.status(400).json({ success: false, message: 'AdminConnectCall_id is required' });
    }
    const updateData = { UpdatedBy: req.user.user_id };
    if (user_id !== undefined) updateData.user_id = parseInt(user_id);
    if (mobileNo !== undefined) updateData.mobileNo = mobileNo;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (topic !== undefined) updateData.topic = topic;
    if (Status !== undefined) updateData.Status = Status;

    const doc = await AdminConnectCall.findOneAndUpdate(
      { AdminConnectCall_id: parseInt(AdminConnectCall_id) },
      updateData,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Record not found' });
    return res.status(200).json({ success: true, message: 'Admin connect call updated', data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminConnectCallById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await AdminConnectCall.findOne({ AdminConnectCall_id: parseInt(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Record not found' });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllAdminConnectCalls = async (req, res) => {
  try {
    const docs = await AdminConnectCall.find().sort({ CreateAt: -1 });
    return res.status(200).json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAdminConnectCall = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await AdminConnectCall.findOneAndDelete({ AdminConnectCall_id: parseInt(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Record not found' });
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAdminConnectCall,
  updateAdminConnectCall,
  getAdminConnectCallById,
  getAllAdminConnectCalls,
  deleteAdminConnectCall
};


