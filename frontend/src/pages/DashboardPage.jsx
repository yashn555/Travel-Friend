import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { getDashboardData, requestToJoinGroup } from '../services/api';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import { FaMapMarkerAlt, FaCompass, FaRoute, FaLocationArrow } from 'react-icons/fa';
import { AiOutlineEnvironment } from 'react-icons/ai';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationName, setLocationName] = useState('');

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
    const R = 6371; // Earth's radius in kilometers
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
      // First, calculate distance for each group
      const groupsWithDistance = groups.map(group => {
        // Check if group has starting location data
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
          // Try to extract location from description or destination
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

      // Sort: first exact matches (same city), then by distance
      groupsWithDistance.sort((a, b) => {
        // Exact city matches first
        if (a.isExactMatch && !b.isExactMatch) return -1;
        if (!a.isExactMatch && b.isExactMatch) return 1;
        
        // Then by distance
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        
        // Then by start date (sooner trips first)
        return new Date(a.startDate) - new Date(b.startDate);
      });

      return groupsWithDistance;
    }

    // If no location, sort by start date
    return groups.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [dashboardData.groups, searchTerm, userLocation, locationName]);

  /* ---------------- LOADER ---------------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden px-4 py-10">
      {/* Background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-300 rounded-full blur-3xl opacity-30" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-300 rounded-full blur-3xl opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-7xl mx-auto space-y-12"
      >
        {/* ---------------- HEADER WITH LOCATION ---------------- */}
        <div className="flex flex-col gap-6">
          {/* User Welcome */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome, {user?.name}
              </h1>
              <p className="text-gray-500 mt-2 text-lg">
                Discover trips, join groups & travel smarter
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search destinations (Goa, Manali, Paris...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/70 backdrop-blur border border-white/40 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                🔍
              </span>
            </div>
          </div>

          {/* Current Location Display */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg text-white">
                  {locationLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  ) : (
                    <FaCompass className="text-xl" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Current Location</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    {locationLoading ? (
                      <span>Detecting your location...</span>
                    ) : locationName ? (
                      <>
                        <FaMapMarkerAlt className="text-red-500" />
                        <span>{locationName}</span>
                        {userLocation && (
                          <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-amber-600">Location permission required</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={getUserLocation}
                  disabled={locationLoading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <FaLocationArrow />
                  {locationLoading ? 'Updating...' : 'Refresh Location'}
                </button>
                {userLocation && sortedAndFilteredGroups.length > 0 && (
                  <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                    <FaRoute />
                    <span>Sorted by distance from you</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Location-based sorting info */}
            {userLocation && sortedAndFilteredGroups.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Sorting Logic:</span> Showing groups starting from <span className="font-bold">{locationName}</span> first, 
                  then nearby locations by distance. {sortedAndFilteredGroups.filter(g => g.isExactMatch).length} groups start from your location.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- QUICK ACTIONS ---------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: 'Create Trip', icon: '🧳', path: '/create-trip', color: 'from-indigo-500 to-purple-500' },
            { title: 'My Groups', icon: '👥', path: '/my-groups', color: 'from-green-500 to-emerald-500' },
            { title: 'Requests', icon: '📩', path: '/group-requests', color: 'from-yellow-400 to-orange-500' },
            { title: 'Browse', icon: '🌍', path: '/groups', color: 'from-pink-500 to-rose-500' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, scale: 1.04 }}
              onClick={() => navigate(item.path)}
              className="cursor-pointer glass-card"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${item.color} text-white shadow-lg mb-4`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* ---------------- ACTIVE GROUPS ---------------- */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🌍 Active Groups
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({sortedAndFilteredGroups.length} groups)
              </span>
            </h2>
            
            {userLocation && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <AiOutlineEnvironment />
                <span>Sorted from nearest to farthest</span>
              </div>
            )}
          </div>

          {sortedAndFilteredGroups.length === 0 ? (
            <div className="glass-card text-center py-12">
              <p className="text-gray-500">No matching trips found.</p>
              <button 
                onClick={() => navigate('/create-trip')}
                className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                Create First Trip
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedAndFilteredGroups.map((g, index) => {
                const isMember = g.currentMembers?.some(
                  m => m.user && m.user._id === user?._id
                );
                const isCreator = g.createdBy?.id === user?._id;
                
                // Determine location match badge
                let locationBadge = null;
                if (g.isExactMatch) {
                  locationBadge = { text: 'Starts from your location', color: 'bg-green-100 text-green-700 border-green-200' };
                } else if (g.distance < 50) {
                  locationBadge = { text: 'Near you', color: 'bg-blue-100 text-blue-700 border-blue-200' };
                } else if (g.distance < 200) {
                  locationBadge = { text: 'Same region', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
                }

                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    className="glass-card overflow-hidden group cursor-pointer"
                    onClick={() => navigate(`/groups/${g.id}`)}
                  >
                    {/* TOP DESTINATION STRIP */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold tracking-wide">
                          {g.destination}
                        </h3>

                        {isCreator && (
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                            Your Group
                          </span>
                        )}
                      </div>

                      <p className="text-xs mt-1 opacity-90 flex items-center gap-1">
                        📅 {new Date(g.startDate).toLocaleDateString()} –{" "}
                        {new Date(g.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* BODY */}
                    <div className="p-4 space-y-4">
                      {/* Starting Location */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center text-sm font-medium text-gray-700">
                            <FaMapMarkerAlt className="mr-2 text-green-500" />
                            Starting Point
                          </div>
                          {locationBadge && (
                            <span className={`text-xs px-2 py-1 rounded-full border ${locationBadge.color}`}>
                              {locationBadge.text}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 font-semibold">{g.startingLocationName}</p>
                        
                        {userLocation && g.distance !== Infinity && (
                          <div className="flex items-center justify-between mt-2 text-sm">
                            <div className="text-gray-600 flex items-center">
                              <FaRoute className="mr-1" />
                              Distance: {g.distance} km
                            </div>
                            {g.distance < 100 ? (
                              <div className="text-green-600 font-medium">
                                ⏱️ {Math.round(g.distance / 60)}-{Math.round(g.distance / 40)} hours drive
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {g.description || "No description provided."}
                      </p>

                      {/* INFO GRID */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/60 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="font-semibold text-gray-800">
                            ₹{g.budget?.min || 0} – ₹{g.budget?.max || 0}
                          </p>
                        </div>

                        <div className="bg-white/60 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Created By</p>
                          <p className="font-semibold text-gray-800 truncate">
                            {g.createdBy?.name || "Unknown"}
                          </p>
                        </div>
                      </div>

                      {/* MEMBERS */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Members</span>
                          <span>
                            {g.currentMembersCount || 0}/{g.maxMembers || 10}
                          </span>
                        </div>

                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all"
                            style={{
                              width: `${((g.currentMembersCount || 0) / (g.maxMembers || 10)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="pt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* View Details Button */}
                        <Button
                          onClick={() => navigate(`/groups/${g.id}`)}
                          className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 hover:text-indigo-800 border border-indigo-200"
                          size="sm"
                        >
                          👁️ View Details
                        </Button>

                        {isCreator ? (
                          <Button
                            onClick={() => navigate(`/groups/${g.id}`)}
                            className="flex-1 bg-purple-500 hover:bg-purple-600"
                            size="sm"
                          >
                            Manage
                          </Button>
                        ) : isMember ? (
                          <Button
                            onClick={() => navigate(`/groups/${g.id}`)}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                            size="sm"
                          >
                            Enter
                          </Button>
                        ) : g.currentMembersCount >= g.maxMembers ? (
                          <Button disabled className="flex-1 bg-gray-400" size="sm">
                            Full
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleJoin(g.id, g.destination)}
                            className="flex-1 bg-indigo-500 hover:bg-indigo-600"
                            size="sm"
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );

<div className="mt-8">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 Find Travel Buddies</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Suggested Friends Card */}
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <div className="p-3 bg-blue-500 text-white rounded-lg mr-4">
          <AiOutlineUserAdd size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Suggested Friends</h3>
          <p className="text-sm text-gray-600">Based on your interests</p>
        </div>
      </div>
      <button 
        onClick={() => navigate('/find-friends')}
        className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium"
      >
        Discover
      </button>
    </div>

    {/* Nearby Travelers Card */}
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <div className="p-3 bg-green-500 text-white rounded-lg mr-4">
          <FaMapMarkerAlt size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Nearby Travelers</h3>
          <p className="text-sm text-gray-600">Find people in your area</p>
        </div>
      </div>
      <button 
        onClick={() => navigate('/nearby-users')}
        className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium"
      >
        Explore
      </button>
    </div>

    {/* Similar Interests Card */}
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <div className="p-3 bg-purple-500 text-white rounded-lg mr-4">
          <MdTravelExplore size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Similar Interests</h3>
          <p className="text-sm text-gray-600">Match with travelers like you</p>
        </div>
      </div>
      <button 
        onClick={() => navigate('/similar-interests')}
        className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-medium"
      >
        Match
      </button>
    </div>
  </div>
</div> 

};



export default DashboardPage;