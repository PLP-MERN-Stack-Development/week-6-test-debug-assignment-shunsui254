// Authentication E2E Tests
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.cleanDatabase();
    cy.visit('/');
  });

  afterEach(() => {
    cy.cleanDatabase();
  });

  describe('User Registration', () => {
    it('should successfully register a new user', () => {
      cy.visit('/register');
      cy.waitForPageLoad();

      // Fill registration form
      cy.getByTestId('name-input').type('John Doe');
      cy.getByTestId('email-input').type('john.doe@example.com');
      cy.getByTestId('password-input').type('Password123!');
      cy.getByTestId('confirm-password-input').type('Password123!');

      // Intercept registration API call
      cy.intercept('POST', '**/auth/register').as('registerUser');

      cy.getByTestId('submit-button').click();

      // Wait for registration to complete
      cy.waitForAPI('@registerUser');

      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard');
      cy.getByTestId('welcome-message').should('contain', 'Welcome, John Doe');

      // Check that user data is stored in localStorage
      cy.getLocalStorage('token').should('exist');
      cy.getLocalStorage('user').should('exist');

      cy.takeNamedScreenshot('successful-registration');
    });

    it('should show validation errors for invalid registration data', () => {
      cy.visit('/register');

      // Submit form without filling fields
      cy.getByTestId('submit-button').click();

      // Check for validation errors
      cy.getByTestId('name-error').should('contain', 'Name is required');
      cy.getByTestId('email-error').should('contain', 'Email is required');
      cy.getByTestId('password-error').should('contain', 'Password is required');

      // Fill invalid email
      cy.getByTestId('email-input').type('invalid-email');
      cy.getByTestId('submit-button').click();
      cy.getByTestId('email-error').should('contain', 'Please enter a valid email');

      // Fill weak password
      cy.getByTestId('password-input').type('weak');
      cy.getByTestId('submit-button').click();
      cy.getByTestId('password-error').should('contain', 'Password must be at least 8 characters');

      // Test password confirmation mismatch
      cy.getByTestId('password-input').clear().type('Password123!');
      cy.getByTestId('confirm-password-input').type('Password456!');
      cy.getByTestId('submit-button').click();
      cy.getByTestId('confirm-password-error').should('contain', 'Passwords do not match');

      cy.takeNamedScreenshot('registration-validation-errors');
    });

    it('should handle registration with existing email', () => {
      // Create a user first
      cy.createUser({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'Password123!'
      });

      cy.visit('/register');
      
      // Try to register with same email
      cy.getByTestId('name-input').type('New User');
      cy.getByTestId('email-input').type('existing@example.com');
      cy.getByTestId('password-input').type('Password123!');
      cy.getByTestId('confirm-password-input').type('Password123!');

      cy.intercept('POST', '**/auth/register').as('registerUser');
      cy.getByTestId('submit-button').click();

      // Should show error message
      cy.getByTestId('error-message').should('contain', 'Email already exists');
      cy.url().should('include', '/register');

      cy.takeNamedScreenshot('registration-existing-email-error');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Create a test user before each login test
      cy.createUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });
    });

    it('should successfully login with valid credentials', () => {
      cy.visit('/login');
      cy.waitForPageLoad();

      cy.fillLoginForm('test@example.com', 'Password123!');

      cy.intercept('POST', '**/auth/login').as('loginUser');
      cy.submitForm();

      cy.waitForAPI('@loginUser');

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.getByTestId('user-profile').should('contain', 'Test User');

      // Check localStorage
      cy.getLocalStorage('token').should('exist');
      cy.getLocalStorage('user').should('exist');

      cy.takeNamedScreenshot('successful-login');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');

      cy.fillLoginForm('test@example.com', 'WrongPassword');

      cy.intercept('POST', '**/auth/login').as('loginUser');
      cy.submitForm();

      cy.getByTestId('error-message').should('contain', 'Invalid credentials');
      cy.url().should('include', '/login');

      cy.takeNamedScreenshot('login-invalid-credentials');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');

      cy.submitForm();

      cy.getByTestId('email-error').should('contain', 'Email is required');
      cy.getByTestId('password-error').should('contain', 'Password is required');

      cy.takeNamedScreenshot('login-validation-errors');
    });

    it('should remember user login across page refreshes', () => {
      cy.login('test@example.com', 'Password123!');
      cy.visit('/dashboard');

      // Refresh the page
      cy.reload();

      // Should still be logged in
      cy.url().should('include', '/dashboard');
      cy.getByTestId('user-profile').should('contain', 'Test User');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      cy.createUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });
      cy.login('test@example.com', 'Password123!');
    });

    it('should successfully logout user', () => {
      cy.visit('/dashboard');

      cy.getByTestId('logout-button').click();

      // Should redirect to home page
      cy.url().should('not.include', '/dashboard');
      cy.url().should('include', '/');

      // localStorage should be cleared
      cy.getLocalStorage('token').should('not.exist');
      cy.getLocalStorage('user').should('not.exist');

      // Should show login button instead of user profile
      cy.getByTestId('login-link').should('be.visible');

      cy.takeNamedScreenshot('successful-logout');
    });

    it('should handle logout from all pages', () => {
      const pages = ['/dashboard', '/posts', '/profile'];

      pages.forEach(page => {
        cy.login('test@example.com', 'Password123!');
        cy.visit(page);
        
        cy.getByTestId('logout-button').click();
        
        cy.url().should('include', '/');
        cy.getLocalStorage('token').should('not.exist');
      });
    });
  });

  describe('Protected Route Access', () => {
    it('should redirect unauthenticated users to login', () => {
      const protectedRoutes = ['/dashboard', '/posts/create', '/profile'];

      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', '/login');
        cy.getByTestId('error-message').should('contain', 'Please log in to access this page');
      });
    });

    it('should allow authenticated users to access protected routes', () => {
      cy.createUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

      cy.login('test@example.com', 'Password123!');

      const protectedRoutes = ['/dashboard', '/posts', '/profile'];

      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', route);
        cy.getByTestId('main-content').should('be.visible');
      });
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      cy.createUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });
    });

    it('should handle expired token gracefully', () => {
      cy.login('test@example.com', 'Password123!');
      cy.visit('/dashboard');

      // Simulate expired token by setting invalid token
      cy.setLocalStorage('token', 'expired.token.here');

      // Try to access protected resource
      cy.visit('/posts');

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.getByTestId('error-message').should('contain', 'Session expired. Please log in again.');
    });

    it('should maintain session state during navigation', () => {
      cy.login('test@example.com', 'Password123!');

      const pages = ['/dashboard', '/posts', '/profile', '/'];

      pages.forEach(page => {
        cy.visit(page);
        cy.getByTestId('user-profile').should('contain', 'Test User');
      });
    });
  });
});
