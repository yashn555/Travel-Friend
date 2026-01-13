import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== AUTH =====
export const registerUser = (data) => api.post('/auth/register', data).then(res => res.data);
export const verifyUserOTP = (data) => api.post('/auth/verify-otp', data).then(res => res.data);
export const loginUser = (credentials) => api.post('/auth/login', credentials).then(res => res.data);
export const getCurrentUser = () => api.get('/auth/me').then(res => res.data);
export const logoutUser = () => api.get('/auth/logout').then(res => res.data);

// ===== DASHBOARD =====
export const getDashboardData = () => api.get('/dashboard').then(res => res.data);
export const searchGroups = (filters) => api.get('/dashboard/groups', { params: filters }).then(res => res.data);
export const requestToJoinGroup = (groupId) => api.post(`/dashboard/groups/${groupId}/join`).then(res => res.data);

// ===== PROFILE =====
export const getProfile = () => api.get('/profile').then(res => res.data);
export const updateProfile = (data) => api.put('/profile', data).then(res => res.data);
export const uploadProfileImage = (imageUrl) => api.post('/profile/upload-image', { imageUrl }).then(res => res.data);

// ===== GROUP =====
export const createGroup = (data) => api.post('/groups/create', data).then(res => res.data);
export const getUserGroups = () => api.get('/groups/my-groups').then(res => res.data);

export default api;
