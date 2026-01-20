import api from './api';

export const getProfile = async (userId = null) => {
  try {
    const endpoint = userId ? `/users/profile/${userId}` : '/dashboard/profile';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
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