// frontend/src/pages/groups/GroupDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { getGroupById, requestJoinGroup } from '../../services/groupService';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const GroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Check if id is valid
    if (!id || id === 'undefined') {
      setError('Invalid group ID');
      setLoading(false);
      toast.error('Group not found');
      navigate('/groups');
      return;
    }

    const fetchGroup = async () => {
      try {
        setLoading(true);
        console.log('Fetching group with ID:', id);
        const data = await getGroupById(id);
        console.log('Group data:', data);
        setGroup(data);
      } catch (err) {
        console.error('Error fetching group:', err);
        setError('Failed to load group details');
        toast.error(err.response?.data?.message || 'Group not found');
        navigate('/groups');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id, navigate]);

  const handleJoin = async () => {
    if (!id || !group) return;
    
    try {
      setRequesting(true);
      const res = await requestJoinGroup(id, `I'd like to join your trip to ${group.destination}`);
      toast.success(res.message || 'Join request sent!');
      
      // Refresh group data
      const updatedGroup = await getGroupById(id);
      setGroup(updatedGroup);
    } catch (err) {
      console.error('Join error:', err);
      toast.error(err.response?.data?.message || 'Failed to send join request');
    } finally {
      setRequesting(false);
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
        <Loader size="lg" />
        <span className="ml-3 text-gray-600">Loading group details...</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || 'Group not found'}</h2>
        <p className="text-gray-600 mb-4">The group you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/groups')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{group.destination}</h1>
        <p className="text-gray-600 mt-2">Group Details</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{group.destination}</h2>
              <p className="text-gray-600 mt-2">{group.description}</p>
            </div>
            {isCreator && (
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                Your Group
              </span>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Group Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">📅 Trip Dates</h3>
              <p className="text-gray-800">
                {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">💰 Budget Range</h3>
              <p className="text-gray-800">
                {group.budget?.min || 0} - {group.budget?.max || 0} {group.budget?.currency || 'INR'}
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">👥 Members</h3>
              <p className="text-gray-800">
                {group.currentMembersCount || 0}/{group.maxMembers || 10}
                {group.isFull && <span className="text-red-600 ml-2">(Full)</span>}
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">👤 Created By</h3>
              <p className="text-gray-800">{group.createdBy?.name || 'Unknown'}</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">🔒 Group Type</h3>
              <p className="text-gray-800 capitalize">{group.groupType || 'anonymous'}</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">📊 Status</h3>
              <p className="text-gray-800 capitalize">{group.status || 'planning'}</p>
            </div>
          </div>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-3">🏷️ Tags</h3>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Members */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">👥 Current Members ({group.currentMembersCount || 0})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.currentMembers?.map((member, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold">
                        {member.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{member.user?.name || 'Member'}</p>
                      <p className="text-sm text-gray-500">{member.role === 'creator' ? 'Group Admin' : 'Member'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              {isCreator ? (
                <>
                  <Button
                    onClick={() => navigate(`/groups/${id}/chat`)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Go to Group Chat
                  </Button>
                  <Button
                    onClick={() => navigate('/group-requests')}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    Manage Join Requests
                  </Button>
                </>
              ) : isMember ? (
                <Button
                  onClick={() => navigate(`/groups/${id}/chat`)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Go to Group Chat
                </Button>
              ) : hasPendingRequest ? (
                <Button
                  disabled
                  className="bg-yellow-400 cursor-not-allowed"
                >
                  Request Pending Approval
                </Button>
              ) : group.isFull ? (
                <Button
                  disabled
                  className="bg-red-400 cursor-not-allowed"
                >
                  Group is Full
                </Button>
              ) : (
                <Button
                  onClick={handleJoin}
                  disabled={requesting}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {requesting ? 'Sending Request...' : 'Request to Join'}
                </Button>
              )}

              <Button
                onClick={() => navigate('/groups')}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Back to Groups
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsPage;