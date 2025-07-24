const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header
 * @returns {string|null} Token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  generateRefreshToken,
};
