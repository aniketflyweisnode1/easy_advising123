const User = require('../models/User.model');
const { generateOTP, storeOTP, verifyOTP: verifyStoredOTP } = require('../utils/otpUtils');
const { generateToken, generateTokenWithExpiry, generateUserTokenData } = require('../utils/jwtUtils');

// Send OTP (mock function - replace with actual SMS service)
const sendOTP = async (mobile, otp) => {
  // TODO: Integrate with actual SMS service
  console.log(`OTP ${otp} sent to ${mobile}`);
  return true;
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
      // User is registered - send OTP for login
      const otp = generateOTP();
      
      // Store OTP for verification
      const otpStored = await storeOTP(mobile, otp, 'login', 1); // Default OTP type ID
      if (!otpStored) {
        return res.status(500).json({
          success: false,
          message: 'Failed to store OTP'
        });
      }
      
      const otpSent = await sendOTP(mobile, otp);
     
      if (otpSent) {
        return res.status(200).json({
          success: true,
          message: 'OTP sent successfully for login',
          data: {
            OTP: otp,
            user_id: existingUser.user_id,
            name: existingUser.name,
            role_id: existingUser.role_id,
            mobile: existingUser.mobile,
            isRegistered: true
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP'
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
    const { mobile, otp } = req.body;

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

      // Generate JWT token and return user details
      const userTokenData = generateUserTokenData(existingUser);
      const token = generateToken(userTokenData);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            user_id: existingUser.user_id,
            name: existingUser.name,
            mobile: existingUser.mobile,
            role_id: existingUser.role_id,
            login_permission_status: existingUser.login_permission_status,
            status: existingUser.status
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
    const { email, password } = req.body;
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

    // Generate token with custom expiration
    const userData = generateUserTokenData(user);
    const token = generateTokenWithExpiry(userData);

    // Return admin details and token
    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          mobile: user.mobile,
          login_permission_status: user.login_permission_status,
          status: user.status
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