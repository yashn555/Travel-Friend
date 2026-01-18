// frontend/src/pages/groups/GroupRequests.jsx
import React, { useEffect, useState } from 'react';
import { getMyGroups, handleJoinRequest } from '../../services/groupService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';

const GroupRequests = () => {
  const navigate = useNavigate();
  const { user: authUser } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  // Get user from multiple sources
  const getUserId = () => {
    // Try Redux first
    if (authUser?._id) return authUser._id;
    if (authUser?.id) return authUser.id;
    
    // Try localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        return parsed._id || parsed.id || parsed.userId;
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  
  const userId = getUserId();

  const fetchGroupsWithRequests = async () => {
    try {
      setLoading(true);
      setDebugInfo('🔄 Starting to fetch groups...');
      
      console.log('🔄 Auth User from Redux:', authUser);
      console.log('🔄 Extracted User ID:', userId);
      
      if (!userId) {
        setDebugInfo('❌ No user ID found. Please log in again.');
        setGroups([]);
        setLoading(false);
        return;
      }

      // Get all groups where user is a member
      const allGroups = await getMyGroups();
      console.log('📋 All groups data:', allGroups);
      setDebugInfo(`Found ${allGroups?.length || 0} groups total`);
      
      if (!allGroups || allGroups.length === 0) {
        console.log('ℹ️ No groups found');
        setGroups([]);
        setDebugInfo('No groups found for user');
        return;
      }
      
      // Filter groups where user is the creator
      const adminGroups = (allGroups || []).filter(group => {
        // Check if user is the creator
        const groupCreatorId = group.createdBy?._id || group.createdBy;
        const isCreator = groupCreatorId === userId;
        
        console.log(`Group: ${group.destination}, Creator ID: ${groupCreatorId}, User ID: ${userId}, Is Creator: ${isCreator}`);
        return isCreator;
      });
      
      console.log('👑 Admin groups found:', adminGroups);
      setDebugInfo(`Found ${adminGroups.length} admin groups`);
      
      if (adminGroups.length === 0) {
        setGroups([]);
        setDebugInfo('User is not the creator of any group');
        return;
      }
      
      // Fetch join requests for each admin group
      const groupsWithRequests = await Promise.all(
        adminGroups.map(async (group) => {
          try {
            console.log(`📨 Fetching requests for group ${group._id}: ${group.destination}`);
            
            // Try to fetch from API endpoint
            const response = await fetch(`http://localhost:5000/api/groups/${group._id}/requests`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              console.log(`⚠️ No requests API for group ${group._id}: ${response.status}`);
              return { ...group, joinRequests: [] };
            }
            
            const data = await response.json();
            console.log(`✅ Requests for ${group.destination}:`, data);
            
            if (data.success) {
              return {
                ...group,
                joinRequests: data.data || []
              };
            } else {
              return { ...group, joinRequests: [] };
            }
          } catch (error) {
            console.error(`❌ Error fetching requests for group ${group._id}:`, error.message);
            return { ...group, joinRequests: [] };
          }
        })
      );
      
      // Filter groups that actually have pending requests
      const groupsWithPendingRequests = groupsWithRequests.filter(group => {
        const pending = group.joinRequests?.filter(req => req.status === 'pending') || [];
        return pending.length > 0;
      });
      
      console.log('📊 Groups with pending requests:', groupsWithPendingRequests.length);
      setGroups(groupsWithPendingRequests);
      
      const totalPending = groupsWithPendingRequests.reduce((sum, g) => {
        return sum + (g.joinRequests?.filter(r => r.status === 'pending').length || 0);
      }, 0);
      
      setDebugInfo(`Found ${groupsWithPendingRequests.length} groups with ${totalPending} pending requests`);
      
    } catch (error) {
      console.error('❌ Error in fetchGroupsWithRequests:', error);
      toast.error('Failed to load join requests');
      setGroups([]);
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered, checking user...');
    console.log('🔍 LocalStorage token exists:', !!localStorage.getItem('token'));
    
    if (userId) {
      console.log('✅ User ID available:', userId);
      fetchGroupsWithRequests();
    } else {
      console.log('❌ No user ID available');
      setLoading(false);
      setDebugInfo('No user logged in or user ID not found');
    }
  }, [authUser]);

  const handleRequest = async (groupId, requestId, action) => {
    try {
      setProcessing(true);
      console.log(`⚡ Handling request ${action} for request ${requestId} in group ${groupId}`);
      
      await handleJoinRequest(groupId, requestId, action);
      
      toast.success(`Request ${action}d successfully!`);
      
      // Refresh data
      fetchGroupsWithRequests();
      
    } catch (error) {
      console.error('❌ Error handling request:', error);
      toast.error(error.response?.data?.message || `Error ${action}ing request`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader size="lg" />
        <span className="ml-3 text-gray-600">Loading requests...</span>
        <span className="mt-2 text-sm text-gray-500">{debugInfo}</span>
      </div>
    );
  }

  // Calculate total pending requests
  const totalPendingRequests = groups.reduce((total, group) => {
    return total + (group.joinRequests?.filter(req => req.status === 'pending').length || 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Group Join Requests</h1>
          <p className="text-gray-600">Manage join requests for your groups</p>
        </div>
        
        {totalPendingRequests > 0 && (
          <div className="flex items-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
              {totalPendingRequests} pending request{totalPendingRequests !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      {/* Debug Info - Always show */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-700">Debug Information</h3>
            <p className="text-sm text-gray-600">{debugInfo}</p>
            <p className="text-sm text-gray-600">User ID: {userId || 'Not found'}</p>
          </div>
          <button 
            onClick={() => {
              console.log('Debug Logs:', {
                authUser,
                userId,
                groups,
                debugInfo
              });
              fetchGroupsWithRequests();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Pending Requests Found</h2>
          <p className="text-gray-600 mb-6">{debugInfo || 'You need to be the creator of a group to receive join requests'}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/create-trip')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create a Group
            </button>
            <button 
              onClick={() => navigate('/my-groups')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              View My Groups
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => {
            const pendingRequests = group.joinRequests?.filter(req => req.status === 'pending') || [];
            
            return (
              <div key={group._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{group.destination}</h2>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-gray-600">
                          {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                        </p>
                        <span className="text-gray-500">•</span>
                        <p className="text-gray-600">
                          Members: {group.currentMembers?.filter(m => m.status === 'approved').length || 0}/{group.maxMembers}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}
                      </span>
                      <button 
                        onClick={() => navigate(`/groups/${group._id}`)}
                        className="text-blue-500 hover:text-blue-600 font-medium"
                      >
                        View Group →
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {pendingRequests.map((req, index) => (
                      <div key={req._id || index} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-blue-600 font-bold text-lg">
                                  {req.user?.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800">{req.user?.name || 'Unknown User'}</h4>
                                <p className="text-gray-500 text-sm">{req.user?.email || 'No email'}</p>
                                <p className="text-gray-500 text-sm">Requested: {new Date(req.requestedAt || req.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div className="ml-16">
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-gray-700">
                                  <span className="font-medium">Message: </span> 
                                  {req.message || 'No message provided'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
                            <button 
                              onClick={() => handleRequest(group._id, req._id, 'approve')}
                              disabled={processing}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing ? 'Processing...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => handleRequest(group._id, req._id, 'reject')}
                              disabled={processing}
                              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupRequests;