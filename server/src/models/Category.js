const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters long'],
    maxlength: [50, 'Category name must be less than 50 characters'],
  },
  description: {
    type: String,
    maxlength: [200, 'Description must be less than 200 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
    default: '#3B82F6',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for post count
categorySchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

module.exports = mongoose.model('Category', categorySchema);
