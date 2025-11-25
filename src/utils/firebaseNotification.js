const admin = require('firebase-admin');
const User = require('../models/User.model');
const firebaseServiceAccount = require('../config/easy-advising.json');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    if (admin.apps.length === 0) {     // Initialize Firebase using service account from config file
      admin.initializeApp({
        credential: admin.credential.cert(firebaseServiceAccount),
        projectId: firebaseServiceAccount.project_id
      });
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      firebaseInitialized = true;
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    console.warn('Firebase notifications will not work. Please check your Firebase credentials.');
    // Don't throw error - allow app to continue without Firebase
    firebaseInitialized = false;
  }
};

// Initialize Firebase on module load (but don't crash if it fails)
try {
  initializeFirebase();
} catch (error) {
  console.error('Failed to initialize Firebase on startup:', error.message);
  console.warn('App will continue without Firebase notifications.');
  firebaseInitialized = false;
}

/**
 * Send notification to a single device using firebase_token
 * @param {string} firebaseToken - The Firebase token of the device
 * @param {Object} notification - Notification payload
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} notification.data - Additional data payload (optional)
 * @param {string} notification.sound - Sound file name (optional, default: 'default')
 * @returns {Promise<Object>} - Response from Firebase
 */

/**
 * Send appointment booked notifications to user and advisor
 * @param {Object} scheduleData - Schedule call data
 * @param {number} scheduleData.user_id - User ID
 * @param {number} scheduleData.advisor_id - Advisor ID
 * @param {string} scheduleData.call_type - Appointment type (Chat, Audio, Video)
 * @param {Date} scheduleData.date - Appointment date
 * @param {string} scheduleData.time - Appointment time
 * @param {string} userName - User name
 * @param {string} advisorName - Advisor name
 * @returns {Promise<Object>} - Result with success status
 */
const Notification = async (scheduleData, userName, advisorName) => {
  try {
    const image = 'https://easyadv.s3.ap-south-1.amazonaws.com/upload/1763985845166_12.jpeg';
    
    // Format date
    const appointmentDate = new Date(scheduleData.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = scheduleData.time || '';

    // Get appointment type
    const appointmentType = scheduleData.call_type || 'Appointment';

    // User side notification
    const userTitle = 'Appointment Booked';
    const userBody = `${appointmentType} appointment with ${advisorName} is booked for ${formattedTime}, ${formattedDate}.`;

    // Advisor side notification
    const advisorTitle = 'Appointment Booked';
    const advisorBody = `New ${appointmentType} appointment booked with ${userName} at ${formattedTime}, ${formattedDate}.`;

    // Prepare notification payloads
    const userNotification = {
      title: userTitle,
      body: userBody,
      image,
      data: {},
      sound: 'default',
      channelId: 'high_importance_channel'
    };

    const advisorNotification = {
      title: advisorTitle,
      body: advisorBody,
      image,
      data: {},
      sound: 'default',
      channelId: 'high_importance_channel'
    };

    // Send notifications to both user and advisor
    const [userResult, advisorResult] = await Promise.allSettled([
      sendNotificationToUser(scheduleData.user_id, userNotification),
      sendNotificationToUser(scheduleData.advisor_id, advisorNotification)
    ]);

    return {
      success: true,
      userNotification: userResult.status === 'fulfilled' ? userResult.value : { success: false, error: userResult.reason },
      advisorNotification: advisorResult.status === 'fulfilled' ? advisorResult.value : { success: false, error: advisorResult.reason }
    };
  } catch (error) {
    console.error('Error sending appointment booked notifications:', error);
    return {
      success: false,
      error: error.message || 'Failed to send appointment booked notifications'
    };
  }
};

const sendNotificationToToken = async (firebaseToken, notification) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
      // Check again after initialization attempt
      if (!firebaseInitialized || admin.apps.length === 0) {
        return {
          success: false,
          error: 'Firebase is not initialized. Please configure valid Firebase credentials.',
          firebaseToken: firebaseToken
        };
      }
    }

    if (!firebaseToken) {
      throw new Error('Firebase token is required');
    }

    if (!notification || !notification.title || !notification.body) {
      throw new Error('Notification title and body are required');
    }

    const message = {
      token: firebaseToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'high_importance_channel'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return {
      success: true,
      messageId: response,
      firebaseToken: firebaseToken
    };
  } catch (error) {
    console.error('Error sending notification to token:', error);

    // Handle invalid token error
    if (error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered') {
      return {
        success: false,
        error: 'Invalid or unregistered Firebase token',
        code: error.code,
        firebaseToken: firebaseToken
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to send notification',
      code: error.code,
      firebaseToken: firebaseToken
    };
  }
};

