import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { SocketProvider } from './context/SocketContext';

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
import GroupChatPage from './pages/chat/GroupChatPage';
import ChatPage from './pages/chat/ChatPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

// Components
import Header from './components/layout/Header';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public */}
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/verify-otp" element={<PublicRoute><VerifyOTPPage /></PublicRoute>} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/create-trip" element={<ProtectedRoute><CreateTripPage /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><GroupListPage /></ProtectedRoute>} />
            <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailsPage /></ProtectedRoute>} />
            <Route path="/groups/:id/chat" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
            <Route path="/my-groups" element={<ProtectedRoute><MyGroupsPage /></ProtectedRoute>} />
            <Route path="/group-requests" element={<ProtectedRoute><GroupRequests /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            
            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="text-center py-16">
                  <h1 className="text-4xl font-bold">404</h1>
                  <p>Page not found</p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </SocketProvider>
  );
}

export default App;