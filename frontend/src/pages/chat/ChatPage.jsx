// frontend/src/pages/chat/ChatPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getMyChats } from '../../services/chatService';
import { getMyGroups } from '../../services/groupService';
import Loader from '../../components/common/Loader';
import { FaComments, FaUserFriends, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';

const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'groups'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch chats
      const chatsData = await getMyChats();
      setChats(chatsData || []);
      
      // Fetch groups
      const groupsData = await getMyGroups();
      setGroups(groupsData || []);
      
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
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
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return 'No messages yet';
    }
    
    const lastMessage = chat.messages[0]; // Already sorted by timestamp desc
    const isOwn = lastMessage.sender?._id === user?._id;
    const prefix = isOwn ? 'You: ' : '';
    
    return `${prefix}${lastMessage.text.substring(0, 50)}${lastMessage.text.length > 50 ? '...' : ''}`;
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
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
        <p className="text-gray-600">Chat with your travel groups</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex items-center px-4 py-3 font-medium text-sm ${
            activeTab === 'chats'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaComments className="mr-2" />
          Chats ({chats.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center px-4 py-3 font-medium text-sm ${
            activeTab === 'groups'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaUserFriends className="mr-2" />
          My Groups ({groups.length})
        </button>
      </div>

      {activeTab === 'chats' ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {chats.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Chats Yet</h2>
              <p className="text-gray-600 mb-6">Join a group to start chatting</p>
              <button 
                onClick={() => navigate('/groups')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Browse Groups
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chats.map((chat) => (
                <Link
                  key={chat._id}
                  to={`/groups/${chat.group?._id}/chat`}
                  className="flex items-center p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {chat.group?.destination?.charAt(0) || 'G'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {chat.group?.destination || 'Group Chat'}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {formatTime(chat.lastActivity || chat.updatedAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2 truncate">
                      {getLastMessage(chat)}
                    </p>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <FaUserFriends className="mr-1" />
                      <span>{chat.participants?.length || 0} members</span>
                      <span className="mx-2">•</span>
                      <span>Last activity: {formatTime(chat.lastActivity)}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <FaArrowRight className="text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 truncate">{group.destination}</h3>
                  {group.createdBy?._id === user?._id && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      Your Group
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-500 text-sm">
                    <FaCalendarAlt className="mr-2" />
                    <span>
                      {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <FaUserFriends className="mr-2" />
                    <span>
                      {group.currentMembers?.filter(m => m.status === 'approved').length || 0}/{group.maxMembers} members
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/groups/${group._id}`)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => navigate(`/groups/${group._id}/chat`)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                  >
                    Go to Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatPage;