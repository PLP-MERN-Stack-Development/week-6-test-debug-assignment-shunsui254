/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password && password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (password && !/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (password && !/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (password && !/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
const validateUsername = (username) => {
  const errors = [];
  
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username && username.length > 30) {
    errors.push('Username must be less than 30 characters');
  }
  
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

module.exports = {
  isValidEmail,
  validatePassword,
  validateUsername,
  sanitizeString,
  isValidObjectId,
};
