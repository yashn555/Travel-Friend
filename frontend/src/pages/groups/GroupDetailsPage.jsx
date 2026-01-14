import React, { useEffect, useState } from 'react';
import { getGroupById, requestJoinGroup } from '../../services/groupService';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const GroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [group, setGroup] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const data = await getGroupById(id);
        setGroup(data);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Error loading group');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  const handleJoin = async () => {
    try {
      setMessage('Sending request...');
      const res = await requestJoinGroup(id, `I'd like to join your trip to ${group.destination}`);
      setMessage(res.message || 'Join request sent successfully!');
      
      // Refresh group data
      const updatedGroup = await getGroupById(id);
      setGroup(updatedGroup);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error requesting join');
    }
  };

  // Check if user is already a member
  const isMember = group?.currentMembers?.some(member => 
    member.user?._id === user?._id || member.user?.id === user?._id
  );

  // Check if user has pending request
  const hasPendingRequest = group?.joinRequests?.some(request => 
    request.user?._id === user?._id && request.status === 'pending'
  );

  // Check if user is the creator
  const isCreator = group?.createdBy?._id === user?._id;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading group details...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <p className="text-red-500">Group not found</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{group.destination}</h2>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">{group.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Trip Dates</h3>
              <p className="text-gray-600">
                {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Budget Range</h3>
              <p className="text-gray-600">
                {group.budget?.min || '0'} - {group.budget?.max || '0'} {group.budget?.currency || 'INR'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Group Type</h3>
              <p className="text-gray-600 capitalize">{group.groupType}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Members</h3>
              <p className="text-gray-600">
                {group.currentMembers?.length || 0}/{group.maxMembers || 10}
                {group.isFull && <span className="text-red-500 ml-2">(Full)</span>}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Created By</h3>
              <p className="text-gray-600">{group.createdBy?.name || 'Unknown'}</p>
            </div>
          </div>
          
          {group.tags && group.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Current Members Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Current Members</h3>
          <div className="flex flex-wrap gap-3">
            {group.currentMembers?.map((member, index) => (
              <div key={index} className="bg-gray-100 p-3 rounded-lg">
                <p className="font-medium">{member.user?.name || 'Member'}</p>
                <p className="text-sm text-gray-500">{member.role || 'Member'}</p>
              </div>
            ))}
            {(!group.currentMembers || group.currentMembers.length === 0) && (
              <p className="text-gray-500">No members yet</p>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
          {isCreator ? (
            <>
              <button 
                onClick={() => navigate(`/groups/${id}/requests`)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              >
                View Join Requests
              </button>
              <button 
                onClick={() => navigate(`/groups/${id}/chat`)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Go to Group Chat
              </button>
            </>
          ) : isMember ? (
            <button 
              onClick={() => navigate(`/groups/${id}/chat`)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Go to Group Chat
            </button>
          ) : hasPendingRequest ? (
            <button 
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
            >
              Request Pending Approval
            </button>
          ) : group.isFull ? (
            <button 
              disabled
              className="bg-red-400 text-white px-4 py-2 rounded cursor-not-allowed"
            >
              Group is Full
            </button>
          ) : (
            <button 
              onClick={handleJoin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Request to Join
            </button>
          )}
          
          <button 
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsPage;