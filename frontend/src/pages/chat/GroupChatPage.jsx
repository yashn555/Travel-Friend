// frontend/src/pages/chat/GroupChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // FIXED: Added useParams
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getGroupChat, sendMessage } from '../../services/chatService';
import { getGroupById } from '../../services/groupService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const GroupChatPage = () => {
  const { id } = useParams(); // FIXED: Changed from groupId to id
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [chat, setChat] = useState(null);
  const [group, setGroup] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Validate groupId (now called id)
    if (!id || id === 'undefined') {
      toast.error('Invalid group ID');
      navigate('/my-groups');
      return;
    }

    console.log('🔍 GroupChatPage mounted with id:', id);
    console.log('🔍 Current URL:', window.location.href);
    
    fetchChatData();
  }, [id, navigate]); // FIXED: Changed dependency from groupId to id

  const fetchChatData = async () => {
    try {
      setLoading(true);
      
      // Validate id
      if (!id || id === 'undefined') {
        toast.error('Invalid group ID');
        navigate('/my-groups');
        return;
      }

      console.log('🔍 Fetching chat data for group:', id);
      console.log('👤 Current user:', user);
      
      // Fetch group details first
      const groupData = await getGroupById(id);
      setGroup(groupData);
      
      // Check if user is a member
      const isMember = groupData.currentMembers?.some(member => {
        // Check both possible ID locations
        const memberUserId = member.user?._id || member.user;
        const currentUserId = user?._id || user?.id;
        
        console.log(`Checking member: ${memberUserId} vs user: ${currentUserId}`);
        return memberUserId === currentUserId && member.status === 'approved';
      });
      
      console.log(`Is user member? ${isMember}`);
      
      if (!isMember) {
        console.log('❌ User is not a member, redirecting...');
        toast.error('You must be a member of the group to access the chat');
        navigate(`/groups/${id}`);
        return;
      }
      
      // Fetch chat
      console.log('✅ User is member, fetching chat...');
      const chatData = await getGroupChat(id);
      setChat(chatData);
      
    } catch (error) {
      console.error('❌ Error fetching chat:', error);
      console.error('Error response:', error.response?.data);
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
      
      // Refresh chat
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
        <span className="ml-3 text-gray-600">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/groups/${id}`)}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {group?.destination} - Group Chat
            </h1>
            <p className="text-gray-600">
              {group?.currentMembersCount || 0} members
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => navigate(`/groups/${id}`)}
          className="bg-gray-500 hover:bg-gray-600"
        >
          Group Details
        </Button>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Chat Messages */}
        <div className="h-[500px] overflow-y-auto p-4">
          {chat?.messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chat?.messages?.map((msg, index) => {
                const isSystemMessage = msg.isSystemMessage;
                const isOwnMessage = msg.sender?._id === user?._id;
                
                if (isSystemMessage) {
                  return (
                    <div key={index} className="text-center">
                      <span className="inline-block bg-gray-100 text-gray-600 text-sm px-4 py-1 rounded-full">
                        {msg.text}
                      </span>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={index}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="font-semibold text-sm mb-1">
                          {msg.sender?.name || 'Unknown User'}
                        </p>
                      )}
                      <p className="break-words">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={sending || !message.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>

      {/* Participants */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Participants</h3>
        <div className="flex flex-wrap gap-3">
          {group?.currentMembers?.map((member, index) => (
            <div
              key={index}
              className="flex items-center bg-gray-50 px-3 py-2 rounded-lg"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-blue-600 font-semibold">
                  {member.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium">{member.user?.name}</p>
                <p className="text-xs text-gray-500">
                  {member.role === 'creator' ? 'Group Admin' : 'Member'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupChatPage;