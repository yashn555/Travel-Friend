// frontend/src/pages/invitations/InvitationResponse.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaEnvelope,
  FaArrowLeft,
  FaClock,
  FaUserFriends,
  FaInfoCircle
} from 'react-icons/fa';
import { 
  getInvitationDetails, 
  respondToInvitation 
} from '../../services/groupNotificationService';

const InvitationResponse = () => {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState('');

  useEffect(() => {
    loadInvitationData();
  }, [invitationId]);

  const loadInvitationData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getInvitationDetails(invitationId);
      
      if (response.success) {
        setInvitation(response.data);
        
        // Check if invitation is expired
        if (response.data.status !== 'pending') {
          setError('This invitation has already been responded to');
        }
      } else {
        setError(response.message || 'Invitation not found');
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (status) => {
    if (!invitation || processing) return;
    
    setSelectedResponse(status);
    setShowConfirm(true);
  };

  const confirmResponse = async () => {
    try {
      setProcessing(true);
      setError('');
      
      const response = await respondToInvitation(invitationId, { status: selectedResponse });
      
      if (response.success) {
        setSuccess(`Invitation ${selectedResponse} successfully!`);
        setInvitation(prev => ({
          ...prev,
          status: selectedResponse,
          respondedAt: new Date().toISOString()
        }));
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate(response.data.redirectUrl || '/notifications');
        }, 3000);
      } else {
        setError(response.message || 'Failed to process response');
      }
    } catch (err) {
      console.error('Error responding to invitation:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Invitation Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            This invitation may have expired, been cancelled, or already responded to.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/notifications"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              View Notifications
            </Link>
            <Link
              to="/trips"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Browse Trips
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <FaCheckCircle className={`text-5xl ${
            invitation.status === 'accepted' ? 'text-green-500' : 'text-red-500'
          } mx-auto mb-4`} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Invitation {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
          </h1>
          <p className="text-gray-600 mb-2">
            You {invitation.status} this invitation on{' '}
            {new Date(invitation.respondedAt).toLocaleDateString()}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {invitation.invitedBy.name} invited you to join their trip to {invitation.destination}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/notifications"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Notifications
            </Link>
            {invitation.status === 'accepted' && (
              <Link
                to={`/groups/${invitation.groupId}`}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                View Trip
              </Link>
            )}
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
          <Link
            to="/notifications"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <FaArrowLeft className="mr-2" />
            Back to Notifications
          </Link>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <FaEnvelope className="text-3xl text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Trip Invitation</h1>
            <p className="text-gray-600 text-lg">
              {invitation.invitedBy.name} invited you to join their trip
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-6 rounded-2xl bg-green-50 border-2 border-green-200">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 text-2xl mr-4" />
              <div>
                <p className="font-bold text-green-800 text-lg">{success}</p>
                <p className="text-green-600 mt-1">
                  Redirecting in a moment...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-6 rounded-2xl bg-red-50 border-2 border-red-200">
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 text-2xl mr-4" />
              <div>
                <p className="font-bold text-red-800 text-lg">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Confirm Your Response
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to <strong>{selectedResponse}</strong> this invitation to join{' '}
                <strong>{invitation.destination}</strong>?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResponse}
                  className={`flex-1 px-4 py-3 rounded-lg text-white font-medium ${
                    selectedResponse === 'accepted'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : (
                    `Yes, ${selectedResponse}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invitation Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trip Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                {/* Trip Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {invitation.destination}
                  </h2>
                  <p className="text-gray-600">{invitation.description}</p>
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
                        {new Date(invitation.startDate).toLocaleDateString()} - {' '}
                        {new Date(invitation.endDate).toLocaleDateString()}
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
                        {invitation.currentMembers}/{invitation.maxMembers} members
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
                        {new Date(invitation.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inviter Info */}
                <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow">
                      <img
                        src={invitation.invitedBy.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.invitedBy.name)}&background=3b82f6&color=fff`}
                        alt={invitation.invitedBy.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Invited by</p>
                      <h4 className="text-xl font-bold text-gray-900">
                        {invitation.invitedBy.name}
                      </h4>
                      <p className="text-gray-600">Trip Organizer</p>
                    </div>
                  </div>
                </div>

                {/* Personal Message */}
                {invitation.message && (
                  <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <div className="flex items-start gap-3 mb-3">
                      <FaInfoCircle className="text-yellow-600 text-xl mt-1" />
                      <h4 className="text-lg font-semibold text-yellow-800">
                        Personal Message
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
              
              <div className="space-y-4">
                <button
                  onClick={() => handleResponse('accepted')}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                >
                  <FaCheckCircle className="text-xl" />
                  Accept Invitation
                </button>
                
                <button
                  onClick={() => handleResponse('declined')}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                >
                  <FaTimesCircle className="text-xl" />
                  Decline Invitation
                </button>
              </div>
              
              {processing && (
                <div className="mt-6 text-center">
                  <FaSpinner className="animate-spin text-blue-500 text-2xl mx-auto mb-2" />
                  <p className="text-gray-600">Processing your response...</p>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">What happens next?</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-0.5" />
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
          <p>This invitation will expire on {new Date(new Date(invitation.invitedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          <p className="mt-1">Need help? Contact support@travelbuddy.com</p>
        </div>
      </div>
    </div>
  );
};

export default InvitationResponse;