import api from './api';

// Fetch all groups for dashboard / browse
export const fetchAllGroups = async () => {
  const response = await api.get('/groups/all-groups');
  return response.data.data;
};

// Get group by ID
export const getGroupById = async (groupId) => {
  const response = await api.get(`/groups/${groupId}`);
  return response.data.data;
};

// Send join request
export const sendJoinRequest = async (groupId, message = '') => {
  const response = await api.post('/groups/join-request', { groupId, message });
  return response.data;
};

// Get pending join requests (for admin)
export const getPendingRequests = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/requests`);
  return response.data.data;
};

// Approve or Reject request
export const handleJoinRequest = async (groupId, requestId, action) => {
  const response = await api.put('/groups/handle-request', { groupId, requestId, action });
  return response.data;
};

// Get user's groups
export const getMyGroups = async () => {
  const response = await api.get('/groups/my-groups');
  return response.data.data;
};

// Create new group
export const createGroup = async (groupData) => {
  const response = await api.post('/groups/create', groupData);
  return response.data;
};

// Alias functions for compatibility
export const getAllGroups = fetchAllGroups;
export const requestJoinGroup = sendJoinRequest;