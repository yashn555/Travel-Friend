import api from './api';

export const getProfile = async (userId = null) => {
  try {
    const endpoint = userId ? `/users/profile/${userId}` : '/dashboard/profile';
    console.log('📞 API Calling:', endpoint);
    const response = await api.get(endpoint);
    console.log('📥 API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/dashboard/profile', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadProfileImage = async (formData) => {
  try {
    const response = await api.post('/dashboard/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserStats = async (userId = null) => {
  try {
    const endpoint = userId ? `/users/stats/${userId}` : '/dashboard/stats';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const followUser = async (userId) => {
  try {
    const response = await api.post(`/users/follow/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const unfollowUser = async (userId) => {
  try {
    const response = await api.delete(`/users/follow/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFriendsList = async (userId = null) => {
  try {
    const endpoint = userId ? `/users/friends/${userId}` : '/dashboard/friends';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFollowersList = async (userId = null) => {
  try {
    const endpoint = userId ? `/users/followers/${userId}` : '/dashboard/followers';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFollowingList = async (userId = null) => {
  try {
    const endpoint = userId ? `/users/following/${userId}` : '/dashboard/following';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchUsers = async (query) => {
  try {
    const response = await api.get(`/users/search?q=${query}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendFriendRequest = async (userId) => {
  try {
    const response = await api.post(`/users/friend-request/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await api.put(`/users/friend-request/accept/${requestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await api.put(`/users/friend-request/reject/${requestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
// profileService.js - Add these functions

export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/dashboard/profile/change-password', passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSuggestedFriends = async (limit = 10) => {
  try {
    const response = await api.get(`/users/suggested?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNearbyUsers = async (lat, lng, radius = 50) => {
  try {
    const response = await api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSimilarUsers = async () => {
  try {
    const response = await api.get('/users/similar');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserReviews = async (userId) => {
  try {
    const response = await api.get(`/users/reviews/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserTrips = async (userId) => {
  try {
    const response = await api.get(`/users/trips/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
