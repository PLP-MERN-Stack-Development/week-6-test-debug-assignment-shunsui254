const express = require('express');
const { body, query } = require('express-validator');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
} = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const createPostValidation = [
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('content')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Content must be between 10 and 5000 characters'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('excerpt')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Excerpt must be less than 200 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
];

const updatePostValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('content')
    .optional()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Content must be between 10 and 5000 characters'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('excerpt')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Excerpt must be less than 200 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
];

const getPostsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'views', 'publishedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const addCommentValidation = [
  body('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),
];

// Routes
router.get('/', getPostsValidation, validate, optionalAuth, getPosts);
router.get('/:identifier', optionalAuth, getPost);
router.post('/', authenticate, createPostValidation, validate, createPost);
router.put('/:id', authenticate, updatePostValidation, validate, updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comments', authenticate, addCommentValidation, validate, addComment);

module.exports = router;
