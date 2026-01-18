// frontend/src/pages/groups/GroupListPage.jsx
import React, { useEffect, useState } from 'react';
import { getAllGroups, requestJoinGroup } from '../../services/groupService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const GroupListPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await getAllGroups();
      console.log('Groups data:', res);
      setGroups(res || []);
    } catch (err) {
      console.error(err);
      setMessage('Error loading groups');
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoin = async (groupId, destination) => {
    // Validate groupId
    if (!groupId || groupId === 'undefined') {
      toast.error('Invalid group ID');
      return;
    }

    try {
      const res = await requestJoinGroup(groupId);
      setMessage(res.message || 'Join request sent!');
      toast.success(`Join request sent for ${destination}!`);
      fetchGroups(); // Refresh the list
    } catch (err) {
      console.error('Join error:', err);
      const errorMsg = err.response?.data?.message || 'Error requesting join';
      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading groups...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse Available Groups</h1>
        <p className="text-gray-600">Find travel groups to join</p>
      </div>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-5xl mb-4">🌍</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Groups Available</h2>
          <p className="text-gray-600 mb-6">Be the first to create a travel group!</p>
          <button 
            onClick={() => navigate('/create-trip')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => {
            const isMember = group.currentMembers?.some(member => 
              member.user?._id === user?._id
            );
            
            const isCreator = group.createdBy?._id === user?._id;
            
            return (
              <div key={group._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{group.destination}</h3>
                    {isCreator && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        Your Group
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-500 text-sm">
                      <span className="font-medium mr-2">Dates:</span>
                      <span>
                        {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-500 text-sm">
                      <span className="font-medium mr-2">Budget:</span>
                      <span>
                        {group.budget?.min || 0} - {group.budget?.max || 0} {group.budget?.currency || 'INR'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-500 text-sm">
                      <span className="font-medium mr-2">Members:</span>
                      <span>
                        {group.currentMembersCount || 0}/{group.maxMembers || 10}
                        {group.isFull && <span className="text-red-500 ml-1">(Full)</span>}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-500 text-sm">
                      <span className="font-medium mr-2">Created by:</span>
                      <span>{group.createdBy?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {group.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button 
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
                    >
                      View Details
                    </button>
                    
                   {isMember ? (
  <button 
    onClick={() => navigate(`/groups/${group._id}/chat`)} // Fixed route
    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
  >
    Go to Chat
  </button>
) : isCreator ? (
                      <button 
                        onClick={() => navigate(`/groups/${group._id}`)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
                      >
                        Manage Group
                      </button>
                    ) : group.isFull ? (
                      <button 
                        disabled
                        className="bg-red-400 text-white px-3 py-2 rounded text-sm cursor-not-allowed"
                      >
                        Group Full
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoin(group._id, group.destination)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                      >
                        Request to Join
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
  );
};

export default GroupListPage;