import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyPrivateChats } from '../../services/privateChatService';
import { FaComment, FaUserCircle, FaClock, FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';

const PrivateChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const data = await getMyPrivateChats();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChats();
    toast.info('Refreshing chats...');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // If less than 24 hours, show time
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If less than 7 days, show day
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
        <span className="ml-3 text-gray-600">Loading chats...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Private Messages</h1>
          <p className="text-gray-600">Chat with users who follow you back</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center"
        >
          <FaClock className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-6 opacity-50">💬</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">No Private Chats Yet</h2>
          <p className="text-gray-600 mb-8">
            Start chatting with users who follow you back. Visit profiles and follow each other to unlock messaging.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium"
          >
            Browse Users
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {chats.map((chat) => (
            <Link
              key={chat._id}
              to={`/private-chat/${chat._id}`}
              className="flex items-center p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0"
            >
              <div className="flex-shrink-0 mr-4 relative">
                {chat.otherParticipant?.profileImage && chat.otherParticipant.profileImage !== 'default-profile.jpg' ? (
                  <img
                    src={`http://localhost:5000/uploads/profiles/${chat.otherParticipant.profileImage}`}
                    alt={chat.otherParticipant.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {chat.otherParticipant?.name?.charAt(0) || 'U'}
                  </div>
                )}
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {chat.otherParticipant?.name || 'User'}
                  </h3>
                  <span className="text-sm text-gray-500 flex items-center">
                    <FaClock className="mr-1" />
                    {formatTime(chat.updatedAt)}
                  </span>
                </div>
                
                {chat.lastMessage ? (
                  <div className="text-gray-600">
                    <p className="truncate">
                      <span className="font-medium">
                        {chat.lastMessage.sender?._id === chat.otherParticipant?._id ? '' : 'You: '}
                      </span>
                      {chat.lastMessage.text}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No messages yet</p>
                )}
              </div>
              
              <div className="ml-4">
                <FaEllipsisV className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrivateChatList;