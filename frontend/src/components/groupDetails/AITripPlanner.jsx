// frontend/src/components/groupDetails/AITripPlanner.jsx
import React, { useState, useEffect } from 'react';
import { generateTripPlan, getTripPlan } from '../../services/tripService';
import { toast } from 'react-toastify';
import Loader from '../common/Loader';
import Button from '../common/Button';

const AITripPlanner = ({ group, isCreator }) => {
  const [tripPlan, setTripPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');

  // Fetch existing trip plan
  const fetchExistingPlan = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTripPlan(group._id);
      
      if (response.success && response.data) {
        setTripPlan(response.data);
      }
    } catch (err) {
      // 404 is expected when no trip plan exists yet
      if (err.message.includes('No trip plan found') || err.message.includes('404')) {
        console.log('No existing trip plan found - this is normal for new groups');
        setTripPlan(null);
      } else {
        console.error('Error fetching trip plan:', err);
        setError(err.message);
        toast.error('Failed to load trip plan');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (group?._id) {
      fetchExistingPlan();
    }
  }, [group?._id]);

  // Generate new trip plan with AI
  const generateNewTripPlan = async () => {
    if (!group?._id) return;
    
    try {
      setGenerating(true);
      setError('');
      
      toast.info('Generating AI trip plan... This may take a moment.');
      
      const response = await generateTripPlan(group._id, prompt);
      
      if (response.success) {
        setTripPlan(response.data);
        toast.success('AI trip plan generated successfully!');
      }
    } catch (err) {
      console.error('Error generating trip plan:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to generate trip plan');
    } finally {
      setGenerating(false);
      setPrompt('');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader size="md" />
        <p className="mt-2 text-gray-600">Loading trip plan...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🗺️ AI Trip Planner
        </h2>
        {tripPlan && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            AI Generated
          </span>
        )}
      </div>

      {/* Show error if any */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* No Trip Plan Found - Show generation UI */}
      {!tripPlan && !loading && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
          <div className="text-5xl mb-4">🧭</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Trip Plan Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Generate an AI-powered trip plan for your group to {group.destination}. 
            Our AI will create a detailed itinerary based on your group's preferences.
          </p>

          {/* Custom Prompt Input */}
          <div className="mb-6 max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Focus on adventure activities and budget-friendly options'"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add specific preferences to customize your trip plan
            </p>
          </div>

          <Button
            onClick={generateNewTripPlan}
            disabled={generating}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold"
          >
            {generating ? (
              <>
                <Loader size="sm" className="mr-2" />
                Generating with AI...
              </>
            ) : (
              <>
                ✨ Generate AI Trip Plan
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Powered by Google Gemini AI
          </p>
        </div>
      )}

      {/* Display Trip Plan */}
      {tripPlan && (
        <div className="space-y-6">
          {/* Trip Overview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Trip Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Destination</p>
                <p className="font-semibold">{tripPlan.destination || group.destination}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">
                  {tripPlan.plan?.durationDays || 
                    Math.ceil((new Date(group.endDate) - new Date(group.startDate)) / 86400000)} days
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Cost</p>
                <p className="font-semibold">
                  ₹{tripPlan.plan?.totalEstimatedCost?.toLocaleString('en-IN') || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Itinerary */}
          {tripPlan.plan?.itinerary && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📅 Daily Itinerary</h3>
              <div className="space-y-4">
                {tripPlan.plan.itinerary.map((day, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg text-gray-800">
                        Day {day.day}: {day.title}
                      </h4>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {formatDate(day.date || group.startDate)}
                      </span>
                    </div>
                    
                    {/* Activities */}
                    {day.activities && day.activities.length > 0 && (
                      <div className="space-y-3">
                        {day.activities.map((activity, actIndex) => (
                          <div key={actIndex} className="flex items-start">
                            <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              {actIndex + 1}
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between items-start">
                                <h5 className="font-medium text-gray-800">{activity.title}</h5>
                                {activity.cost > 0 && (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                    ₹{activity.cost}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
                              <div className="flex items-center text-sm text-gray-500 mt-2">
                                <span className="mr-3">🕐 {activity.time}</span>
                                {activity.duration && (
                                  <span>⏱️ {activity.duration}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Day Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Accommodation</p>
                          <p className="font-medium">{day.accommodation || 'Hotel Booking'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Day Cost</p>
                          <p className="font-medium text-green-600">
                            ₹{day.totalCost?.toLocaleString('en-IN') || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {tripPlan.plan?.recommendations && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-3">🌟 Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tripPlan.plan.recommendations.packing && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">🎒 Packing List</h4>
                    <ul className="list-disc pl-5 text-gray-600">
                      {tripPlan.plan.recommendations.packing.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {tripPlan.plan.recommendations.tips && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">💡 Travel Tips</h4>
                    <ul className="list-disc pl-5 text-gray-600">
                      {tripPlan.plan.recommendations.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regenerate Button */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">
                Generated on {new Date(tripPlan.createdAt).toLocaleDateString('en-IN')}
                {tripPlan.generatedBy?.name && ` by ${tripPlan.generatedBy.name}`}
              </p>
              <p className="text-xs text-gray-500">
                Powered by Google Gemini AI
              </p>
            </div>
            
            {isCreator && (
              <Button
                onClick={() => {
                  setTripPlan(null);
                  setPrompt('');
                }}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Regenerate Plan
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AITripPlanner;