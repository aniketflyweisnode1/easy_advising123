const NotificationShare = require('../models/notification_share.model');

// Create notification share
const createNotificationShare = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_by = req.user.user_id;
        }
        const notificationShare = new NotificationShare(req.body);
        await notificationShare.save();
        return res.status(201).json({
            message: 'Notification share created successfully',
            notificationShare,
            status: 201
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Update notification share
const updateNotificationShare = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        const notificationShare = await NotificationShare.findOneAndUpdate(
            { share_id: updateData.share_id },
            updateData,
            { new: true }
        );
        if (!notificationShare) {
            return res.status(404).json({
                message: 'Notification share not found',
                status: 404
            });
        }
        return res.status(200).json({
            message: 'Notification share updated successfully',
            notificationShare,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get notification share by ID
const getNotificationShareById = async (req, res) => {
    try {
        const { share_id } = req.params;
        const notificationShare = await NotificationShare.findOne({ share_id: share_id });
        if (!notificationShare) {
            return res.status(404).json({
                message: 'Notification share not found',
                status: 404
            });
        }
        return res.status(200).json({ notificationShare, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get all notification shares
const getAllNotificationShares = async (req, res) => {
    try {
        const notificationShares = await NotificationShare.find();
        return res.status(200).json({ notificationShares, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

module.exports = {
    createNotificationShare,
    updateNotificationShare,
    getNotificationShareById,
    getAllNotificationShares
}; 