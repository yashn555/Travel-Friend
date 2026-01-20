// frontend/src/components/groupDetails/AITripPlanner.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaSun, 
  FaCloudRain, 
  FaSnowflake, 
  FaLeaf, 
  FaCalendarDay, 
  FaHotel, 
  FaRoute, 
  FaMoneyBillWave, 
  FaLightbulb,
  FaUsers,
  FaUtensils,
  FaMapMarkerAlt,
  FaCar,
  FaTrain,
  FaPlane,
  FaBus,
  FaStar,
  FaExclamationCircle,
  FaSpinner,
  FaEdit,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { generateTripPlan, getTripPlan, updateTripPlan } from '../../services/tripService';

const AITripPlanner = ({ group, isCreator }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tripPlan, setTripPlan] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(null);

  useEffect(() => {
    const fetchExistingPlan = async () => {
      try {
        setLoading(true);
        const response = await getTripPlan(group._id);
        if (response.success && response.data) {
          setTripPlan(response.data.plan);
        }
      } catch (err) {
        console.log('No existing trip plan found:', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (group?._id) {
      fetchExistingPlan();
    }
  }, [group._id]);

  const getSeason = (date) => {
    if (!date) return { name: 'Unknown', icon: <FaCloudRain className="text-gray-500" />, color: 'text-gray-600' };
    const month = new Date(date).getMonth();
    if (month >= 2 && month <= 4) return { name: 'Spring', icon: <FaLeaf className="text-green-500" />, color: 'text-green-600' };
    if (month >= 5 && month <= 7) return { name: 'Summer', icon: <FaSun className="text-yellow-500" />, color: 'text-yellow-600' };
    if (month >= 8 && month <= 10) return { name: 'Autumn', icon: <FaLeaf className="text-orange-500" />, color: 'text-orange-600' };
    return { name: 'Winter', icon: <FaSnowflake className="text-blue-500" />, color: 'text-blue-600' };
  };

  const season = getSeason(group.startDate);
  const groupSize = group.currentMembers?.length || 1;
  const durationDays = group.startDate && group.endDate 
    ? Math.ceil((new Date(group.endDate) - new Date(group.startDate)) / (1000 * 60 * 60 * 24))
    : 0;

  const generateNewTripPlan = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await generateTripPlan(group._id, prompt);
      if (response.success) {
        setTripPlan(response.data.plan);
        setEditing(false);
        toast.success('Trip plan generated successfully!');
      }
    } catch (err) {
      console.error('Error generating trip plan:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate trip plan. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = () => {
    setEditing(true);
    setEditedPlan(JSON.parse(JSON.stringify(tripPlan)));
  };

  const handleSavePlan = async () => {
    if (!editedPlan) return;
    
    setSaving(true);
    try {
      const response = await updateTripPlan(group._id, editedPlan);
      if (response.success) {
        setTripPlan(editedPlan);
        setEditing(false);
        toast.success('Trip plan updated successfully!');
      }
    } catch (err) {
      console.error('Error updating trip plan:', err);
      toast.error('Failed to update trip plan');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditedPlan(null);
  };

  const updateActivity = (dayIndex, activityIndex, field, value) => {
    const newPlan = { ...editedPlan };
    newPlan.itinerary[dayIndex].activities[activityIndex][field] = value;
    setEditedPlan(newPlan);
  };

  const updateDayCost = (dayIndex, cost) => {
    const newPlan = { ...editedPlan };
    newPlan.itinerary[dayIndex].estimatedCost = parseFloat(cost) || 0;
    newPlan.totalEstimatedCost = newPlan.itinerary.reduce((sum, day) => sum + day.estimatedCost, 0);
    newPlan.costPerPerson = Math.round(newPlan.totalEstimatedCost / groupSize);
    setEditedPlan(newPlan);
  };

  const renderTransportIcon = (transportType) => {
    if (!transportType) return <FaCar className="text-gray-500" />;
    if (transportType.includes('Car') || transportType.includes('Taxi')) return <FaCar className="text-blue-500" />;
    if (transportType.includes('Bus') || transportType.includes('Coach')) return <FaBus className="text-purple-500" />;
    if (transportType.includes('Train')) return <FaTrain className="text-green-500" />;
    if (transportType.includes('Flight') || transportType.includes('Plane')) return <FaPlane className="text-red-500" />;
    return <FaCar className="text-gray-500" />;
  };

  const renderCostSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
        <div className="flex items-center mb-3">
          <FaMoneyBillWave className="text-green-600 text-xl mr-2" />
          <h3 className="font-semibold text-gray-800">Total Estimated Cost</h3>
        </div>
        <p className="text-3xl font-bold text-gray-800">
          ₹{(tripPlan?.totalEstimatedCost || 0).toLocaleString()}
        </p>
        <p className="text-gray-600 text-sm mt-2">For entire trip duration</p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center mb-3">
          <FaUsers className="text-blue-600 text-xl mr-2" />
          <h3 className="font-semibold text-gray-800">Cost Per Person</h3>
        </div>
        <p className="text-3xl font-bold text-gray-800">
          ₹{(tripPlan?.costPerPerson || 0).toLocaleString()}
        </p>
        <p className="text-gray-600 text-sm mt-2">Based on {groupSize} travelers</p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center mb-3">
          <FaCalendarDay className="text-purple-600 text-xl mr-2" />
          <h3 className="font-semibold text-gray-800">Trip Duration</h3>
        </div>
        <p className="text-3xl font-bold text-gray-800">
          {durationDays} days
        </p>
        <p className="text-gray-600 text-sm mt-2">
          {group.startDate ? new Date(group.startDate).toLocaleDateString() : 'Not set'} - {group.endDate ? new Date(group.endDate).toLocaleDateString() : 'Not set'}
        </p>
      </div>
    </div>
  );

  const renderItinerary = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <FaCalendarDay className="mr-2 text-blue-500" />
          Day-wise Itinerary
        </h3>
        {isCreator && tripPlan && !editing && (
          <button
            onClick={handleEditPlan}
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <FaEdit className="mr-2" />
            Edit Plan
          </button>
        )}
      </div>
      
      {tripPlan?.itinerary?.length > 0 ? (
        <div className="space-y-6">
          {tripPlan.itinerary.map((day, dayIndex) => (
            <div key={day.day || dayIndex} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">Day {day.day}</h4>
                    {day.date && (
                      <p className="text-gray-600 text-sm">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                      ₹{day.estimatedCost?.toLocaleString() || '0'}
                    </span>
                    {editing && (
                      <input
                        type="number"
                        value={day.estimatedCost || ''}
                        onChange={(e) => updateDayCost(dayIndex, e.target.value)}
                        className="w-24 px-2 py-1 border rounded text-sm"
                        placeholder="Cost"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h5 className="font-semibold text-gray-700 mb-4">Activities Schedule</h5>
                    {day.activities?.length > 0 ? (
                      <div className="space-y-4">
                        {day.activities.map((activity, activityIndex) => (
                          <div key={activityIndex} className="flex items-start">
                            <div className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-lg mr-4 min-w-24">
                              {editing ? (
                                <input
                                  type="text"
                                  value={activity.time || ''}
                                  onChange={(e) => updateActivity(dayIndex, activityIndex, 'time', e.target.value)}
                                  className="w-full bg-transparent"
                                />
                              ) : (
                                activity.time || 'Time'
                              )}
                            </div>
                            <div className="flex-1">
                              {editing ? (
                                <input
                                  type="text"
                                  value={activity.activity || ''}
                                  onChange={(e) => updateActivity(dayIndex, activityIndex, 'activity', e.target.value)}
                                  className="w-full font-medium text-gray-800 border-b mb-1"
                                />
                              ) : (
                                <p className="font-medium text-gray-800">{activity.activity || 'Activity'}</p>
                              )}
                              <p className="text-gray-600 text-sm">
                                Duration: {activity.duration || 'Not specified'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No activities planned for this day</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">Accommodation</h5>
                      <div className="flex items-center">
                        <FaHotel className="text-green-500 mr-2" />
                        <span className="text-gray-800">{day.accommodation || 'Not specified'}</span>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">Meals Included</h5>
                      <div className="flex items-center">
                        <FaUtensils className="text-orange-500 mr-2" />
                        <span className="text-gray-800">{day.meals || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-600">No itinerary available. Generate a trip plan to see details.</p>
        </div>
      )}
    </div>
  );

  const renderRecommendations = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Hotel Recommendations */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaHotel className="mr-2 text-green-500" />
          Hotel Recommendations
        </h3>
        {tripPlan?.recommendations?.hotels?.length > 0 ? (
          <div className="space-y-3">
            {tripPlan.recommendations.hotels.map((hotel, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center mr-3 font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{hotel}</p>
                  <p className="text-gray-600 text-sm">Recommended for groups</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hotel recommendations available</p>
        )}
      </div>

      {/* Travel Recommendations */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaRoute className="mr-2 text-purple-500" />
          Travel Recommendations
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Best Time to Visit</h4>
            <div className="flex items-center">
              {season.icon}
              <span className="ml-2 text-gray-800">{tripPlan?.recommendations?.bestSeason || season.name}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Weather</h4>
            <p className="text-gray-800">{tripPlan?.recommendations?.weather || 'Weather information not available'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Transport</h4>
            <div className="flex items-center">
              {renderTransportIcon(tripPlan?.recommendations?.transport)}
              <span className="ml-2 text-gray-800">{tripPlan?.recommendations?.transport || 'Transport not specified'}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Must Visit Places</h4>
            {tripPlan?.recommendations?.mustVisit?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tripPlan.recommendations.mustVisit.map((place, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {place}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No places recommended yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTravelTips = () => (
    tripPlan?.recommendations?.tips?.length > 0 && (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaStar className="mr-2 text-yellow-500" />
          Travel Tips & Suggestions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tripPlan.recommendations.tips.map((tip, index) => (
            <div key={index} className="flex items-start">
              <div className="w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaLightbulb className="mr-2 text-yellow-500" />
              AI Trip Planner
            </h2>
            <p className="text-gray-600 mt-2">
              Get personalized itinerary, hotel recommendations, and cost estimates based on your group's preferences
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="flex items-center bg-white px-4 py-2 rounded-lg border">
              {season.icon}
              <span className="ml-2 text-gray-700">{season.name} Season</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border">
              <span className="text-gray-700">{groupSize} Travelers</span>
            </div>
          </div>
        </div>
        {tripPlan && !editing && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              ✓ Trip plan loaded. Generate a new one with custom requirements.
            </p>
          </div>
        )}
      </div>

      {/* Custom Prompt Input */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <label className="block text-gray-700 font-medium mb-3">
          Customize your trip plan (optional):
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Include adventure activities, focus on local cuisine, budget-friendly options..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={editing}
          />
          <div className="flex space-x-3">
            {editing ? (
              <>
                <button
                  onClick={handleSavePlan}
                  disabled={saving}
                  className="flex items-center bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600"
                >
                  <FaTimes className="mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={generateNewTripPlan}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : tripPlan ? (
                  'Regenerate Plan'
                ) : (
                  'Generate AI Plan'
                )}
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <FaExclamationCircle className="text-red-500 mr-2 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Trip Plan Display */}
      {loading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Generating your personalized trip plan...</p>
        </div>
      ) : tripPlan ? (
        <div className="space-y-8">
          {/* Cost Summary */}
          {renderCostSummary()}

          {/* Itinerary */}
          {renderItinerary()}

          {/* Recommendations */}
          {renderRecommendations()}

          {/* Travel Tips */}
          {renderTravelTips()}
        </div>
      ) : (
        /* Initial State - No demo data */
        <div className="text-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-dashed border-gray-300">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <FaLightbulb className="text-3xl text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Generate Your AI Trip Plan</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get personalized itinerary, budget estimates, hotel recommendations, and travel tips based on your group size, preferences, and season.
          </p>
          <button
            onClick={generateNewTripPlan}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Smart Itinerary'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AITripPlanner;