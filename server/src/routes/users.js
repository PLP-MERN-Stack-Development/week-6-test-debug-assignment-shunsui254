const express = require('express');
const { query } = require('express-validator');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validation');
const { isValidObjectId } = require('../utils/validation');

const router = express.Router();

// Validation rules
const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Search term is required'),
];

/**
 * Get all users (admin only)
 * GET /api/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;
  
  // Build query
  const query = {};
  
  // Search in username, email, firstName, lastName
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Execute query
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query),
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(total / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;
  
  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    },
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }
  
  const user = await User.findById(id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  res.json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * Update user (admin only)
 * PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, role } = req.body;
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }
  
  const user = await User.findById(id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  // Update fields
  if (isActive !== undefined) user.isActive = isActive;
  if (role !== undefined) user.role = role;
  
  await user.save();
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user,
    },
  });
});

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }
  
  // Prevent admin from deleting themselves
  if (id === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account',
    });
  }
  
  const user = await User.findById(id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  await User.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Routes
router.get('/', authenticate, authorize(['admin']), getUsersValidation, validate, getUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, authorize(['admin']), updateUser);
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

module.exports = router;
