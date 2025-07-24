const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [100, 'Title must be less than 100 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [10, 'Content must be at least 10 characters long'],
    maxlength: [5000, 'Content must be less than 5000 characters'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  excerpt: {
    type: String,
    maxlength: [200, 'Excerpt must be less than 200 characters'],
  },
  featuredImage: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment must be less than 500 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ slug: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });

// Generate slug before saving
postSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Instance method to check if user liked the post
postSchema.methods.isLikedByUser = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Static method to find published posts
postSchema.statics.findPublished = function() {
  return this.find({ status: 'published' }).sort({ publishedAt: -1 });
};

module.exports = mongoose.model('Post', postSchema);
