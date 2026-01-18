import React, { useEffect, useState } from 'react';
import { getMyGroups, deleteGroup } from '../../services/groupService';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const MyGroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      const data = await getMyGroups();
      
      let allGroups = [];
      if (Array.isArray(data)) {
        allGroups = data;
      } else if (data && Array.isArray(data.groups)) {
        allGroups = data.groups;
      } else if (data && Array.isArray(data.data)) {
        allGroups = data.data;
      }
      
      // Filter groups where user is CREATOR only
      const userId = user?.id || user?._id;
      const createdGroups = allGroups.filter(group => {
        const creatorId = group.createdBy?._id || group.createdBy;
        return String(creatorId) === String(userId);
      });
      
      setGroups(createdGroups);
      
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load your groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"?\n\nThis action will:\n• Remove the group permanently\n• Delete all group chats\n• Remove all members\n• Delete all join requests\n\nThis cannot be undone!`)) {
      return;
    }

    try {
      await deleteGroup(groupId);
      toast.success(`Group "${groupName}" deleted successfully!`);
      // Remove from local state
      setGroups(prev => prev.filter(g => g._id !== groupId));
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-3 text-gray-600">Loading your groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Created Groups</h1>
          <p className="text-gray-600 mt-2">Manage all groups you've created</p>
        </div>
        <Link 
          to="/create-trip" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition duration-200"
        >
          Create New Trip
        </Link>
      </div>
      
      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">No Groups Created</h3>
            <p className="text-gray-500 mb-6">
              You haven't created any groups yet. Start by creating your first trip!
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                to="/create-trip" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition duration-200"
              >
                Create Your First Group
              </Link>
              <Link 
                to="/groups" 
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium transition duration-200"
              >
                Browse Groups
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              Showing <span className="font-bold text-blue-600">{groups.length}</span> group{groups.length !== 1 ? 's' : ''} created by you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => {
              const memberCount = group.currentMembers?.length || 0;
              const pendingRequests = group.joinRequests?.length || 0;
              
              return (
                <div key={group._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 truncate">{group.destination}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Created on {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                        Creator
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3 min-h-[4rem]">{group.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Trip Dates:</span>
                        <span className="font-medium">
                          {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Members:</span>
                        <span className="font-medium">
                          {memberCount}/{group.maxMembers || 10}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${group.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {pendingRequests > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Pending Requests:</span>
                          <span className="font-medium text-yellow-600">
                            {pendingRequests} pending
                          </span>
                        </div>
                      )}
                      
                      {group.budget?.min && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Budget:</span>
                          <span className="font-medium">
                            {group.budget.min} - {group.budget.max} {group.budget.currency}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Link
                          to={`/groups/${group._id}`}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-center px-4 py-2.5 rounded-lg font-medium transition duration-200"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/groups/${group._id}/chat`}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-center px-4 py-2.5 rounded-lg font-medium transition duration-200"
                        >
                          Group Chat
                        </Link>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          to={`/group-requests?group=${group._id}`}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-center px-4 py-2.5 rounded-lg font-medium transition duration-200"
                        >
                          Requests ({pendingRequests})
                        </Link>
                        <button
                          onClick={() => navigate(`/edit-group/${group._id}`)}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-center px-4 py-2.5 rounded-lg font-medium transition duration-200"
                        >
                          Edit
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteGroup(group._id, group.destination)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white text-center px-4 py-2.5 rounded-lg font-medium transition duration-200"
                      >
                        Delete Group
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MyGroupsPage;