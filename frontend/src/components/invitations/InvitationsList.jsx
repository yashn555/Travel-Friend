import React, { useState, useEffect } from 'react';
import { getMyInvitations, respondToInvitation } from '../../services/groupService';
import { format } from 'date-fns';

const InvitationsList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const res = await getMyInvitations();
      setInvitations(res.data.invitations || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      setMessage('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId, status) => {
    try {
      setMessage('Processing...');
      await respondToInvitation(invitationId, status);
      setMessage(`Invitation ${status}`);
      
      // Update local state
      setInvitations(invitations.map(inv => 
        inv._id === invitationId ? { ...inv, status } : inv
      ));
      
      // Reload after delay
      setTimeout(() => {
        loadInvitations();
      }, 1500);
    } catch (error) {
      console.error('Error responding to invitation:', error);
      setMessage(error.response?.data?.message || 'Failed to respond');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading invitations...</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✈️</div>
        <h3 className="text-xl font-semibold text-gray-700">No Invitations</h3>
        <p className="text-gray-500 mt-2">You don't have any pending trip invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {invitations.map(invitation => (
        <div key={invitation._id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <img
                  src={invitation.inviter?.profilePicture || '/default-avatar.png'}
                  alt={invitation.inviter?.name}
                  className="w-12 h-12 rounded-full border-2 border-white shadow"
                />
                <div className="ml-4">
                  <h4 className="font-bold text-gray-800">{invitation.inviter?.name}</h4>
                  <p className="text-sm text-gray-500">@{invitation.inviter?.username}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="font-semibold text-gray-800 text-lg">
                  ✈️ {invitation.group?.destination}
                </h5>
                <p className="text-gray-600 mt-1">{invitation.message}</p>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    📅 {format(new Date(invitation.group?.startDate), 'MMM d')} - {format(new Date(invitation.group?.endDate), 'MMM d')}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    👥 {invitation.group?.members?.length || 0}/{invitation.group?.maxMembers} members
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                    📍 {invitation.group?.startingLocation?.address || 'Various'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mt-3">
                  Invited on {format(new Date(invitation.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            
            {invitation.status === 'pending' ? (
              <div className="mt-4 md:mt-0 md:ml-4 flex space-x-3">
                <button
                  onClick={() => handleRespond(invitation._id, 'accepted')}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(invitation._id, 'rejected')}
                  className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
                >
                  Decline
                </button>
              </div>
            ) : (
              <div className="mt-4 md:mt-0 md:ml-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  invitation.status === 'accepted' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvitationsList;