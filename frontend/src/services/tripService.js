// frontend/src/services/tripService.js
import api from './api';

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// AI Trip Planning
export const generateTripPlan = async (groupId, prompt = '') => {
  try {
    const response = await api.post('/trips/plan', { groupId, prompt });
    console.log('✅ Generate trip plan API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Generate trip plan API error:', error);
    throw error;
  }
};

export const getTripPlan = async (groupId) => {
  try {
    const response = await api.get(`/trips/plan/${groupId}`);
    console.log('✅ Get trip plan API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get trip plan API error:', error);
    throw error;
  }
};

export const updateTripPlan = async (groupId, plan) => {
  try {
    const response = await api.put(`/trips/plan/${groupId}`, { plan });
    console.log('✅ Update trip plan API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Update trip plan API error:', error);
    throw error;
  }
};

// Group Booking
export const createGroupBooking = async (bookingData) => {
  try {
    const response = await api.post('/trips/booking', bookingData);
    console.log('✅ Create group booking API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Create group booking API error:', error);
    throw error;
  }
};

export const getGroupBookings = async (groupId) => {
  try {
    const response = await api.get(`/trips/booking/${groupId}`);
    console.log('✅ Get group bookings API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get group bookings API error:', error);
    throw error;
  }
};

// Expense Management
export const addExpense = async (expenseData) => {
  try {
    const response = await api.post('/trips/expenses', expenseData);
    console.log('✅ Add expense API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Add expense API error:', error);
    throw error;
  }
};

export const getExpenses = async (groupId) => {
  try {
    const response = await api.get(`/trips/expenses/${groupId}`);
    console.log('✅ Get expenses API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get expenses API error:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    const response = await api.delete(`/trips/expenses/${expenseId}`);
    console.log('✅ Delete expense API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Delete expense API error:', error);
    throw error;
  }
};

// Route Suggestions
export const getRouteSuggestions = async (groupId) => {
  try {
    const response = await api.get(`/trips/routes/${groupId}`);
    console.log('✅ Get route suggestions API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get route suggestions API error:', error);
    throw error;
  }
};