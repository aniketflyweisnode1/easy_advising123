const jwt = require('jsonwebtoken');

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token
const generateToken = (data) => {
  try {
    return jwt.sign(data, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw error;
  }
};

// Generate JWT token with custom expiration
const generateTokenWithExpiry = (data) => {
  try {
    return jwt.sign(data, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw error;
  }
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return { decoded: jwt.verify(token, JWT_SECRET), error: null };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { decoded: null, error: 'TokenExpiredError' };
    }
    return { decoded: null, error: 'InvalidToken' };
  }
};

// Decode JWT token without verification (for debugging)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

// Generate user data for JWT
const generateUserTokenData = (user) => {
  return {
    user_id: user.user_id,
    name: user.name,
    mobile: user.mobile,
    role_id: user.role_id,
    login_permission_status: user.login_permission_status,
    status: user.status
  };
};

// Express JWT authentication middleware
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = {
  generateToken,
  generateTokenWithExpiry,
  verifyToken,
  decodeToken,
  generateUserTokenData,
  auth
}; 