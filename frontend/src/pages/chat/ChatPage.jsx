// frontend/src/pages/chat/ChatPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getMyChats } from '../../services/chatService';
import { getMyGroups } from '../../services/groupService';
import Loader from '../../components/common/Loader';

const ChatPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatsAndGroups();
  }, []);

  const fetchChatsAndGroups = async () => {
    try {
      setLoading(true);
      
      // Fetch user's chats
      const chatsData = await getMyChats();
      setChats(chatsData || []);
      
      // Fetch user's groups for creating new chats
      const groupsData = await getMyGroups();
      setGroups(groupsData || []);
      
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Group Chats</h1>
        <p className="text-gray-600">Chat with your travel group members</p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Groups Yet</h2>
          <p className="text-gray-600 mb-6">Join or create a group to start chatting</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/create-trip"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create a Group
            </Link>
            <Link
              to="/groups"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Browse Groups
            </Link>
          </div>
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Chats</h2>
          <p className="text-gray-600 mb-4">Select a group below to start chatting</p>
          
          <div className="max-w-md mx-auto">
            <h3 className="font-medium text-gray-700 mb-3">Your Groups</h3>
            <div className="space-y-3">
              {groups.map(group => (
                <Link
                  key={group._id}
                  to={`/groups/${group._id}/chat`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-800">{group.destination}</h4>
                      <p className="text-sm text-gray-500">
                        {group.currentMembers?.filter(m => m.status === 'approved').length || 0} members
                      </p>
                    </div>
                    <span className="text-blue-500">Start Chat →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Chats */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Active Chats</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {chats.map(chat => (
                  <Link
                    key={chat._id}
                    to={`/groups/${chat.group._id}/chat`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{chat.group.destination}</h3>
                        {chat.messages && chat.messages.length > 0 ? (
                          <>
                            <p className="text-gray-600 text-sm truncate">
                              {chat.messages[0].sender?.name}: {chat.messages[0].text}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {new Date(chat.lastActivity).toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500 text-sm">No messages yet</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {chat.participants?.length || 0} members
                        </span>
                        <span className="text-blue-500">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* All Groups */}
          <div>
            <div className="bg-white rounded-lg shadow sticky top-4">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Your Groups</h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {groups.map(group => {
                    const hasChat = chats.some(chat => chat.group._id === group._id);
                    return (
                      <Link
                        key={group._id}
                        to={`/groups/${group._id}/chat`}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium text-gray-800">{group.destination}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {hasChat ? (
                          <span className="text-green-500 text-sm">Active</span>
                        ) : (
                          <span className="text-blue-500 text-sm">Start</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link
                    to="/create-trip"
                    className="block text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Create New Group
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;