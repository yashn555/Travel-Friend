// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===== AUTH =====
export const registerUser = (data) => api.post('/auth/register', data).then(res => res.data);
export const verifyOTP = (userId, otp) => api.post('/auth/verify-otp', { userId, otp }).then(res => res.data);
export const resendOTP = (userId) => api.post('/auth/resend-otp', { userId }).then(res => res.data);
export const loginUser = (credentials) => api.post('/auth/login', credentials).then(res => res.data);
export const getCurrentUser = () => api.get('/auth/me').then(res => res.data);
export const logoutUser = () => api.get('/auth/logout').then(res => res.data);

// ===== DASHBOARD =====
export const getDashboardData = () => api.get('/dashboard').then(res => res.data);
export const searchGroups = (filters) => api.get('/dashboard/groups', { params: filters }).then(res => res.data);
export const requestToJoinGroup = (groupId) => api.post(`/dashboard/groups/${groupId}/join`).then(res => res.data);

// ===== PROFILE =====
export const getProfile = () => api.get('/dashboard/profile').then(res => res.data);
export const updateProfile = (data) => api.put('/dashboard/profile', data).then(res => res.data);
export const uploadProfileImage = (formData) => api.post('/dashboard/profile/upload-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(res => res.data);

// ===== USER PROFILE FUNCTIONS (Add these) =====
export const getUserProfile = (userId) => api.get(`/users/profile/${userId}`).then(res => res.data);


// In the USER PROFILE FUNCTIONS section, update these endpoints:
export const getFollowersList = (userId) => {
  const endpoint = userId ? `/users/followers/${userId}` : '/users/dashboard/followers'; // Changed
  return api.get(endpoint).then(res => res.data);
};

export const getFollowingList = (userId) => {
  const endpoint = userId ? `/users/following/${userId}` : '/users/dashboard/following'; // Changed
  return api.get(endpoint).then(res => res.data);
};

export const getFriendsList = (userId) => {
  const endpoint = userId ? `/users/friends/${userId}` : '/users/dashboard/friends'; // Changed
  return api.get(endpoint).then(res => res.data);
};

export const getUserStats = (userId) => {
  const endpoint = userId ? `/users/stats/${userId}` : '/users/dashboard/stats'; // Changed
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
export const getTripHistory = () => api.get('/profile/trips').then(res => res.data); // Add this line


// ===== GROUP =====
export const createGroup = (data) => api.post('/groups/create', data).then(res => res.data);
export const getUserGroups = () => api.get('/groups/my-groups').then(res => res.data);
export const getGroupDetails = (groupId) => api.get(`/groups/${groupId}`).then(res => res.data);
export const joinGroupRequest = (groupId, message) => api.post('/groups/join-request', { groupId, message }).then(res => res.data);
export const getGroupRequests = (groupId) => api.get(`/groups/${groupId}/requests`).then(res => res.data);
export const handleGroupRequest = (groupId, requestId, action) => api.put('/groups/handle-request', { groupId, requestId, action }).then(res => res.data);
export const getAllGroups = () => api.get('/groups/all-groups').then(res => res.data);

// ===== CHAT =====
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

// Trip Planning
export const generateTripPlan = (groupId, prompt) => api.post('/trips/plan', { groupId, prompt }).then(res => res.data);
export const getTripPlan = (groupId) => api.get(`/trips/plan/${groupId}`).then(res => res.data);
export const updateTripPlan = (groupId, plan) => api.put(`/trips/plan/${groupId}`, { plan }).then(res => res.data);

// Hotel Booking
export const searchHotels = (data) => api.post('/trips/hotels/search', data).then(res => res.data);
export const createGroupBooking = (data) => api.post('/trips/booking', data).then(res => res.data);
export const getGroupBookings = (groupId) => api.get(`/trips/booking/${groupId}`).then(res => res.data);

// Expense Management
export const addExpense = (data) => api.post('/trips/expenses', data).then(res => res.data);
export const getExpenses = (groupId) => api.get(`/trips/expenses/${groupId}`).then(res => res.data);
export const deleteExpense = (expenseId) => api.delete(`/trips/expenses/${expenseId}`).then(res => res.data);

// Route Suggestions
export const getRouteSuggestions = (groupId, startingCity) => api.get(`/trips/routes/${groupId}`, { params: { startingCity } }).then(res => res.data);

// Search users
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



export default api;