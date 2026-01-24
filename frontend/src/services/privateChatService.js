import axios from 'axios';

const API_URL = 'http://localhost:5000/api/private-chat';

// Set up axios instance with auth token
const privateChatAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
privateChatAPI.interceptors.request.use(
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

// Check mutual follow status
export const checkMutualFollow = async (userId) => {
  try {
    const response = await privateChatAPI.get(`/check-mutual/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking mutual follow:', error);
    throw error;
  }
};

// Start or get private chat
export const startPrivateChat = async (userId) => {
  try {
    const response = await privateChatAPI.post('/', { userId });
    return response.data;
  } catch (error) {
    console.error('Error starting private chat:', error);
    throw error;
  }
};

// Get all private chats
export const getMyPrivateChats = async () => {
  try {
    const response = await privateChatAPI.get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching private chats:', error);
    throw error;
  }
};

// Get specific private chat
export const getPrivateChatById = async (chatId) => {
  try {
    const response = await privateChatAPI.get(`/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
};

// Get messages for chat
export const getPrivateMessages = async (chatId, page = 1, limit = 50) => {
  try {
    const response = await privateChatAPI.get(`/${chatId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Send message
export const sendPrivateMessage = async (chatId, text) => {
  try {
    const response = await privateChatAPI.post(`/${chatId}/messages`, { text });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId) => {
  try {
    const response = await privateChatAPI.put(`/${chatId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Delete chat
export const deletePrivateChat = async (chatId) => {
  try {
    const response = await privateChatAPI.delete(`/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};