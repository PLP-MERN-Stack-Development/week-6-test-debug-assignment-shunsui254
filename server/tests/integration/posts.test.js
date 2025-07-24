// posts.test.js - Integration tests for posts API endpoints

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const Category = require('../../src/models/Category');
const { generateToken } = require('../../src/utils/auth');

let token;
let userId;
let postId;
let categoryId;
let adminToken;
let adminUserId;

describe('Posts API', () => {
  // Setup test data before all tests
  beforeAll(async () => {
    // Create a test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });
    userId = user._id;
    token = generateToken(user);

    // Create an admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      role: 'admin',
    });
    adminUserId = adminUser._id;
    adminToken = generateToken(adminUser);

    // Create a test category
    const category = await Category.create({
      name: 'Technology',
      description: 'Tech related posts',
      slug: 'technology',
    });
    categoryId = category._id;

    // Create a test post
    const post = await Post.create({
      title: 'Test Post',
      content: 'This is a test post content for integration testing',
      author: userId,
      category: categoryId,
      status: 'published',
    });
    postId = post._id;
  });

  describe('POST /api/posts', () => {
    it('should create a new post when authenticated', async () => {
      const newPost = {
        title: 'New Integration Test Post',
        content: 'This is a new test post content created during integration testing',
        category: categoryId,
        tags: ['test', 'integration'],
        status: 'published',
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(newPost);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post).toHaveProperty('_id');
      expect(res.body.data.post.title).toBe(newPost.title);
      expect(res.body.data.post.content).toBe(newPost.content);
      expect(res.body.data.post.author._id).toBe(userId.toString());
      expect(res.body.data.post.category._id).toBe(categoryId.toString());
    });

    it('should return 401 if not authenticated', async () => {
      const newPost = {
        title: 'Unauthorized Post',
        content: 'This should not be created without authentication',
      };

      const res = await request(app)
        .post('/api/posts')
        .send(newPost);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token');
    });

    it('should return 400 if validation fails', async () => {
      const invalidPost = {
        title: 'Hi', // Too short
        content: 'Short', // Too short
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidPost);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should create draft post by default', async () => {
      const draftPost = {
        title: 'Draft Test Post',
        content: 'This is a draft post for testing purposes',
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(draftPost);

      expect(res.status).toBe(201);
      expect(res.body.data.post.status).toBe('draft');
    });
  });

  describe('GET /api/posts', () => {
    it('should return published posts with pagination', async () => {
      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.posts)).toBeTruthy();
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.currentPage).toBe(1);
      expect(res.body.data.pagination.totalPosts).toBeGreaterThanOrEqual(1);
    });

    it('should filter posts by category', async () => {
      const res = await request(app)
        .get(`/api/posts?category=${categoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts.length).toBeGreaterThan(0);
      
      // All posts should have the specified category
      res.body.data.posts.forEach(post => {
        expect(post.category._id).toBe(categoryId.toString());
      });
    });

    it('should search posts by title and content', async () => {
      const res = await request(app)
        .get('/api/posts?search=test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts.length).toBeGreaterThan(0);
    });

    it('should paginate results correctly', async () => {
      const page1 = await request(app)
        .get('/api/posts?page=1&limit=1');
      
      const page2 = await request(app)
        .get('/api/posts?page=2&limit=1');

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      expect(page1.body.data.posts.length).toBe(1);
      
      if (page1.body.data.pagination.totalPosts > 1) {
        expect(page2.body.data.posts.length).toBe(1);
        expect(page1.body.data.posts[0]._id).not.toBe(page2.body.data.posts[0]._id);
      }
    });

    it('should sort posts correctly', async () => {
      const res = await request(app)
        .get('/api/posts?sortBy=title&sortOrder=asc');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      if (res.body.data.posts.length > 1) {
        const titles = res.body.data.posts.map(post => post.title);
        const sortedTitles = [...titles].sort();
        expect(titles).toEqual(sortedTitles);
      }
    });
  });

  describe('GET /api/posts/:identifier', () => {
    it('should return a post by ID', async () => {
      const res = await request(app)
        .get(`/api/posts/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post._id).toBe(postId.toString());
      expect(res.body.data.post.title).toBe('Test Post');
      expect(res.body.data.post.author).toBeDefined();
      expect(res.body.data.post.category).toBeDefined();
    });

    it('should return a post by slug', async () => {
      // Create a post with a specific slug
      const postWithSlug = await Post.create({
        title: 'Post with Custom Slug',
        content: 'This post has a custom slug for testing',
        author: userId,
        slug: 'custom-test-slug',
        status: 'published',
      });

      const res = await request(app)
        .get('/api/posts/custom-test-slug');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.slug).toBe('custom-test-slug');
    });

    it('should increment view count', async () => {
      const initialRes = await request(app)
        .get(`/api/posts/${postId}`);
      
      const initialViews = initialRes.body.data.post.views;

      const secondRes = await request(app)
        .get(`/api/posts/${postId}`);

      expect(secondRes.body.data.post.views).toBe(initialViews + 1);
    });

    it('should return 404 for non-existent post', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/posts/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update a post when authenticated as author', async () => {
      const updates = {
        title: 'Updated Test Post Title',
        content: 'This content has been updated during integration testing',
        excerpt: 'Updated excerpt',
      };

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.title).toBe(updates.title);
      expect(res.body.data.post.content).toBe(updates.content);
      expect(res.body.data.post.excerpt).toBe(updates.excerpt);
    });

    it('should allow admin to update any post', async () => {
      const updates = {
        title: 'Admin Updated Post',
      };

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.title).toBe(updates.title);
    });

    it('should return 401 if not authenticated', async () => {
      const updates = {
        title: 'Unauthorized Update',
      };

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .send(updates);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 if not the author or admin', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123!',
      });
      const anotherToken = generateToken(anotherUser);

      const updates = {
        title: 'Forbidden Update',
      };

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(updates);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid validation', async () => {
      const invalidUpdates = {
        title: 'Hi', // Too short
      };

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidUpdates);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 if not the author or admin', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'deletetest',
        email: 'deletetest@example.com',
        password: 'Password123!',
      });
      const anotherToken = generateToken(anotherUser);

      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/posts/:id/like', () => {
    it('should like a post when authenticated', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isLiked).toBe(true);
      expect(res.body.data.likeCount).toBeGreaterThan(0);
    });

    it('should unlike a post when already liked', async () => {
      // First like the post
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${token}`);

      // Then unlike it
      const res = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isLiked).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/like`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/posts/:id/comments', () => {
    it('should add a comment when authenticated', async () => {
      const comment = {
        content: 'This is a test comment for integration testing',
      };

      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(comment);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe(comment.content);
      expect(res.body.data.comment.user._id).toBe(userId.toString());
    });

    it('should return 400 for empty comment', async () => {
      const comment = {
        content: '',
      };

      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(comment);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
      const comment = {
        content: 'Unauthorized comment',
      };

      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .send(comment);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
}); 