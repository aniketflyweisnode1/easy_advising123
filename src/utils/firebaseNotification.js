const admin = require('firebase-admin');
const User = require('../models/User.model');
const firebaseServiceAccount = require('../config/easy-advising.json');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    if (admin.apps.length === 0) {
      // Validate required fields
      if (!firebaseServiceAccount || !firebaseServiceAccount.private_key || !firebaseServiceAccount.client_email) {
        throw new Error('Firebase service account credentials are incomplete. Please check easy-advising.json file.');
      }

      // Ensure private key has proper newlines
      // When JSON is parsed, \n should already be converted, but handle both cases
      let privateKey = firebaseServiceAccount.private_key;
      if (privateKey && typeof privateKey === 'string') {
        // If it contains literal \n (not actual newlines), replace them
        if (privateKey.includes('\\n') && !privateKey.includes('\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
      }

      const serviceAccount = {
        ...firebaseServiceAccount,
        private_key: privateKey
      };

      // Initialize Firebase using service account from config file
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      firebaseInitialized = true;
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    if (error.code === 'app/invalid-credential' || error.message?.includes('Invalid JWT Signature') || error.message?.includes('invalid_grant')) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('FIREBASE CREDENTIAL ERROR DETECTED');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('The Firebase service account key appears to be invalid or revoked.');
      console.error('');
      console.error('To fix this issue:');
      console.error('1. Go to: https://console.firebase.google.com/project/easy-advising-543d4/settings/serviceaccounts/adminsdk');
      console.error('2. Click "Generate new private key"');
      console.error('3. Download the new JSON file');
      console.error('4. Replace the contents of src/config/easy-advising.json with the new credentials');
      console.error('5. Restart your server');
      console.error('');
      console.error('Or verify the key is still valid at:');
      console.error('https://console.firebase.google.com/iam-admin/serviceaccounts/project');
      console.error('═══════════════════════════════════════════════════════════');
    }
    console.warn('Firebase notifications will not work until valid credentials are provided.');
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

    const userResult = await User.findOne({ user_id: scheduleData.user_id });
    const advisorResult = await advisor.findOne({ user_id: scheduleData.advisor_id });
    const Usermessage = {
      token: userResult.firebase_token,
      notification: {
        title: userNotification.title,
        body: userNotification.body
      },
      data: userNotification.data || {},
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

    const userResponse = await admin.messaging().send(Usermessage);

    const advisorMessage = {
      token: advisorResult.firebase_token,
      notification: {
        title: advisorNotification.title,
        body: advisorNotification.body
      },
      data: advisorNotification.data || {},
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

    const advisorResponse = await admin.messaging().send(advisorMessage);

    if (userResponse.success && advisorResponse.success) {
      return {
        success: true,
        message: 'Appointment booked notifications sent successfully'
      };
    } else {
      return {
        success: false,
        error: 'Failed to send appointment booked notifications',
        message: 'Failed to send appointment booked notifications'
      };
    }
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
    console.log(notification);
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

    // Handle Firebase credential errors
    if (error.code === 'app/invalid-credential' || 
        error.message?.includes('Invalid JWT Signature') || 
        error.message?.includes('invalid_grant') ||
        error.codePrefix === 'app') {
      console.error('Firebase credential error detected during notification send.');
      // Reset initialization flag to allow retry
      firebaseInitialized = false;
      return {
        success: false,
        error: 'Firebase credentials are invalid. Please update your Firebase service account key.',
        code: error.code || 'app/invalid-credential',
        firebaseToken: firebaseToken
      };
    }

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
          sound: 'default',
          channelId: 'high_importance_channel'
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

    // Ensure Firebase is initialized
    if (!firebaseInitialized || admin.apps.length === 0) {
      initializeFirebase();
      if (!firebaseInitialized || admin.apps.length === 0) {
        return {
          success: false,
          error: 'Firebase is not initialized. Please configure valid Firebase credentials.',
          userId: userId
        };
      }
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

console.log(notification, "\n", user.firebase_token);

    const message = {
      token: user.firebase_token,
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
      userId: userId
    };
  } catch (error) {
    console.error('Error sending notification to user:', error);

    // Handle Firebase credential errors
    if (error.code === 'app/invalid-credential' || 
        error.message?.includes('Invalid JWT Signature') || 
        error.message?.includes('invalid_grant') ||
        error.codePrefix === 'app') {
      console.error('Firebase credential error detected during notification send.');
      // Reset initialization flag to allow retry
      firebaseInitialized = false;
      return {
        success: false,
        error: 'Firebase credentials are invalid. Please update your Firebase service account key.',
        code: error.code || 'app/invalid-credential',
        userId: userId
      };
    }
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