/**
 * Send notification to multiple devices using firebase_tokens
 * @param {Array<string>} firebaseTokens - Array of Firebase tokens
 * @param {Object} notification - Notification payload
 * @returns {Promise<Object>} - Response with success and failure counts
 */
const sendNotificationToMultipleTokens = async (firebaseTokens, notification) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
      // Check again after initialization attempt
      if (!firebaseInitialized || admin.apps.length === 0) {
        return {
          success: false,
          error: 'Firebase is not initialized. Please configure valid Firebase credentials.'
        };
      }
    }

    if (!Array.isArray(firebaseTokens) || firebaseTokens.length === 0) {
      throw new Error('Firebase tokens array is required and must not be empty');
    }

    if (!notification || !notification.title || !notification.body) {
      throw new Error('Notification title and body are required');
    }

    // Filter out null/undefined tokens
    const validTokens = firebaseTokens.filter(token => token && token.trim() !== '');

    if (validTokens.length === 0) {
      return {
        success: false,
        error: 'No valid Firebase tokens provided'
      };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: notification.sound || 'default',
          channelId: notification.channelId || 'default_channel'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: notification.sound || 'default'
          }
        }
      },
      tokens: validTokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`Successfully sent ${response.successCount} notifications`);
    if (response.failureCount > 0) {
      console.log(`Failed to send ${response.failureCount} notifications`);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map((resp, idx) => ({
        success: resp.success,
        token: validTokens[idx],
        error: resp.error ? resp.error.message : null
      }))
    };
  } catch (error) {
    console.error('Error sending notifications to multiple tokens:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notifications',
      code: error.code
    };
  }
};

/**
 * Send notification to a user by user_id (fetches firebase_token from database)
 * @param {number} userId - User ID
 * @param {Object} notification - Notification payload
 * @returns {Promise<Object>} - Response from Firebase
 */
const sendNotificationToUser = async (userId, notification) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Fetch user from database
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        userId: userId
      };
    }

    if (!user.firebase_token) {
      return {
        success: false,
        error: 'User does not have a Firebase token',
        userId: userId
      };
    }

    // Send notification using the user's firebase_token
    return await sendNotificationToToken(user.firebase_token, notification);
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification to user',
      userId: userId
    };
  }
};

/**
 * Send notification to multiple users by user_ids
 * @param {Array<number>} userIds - Array of User IDs
 * @param {Object} notification - Notification payload
 * @returns {Promise<Object>} - Response with success and failure counts
 */
const sendNotificationToMultipleUsers = async (userIds, notification) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required and must not be empty');
    }

    // Fetch users from database
    const users = await User.find({ user_id: { $in: userIds } });

    // Extract valid firebase_tokens
    const firebaseTokens = users
      .filter(user => user.firebase_token && user.firebase_token.trim() !== '')
      .map(user => user.firebase_token);

    if (firebaseTokens.length === 0) {
      return {
        success: false,
        error: 'No users with valid Firebase tokens found',
        requestedUserIds: userIds,
        foundUsers: users.length
      };
    }

    // Send notifications to all tokens
    return await sendNotificationToMultipleTokens(firebaseTokens, notification);
  } catch (error) {
    console.error('Error sending notifications to multiple users:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notifications to users'
    };
  }
};

/**
 * Send notification to all users with firebase_token
 * @param {Object} notification - Notification payload
 * @returns {Promise<Object>} - Response with success and failure counts
 */
const sendNotificationToAllUsers = async (notification) => {
  try {
    // Fetch all users with firebase_token
    const users = await User.find({
      firebase_token: { $exists: true, $ne: null, $ne: '' }
    });

    if (users.length === 0) {
      return {
        success: false,
        error: 'No users with Firebase tokens found'
      };
    }

    // Extract firebase_tokens
    const firebaseTokens = users
      .map(user => user.firebase_token)
      .filter(token => token && token.trim() !== '');

    if (firebaseTokens.length === 0) {
      return {
        success: false,
        error: 'No valid Firebase tokens found'
      };
    }

    // Send notifications to all tokens
    return await sendNotificationToMultipleTokens(firebaseTokens, notification);
  } catch (error) {
    console.error('Error sending notifications to all users:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notifications to all users'
    };
  }
};

module.exports = {
  sendNotificationToToken,
  sendNotificationToMultipleTokens,
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendNotificationToAllUsers,
  initializeFirebase,
  Notification
};

