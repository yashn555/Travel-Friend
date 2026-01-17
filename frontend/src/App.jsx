// src/App.jsx - UPDATED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Pages
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CreateTripPage from './pages/trips/CreateTripPage';
import GroupListPage from './pages/groups/GroupListPage';
import GroupDetailsPage from './pages/groups/GroupDetailsPage';
import MyGroupsPage from './pages/groups/MyGroupsPage';
import GroupRequests from './pages/groups/GroupRequests';
import GroupChatPage from './pages/chat/GroupChatPage'; // ADD THIS
import ChatPage from './pages/chat/ChatPage'; // ADD THIS (for /chat route)

// Components
import Header from './components/layout/Header';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <PublicRoute>
                <VerifyOTPPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Trip/Group Routes */}
          <Route
            path="/create-trip"
            element={
              <ProtectedRoute>
                <CreateTripPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute>
                <GroupDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id/chat" // ADD THIS ROUTE
            element={
              <ProtectedRoute>
                <GroupChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-groups"
            element={
              <ProtectedRoute>
                <MyGroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group-requests"
            element={
              <ProtectedRoute>
                <GroupRequests />
              </ProtectedRoute>
            }
          />

          {/* Chat Routes - ADD THESE */}
          <Route
  path="/chat"
  element={
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  }
/>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Page */}
          <Route
            path="*"
            element={
              <div className="text-center py-16">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <a href="/" className="btn-primary">
                  Go Home
                </a>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;