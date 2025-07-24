const Post = require('../models/Post');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');
const { isValidObjectId } = require('../utils/validation');
const logger = require('../utils/logger');

/**
 * Get all posts with pagination and filtering
 * GET /api/posts
 */
const getPosts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    author,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;
  
  // Build query
  const query = {};
  
  // Filter by status (only published posts for non-authenticated users)
  if (status) {
    query.status = status;
  } else if (!req.user || req.user.role !== 'admin') {
    query.status = 'published';
  }
  
  // Filter by category
  if (category && isValidObjectId(category)) {
    query.category = category;
  }
  
  // Filter by author
  if (author && isValidObjectId(author)) {
    query.author = author;
  }
  
  // Search in title and content
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Execute query
  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate('author', 'username firstName lastName avatar')
      .populate('category', 'name slug color')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Post.countDocuments(query),
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(total / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;
  
  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPosts: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    },
  });
});

/**
 * Get single post by ID or slug
 * GET /api/posts/:identifier
 */
const getPost = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  
  // Build query (search by ID or slug)
  const query = isValidObjectId(identifier)
    ? { _id: identifier }
    : { slug: identifier };
  
  // Add status filter for non-authenticated users
  if (!req.user || req.user.role !== 'admin') {
    query.status = 'published';
  }
  
  const post = await Post.findOne(query)
    .populate('author', 'username firstName lastName avatar bio')
    .populate('category', 'name slug color')
    .populate('comments.user', 'username firstName lastName avatar');
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }
  
  // Increment view count
  post.views += 1;
  await post.save();
  
  res.json({
    success: true,
    data: {
      post,
    },
  });
});

/**
 * Create new post
 * POST /api/posts
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, content, category, tags, excerpt, featuredImage, status } = req.body;
  
  // Validate required fields
  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Title and content are required',
    });
  }
  
  // Validate category if provided
  if (category) {
    if (!isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
    }
    
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found',
      });
    }
  }
  
  // Create post
  const post = new Post({
    title,
    content,
    author: req.user._id,
    category: category || null,
    tags: tags || [],
    excerpt,
    featuredImage,
    status: status || 'draft',
  });
  
  await post.save();
  
  // Populate author and category
  await post.populate('author', 'username firstName lastName avatar');
  await post.populate('category', 'name slug color');
  
  logger.info(`New post created: ${post.title} by ${req.user.email}`);
  
  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: {
      post,
    },
  });
});

/**
 * Update post
 * PUT /api/posts/:id
 */
const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, category, tags, excerpt, featuredImage, status } = req.body;
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid post ID',
    });
  }
  
  const post = await Post.findById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }
  
  // Check if user owns the post or is admin
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this post',
    });
  }
  
  // Validate category if provided
  if (category && category !== post.category?.toString()) {
    if (!isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
    }
    
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found',
      });
    }
  }
  
  // Update fields
  if (title) post.title = title;
  if (content) post.content = content;
  if (category !== undefined) post.category = category || null;
  if (tags) post.tags = tags;
  if (excerpt !== undefined) post.excerpt = excerpt;
  if (featuredImage !== undefined) post.featuredImage = featuredImage;
  if (status) post.status = status;
  
  await post.save();
  
  // Populate author and category
  await post.populate('author', 'username firstName lastName avatar');
  await post.populate('category', 'name slug color');
  
  logger.info(`Post updated: ${post.title} by ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Post updated successfully',
    data: {
      post,
    },
  });
});

/**
 * Delete post
 * DELETE /api/posts/:id
 */
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid post ID',
    });
  }
  
  const post = await Post.findById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }
  
  // Check if user owns the post or is admin
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this post',
    });
  }
  
  await Post.findByIdAndDelete(id);
  
  logger.info(`Post deleted: ${post.title} by ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
});

/**
 * Like/Unlike post
 * POST /api/posts/:id/like
 */
const toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid post ID',
    });
  }
  
  const post = await Post.findById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }
  
  const userId = req.user._id;
  const likeIndex = post.likes.findIndex(like => like.user.toString() === userId.toString());
  
  let message;
  if (likeIndex > -1) {
    // Unlike
    post.likes.splice(likeIndex, 1);
    message = 'Post unliked';
  } else {
    // Like
    post.likes.push({ user: userId });
    message = 'Post liked';
  }
  
  await post.save();
  
  res.json({
    success: true,
    message,
    data: {
      likeCount: post.likes.length,
      isLiked: likeIndex === -1,
    },
  });
});

/**
 * Add comment to post
 * POST /api/posts/:id/comments
 */
const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Comment content is required',
    });
  }
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid post ID',
    });
  }
  
  const post = await Post.findById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }
  
  // Add comment
  const comment = {
    user: req.user._id,
    content: content.trim(),
  };
  
  post.comments.push(comment);
  await post.save();
  
  // Populate the new comment
  await post.populate('comments.user', 'username firstName lastName avatar');
  
  const newComment = post.comments[post.comments.length - 1];
  
  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: {
      comment: newComment,
    },
  });
});

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
};
