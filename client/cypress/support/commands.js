// commands.js - Custom Cypress commands

// Authentication commands
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="submit-button"]').click();
    cy.url().should('not.include', '/login');
  });
});

Cypress.Commands.add('loginAPI', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    window.localStorage.setItem('token', response.body.data.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
  });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  cy.visit('/');
});

// User management commands
Cypress.Commands.add('createUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: userData,
  });
});

Cypress.Commands.add('deleteUser', (userId, token) => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/users/${userId}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    failOnStatusCode: false,
  });
});

// Post management commands
Cypress.Commands.add('createPost', (postData, token) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/posts`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: postData,
  });
});

Cypress.Commands.add('deletePost', (postId, token) => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/posts/${postId}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    failOnStatusCode: false,
  });
});

// Database seeding commands
Cypress.Commands.add('seedDatabase', () => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('cleanDatabase', () => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/clean`,
    failOnStatusCode: false,
  });
});

// Utility commands
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('findByTestId', (testId) => {
  return cy.find(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.document().should('have.property', 'readyState', 'complete');
});

Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Form helpers
Cypress.Commands.add('fillLoginForm', (email, password) => {
  cy.getByTestId('email-input').clear().type(email);
  cy.getByTestId('password-input').clear().type(password);
});

Cypress.Commands.add('submitForm', (formTestId = 'submit-button') => {
  cy.getByTestId(formTestId).click();
});

// Wait for network requests
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

// Local storage helpers
Cypress.Commands.add('setLocalStorage', (key, value) => {
  cy.window().then((window) => {
    window.localStorage.setItem(key, value);
  });
});

Cypress.Commands.add('getLocalStorage', (key) => {
  return cy.window().then((window) => {
    return window.localStorage.getItem(key);
  });
});

Cypress.Commands.add('clearLocalStorage', () => {
  cy.window().then((window) => {
    window.localStorage.clear();
  });
});

// Screenshot and video helpers
Cypress.Commands.add('takeNamedScreenshot', (name) => {
  cy.screenshot(name, { capture: 'viewport' });
});

// Custom assertions
Cypress.Commands.add('shouldBeVisible', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible');
});

Cypress.Commands.add('shouldHaveText', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).should('contain.text', text);
});

// Error handling
Cypress.Commands.add('handleUncaughtException', () => {
  cy.on('uncaught:exception', (err, runnable) => {
    // Returning false here prevents Cypress from failing the test
    if (err.message.includes('ResizeObserver')) {
      return false;
    }
    return true;
  });
});

// Mobile viewport commands
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone 6/7/8 size
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad size
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop size
});
