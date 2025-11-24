const User = require('../models/User.model');
const { generateOTP, storeOTP, verifyOTP: verifyStoredOTP, sendAndStoreOTP, sendOTPViaMSG91 } = require('../utils/otpUtils');
const { generateToken, generateTokenWithExpiry, generateUserTokenData } = require('../utils/jwtUtils');

// Send OTP via MSG91 (integrated with database storage)
const sendOTP = async (mobile, otp) => {
  try {
    // Use sendAndStoreOTP which combines MSG91 SMS + database storage
    const result = await sendAndStoreOTP(mobile, otp, 'login', 1, 5);
    
    if (result.success) {
      console.log(`OTP ${otp} sent to ${mobile} via MSG91`);
      return true;
    } else {
      console.warn(`Failed to send OTP via MSG91: ${result.error}`);
      // Fallback: still store in database even if SMS fails
      await storeOTP(mobile, otp, 'login', 1, 5);
      return true; // Return true to allow login flow to continue
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    // Fallback: store in database
    await storeOTP(mobile, otp, 'login', 1, 5);
    return true;
  }
};

// Login API
const login = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ mobile });
console.log(existingUser);
    if (existingUser) {
      // Check user status and login permission
      if (existingUser.status !== 1) {
        return res.status(403).json({
          success: false,
          message: 'User is inactive or blocked'
        });
      }
      if (existingUser.login_permission_status !== true) {
        return res.status(403).json({
          success: false,
          message: 'Login permission denied'
        });
      }
      // User is registered - send OTP for login via MSG91
      const otp = generateOTP();
      
      // Send and store OTP (combines MSG91 SMS + database storage)
      const otpResult = await sendAndStoreOTP(mobile, otp, 'login', 1, 5);
      
      if (otpResult.success || otpResult.stored) {
        return res.status(200).json({
          success: true,
          message: otpResult.smsSent ? 'OTP sent successfully for login' : 'OTP generated (SMS may not have been sent)',
          data: {
            OTP: otp, // Only in development - remove in production
            user_id: existingUser.user_id,
            name: existingUser.name,
            role_id: existingUser.role_id,
            mobile: existingUser.mobile,
            isRegistered: true,
            smsSent: otpResult.smsSent || false
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP',
          error: otpResult.error
        });
      }
    } else {
      // User not registered
      return res.status(404).json({
        success: false,
        message: 'User not registered. Please register first.'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Verify OTP and complete login/registration
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp, firebase_token } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ mobile });

    if (existingUser) {
      // Verify OTP for login
      const otpValid = await verifyStoredOTP(mobile, otp);

      if (!otpValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }
      // Check user status and login permission
      if (existingUser.status !== 1) {
        return res.status(403).json({
          success: false,
          message: 'User is inactive or blocked'
        });
      }
      if (existingUser.login_permission_status !== true) {
        return res.status(403).json({
          success: false,
          message: 'Login permission denied'
        });
      }

      // Update firebase_token if provided
      const updateData = {};
      if (firebase_token) {
        updateData.firebase_token = firebase_token;
        await User.findOneAndUpdate(
          { mobile },
          { firebase_token: firebase_token },
          { new: true }
        );
      }

      // Generate JWT token and return user details
      const userTokenData = generateUserTokenData(existingUser);
      const token = generateToken(userTokenData);

      // Fetch updated user to get latest firebase_token
      const updatedUser = await User.findOne({ mobile });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            user_id: updatedUser.user_id,
            name: updatedUser.name,
            mobile: updatedUser.mobile,
            role_id: updatedUser.role_id,
            login_permission_status: updatedUser.login_permission_status,
            status: updatedUser.status,
            firebase_token: updatedUser.firebase_token
          },
          token: token
        }
      });
    } else {      // Verify OTP for registration
      

      
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Admin login API
const adminLogin = async (req, res) => {
  try {
    const { email, password, firebase_token } = req.body;
console.log(email, password);
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email and role_id = 1 (admin)
    const user = await User.findOne({ email});

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has password set
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Password not set for this user'
      });
    }

    // Check user status and login permission
    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: 'User is inactive or blocked'
      });
    }

    if (user.login_permission_status !== true) {
      return res.status(403).json({
        success: false,
        message: 'Login permission denied'
      });
    }

    // Verify password
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update firebase_token if provided
    if (firebase_token) {
      await User.findOneAndUpdate(
        { email },
        { firebase_token: firebase_token },
        { new: true }
      );
    }

    // Generate token with custom expiration
    const userData = generateUserTokenData(user);
    const token = generateTokenWithExpiry(userData);

    // Fetch updated user to get latest firebase_token
    const updatedUser = await User.findOne({ email });

    // Return admin details and token
    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          user_id: updatedUser.user_id,
          name: updatedUser.name,
          email: updatedUser.email,
          role_id: updatedUser.role_id,
          mobile: updatedUser.mobile,
          login_permission_status: updatedUser.login_permission_status,
          status: updatedUser.status,
          firebase_token: updatedUser.firebase_token
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  login,
  verifyOTP,
  adminLogin
}; 