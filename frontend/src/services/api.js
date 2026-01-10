import axios from 'axios';
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        store.dispatch(logout());
        window.location.href = '/login';
      }
      
      const errorMessage = error.response.data?.message || 
                          error.response.data?.errors?.[0]?.msg || 
                          error.response.data?.error ||
                          'Something went wrong';
      
      return Promise.reject(new Error(errorMessage));
    }
    
    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

export default api;