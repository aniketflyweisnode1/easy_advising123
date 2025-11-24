const OTP = require('../models/OTP.model');
const https = require('https');
// const msg91 = require('msg91');

// MSG91 Configuration
const MSG91_CONFIG = {
  AUTH_KEY: '455171AwMCnr3fbI69242faaP1',
  SENDER_ID: 'easy28',
  SMS_API_URL: 'https://control.msg91.com/api/sendhttp.php',
  OTP_API_URL: 'https://control.msg91.com/api/v5/otp'
};
// msg91.initialize({ authKey: MSG91_CONFIG.AUTH_KEY }); 
// Generate OTP
const generateOTP = () => {
  var otp = Math.floor(1000 + Math.random() * 9000).toString();
  return otp;
};

// const sendOTP = async (mobile, otp) => {
//   try {
//     let sms = msg91.getSMS(); 
//     sms.send("flowId", {
//       'mobile': mobile,
//       "VAR1": otp // Example variable
//     });
//     return result;
//   } catch (error) {
//     console.error('Error sending OTP:', error);
//     return false;
//   }
// };

// Generate 8-digit ticket number
const generateTicketNo = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Store OTP in database
const storeOTP = async (mobile, otp, purpose = 'login', otptype_id = 1, expiryMinutes = 5) => {
  try {
    // Delete any existing unused OTPs for this mobile
    await OTP.deleteMany({
      mobile,
      isUsed: false
    });

    // Create new OTP record
    const expiryTime = new Date(Date.now() + (expiryMinutes * 60 * 1000));
    const otpRecord = new OTP({
      mobile,
      otp,
      otptype_id,
      expiry: expiryTime,
      purpose
    });

    await otpRecord.save();
    return true;
  } catch (error) {
    console.error('Error storing OTP:', error);
    return false;
  }
};

// Verify OTP from database
const verifyOTP = async (mobile, otp) => {
  try {
    // Find the most recent unused OTP for this mobile
    const otpRecord = await OTP.findOne({
      mobile, otp,
      isUsed: false
    });
 
    if (!otpRecord) {
      return false;
    }
    // Check if OTP matches
    if (parseInt(otpRecord.otp) === otp) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

// Get stored OTP (for debugging)
const getStoredOTP = async (mobile) => {
  try {
    const otpRecord = await OTP.findOne({
      mobile,
      isUsed: false
    }).sort({ created_at: -1 });

    return otpRecord ? otpRecord.otp : null;
  } catch (error) {
    console.error('Error getting stored OTP:', error);
    return null;
  }
};

// Clean up expired OTPs (optional - MongoDB TTL index handles this automatically)
const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      expiry: { $lt: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
};

/**
 * Send OTP via MSG91 SMS - Very Simple Function
 * @param {string|number} mobile - Mobile number
 * @param {string|number} otp - OTP to send
 * @returns {Promise<Object>} - {success: boolean, message: string}
 */
const sendOTPViaMSG91 = async (mobile, otp) => {
  return new Promise((resolve) => {
    // Validate
    if (!mobile || !otp || !MSG91_CONFIG.AUTH_KEY) {
      return resolve({ success: false, error: 'Missing required parameters' });
    }

    // Format mobile
    const formattedMobile = String(mobile).replace(/[+\s-]/g, '');
    const message = `Your OTP is ${otp}. Please do not share this OTP with anyone.`;

    // Build URL
    const url = `https://control.msg91.com/api/sendhttp.php?authkey=${MSG91_CONFIG.AUTH_KEY}&mobiles=${formattedMobile}&message=${encodeURIComponent(message)}&sender=${MSG91_CONFIG.SENDER_ID}&route=4&country=91`;
    const urlObj = new URL(url);

    // Send request
    https.get({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log("data \n ", data);
        // Success if response is a number (request ID)
        // console.log("data \n ", res.statusCode);
        if (res.statusCode === 200) {
          resolve({ success: true, message: 'OTP sent successfully', requestId: data.trim() });
        } else {
          resolve({ success: false, error: data || 'Failed to send OTP' });
        }
      });
    }).on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
};

/**
 * Verify OTP via MSG91 API
 * @param {string} mobile - Mobile number (with country code)
 * @param {string} otp - OTP to verify
 * @returns {Promise<Object>} - Verification response
 */
const verifyOTPViaMSG91 = async (mobile, otp) => {
  return new Promise((resolve, reject) => {
    try {
      if (!MSG91_CONFIG.AUTH_KEY) {
        return resolve({
          success: false,
          error: 'MSG91 AUTH_KEY not configured'
        });
      }

      // Convert to string in case it's a number
      const mobileString = String(mobile || '');
      const formattedMobile = mobileString.replace(/[+\s-]/g, '');
      const url = new URL(`${MSG91_CONFIG.OTP_API_URL}/verify`);
      
      // Build query parameters
      const params = new URLSearchParams({
        authkey: MSG91_CONFIG.AUTH_KEY,
        mobile: formattedMobile,
        otp: otp
      });

      const options = {
        hostname: url.hostname,
        path: `${url.pathname}?${params.toString()}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.type === 'success' || res.statusCode === 200) {
              resolve({
                success: true,
                message: 'OTP verified successfully',
                mobile: mobile
              });
            } else {
              resolve({
                success: false,
                error: response.message || response.msg || 'Invalid OTP',
                mobile: mobile
              });
            }
          } catch (parseError) {
            resolve({
              success: false,
              error: 'Invalid response from MSG91',
              mobile: mobile
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message || 'Failed to verify OTP',
          mobile: mobile
        });
      });

      req.end();

    } catch (error) {
      resolve({
        success: false,
        error: error.message || 'Failed to verify OTP',
        mobile: mobile
      });
    }
  });
};

/**
 * Resend OTP via MSG91 API
 * @param {string} mobile - Mobile number (with country code)
 * @param {string} retryType - 'text' or 'voice' (default: 'text')
 * @returns {Promise<Object>} - Resend response
 */
const resendOTPViaMSG91 = async (mobile, retryType = 'text') => {
  return new Promise((resolve, reject) => {
    try {
      if (!MSG91_CONFIG.AUTH_KEY) {
        return resolve({
          success: false,
          error: 'MSG91 AUTH_KEY not configured'
        });
      }

      // Convert to string in case it's a number
      const mobileString = String(mobile || '');
      const formattedMobile = mobileString.replace(/[+\s-]/g, '');
      const url = new URL(`${MSG91_CONFIG.OTP_API_URL}/retry`);
      
      // Build query parameters
      const params = new URLSearchParams({
        authkey: MSG91_CONFIG.AUTH_KEY,
        mobile: formattedMobile,
        retrytype: retryType
      });

      const options = {
        hostname: url.hostname,
        path: `${url.pathname}?${params.toString()}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.type === 'success' || res.statusCode === 200) {
              resolve({
                success: true,
                message: 'OTP resent successfully',
                mobile: mobile,
                retryType: retryType
              });
            } else {
              resolve({
                success: false,
                error: response.message || response.msg || 'Failed to resend OTP',
                mobile: mobile
              });
            }
          } catch (parseError) {
            resolve({
              success: false,
              error: 'Invalid response from MSG91',
              mobile: mobile
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message || 'Failed to resend OTP',
          mobile: mobile
        });
      });

      req.end();

    } catch (error) {
      resolve({
        success: false,
        error: error.message || 'Failed to resend OTP',
        mobile: mobile
      });
    }
  });
};

