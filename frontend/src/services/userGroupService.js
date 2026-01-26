import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Get groups that the user has joined
export const getUserGroups = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/user-groups/my-groups`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data || response.data; // Handle both response formats
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw error.response?.data || error;
  }
};

// Leave a group
export const leaveUserGroup = async (groupId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/user-groups/leave/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error.response?.data || error;
  }
};

// Cancel join request
export const cancelJoinRequest = async (groupId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/user-groups/cancel-request/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelling join request:', error);
    throw error.response?.data || error;
  }
};