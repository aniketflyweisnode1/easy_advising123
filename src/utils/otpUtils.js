const OTP = require('../models/OTP.model');

// Generate OTP
const generateOTP = () => {
  var otp = Math.floor(1000 + Math.random() * 9000).toString();
  return otp;
};

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

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  getStoredOTP,
  cleanupExpiredOTPs,
  generateTicketNo
}; 