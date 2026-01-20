// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to all requests - ONLY ONE INTERCEPTOR
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

// Response interceptor - FIXED
api.interceptors.response.use(
  (response) => {
    // Return the full response, not just response.data
    // The backend sends: { success: true, token: "...", user: {...} }
    return response;
  },
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
export const getProfile = () => api.get('/profile').then(res => res.data);
export const updateProfile = (data) => api.put('/profile/update', data).then(res => res.data);
export const uploadProfileImage = (formData) => api.post('/profile/upload-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(res => res.data);

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


// Trip Planning
export const generateTripPlan = (groupId, prompt) => 
  api.post('/trips/plan', { groupId, prompt }).then(res => res.data);

export const getTripPlan = (groupId) => 
  api.get(`/trips/plan/${groupId}`).then(res => res.data);

export const updateTripPlan = (groupId, plan) => 
  api.put(`/trips/plan/${groupId}`, { plan }).then(res => res.data);

// Hotel Booking
export const searchHotels = (data) => 
  api.post('/trips/hotels/search', data).then(res => res.data);

export const createGroupBooking = (data) => 
  api.post('/trips/booking', data).then(res => res.data);

export const getGroupBookings = (groupId) => 
  api.get(`/trips/booking/${groupId}`).then(res => res.data);

// Expense Management
export const addExpense = (data) => 
  api.post('/trips/expenses', data).then(res => res.data);

export const getExpenses = (groupId) => 
  api.get(`/trips/expenses/${groupId}`).then(res => res.data);

export const deleteExpense = (expenseId) => 
  api.delete(`/trips/expenses/${expenseId}`).then(res => res.data);

// Route Suggestions
export const getRouteSuggestions = (groupId, startingCity) => 
  api.get(`/trips/routes/${groupId}`, { params: { startingCity } }).then(res => res.data);

export default api;