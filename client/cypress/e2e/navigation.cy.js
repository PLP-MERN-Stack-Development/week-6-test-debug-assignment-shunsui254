// Navigation and Routing E2E Tests
describe('Navigation and Routing', () => {
  let testUser;
  let authToken;

  before(() => {
    cy.cleanDatabase();
  });

  beforeEach(() => {
    // Create test user for authenticated routes
    cy.createUser({
      name: 'Navigation Tester',
      email: 'nav@example.com',
      password: 'Password123!'
    }).then((response) => {
      testUser = response.body.data.user;
      authToken = response.body.data.token;
    });
  });

  afterEach(() => {
    cy.cleanDatabase();
  });

  describe('Public Routes', () => {
    it('should navigate to home page correctly', () => {
      cy.visit('/');
      cy.waitForPageLoad();

      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.getByTestId('hero-section').should('be.visible');
      cy.getByTestId('featured-posts').should('be.visible');
      cy.getByTestId('main-navigation').should('be.visible');

      // Check navigation links
      cy.getByTestId('home-nav-link').should('have.class', 'active');
      cy.getByTestId('posts-nav-link').should('be.visible');
      cy.getByTestId('login-nav-link').should('be.visible');

      cy.takeNamedScreenshot('home-page-navigation');
    });

    it('should navigate to posts listing page', () => {
      cy.visit('/');
      
      cy.getByTestId('posts-nav-link').click();

      cy.url().should('include', '/posts');
      cy.getByTestId('posts-listing').should('be.visible');
      cy.getByTestId('posts-nav-link').should('have.class', 'active');

      cy.takeNamedScreenshot('posts-listing-navigation');
    });

    it('should navigate to login page', () => {
      cy.visit('/');

      cy.getByTestId('login-nav-link').click();

      cy.url().should('include', '/login');
      cy.getByTestId('login-form').should('be.visible');
      cy.getByTestId('email-input').should('be.visible');
      cy.getByTestId('password-input').should('be.visible');

      cy.takeNamedScreenshot('login-page-navigation');
    });

    it('should navigate to registration page', () => {
      cy.visit('/login');

      cy.getByTestId('register-link').click();

      cy.url().should('include', '/register');
      cy.getByTestId('registration-form').should('be.visible');
      cy.getByTestId('name-input').should('be.visible');
      cy.getByTestId('email-input').should('be.visible');
      cy.getByTestId('password-input').should('be.visible');

      cy.takeNamedScreenshot('registration-page-navigation');
    });

    it('should handle direct URL navigation', () => {
      const publicRoutes = ['/', '/posts', '/login', '/register', '/about'];

      publicRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', route);
        cy.getByTestId('main-content').should('be.visible');
      });
    });
  });

  describe('Authenticated Routes', () => {
    beforeEach(() => {
      cy.setLocalStorage('token', authToken);
      cy.setLocalStorage('user', JSON.stringify(testUser));
    });

    it('should navigate to dashboard after login', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();

      cy.url().should('include', '/dashboard');
      cy.getByTestId('dashboard-content').should('be.visible');
      cy.getByTestId('welcome-message').should('contain', 'Navigation Tester');
      cy.getByTestId('dashboard-nav-link').should('have.class', 'active');

      cy.takeNamedScreenshot('dashboard-navigation');
    });

    it('should navigate to create post page', () => {
      cy.visit('/dashboard');

      cy.getByTestId('create-post-nav-link').click();

      cy.url().should('include', '/posts/create');
      cy.getByTestId('post-creation-form').should('be.visible');
      cy.getByTestId('post-title-input').should('be.visible');
      cy.getByTestId('post-content-textarea').should('be.visible');

      cy.takeNamedScreenshot('create-post-navigation');
    });

    it('should navigate to user profile page', () => {
      cy.visit('/dashboard');

      cy.getByTestId('profile-nav-link').click();

      cy.url().should('include', '/profile');
      cy.getByTestId('profile-form').should('be.visible');
      cy.getByTestId('profile-name-input').should('have.value', 'Navigation Tester');
      cy.getByTestId('profile-email-input').should('have.value', 'nav@example.com');

      cy.takeNamedScreenshot('profile-page-navigation');
    });

    it('should show authenticated navigation menu', () => {
      cy.visit('/dashboard');

      // Should show user-specific navigation
      cy.getByTestId('user-menu').should('be.visible');
      cy.getByTestId('dashboard-nav-link').should('be.visible');
      cy.getByTestId('create-post-nav-link').should('be.visible');
      cy.getByTestId('profile-nav-link').should('be.visible');
      cy.getByTestId('logout-button').should('be.visible');

      // Should not show guest navigation
      cy.getByTestId('login-nav-link').should('not.exist');
      cy.getByTestId('register-nav-link').should('not.exist');
    });
  });

  describe('Protected Route Redirection', () => {
    it('should redirect unauthenticated users to login page', () => {
      const protectedRoutes = ['/dashboard', '/posts/create', '/profile', '/posts/edit/123'];

      protectedRoutes.forEach(route => {
        cy.visit(route);

        cy.url().should('include', '/login');
        cy.getByTestId('redirect-message').should('contain', 'Please log in to access this page');
        
        // Should preserve intended destination in URL
        cy.url().should('include', `redirect=${encodeURIComponent(route)}`);
      });
    });

    it('should redirect to intended page after login', () => {
      cy.visit('/dashboard'); // Should redirect to login with redirect param

      cy.url().should('include', '/login');
      cy.url().should('include', 'redirect=%2Fdashboard');

      // Login user
      cy.fillLoginForm('nav@example.com', 'Password123!');
      cy.intercept('POST', '**/auth/login').as('loginUser');
      cy.submitForm();
      cy.waitForAPI('@loginUser');

      // Should redirect to originally intended page
      cy.url().should('include', '/dashboard');
      cy.getByTestId('dashboard-content').should('be.visible');
    });

    it('should redirect authenticated users away from guest-only pages', () => {
      cy.setLocalStorage('token', authToken);
      cy.setLocalStorage('user', JSON.stringify(testUser));

      const guestOnlyRoutes = ['/login', '/register'];

      guestOnlyRoutes.forEach(route => {
        cy.visit(route);

        // Should redirect to dashboard
        cy.url().should('include', '/dashboard');
        cy.getByTestId('dashboard-content').should('be.visible');
      });
    });
  });

  describe('Breadcrumb Navigation', () => {
    beforeEach(() => {
      cy.setLocalStorage('token', authToken);
      cy.setLocalStorage('user', JSON.stringify(testUser));
    });

    it('should display correct breadcrumbs on nested pages', () => {
      // Create a test post
      cy.createPost({
        title: 'Breadcrumb Test Post',
        content: 'Testing breadcrumb navigation.',
        category: 'Technology',
        published: true
      }, authToken).then((response) => {
        const postId = response.body.data._id;

        cy.visit(`/posts/${postId}`);

        cy.getByTestId('breadcrumb').should('be.visible');
        cy.getByTestId('breadcrumb-home').should('contain', 'Home');
        cy.getByTestId('breadcrumb-posts').should('contain', 'Posts');
        cy.getByTestId('breadcrumb-current').should('contain', 'Breadcrumb Test Post');

        // Test breadcrumb navigation
        cy.getByTestId('breadcrumb-posts').click();
        cy.url().should('include', '/posts');

        cy.getByTestId('breadcrumb-home').click();
        cy.url().should('eq', Cypress.config().baseUrl + '/');
      });
    });

    it('should display breadcrumbs on post edit page', () => {
      cy.createPost({
        title: 'Edit Breadcrumb Test',
        content: 'Testing breadcrumb on edit page.',
        category: 'Technology',
        published: true
      }, authToken).then((response) => {
        const postId = response.body.data._id;

        cy.visit(`/posts/${postId}/edit`);

        cy.getByTestId('breadcrumb').should('be.visible');
        cy.getByTestId('breadcrumb-home').should('contain', 'Home');
        cy.getByTestId('breadcrumb-posts').should('contain', 'Posts');
        cy.getByTestId('breadcrumb-post').should('contain', 'Edit Breadcrumb Test');
        cy.getByTestId('breadcrumb-current').should('contain', 'Edit');
      });
    });
  });

  describe('Search Navigation', () => {
    beforeEach(() => {
      // Create test posts for search
      cy.createPost({
        title: 'JavaScript Testing Guide',
        content: 'A comprehensive guide to JavaScript testing.',
        category: 'Technology',
        tags: ['javascript', 'testing'],
        published: true
      }, authToken);

      cy.createPost({
        title: 'React Components Best Practices',
        content: 'Best practices for building React components.',
        category: 'Technology',
        tags: ['react', 'components'],
        published: true
      }, authToken);
    });

    it('should navigate to search results page', () => {
      cy.visit('/');

      cy.getByTestId('search-input').type('JavaScript');
      cy.getByTestId('search-button').click();

      cy.url().should('include', '/search');
      cy.url().should('include', 'q=JavaScript');
      cy.getByTestId('search-results').should('be.visible');
      cy.getByTestId('search-query').should('contain', 'JavaScript');
      cy.getByTestId('search-result-item').should('contain', 'JavaScript Testing Guide');

      cy.takeNamedScreenshot('search-results-navigation');
    });

    it('should handle empty search results', () => {
      cy.visit('/');

      cy.getByTestId('search-input').type('NonexistentTopic');
      cy.getByTestId('search-button').click();

      cy.url().should('include', '/search');
      cy.getByTestId('no-results-message').should('contain', 'No posts found');
      cy.getByTestId('search-suggestions').should('be.visible');
    });

    it('should maintain search state during navigation', () => {
      cy.visit('/search?q=JavaScript');

      cy.getByTestId('search-input').should('have.value', 'JavaScript');
      cy.getByTestId('search-results').should('be.visible');

      // Navigate away and back
      cy.getByTestId('home-nav-link').click();
      cy.go('back');

      cy.getByTestId('search-input').should('have.value', 'JavaScript');
      cy.getByTestId('search-results').should('be.visible');
    });
  });

  describe('Error Page Navigation', () => {
    it('should display 404 page for non-existent routes', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false });

      cy.getByTestId('error-404').should('be.visible');
      cy.getByTestId('error-title').should('contain', '404');
      cy.getByTestId('error-message').should('contain', 'Page not found');
      cy.getByTestId('back-home-button').should('be.visible');

      cy.takeNamedScreenshot('404-error-page');
    });

    it('should navigate back to home from 404 page', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false });

      cy.getByTestId('back-home-button').click();

      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.getByTestId('hero-section').should('be.visible');
    });

    it('should display error page for non-existent posts', () => {
      cy.visit('/posts/non-existent-post-id', { failOnStatusCode: false });

      cy.getByTestId('error-404').should('be.visible');
      cy.getByTestId('error-message').should('contain', 'Post not found');
      cy.getByTestId('back-to-posts-button').should('be.visible');
    });
  });

  describe('Browser Navigation', () => {
    beforeEach(() => {
      cy.setLocalStorage('token', authToken);
      cy.setLocalStorage('user', JSON.stringify(testUser));
    });

    it('should handle browser back and forward buttons', () => {
      cy.visit('/');
      cy.getByTestId('posts-nav-link').click();
      cy.url().should('include', '/posts');

      cy.getByTestId('dashboard-nav-link').click();
      cy.url().should('include', '/dashboard');

      // Test browser back button
      cy.go('back');
      cy.url().should('include', '/posts');

      cy.go('back');
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Test browser forward button
      cy.go('forward');
      cy.url().should('include', '/posts');
    });

    it('should handle page refresh correctly', () => {
      cy.visit('/dashboard');
      cy.getByTestId('dashboard-content').should('be.visible');

      cy.reload();

      cy.getByTestId('dashboard-content').should('be.visible');
      cy.getByTestId('welcome-message').should('contain', 'Navigation Tester');
    });

    it('should maintain scroll position on navigation', () => {
      // Create many posts to enable scrolling
      for (let i = 1; i <= 20; i++) {
        cy.createPost({
          title: `Scroll Test Post ${i}`,
          content: `Content for scroll test post ${i}.`,
          category: 'Technology',
          published: true
        }, authToken);
      }

      cy.visit('/posts');
      
      // Scroll down
      cy.scrollTo(0, 500);

      // Navigate to a post
      cy.getByTestId('post-card').first().click();
      cy.url().should('include', '/posts/');

      // Navigate back
      cy.go('back');

      // Should maintain scroll position (approximately)
      cy.window().its('scrollY').should('be.greaterThan', 400);
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.setMobileViewport();
    });

    it('should toggle mobile menu correctly', () => {
      cy.visit('/');

      // Mobile menu should be hidden initially
      cy.getByTestId('mobile-menu').should('not.be.visible');

      // Toggle mobile menu
      cy.getByTestId('mobile-menu-toggle').click();
      cy.getByTestId('mobile-menu').should('be.visible');

      // Check mobile menu items
      cy.getByTestId('mobile-menu-item').should('have.length.greaterThan', 0);

      // Close mobile menu
      cy.getByTestId('mobile-menu-close').click();
      cy.getByTestId('mobile-menu').should('not.be.visible');

      cy.takeNamedScreenshot('mobile-navigation-menu');
    });

    it('should navigate correctly on mobile', () => {
      cy.visit('/');

      cy.getByTestId('mobile-menu-toggle').click();
      cy.getByTestId('mobile-menu-posts').click();

      cy.url().should('include', '/posts');
      cy.getByTestId('mobile-menu').should('not.be.visible');
    });

    it('should handle swipe gestures for navigation', () => {
      cy.visit('/posts');

      // Create test post
      cy.createPost({
        title: 'Swipe Test Post',
        content: 'Testing swipe navigation.',
        category: 'Technology',
        published: true
      }, authToken).then((response) => {
        const postId = response.body.data._id;

        cy.visit(`/posts/${postId}`);

        // Test swipe back gesture (simulate)
        cy.getByTestId('post-content').trigger('touchstart', { touches: [{ clientX: 10, clientY: 100 }] });
        cy.getByTestId('post-content').trigger('touchmove', { touches: [{ clientX: 100, clientY: 100 }] });
        cy.getByTestId('post-content').trigger('touchend');

        // Should show swipe indicator or handle swipe
        cy.getByTestId('swipe-indicator').should('be.visible');
      });
    });
  });
});
