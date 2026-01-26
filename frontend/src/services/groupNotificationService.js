// frontend/src/services/groupNotificationService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get group notifications
export const getGroupNotifications = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/notifications/group`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching group notifications:', error);
    throw error;
  }
};

// Get unread count
export const getUnreadGroupNotificationCount = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/notifications/group/unread-count`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Mark notification as read
export const markGroupNotificationAsRead = async (notificationId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/notifications/group/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllGroupNotificationsAsRead = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/notifications/group/read-all`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get invitation details
export const getInvitationDetails = async (invitationId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/invite/${invitationId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching invitation details:', error);
    throw error;
  }
};

// Respond to invitation
export const respondToInvitation = async (invitationId, status) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/invite/${invitationId}/respond`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error responding to invitation:', error);
    throw error;
  }
};