// frontend/src/pages/trips/InviteFriendsToTrip.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FaUserFriends, 
  FaUserCheck, 
  FaUserPlus, 
  FaPaperPlane,
  FaArrowLeft,
  FaSearch,
  FaCheckCircle,
  FaTimes,
  FaSpinner,
  FaUser,
  FaUsers,
  FaExclamationTriangle,
  FaSync,
  FaInfoCircle,
  FaEnvelope
} from 'react-icons/fa';
import { 
  getGroupDetails, 
  inviteFriendsToGroup, 
  getConnections,
  prepareInvitationData
} from '../../services/inviteService';

const InviteFriendsToTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user from Redux - handle multiple possible structures
  const authState = useSelector((state) => state.auth);
  
  // Debug: Log the full auth state to understand structure
  console.log('🔍 Full Redux auth state:', authState);
  
  // Extract user and userId from various possible locations
  let user = null;
  let userId = null;
  
  if (authState) {
    // Try different possible structures
    user = authState.user || authState.userData || authState.data?.user || authState.data;
    
    if (user) {
      userId = user._id || user.id || user.userId;
    } else if (authState.userId) {
      userId = authState.userId;
    } else if (authState.data?._id) {
      userId = authState.data._id;
    }
  }
  
  console.log('📊 Extracted user info:', { user, userId, userObject: user });

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupDetails, setGroupDetails] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingInvites, setSendingInvites] = useState(false);
  const [actualGroupId, setActualGroupId] = useState('');
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [attemptedConnectionLoad, setAttemptedConnectionLoad] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  // Extract group ID from URL
  useEffect(() => {
    console.log('🚀 InviteFriendsToTrip Component Loaded');
    
    let determinedGroupId = '';
    
    // Priority 1: URL parameter
    if (id && id !== ':id' && id !== 'undefined') {
      determinedGroupId = id;
    } 
    // Priority 2: Extract from URL path
    else {
      const pathParts = window.location.pathname.split('/');
      if (pathParts.length >= 3 && pathParts[1] === 'groups') {
        determinedGroupId = pathParts[2];
      }
    }
    
    console.log('🎯 Determined groupId:', determinedGroupId);
    setActualGroupId(determinedGroupId);
    
    if (determinedGroupId) {
      loadGroupData(determinedGroupId);
    } else {
      setMessage('Could not find the trip. Please go back to your trip page.');
      setLoading(false);
    }
  }, [id]);

  // Check if user data is available in Redux
  useEffect(() => {
    if (authState && !userChecked) {
      console.log('🔄 Checking user data in Redux...');
      setUserChecked(true);
      
      if (!userId && authState.isAuthenticated) {
        console.log('⚠️ User is authenticated but ID not found. Full auth state:', authState);
        setMessage('User data loading... Please wait.');
      }
    }
  }, [authState, userId, userChecked]);

  // Load connections when user ID is available
  useEffect(() => {
    console.log('🔄 useEffect for connections:', {
      userId,
      actualGroupId,
      hasGroupDetails: !!groupDetails,
      loadingConnections,
      attemptedConnectionLoad
    });
    
    if (userId && actualGroupId && groupDetails && !loadingConnections && !attemptedConnectionLoad) {
      console.log('✅ All conditions met, loading connections...');
      loadConnections();
    } else if (groupDetails && !userId) {
      console.log('⚠️ Waiting for user ID...');
      // Try to extract from localStorage as fallback
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId && !attemptedConnectionLoad) {
        console.log('🔍 Found user ID in localStorage:', storedUserId);
        // Don't call loadConnections here, let the useEffect handle it
      }
    }
  }, [userId, actualGroupId, groupDetails, loadingConnections, attemptedConnectionLoad]);

  const loadGroupData = async (groupId) => {
    try {
      setLoading(true);
      setMessage('Loading trip details...');
      console.log('📡 Loading group data for:', groupId);
      
      const groupResponse = await getGroupDetails(groupId);
      
      if (groupResponse && (groupResponse.data || groupResponse)) {
        const groupData = groupResponse.data || groupResponse;
        setGroupDetails(groupData);
        console.log('✅ Group loaded:', groupData.destination);
        setMessage('');
      } else {
        throw new Error('No group data received');
      }
      
    } catch (error) {
      console.error('❌ Error loading group:', error);
      setMessage(`Error loading trip: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Check which connections are already group members
  const checkConnectionMembership = (connectionsList) => {
    if (!groupDetails || !connectionsList.length) return connectionsList;
    
    const groupMemberIds = new Set(
      groupDetails.members?.map(member => 
        typeof member === 'object' ? (member._id || member.id || member.userId) : member
      ).filter(Boolean) || []
    );
    
    console.log('👥 Group member IDs:', Array.from(groupMemberIds));
    
    // Mark connections that are already members
    return connectionsList.map(connection => {
      const connectionId = connection._id || connection.id || connection.userId;
      const isMember = groupMemberIds.has(connectionId?.toString());
      return {
        ...connection,
        isMember: isMember,
        canInvite: !isMember
      };
    });
  };

  const loadConnections = async () => {
    if (!userId) {
      console.error('❌ Cannot load connections: No user ID');
      setMessage('Cannot load connections: User not identified');
      return;
    }
    
    try {
      setLoadingConnections(true);
      setAttemptedConnectionLoad(true);
      setMessage('Loading your connections...');
      
      console.log('📡 Loading connections for user:', userId);
      
      // Store userId in localStorage as backup
      localStorage.setItem('userId', userId);
      
      const connectionsList = await getConnections();
      console.log(`✅ Loaded ${connectionsList?.length || 0} connections`);
      
      if (connectionsList && connectionsList.length > 0) {
        // Check which connections are already group members
        const connectionsWithMembership = checkConnectionMembership(connectionsList);
        
        // Filter out already-member connections from selection
        const availableConnections = connectionsWithMembership.filter(conn => conn.canInvite);
        const alreadyMembers = connectionsWithMembership.filter(conn => conn.isMember);
        
        console.log(`📊 Available connections: ${availableConnections.length}`);
        console.log(`📊 Already members: ${alreadyMembers.length}`);
        
        setConnections(connectionsWithMembership);
        setFilteredConnections(connectionsWithMembership);
        
        // Clear selection of already-member friends
        const newSelectedUsers = selectedUsers.filter(userId => {
          const connection = connectionsWithMembership.find(c => 
            (c._id || c.id || c.userId) === userId
          );
          return !connection?.isMember;
        });
        
        if (newSelectedUsers.length !== selectedUsers.length) {
          setSelectedUsers(newSelectedUsers);
        }
        
        if (alreadyMembers.length > 0) {
          setMessage(`${alreadyMembers.length} of your connections are already in this group. They won't be shown as selectable.`);
        } else {
          setMessage('');
        }
        
      } else {
        setConnections([]);
        setFilteredConnections([]);
        setMessage('No connections found. Follow some users to see them here.');
      }
      
    } catch (error) {
      console.error('❌ Error loading connections:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Could not load connections. ';
      
      if (error.response?.status === 401) {
        errorMessage += 'Please log in again.';
      } else if (error.response?.status === 404) {
        errorMessage += 'Connection endpoint not found.';
      } else {
        errorMessage += error.response?.data?.message || error.message || 'Please try again.';
      }
      
      setMessage(errorMessage);
      setConnections([]);
      setFilteredConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleManualLoadConnections = () => {
    console.log('🔄 Manual connection load triggered');
    
    // Try multiple sources for user ID
    let userIdToUse = userId;
    
    if (!userIdToUse) {
      // Try localStorage
      userIdToUse = localStorage.getItem('userId');
      console.log('🔍 Using userId from localStorage:', userIdToUse);
    }
    
    if (!userIdToUse && authState) {
      // Try to extract from authState
      console.log('🔍 Trying to extract from authState:', authState);
      
      // Deep search for ID
      const findUserId = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj._id) return obj._id;
        if (obj.id) return obj.id;
        if (obj.userId) return obj.userId;
        
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
            const found = findUserId(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };
      
      userIdToUse = findUserId(authState);
      console.log('🔍 Found userId in authState:', userIdToUse);
    }
    
    if (userIdToUse) {
      loadConnections();
    } else {
      console.error('❌ No user ID found anywhere');
      setMessage('User not identified. Please refresh the page or log in again.');
    }
  };

  // Filter connections based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConnections(connections);
    } else {
      const filtered = connections.filter(conn =>
        (conn.name && conn.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conn.username && conn.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conn.email && conn.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredConnections(filtered);
    }
  }, [searchTerm, connections]);

  const toggleUserSelection = (userId) => {
    // Don't allow selecting already-member friends
    const connection = connections.find(c => 
      (c._id || c.id || c.userId) === userId
    );
    
    if (connection?.isMember) {
      setMessage(`${connection.name} is already a member of this group and cannot be invited.`);
      return;
    }
    
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    // Only select friends who can be invited (not already members)
    const invitableConnections = connections.filter(conn => conn.canInvite);
    const invitableUserIds = invitableConnections.map(user => user._id || user.id || user.userId).filter(Boolean);
    
    if (selectedUsers.length === invitableUserIds.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(invitableUserIds);
    }
  };

  const handleSendInvitations = async () => {
    try {
      console.log('🔄 [handleSendInvitations] Starting invitation process...');
      
      if (!selectedUsers || selectedUsers.length === 0) {
        const errorMsg = 'No friends selected. Please select at least one friend to invite.';
        setError(errorMsg);
        setMessage(errorMsg);
        return;
      }
      
      const selectedFriends = connections.filter(conn => 
        selectedUsers.includes(conn._id || conn.id || conn.userId) && conn.canInvite
      );
      
      console.log('📊 Selected invitable friends:', selectedFriends.length);
      
      if (selectedFriends.length === 0) {
        const errorMsg = 'Selected friends cannot be invited (they may already be members). Please select different friends.';
        setError(errorMsg);
        setMessage(errorMsg);
        return;
      }
      
      const invitationData = prepareInvitationData(selectedFriends);
      console.log('✅ Prepared invitation data:', invitationData);
      
      // Add custom message if provided
      if (invitationMessage.trim()) {
        invitationData.message = invitationMessage;
      }
      
      setSendingInvites(true);
      setMessage(`Sending ${selectedFriends.length} invitation(s)...`);
      
      const result = await inviteFriendsToGroup(actualGroupId, invitationData);
      console.log('✅ Invitation response:', JSON.stringify(result, null, 2));
      
      // Process results
      if (result.invitations && result.invitations.length > 0) {
        const successfulInvites = result.invitations.filter(inv => inv.success);
        const failedInvites = result.invitations.filter(inv => !inv.success);
        
        // Categorize failed invites
        const alreadyMembers = failedInvites.filter(inv => 
          inv.error?.includes('Already a member') || inv.type === 'already_member'
        );
        const alreadyInvited = failedInvites.filter(inv => 
          inv.error?.includes('Already invited') || inv.type === 'already_invited'
        );
        const usersNotFound = failedInvites.filter(inv => 
          inv.error?.includes('User not found') || inv.type === 'user_not_found'
        );
        const otherErrors = failedInvites.filter(inv => 
          !inv.error?.includes('Already a member') && 
          !inv.error?.includes('Already invited') && 
          !inv.error?.includes('User not found') &&
          inv.type !== 'already_member' &&
          inv.type !== 'already_invited' &&
          inv.type !== 'user_not_found'
        );
        
        // Build result message
        let resultMessage = '';
        let showSuccess = false;
        let showError = false;
        
        if (successfulInvites.length > 0) {
          showSuccess = true;
          resultMessage += `✅ Successfully sent ${successfulInvites.length} invitation(s)! `;
          
          // Show who was invited
          if (successfulInvites.length <= 3) {
            const names = successfulInvites.map(inv => inv.name || 'Unknown').join(', ');
            resultMessage += `Invitations sent to: ${names}. `;
          }
          
          // Add email info
          const emailsSent = successfulInvites.filter(inv => inv.email).length;
          if (emailsSent > 0) {
            resultMessage += `📧 Email notifications sent to ${emailsSent} friend(s). `;
          }
        }
        
        // Show detailed error messages
        if (alreadyMembers.length > 0) {
          showError = true;
          const names = alreadyMembers.map(inv => inv.name || 'Unknown').join(', ');
          resultMessage += `⚠️ ${alreadyMembers.length} friend(s) already in group: ${names}. `;
        }
        
        if (alreadyInvited.length > 0) {
          showError = true;
          const names = alreadyInvited.map(inv => inv.name || 'Unknown').join(', ');
          resultMessage += `📨 ${alreadyInvited.length} friend(s) already invited: ${names}. `;
        }
        
        if (usersNotFound.length > 0) {
          showError = true;
          resultMessage += `❌ ${usersNotFound.length} friend(s) not found. `;
        }
        
        if (otherErrors.length > 0) {
          showError = true;
          resultMessage += `⚠️ ${otherErrors.length} invitation(s) failed due to errors. `;
        }
        
        if (successfulInvites.length === 0) {
          // No invitations were sent
          if (alreadyMembers.length > 0) {
            setError('Selected friends are already in this group. Please select different friends.');
            setMessage('❌ Selected friends are already in this group.');
          } else if (alreadyInvited.length > 0) {
            setError('Selected friends have already been invited.');
            setMessage('❌ Selected friends have already been invited.');
          } else {
            setError('No invitations were sent. Please try again.');
            setMessage('❌ No invitations were sent.');
          }
        } else {
          // Some invitations were successful
          if (showSuccess) {
            setSuccessMessage(resultMessage);
          }
          if (showError) {
            setError(resultMessage);
          }
          setMessage(resultMessage);
          
          // Clear selection of successful invites
          const successfulUserIds = successfulInvites
            .map(inv => inv.userId)
            .filter(Boolean);
          
          if (successfulUserIds.length > 0) {
            const newSelectedUsers = selectedUsers.filter(
              userId => !successfulUserIds.includes(userId)
            );
            setSelectedUsers(newSelectedUsers);
          }
          
          // Clear custom message
          setInvitationMessage('');
          setShowMessageInput(false);
          
          // Navigate after 3 seconds if all were successful
          if (failedInvites.length === 0) {
            setTimeout(() => {
              navigate(`/groups/${actualGroupId}`);
            }, 3000);
          }
        }
        
      } else {
        // No invitations array in response
        setError('Unexpected response from server. Please try again.');
        setMessage('❌ Unexpected response from server.');
      }
      
    } catch (error) {
      console.error('❌ Error sending invitations:', error);
      
      // Show user-friendly error message
      let userErrorMessage = error.message;
      
      if (error.message.includes('No valid userIds')) {
        userErrorMessage = 'The selected friends do not have valid user information. Please try selecting different friends.';
      } else if (error.message.includes('No friends selected')) {
        userErrorMessage = 'Please select at least one friend to invite.';
      } else if (error.message.includes('Permission denied')) {
        userErrorMessage = 'Only the trip creator can send invitations.';
      } else if (error.message.includes('Group not found')) {
        userErrorMessage = 'Trip not found. Please refresh the page.';
      } else if (error.message.includes('Group is already full')) {
        userErrorMessage = 'This trip is already full. You cannot invite more friends.';
      }
      
      setError(userErrorMessage);
      setMessage(`❌ ${userErrorMessage}`);
      
    } finally {
      setSendingInvites(false);
    }
  };

  const handleSkip = () => {
    navigate(`/groups/${actualGroupId}`);
  };

  const getProfileImage = (user) => {
    if (user.profilePicture) return user.profilePicture;
    if (user.avatar) return user.avatar;
    if (user.profileImage) return user.profileImage;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'User')}&background=3b82f6&color=fff&size=128`;
  };

  // Count available (invitable) connections
  const invitableConnections = connections.filter(conn => conn.canInvite);
  const alreadyMemberConnections = connections.filter(conn => conn.isMember);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{message || 'Loading trip details...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/groups/${actualGroupId || ''}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Trip
          </button>
          
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Invite Connections ✈️</h1>
            <p className="text-blue-100">
              {groupDetails?.destination 
                ? `Invite friends to join your trip to ${groupDetails.destination}`
                : 'Invite friends to join your trip'}
            </p>
            <div className="mt-2 text-sm text-blue-200 flex items-center">
              <FaUser className="mr-2" />
              User: {user?.name || user?.username || 'Loading...'} 
              {userId && <span className="ml-2">(ID: {userId.substring(0, 8)}...)</span>}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
            <div className="flex items-center">
              <span className="text-xl mr-2">✅</span>
              <span className="flex-1">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <div className="flex items-center">
              <span className="text-xl mr-2">❌</span>
              <span className="flex-1">{error}</span>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && !successMessage && !error && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.includes('❌') || message.includes('Error') || message.includes('Failed') || message.includes('Could not')
              ? 'bg-red-50 border border-red-200 text-red-700' 
              : message.includes('✅')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-2">
                {message.includes('❌') || message.includes('Error') || message.includes('Failed') ? '❌' : 
                 message.includes('✅') ? '✅' : '💡'}
              </span>
              <span className="flex-1">{message}</span>
              {message.includes('Could not load connections') && (
                <button
                  onClick={handleManualLoadConnections}
                  className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center"
                >
                  <FaSync className="mr-2" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Trip Info Card */}
        {groupDetails && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{groupDetails.destination || 'Your Trip'}</h3>
                <p className="text-gray-600 mt-1">{groupDetails.description || 'No description available'}</p>
                <div className="flex items-center mt-3 text-sm text-gray-500">
                  <span className="mr-4">📅 {new Date(groupDetails.startDate || Date.now()).toLocaleDateString()} - {new Date(groupDetails.endDate || Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  <span>👥 {groupDetails.members?.length || 1}/{groupDetails.maxMembers || 4} members</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-lg font-bold text-blue-600">
                  ₹{groupDetails.budget?.min || 0} - ₹{groupDetails.budget?.max || 0}
                </div>
                <div className="text-sm text-gray-500">Budget per person</div>
              </div>
            </div>
            
            {/* Custom Message Input */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowMessageInput(!showMessageInput)}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <FaEnvelope className="mr-2" />
                {showMessageInput ? 'Hide Custom Message' : 'Add Custom Message'}
              </button>
              
              {showMessageInput && (
                <div className="mt-3">
                  <textarea
                    placeholder="Add a personal message to your invitation (optional)"
                    value={invitationMessage}
                    onChange={(e) => setInvitationMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    maxLength="500"
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {invitationMessage.length}/500 characters
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connections Loading State */}
        {loadingConnections ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your connections...</p>
          </div>
        ) : (
          <>
            {/* Search & Stats Bar */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search connections by name or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{invitableConnections.length}</div>
                    <div className="text-sm text-gray-500">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedUsers.length}</div>
                    <div className="text-sm text-gray-500">Selected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">{alreadyMemberConnections.length}</div>
                    <div className="text-sm text-gray-500">In Group</div>
                  </div>
                  <button
                    onClick={handleManualLoadConnections}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center text-sm"
                    title="Reload connections"
                  >
                    <FaSync className="mr-1" />
                    Reload
                  </button>
                </div>
              </div>
            </div>

            {/* Connections List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <FaUsers className="mr-3 text-blue-500" />
                      Your Connections
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {invitableConnections.length} available to invite • {alreadyMemberConnections.length} already in group
                    </p>
                  </div>
                  {invitableConnections.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                    >
                      {selectedUsers.length === invitableConnections.length ? 'Deselect All' : 'Select All Available'}
                    </button>
                  )}
                </div>
              </div>

              {connections.length === 0 ? (
                <div className="p-8 text-center">
                  <FaUserFriends className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No connections found</p>
                  <p className="text-gray-500 text-sm mb-4">
                    {!userId 
                      ? 'User not identified. Please refresh the page.' 
                      : 'Follow some users or get followed to see connections here.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleManualLoadConnections}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
                    >
                      <FaSync className="mr-2" />
                      Load Connections
                    </button>
                    <button
                      onClick={() => navigate('/find-friends')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Find Friends
                    </button>
                  </div>
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="p-8 text-center">
                  <FaSearch className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No connections match "{searchTerm}"</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {filteredConnections.map(connection => {
                    const isAlreadyMember = connection.isMember;
                    const isSelected = selectedUsers.includes(connection._id || connection.id || connection.userId);
                    
                    return (
                      <div
                        key={connection._id || connection.id}
                        className={`p-4 transition-colors ${
                          isSelected ? 'bg-blue-50' : 
                          isAlreadyMember ? 'bg-gray-50' : 
                          'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={isAlreadyMember ? undefined : () => toggleUserSelection(connection._id || connection.id || connection.userId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <img
                                src={getProfileImage(connection)}
                                alt={connection.name}
                                className={`w-12 h-12 rounded-full border-2 shadow ${
                                  isAlreadyMember ? 'border-red-300 opacity-70' : 
                                  isSelected ? 'border-green-500' : 
                                  'border-white'
                                }`}
                              />
                              {isSelected && !isAlreadyMember && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                                  <FaCheckCircle size={16} />
                                </div>
                              )}
                              {isAlreadyMember && (
                                <div className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full p-1">
                                  <FaUsers size={12} />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h4 className="font-semibold text-gray-800">
                                  {connection.name || connection.username || 'Unknown User'}
                                </h4>
                                {isAlreadyMember && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                    Already in group
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                @{connection.username || connection.email?.split('@')[0] || 'user'}
                              </p>
                              {connection.interests && connection.interests.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {connection.interests.slice(0, 3).map(interest => (
                                    <span
                                      key={interest}
                                      className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {isAlreadyMember ? (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center">
                                <FaInfoCircle className="mr-1" />
                                Member
                              </span>
                            ) : isSelected ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleUserSelection(connection._id || connection.id || connection.userId);
                                }}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center"
                              >
                                <FaTimes className="mr-2" />
                                Remove
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleUserSelection(connection._id || connection.id || connection.userId);
                                }}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
                              >
                                <FaUserPlus className="mr-2" />
                                Select
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={handleSkip}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Skip for Now
              </button>
              
              <button
                onClick={handleSendInvitations}
                disabled={sendingInvites || selectedUsers.length === 0}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 font-medium shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {sendingInvites ? (
                  <>
                    <FaSpinner className="animate-spin mr-3" />
                    Sending {selectedUsers.length} Invitation(s)...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Send {selectedUsers.length} Invitation{selectedUsers.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-bold text-blue-800 mb-2 flex items-center">
            <FaUserCheck className="mr-2" />
            How It Works
          </h4>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Select people from your followers + following list</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Friends already in the group are shown but cannot be selected</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Selected users will receive a trip invitation and email notification</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>They can accept or decline the invitation in their notifications</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Accepted users automatically join your trip group</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InviteFriendsToTrip;