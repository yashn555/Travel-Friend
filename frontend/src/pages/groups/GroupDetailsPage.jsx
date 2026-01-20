// frontend/src/pages/groups/GroupDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { getGroupById, requestJoinGroup } from '../../services/groupService';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import GroupTabs from '../../components/groupDetails/GroupTabs';

const GroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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

  // Calculate days remaining until trip
  const getDaysRemaining = () => {
    if (!group?.startDate) return null;
    const startDate = new Date(group.startDate);
    const today = new Date();
    const diffTime = startDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

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
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          ← Back
        </button>
        
        {/* Trip Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{group.destination}</h1>
            <p className="text-gray-600 mt-2">{group.description}</p>
          </div>
          
          {daysRemaining !== null && (
            <div className={`mt-4 md:mt-0 px-4 py-2 rounded-full font-medium ${
              daysRemaining < 0 
                ? 'bg-red-100 text-red-800' 
                : daysRemaining < 7 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {daysRemaining < 0 
                ? 'Trip Completed' 
                : daysRemaining === 0 
                ? 'Trip Starts Today!' 
                : `${daysRemaining} days until trip`}
            </div>
          )}
        </div>
      </div>

      {/* Main Content with Tabs */}
      <GroupTabs 
        group={group}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCreator={isCreator}
        isMember={isMember}
        user={user}
      />

      {/* Action Buttons */}
      <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Group Actions</h3>
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
              <Button
                onClick={() => setActiveTab('booking')}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Book Group Travel
              </Button>
            </>
          ) : isMember ? (
            <>
              <Button
                onClick={() => navigate(`/groups/${id}/chat`)}
                className="bg-green-500 hover:bg-green-600"
              >
                Go to Group Chat
              </Button>
              <Button
                onClick={() => setActiveTab('expenses')}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Manage Expenses
              </Button>
            </>
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
  );
};

export default GroupDetailsPage;