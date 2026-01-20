// frontend/src/components/groupDetails/RouteSuggestion.jsx
import React, { useState, useEffect } from 'react';
import { FaRoute, FaBus, FaTrain, FaPlane, FaCar, FaWalking, FaMoneyBillWave, FaClock, FaLeaf, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getRouteSuggestions } from '../../services/tripService';

const RouteSuggestion = ({ group }) => {
  const [selectedMode, setSelectedMode] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bestRecommendation, setBestRecommendation] = useState(null);

  useEffect(() => {
    fetchRouteSuggestions();
  }, [group._id]);

  const fetchRouteSuggestions = async () => {
    try {
      setLoading(true);
      const response = await getRouteSuggestions(group._id);
      if (response.success) {
        setSuggestions(response.data.suggestions || []);
        setBestRecommendation(response.data.bestRecommendation || null);
      } else {
        setSuggestions([]);
        setBestRecommendation(null);
      }
    } catch (err) {
      console.error('Error fetching route suggestions:', err);
      setSuggestions([]);
      setBestRecommendation(null);
      toast.error('Failed to load route suggestions');
    } finally {
      setLoading(false);
    }
  };

  const groupSize = group.currentMembers?.length || 1;
  const budget = group.budget?.max || 0;

  const getRecommendationText = () => {
    if (!bestRecommendation) return 'No recommendation available';
    
    if (bestRecommendation.mode === 'Car Roadtrip') return 'Car Roadtrip - Best for bonding and flexibility';
    if (bestRecommendation.mode === 'AC Bus' && groupSize > 10) return 'AC Bus - Most economical for large groups';
    if (bestRecommendation.mode === 'Train' && budget >= 2000) return 'Train - Best balance of comfort and cost';
    if (bestRecommendation.mode === 'Bus') return 'Bus - Most budget-friendly option';
    
    return `${bestRecommendation.mode} - Recommended based on your preferences`;
  };

  const renderTransportIcon = (mode) => {
    switch(mode?.toLowerCase()) {
      case 'flight': return <FaPlane className="text-blue-500" />;
      case 'train': return <FaTrain className="text-green-500" />;
      case 'bus': return <FaBus className="text-purple-500" />;
      case 'car': return <FaCar className="text-orange-500" />;
      default: return <FaCar className="text-gray-500" />;
    }
  };

  const filteredSuggestions = selectedMode === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.mode?.toLowerCase().includes(selectedMode.toLowerCase()));

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaRoute className="mr-2 text-orange-500" />
            Best Route Suggestions
          </h2>
          <p className="text-gray-600 mt-2">
            Getting travel recommendations based on group size, budget, and distance...
          </p>
        </div>
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading route suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaRoute className="mr-2 text-orange-500" />
              Best Route Suggestions
            </h2>
            <p className="text-gray-600 mt-2">
              Get travel recommendations based on group size, budget, and distance
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg border">
              <span className="text-gray-700">{groupSize} Travelers</span>
            </div>
            {budget > 0 && (
              <div className="bg-white px-4 py-2 rounded-lg border">
                <span className="text-gray-700">Budget: ₹{budget.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode Filter */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Travel Mode</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => setSelectedMode('all')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center ${
              selectedMode === 'all' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <FaRoute className="text-2xl text-gray-600 mb-2" />
            <span className="font-medium">All</span>
          </button>
          
          <button
            onClick={() => setSelectedMode('flight')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center ${
              selectedMode === 'flight' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <FaPlane className="text-2xl text-blue-500 mb-2" />
            <span className="font-medium">Flight</span>
          </button>
          
          <button
            onClick={() => setSelectedMode('train')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center ${
              selectedMode === 'train' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <FaTrain className="text-2xl text-green-500 mb-2" />
            <span className="font-medium">Train</span>
          </button>
          
          <button
            onClick={() => setSelectedMode('bus')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center ${
              selectedMode === 'bus' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <FaBus className="text-2xl text-purple-500 mb-2" />
            <span className="font-medium">Bus</span>
          </button>
          
          <button
            onClick={() => setSelectedMode('car')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center ${
              selectedMode === 'car' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <FaCar className="text-2xl text-orange-500 mb-2" />
            <span className="font-medium">Car</span>
          </button>
        </div>
      </div>

      {/* AI Recommendation */}
      {bestRecommendation && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <FaLeaf className="text-blue-500 text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">AI Recommendation</h3>
              <p className="text-gray-600">
                Based on your group size and budget, we recommend:
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
            <p className="text-lg font-medium text-gray-800">{getRecommendationText()}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Group Size</p>
                <p className="font-semibold text-gray-800">{groupSize} travelers</p>
              </div>
              {budget > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Budget Range</p>
                  <p className="font-semibold text-gray-800">₹{group.budget?.min?.toLocaleString() || '0'} - ₹{budget.toLocaleString()}</p>
                </div>
              )}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Recommended Mode</p>
                <div className="flex items-center">
                  {renderTransportIcon(bestRecommendation.mode)}
                  <span className="ml-2 font-semibold text-gray-800">{bestRecommendation.mode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Suggestions */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Available Options</h3>
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FaRoute className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">No route suggestions available</p>
            <p className="text-sm text-gray-500 mt-2">Suggestions will appear based on your destination and preferences</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSuggestions.map((route, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                        {renderTransportIcon(route.mode)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{route.mode}</h3>
                        <p className="text-gray-600 text-sm">{route.description}</p>
                      </div>
                    </div>
                    {route.ecoFriendly && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Eco-friendly
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <FaClock className="mr-2" />
                        <span className="text-sm">Travel Time</span>
                      </div>
                      <p className="font-semibold text-gray-800">{route.time}</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <FaMoneyBillWave className="mr-2" />
                        <span className="text-sm">Total Cost</span>
                      </div>
                      <p className="font-semibold text-gray-800">₹{route.cost?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Details:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best for:</span>
                        <span className="font-medium">{route.bestFor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Comfort Level:</span>
                        <span className="font-medium">{route.comfort}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Group Capacity:</span>
                        <span className="font-medium">{route.capacity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-700"
                    onClick={() => toast.info(`Selected ${route.mode} route`)}
                  >
                    Select This Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Travel Tips */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Travel Tips for Groups</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Group Discounts</h4>
                <p className="text-gray-600 text-sm">Book together for 10-20% discounts on transport</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Flexible Timing</h4>
                <p className="text-gray-600 text-sm">Consider travel time vs cost trade-offs</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Comfort vs Budget</h4>
                <p className="text-gray-600 text-sm">Balance comfort with your group's budget</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Booking Early</h4>
                <p className="text-gray-600 text-sm">Book transport 2-3 weeks in advance for best rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteSuggestion;