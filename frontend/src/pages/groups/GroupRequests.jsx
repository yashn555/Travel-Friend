// src/pages/groups/GroupRequests.jsx
import React, { useEffect, useState } from 'react';
import { getMyGroups, handleJoinRequest } from '../../services/groupService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const GroupRequests = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      console.log('Fetching groups for user:', user?._id);
      
      // Get all groups where user is the creator
      const allGroups = await getMyGroups(); // This gets groups user is a member of
      
      // Filter groups where user is the creator
      const adminGroups = (allGroups || []).filter(group => 
        group.createdBy?._id === user?._id
      );
      
      console.log('User groups:', allGroups);
      console.log('Admin groups (created by user):', adminGroups);
      
      // Fetch join requests for each admin group
      const groupsWithRequests = await Promise.all(
        adminGroups.map(async (group) => {
          try {
            // Get join requests for this group
            const requestsResponse = await fetch(`http://localhost:5000/api/groups/${group._id}/requests`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (requestsResponse.ok) {
              const requestsData = await requestsResponse.json();
              console.log(`Requests for group ${group._id}:`, requestsData);
              return {
                ...group,
                joinRequests: requestsData.data || []
              };
            }
            return { ...group, joinRequests: [] };
          } catch (error) {
            console.error(`Error fetching requests for group ${group._id}:`, error);
            return { ...group, joinRequests: [] };
          }
        })
      );
      
      console.log('Groups with requests:', groupsWithRequests);
      setGroups(groupsWithRequests);
      
    } catch (error) {
      console.error('Error fetching groups:', error);
      setMessage('Error loading group requests');
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchGroups();
    }
  }, [user]);

  const handleRequest = async (groupId, requestId, action) => {
    try {
      setMessage(`Processing ${action}...`);
      await handleJoinRequest(groupId, requestId, action);
      
      toast.success(`Request ${action}d successfully!`);
      setMessage('');
      
      // Refresh data
      fetchGroups();
      
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error(error.response?.data?.message || `Error ${action}ing request`);
      setMessage('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate total pending requests
  const totalPendingRequests = groups.reduce((total, group) => {
    return total + (group.joinRequests?.filter(req => req.status === 'pending').length || 0);
  }, 0);

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Group Join Requests</h1>
          <p className="text-gray-600">Manage join requests for your groups</p>
        </div>
        
        {totalPendingRequests > 0 && (
          <div className="flex items-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {totalPendingRequests} pending request{totalPendingRequests !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      {groups.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500 text-lg mb-2">You don't have any groups to manage</p>
          <p className="text-gray-400 mb-4">Create a group to receive join requests</p>
          <button 
            onClick={() => navigate('/create-trip')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create a Group
          </button>
        </div>
      ) : totalPendingRequests === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-500 text-lg">No pending join requests</p>
          <p className="text-gray-400">All requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => {
            const pendingRequests = group.joinRequests?.filter(req => req.status === 'pending') || [];
            
            if (pendingRequests.length === 0) return null;
            
            return (
              <div key={group._id} className="bg-white rounded-lg shadow-lg p-5 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{group.destination}</h2>
                    <p className="text-gray-600">
                      {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Members: {group.currentMembers?.filter(m => m.status === 'approved').length || 0}/{group.maxMembers}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {pendingRequests.length} request{pendingRequests.length > 1 ? 's' : ''}
                    </span>
                    <button 
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="ml-4 text-blue-500 hover:text-blue-600 text-sm"
                    >
                      View Group →
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {pendingRequests.map((req, index) => (
                    <div key={req._id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-semibold">
                                {req.user?.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-700">{req.user?.name || 'Unknown User'}</h4>
                              <p className="text-gray-500 text-sm">{req.user?.email}</p>
                            </div>
                          </div>
                          
                          <div className="ml-13">
                            <p className="text-gray-600 mb-2">
                              <span className="font-medium">Message:</span> {req.message || 'No message provided'}
                            </p>
                            <div className="flex items-center text-gray-500 text-sm">
                              <span>Requested on: {new Date(req.requestedAt || req.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <button 
                            onClick={() => handleRequest(group._id, req._id, 'approve')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRequest(group._id, req._id, 'reject')}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold text-gray-700 mb-2">Debug Info:</h3>
          <p className="text-sm text-gray-600">Total Groups: {groups.length}</p>
          <p className="text-sm text-gray-600">Total Pending Requests: {totalPendingRequests}</p>
          <button 
            onClick={() => {
              console.log('Groups Data:', groups);
              console.log('User ID:', user?._id);
            }}
            className="mt-2 text-sm text-blue-500 hover:text-blue-600"
          >
            Log Data to Console
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupRequests;