// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { SocketProvider } from './context/SocketContext';
import { checkAuth } from './redux/slices/authSlice'; // Import checkAuth

// Pages
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import CreateTripPage from './pages/trips/CreateTripPage';
import GroupListPage from './pages/groups/GroupListPage';
import GroupDetailsPage from './pages/groups/GroupDetailsPage';
import MyGroupsPage from './pages/groups/MyGroupsPage';
import GroupRequests from './pages/groups/GroupRequests';
import GroupChatPage from './pages/chat/GroupChatPage';
import ChatPage from './pages/chat/ChatPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import EditGroupPage from './pages/groups/EditGroupPage';
import PrivateChatList from './pages/private-chat/PrivateChatList';
import PrivateChatRoom from './pages/private-chat/PrivateChatRoom';
import FindFriendsPage from './pages/FindFriendsPage';
import MatchPage from './pages/Match/MatchPage';
import SimpleAboutPage from './pages/SimpleAboutPage';
import InvitesPage from './pages/invites/InvitesPage';
import InvitationDetails from './pages/invitations/InvitationDetails';
import NearbyUsersPage from './pages/nearby/NearbyUsersPage';
import SuggestTripPage from './pages/trips/SuggestTripPage';
import ExpenseManagementPage from './pages/ExpenseManagementPage';

// ✅ CORRECT IMPORTS - Fix the typo
import InviteFriendsToTrip from './pages/trips/InviteFriendsToTrip';
import InvitationResponse from './pages/invitations/InvitationResponse';

// Components
import Header from './components/layout/Header';
import LoadingSpinner from './components/common/LoadingSpinner'; // Create this component

// Protected Route - UPDATED
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route - UPDATED
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Landing Page Component (for "/" route)
const LandingPage = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [appLoading, setAppLoading] = useState(true);

  // Check authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Validate the token with server
          await dispatch(checkAuth()).unwrap();
          console.log('✅ User authenticated from localStorage');
        } catch (error) {
          console.log('❌ Token invalid, clearing storage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setAppLoading(false);
    };
    
    initAuth();
  }, [dispatch]);

  // Show loading spinner while checking auth
  if (appLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Landing page - handles auth state */}
            <Route path="/" element={<LandingPage />} />

            {/* Public routes */}
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/verify-otp" element={<PublicRoute><VerifyOTPPage /></PublicRoute>} />
            <Route path="/about" element={<SimpleAboutPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Invite Friends */}
            <Route
              path="/groups/:Id/invite-friends"
              element={
                <ProtectedRoute>
                  <InviteFriendsToTrip />
                </ProtectedRoute>
              }
            />

            {/* User Profile */}
            <Route path="/user/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

            <Route path="/find-friends" element={<ProtectedRoute><FindFriendsPage /></ProtectedRoute>} />
            <Route path="/create-trip" element={<ProtectedRoute><CreateTripPage /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><GroupListPage /></ProtectedRoute>} />
            <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailsPage /></ProtectedRoute>} />
            <Route path="/groups/:id/chat" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
            <Route path="/my-groups" element={<ProtectedRoute><MyGroupsPage /></ProtectedRoute>} />
            <Route path="/group-requests" element={<ProtectedRoute><GroupRequests /></ProtectedRoute>} />

            {/* Chat Routes */}
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/private-chat" element={<ProtectedRoute><PrivateChatList /></ProtectedRoute>} />
            <Route path="/private-chat/:chatId" element={<ProtectedRoute><PrivateChatRoom /></ProtectedRoute>} />

            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/edit-group/:id" element={<ProtectedRoute><EditGroupPage /></ProtectedRoute>} />
            
            <Route path="/nearby-users" element={<ProtectedRoute><NearbyUsersPage /></ProtectedRoute>} />

            <Route path="/groups/:groupId/expenses" element={<ProtectedRoute><ExpenseManagementPage /></ProtectedRoute>} />
            
            <Route path="/suggest-trip" element={<ProtectedRoute><SuggestTripPage /></ProtectedRoute>} />
            
            <Route 
              path="/invites" 
              element={
                <ProtectedRoute>
                  <InvitesPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/invitations/:invitationId/respond" 
              element={
                <ProtectedRoute>
                  <InvitationDetails />
                </ProtectedRoute>
              } 
            />

            {/* Match */}
            <Route path="/match-travelers" element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />

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