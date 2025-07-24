// LoginForm.test.jsx - Unit tests for LoginForm component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginForm from '../../components/LoginForm';

describe('LoginForm Component', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form with all required elements', () => {
    render(<LoginForm {...defaultProps} />);

    // Check main container
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    
    // Check header
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Welcome back! Please sign in to your account.')).toBeInTheDocument();
    
    // Check form fields
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    
    // Check submit button
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    
    // Check footer links
    expect(screen.getByText('Sign up here')).toBeInTheDocument();
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Invalid credentials. Please try again.';
    
    render(<LoginForm {...defaultProps} error={errorMessage} />);

    const errorElement = screen.getByTestId('form-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent(errorMessage);
    expect(errorElement).toHaveAttribute('role', 'alert');
  });

  it('does not display error message when error prop is null', () => {
    render(<LoginForm {...defaultProps} error={null} />);

    expect(screen.queryByTestId('form-error')).not.toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<LoginForm {...defaultProps} loading={true} />);

    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Signing In...');
  });

  it('toggles password visibility when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByTestId('password-toggle');

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

    // Click toggle to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');

    // Click toggle again to hide password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
  });

  it('validates email field correctly', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const emailInput = screen.getByTestId('email-input');

    // Test required validation
    await user.click(emailInput);
    await user.tab(); // Move focus away

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
    });

    // Test invalid email format
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email address');
    });

    // Test valid email
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });
  });

  it('validates password field correctly', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const passwordInput = screen.getByTestId('password-input');

    // Test required validation
    await user.click(passwordInput);
    await user.tab(); // Move focus away

    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
    });

    // Test minimum length validation
    await user.clear(passwordInput);
    await user.type(passwordInput, '123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent('Password must be at least 6 characters long');
    });

    // Test valid password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByTestId('password-error')).not.toBeInTheDocument();
    });
  });

  it('disables submit button when form is invalid', async () => {
    render(<LoginForm {...defaultProps} />);

    const submitButton = screen.getByTestId('submit-button');
    
    // Initially form is invalid (empty fields)
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    // Fill in valid data
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('calls onSubmit with form data when form is submitted', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

    // Fill in form data
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Wait for form to become valid
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Submit form
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('submits form when Enter key is pressed in input field', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    // Fill in form data
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Press Enter in password field
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('does not submit form when Enter is pressed but form is invalid', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByTestId('email-input');

    // Fill in invalid data
    await user.type(emailInput, 'invalid-email');

    // Press Enter
    await user.keyboard('{Enter}');

    // Should not submit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('applies error styling to input fields when they have errors', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    // Trigger validation errors
    await user.click(emailInput);
    await user.tab();
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(emailInput).toHaveClass('login-form__input--error');
      expect(passwordInput).toHaveClass('login-form__input--error');
    });
  });

  it('clears error styling when input becomes valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const emailInput = screen.getByTestId('email-input');

    // First trigger error
    await user.click(emailInput);
    await user.tab();

    await waitFor(() => {
      expect(emailInput).toHaveClass('login-form__input--error');
    });

    // Then fix the error
    await user.type(emailInput, 'test@example.com');

    await waitFor(() => {
      expect(emailInput).not.toHaveClass('login-form__input--error');
    });
  });

  it('has proper accessibility attributes', () => {
    render(<LoginForm {...defaultProps} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByTestId('password-toggle');

    // Check input labels
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(passwordInput).toHaveAttribute('id', 'password');
    expect(screen.getByLabelText('Email Address')).toBe(emailInput);
    expect(screen.getByLabelText('Password')).toBe(passwordInput);

    // Check toggle button accessibility
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
    expect(toggleButton).toHaveAttribute('type', 'button');
  });

  it('maintains focus management properly', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByTestId('password-toggle');

    // Tab through form elements
    await user.tab(); // Focus email input
    expect(emailInput).toHaveFocus();

    await user.tab(); // Focus password input
    expect(passwordInput).toHaveFocus();

    await user.tab(); // Focus toggle button
    expect(toggleButton).toHaveFocus();
  });

  it('handles rapid input changes correctly', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const emailInput = screen.getByTestId('email-input');

    // Type quickly and then delete
    await user.type(emailInput, 'test@example.com');
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');

    expect(emailInput).toHaveValue('new@example.com');
  });
});
