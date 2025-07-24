import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { logger } from '../utils/logger';

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// Initial State
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
  isAuthenticated: false
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        loading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        isAuthenticated: true
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
    case AUTH_ACTIONS.UPDATE_USER:
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
        isAuthenticated: true
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
        isAuthenticated: false
      };

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
          
          // Verify token is still valid
          const response = await authAPI.verify(token);
          
          if (response.success) {
            dispatch({
              type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
              payload: response.data.user
            });
          } else {
            throw new Error('Token verification failed');
          }
        } catch (error) {
          logger.error('Auth context - Load user error:', error);
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_FAILURE,
            payload: error.message || 'Failed to load user'
          });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: response.data
        });
        
        logger.info('User logged in successfully:', response.data.user.email);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      logger.error('Auth context - Login error:', errorMessage);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: response.data
        });
        
        logger.info('User registered successfully:', response.data.user.email);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      logger.error('Auth context - Register error:', errorMessage);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API to invalidate token on server
      if (state.token) {
        await authAPI.logout(state.token);
      }
    } catch (error) {
      logger.error('Auth context - Logout API error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      logger.info('User logged out');
    }
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
    logger.info('User data updated');
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role/permission
  const hasPermission = (permission) => {
    if (!state.user) return false;
    return state.user.permissions?.includes(permission) || state.user.role === 'admin';
  };

  // Check if user owns resource
  const isOwner = (resourceUserId) => {
    return state.user?._id === resourceUserId;
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    
    // Utilities
    hasPermission,
    isOwner
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for components that require authentication
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return <div data-testid="auth-loading">Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <div data-testid="auth-required">Authentication required</div>;
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;
