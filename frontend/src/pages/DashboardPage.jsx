import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardData, requestToJoinGroup } from '../services/api';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import SimpleFooter from '../components/layout/SimpleFooter';
import { 
  FaMapMarkerAlt, 
  FaCompass, 
  FaRoute, 
  FaLocationArrow,
  FaUsers,
  FaCalendarAlt,
  FaWallet,
  FaSearch,
  FaFilter,
  FaStar,
  FaFire,
  FaUserFriends,
  FaGlobeAmericas,
  FaCloud,
  FaMountain,
  FaUmbrellaBeach
} from 'react-icons/fa';
import { 
  AiOutlineUserAdd,
  AiOutlineEnvironment,
  AiOutlineRocket,
  AiOutlineTeam,
  AiOutlineHeart
} from 'react-icons/ai';
import { MdTravelExplore, MdLocationPin, MdOutlineGroup, MdOutlineExplore } from 'react-icons/md';
import { HiOutlineSparkles } from 'react-icons/hi';
import AdventureBackground from "../components/layout/AdventureBackground";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const [dashboardData, setDashboardData] = useState({
    groups: [],
  });

  /* ---------------- GET USER'S CURRENT LOCATION ---------------- */
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address;
            const city = address.city || address.town || address.village || address.county || address.state || 'Unknown Location';
            setLocationName(city);
          }
        } catch (error) {
          console.error('Reverse geocode error:', error);
          setLocationName('Your Location');
        }
        
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
        toast.error('Unable to get your location. Using default sorting.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  /* ---------------- CALCULATE DISTANCE BETWEEN TWO POINTS ---------------- */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  /* ---------------- FETCH DASHBOARD ---------------- */
  useEffect(() => {
    if (!token) navigate('/login');
    getUserLocation();
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();

      setDashboardData({
        groups: data.groups || [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- JOIN GROUP ---------------- */
  const handleJoin = async (groupId, destination) => {
    if (!groupId) {
      toast.error('Invalid group ID');
      return;
    }

    try {
      await requestToJoinGroup(groupId);
      toast.success(`Join request sent for ${destination}!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    }
  };

  /* ---------------- SORT GROUPS BY DISTANCE FROM USER ---------------- */
  const sortedAndFilteredGroups = useMemo(() => {
    let groups = dashboardData.groups.filter((g) =>
      g.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If user location is available, sort by proximity to starting location
    if (userLocation && groups.length > 0) {
      const groupsWithDistance = groups.map(group => {
        let distance = Infinity;
        let startingLocationName = 'Location not specified';
        
        if (group.startingLocation && group.startingLocation.coordinates) {
          const startLat = group.startingLocation.coordinates.lat;
          const startLng = group.startingLocation.coordinates.lng;
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            startLat,
            startLng
          );
          startingLocationName = group.startingLocation.address;
        } else if (group.meetingPoint && group.meetingPoint.coordinates) {
          const startLat = group.meetingPoint.coordinates.lat;
          const startLng = group.meetingPoint.coordinates.lng;
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            startLat,
            startLng
          );
          startingLocationName = group.meetingPoint.location;
        } else {
          startingLocationName = group.destination.split(',')[0].trim();
        }
        
        return {
          ...group,
          distance,
          startingLocationName,
          isExactMatch: startingLocationName.toLowerCase().includes(locationName.toLowerCase()) ||
                       locationName.toLowerCase().includes(startingLocationName.toLowerCase())
        };
      });

      groupsWithDistance.sort((a, b) => {
        if (a.isExactMatch && !b.isExactMatch) return -1;
        if (!a.isExactMatch && b.isExactMatch) return 1;
        
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        
        return new Date(a.startDate) - new Date(b.startDate);
      });

      return groupsWithDistance;
    }

    return groups.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [dashboardData.groups, searchTerm, userLocation, locationName]);

  /* ---------------- LOADER ---------------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse flex items-center justify-center">
            <HiOutlineSparkles className="text-white text-3xl" />
          </div>
          <p className="text-gray-600 font-medium">Loading your travel dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AdventureBackground footer={<SimpleFooter />}>
      <div className="pt-20 px-4 max-w-7xl mx-auto pb-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Clouds */}
          <motion.div
            animate={{ x: [0, 100, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 left-10 w-64 h-24 bg-gradient-to-r from-white/30 to-white/10 rounded-full blur-xl pointer-events-none"
          />
          <motion.div
            animate={{ x: [0, -150, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-40 right-20 w-48 h-20 bg-gradient-to-r from-indigo-200/20 to-purple-200/10 rounded-full blur-xl pointer-events-none"
          />
          
          {/* Floating Islands */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-5 w-40 h-10 bg-gradient-to-r from-emerald-300/20 to-teal-300/10 rounded-full blur-md pointer-events-none"
          />
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-32 right-10 w-32 h-8 bg-gradient-to-r from-amber-300/20 to-orange-300/10 rounded-full blur-md pointer-events-none"
          />
          
          {/* Floating Bubbles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className={`absolute w-${Math.floor(Math.random() * 12) + 4} h-${Math.floor(Math.random() * 12) + 4} rounded-full bg-gradient-to-r from-indigo-300/10 to-purple-300/10 blur-sm pointer-events-none`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
          
          {/* Animated Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-300/20 via-purple-300/20 to-pink-300/20 rounded-full mix-blend-screen blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-300/20 via-blue-300/20 to-indigo-300/20 rounded-full mix-blend-screen blur-3xl animate-pulse delay-1000 pointer-events-none" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-full border border-white/30"
                  >
                    <HiOutlineSparkles className="text-indigo-600 text-2xl" />
                  </motion.div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Welcome back, {user?.name}!
                    </h1>
                    <p className="text-gray-700 text-lg mt-1">
                      Your adventure begins here ✨
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="🌍 Search destinations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full lg:w-96 pl-12 pr-10 py-4 rounded-2xl bg-white/40 backdrop-blur-md border-2 border-white/30 shadow-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 text-gray-800 placeholder-gray-600"
                  />
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 text-lg" />
                  {searchTerm && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    >
                      ✕
                    </motion.button>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Location Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-white/40 shadow-2xl p-6 mb-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="p-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl text-white shadow-2xl"
                    >
                      {locationLoading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      ) : (
                        <FaCompass className="text-2xl" />
                      )}
                    </motion.div>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-lg"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg mb-1">Current Location</h3>
                    <div className="flex items-center gap-3">
                      {locationLoading ? (
                        <div className="flex items-center gap-2 text-gray-700">
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>Detecting your location...</span>
                        </div>
                      ) : locationName ? (
                        <>
                          <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full">
                            <FaMapMarkerAlt className="text-red-500 text-lg" />
                            <span className="font-bold text-gray-900">{locationName}</span>
                          </div>
                          <span className="text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full font-medium">
                            📍 {userLocation?.lat?.toFixed(4)}, {userLocation?.lng?.toFixed(4)}
                          </span>
                        </>
                      ) : (
                        <span className="text-amber-700 font-medium bg-amber-100/50 px-3 py-1.5 rounded-full">Location permission required</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={getUserLocation}
                    disabled={locationLoading}
                    className="px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl flex items-center gap-3 font-medium shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaLocationArrow />
                    {locationLoading ? 'Updating...' : 'Refresh Location'}
                  </motion.button>
                  {userLocation && sortedAndFilteredGroups.length > 0 && (
                    <div className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl flex items-center gap-3 font-medium shadow-lg">
                      <FaRoute />
                      <span>Sorted by distance</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Location Info */}
              {userLocation && sortedAndFilteredGroups.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-white/30 rounded-2xl backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/30 rounded-lg">
                      <AiOutlineEnvironment className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Showing <span className="font-bold text-blue-900">{sortedAndFilteredGroups.filter(g => g.isExactMatch).length} groups</span> starting from your location first, 
                        then nearby locations sorted by distance.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-white/30"
                >
                  <AiOutlineRocket className="text-indigo-600 text-xl" />
                </motion.div>
                Quick Actions
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Create Trip', 
                  description: 'Start your journey',
                  icon: '✈️', 
                  path: '/create-trip', 
                  color: 'from-indigo-500 to-purple-500',
                  bgColor: 'bg-gradient-to-br from-indigo-100/70 to-purple-100/70 backdrop-blur-sm'
                },
                { 
                  title: 'My Groups', 
                  description: 'Manage your trips',
                  icon: '👥', 
                  path: '/my-groups', 
                  color: 'from-emerald-500 to-teal-500',
                  bgColor: 'bg-gradient-to-br from-emerald-100/70 to-teal-100/70 backdrop-blur-sm'
                },
                { 
                  title: 'Requests', 
                  description: 'View join requests',
                  icon: '📩', 
                  path: '/group-requests', 
                  color: 'from-amber-500 to-orange-500',
                  bgColor: 'bg-gradient-to-br from-amber-100/70 to-orange-100/70 backdrop-blur-sm'
                },
                { 
                  title: 'Explore', 
                  description: 'Discover more',
                  icon: '🌍', 
                  path: '/groups', 
                  color: 'from-rose-500 to-pink-500',
                  bgColor: 'bg-gradient-to-br from-rose-100/70 to-pink-100/70 backdrop-blur-sm'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(item.path)}
                  className={`${item.bgColor} rounded-2xl border-2 border-white/40 p-6 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className={`p-4 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-700">{item.description}</p>
                    </div>
                  </div>
                  <motion.div 
                    className="flex items-center text-sm font-medium text-gray-600 group-hover:text-gray-900"
                    whileHover={{ x: 5 }}
                  >
                    <span>Get started</span>
                    <span className="ml-2">→</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Active Groups Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border border-white/30"
                >
                  <FaGlobeAmericas className="text-purple-600 text-xl" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Active Groups
                  </h2>
                  <p className="text-gray-700">
                    {sortedAndFilteredGroups.length} trips available
                    {userLocation && ' • Sorted from nearest'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/40 backdrop-blur-sm rounded-xl border-2 border-white/30 shadow-lg"
                >
                  <FaFilter className="text-indigo-500" />
                  <select 
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-gray-800"
                  >
                    <option value="all">All Trips</option>
                    <option value="nearby">Near Me</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="popular">Popular</option>
                  </select>
                </motion.div>
              </div>
            </div>

            <AnimatePresence>
              {sortedAndFilteredGroups.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-12 text-center shadow-2xl"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center border-2 border-white/30"
                  >
                    <MdTravelExplore className="text-indigo-600 text-3xl" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No trips found</h3>
                  <p className="text-gray-700 mb-6 max-w-md mx-auto">
                    {searchTerm ? `No destinations matching "${searchTerm}"` : 'No active groups available at the moment'}
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/create-trip')}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    Create Your First Trip
                  </motion.button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {sortedAndFilteredGroups.map((g, index) => {
                      const isMember = g.currentMembers?.some(
                        m => m.user && m.user._id === user?._id
                      );
                      const isCreator = g.createdBy?.id === user?._id;
                      
                      let locationBadge = null;
                      if (g.isExactMatch) {
                        locationBadge = { 
                          text: 'Starts here', 
                          color: 'bg-gradient-to-r from-green-500 to-emerald-500',
                          icon: '📍'
                        };
                      } else if (g.distance < 50) {
                        locationBadge = { 
                          text: 'Very close', 
                          color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
                          icon: '🚗'
                        };
                      } else if (g.distance < 200) {
                        locationBadge = { 
                          text: 'Same region', 
                          color: 'bg-gradient-to-r from-amber-500 to-orange-500',
                          icon: '🗺️'
                        };
                      }

                      return (
                        <motion.div
                          key={g.id}
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -8, transition: { duration: 0.2 } }}
                          onClick={() => navigate(`/groups/${g.id}`)}
                          className="group cursor-pointer"
                        >
                          <div className="bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-white/40 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                            {/* Header */}
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
                              <div className="relative p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-800 transition-colors">
                                      {g.destination}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                      <FaCalendarAlt className="text-indigo-500" />
                                      <span className="text-sm text-gray-700">
                                        {new Date(g.startDate).toLocaleDateString()} – {new Date(g.endDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  {isCreator && (
                                    <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full shadow-lg">
                                      Your Group
                                    </span>
                                  )}
                                </div>

                                {/* Location Badge */}
                                {locationBadge && (
                                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg ${locationBadge.color}`}>
                                    <span>{locationBadge.icon}</span>
                                    <span>{locationBadge.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 flex-1">
                              {/* Starting Point */}
                              <div className="mb-6 p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/30">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg">
                                    <MdLocationPin className="text-blue-600 text-lg" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Starting Point</p>
                                    <p className="text-gray-900 font-bold">{g.startingLocationName}</p>
                                  </div>
                                </div>
                                {userLocation && g.distance !== Infinity && (
                                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/30">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                      <FaRoute className="text-indigo-500" />
                                      <span>{g.distance} km away</span>
                                    </div>
                                    {g.distance < 100 && (
                                      <span className="text-sm font-medium text-emerald-600">
                                        ⏱️ ~{Math.round(g.distance / 60)} hours
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-gray-700 mb-6 line-clamp-2">
                                {g.description || "No description provided."}
                              </p>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30">
                                  <p className="text-xs text-gray-600 mb-1">Budget</p>
                                  <p className="font-bold text-gray-900">
                                    ₹{g.budget?.min || 0} – ₹{g.budget?.max || 0}
                                  </p>
                                </div>
                                <div className="p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30">
                                  <p className="text-xs text-gray-600 mb-1">Organizer</p>
                                  <p className="font-bold text-gray-900 truncate">
                                    {g.createdBy?.name || "Unknown"}
                                  </p>
                                </div>
                              </div>

                              {/* Members Progress */}
                              <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-700 mb-2">
                                  <span className="font-medium">Members</span>
                                  <span>
                                    {g.currentMembersCount || 0}/{g.maxMembers || 10}
                                  </span>
                                </div>
                                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ 
                                      width: `${((g.currentMembersCount || 0) / (g.maxMembers || 10)) * 100}%` 
                                    }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                  />
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  onClick={() => navigate(`/groups/${g.id}`)}
                                  className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg"
                                  size="sm"
                                >
                                  View Details
                                </Button>

                                {isCreator ? (
                                  <Button
                                    onClick={() => navigate(`/groups/${g.id}`)}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl py-3 font-medium shadow-lg"
                                    size="sm"
                                  >
                                    Manage
                                  </Button>
                                ) : isMember ? (
                                  <Button
                                    onClick={() => navigate(`/groups/${g.id}`)}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl py-3 font-medium shadow-lg"
                                    size="sm"
                                  >
                                    Enter Group
                                  </Button>
                                ) : g.currentMembersCount >= g.maxMembers ? (
                                  <Button 
                                    disabled 
                                    className="flex-1 bg-gray-300/50 text-gray-500 rounded-xl py-3 font-medium backdrop-blur-sm"
                                    size="sm"
                                  >
                                    Group Full
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleJoin(g.id, g.destination)}
                                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-3 font-medium shadow-lg"
                                    size="sm"
                                  >
                                    Join Trip
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Find Travel Buddies Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 bg-gradient-to-r from-rose-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border border-white/30"
              >
                <AiOutlineTeam className="text-rose-600 text-xl" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900">Find Travel Buddies</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Suggested Friends Card */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-blue-100/70 to-cyan-100/70 backdrop-blur-sm rounded-3xl border-2 border-white/40 p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <motion.div 
                    whileHover={{ rotate: 15 }}
                    className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white shadow-xl mr-4"
                  >
                    <AiOutlineUserAdd size={24} />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Suggested Friends</h3>
                    <p className="text-sm text-gray-700">Based on your travel interests</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/find-friends')}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3.5 rounded-xl font-medium shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Discover Buddies
                </motion.button>
              </motion.div>

              {/* Nearby Travelers Card */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-emerald-100/70 to-teal-100/70 backdrop-blur-sm rounded-3xl border-2 border-white/40 p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <motion.div 
                    whileHover={{ rotate: -15 }}
                    className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white shadow-xl mr-4"
                  >
                    <FaMapMarkerAlt size={20} />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Nearby Travelers</h3>
                    <p className="text-sm text-gray-700">Find people in your area</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/nearby-users')}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3.5 rounded-xl font-medium shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Explore Nearby
                </motion.button>
              </motion.div>

              {/* Similar Interests Card */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-sm rounded-3xl border-2 border-white/40 p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <motion.div 
                    whileHover={{ rotate: 15 }}
                    className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white shadow-xl mr-4"
                  >
                    <MdTravelExplore size={24} />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Similar Interests</h3>
                    <p className="text-sm text-gray-700">Match with like-minded travelers</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/match-travelers')}
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3.5 rounded-xl font-medium shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Find Matches
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-6 shadow-2xl"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { count: sortedAndFilteredGroups.length, label: 'Active Trips', color: 'text-indigo-600', bg: 'from-indigo-500/20 to-purple-500/20' },
                { count: sortedAndFilteredGroups.filter(g => g.distance < 100).length, label: 'Near You', color: 'text-emerald-600', bg: 'from-emerald-500/20 to-teal-500/20' },
                { count: sortedAndFilteredGroups.filter(g => g.isExactMatch).length, label: 'In Your City', color: 'text-purple-600', bg: 'from-purple-500/20 to-pink-500/20' },
                { count: sortedAndFilteredGroups.filter(g => g.currentMembersCount >= g.maxMembers).length, label: 'Popular Groups', color: 'text-rose-600', bg: 'from-rose-500/20 to-pink-500/20' },
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30"
                >
                  <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                    {stat.count}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Floating Action Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          onClick={() => navigate('/create-trip')}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-50"
        >
          <AiOutlineRocket className="text-2xl" />
        </motion.button>

        {/* REMOVED SimpleFooter from here - Now passed as prop to AdventureBackground */}
      </div>
    </AdventureBackground>
  );
};

export default DashboardPage;