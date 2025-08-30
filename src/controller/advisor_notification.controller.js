const Notification = require('../models/notification.model.js');

// Get notifications for the authenticated advisor
const getAdvisorNotifications = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const notifications = await Notification.find({ 
            user_id: { $in: [user_id] } 
        }).sort({ created_At: -1 });
        return res.status(200).json({ notifications, status: 200 });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message || error, 
            status: 500 
        });
    }
};

module.exports = { getAdvisorNotifications }; 