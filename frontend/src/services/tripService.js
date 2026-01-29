import api from './api';

// ==================== GROUP FUNCTIONS ====================

export const getGroupById = async (groupId) => {
  try {
    const response = await api.get(`/trips/${groupId}`);
    console.log('✅ Get group by ID API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get group by ID API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch group');
  }
};

// Add updateGroup function
export const updateGroup = async (groupId, updateData) => {
  try {
    const response = await api.put(`/trips/${groupId}`, updateData);
    console.log('✅ Update group API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Update group API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to update group');
  }
};

// Alias for getGroup (for compatibility)
export const getGroup = getGroupById;

// ==================== AI TRIP PLANNING ====================

export const generateTripPlan = async (groupId, prompt = '') => {
  try {
    const response = await api.post('/trips/plan', { groupId, prompt });
    console.log('✅ Generate trip plan API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Generate trip plan API error:', error);
    
    if (error.response?.data?.message?.includes('Gemini API')) {
      throw {
        ...error,
        response: {
          ...error.response,
          data: {
            ...error.response?.data,
            message: 'AI trip planning service is currently unavailable. Please try again later.'
          }
        }
      };
    }
    
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

// ==================== GROUP BOOKING ====================

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

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await api.put(`/trips/booking/${bookingId}`, { status });
    console.log('✅ Update booking status API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Update booking status API error:', error);
    throw error;
  }
};

// ==================== ROUTE SUGGESTIONS ====================

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

// ==================== HELPER FUNCTIONS ====================

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// REMOVE ALL EXPENSE FUNCTIONS FROM HERE
// They will be moved to expenseService.js