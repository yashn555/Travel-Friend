// src/services/chatService.js
import api from './api';

// Get group chat
export const getGroupChat = async (groupId) => {
  const response = await api.get(`/chat/group/${groupId}`);
  return response.data.data;
};

// Send message to group chat
export const sendMessage = async (groupId, text) => {
  const response = await api.post(`/chat/group/${groupId}/message`, { text });
  return response.data;
};

// Get user's chats
export const getMyChats = async () => {
  const response = await api.get('/chat/my-chats');
  return response.data.data;
};

// Add user to chat (admin only)
export const addUserToChat = async (groupId, userId) => {
  const response = await api.post(`/chat/group/${groupId}/add-user/${userId}`);
  return response.data;
};