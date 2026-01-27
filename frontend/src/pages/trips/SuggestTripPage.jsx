// src/pages/trips/SuggestTripPage.jsx - REAL TIME VERSION
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { getAutoTripSuggestions, createAutoTrip } from '../../services/api';
import Loader from '../../components/common/Loader';
import AdventureBackground from '../../components/layout/AdventureBackground';
import SimpleFooter from '../../components/layout/SimpleFooter';
import { 
  FaMapMarkerAlt, 
  FaUsers, 
  FaCalendarAlt, 
  FaWallet, 
  FaCheck, 
  FaSun,
  FaCloudRain,
  FaSnowflake,
  FaWind,
  FaTemperatureHigh,
  FaTemperatureLow,
  FaUmbrella,
  FaMountain,
  FaUmbrellaBeach,
  FaCity,
  FaTree,
  FaStar,
  FaRoute,
  FaExclamationTriangle
} from 'react-icons/fa';
import { 
  AiOutlineLoading3Quarters,
  AiOutlineEnvironment,
  AiOutlineCalendar,
  AiOutlineUser,
  AiOutlineTeam
} from 'react-icons/ai';

const SuggestTripPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [travelCompanions, setTravelCompanions] = useState(1);
  const [budgetRange, setBudgetRange] = useState({ min: 2000, max: 10000 });
  const [userLocation, setUserLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    getUserLocation();
  }, [token]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(true);
      toast.error('Location services not available');
      fetchSuggestionsWithDefault();
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        await fetchSuggestions(latitude, longitude);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError(true);
        toast.warning('Using approximate location for suggestions');
        fetchSuggestionsWithDefault();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchSuggestions = async (lat, lng) => {
    setLoading(true);
    setWeatherError(false);
    
    try {
      const data = await getAutoTripSuggestions({
        latitude: lat,
        longitude: lng,
        companions: travelCompanions
      });

      if (data.success) {
        setSuggestions(data.suggestions || []);
        setWeather(data.currentWeather);
        
        if (data.suggestions.length === 0) {
          toast.info('No suitable destinations found for current conditions');
        }
      } else {
        if (data.requiresLocation) {
          setLocationError(true);
          toast.error('Location access required for suggestions');
        } else if (data.requiresWeather) {
          setWeatherError(true);
          toast.error('Weather data unavailable. Try again later.');
        } else {
          toast.error(data.message || 'Failed to load suggestions');
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setWeatherError(true);
      toast.error('Unable to fetch real-time data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestionsWithDefault = () => {
    // Default to Mumbai coordinates
    fetchSuggestions(19.0760, 72.8777);
  };

  const handleCreateTrip = async () => {
    if (!selectedSuggestion) {
      toast.error('Please select a destination first');
      return;
    }

    if (!userLocation) {
      toast.error('Location access required to create trip');
      return;
    }

    setCreating(true);
    try {
      const tripData = {
        destinationName: selectedSuggestion.name,
        destinationAddress: selectedSuggestion.address,
        description: selectedSuggestion.description,
        companions: travelCompanions,
        budgetMin: budgetRange.min,
        budgetMax: budgetRange.max,
        latitude: userLocation.lat,
        longitude: userLocation.lng
      };

      // If there's an existing group, offer to join
      if (selectedSuggestion.bestGroup) {
        const joinExisting = window.confirm(
          `Found existing trip to ${selectedSuggestion.name}!\n` +
          `Group by ${selectedSuggestion.bestGroup.createdBy.name}\n` +
          `${selectedSuggestion.bestGroup.availableSlots} slots available\n\n` +
          `Would you like to join this existing trip instead of creating a new one?`
        );

        if (joinExisting) {
          tripData.joinExistingGroupId = selectedSuggestion.bestGroup.id;
        }
      }

      const response = await createAutoTrip(tripData);
      
      if (response.action === 'joined') {
        toast.success(`Joined trip to ${selectedSuggestion.name}!`);
      } else {
        toast.success(`Created new trip to ${selectedSuggestion.name}!`);
      }
      
      navigate(`/groups/${response.group._id}`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create trip';
      toast.error(errorMsg);
      
      if (error.response?.data?.requiresWeather) {
        toast.info('Please enable location services for weather-based trip creation');
      }
    } finally {
      setCreating(false);
    }
  };

  const joinExistingGroup = (groupId, groupName) => {
    navigate(`/groups/${groupId}`);
  };

  const getWeatherIcon = () => {
    if (!weather) return <FaSun className="text-amber-500" />;
    
    const condition = weather.condition.toLowerCase();
    if (condition.includes('rain')) return <FaCloudRain className="text-blue-500" />;
    if (condition.includes('snow')) return <FaSnowflake className="text-blue-300" />;
    if (condition.includes('cloud')) return <FaWind className="text-gray-500" />;
    return <FaSun className="text-amber-500" />;
  };

  const getWeatherAdvice = (suggestion) => {
    if (!suggestion.weatherAdvice) return null;
    
    const advice = suggestion.weatherAdvice;
    if (advice.toLowerCase().includes('perfect')) {
      return { text: advice, color: 'bg-emerald-100 text-emerald-800', icon: '✅' };
    }
    if (advice.toLowerCase().includes('good')) {
      return { text: advice, color: 'bg-blue-100 text-blue-800', icon: '👍' };
    }
    if (advice.toLowerCase().includes('avoid')) {
      return { text: advice, color: 'bg-amber-100 text-amber-800', icon: '⚠️' };
    }
    return { text: advice, color: 'bg-gray-100 text-gray-800', icon: 'ℹ️' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50">
        <Loader text="Fetching real-time weather and location data..." />
      </div>
    );
  }

  return (
    <AdventureBackground footer={<SimpleFooter />}>
      <div className="pt-20 px-4 max-w-7xl mx-auto pb-8">
        {/* Header with Real-time Data */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              🌦️ Smart Trip Suggestions
            </h1>
            <p className="text-gray-700 text-lg">
              Real-time weather and location based recommendations
            </p>
          </div>

          {/* Real-time Data Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-white/40 shadow-2xl p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Location */}
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl border border-white/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white">
                    <AiOutlineEnvironment className="text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Your Location</p>
                    <p className="font-bold text-gray-900">
                      {locationError ? 'Approximate Location' : 'Real-time Location'}
                    </p>
                  </div>
                </div>
                {userLocation && (
                  <p className="text-xs text-gray-600">
                    📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </p>
                )}
                {locationError && (
                  <p className="text-xs text-amber-600 mt-2">
                    <FaExclamationTriangle className="inline mr-1" />
                    Using approximate location
                  </p>
                )}
              </div>

              {/* Weather */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-white/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white">
                    {getWeatherIcon()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Current Weather</p>
                    {weather ? (
                      <div>
                        <p className="font-bold text-gray-900">{Math.round(weather.temp)}°C</p>
                        <p className="text-xs text-gray-600">{weather.description}</p>
                      </div>
                    ) : (
                      <p className="font-bold text-gray-900">Loading...</p>
                    )}
                  </div>
                </div>
                {weatherError && (
                  <p className="text-xs text-rose-600">
                    <FaExclamationTriangle className="inline mr-1" />
                    Weather data unavailable
                  </p>
                )}
              </div>

              {/* Travel Companions */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-white/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AiOutlineTeam className="text-purple-600" />
                    <span className="font-medium text-gray-800">Travel Companions</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{travelCompanions}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setTravelCompanions(Math.max(1, travelCompanions - 1))}
                    className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${(travelCompanions / 10) * 100}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                  <button 
                    onClick={() => setTravelCompanions(Math.min(10, travelCompanions + 1))}
                    className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Data Source Info */}
            <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-200/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-emerald-800">
                  {weatherError || locationError 
                    ? 'Using best available data for suggestions' 
                    : 'Using real-time weather and location data'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Destinations Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🌟 Smart Recommendations
              </h2>
              <p className="text-gray-700">
                Based on current weather, your location, and existing travel groups
              </p>
            </div>
            <div className="text-sm text-gray-600">
              {suggestions.length} destinations analyzed
            </div>
          </div>

          {weatherError && locationError ? (
            <div className="bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-12 text-center shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-full flex items-center justify-center border-2 border-white/30">
                <FaExclamationTriangle className="text-rose-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Data Unavailable</h3>
              <p className="text-gray-700 mb-6 max-w-md mx-auto">
                Unable to fetch current weather and location data. Please:
              </p>
              <div className="space-y-3 max-w-sm mx-auto">
                <button 
                  onClick={getUserLocation}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium"
                >
                  🔄 Retry with Location Access
                </button>
                <button 
                  onClick={fetchSuggestionsWithDefault}
                  className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-xl font-medium"
                >
                  🗺️ Use Approximate Data
                </button>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-12 text-center shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center border-2 border-white/30">
                <FaMapMarkerAlt className="text-indigo-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Suitable Destinations</h3>
              <p className="text-gray-700 mb-6 max-w-md mx-auto">
                Current weather conditions are not ideal for most destinations. Try adjusting your preferences.
              </p>
              <button 
                onClick={() => fetchSuggestions(userLocation?.lat || 19.0760, userLocation?.lng || 72.8777)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium"
              >
                🔄 Refresh with Current Data
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((suggestion, index) => {
                const weatherAdvice = getWeatherAdvice(suggestion);
                
                return (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={`relative cursor-pointer transition-all duration-300 ${
                      selectedSuggestion?.id === suggestion.id 
                        ? 'ring-4 ring-indigo-400/50 transform scale-[1.02]' 
                        : ''
                    }`}
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <div className="bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl rounded-3xl border-2 border-white/40 overflow-hidden shadow-xl hover:shadow-2xl h-full">
                      {/* Card Header */}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{suggestion.icon}</div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">
                                {suggestion.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <FaMapMarkerAlt className="text-blue-500 text-xs" />
                                <span className="text-sm text-gray-600">{suggestion.address}</span>
                              </div>
                            </div>
                          </div>
                          {selectedSuggestion?.id === suggestion.id && (
                            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                              <FaCheck size={12} />
                            </div>
                          )}
                        </div>

                        {/* Weather Advice */}
                        {weatherAdvice && (
                          <div className={`mb-3 p-2 rounded-lg ${weatherAdvice.color} flex items-center gap-2`}>
                            <span>{weatherAdvice.icon}</span>
                            <span className="text-xs font-medium">{weatherAdvice.text}</span>
                          </div>
                        )}

                        {/* Existing Groups Badge */}
                        {suggestion.existingGroups && suggestion.existingGroups.length > 0 && (
                          <div className="mb-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                              <AiOutlineTeam />
                              <span>{suggestion.totalGroups} active groups</span>
                              {suggestion.bestGroup && (
                                <span className="ml-1">• {suggestion.bestGroup.availableSlots} slots</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {suggestion.description}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center p-2 bg-white/30 rounded-xl">
                            <p className="text-xs text-gray-600 mb-1">Weather Match</p>
                            <p className="font-bold text-gray-900">{suggestion.weatherSuitability}%</p>
                          </div>
                          <div className="text-center p-2 bg-white/30 rounded-xl">
                            <p className="text-xs text-gray-600 mb-1">Interest Match</p>
                            <p className="font-bold text-gray-900">{suggestion.interestMatch}%</p>
                          </div>
                          <div className="text-center p-2 bg-white/30 rounded-xl">
                            <p className="text-xs text-gray-600 mb-1">Overall Score</p>
                            <p className="font-bold text-gray-900">{suggestion.matchScore}%</p>
                          </div>
                        </div>

                        {/* Existing Groups Preview */}
                        {suggestion.existingGroups && suggestion.existingGroups.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                              <span>🏢 Available groups:</span>
                              <span className="font-medium">{suggestion.totalGroups} total</span>
                            </div>
                            <div className="space-y-2">
                              {suggestion.existingGroups.slice(0, 2).map(group => (
                                <div 
                                  key={group.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    joinExistingGroup(group.id, suggestion.name);
                                  }}
                                  className="p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-200/30 hover:from-blue-500/20 hover:to-cyan-500/20 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                          {group.createdBy?.name || 'Group'}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <FaCalendarAlt className="text-gray-500 text-xs" />
                                        <span className="text-xs text-gray-600">
                                          {new Date(group.startDate).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short'
                                          })}
                                        </span>
                                        <FaRoute className="text-gray-500 text-xs ml-2" />
                                        <span className="text-xs text-gray-600">{group.distanceFromYou} km</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-800">
                                        {group.availableSlots}/{group.maxMembers}
                                      </p>
                                      <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                        Join →
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Best Travel Time */}
                        {suggestion.bestTravelTime && (
                          <div className="mb-4 p-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-amber-600 text-sm" />
                              <span className="text-xs text-amber-800">
                                Best time: {suggestion.bestTravelTime}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Select Button */}
                      <div className="p-4 bg-white/20 border-t border-white/30">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSuggestion(suggestion);
                          }}
                          className={`w-full py-3 rounded-xl font-medium transition-all ${
                            selectedSuggestion?.id === suggestion.id
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                              : 'bg-white/50 text-gray-800 hover:bg-white/70'
                          }`}
                        >
                          {selectedSuggestion?.id === suggestion.id 
                            ? 'Selected ✓' 
                            : suggestion.existingGroups?.length > 0 
                              ? 'Select & Join Existing'
                              : 'Select Destination'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Create/Join Trip Section */}
        {selectedSuggestion && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/30 backdrop-blur-xl rounded-3xl border-2 border-white/40 shadow-2xl p-8"
          >
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedSuggestion.existingGroups?.length > 0 
                    ? '✨ Join or Create Trip'
                    : '✨ Create Smart Trip'
                  }
                </h3>
                <p className="text-gray-700">
                  {selectedSuggestion.whyRecommended}
                </p>
              </div>
              
              {/* Trip Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl border border-white/30">
                  <p className="text-sm text-gray-700 mb-1">Starting Point</p>
                  <p className="font-bold text-gray-900">
                    {userLocation ? 'Your Location' : 'Current Location'}
                  </p>
                  {weather && (
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.round(weather.temp)}°C • {weather.description}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-white/30">
                  <p className="text-sm text-gray-700 mb-1">Destination</p>
                  <p className="font-bold text-gray-900">{selectedSuggestion.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Weather match: {selectedSuggestion.weatherSuitability}%
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-white/30">
                  <p className="text-sm text-gray-700 mb-1">Options</p>
                  <p className="font-bold text-gray-900">
                    {selectedSuggestion.existingGroups?.length > 0 
                      ? `${selectedSuggestion.totalGroups} groups available`
                      : 'Create new trip'
                    }
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {travelCompanions + 1} travelers • ₹{budgetRange.min}-{budgetRange.max}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedSuggestion(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-3 bg-white/50 text-gray-800 rounded-xl font-medium shadow-lg hover:bg-white/70 transition-all"
                >
                  Choose Another
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateTrip}
                  disabled={creating}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <AiOutlineLoading3Quarters className="animate-spin" />
                      {selectedSuggestion.existingGroups?.length > 0 
                        ? 'Joining Group...' 
                        : 'Creating Trip...'
                      }
                    </>
                  ) : (
                    <>
                      {selectedSuggestion.existingGroups?.length > 0 
                        ? '🚀 Join Existing Group'
                        : '🚀 Create Smart Trip'
                      }
                      <span className="text-lg">→</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Existing Groups Info */}
              {selectedSuggestion.existingGroups && selectedSuggestion.existingGroups.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl">
                  <p className="text-sm text-emerald-800">
                    💡 <span className="font-medium">Smart Tip:</span> Joining an existing group is recommended! 
                    You'll get instant travel buddies and can start planning immediately.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AdventureBackground>
  );
};

export default SuggestTripPage;