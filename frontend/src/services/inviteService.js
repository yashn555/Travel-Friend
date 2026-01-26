// frontend/src/services/inviteService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get group details
export const getGroupDetails = async (groupId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/groups/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching group details:', error);
    throw error;
  }
};

// Get user's connections (followers + following)
export const getConnections = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/invite/connections`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
};

// Prepare invitation data
export const prepareInvitationData = (selectedFriends) => {
  console.log('📝 Preparing invitation data for:', selectedFriends);
  
  const userIds = [];
  const emails = [];
  
  selectedFriends.forEach(friend => {
    if (friend._id) {
      userIds.push(friend._id);
    }
    if (friend.email) {
      emails.push(friend.email);
    }
  });
  
  const invitationData = {
    userIds: userIds.filter(id => id),
    emails: emails.filter(email => email)
  };
  
  console.log('✅ Prepared invitation data:', invitationData);
  return invitationData;
};

// Invite friends to group
export const inviteFriendsToGroup = async (groupId, invitationData) => {
  try {
    console.log('🚀 Sending invitation for group:', groupId);
    console.log('📤 Invitation data:', invitationData);
    
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/invite/${groupId}/send`,
      invitationData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Invitation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [InviteService] Error inviting friends:', error);
    
    let errorMessage = 'Failed to send invitations';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      console.error('Server response:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Network error: No response from server';
    } else {
      // Something else happened
      errorMessage = error.message || 'Unknown error';
    }
    
    throw new Error(errorMessage);
  }
};

// Get group invitations for current user
export const getGroupInvitations = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/invite/my-invitations`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching group invitations:', error);
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