// LoginForm.jsx - Login form component with validation

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import Button from './Button';
import './LoginForm.css';

const LoginForm = ({ onSubmit, loading = false, error = null }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    clearErrors,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onFormSubmit = (data) => {
    clearErrors();
    onSubmit(data);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-form" data-testid="login-form">
      <div className="login-form__header">
        <h2 className="login-form__title">Sign In</h2>
        <p className="login-form__subtitle">Welcome back! Please sign in to your account.</p>
      </div>

      {error && (
        <div className="login-form__error" role="alert" data-testid="form-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="login-form__form">
        <div className="login-form__field">
          <label htmlFor="email" className="login-form__label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className={`login-form__input ${errors.email ? 'login-form__input--error' : ''}`}
            placeholder="Enter your email address"
            data-testid="email-input"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                message: 'Please enter a valid email address',
              },
            })}
          />
          {errors.email && (
            <span className="login-form__field-error" role="alert" data-testid="email-error">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="login-form__field">
          <label htmlFor="password" className="login-form__label">
            Password
          </label>
          <div className="login-form__password-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`login-form__input ${errors.password ? 'login-form__input--error' : ''}`}
              placeholder="Enter your password"
              data-testid="password-input"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters long',
                },
              })}
            />
            <button
              type="button"
              className="login-form__password-toggle"
              onClick={togglePasswordVisibility}
              data-testid="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && (
            <span className="login-form__field-error" role="alert" data-testid="password-error">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="login-form__actions">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!isValid || loading}
            className="login-form__submit-btn"
            data-testid="submit-button"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>

        <div className="login-form__footer">
          <p className="login-form__footer-text">
            Don't have an account?{' '}
            <a href="/register" className="login-form__link">
              Sign up here
            </a>
          </p>
          <a href="/forgot-password" className="login-form__link">
            Forgot your password?
          </a>
        </div>
      </form>
    </div>
  );
};

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default LoginForm;
