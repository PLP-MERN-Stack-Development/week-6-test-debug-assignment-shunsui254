// Posts CRUD Operations E2E Tests
describe('Posts CRUD Operations', () => {
  let testUser;
  let authToken;

  before(() => {
    cy.cleanDatabase();
  });

  beforeEach(() => {
    // Create and login test user
    cy.createUser({
      name: 'Post Author',
      email: 'author@example.com',
      password: 'Password123!'
    }).then((response) => {
      testUser = response.body.data.user;
      authToken = response.body.data.token;
      cy.setLocalStorage('token', authToken);
      cy.setLocalStorage('user', JSON.stringify(testUser));
    });

    cy.visit('/');
  });

  afterEach(() => {
    cy.cleanDatabase();
  });

  describe('Create Posts', () => {
    it('should successfully create a new post', () => {
      cy.visit('/posts/create');
      cy.waitForPageLoad();

      // Fill post creation form
      cy.getByTestId('post-title-input').type('My First Blog Post');
      cy.getByTestId('post-content-textarea').type('This is the content of my first blog post. It contains some interesting information about testing.');
      cy.getByTestId('post-category-select').select('Technology');
      cy.getByTestId('post-tags-input').type('testing, cypress, javascript');

      // Intercept post creation API call
      cy.intercept('POST', '**/posts').as('createPost');

      cy.getByTestId('submit-button').click();

      cy.waitForAPI('@createPost');

      // Should redirect to post detail page
      cy.url().should('include', '/posts/');
      cy.getByTestId('post-title').should('contain', 'My First Blog Post');
      cy.getByTestId('post-content').should('contain', 'This is the content of my first blog post');
      cy.getByTestId('post-author').should('contain', 'Post Author');

      cy.takeNamedScreenshot('post-created-successfully');
    });

    it('should show validation errors for invalid post data', () => {
      cy.visit('/posts/create');

      // Submit empty form
      cy.getByTestId('submit-button').click();

      cy.getByTestId('title-error').should('contain', 'Title is required');
      cy.getByTestId('content-error').should('contain', 'Content is required');

      // Test title length validation
      cy.getByTestId('post-title-input').type('a'); // Too short
      cy.getByTestId('submit-button').click();
      cy.getByTestId('title-error').should('contain', 'Title must be at least 3 characters');

      // Test content length validation
      cy.getByTestId('post-content-textarea').type('short'); // Too short
      cy.getByTestId('submit-button').click();
      cy.getByTestId('content-error').should('contain', 'Content must be at least 10 characters');

      cy.takeNamedScreenshot('post-creation-validation-errors');
    });

    it('should create post with all optional fields', () => {
      cy.visit('/posts/create');

      cy.getByTestId('post-title-input').type('Complete Post Example');
      cy.getByTestId('post-content-textarea').type('This is a complete post with all fields filled out properly.');
      cy.getByTestId('post-excerpt-textarea').type('A brief summary of the post content.');
      cy.getByTestId('post-category-select').select('Technology');
      cy.getByTestId('post-tags-input').type('complete, example, test');
      cy.getByTestId('post-featured-checkbox').check();

      cy.intercept('POST', '**/posts').as('createPost');
      cy.getByTestId('submit-button').click();

      cy.waitForAPI('@createPost');

      cy.getByTestId('post-title').should('contain', 'Complete Post Example');
      cy.getByTestId('post-excerpt').should('contain', 'A brief summary');
      cy.getByTestId('post-featured-badge').should('be.visible');
      cy.getByTestId('post-tags').should('contain', 'complete');
      cy.getByTestId('post-tags').should('contain', 'example');
    });
  });

  describe('Read Posts', () => {
    beforeEach(() => {
      // Create test posts
      cy.createPost({
        title: 'First Test Post',
        content: 'Content of the first test post for reading tests.',
        category: 'Technology',
        tags: ['test', 'reading'],
        published: true
      }, authToken);

      cy.createPost({
        title: 'Second Test Post',
        content: 'Content of the second test post for reading tests.',
        category: 'Lifestyle',
        tags: ['test', 'reading'],
        published: true
      }, authToken);

      cy.createPost({
        title: 'Draft Post',
        content: 'This is a draft post that should not appear in public listings.',
        category: 'Technology',
        tags: ['draft'],
        published: false
      }, authToken);
    });

    it('should display all published posts on posts listing page', () => {
      cy.visit('/posts');
      cy.waitForPageLoad();

      // Should show published posts
      cy.getByTestId('post-card').should('have.length', 2);
      cy.getByTestId('post-card').first().should('contain', 'First Test Post');
      cy.getByTestId('post-card').last().should('contain', 'Second Test Post');

      // Should not show draft posts
      cy.getByTestId('post-card').should('not.contain', 'Draft Post');

      cy.takeNamedScreenshot('posts-listing-page');
    });

    it('should display individual post details correctly', () => {
      cy.visit('/posts');
      
      // Click on first post
      cy.getByTestId('post-card').first().click();

      cy.url().should('include', '/posts/');
      cy.getByTestId('post-title').should('contain', 'First Test Post');
      cy.getByTestId('post-content').should('contain', 'Content of the first test post');
      cy.getByTestId('post-author').should('contain', 'Post Author');
      cy.getByTestId('post-category').should('contain', 'Technology');
      cy.getByTestId('post-tags').should('contain', 'test');
      cy.getByTestId('post-date').should('be.visible');

      cy.takeNamedScreenshot('post-detail-page');
    });

    it('should filter posts by category', () => {
      cy.visit('/posts');

      cy.getByTestId('category-filter').select('Technology');
      cy.getByTestId('apply-filters-button').click();

      cy.getByTestId('post-card').should('have.length', 1);
      cy.getByTestId('post-card').should('contain', 'First Test Post');

      cy.getByTestId('category-filter').select('Lifestyle');
      cy.getByTestId('apply-filters-button').click();

      cy.getByTestId('post-card').should('have.length', 1);
      cy.getByTestId('post-card').should('contain', 'Second Test Post');
    });

    it('should search posts by title and content', () => {
      cy.visit('/posts');

      cy.getByTestId('search-input').type('First');
      cy.getByTestId('search-button').click();

      cy.getByTestId('post-card').should('have.length', 1);
      cy.getByTestId('post-card').should('contain', 'First Test Post');

      cy.getByTestId('search-input').clear().type('second');
      cy.getByTestId('search-button').click();

      cy.getByTestId('post-card').should('have.length', 1);
      cy.getByTestId('post-card').should('contain', 'Second Test Post');
    });

    it('should handle pagination correctly', () => {
      // Create many posts to test pagination
      for (let i = 1; i <= 15; i++) {
        cy.createPost({
          title: `Pagination Test Post ${i}`,
          content: `Content for pagination test post number ${i}.`,
          category: 'Technology',
          published: true
        }, authToken);
      }

      cy.visit('/posts');

      // Should show first page of posts (10 per page)
      cy.getByTestId('post-card').should('have.length', 10);
      cy.getByTestId('pagination-info').should('contain', 'Page 1 of');

      // Navigate to next page
      cy.getByTestId('next-page-button').click();
      cy.getByTestId('post-card').should('have.length.greaterThan', 0);
      cy.getByTestId('pagination-info').should('contain', 'Page 2 of');
    });
  });

  describe('Update Posts', () => {
    let postId;

    beforeEach(() => {
      cy.createPost({
        title: 'Post to Update',
        content: 'Original content that will be updated.',
        category: 'Technology',
        tags: ['original'],
        published: true
      }, authToken).then((response) => {
        postId = response.body.data._id;
      });
    });

    it('should successfully update post details', () => {
      cy.visit(`/posts/${postId}/edit`);
      cy.waitForPageLoad();

      // Form should be pre-filled with existing data
      cy.getByTestId('post-title-input').should('have.value', 'Post to Update');
      cy.getByTestId('post-content-textarea').should('contain.value', 'Original content');

      // Update the post
      cy.getByTestId('post-title-input').clear().type('Updated Post Title');
      cy.getByTestId('post-content-textarea').clear().type('This content has been updated with new information.');
      cy.getByTestId('post-category-select').select('Lifestyle');
      cy.getByTestId('post-tags-input').clear().type('updated, modified');

      cy.intercept('PUT', `**/posts/${postId}`).as('updatePost');
      cy.getByTestId('submit-button').click();

      cy.waitForAPI('@updatePost');

      // Should redirect to updated post
      cy.url().should('include', `/posts/${postId}`);
      cy.getByTestId('post-title').should('contain', 'Updated Post Title');
      cy.getByTestId('post-content').should('contain', 'This content has been updated');
      cy.getByTestId('post-category').should('contain', 'Lifestyle');

      cy.takeNamedScreenshot('post-updated-successfully');
    });

    it('should show validation errors when updating with invalid data', () => {
      cy.visit(`/posts/${postId}/edit`);

      cy.getByTestId('post-title-input').clear();
      cy.getByTestId('post-content-textarea').clear();

      cy.getByTestId('submit-button').click();

      cy.getByTestId('title-error').should('contain', 'Title is required');
      cy.getByTestId('content-error').should('contain', 'Content is required');
    });

    it('should only allow post author to edit their posts', () => {
      // Create another user
      cy.createUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123!'
      }).then((response) => {
        const otherToken = response.body.data.token;
        const otherUser = response.body.data.user;
        
        cy.setLocalStorage('token', otherToken);
        cy.setLocalStorage('user', JSON.stringify(otherUser));

        cy.visit(`/posts/${postId}/edit`);

        // Should show unauthorized message
        cy.getByTestId('error-message').should('contain', 'Unauthorized to edit this post');
        cy.url().should('include', '/posts');
      });
    });
  });

  describe('Delete Posts', () => {
    let postId;

    beforeEach(() => {
      cy.createPost({
        title: 'Post to Delete',
        content: 'This post will be deleted during testing.',
        category: 'Technology',
        published: true
      }, authToken).then((response) => {
        postId = response.body.data._id;
      });
    });

    it('should successfully delete a post', () => {
      cy.visit(`/posts/${postId}`);

      cy.getByTestId('delete-post-button').click();

      // Should show confirmation dialog
      cy.getByTestId('delete-confirmation-dialog').should('be.visible');
      cy.getByTestId('delete-confirmation-message').should('contain', 'Are you sure you want to delete this post?');

      cy.intercept('DELETE', `**/posts/${postId}`).as('deletePost');
      cy.getByTestId('confirm-delete-button').click();

      cy.waitForAPI('@deletePost');

      // Should redirect to posts listing
      cy.url().should('include', '/posts');
      cy.getByTestId('success-message').should('contain', 'Post deleted successfully');

      // Post should no longer appear in listing
      cy.getByTestId('post-card').should('not.contain', 'Post to Delete');

      cy.takeNamedScreenshot('post-deleted-successfully');
    });

    it('should cancel delete operation when user cancels', () => {
      cy.visit(`/posts/${postId}`);

      cy.getByTestId('delete-post-button').click();
      cy.getByTestId('delete-confirmation-dialog').should('be.visible');

      cy.getByTestId('cancel-delete-button').click();

      cy.getByTestId('delete-confirmation-dialog').should('not.exist');
      cy.url().should('include', `/posts/${postId}`);
      cy.getByTestId('post-title').should('contain', 'Post to Delete');
    });

    it('should only allow post author to delete their posts', () => {
      // Create another user
      cy.createUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123!'
      }).then((response) => {
        const otherToken = response.body.data.token;
        const otherUser = response.body.data.user;
        
        cy.setLocalStorage('token', otherToken);
        cy.setLocalStorage('user', JSON.stringify(otherUser));

        cy.visit(`/posts/${postId}`);

        // Delete button should not be visible for non-author
        cy.getByTestId('delete-post-button').should('not.exist');
      });
    });
  });

  describe('Post Interactions', () => {
    let postId;

    beforeEach(() => {
      cy.createPost({
        title: 'Interactive Post',
        content: 'This post will be used for testing interactions.',
        category: 'Technology',
        published: true
      }, authToken).then((response) => {
        postId = response.body.data._id;
      });
    });

    it('should handle post sharing functionality', () => {
      cy.visit(`/posts/${postId}`);

      cy.getByTestId('share-post-button').click();

      // Should show share options
      cy.getByTestId('share-options').should('be.visible');
      cy.getByTestId('copy-link-button').should('be.visible');
      cy.getByTestId('share-twitter-button').should('be.visible');
      cy.getByTestId('share-facebook-button').should('be.visible');

      // Test copy link functionality
      cy.getByTestId('copy-link-button').click();
      cy.getByTestId('success-message').should('contain', 'Link copied to clipboard');
    });

    it('should display related posts', () => {
      // Create related posts
      cy.createPost({
        title: 'Related Post 1',
        content: 'This is a related post in the same category.',
        category: 'Technology',
        published: true
      }, authToken);

      cy.createPost({
        title: 'Related Post 2',
        content: 'Another related post with similar tags.',
        category: 'Technology',
        tags: ['technology', 'related'],
        published: true
      }, authToken);

      cy.visit(`/posts/${postId}`);

      cy.getByTestId('related-posts-section').should('be.visible');
      cy.getByTestId('related-post-card').should('have.length.greaterThan', 0);
    });
  });

  describe('Responsive Design', () => {
    let postId;

    beforeEach(() => {
      cy.createPost({
        title: 'Responsive Test Post',
        content: 'Testing responsive design on different screen sizes.',
        category: 'Technology',
        published: true
      }, authToken).then((response) => {
        postId = response.body.data._id;
      });
    });

    it('should work correctly on mobile devices', () => {
      cy.setMobileViewport();

      cy.visit('/posts');
      cy.getByTestId('mobile-menu-toggle').should('be.visible');
      cy.getByTestId('post-card').should('be.visible');

      // Test mobile navigation
      cy.getByTestId('mobile-menu-toggle').click();
      cy.getByTestId('mobile-menu').should('be.visible');
      cy.getByTestId('mobile-menu-item').should('have.length.greaterThan', 0);

      cy.takeNamedScreenshot('mobile-posts-listing');
    });

    it('should work correctly on tablet devices', () => {
      cy.setTabletViewport();

      cy.visit('/posts');
      cy.getByTestId('post-card').should('be.visible');
      cy.getByTestId('sidebar').should('be.visible');

      cy.takeNamedScreenshot('tablet-posts-listing');
    });

    it('should work correctly on desktop', () => {
      cy.setDesktopViewport();

      cy.visit('/posts');
      cy.getByTestId('post-card').should('be.visible');
      cy.getByTestId('sidebar').should('be.visible');
      cy.getByTestId('main-navigation').should('be.visible');

      cy.takeNamedScreenshot('desktop-posts-listing');
    });
  });
});
