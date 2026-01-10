import api from './api';

// Register user
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (userId, otp) => {
  try {
    const response = await api.post('/auth/verify-otp', { userId, otp });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  } catch (error) {
    throw error;
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response;
  } catch (error) {
    throw error;
  }
};

// Resend OTP
export const resendOTP = async (userId) => {
  try {
    const response = await api.post('/auth/resend-otp', { userId });
    return response;
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await api.get('/auth/logout');
    localStorage.removeItem('token');
    return { success: true };
  } catch (error) {
    localStorage.removeItem('token');
    throw error;
  }
};