/**
 * Send OTP and store in database (combines MSG91 SMS + database storage)
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP to send (optional, will generate if not provided)
 * @param {string} purpose - Purpose of OTP (default: 'login')
 * @param {number} otptype_id - OTP type ID (default: 1)
 * @param {number} expiryMinutes - OTP expiry in minutes (default: 5)
 * @returns {Promise<Object>} - Combined result
 */
const sendAndStoreOTP = async (mobile, otp = null, purpose = 'login', otptype_id = 1, expiryMinutes = 5) => {
  try {
    // Generate OTP if not provided
    const generatedOTP = otp || generateOTP();

    // Store OTP in database
    const stored = await storeOTP(mobile, generatedOTP, purpose, otptype_id, expiryMinutes);
    
    if (!stored) {
      return {
        success: false,
        error: 'Failed to store OTP in database',
        mobile: mobile
      };
    }

    // Send OTP via MSG91 (simple SMS without template)
    const smsResult = await sendOTPViaMSG91(mobile, generatedOTP);

    return {
      success: smsResult.success,
      mobile: mobile,
      otp: generatedOTP, // Only return in development, remove in production
      stored: stored,
      smsSent: smsResult.success,
      smsResponse: smsResult,
      message: smsResult.success ? 'OTP sent and stored successfully' : 'OTP stored but SMS sending failed'
    };
  } catch (error) {
    console.error('Error in sendAndStoreOTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to send and store OTP',
      mobile: mobile
    };
  }
};

module.exports = {
  generateOTP,
  storeOTP,
  // sendOTP,
  verifyOTP,
  getStoredOTP,
  cleanupExpiredOTPs,
  generateTicketNo,
  sendOTPViaMSG91,
  verifyOTPViaMSG91,
  resendOTPViaMSG91,
  sendAndStoreOTP
}; 