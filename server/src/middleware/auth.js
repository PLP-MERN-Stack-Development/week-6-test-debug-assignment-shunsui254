const User = require('../models/User');
const { verifyToken, extractTokenFromHeader } = require('../utils/auth');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.message === 'Invalid token' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without user if token is invalid
    next();
  }
};

/**
 * Authorization middleware
 * Checks if user has required role
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
};
