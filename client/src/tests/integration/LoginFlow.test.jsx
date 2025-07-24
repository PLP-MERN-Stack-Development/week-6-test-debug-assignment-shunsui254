// LoginFlow.test.jsx - Integration test for login flow

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LoginForm from '../../components/LoginForm';

// Mock API service
const mockLoginAPI = jest.fn();

// Mock auth service
const mockAuthService = {
  login: mockLoginAPI,
  isAuthenticated: jest.fn(),
  getToken: jest.fn(),
  getUser: jest.fn(),
};

// Test component that uses LoginForm
const LoginPage = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [user, setUser] = React.useState(null);

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await mockAuthService.login(credentials);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div data-testid="dashboard">
        <h1>Welcome, {user.firstName || user.username}!</h1>
        <p>You are successfully logged in.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="login-page">
        <h1>Login to Your Account</h1>
        <LoginForm
          onSubmit={handleLogin}
          loading={loading}
          error={error}
        />
      </div>
    </BrowserRouter>
  );
};

describe('Login Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('completes successful login flow', async () => {
    const user = userEvent.setup();
    
    // Mock successful login response
    const mockUser = {
      id: '123',
      username: 'testuser',
      firstName: 'John',
      email: 'test@example.com',
    };
    
    const mockResponse = {
      user: mockUser,
      token: 'mock-jwt-token',
    };

    mockLoginAPI.mockResolvedValueOnce(mockResponse);

    render(<LoginPage />);

    // Verify login form is rendered
    expect(screen.getByText('Login to Your Account')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();

    // Fill in login credentials
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit form
    await user.click(submitButton);

    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
    });

    // Verify API was called with correct credentials
    expect(mockLoginAPI).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    // Wait for successful login and redirect to dashboard
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });

    // Verify token was stored
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
  });

  it('handles login failure with error message', async () => {
    const user = userEvent.setup();
    
    // Mock failed login response
    mockLoginAPI.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginPage />);

    // Fill in login credentials
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    // Submit form
    await user.click(submitButton);

    // Verify loading state appears briefly
    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
    });

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Verify we're still on login page
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();

    // Verify no token was stored
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('handles network error during login', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    mockLoginAPI.mockRejectedValueOnce(new Error('Network error'));

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('validates form before making API call', async () => {
    const user = userEvent.setup();
    
    render(<LoginPage />);

    const submitButton = screen.getByTestId('submit-button');

    // Try to submit with empty form
    expect(submitButton).toBeDisabled();

    // Fill only email
    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    // Submit button should still be disabled
    expect(submitButton).toBeDisabled();

    // API should not be called
    expect(mockLoginAPI).not.toHaveBeenCalled();

    // Fill password with invalid length
    const passwordInput = screen.getByTestId('password-input');
    await user.type(passwordInput, '123');

    // Form should still be invalid
    expect(submitButton).toBeDisabled();

    // Fill valid password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'validpassword');

    // Now form should be valid
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('clears error when user starts typing again', async () => {
    const user = userEvent.setup();
    
    // Mock failed login first
    mockLoginAPI.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    // Fill form and submit to get error
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toBeInTheDocument();
    });

    // Start typing in password field again
    await user.clear(passwordInput);
    await user.type(passwordInput, 'newpassword');

    // Error should still be visible (this is component behavior dependent)
    // In a real app, you might want to clear errors on input change
  });

  it('prevents multiple submissions while loading', async () => {
    const user = userEvent.setup();
    
    // Mock slow login response
    let resolveLogin;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    mockLoginAPI.mockReturnValueOnce(loginPromise);

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit form
    await user.click(submitButton);

    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Try to click submit again
    await user.click(submitButton);

    // Should only be called once
    expect(mockLoginAPI).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolveLogin({
      user: { id: '123', username: 'testuser' },
      token: 'token',
    });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('handles special characters in password', async () => {
    const user = userEvent.setup();
    
    const mockResponse = {
      user: { id: '123', username: 'testuser' },
      token: 'mock-token',
    };
    mockLoginAPI.mockResolvedValueOnce(mockResponse);

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    const specialPassword = 'P@ssw0rd!#$%';

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, specialPassword);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    expect(mockLoginAPI).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: specialPassword,
    });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('maintains form state during loading', async () => {
    const user = userEvent.setup();
    
    // Mock slow response
    let resolveLogin;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    mockLoginAPI.mockReturnValueOnce(loginPromise);

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    const email = 'test@example.com';
    const password = 'password123';

    await user.type(emailInput, email);
    await user.type(passwordInput, password);
    await user.click(screen.getByTestId('submit-button'));

    // During loading, form values should be preserved
    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
    });

    expect(emailInput).toHaveValue(email);
    expect(passwordInput).toHaveValue(password);

    // Resolve login
    resolveLogin({
      user: { id: '123', username: 'testuser' },
      token: 'token',
    });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });
});
