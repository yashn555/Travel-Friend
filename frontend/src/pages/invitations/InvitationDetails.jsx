// frontend/src/pages/invitations/InvitationDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInvitationDetails, respondToInvitation } from '../../services/inviteService';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaUser,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaClock,
  FaEnvelope,
  FaUserFriends,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaPaperPlane
} from 'react-icons/fa';

const InvitationDetails = () => {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvitationDetails();
  }, [invitationId]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getInvitationDetails(invitationId);
      
      if (response.success) {
        setInvitation(response.data);
      } else {
        setError(response.message || 'Invitation not found');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (status) => {
    if (responding || !invitation) return;
    
    try {
      setResponding(true);
      const response = await respondToInvitation(invitationId, status);
      
      if (response.success) {
        // Update local state
        setInvitation(prev => ({
          ...prev,
          status: status,
          respondedAt: new Date().toISOString()
        }));
        
        // Show success message
        setTimeout(() => {
          if (status === 'accepted' && response.data.redirectUrl) {
            navigate(response.data.redirectUrl);
          } else {
            navigate('/invites');
          }
        }, 1500);
      } else {
        alert(`Failed to ${status} invitation: ${response.message}`);
      }
    } catch (error) {
      console.error('Error responding:', error);
      alert('Failed to process response. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <FaHourglassHalf className="mr-2" />
            Pending Response
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-2" />
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <FaTimesCircle className="mr-2" />
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  const getUserImage = (userData) => {
    if (userData?.profileImage) return userData.profileImage;
    if (userData?.profilePicture) return userData.profilePicture;
    if (userData?.avatar) return userData.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=3b82f6&color=fff&size=128`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-500 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
          <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Invitation Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            This invitation may have expired or been cancelled.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/invites"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Back to Invites
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/invites')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft className="mr-2" />
              Back to Invites
            </button>
            <div className="text-right">
              <div className="text-sm text-gray-500">Invitation ID</div>
              <div className="text-xs font-mono text-gray-400">{invitationId.substring(0, 8)}...</div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <FaPaperPlane className="text-3xl text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Trip Invitation</h1>
            <p className="text-gray-600 text-lg">
              {invitation.invitedBy?.name} invited you to join their trip
            </p>
            <div className="mt-4">
              {getStatusBadge(invitation.status)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trip Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                {/* Trip Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {invitation.destination || invitation.groupName}
                  </h2>
                  <p className="text-gray-600">{invitation.description || 'No description available'}</p>
                </div>

                {/* Trip Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FaCalendarAlt className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trip Dates</p>
                      <p className="font-semibold text-gray-900">
                        {invitation.startDate 
                          ? new Date(invitation.startDate).toLocaleDateString() 
                          : 'Not set'} - {' '}
                        {invitation.endDate 
                          ? new Date(invitation.endDate).toLocaleDateString() 
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FaUsers className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Group Size</p>
                      <p className="font-semibold text-gray-900">
                        {invitation.currentMembers || 0}/{invitation.maxMembers || 10} members
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FaMoneyBillWave className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Budget Range</p>
                      <p className="font-semibold text-gray-900">
                        ₹{invitation.budget?.min || 0} - ₹{invitation.budget?.max || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <FaClock className="text-orange-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Invited</p>
                      <p className="font-semibold text-gray-900">
                        {invitation.invitedAt 
                          ? new Date(invitation.invitedAt).toLocaleDateString() 
                          : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inviter Info */}
                <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow">
                      <img
                        src={getUserImage(invitation.invitedBy)}
                        alt={invitation.invitedBy?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Invited by</p>
                      <h4 className="text-xl font-bold text-gray-900">
                        {invitation.invitedBy?.name || 'Unknown User'}
                      </h4>
                      <p className="text-gray-600">Trip Organizer</p>
                    </div>
                  </div>
                </div>

                {/* Personal Message */}
                {invitation.message && (
                  <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <div className="flex items-start gap-3 mb-3">
                      <FaEnvelope className="text-yellow-600 text-xl mt-1" />
                      <h4 className="text-lg font-semibold text-yellow-800">
                        Personal Message from {invitation.invitedBy?.name || 'Organizer'}
                      </h4>
                    </div>
                    <p className="text-yellow-900 italic">"{invitation.message}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Response Actions */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                Your Response
              </h3>
              
              {invitation.status === 'pending' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => handleResponse('accepted')}
                    disabled={responding}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                  >
                    {responding ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaCheck className="text-xl" />
                        Accept Invitation
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleResponse('declined')}
                    disabled={responding}
                    className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                  >
                    <FaTimes className="text-xl" />
                    Decline Invitation
                  </button>
                </div>
              ) : invitation.status === 'accepted' ? (
                <div className="text-center">
                  <div className="mb-6">
                    <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-green-700 mb-2">Invitation Accepted</h4>
                    <p className="text-gray-600">
                      You accepted this invitation on {' '}
                      {invitation.respondedAt 
                        ? new Date(invitation.respondedAt).toLocaleDateString() 
                        : 'unknown date'}
                    </p>
                  </div>
                  <Link
                    to={`/groups/${invitation.groupId}`}
                    className="w-full py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold text-lg flex items-center justify-center gap-3 transition-all"
                  >
                    <FaExternalLinkAlt />
                    View Trip Group
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-6">
                    <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-red-700 mb-2">Invitation Declined</h4>
                    <p className="text-gray-600">
                      You declined this invitation on {' '}
                      {invitation.respondedAt 
                        ? new Date(invitation.respondedAt).toLocaleDateString() 
                        : 'unknown date'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/invites')}
                    className="w-full py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 font-bold text-lg transition-all"
                  >
                    Back to Invites
                  </button>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">What happens next?</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-green-500 mt-0.5" />
                    <span><strong>Accept:</strong> You'll join the trip group immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaUserFriends className="text-blue-500 mt-0.5" />
                    <span>The organizer will be notified of your response</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCalendarAlt className="text-purple-500 mt-0.5" />
                    <span>You can access trip details and group chat</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>This invitation was sent on {new Date(invitation.invitedAt).toLocaleDateString()}</p>
          <p className="mt-1">Need help? Contact support@travelbuddy.com</p>
        </div>
      </div>
    </div>
  );
};

export default InvitationDetails;