// frontend/src/pages/invites/InvitesPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  getGroupInvitations, 
  respondToInvitation 
} from '../../services/inviteService';
import { 
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaUser,
  FaClock,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope,
  FaCalendarDay,
  FaFilter,
  FaSync,
  FaInbox,
  FaUserFriends
} from 'react-icons/fa';

const InvitesPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'accepted', 'declined'
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getGroupInvitations();
      
      if (response.success && response.data) {
        setInvitations(response.data);
      } else {
        setInvitations([]);
        setError(response.message || 'Failed to load invitations');
      }
      
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setError('Error loading invitations. Please try again.');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId, status) => {
    try {
      // Update local state immediately for better UX
      setInvitations(prev => 
        prev.map(inv => 
          inv.invitationId === invitationId 
            ? { ...inv, responding: true } 
            : inv
        )
      );
      
      const response = await respondToInvitation(invitationId, status);
      
      if (response.success) {
        // Update the invitation status
        setInvitations(prev => 
          prev.map(inv => 
            inv.invitationId === invitationId 
              ? { 
                  ...inv, 
                  status: status,
                  respondedAt: new Date().toISOString(),
                  responding: false 
                } 
              : inv
          )
        );
        
        // Show success message
        if (status === 'accepted') {
          setTimeout(() => {
            navigate(`/groups/${response.data.groupId}`);
          }, 1500);
        }
      } else {
        alert(`Failed to ${status} invitation: ${response.message}`);
        // Reset responding state
        setInvitations(prev => 
          prev.map(inv => 
            inv.invitationId === invitationId 
              ? { ...inv, responding: false } 
              : inv
          )
        );
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      alert('Failed to process response. Please try again.');
      setInvitations(prev => 
        prev.map(inv => 
          inv.invitationId === invitationId 
            ? { ...inv, responding: false } 
            : inv
        )
      );
    }
  };

  const getInvitationStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <FaHourglassHalf className="mr-1" /> Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" /> Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1" /> Declined
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
    }
    return date.toLocaleDateString();
  };

  const filteredInvitations = invitations.filter(inv => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;
  const declinedCount = invitations.filter(inv => inv.status === 'declined').length;

  // Get user profile image
  const getUserImage = (userData) => {
    if (userData?.profileImage) return userData.profileImage;
    if (userData?.profilePicture) return userData.profilePicture;
    if (userData?.avatar) return userData.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=3b82f6&color=fff&size=128`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-6"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trip Invitations ✈️</h1>
                <p className="text-gray-600 mt-1">Manage your trip group invitations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchInvitations}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                title="Refresh invitations"
              >
                <FaSync />
                Refresh
              </button>
              <Link
                to="/groups"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Browse Trips
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FaEnvelope className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
                  <p className="text-sm text-gray-500">Total Invitations</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <FaHourglassHalf className="text-yellow-600 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{acceptedCount}</p>
                  <p className="text-sm text-gray-500">Accepted</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <FaTimesCircle className="text-red-600 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{declinedCount}</p>
                  <p className="text-sm text-gray-500">Declined</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-400" />
                <span className="text-gray-600">Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({invitations.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filter === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setFilter('accepted')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filter === 'accepted'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Accepted ({acceptedCount})
                </button>
                <button
                  onClick={() => setFilter('declined')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filter === 'declined'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Declined ({declinedCount})
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 hidden md:block">
              Showing {filteredInvitations.length} invitation(s)
            </div>
          </div>
        </div>

        {/* Invitations List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <FaSpinner className="animate-spin text-blue-500 text-3xl mx-auto mb-4" />
              <p className="text-gray-600">Loading invitations...</p>
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="p-12 text-center">
              <FaInbox className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {filter === 'all' ? 'No Invitations Yet' : `No ${filter} invitations`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? "You haven't received any trip invitations yet."
                  : `You don't have any ${filter} invitations.`
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={fetchInvitations}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Refresh
                </button>
                <Link
                  to="/groups"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Browse Trips
                </Link>
                <Link
                  to="/find-friends"
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Find Friends
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredInvitations.map((invitation) => (
                <div
                  key={invitation.invitationId}
                  className={`p-6 transition-colors ${
                    invitation.status === 'pending'
                      ? 'bg-yellow-50 hover:bg-yellow-100'
                      : invitation.status === 'accepted'
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left Column - Trip Info */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                        <div className="mb-4 md:mb-0">
                          <div className="flex items-center mb-3">
                            <div className="relative">
                              <img
                                src={getUserImage(invitation.invitedBy)}
                                alt={invitation.invitedBy?.name}
                                className="w-12 h-12 rounded-full border-2 border-white shadow"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                                <FaUserFriends size={12} />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-gray-500">Invited by</p>
                              <p className="font-bold text-gray-900">{invitation.invitedBy?.name || 'Unknown User'}</p>
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-blue-500" />
                            {invitation.destination || invitation.groupName || 'Unknown Destination'}
                          </h3>
                          
                          {invitation.description && (
                            <p className="text-gray-600 mb-4">{invitation.description}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {getInvitationStatusBadge(invitation.status)}
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              Invited {formatTime(invitation.invitedAt)}
                            </div>
                            {invitation.respondedAt && (
                              <div className="text-sm text-gray-500">
                                Responded {formatTime(invitation.respondedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Trip Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center mb-2">
                            <FaCalendarAlt className="text-blue-500 mr-2" />
                            <span className="font-medium text-gray-700">Trip Dates</span>
                          </div>
                          <p className="text-gray-900">
                            {invitation.startDate 
                              ? new Date(invitation.startDate).toLocaleDateString() 
                              : 'Not set'} - {' '}
                            {invitation.endDate 
                              ? new Date(invitation.endDate).toLocaleDateString() 
                              : 'Not set'}
                          </p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center mb-2">
                            <FaUsers className="text-green-500 mr-2" />
                            <span className="font-medium text-gray-700">Group Size</span>
                          </div>
                          <p className="text-gray-900">
                            {invitation.currentMembers || 0}/{invitation.maxMembers || 10} members
                          </p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center mb-2">
                            <FaMoneyBillWave className="text-purple-500 mr-2" />
                            <span className="font-medium text-gray-700">Budget Range</span>
                          </div>
                          <p className="text-gray-900">
                            ₹{invitation.budget?.min || 0} - ₹{invitation.budget?.max || 0}
                          </p>
                        </div>
                      </div>
                      
                      {/* Personal Message */}
                      {invitation.message && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                          <div className="flex items-center mb-2">
                            <FaEnvelope className="text-yellow-500 mr-2" />
                            <span className="font-medium text-gray-700">Personal Message</span>
                          </div>
                          <p className="text-gray-600 italic">"{invitation.message}"</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Right Column - Actions */}
                    <div className="lg:w-80">
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        {invitation.status === 'pending' ? (
                          <>
                            <h4 className="font-bold text-gray-800 mb-4 text-center">Your Response</h4>
                            <div className="space-y-3">
                              <button
                                onClick={() => handleInvitationResponse(invitation.invitationId, 'accepted')}
                                disabled={invitation.responding}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                              >
                                {invitation.responding ? (
                                  <>
                                    <FaSpinner className="animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <FaCheck />
                                    Accept Invitation
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleInvitationResponse(invitation.invitationId, 'declined')}
                                disabled={invitation.responding}
                                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                              >
                                <FaTimes />
                                Decline Invitation
                              </button>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <Link
                                to={`/invitations/${invitation.invitationId}/respond`}
                                className="w-full py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors"
                              >
                                <FaExternalLinkAlt />
                                View Full Details
                              </Link>
                            </div>
                          </>
                        ) : invitation.status === 'accepted' ? (
                          <>
                            <h4 className="font-bold text-green-700 mb-4 text-center">✅ Accepted</h4>
                            <p className="text-gray-600 mb-4 text-center">
                              You accepted this invitation on {invitation.respondedAt ? new Date(invitation.respondedAt).toLocaleDateString() : 'unknown date'}
                            </p>
                            <Link
                              to={`/groups/${invitation.groupId}`}
                              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                              <FaExternalLinkAlt />
                              View Trip Group
                            </Link>
                          </>
                        ) : (
                          <>
                            <h4 className="font-bold text-red-700 mb-4 text-center">❌ Declined</h4>
                            <p className="text-gray-600 text-center">
                              You declined this invitation on {invitation.respondedAt ? new Date(invitation.respondedAt).toLocaleDateString() : 'unknown date'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center">
            <FaCalendarDay className="mr-2" />
            About Trip Invitations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">When you receive an invitation</p>
                <p>You'll get an email notification and see it listed here</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Responding to invitations</p>
                <p>Accept or decline invitations within 7 days of receiving them</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Accepted invitations</p>
                <p>You'll automatically join the trip group and can access all features</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <div>
                <p className="font-medium">Declined invitations</p>
                <p>The trip organizer will be notified of your decision</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitesPage;