import React, { useEffect, useState } from 'react';
import { getAllGroups, requestJoinGroup } from '../../services/groupService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const GroupListPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getAllGroups();
      setGroups(data || []);
    } catch (err) {
      console.error(err);
      setMessage('Error loading groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoin = async (groupId, destination) => {
    try {
      setMessage('Sending join request...');
      const res = await requestJoinGroup(groupId, `I'd like to join your trip to ${destination}`);
      setMessage(res.message || 'Join request sent successfully!');
      
      // Refresh groups to update status
      fetchGroups();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error requesting join');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse Available Trips</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      {groups.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">No groups available at the moment</p>
          <button 
            onClick={() => navigate('/create-trip')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Your Own Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => {
            // Check if current user is already a member
            const isMember = group.currentMembers?.some(member => 
              member.user?._id === user?._id || member.user?.id === user?._id
            );
            
            // Check if user has pending request
            const hasPendingRequest = group.joinRequests?.some(request => 
              request.user?._id === user?._id && request.status === 'pending'
            );
            
            return (
              <div key={group._id || group.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{group.destination}</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                
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
                      {group.budget?.min || '0'} - {group.budget?.max || '0'} {group.budget?.currency || 'INR'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <span className="font-medium mr-2">Members:</span>
                    <span>
                      {group.currentMembers?.length || 0}/{group.maxMembers || 10}
                      {group.isFull && <span className="text-red-500 ml-1">(Full)</span>}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <span className="font-medium mr-2">Type:</span>
                    <span className="capitalize">{group.groupType}</span>
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
                    onClick={() => navigate(`/groups/${group._id || group.id}`)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    View Details
                  </button>
                  
                  {isMember ? (
                    <button 
                      onClick={() => navigate(`/groups/${group._id || group.id}/chat`)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Go to Chat
                    </button>
                  ) : hasPendingRequest ? (
                    <button 
                      disabled
                      className="bg-yellow-400 text-white px-3 py-1 rounded text-sm cursor-not-allowed"
                    >
                      Request Pending
                    </button>
                  ) : group.isFull ? (
                    <button 
                      disabled
                      className="bg-red-400 text-white px-3 py-1 rounded text-sm cursor-not-allowed"
                    >
                      Group Full
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleJoin(group._id || group.id, group.destination)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Request to Join
                    </button>
                  )}
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