const Notification = require('../models/notification.model.js');

const createNotification = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_By = req.user.user_id;
        }
        
        const notification = new Notification(req.body);
        await notification.save();
        
        return res.status(201).json({ 
            message: 'Notification created successfully', 
            notification, 
            status: 201 
        });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message || error, 
            status: 500 
        });
    }
};

const updateNotification = async (req, res) => {
    try {
        const updateData = req.body;
        
        if (req.user && req.user.user_id) {
            updateData.updated_By = req.user.user_id;
        }
        
        const notification = await Notification.findOneAndUpdate(
            { notification_id: updateData.notification_id },
            updateData,
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ 
                message: 'Notification not found', 
                status: 404 
            });
        }
        
        return res.status(200).json({ 
            message: 'Notification updated successfully', 
            notification, 
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message || error, 
            status: 500 
        });
    }
};

const getNotificationById = async (req, res) => {
    try {
        const { notification_id } = req.params;
        const notification = await Notification.findOne({ notification_id: notification_id });
        if (!notification) {
            return res.status(404).json({ 
                message: 'Notification not found', 
                status: 404 
            });
        }
        return res.status(200).json({ notification, status: 200 });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message || error, 
            status: 500 
        });
    }
};

const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find();
        return res.status(200).json({ notifications, status: 200 });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message || error, 
            status: 500 
        });
    }
};

const getNotificationsByUserId = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const notifications = await Notification.find({ 
            user_id: { $in: [user_id] } 
        });
        return res.status(200).json({ notifications, status: 200 });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message || error, 
            status: 500 
        });
    }
};

module.exports = { 
    createNotification, 
    updateNotification, 
    getNotificationById, 
    getAllNotifications, 
    getNotificationsByUserId 
}; 