// frontend/src/pages/chat/GroupChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getGroupChat, sendMessage } from '../../services/chatService';
import { getGroupById } from '../../services/groupService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const GroupChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [chat, setChat] = useState(null);
  const [group, setGroup] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showTripIdeaModal, setShowTripIdeaModal] = useState(false);
  const [tripIdeaData, setTripIdeaData] = useState({
    startingPoint: '',
    destination: '',
    travelMedium: '',
    placesToExplore: '',
    activities: '',
    estimatedDate: ''
  });
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [activeTravelMedium, setActiveTravelMedium] = useState('');
  
  const messagesEndRef = useRef(null);
  const hasShownModal = useRef(false);
  const startingPointRef = useRef(null);

  useEffect(() => {
    if (!id || id === 'undefined') {
      toast.error('Invalid group ID');
      navigate('/my-groups');
      return;
    }

    fetchChatData();
  }, [id, navigate]);

  useEffect(() => {
    const hasSubmittedTripIdea = localStorage.getItem(`tripIdeaSubmitted_${id}_${user?._id}`);
    
    if (chat && !loading && !hasSubmittedTripIdea && !hasShownModal.current) {
      const timer = setTimeout(() => {
        setShowTripIdeaModal(true);
        hasShownModal.current = true;
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [chat, loading, id, user?._id]);

  useEffect(() => {
    if (showTripIdeaModal && startingPointRef.current) {
      setTimeout(() => {
        startingPointRef.current?.focus();
      }, 300);
    }
  }, [showTripIdeaModal]);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      
      if (!id || id === 'undefined') {
        toast.error('Invalid group ID');
        navigate('/my-groups');
        return;
      }
      
      const groupData = await getGroupById(id);
      setGroup(groupData);
      
      const isMember = groupData.currentMembers?.some(member => {
        const memberUserId = member.user?._id || member.user;
        const currentUserId = user?._id || user?.id;
        return memberUserId === currentUserId && member.status === 'approved';
      });
      
      if (!isMember) {
        toast.error('You must be a member of the group to access the chat');
        navigate(`/groups/${id}`);
        return;
      }
      
      const chatData = await getGroupChat(id);
      setChat(chatData);
      
    } catch (error) {
      console.error('❌ Error fetching chat:', error);
      toast.error(error.response?.data?.message || 'Failed to load chat');
      navigate(`/groups/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      setSending(true);
      await sendMessage(id, message);
      
      const chatData = await getGroupChat(id);
      setChat(chatData);
      setMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSubmitTripIdea = async () => {
    try {
      setSending(true);
      
      // Format the trip idea message with emojis and proper formatting
      const tripIdeaMessage = `
🎯 *Trip Idea from ${user?.name || 'A member'}*

📍 **Starting Point:** ${tripIdeaData.startingPoint || 'To be decided'}
🗺️ **Destination:** ${tripIdeaData.destination || 'To be discussed'}
🚗 **Travel Mode:** ${tripIdeaData.travelMedium || 'Flexible'}
🏞️ **Places to Explore:** ${tripIdeaData.placesToExplore || 'Open to suggestions'}
🎭 **Activities:** ${tripIdeaData.activities || 'All types welcome'}
📅 **Timeline:** ${tripIdeaData.estimatedDate || 'Flexible dates'}

💡 *What do you think about this plan? Any suggestions or alternative ideas?*
      `.trim();

      await sendMessage(id, tripIdeaMessage);
      
      localStorage.setItem(`tripIdeaSubmitted_${id}_${user?._id}`, 'true');
      
      setShowTripIdeaModal(false);
      const chatData = await getGroupChat(id);
      setChat(chatData);
      
      toast.success('🎉 Your trip idea has been shared with the group!');
      
    } catch (error) {
      console.error('Error sharing trip idea:', error);
      toast.error('Failed to share trip idea');
    } finally {
      setSending(false);
      setTripIdeaData({
        startingPoint: '',
        destination: '',
        travelMedium: '',
        placesToExplore: '',
        activities: '',
        estimatedDate: ''
      });
    }
  };

  const handleSkipTripIdea = () => {
    if (showSkipConfirm) {
      localStorage.setItem(`tripIdeaSubmitted_${id}_${user?._id}`, 'skipped');
      setShowTripIdeaModal(false);
      setShowSkipConfirm(false);
      toast.info("💭 You can share your trip ideas anytime using the 'Share Trip Idea' button!");
    } else {
      setShowSkipConfirm(true);
    }
  };

  const handleTravelMediumClick = (medium) => {
    setTripIdeaData(prev => ({ ...prev, travelMedium: medium }));
    setActiveTravelMedium(medium);
  };

  const handleActivityClick = (activity) => {
    const currentActivities = tripIdeaData.activities.split(', ').filter(a => a);
    
    if (currentActivities.includes(activity)) {
      // Remove activity
      setTripIdeaData(prev => ({
        ...prev,
        activities: currentActivities.filter(a => a !== activity).join(', ')
      }));
    } else {
      // Add activity
      setTripIdeaData(prev => ({
        ...prev,
        activities: [...currentActivities, activity].join(', ')
      }));
    }
  };

  const travelMediumOptions = [
    { emoji: '🚗', label: 'Car', value: 'Car' },
    { emoji: '🏍️', label: 'Bike', value: 'Bike' },
    { emoji: '🚂', label: 'Train', value: 'Train' },
    { emoji: '✈️', label: 'Plane', value: 'Plane' },
    { emoji: '🚌', label: 'Bus', value: 'Bus' },
    { emoji: '🚲', label: 'Bicycle', value: 'Bicycle' },
    { emoji: '🚶', label: 'Walking', value: 'Walking' },
    { emoji: '🔄', label: 'Mixed', value: 'Mixed Transport' }
  ];

  const activitySuggestions = [
    { emoji: '👀', label: 'Sightseeing', value: 'Sightseeing' },
    { emoji: '🪂', label: 'Adventure', value: 'Adventure Sports' },
    { emoji: '🍜', label: 'Food Tour', value: 'Food Tour' },
    { emoji: '📸', label: 'Photography', value: 'Photography' },
    { emoji: '🛍️', label: 'Shopping', value: 'Shopping' },
    { emoji: '⛺', label: 'Camping', value: 'Camping' },
    { emoji: '🥾', label: 'Hiking', value: 'Hiking' },
    { emoji: '🏛️', label: 'Cultural', value: 'Cultural Visit' },
    { emoji: '🏖️', label: 'Beach', value: 'Beach Activities' },
    { emoji: '🎉', label: 'Nightlife', value: 'Nightlife' }
  ];

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose}
          />
          
          <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-gray-200 animate-slideUp">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <span className="text-xl">✨</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-600">Help plan the perfect trip with your group</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-2xl text-gray-500 hover:text-gray-700">×</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TripIdeaForm = () => (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-lg text-blue-600">💡</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Share your travel preferences</p>
            <p className="text-sm text-blue-600 mt-1">
              This helps coordinate better. All fields are optional!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Starting Point */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <span className="p-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
              <span className="text-lg">📍</span>
            </span>
            <span>Exact Starting Point</span>
          </label>
          <input
            ref={startingPointRef}
            type="text"
            placeholder="e.g., Domino's at Times Square, Central Station Gate 3, Airport Terminal 2"
            value={tripIdeaData.startingPoint}
            onChange={(e) => setTripIdeaData({...tripIdeaData, startingPoint: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <span className="p-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
              <span className="text-lg">🏁</span>
            </span>
            <span>Destination / Stop Points</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Goa beaches, Manali hills, Paris landmarks, Multiple city tour"
            value={tripIdeaData.destination}
            onChange={(e) => setTripIdeaData({...tripIdeaData, destination: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-all placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>

        {/* Travel Medium */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <span className="p-1.5 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg">
              <span className="text-lg">🚗</span>
            </span>
            <span>Preferred Travel Medium</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {travelMediumOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleTravelMediumClick(option.value)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  tripIdeaData.travelMedium === option.value
                    ? 'border-blue-400 bg-blue-50 scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type your preferred mode..."
            value={!travelMediumOptions.some(opt => opt.value === tripIdeaData.travelMedium) ? tripIdeaData.travelMedium : ''}
            onChange={(e) => setTripIdeaData({...tripIdeaData, travelMedium: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>

        {/* Places to Explore */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <span className="p-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg">
              <span className="text-lg">🗺️</span>
            </span>
            <span>Places You Want to Explore</span>
          </label>
          <textarea
            placeholder="Mention specific spots: Eiffel Tower, local markets, mountain trails, beach sunset points, historic sites..."
            value={tripIdeaData.placesToExplore}
            onChange={(e) => setTripIdeaData({...tripIdeaData, placesToExplore: e.target.value})}
            rows="2"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 resize-none"
          />
        </div>

        {/* Activities */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <span className="p-1.5 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg">
              <span className="text-lg">🎭</span>
            </span>
            <span>Activities You're Interested In</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {activitySuggestions.map((activity) => (
              <button
                key={activity.value}
                type="button"
                onClick={() => handleActivityClick(activity.value)}
                className={`inline-flex items-center px-3 py-2 rounded-lg border transition-all ${
                  tripIdeaData.activities.includes(activity.value)
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{activity.emoji}</span>
                <span className="text-sm">{activity.label}</span>
              </button>
            ))}
          </div>
          <textarea
            placeholder="Add more activities or describe your interests..."
            value={tripIdeaData.activities}
            onChange={(e) => setTripIdeaData({...tripIdeaData, activities: e.target.value})}
            rows="2"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 resize-none"
          />
        </div>

        {/* Estimated Date */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <span className="p-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg">
              <span className="text-lg">📅</span>
            </span>
            <span>Estimated Travel Date</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Next weekend, December 25-30, Summer 2024, Flexible dates"
            value={tripIdeaData.estimatedDate}
            onChange={(e) => setTripIdeaData({...tripIdeaData, estimatedDate: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition-all placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>
      </div>

      {/* Modal Actions */}
      <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
        {showSkipConfirm ? (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-start space-x-3">
              <span className="text-xl">🤔</span>
              <div className="flex-1">
                <p className="font-medium text-amber-800">Skip sharing trip ideas?</p>
                <p className="text-sm text-amber-600 mt-1">
                  You can always share your ideas later using the "Share Trip Idea" button.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleSkipTripIdea}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-lg hover:from-gray-300 hover:to-gray-400 transition-all"
              >
                Skip Anyway
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSkipTripIdea}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <span>⏭️</span>
              <span>Skip for now</span>
            </button>
            <button
              onClick={handleSubmitTripIdea}
              disabled={sending}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Share with Group</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative">
          <Loader size="lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">✈️</span>
          </div>
        </div>
        <span className="mt-4 text-gray-600 font-medium">Loading group chat...</span>
      </div>
    );
  }

  return (
    <>
      {/* Trip Idea Modal */}
      <Modal
        isOpen={showTripIdeaModal}
        onClose={() => setShowTripIdeaModal(false)}
        title="Plan Your Journey"
      >
        <TripIdeaForm />
      </Modal>

      {/* Main Chat Page */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/groups/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
              >
                <span className="text-xl text-gray-500 group-hover:text-gray-700 transition-colors">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                  <span className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                    <span className="text-lg">💬</span>
                  </span>
                  <span>{group?.destination} Group Chat</span>
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    👥 {group?.currentMembersCount || 0} members
                  </span>
                  <span className="text-sm text-gray-600 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 rounded-full">
                    ✨ Plan your trip together
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowTripIdeaModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center space-x-2 group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
                <span>Share Trip Idea</span>
              </button>
              <Button
                onClick={() => navigate(`/groups/${id}`)}
                className="px-5 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-xl transition-all shadow-lg"
              >
                View Group Details
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Chat Messages */}
          <div className="h-[500px] overflow-y-auto p-6 bg-gradient-to-b from-gray-50/50 to-white">
            {chat?.messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">💭</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-xl">✨</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No messages yet</h3>
                <p className="text-gray-500 mb-6">Be the first to start the conversation!</p>
                <button
                  onClick={() => setShowTripIdeaModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>Share your trip idea</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {chat?.messages?.map((msg, index) => {
                  const isSystemMessage = msg.isSystemMessage;
                  const isOwnMessage = msg.sender?._id === user?._id;
                  const isTripIdea = msg.text?.includes("Trip Idea") || msg.text?.includes("🎯");
                  
                  if (isSystemMessage) {
                    return (
                      <div key={index} className="text-center">
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-sm rounded-full">
                          <span className="mr-2">🔔</span>
                          {msg.text}
                        </div>
                      </div>
                    );
                  }
                  
                  if (isTripIdea) {
                    return (
                      <div key={index} className="relative">
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-xs text-white">✨</span>
                        </div>
                        <div className="ml-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-100 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                                <span className="text-lg">🎯</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800">Trip Idea Shared</h4>
                                <p className="text-xs text-gray-500">
                                  by {msg.sender?.name || 'Anonymous'} • {formatTime(msg.timestamp)}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-medium px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full">
                              PLAN
                            </span>
                          </div>
                          
                          <div className="bg-white rounded-xl p-4 mb-4 whitespace-pre-line text-gray-700 leading-relaxed border border-gray-100">
                            {msg.text}
                          </div>
                          
                          <div className="border-t border-green-200 pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <span className="mr-2">💡</span>
                              What do you think about this plan? Any suggestions?
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setMessage(`👍 I love this plan! ${msg.sender?.name ? '@' + msg.sender.name : ''}`)}
                                className="px-4 py-2 text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 font-medium rounded-lg hover:from-green-200 hover:to-emerald-200 transition-all flex items-center space-x-2"
                              >
                                <span>👍</span>
                                <span>Love this plan</span>
                              </button>
                              <button
                                onClick={() => setMessage(`💡 I have another suggestion... ${msg.sender?.name ? '@' + msg.sender.name : ''}`)}
                                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 font-medium rounded-lg hover:from-blue-200 hover:to-indigo-200 transition-all flex items-center space-x-2"
                              >
                                <span>💡</span>
                                <span>Suggest alternative</span>
                              </button>
                              <button
                                onClick={() => setMessage(`❓ I have a question about this... ${msg.sender?.name ? '@' + msg.sender.name : ''}`)}
                                className="px-4 py-2 text-sm bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 font-medium rounded-lg hover:from-amber-200 hover:to-orange-200 transition-all flex items-center space-x-2"
                              >
                                <span>❓</span>
                                <span>Ask question</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className="max-w-xl">
                        {!isOwnMessage && (
                          <div className="flex items-center space-x-2 mb-1 ml-1">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {msg.sender?.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {msg.sender?.name || 'Unknown User'}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-2xl p-4 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-lg'
                              : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-bl-lg border border-gray-200'
                          } shadow-sm`}
                        >
                          <p className="break-words leading-relaxed">{msg.text}</p>
                          <div className={`flex justify-end mt-2 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                            <span className="text-xs">{formatTime(msg.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here... Share your thoughts, ideas, or respond to trip plans!"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 bg-white shadow-sm"
                  disabled={sending}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setMessage(message + '👍')}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    👍
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage(message + '😊')}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    😊
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage(message + '🎉')}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    🎉
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={sending || !message.trim()}
                className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 flex items-center space-x-2"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>Send</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Participants */}
        <div className="mt-8 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                  <span className="text-lg">👥</span>
                </span>
                <span>Trip Companions</span>
              </h3>
              <p className="text-gray-600 mt-1">Your fellow travelers in this journey</p>
            </div>
            <button
              onClick={() => setShowTripIdeaModal(true)}
              className="px-4 py-2.5 text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 font-medium rounded-lg hover:from-green-200 hover:to-emerald-200 transition-all flex items-center space-x-2"
            >
              <span>✨</span>
              <span>Share Your Trip Idea</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group?.currentMembers?.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md group"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">
                        {member.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    {member.role === 'creator' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">👑</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                        {member.user?.name}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        member.role === 'creator' 
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700'
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700'
                      }`}>
                        {member.role === 'creator' ? 'Group Admin' : 'Member'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {member.role === 'creator' ? 'Trip Organizer' : 'Travel Buddy'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default GroupChatPage;