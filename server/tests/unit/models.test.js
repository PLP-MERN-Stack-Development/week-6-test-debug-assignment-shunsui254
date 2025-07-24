// models.test.js - Unit tests for Mongoose models

const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const Category = require('../../src/models/Category');

describe('Models', () => {
  describe('User Model', () => {
    it('should create a valid user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.isActive).toBe(true); // Default value
      expect(savedUser.role).toBe('user'); // Default value
    });

    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'PlainTextPassword',
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50); // Hashed password is longer
    });

    it('should compare passwords correctly', async () => {
      const password = 'TestPassword123!';
      const userData = {
        username: 'testuser3',
        email: 'test3@example.com',
        password,
      };

      const user = new User(userData);
      await user.save();

      const isValid = await user.comparePassword(password);
      const isInvalid = await user.comparePassword('WrongPassword');

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should not include password in JSON output', async () => {
      const userData = {
        username: 'testuser4',
        email: 'test4@example.com',
        password: 'Password123!',
      };

      const user = new User(userData);
      await user.save();

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.username).toBeDefined();
      expect(userJSON.email).toBeDefined();
    });

    it('should generate full name virtual', () => {
      const user = new User({
        username: 'testuser5',
        email: 'test5@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.fullName).toBe('John Doe');
    });

    it('should handle empty names in full name virtual', () => {
      const user = new User({
        username: 'testuser6',
        email: 'test6@example.com',
        password: 'Password123!',
      });

      expect(user.fullName).toBe('');
    });

    it('should validate required fields', async () => {
      const user = new User({});

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should validate email format', async () => {
      const user = new User({
        username: 'testuser7',
        email: 'invalid-email',
        password: 'Password123!',
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should enforce unique username and email', async () => {
      const userData = {
        username: 'uniqueuser',
        email: 'unique@example.com',
        password: 'Password123!',
      };

      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same username
      const user2 = new User({
        ...userData,
        email: 'different@example.com',
      });

      let error;
      try {
        await user2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });
  });

  describe('Post Model', () => {
    let userId, categoryId;

    beforeEach(async () => {
      // Create a user for testing
      const user = await User.create({
        username: 'postauthor',
        email: 'author@example.com',
        password: 'Password123!',
      });
      userId = user._id;

      // Create a category for testing
      const category = await Category.create({
        name: 'Test Category',
        description: 'A test category',
      });
      categoryId = category._id;
    });

    it('should create a valid post', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is the content of the test post',
        author: userId,
        category: categoryId,
        tags: ['test', 'unit-test'],
        status: 'published',
      };

      const post = new Post(postData);
      const savedPost = await post.save();

      expect(savedPost._id).toBeDefined();
      expect(savedPost.title).toBe(postData.title);
      expect(savedPost.content).toBe(postData.content);
      expect(savedPost.author.toString()).toBe(userId.toString());
      expect(savedPost.category.toString()).toBe(categoryId.toString());
      expect(savedPost.tags).toEqual(postData.tags);
      expect(savedPost.status).toBe(postData.status);
      expect(savedPost.views).toBe(0); // Default value
    });

    it('should generate slug from title', async () => {
      const post = new Post({
        title: 'This is a Test Post Title!',
        content: 'Content for slug generation test',
        author: userId,
      });

      await post.save();

      expect(post.slug).toBe('this-is-a-test-post-title');
    });

    it('should set publishedAt when status changes to published', async () => {
      const post = new Post({
        title: 'Draft to Published Post',
        content: 'This post will be published',
        author: userId,
        status: 'draft',
      });

      await post.save();
      expect(post.publishedAt).toBeUndefined();

      post.status = 'published';
      await post.save();

      expect(post.publishedAt).toBeDefined();
      expect(post.publishedAt).toBeInstanceOf(Date);
    });

    it('should calculate like count virtual', () => {
      const post = new Post({
        title: 'Post with Likes',
        content: 'This post has likes',
        author: userId,
        likes: [
          { user: userId },
          { user: new mongoose.Types.ObjectId() },
        ],
      });

      expect(post.likeCount).toBe(2);
    });

    it('should calculate comment count virtual', () => {
      const post = new Post({
        title: 'Post with Comments',
        content: 'This post has comments',
        author: userId,
        comments: [
          { user: userId, content: 'First comment' },
          { user: new mongoose.Types.ObjectId(), content: 'Second comment' },
        ],
      });

      expect(post.commentCount).toBe(2);
    });

    it('should check if user liked the post', () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const post = new Post({
        title: 'Post with Likes',
        content: 'This post has likes',
        author: userId,
        likes: [
          { user: userId },
          { user: otherUserId },
        ],
      });

      expect(post.isLikedByUser(userId)).toBe(true);
      expect(post.isLikedByUser(new mongoose.Types.ObjectId())).toBe(false);
    });

    it('should validate required fields', async () => {
      const post = new Post({});

      let error;
      try {
        await post.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.content).toBeDefined();
      expect(error.errors.author).toBeDefined();
    });

    it('should enforce title length constraints', async () => {
      const shortTitle = new Post({
        title: 'Hi', // Too short
        content: 'Valid content for testing',
        author: userId,
      });

      const longTitle = new Post({
        title: 'a'.repeat(101), // Too long
        content: 'Valid content for testing',
        author: userId,
      });

      let shortError, longError;

      try {
        await shortTitle.save();
      } catch (err) {
        shortError = err;
      }

      try {
        await longTitle.save();
      } catch (err) {
        longError = err;
      }

      expect(shortError).toBeDefined();
      expect(longError).toBeDefined();
    });

    it('should use findPublished static method', async () => {
      // Create published posts
      await Post.create({
        title: 'Published Post 1',
        content: 'Content 1',
        author: userId,
        status: 'published',
        publishedAt: new Date(),
      });

      await Post.create({
        title: 'Published Post 2',
        content: 'Content 2',
        author: userId,
        status: 'published',
        publishedAt: new Date(),
      });

      // Create draft post
      await Post.create({
        title: 'Draft Post',
        content: 'Draft content',
        author: userId,
        status: 'draft',
      });

      const publishedPosts = await Post.findPublished();

      expect(publishedPosts.length).toBe(2);
      publishedPosts.forEach(post => {
        expect(post.status).toBe('published');
      });
    });
  });

  describe('Category Model', () => {
    it('should create a valid category', async () => {
      const categoryData = {
        name: 'Technology',
        description: 'Posts about technology',
        color: '#3B82F6',
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.description).toBe(categoryData.description);
      expect(savedCategory.color).toBe(categoryData.color);
      expect(savedCategory.isActive).toBe(true); // Default value
    });

    it('should generate slug from name', async () => {
      const category = new Category({
        name: 'Web Development & Design',
        description: 'Posts about web development',
      });

      await category.save();

      expect(category.slug).toBe('web-development-design');
    });

    it('should use default color', async () => {
      const category = new Category({
        name: 'Default Color Category',
        description: 'Category without specified color',
      });

      await category.save();

      expect(category.color).toBe('#3B82F6');
    });

    it('should validate color format', async () => {
      const invalidCategory = new Category({
        name: 'Invalid Color',
        description: 'Category with invalid color',
        color: 'not-a-hex-color',
      });

      let error;
      try {
        await invalidCategory.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.color).toBeDefined();
    });

    it('should validate required fields', async () => {
      const category = new Category({});

      let error;
      try {
        await category.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    it('should enforce unique name', async () => {
      const categoryName = 'Unique Category';

      // Create first category
      await Category.create({
        name: categoryName,
        description: 'First category',
      });

      // Try to create second category with same name
      const duplicateCategory = new Category({
        name: categoryName,
        description: 'Duplicate category',
      });

      let error;
      try {
        await duplicateCategory.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });
  });
});
