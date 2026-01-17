import api from './api';

// Register user
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    console.log('✅ Registration API response:', response);
    return response; // This is now the actual data
  } catch (error) {
    console.error('❌ Registration API error:', error);
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (userId, otp) => {
  try {
    console.log('🚀 Calling verifyOTP with:', { userId, otp });
    const response = await api.post('/auth/verify-otp', { userId, otp });
    console.log('✅ Verify OTP API response:', response);
    
    // Store token if received
    if (response.token) {
      localStorage.setItem('token', response.token);
      console.log('🔐 Token stored in localStorage');
    }
    
    // Store user if received
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
      console.log('👤 User stored in localStorage');
    }
    
    return response;
  } catch (error) {
    console.error('❌ Verify OTP API error:', error);
    throw error;
  }
};

// Resend OTP
export const resendOTP = async (userId) => {
  try {
    const response = await api.post('/auth/resend-otp', { userId });
    console.log('✅ Resend OTP API response:', response);
    return response;
  } catch (error) {
    console.error('❌ Resend OTP API error:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    console.log('✅ Login API response:', response);
    
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    console.error('❌ Login API error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    console.log('✅ Get current user API response:', response);
    return response;
  } catch (error) {
    console.error('❌ Get current user API error:', error);
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await api.get('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.error('❌ Logout API error:', error);
    throw error;
  }
};