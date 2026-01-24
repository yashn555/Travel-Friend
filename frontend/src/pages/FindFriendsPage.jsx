import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  searchUsers, 
  followUser, 
  unfollowUser,
  getSuggestedFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
} from '../services/api';
import Loader from '../components/common/Loader';
import { 
  FaSearch, 
  FaUserPlus, 
  FaUserCheck, 
  FaUserFriends,
  FaMapMarkerAlt,
  FaHeart,
  FaStar,
  FaFilter,
  FaTimes,
  FaCheck,
  FaClock,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt
} from 'react-icons/fa';
import { 
  AiOutlineUser, 
  AiOutlineMessage, 
  AiOutlineCompass,
  AiOutlineFire,
  AiOutlineTeam,
  AiOutlineCheck,
  AiOutlineClose
} from 'react-icons/ai';
import { MdTravelExplore, MdLocationCity, MdInterests } from 'react-icons/md';
import { HiOutlineSparkles } from 'react-icons/hi';

const FindFriendsPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Tabs and filters
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'suggested', 'requests'
  const [filters, setFilters] = useState({
    location: '',
    interests: '',
    gender: '',
    ageRange: { min: 18, max: 60 }
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Other data
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Follow/unfollow loading states
  const [followLoading, setFollowLoading] = useState({});

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInitialData();
  }, [token]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch suggested friends
      const suggestedRes = await getSuggestedFriends();
      setSuggestedFriends(suggestedRes.data || suggestedRes || []);
      
      // Fetch pending friend requests
      const requestsRes = await getFriendRequests();
      setFriendRequests(requestsRes.data || requestsRes || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load friend suggestions');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SEARCH FUNCTION (Same as Profile Page) ---------------- */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    setSearching(true);
    try {
      const res = await searchUsers(searchQuery);
      
      if (res.success) {
        const results = res.data || res.users || res;
        setSearchResults(Array.isArray(results) ? results : [results]);
        if (results.length === 0) {
          toast.info('No users found matching your search');
        }
      } else {
        toast.error(res.message || 'Failed to search users');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  /* ---------------- FILTERED SEARCH ---------------- */
  const handleFilteredSearch = async () => {
    setSearching(true);
    try {
      // Build query object from filters
      let query = '';
      const filterParts = [];
      
      if (searchQuery) filterParts.push(searchQuery);
      if (filters.location) filterParts.push(filters.location);
      if (filters.interests) filterParts.push(filters.interests);
      if (filters.gender) filterParts.push(filters.gender);
      
      query = filterParts.join(' ');
      
      const res = await searchUsers(query);
      
      if (res.success) {
        const results = res.data || res.users || res;
        
        // Apply additional client-side filtering for age
        const filteredResults = results.filter(user => {
          const userAge = user.age || 25; // Default age if not provided
          return userAge >= filters.ageRange.min && userAge <= filters.ageRange.max;
        });
        
        setSearchResults(filteredResults);
        if (filteredResults.length === 0) {
          toast.info('No users found matching your filters');
        }
      }
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  /* ---------------- FOLLOW/UNFOLLOW FUNCTION (Same as Profile Page) ---------------- */
  const handleFollowAction = async (userId, isCurrentlyFollowing) => {
    // Set loading state for this specific user
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      let res;
      if (isCurrentlyFollowing) {
        res = await unfollowUser(userId);
      } else {
        res = await followUser(userId);
      }
      
      if (res.success) {
        const action = isCurrentlyFollowing ? 'Unfollowed' : 'Followed';
        toast.success(`${action} successfully!`);
        
        // Update all results states
        updateUserInAllLists(userId, { isFollowing: !isCurrentlyFollowing });
        
      } else {
        toast.error(res.message || 'Failed to perform action');
      }
    } catch (err) {
      console.error('Follow action error:', err);
      toast.error('Failed to perform action');
    } finally {
      // Clear loading state
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  /* ---------------- HELPER: Update user in all lists ---------------- */
  const updateUserInAllLists = (userId, updates) => {
    // Update search results
    setSearchResults(prev => 
      prev.map(user => 
        (user._id === userId || user.id === userId) ? { ...user, ...updates } : user
      )
    );
    
    // Update suggested friends
    setSuggestedFriends(prev => 
      prev.map(user => 
        (user._id === userId || user.id === userId) ? { ...user, ...updates } : user
      )
    );
    
    // Update friend requests (if applicable)
    setFriendRequests(prev => 
      prev.map(request => {
        if (request.from?._id === userId || request.from?.id === userId) {
          return { ...request, from: { ...request.from, ...updates } };
        }
        return request;
      })
    );
  };

  /* ---------------- SEND FRIEND REQUEST ---------------- */
  const handleSendFriendRequest = async (userId, userName) => {
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const res = await sendFriendRequest(userId);
      
      if (res.success) {
        toast.success(`Friend request sent to ${userName}!`);
        updateUserInAllLists(userId, { friendshipStatus: 'pending' });
      } else {
        toast.error(res.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Send request error:', error);
      toast.error('Failed to send friend request');
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  /* ---------------- HANDLE FRIEND REQUEST RESPONSE ---------------- */
  const handleFriendRequestResponse = async (requestId, action) => {
    try {
      let res;
      if (action === 'accept') {
        res = await acceptFriendRequest(requestId);
      } else {
        res = await rejectFriendRequest(requestId);
      }
      
      if (res.success) {
        const actionText = action === 'accept' ? 'accepted' : 'rejected';
        toast.success(`Friend request ${actionText}!`);
        
        // Remove from friend requests list
        setFriendRequests(prev => prev.filter(req => req._id !== requestId));
        
        // Refresh suggested friends
        const suggestedRes = await getSuggestedFriends();
        setSuggestedFriends(suggestedRes.data || suggestedRes || []);
        
      } else {
        toast.error(res.message || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error('Friend request response error:', error);
      toast.error(`Failed to ${action} friend request`);
    }
  };

  /* ---------------- CLEAR FILTERS ---------------- */
  const clearFilters = () => {
    setFilters({
      location: '',
      interests: '',
      gender: '',
      ageRange: { min: 18, max: 60 }
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  /* ---------------- REFRESH DATA ---------------- */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInitialData();
      toast.success('Data refreshed!');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  /* ---------------- USER CARD COMPONENT ---------------- */
  const UserCard = ({ userData, showConnectButton = true }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const getUserStatus = () => {
      if (userData.friendshipStatus === 'pending') {
        return { text: 'Request Sent', color: 'bg-yellow-100 text-yellow-800', icon: <FaClock /> };
      }
      if (userData.friendshipStatus === 'accepted') {
        return { text: 'Friend', color: 'bg-green-100 text-green-800', icon: <FaUserCheck /> };
      }
      if (userData.isFollowing) {
        return { text: 'Following', color: 'bg-blue-100 text-blue-800', icon: <FaUserPlus /> };
      }
      return null;
    };
    
    const status = getUserStatus();
    const isLoading = followLoading[userData._id || userData.id];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, scale: 1.02 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300"
      >
        {/* Profile Header */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
          {/* User Avatar */}
          <div className="absolute -bottom-8 left-6">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                {userData.profileImage && userData.profileImage !== 'default-profile.jpg' ? (
                  <img 
                    src={`http://localhost:5000/uploads/profiles/${userData.profileImage}`}
                    alt={userData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <AiOutlineUser className="text-white text-3xl" />
                  </div>
                )}
              </div>
              {userData.isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          </div>
          
          {/* Connect Button */}
          {showConnectButton && (
            <div className="absolute top-4 right-4">
              {status ? (
                <div className={`px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium ${status.color}`}>
                  {status.icon}
                  {status.text}
                </div>
              ) : (
                <button
                  onClick={() => handleFollowAction(userData._id || userData.id, userData.isFollowing)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  ) : userData.isFollowing ? (
                    <>
                      <AiOutlineCheck />
                      Following
                    </>
                  ) : (
                    <>
                      <FaUserPlus />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="pt-12 px-6 pb-6">
          <div className="mb-4">
            <h3 
              className="text-xl font-bold text-gray-900 mb-1 hover:text-indigo-600 cursor-pointer transition-colors"
              onClick={() => navigate(`/profile/${userData._id || userData.id}`)}
            >
              {userData.name}
            </h3>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <FaMapMarkerAlt className="text-red-500" />
              <span>{userData.location || userData.city || userData.town || 'Location not specified'}</span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">
              {userData.bio || 'No bio available'}
            </p>
          </div>

          {/* Interests/Tags */}
          {userData.interests && userData.interests.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MdInterests className="text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userData.interests.slice(0, 3).map((interest, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full"
                  >
                    {interest}
                  </span>
                ))}
                {userData.interests.length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{userData.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Travel Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{userData.tripCount || 0}</div>
              <div className="text-xs text-gray-500">Trips</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{userData.friendCount || 0}</div>
              <div className="text-xs text-gray-500">Friends</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{userData.matchScore || 85}%</div>
              <div className="text-xs text-gray-500">Match</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/profile/${userData._id || userData.id}`)}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <AiOutlineUser />
              Profile
            </button>
            <button
              onClick={() => navigate(`/chat/${userData._id || userData.id}`)}
              className="flex-1 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <AiOutlineMessage />
              Message
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  /* ---------------- FRIEND REQUEST CARD ---------------- */
  const FriendRequestCard = ({ request }) => {
    const requester = request.from || request;
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 overflow-hidden">
                {requester.profileImage && requester.profileImage !== 'default-profile.jpg' ? (
                  <img 
                    src={`http://localhost:5000/uploads/profiles/${requester.profileImage}`}
                    alt={requester.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <AiOutlineUser className="text-white text-xl" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{requester.name}</h4>
              <p className="text-sm text-gray-600">
                {requester.location || requester.city || requester.town || 'No location'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {requester.interests?.slice(0, 2).map((interest, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleFriendRequestResponse(request._id, 'accept')}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <AiOutlineCheck />
              Accept
            </button>
            <button
              onClick={() => handleFriendRequestResponse(request._id, 'reject')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
            >
              <AiOutlineClose />
              Ignore
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---------------- LOADER ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <HiOutlineSparkles className="text-white text-xl" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Find Travel Buddies
                </h1>
              </div>
              <p className="text-gray-700 text-lg">
                Connect with like-minded travelers and build your travel network
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                ) : (
                  <AiOutlineCompass />
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-8"
          >
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, location, interests..."
                  className="w-full pl-14 pr-4 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <button
                  type="submit"
                  disabled={searching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
                >
                  {searching ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Searching...
                    </div>
                  ) : 'Search'}
                </button>
              </div>
            </form>

            {/* Filter Toggle */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
              >
                <FaFilter />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              {(searchQuery || Object.values(filters).some(val => val)) && (
                <button
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <FaTimes />
                  Clear All
                </button>
              )}
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={filters.location}
                          onChange={(e) => setFilters({...filters, location: e.target.value})}
                          placeholder="City, Country"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Interests
                        </label>
                        <input
                          type="text"
                          value={filters.interests}
                          onChange={(e) => setFilters({...filters, interests: e.target.value})}
                          placeholder="Hiking, Photography..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          value={filters.gender}
                          onChange={(e) => setFilters({...filters, gender: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Any</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleFilteredSearch}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age Range: {filters.ageRange.min} - {filters.ageRange.max}
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="18"
                          max="80"
                          value={filters.ageRange.min}
                          onChange={(e) => setFilters({
                            ...filters, 
                            ageRange: {...filters.ageRange, min: parseInt(e.target.value)}
                          })}
                          className="w-full"
                        />
                        <input
                          type="range"
                          min="18"
                          max="80"
                          value={filters.ageRange.max}
                          onChange={(e) => setFilters({
                            ...filters, 
                            ageRange: {...filters.ageRange, max: parseInt(e.target.value)}
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                {[
                  { 
                    id: 'search', 
                    label: 'Search Results', 
                    icon: <FaSearch />,
                    count: searchResults.length
                  },
                  { 
                    id: 'suggested', 
                    label: 'Suggested', 
                    icon: <AiOutlineFire />,
                    count: suggestedFriends.length
                  },
                  { 
                    id: 'requests', 
                    label: 'Friend Requests', 
                    icon: <FaUserPlus />,
                    count: friendRequests.length
                  }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[200px] py-4 px-6 font-medium border-b-2 transition-colors flex items-center justify-center gap-3 ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Search Results Tab */}
                {activeTab === 'search' && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Search Results
                        {searchResults.length > 0 && (
                          <span className="ml-2 text-lg font-normal text-gray-500">
                            ({searchResults.length} found)
                          </span>
                        )}
                      </h2>
                      {searching && (
                        <div className="flex items-center gap-2 text-indigo-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                          Searching...
                        </div>
                      )}
                    </div>

                    {searchResults.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <FaSearch className="text-gray-400 text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {searchQuery || Object.values(filters).some(val => val) 
                            ? 'No users found' 
                            : 'Search for travelers'}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-6">
                          {searchQuery 
                            ? `No results found for "${searchQuery}". Try different keywords or adjust your filters.`
                            : 'Enter a name, location, or interest to find travel buddies.'}
                        </p>
                        <button
                          onClick={() => setActiveTab('suggested')}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
                        >
                          View Suggested Friends
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map((user) => (
                          <UserCard key={user._id || user.id} userData={user} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Suggested Friends Tab */}
                {activeTab === 'suggested' && (
                  <motion.div
                    key="suggested"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Suggested Friends</h2>
                        <p className="text-gray-600">
                          These travelers share your interests and travel style
                        </p>
                      </div>
                      <button
                        onClick={fetchInitialData}
                        className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                      >
                        <AiOutlineCompass />
                        Refresh Suggestions
                      </button>
                    </div>

                    {suggestedFriends.length === 0 ? (
                      <div className="text-center py-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                          <AiOutlineFire className="text-white text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No suggestions yet</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-6">
                          Complete your profile with more interests and travel preferences to get better suggestions.
                        </p>
                        <button
                          onClick={() => navigate('/profile')}
                          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                        >
                          Complete Your Profile
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {suggestedFriends.slice(0, 6).map((user) => (
                            <UserCard key={user._id || user.id} userData={user} />
                          ))}
                        </div>
                        
                        {/* Top Matches Section */}
                        {suggestedFriends.filter(u => u.matchScore > 90).length > 0 && (
                          <div className="mt-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <FaStar className="text-amber-500" />
                              Top Matches (90%+)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {suggestedFriends
                                .filter(user => user.matchScore > 90)
                                .slice(0, 4)
                                .map((user) => (
                                  <div key={user._id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 overflow-hidden">
                                          {user.profileImage && user.profileImage !== 'default-profile.jpg' ? (
                                            <img src={`http://localhost:5000/uploads/profiles/${user.profileImage}`} alt={user.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <AiOutlineUser className="text-white text-lg" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                                        <div className="flex items-center gap-1">
                                          <FaHeart className="text-red-400 text-xs" />
                                          <span className="text-sm font-bold text-amber-600">{user.matchScore}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* Friend Requests Tab */}
                {activeTab === 'requests' && (
                  <motion.div
                    key="requests"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Friend Requests</h2>
                        <p className="text-gray-600">
                          Manage your incoming connection requests
                        </p>
                      </div>
                      {friendRequests.length > 0 && (
                        <button
                          onClick={() => {
                            // Accept all requests
                            friendRequests.forEach(request => {
                              handleFriendRequestResponse(request._id, 'accept');
                            });
                          }}
                          className="text-green-600 hover:text-green-700 flex items-center gap-2"
                        >
                          <AiOutlineCheck />
                          Accept All
                        </button>
                      )}
                    </div>

                    {friendRequests.length === 0 ? (
                      <div className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <FaUserCheck className="text-white text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No pending requests</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-6">
                          You don't have any pending friend requests. Start connecting with other travelers!
                        </p>
                        <button
                          onClick={() => setActiveTab('search')}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
                        >
                          Find Travel Buddies
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {friendRequests.map((request) => (
                          <FriendRequestCard key={request._id} request={request} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <MdTravelExplore className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{suggestedFriends.length}</div>
                <div className="text-gray-600">Suggested Friends</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <AiOutlineTeam className="text-emerald-600 text-2xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{friendRequests.length}</div>
                <div className="text-gray-600">Pending Requests</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaHeart className="text-purple-600 text-2xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {suggestedFriends.filter(u => u.matchScore > 85).length}
                </div>
                <div className="text-gray-600">High Match Score</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Tips for Finding Great Travel Buddies</h3>
              <ul className="space-y-2 text-indigo-100">
                <li>• Complete your profile with detailed interests and travel preferences</li>
                <li>• Upload a clear profile picture</li>
                <li>• Send personalized messages when connecting with others</li>
                <li>• Check mutual interests and travel history</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Update Your Profile
            </button>
          </div>
        </motion.div>
      </div>

      {/* Add animations to your global CSS */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default FindFriendsPage;