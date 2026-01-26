// frontend/src/pages/nearby/NearbyUsersPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { 
  getCurrentLocation, 
  updateUserLocation, 
  getNearbyUsers, 
  getNearbyUsersStats,
  commonInterests,
  sendConnectionRequest 
} from '../../services/nearbyUsersService';

const NearbyUsersPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 50,
    interests: '',
    sortBy: 'distance',
    showOnlineOnly: false,
    limit: 50
  });
  
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [sendingRequests, setSendingRequests] = useState({});
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    initializeLocationAndLoadUsers();
  }, []);

  const initializeLocationAndLoadUsers = async () => {
    try {
      setLoading(true);
      await handleUpdateLocation();
      await loadNearbyUsers();
      await loadStats();
    } catch (error) {
      console.error('Initialization error:', error);
      toast.error(error.message || 'Failed to initialize nearby users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      setUpdatingLocation(true);
      
      const location = await getCurrentLocation();
      
      const updateData = {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country
      };
      
      const response = await updateUserLocation(updateData);
      
      setUserLocation({
        ...updateData,
        city: location.city,
        country: location.country
      });
      
      toast.success(`📍 Location updated to ${location.city}, ${location.country}`);
      
      return response;
      
    } catch (error) {
      console.error('Location update error:', error);
      
      if (error.message.includes('permission')) {
        toast.error(
          <div>
            <p>Location permission denied.</p>
            <p>Please enable location services in your browser settings.</p>
          </div>,
          { autoClose: 5000 }
        );
      } else {
        toast.error(error.message || 'Failed to update location');
      }
      
      setUserLocation({
        latitude: 0,
        longitude: 0,
        city: 'Unknown',
        country: 'Unknown'
      });
      
    } finally {
      setUpdatingLocation(false);
    }
  };

  const loadNearbyUsers = async () => {
    try {
      setLoading(true);
      
      const filtersToSend = {
        ...filters,
        interests: selectedInterests.join(',')
      };
      
      const response = await getNearbyUsers(filtersToSend);
      
      if (response.code === 'LOCATION_REQUIRED') {
        toast.info('Please update your location to find nearby users');
        return;
      }
      
      setNearbyUsers(response.users || []);
      
    } catch (error) {
      console.error('Error loading nearby users:', error);
      toast.error(error.message || 'Failed to load nearby users');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getNearbyUsersStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleInterestToggle = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadNearbyUsers();
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      maxDistance: 50,
      interests: '',
      sortBy: 'distance',
      showOnlineOnly: false,
      limit: 50
    });
    setSelectedInterests([]);
  };

  const handleSendConnectionRequest = async (userId, userName) => {
    try {
      setSendingRequests(prev => ({ ...prev, [userId]: true }));
      
      await sendConnectionRequest(userId);
      
      toast.success(`Connection request sent to ${userName}`);
      
      setNearbyUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, connectionStatus: 'requested' }
            : user
        )
      );
      
    } catch (error) {
      toast.error(error.message || 'Failed to send connection request');
    } finally {
      setSendingRequests(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleStartChat = (userId, userName) => {
    toast.info(`Starting chat with ${userName}...`);
  };

  // Icon components to replace Heroicons
  const MapPinIcon = () => <span>📍</span>;
  const UsersIcon = () => <span>👥</span>;
  const ChatBubbleIcon = () => <span>💬</span>;
  const FilterIcon = () => <span>⚙️</span>;
  const CloseIcon = () => <span>✕</span>;
  const SignalIcon = () => <span>📶</span>;
  const UserPlusIcon = () => <span>➕</span>;
  const GlobeIcon = () => <span>🌍</span>;
  const SettingsIcon = () => <span>⚙️</span>;
  const BackIcon = () => <span>←</span>;
  const RefreshIcon = () => <span>🔄</span>;
  const StarIcon = () => <span>⭐</span>;
  const CheckIcon = () => <span>✓</span>;

  if (loading && !nearbyUsers.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600">Finding nearby travelers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Nearby Travelers
              </h1>
              <p className="text-gray-600 mt-2">
                Connect with fellow travelers around you
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleUpdateLocation}
                disabled={updatingLocation}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {updatingLocation ? (
                  <Loader size="sm" />
                ) : (
                  <span>📍</span>
                )}
                {updatingLocation ? 'Updating...' : 'Update Location'}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <span>⚙️</span>
                Filters
              </button>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
          
          {/* Location Display */}
          {userLocation && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Your Location: {userLocation.city}, {userLocation.country}
                    </p>
                    <p className="text-sm text-gray-600">
                      Coordinates: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpdateLocation}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>🔄</span>
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <h2 className="text-xl font-bold text-gray-900">Filter Travelers</h2>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Distance Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Distance: {filters.maxDistance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={filters.maxDistance}
                  onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>250 km</span>
                  <span>500 km</span>
                </div>
              </div>
              
              {/* Interests Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Common Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selectedInterests.includes(interest)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                {selectedInterests.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Selected:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedInterests.map(interest => (
                        <span
                          key={interest}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
                        >
                          {interest}
                          <button
                            onClick={() => handleInterestToggle(interest)}
                            className="ml-1 hover:text-blue-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Other Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="distance">Distance (Nearest First)</option>
                    <option value="interests">Common Interests</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Show Online Only
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="onlineOnly"
                      checked={filters.showOnlineOnly}
                      onChange={(e) => handleFilterChange('showOnlineOnly', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="onlineOnly" className="ml-2 text-sm text-gray-700">
                      Show only currently active users
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-between">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Reset All
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Travelers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <span className="text-3xl">👥</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Within 50km</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.nearbyUsers}</p>
                </div>
                <span className="text-3xl">🌍</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Online Now</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.onlineUsers}</p>
                </div>
                <span className="text-3xl">📶</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shared Interests</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.usersWithSameInterests}</p>
                </div>
                <span className="text-3xl">⭐</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Grid/List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {nearbyUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No travelers found nearby</h3>
            <p className="text-gray-600 mb-6">
              Try increasing the distance range or updating your location
            </p>
            <button
              onClick={handleUpdateLocation}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
            >
              <span>📍</span>
              Update Location
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Found <span className="font-semibold">{nearbyUsers.length}</span> travelers nearby
              </p>
              <p className="text-sm text-gray-500">
                Sorted by {filters.sortBy === 'distance' ? 'distance' : 'common interests'}
              </p>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {nearbyUsers.map((traveler) => (
                  <TravelerCard
                    key={traveler._id}
                    traveler={traveler}
                    onConnect={handleSendConnectionRequest}
                    onViewProfile={handleViewProfile}
                    onStartChat={handleStartChat}
                    sendingRequests={sendingRequests}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {nearbyUsers.map((traveler) => (
                  <TravelerListItem
                    key={traveler._id}
                    traveler={traveler}
                    onConnect={handleSendConnectionRequest}
                    onViewProfile={handleViewProfile}
                    onStartChat={handleStartChat}
                    sendingRequests={sendingRequests}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Traveler Card Component (Grid View)
const TravelerCard = ({ traveler, onConnect, onViewProfile, onStartChat, sendingRequests }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header with Online Status */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600" />
        
        {/* Profile Picture */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full p-1">
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {traveler.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            {traveler.isOnline && (
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="pt-12 pb-4 px-4">
        {/* Name and Location */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">{traveler.name}</h3>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-gray-500">📍</span>
            <p className="text-sm text-gray-600">
              {traveler.location?.city || 'Unknown'}, {traveler.distance} away
            </p>
          </div>
        </div>
        
        {/* Bio */}
        {traveler.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 text-center">
            {traveler.bio}
          </p>
        )}
        
        {/* Interests */}
        {traveler.interests && traveler.interests.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Interests</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {traveler.interests.slice(0, 3).map((interest, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {interest}
                </span>
              ))}
              {traveler.interests.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{traveler.interests.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="flex justify-center gap-4 mb-4 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-900">{traveler.mutualInterests || 0}</p>
            <p className="text-xs text-gray-500">Shared Interests</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {traveler.isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-gray-500">Status</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onConnect(traveler._id, traveler.name)}
            disabled={traveler.connectionStatus === 'requested' || sendingRequests[traveler._id]}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              traveler.connectionStatus === 'requested'
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
            }`}
          >
            {sendingRequests[traveler._id] ? (
              <div className="flex justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : traveler.connectionStatus === 'requested' ? (
              'Request Sent'
            ) : (
              <span className="flex items-center justify-center gap-1">
                <span>➕</span>
                Connect
              </span>
            )}
          </button>
          
          <button
            onClick={() => onStartChat(traveler._id, traveler.name)}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1"
          >
            <span>💬</span>
            Chat
          </button>
        </div>
        
        <button
          onClick={() => onViewProfile(traveler._id)}
          className="w-full mt-2 text-sm text-blue-600 hover:text-blue-800 py-1"
        >
          View Profile →
        </button>
      </div>
    </div>
  );
};

// Traveler List Item Component (List View)
const TravelerListItem = ({ traveler, onConnect, onViewProfile, onStartChat, sendingRequests }) => {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Profile */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-600">
              {traveler.name?.charAt(0) || 'U'}
            </span>
          </div>
          {traveler.isOnline && (
            <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900">{traveler.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">📍</span>
                <span className="text-sm text-gray-600">
                  {traveler.location?.city || 'Unknown'} • {traveler.distance} away
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  traveler.isOnline 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {traveler.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {traveler.mutualInterests || 0} shared interests
              </p>
            </div>
          </div>
          
          {traveler.bio && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-1">
              {traveler.bio}
            </p>
          )}
          
          {traveler.interests && traveler.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {traveler.interests.slice(0, 3).map((interest, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onConnect(traveler._id, traveler.name)}
            disabled={traveler.connectionStatus === 'requested' || sendingRequests[traveler._id]}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              traveler.connectionStatus === 'requested'
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
            }`}
          >
            {sendingRequests[traveler._id] ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : traveler.connectionStatus === 'requested' ? (
              'Request Sent'
            ) : (
              'Connect'
            )}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => onStartChat(traveler._id, traveler.name)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Chat
            </button>
            <button
              onClick={() => onViewProfile(traveler._id)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyUsersPage;