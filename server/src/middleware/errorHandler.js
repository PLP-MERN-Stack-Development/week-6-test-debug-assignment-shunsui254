const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (error, req, res, next) => {
  let statusCode = error.status || error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  
  // Log error details
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(error.errors).map(err => err.message);
    message = 'Validation Error';
    
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    statusCode = 400;
    const field = Object.keys(error.keyValue)[0];
    message = `${field} already exists`;
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // MongoDB connection errors
  if (error.name === 'MongoNetworkError') {
    statusCode = 503;
    message = 'Database connection error';
  }
  
  // Rate limiting errors
  if (error.message && error.message.includes('Too many requests')) {
    statusCode = 429;
  }
  
  const response = {
    success: false,
    message,
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }
  
  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
};

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
