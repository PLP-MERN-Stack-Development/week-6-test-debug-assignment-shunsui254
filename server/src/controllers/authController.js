const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const { validatePassword, validateUsername, isValidEmail } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  
  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required',
    });
  }
  
  // Validate email
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }
  
  // Validate username
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid username',
      errors: usernameValidation.errors,
    });
  }
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet requirements',
      errors: passwordValidation.errors,
    });
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  
  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Username';
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }
  
  // Create new user
  const user = new User({
    username,
    email,
    password,
    firstName,
    lastName,
  });
  
  await user.save();
  
  // Generate token
  const token = generateToken(user);
  
  logger.info(`New user registered: ${user.email}`);
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
    },
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }
  
  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }
  
  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }
  
  // Generate token
  const token = generateToken(user);
  
  // Remove password from response
  user.password = undefined;
  
  logger.info(`User logged in: ${user.email}`);
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
    },
  });
});

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, bio } = req.body;
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  // Update fields
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (bio !== undefined) user.bio = bio;
  
  await user.save();
  
  logger.info(`User profile updated: ${user.email}`);
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
    });
  }
  
  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'New password does not meet requirements',
      errors: passwordValidation.errors,
    });
  }
  
  const user = await User.findById(req.user._id).select('+password');
  
  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  logger.info(`Password changed for user: ${user.email}`);
  
  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
