// src/pages/groups/GroupRequests.jsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import { getMyGroups, handleJoinRequest, getPendingRequests } from '../../services/groupService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';

const GroupRequests = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchGroupsWithRequests = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching groups for user:', user?._id);
      
      // Get all groups where user is a member
      const allGroups = await getMyGroups();
      console.log('📋 All groups:', allGroups);
      
      if (!allGroups || allGroups.length === 0) {
        console.log('ℹ️ No groups found');
        setGroups([]);
        return;
      }
      
      // Filter groups where user is the creator
      const adminGroups = (allGroups || []).filter(group => {
        const isCreator = group.createdBy?._id === user?._id;
        console.log(`Group: ${group.destination}, Creator: ${group.createdBy?._id}, Is Creator: ${isCreator}`);
        return isCreator;
      });
      
      console.log('👑 Admin groups:', adminGroups);
      
      // Fetch join requests for each admin group
      const groupsWithRequests = await Promise.all(
        adminGroups.map(async (group) => {
          try {
            console.log(`📨 Fetching requests for group ${group._id}: ${group.destination}`);
            const requestsData = await getPendingRequests(group._id);
            console.log(`✅ Requests for ${group.destination}:`, requestsData);
            
            return {
              ...group,
              joinRequests: requestsData || []
            };
          } catch (error) {
            console.error(`❌ Error fetching requests for group ${group._id}:`, error.message);
            return { ...group, joinRequests: [] };
          }
        })
      );
      
      console.log('📊 Final groups with requests:', groupsWithRequests);
      setGroups(groupsWithRequests);
      
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      toast.error('Failed to load join requests');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchGroupsWithRequests();
    }
  }, [user]);

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
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
        <span className="ml-3 text-gray-600">Loading requests...</span>
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
      
      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Groups to Manage</h2>
          <p className="text-gray-600 mb-6">Create a group to receive join requests</p>
          <button 
            onClick={() => navigate('/create-trip')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create Your First Group
          </button>
        </div>
      ) : totalPendingRequests === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Pending Requests</h2>
          <p className="text-gray-600">All join requests have been processed</p>
          <div className="mt-6 flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/my-groups')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              View My Groups
            </button>
            <button 
              onClick={fetchGroupsWithRequests}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => {
            const pendingRequests = group.joinRequests?.filter(req => req.status === 'pending') || [];
            
            if (pendingRequests.length === 0) return null;
            
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
                          {group.currentMembers?.filter(m => m.status === 'approved').length || 0}/{group.maxMembers} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        {pendingRequests.length} request{pendingRequests.length > 1 ? 's' : ''}
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
                                <p className="text-gray-500 text-sm">{req.user?.email}</p>
                              </div>
                            </div>
                            
                            <div className="ml-16">
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-gray-700">
                                  <span className="font-medium">Message: </span> 
                                  {req.message || 'No message provided'}
                                </p>
                              </div>
                              <div className="flex items-center text-gray-500 text-sm">
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  Requested on: {new Date(req.requestedAt || req.createdAt).toLocaleDateString()}
                                </span>
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
      
      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700">Debug Information</h3>
            <button 
              onClick={fetchGroupsWithRequests}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
            >
              Refresh Data
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">User ID:</p>
              <p className="font-mono text-xs">{user?._id}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Groups:</p>
              <p className="font-bold">{groups.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Pending Requests:</p>
              <p className="font-bold">{totalPendingRequests}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              console.log('📊 Groups Data:', groups);
              console.log('👤 User:', user);
              console.log('🔄 Refreshing...');
            }}
            className="mt-3 text-sm text-blue-500 hover:text-blue-600"
          >
            Log Data to Console
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupRequests;