const MySubscriber = require('../models/advisor_mysubscriber.model');
const AdvisorPackage = require('../models/Advisor_Package.model');
const User = require('../models/User.model');

const createMySubscriber = async (req, res) => {
  try {
    const { advisorPackage_id, subscribed_by, trangection_id, paymentStatus, isActive, ExpiryDate, Status } = req.body;
    if (!advisorPackage_id || !subscribed_by) {
      return res.status(400).json({ success: false, message: 'advisorPackage_id and subscribed_by are required' });
    }
    const doc = await MySubscriber.create({
      advisorPackage_id: parseInt(advisorPackage_id),
      subscribed_by: parseInt(subscribed_by),
      trangection_id: trangection_id ? parseInt(trangection_id) : undefined,
      paymentStatus: paymentStatus || 'Pending',
      isActive: isActive || 'inActive',
      ExpiryDate: ExpiryDate ? new Date(ExpiryDate) : undefined,
      Status: Status !== undefined ? Status : true,
      CreateBy: req.user.user_id,
      CreateAt: new Date()
    });
    return res.status(201).json({ success: true, message: 'Subscriber created', data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateMySubscriber = async (req, res) => {
  try {
    const { MySubscriber_id, paymentStatus, isActive, ExpiryDate, Status } = req.body;
    if (!MySubscriber_id) {
      return res.status(400).json({ success: false, message: 'MySubscriber_id is required' });
    }
    const updateData = { UpdatedBy: req.user.user_id };
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (ExpiryDate !== undefined) updateData.ExpiryDate = new Date(ExpiryDate);
    if (Status !== undefined) updateData.Status = Status;

    const doc = await MySubscriber.findOneAndUpdate(
      { MySubscriber_id: parseInt(MySubscriber_id) },
      updateData,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Subscriber not found' });
    return res.status(200).json({ success: true, message: 'Subscriber updated', data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMySubscriberById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MySubscriber.findOne({ MySubscriber_id: parseInt(id) })
      .populate({ path: 'advisorPackage_id', model: 'AdvisorPackage', localField: 'advisorPackage_id', foreignField: 'Advisor_Package_id' })
      .populate({ path: 'subscribed_by', model: 'User', localField: 'subscribed_by', foreignField: 'user_id', select: 'user_id name email mobile' });
    if (!doc) return res.status(404).json({ success: false, message: 'Subscriber not found' });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllMySubscribers = async (req, res) => {
  try {
    const docs = await MySubscriber.find()
      .populate({ path: 'advisorPackage_id', model: 'AdvisorPackage', localField: 'advisorPackage_id', foreignField: 'Advisor_Package_id' })
      .populate({ path: 'subscribed_by', model: 'User', localField: 'subscribed_by', foreignField: 'user_id', select: 'user_id name email mobile' })
      .sort({ CreateAt: -1 });
    return res.status(200).json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMySubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MySubscriber.findOneAndDelete({ MySubscriber_id: parseInt(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Subscriber not found' });
    return res.status(200).json({ success: true, message: 'Subscriber deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Group subscribers by plan name (from AdvisorPackage names)
const Subscribergroupbyplanname = async (req, res) => {
  try {
    // Group by advisorPackage_id and count
    const grouped = await MySubscriber.aggregate([
      { $group: { _id: '$advisorPackage_id', subscribers: { $sum: 1 } } },
      { $sort: { subscribers: -1 } }
    ]);

    // Fetch package names for each id
    const advisorPackageIds = grouped.map(g => g._id);
    const packages = await AdvisorPackage.find({ Advisor_Package_id: { $in: advisorPackageIds } });

    const data = grouped.map(g => {
      const pkg = packages.find(p => p.Advisor_Package_id === g._id);
      return {
        advisorPackage_id: g._id,
        subscribers: g.subscribers,
        Basic_packege_name: pkg ? pkg.Basic_packege_name : undefined,
        Economy_packege_name: pkg ? pkg.Economy_packege_name : undefined,
        Pro_packege_name: pkg ? pkg.Pro_packege_name : undefined
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMySubscriber,
  updateMySubscriber,
  getMySubscriberById,
  getAllMySubscribers,
  deleteMySubscriber,
  Subscribergroupbyplanname
};


