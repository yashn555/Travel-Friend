import api from './api';

export const getConnections = async (userId) => {
  try {
    console.log('👥 [InviteService] Getting connections for user:', userId);
    
    // Use your existing profile endpoints
    const [followersRes, followingRes] = await Promise.all([
      api.get(`/profile/followers`), // Adjust endpoint as needed
      api.get(`/profile/following`)  // Adjust endpoint as needed
    ]);
    
    const followers = followersRes.data?.data || followersRes.data || [];
    const following = followingRes.data?.data || followingRes.data || [];
    
    // Combine and remove duplicates
    const allConnections = [...followers, ...following];
    const uniqueMap = new Map();
    
    allConnections.forEach(connection => {
      if (connection._id && !uniqueMap.has(connection._id.toString())) {
        uniqueMap.set(connection._id.toString(), connection);
      }
    });
    
    const uniqueConnections = Array.from(uniqueMap.values());
    console.log(`✅ Found ${uniqueConnections.length} unique connections`);
    
    return uniqueConnections;
  } catch (error) {
    console.error('❌ [InviteService] Error getting connections:', error);
    throw error;
  }
};

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
  console.log(`🎯 Handling ${action} for request ${requestId} in group ${groupId}`);
  
  // OPTION 1: Use the route with URL parameters (RECOMMENDED)
  const response = await api.put(`/groups/${groupId}/handle-request/${requestId}`, { action });
  
  // OPTION 2: If you prefer body parameters, keep current but ensure backend handles it
  // const response = await api.put('/groups/handle-request', { groupId, requestId, action });
  
  console.log('✅ Response:', response.data);
  return response.data;
};

// Get user's groups
export const getMyGroups = async () => {
  const response = await api.get('/groups/my-groups');
  return response.data.data;
};

// Create new group
// In frontend/src/services/groupService.js - update createGroup function:

// Create new group
export const createGroup = async (groupData) => {
  const response = await api.post('/groups/create', groupData);
  return response.data;
};

// Update group
export const updateGroup = async (groupId, groupData) => {
  const response = await api.put(`/groups/${groupId}`, groupData);
  return response.data;
};

// Delete group
export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/groups/${groupId}`);
  return response.data;
};

// Alias functions for compatibility
export const getAllGroups = fetchAllGroups;
export const requestJoinGroup = sendJoinRequest;

// SMART TRIP SYSTEM ADDITION: AI Trip Planner Services
export const generateAIPlan = async (groupId) => {
  const response = await api.post(`/groups/${groupId}/generate-ai-plan`);
  return response.data;
};

export const getAIPlanStatus = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/ai-plan-status`);
  return response.data.data;
};

// SMART TRIP SYSTEM ADDITION: Group Booking & Payment Services
export const enableGroupBooking = async (groupId, bookingData) => {
  const response = await api.post(`/groups/${groupId}/enable-booking`, bookingData);
  return response.data;
};

export const recordPayment = async (groupId, paymentData) => {
  const response = await api.post(`/groups/${groupId}/record-payment`, paymentData);
  return response.data;
};

export const getPaymentSummary = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/payment-summary`);
  return response.data.data;
};

export const createRazorpayOrder = async (groupId, orderData) => {
  const response = await api.post(`/groups/${groupId}/create-razorpay-order`, orderData);
  return response.data;
};

// SMART TRIP SYSTEM ADDITION: Location-based group search (optional)
export const searchGroupsByLocation = async (lat, lng, radius) => {
  const response = await api.get('/groups/location/search', {
    params: { lat, lng, radius }
  });
  return response.data.data;
};

// Invite friends to group
export const inviteFriendsToGroup = async (groupId, data) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/groups/${groupId}/invite-friends`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response;
};

// Get group details
export const getGroupDetails = async (groupId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/groups/${groupId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response;
};

// Get group invitations
export const getGroupInvitations = async (groupId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/groups/${groupId}/invitations`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response;
};

// Get my invitations
export const getMyInvitations = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/groups/invitations/me`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response;
};

// Respond to invitation
export const respondToInvitation = async (invitationId, status) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(
    `${API_URL}/groups/invitations/${invitationId}/respond`,
    { status },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response;
};