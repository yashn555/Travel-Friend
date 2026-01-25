import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaSync, 
  FaUserFriends, 
  FaHeart,
  FaRegHeart,
  FaMapMarkerAlt,
  FaStar,
  FaCog,
  FaInfoCircle
} from 'react-icons/fa';
import { 
  MdTravelExplore,
  MdPeople,
  MdLocationOn,
  MdTrendingUp
} from 'react-icons/md';
import { toast } from 'react-toastify';
import MatchCard from './MatchCard';
import matchService from '../../services/matchService';

const MatchPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    minMatch: 40,
    hasLocation: false,
    hasBio: false
  });
  const [stats, setStats] = useState({
    totalMatches: 0,
    perfectMatches: 0,
    goodMatches: 0,
    averageMatch: 0
  });

  // Fetch matches on component mount
  useEffect(() => {
    fetchMatches();
  }, []);

  // Calculate stats when matches change
  useEffect(() => {
    if (matches.length > 0) {
      const totalMatches = matches.length;
      const perfectMatches = matches.filter(m => m.matchPercentage >= 80).length;
      const goodMatches = matches.filter(m => m.matchPercentage >= 60).length;
      const averageMatch = Math.round(
        matches.reduce((sum, m) => sum + m.matchPercentage, 0) / totalMatches
      );

      setStats({
        totalMatches,
        perfectMatches,
        goodMatches,
        averageMatch
      });
    }
  }, [matches]);

  // Fetch matches from API
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await matchService.getMatches(20);
      
      if (response.success) {
        setMatches(response.matches || []);
        toast.success(`Found ${response.count} matching travelers!`);
      } else {
        toast.error('Failed to load matches');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Error loading matches');
    } finally {
      setLoading(false);
    }
  };

  // Refresh matches
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
    toast.info('Matches refreshed!');
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...matches];

    // Apply minimum match filter
    filtered = filtered.filter(match => match.matchPercentage >= filters.minMatch);

    // Apply location filter
    if (filters.hasLocation) {
      filtered = filtered.filter(match => 
        match.user.city || match.user.state
      );
    }

    // Apply bio filter
    if (filters.hasBio) {
      filtered = filtered.filter(match => 
        match.user.bio && match.user.bio.trim().length > 0
      );
    }

    return filtered;
  };

  // Handle view profile
  const handleViewProfile = (userId) => {
    window.location.href = `/user/${userId}`;
  };

  // Get match color for stats
  const getMatchColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredMatches = applyFilters();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center">
                <MdTravelExplore className="mr-3 text-blue-500" />
                Like-Minded Travelers
              </h1>
              <p className="text-gray-600 mt-2">
                Find travelers who share your interests, budget, and travel style
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <FaSync className="mr-2" />
                  Refresh Matches
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Matches</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalMatches}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <MdPeople className="text-blue-500 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Perfect Matches</p>
                  <p className="text-2xl font-bold text-green-600">{stats.perfectMatches}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaHeart className="text-green-500 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Good Matches</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.goodMatches}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaStar className="text-yellow-500 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Match %</p>
                  <p className={`text-2xl font-bold ${getMatchColor(stats.averageMatch)}`}>
                    {stats.averageMatch}%
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <MdTrendingUp className="text-purple-500 text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FaFilter className="mr-2" />
                Filters
              </h3>

              {/* Minimum Match Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Match: {filters.minMatch}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={filters.minMatch}
                  onChange={(e) => setFilters({...filters, minMatch: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Checkbox Filters */}
              <div className="space-y-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasLocation}
                    onChange={(e) => setFilters({...filters, hasLocation: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 flex items-center">
                    <MdLocationOn className="mr-2" />
                    Has Location Set
                  </span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasBio}
                    onChange={(e) => setFilters({...filters, hasBio: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 flex items-center">
                    <FaUserFriends className="mr-2" />
                    Has Bio
                  </span>
                </label>
              </div>

              {/* Match Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaInfoCircle className="mr-2" />
                  How Matching Works
                </h4>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 mr-2"></div>
                    <span><strong>Travel Preferences:</strong> 50% weight</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1 mr-2"></div>
                    <span><strong>Budget:</strong> 15% weight</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1 mr-2"></div>
                    <span><strong>Experience:</strong> 10% weight</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1 mr-2"></div>
                    <span><strong>Languages:</strong> 15% weight</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1 mr-2"></div>
                    <span><strong>Transport:</strong> 5% weight</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt=1 mr-2"></div>
                    <span><strong>Location:</strong> 5% weight</span>
                  </li>
                </ul>
              </div>

              {/* Results Count */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Showing</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredMatches.length}</p>
                  <p className="text-sm text-gray-500">of {matches.length} matches</p>
                </div>
              </div>
            </div>
          </div>

          {/* Matches Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 text-lg">Finding like-minded travelers...</p>
                <p className="text-gray-500 text-sm mt-2">Analyzing preferences and calculating matches</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="text-6xl mb-4">🧳</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Matches Found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or update your travel preferences in your profile.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setFilters({ minMatch: 40, hasLocation: false, hasBio: false })}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Match Results Header */}
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Your Traveler Matches
                    </h2>
                    <p className="text-gray-600">
                      Sorted by highest match percentage
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {filteredMatches.length} results
                  </div>
                </div>

                {/* Matches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMatches.map((match, index) => (
                    <MatchCard
                      key={match.user._id || index}
                      match={match}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>

                {/* No More Results */}
                <div className="mt-12 text-center">
                  <div className="inline-block bg-white border border-gray-200 rounded-xl px-8 py-6">
                    <div className="text-4xl mb-4">🎯</div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      That's all for now!
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Check back later for new traveler matches.
                    </p>
                    <button
                      onClick={handleRefresh}
                      className="text-blue-500 hover:text-blue-600 font-medium flex items-center justify-center mx-auto"
                    >
                      <FaSync className="mr-2" />
                      Refresh for new matches
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <MdTravelExplore className="text-blue-500 text-2xl" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Want better matches?
                </h4>
                <p className="text-gray-600 mb-4">
                  Complete your travel profile with detailed preferences to get more accurate matches.
                </p>
                <button
                  onClick={() => window.location.href = '/profile?tab=edit'}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
                >
                  <FaCog className="mr-2" />
                  Update Travel Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPage;