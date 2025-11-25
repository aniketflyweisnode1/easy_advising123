const User = require('../models/User.model');
const {
  sendNotificationToToken,
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendNotificationToAllUsers
} = require('../utils/firebaseNotification');

/**
 * Send Firebase notification to authenticated user
 * Gets firebase_token from database for the logged-in user
 */
const sendFirebaseNotificationToAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { title, body, data, sound, channelId } = req.body;
    const image = 'https://easyadv.s3.ap-south-1.amazonaws.com/upload/1763985845166_12.jpeg';
    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
        status: 400
      });
    }

    // Get user from database to fetch firebase_token
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        status: 404
      });
    }

    if (!user.firebase_token) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a Firebase token. Please update firebase_token first.',
        status: 400
      });
    }

    // Prepare notification payload
    const notification = {
      title,
      body,
      image: image || null,
      data: data || {},
      sound: sound || 'default',
      channelId: channelId || 'default_channel'
    };

    // Send notification
    const result = await sendNotificationToToken(user.firebase_token, notification);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Firebase notification sent successfully',
        data: {
          messageId: result.messageId,
          userId: userId,
          notification: {
            title,
            body
          }
        },
        status: 200
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send Firebase notification',
        error: result.error,
        code: result.code,
        status: 500
      });
    }
  } catch (error) {
    console.error('Error sending Firebase notification to auth user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

/**
 * Send Firebase notification to specific user by user_id
 * Gets firebase_token from database
 */
const sendFirebaseNotificationToUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { title, body } = req.body;
    const image = 'https://easyadv.s3.ap-south-1.amazonaws.com/upload/1763985845166_12.jpeg';
    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
        status: 400
      });
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required',
        status: 400
      });
    }

    // Prepare notification payload
    const notification = {
      title,
      body,
      image,
      data: {},
      sound: 'default',
      channelId: 'default_channel'
    };

    // Send notification (function will fetch firebase_token from database)
    const result = await sendNotificationToUser(parseInt(user_id), notification);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Firebase notification sent successfully',
        data: {
          messageId: result.messageId,
          userId: parseInt(user_id),
          result: result,
          notification: {
            title,
            body
          }
        },
        status: 200
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to send Firebase notification',
        error: result.error,
        status: 400
      });
    }
  } catch (error) {
    console.error('Error sending Firebase notification to user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

/**
 * Send Firebase notification to multiple users by user_ids
 * Gets firebase_tokens from database
 */
const sendFirebaseNotificationToMultipleUsers = async (req, res) => {
  try {
    const { user_ids, title, body, data, sound, channelId } = req.body;

    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
        status: 400
      });
    }

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids array is required and must not be empty',
        status: 400
      });
    }

    // Prepare notification payload
    const notification = {
      title,
      body,
      data: data || {},
      sound: sound || 'default',
      channelId: channelId || 'default_channel'
    };

    // Send notifications (function will fetch firebase_tokens from database)
    const result = await sendNotificationToMultipleUsers(user_ids, notification);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Firebase notifications sent to ${result.successCount} user(s)`,
        data: {
          successCount: result.successCount,
          failureCount: result.failureCount,
          totalRequested: user_ids.length,
          responses: result.responses
        },
        status: 200
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to send Firebase notifications',
        error: result.error,
        status: 400
      });
    }
  } catch (error) {
    console.error('Error sending Firebase notifications to multiple users:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

/**
 * Send Firebase notification to all users with firebase_token
 * Gets firebase_tokens from database
 */
const sendFirebaseNotificationToAllUsers = async (req, res) => {
  try {
    const { title, body, data, sound, channelId } = req.body;

    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
        status: 400
      });
    }

    // Prepare notification payload
    const notification = {
      title,
      body,
      data: data || {},
      sound: sound || 'default',
      channelId: channelId || 'default_channel'
    };

    // Send notifications to all users (function will fetch firebase_tokens from database)
    const result = await sendNotificationToAllUsers(notification);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Firebase notifications sent to ${result.successCount} user(s)`,
        data: {
          successCount: result.successCount,
          failureCount: result.failureCount,
          totalSent: result.successCount + result.failureCount
        },
        status: 200
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to send Firebase notifications',
        error: result.error,
        status: 400
      });
    }
  } catch (error) {
    console.error('Error sending Firebase notifications to all users:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

module.exports = {
  sendFirebaseNotificationToAuth,
  sendFirebaseNotificationToUser,
  sendFirebaseNotificationToMultipleUsers,
  sendFirebaseNotificationToAllUsers
};

