import api from './api';

// Get dashboard data
export const getDashboardData = async () => {
  try {
    const response = await api.get('/dashboard');
    return response;
  } catch (error) {
    throw error;
  }
};

// Get groups with filters
export const getGroups = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/dashboard/groups?${params}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Request to join a group
export const requestToJoinGroup = async (groupId, message = '') => {
  try {
    const response = await api.post(`/dashboard/groups/${groupId}/join`, { message });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get notifications
export const getNotifications = async () => {
  try {
    const response = await api.get('/dashboard/profile/notifications');
    return response;
  } catch (error) {
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/dashboard/profile/notifications/${notificationId}/read`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Clear all notifications
export const clearAllNotifications = async () => {
  try {
    const response = await api.delete('/dashboard/profile/notifications');
    return response;
  } catch (error) {
    throw error;
  }
};