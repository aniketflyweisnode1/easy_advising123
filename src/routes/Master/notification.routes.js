const express = require('express');
const router = express.Router();
const { auth } = require('../../utils/jwtUtils.js');
const { 
    createNotification, 
    updateNotification, 
    getNotificationById, 
    getAllNotifications, 
    getNotificationsByUserId 
} = require('../../controller/notification.controller.js');

// /create - createnotification - Created: 2025-07-14
router.post('/create', auth, createNotification);

// /update - updatenotification - Created: 2025-07-14
router.put('/update', auth, updateNotification);

// /getById/:notification_id - getnotificationbyid - Created: 2025-07-14
router.get('/getById/:notification_id', getNotificationById);

// /getAll - getallnotifications - Created: 2025-07-14
router.get('/getAll', getAllNotifications);

// /getByUserId - getnotificationsbyuserid - Created: 2025-07-14
router.get('/getByUserId', auth, getNotificationsByUserId);

module.exports = router; 