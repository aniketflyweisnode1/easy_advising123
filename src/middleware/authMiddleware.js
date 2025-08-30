const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User.model');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const { decoded, error } = verifyToken(token);
    if (error === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Check if user still exists and is active
    const user = await User.findOne({ 
      user_id: decoded.user_id,
      status: 1,
      login_permission_status: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or access denied'
      });
    }

    // Add user info to request
    req.user = {
      user_id: user.user_id,
      name: user.name,
      mobile: user.mobile,
      role_id: user.role_id,
      login_permission_status: user.login_permission_status,
      status: user.status
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findOne({ 
          user_id: decoded.user_id,
          status: 1,
          login_permission_status: true
        });

        if (user) {
          req.user = {
            user_id: user.user_id,
            name: user.name,
            mobile: user.mobile,
            role_id: user.role_id,
            login_permission_status: user.login_permission_status,
            status: user.status
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = {
  auth,
  optionalAuth
}; 