// src/services/api.js - UPDATED
import axios from 'axios';

// ============================================
// SMART URL CONFIGURATION
// ============================================

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🔗 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Get base URL from environment variable or use default
let baseURL = process.env.REACT_APP_API_URL;

if (!baseURL) {
  // Default URLs based on environment
  if (isProduction) {
    baseURL = 'https://travel-friend-backend.onrender.com';
  } else {
    baseURL = 'http://localhost:5000';
  }
}

// FORCE CORRECT URL IN PRODUCTION
if (isProduction) {
  // Ensure production URL includes /api
  if (!baseURL.includes('/api')) {
    baseURL = baseURL + '/api';
    console.log('🔧 Force-added /api to production URL:', baseURL);
  }
}

// Ensure no trailing slash
if (baseURL.endsWith('/')) {
  baseURL = baseURL.slice(0, -1);
}

console.log('🚀 Final API Base URL:', baseURL);

// ============================================
// AXIOS INSTANCE CONFIGURATION
// ============================================

const api = axios.create({
  baseURL: baseURL, // Use the corrected baseURL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // For cookies if needed
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging in development
    if (isDevelopment) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        hasToken: !!token,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR - ENHANCED
// ============================================

api.interceptors.response.use(
  (response) => {
    // Debug logging in development
    if (isDevelopment) {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    console.error('❌ API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('🔐 Authentication required or token expired');
      
      // Clear stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    // Handle 404 - Try alternative URL pattern for auth endpoints
    if (error.response?.status === 404 && originalRequest.url.includes('/auth/')) {
      console.log('🔄 404 on auth endpoint, checking configuration...');
      
      // Show helpful debug info
      console.log('🔍 Current API Configuration:', {
        baseURL: api.defaults.baseURL,
        fullURL: originalRequest.baseURL + originalRequest.url,
        expectedURL: 'https://travel-friend-backend.onrender.com/api/auth/login'
      });
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error - Check your internet connection');
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API FUNCTIONS - ENHANCED
// ============================================

export const registerUser = (data) => api.post('/auth/register', data).then(res => res.data);

export const verifyOTP = (userId, otp) => api.post('/auth/verify-otp', { userId, otp }).then(res => res.data);

export const resendOTP = (userId) => api.post('/auth/resend-otp', { userId }).then(res => res.data);

// ENHANCED loginUser with better error handling
export const loginUser = async (credentials) => {
  console.log('🔑 Login attempt for:', credentials.email);
  console.log('🌐 Using baseURL:', api.defaults.baseURL);
  
  try {
    // First, let's test if the endpoint exists
    console.log('🔍 Testing connection...');
    
    const response = await api.post('/auth/login', credentials);
    
    console.log('✅ Login response status:', response.status);
    console.log('📦 Response data:', response.data);
    
    // Handle response structure (direct token or nested in data)
    const responseData = response.data;
    
    let token, user;
    
    if (responseData.token) {
      // Direct structure: { success: true, token: "...", user: {...} }
      token = responseData.token;
      user = responseData.user;
    } else if (responseData.data && responseData.data.token) {
      // Nested structure: { success: true, data: { token: "...", user: {...} } }
      token = responseData.data.token;
      user = responseData.data.user;
    } else {
      console.error('❌ Unexpected response structure:', responseData);
      throw new Error('Invalid response from server');
    }
    
    // Store authentication data
    if (token) {
      localStorage.setItem('token', token);
      console.log('✅ Token stored successfully');
    }
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ User data stored:', user.email);
    }
    
    return {
      success: true,
      token,
      user
    };
    
  } catch (error) {
    console.error('❌ Login failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // Provide user-friendly error message
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || 'Invalid request data';
          break;
        case 401:
          errorMessage = error.response.data?.message || 'Invalid email or password';
          break;
        case 404:
          errorMessage = 'Login endpoint not found. Please check if backend is running.';
          console.error('💡 Tip: Make sure REACT_APP_API_URL includes /api in production');
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
      }
    }
    
    throw new Error(errorMessage);
  }
};

export const getCurrentUser = () => api.get('/auth/me').then(res => res.data);
export const logoutUser = () => api.get('/auth/logout').then(res => res.data);

// ============================================
// BACKEND DIAGNOSTIC FUNCTION
// ============================================

export const diagnoseBackend = async () => {
  console.log('🔍 Running backend diagnostics...');
  
  const tests = [
    { name: 'Root endpoint', url: '/' },
    { name: 'API base', url: '/api' },
    { name: 'Health check', url: '/health' },
    { name: 'Auth endpoint', url: '/auth' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      // Use base URL without /api for root test
      let testUrl = test.url;
      if (test.url === '/' && api.defaults.baseURL.includes('/api')) {
        // For root endpoint, remove /api temporarily
        const rootBase = api.defaults.baseURL.replace('/api', '');
        testUrl = rootBase + test.url;
      }
      
      console.log(`🔄 Testing: ${test.name} (${testUrl})`);
      
      const response = await api.get(test.url);
      results.push({
        name: test.name,
        url: testUrl,
        status: response.status,
        success: true,
        data: response.data
      });
      console.log(`✅ ${test.name}: ${response.status}`);
    } catch (error) {
      results.push({
        name: test.name,
        url: test.url,
        status: error.response?.status || 'No response',
        success: false,
        error: error.message
      });
      console.log(`❌ ${test.name}: ${error.response?.status || error.message}`);
    }
  }
  
  return results;
};

// ============================================
// WEBSOCKET HELPER FUNCTION
// ============================================

export const getWebSocketUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  let base = process.env.REACT_APP_API_URL || '';
  
  if (!base) {
    base = isProduction 
      ? 'https://travel-friend-backend.onrender.com'
      : 'http://localhost:5000';
  }
  
  // Remove /api suffix for WebSocket
  base = base.replace('/api', '');
  
  // Convert to WebSocket protocol
  if (base.startsWith('https://')) {
    return base.replace('https://', 'wss://');
  } else if (base.startsWith('http://')) {
    return base.replace('http://', 'ws://');
  }
  
  return base;
};

// ============================================
// DASHBOARD API FUNCTIONS (UNCHANGED)
// ============================================

export const getDashboardData = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return Promise.reject(new Error('Authentication required. Please login.'));
  }
  return api.get('/dashboard').then(res => res.data);
};

export const getDashboardStats = () => {
  const token = localStorage.getItem('token');
  if (!token) return Promise.reject(new Error('Authentication required'));
  return api.get('/dashboard/stats').then(res => res.data);
};

export const searchGroups = (filters) => api.get('/dashboard/groups', { params: filters }).then(res => res.data);
export const requestToJoinGroup = (groupId) => api.post(`/dashboard/groups/${groupId}/join`).then(res => res.data);

// ============================================
// PROFILE API FUNCTIONS (UNCHANGED)
// ============================================

export const getProfile = () => api.get('/dashboard/profile').then(res => res.data);
export const updateProfile = (data) => api.put('/dashboard/profile', data).then(res => res.data);
export const uploadProfileImage = (formData) => api.post('/dashboard/profile/upload-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(res => res.data);

// ============================================
// USER PROFILE FUNCTIONS (UNCHANGED)
// ============================================

export const getUserProfile = (userId) => api.get(`/users/profile/${userId}`).then(res => res.data);

export const getFollowersList = (userId) => {
  const endpoint = userId ? `/users/followers/${userId}` : '/users/dashboard/followers';
  return api.get(endpoint).then(res => res.data);
};

export const getFollowingList = (userId) => {
  const endpoint = userId ? `/users/following/${userId}` : '/users/dashboard/following';
  return api.get(endpoint).then(res => res.data);
};

export const getFriendsList = (userId) => {
  const endpoint = userId ? `/users/friends/${userId}` : '/users/dashboard/friends';
  return api.get(endpoint).then(res => res.data);
};

export const getUserStats = (userId) => {
  const endpoint = userId ? `/users/stats/${userId}` : '/users/dashboard/stats';
  return api.get(endpoint).then(res => res.data);
};

export const changePassword = (passwordData) => api.put('/dashboard/profile/change-password', passwordData).then(res => res.data);
export const followUser = (userId) => api.post(`/users/follow/${userId}`).then(res => res.data);
export const unfollowUser = (userId) => api.delete(`/users/follow/${userId}`).then(res => res.data);
export const sendFriendRequest = (userId, message = '') => api.post(`/users/friend-request/${userId}`, { message }).then(res => res.data);
export const getSuggestedFriends = (limit = 10) => api.get(`/users/suggested?limit=${limit}`).then(res => res.data);
export const getNearbyUsers = (lat, lng, radius = 50) => api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${radius}`).then(res => res.data);
export const getSimilarUsers = () => api.get('/users/similar').then(res => res.data);
export const getUserReviews = (userId) => api.get(`/users/reviews/${userId}`).then(res => res.data);
export const getUserTrips = (userId) => api.get(`/users/trips/${userId}`).then(res => res.data);
export const getFriendRequests = () => api.get('/friend-requests').then(res => res.data);
export const acceptFriendRequest = (requestId) => api.put(`/users/friend-request/accept/${requestId}`).then(res => res.data);
export const rejectFriendRequest = (requestId) => api.put(`/users/friend-request/reject/${requestId}`).then(res => res.data);
export const removeFriend = (friendshipId) => api.delete(`/users/friends/${friendshipId}`).then(res => res.data);
export const getTripHistory = () => api.get('/profile/trips').then(res => res.data);

// ============================================
// GROUP API FUNCTIONS (UNCHANGED)
// ============================================

export const createGroup = (data) => api.post('/groups/create', data).then(res => res.data);
export const getUserGroups = () => api.get('/groups/my-groups').then(res => res.data);
export const getGroupDetails = (groupId) => api.get(`/groups/${groupId}`).then(res => res.data);
export const joinGroupRequest = (groupId, message) => api.post('/groups/join-request', { groupId, message }).then(res => res.data);
export const getGroupRequests = (groupId) => api.get(`/groups/${groupId}/requests`).then(res => res.data);
export const handleGroupRequest = (groupId, requestId, action) => api.put('/groups/handle-request', { groupId, requestId, action }).then(res => res.data);
export const getAllGroups = () => api.get('/groups/all-groups').then(res => res.data);

// ============================================
// CHAT API FUNCTIONS (UNCHANGED)
// ============================================

export const getGroupChat = (groupId) => api.get(`/chat/group/${groupId}`).then(res => res.data);
export const sendChatMessage = (groupId, text) => api.post(`/chat/group/${groupId}/message`, { text }).then(res => res.data);
export const getMyChats = () => api.get('/chat/my-chats').then(res => res.data);
export const addUserToChat = (groupId, userId) => api.post(`/chat/group/${groupId}/add-user/${userId}`).then(res => res.data);
export const checkMutualFollow = async (otherUserId) => {
  const response = await api.get(`/users/check-mutual-follow/${otherUserId}`);
  return response.data;
};

export const createOrGetPrivateChat = async (otherUserId) => {
  const response = await api.post(`/chat/private/${otherUserId}`);
  return response.data;
};

export const getPrivateChat = async (chatId) => {
  const response = await api.get(`/chat/private/${chatId}`);
  return response.data.data;
};

export const sendPrivateMessage = async (chatId, text) => {
  const response = await api.post(`/chat/private/${chatId}/message`, { text });
  return response.data;
};

// ============================================
// TRIP PLANNING API FUNCTIONS (UNCHANGED)
// ============================================

export const generateTripPlan = (groupId, prompt) => api.post('/trips/plan', { groupId, prompt }).then(res => res.data);
export const getTripPlan = (groupId) => api.get(`/trips/plan/${groupId}`).then(res => res.data);
export const updateTripPlan = (groupId, plan) => api.put(`/trips/plan/${groupId}`, { plan }).then(res => res.data);
export const searchHotels = (data) => api.post('/trips/hotels/search', data).then(res => res.data);
export const createGroupBooking = (data) => api.post('/trips/booking', data).then(res => res.data);
export const getGroupBookings = (groupId) => api.get(`/trips/booking/${groupId}`).then(res => res.data);
export const addExpense = (data) => api.post('/trips/expenses', data).then(res => res.data);
export const getExpenses = (groupId) => api.get(`/trips/expenses/${groupId}`).then(res => res.data);
export const deleteExpense = (expenseId) => api.delete(`/trips/expenses/${expenseId}`).then(res => res.data);
export const getRouteSuggestions = (groupId, startingCity) => api.get(`/trips/routes/${groupId}`, { params: { startingCity } }).then(res => res.data);

// ============================================
// UTILITY API FUNCTIONS (UNCHANGED)
// ============================================

export const searchUsers = (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`).then(res => res.data);

export const checkFollowStatus = async (userId) => {
  try {
    console.log(`🔍 Checking follow status for user: ${userId}`);
    const response = await api.get(`/users/check-follow/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Check follow status error:', error.response?.data || error.message);
    throw error;
  }
};

export const getAutoTripSuggestions = (data) => api.post('/auto-trip/suggestions', data).then(res => res.data);
export const createAutoTrip = (tripData) => api.post('/auto-trip/create', tripData).then(res => res.data);

// ============================================
// HELPER FUNCTIONS (UNCHANGED)
// ============================================

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get authentication headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Test backend connection
export const testBackendConnection = async () => {
  try {
    const response = await api.get('/health');
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      message: error.message,
      url: api.defaults.baseURL
    };
  }
};

export default api;