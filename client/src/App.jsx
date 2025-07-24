import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';

// Lazy load components for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Posts = React.lazy(() => import('./pages/Posts'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const CreatePost = React.lazy(() => import('./pages/CreatePost'));
const EditPost = React.lazy(() => import('./pages/EditPost'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Search = React.lazy(() => import('./pages/Search'));
const About = React.lazy(() => import('./pages/About'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner data-testid="auth-loading" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guest Route Component (redirect authenticated users)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner data-testid="auth-loading" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Layout Component
const AppLayout = ({ children }) => {
  return (
    <div className="app" data-testid="app-container">
      <Navbar />
      <main className="main-content" data-testid="main-content">
        <ErrorBoundary>
          <React.Suspense fallback={<LoadingSpinner data-testid="page-loading" />}>
            {children}
          </React.Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <Toast />
    </div>
  );
};

// App Component
function App() {
  // Global error handler for uncaught exceptions
  React.useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('Global error caught:', event.error);
      // Log error to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        // logErrorToService(event.error);
      }
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Log error to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        // logErrorToService(event.reason);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/posts/:id" element={<PostDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/about" element={<About />} />

              {/* Guest Only Routes */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <Register />
                  </GuestRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posts/create"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posts/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditPost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
