import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  getPrivateChatById, 
  getPrivateMessages, 
  sendPrivateMessage, 
  markMessagesAsRead,
  deletePrivateChat 
} from '../../services/privateChatService';
import { FaPaperPlane, FaArrowLeft, FaTrash, FaUserCircle } from 'react-icons/fa';
import { IoIosSend } from 'react-icons/io';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';

const PrivateChatRoom = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Get other user from location state or chat data
  const otherUser = location.state?.otherUser;

  useEffect(() => {
    fetchChatData();
    // Mark messages as read when opening chat
    markMessagesAsRead(chatId).catch(console.error);
  }, [chatId]);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      const [chatData, messagesData] = await Promise.all([
        getPrivateChatById(chatId),
        getPrivateMessages(chatId)
      ]);
      
      setChat(chatData);
      setMessages(messagesData.messages);
      setHasMore(messagesData.page < messagesData.totalPages);
    } catch (error) {
      console.error('Error fetching chat data:', error);
      toast.error('Failed to load chat');
      navigate('/private-chat');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || loading) return;
    
    try {
      const nextPage = page + 1;
      const messagesData = await getPrivateMessages(chatId, nextPage);
      
      setMessages(prev => [...messagesData.messages, ...prev]);
      setPage(nextPage);
      setHasMore(nextPage < messagesData.totalPages);
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    
    try {
      setSending(true);
      const sentMessage = await sendPrivateMessage(chatId, newMessage);
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async () => {
    if (window.confirm('Are you sure you want to delete this chat? All messages will be lost.')) {
      try {
        await deletePrivateChat(chatId);
        toast.success('Chat deleted');
        navigate('/private-chat');
      } catch (error) {
        console.error('Error deleting chat:', error);
        toast.error('Failed to delete chat');
      }
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
        <span className="ml-3 text-gray-600">Loading chat...</span>
      </div>
    );
  }

  const displayUser = chat?.otherParticipant || otherUser;

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/private-chat')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          
          {displayUser?.profileImage && displayUser.profileImage !== 'default-profile.jpg' ? (
            <img
              src={`http://localhost:5000/uploads/profiles/${displayUser.profileImage}`}
              alt={displayUser.name}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
              {displayUser?.name?.charAt(0) || 'U'}
            </div>
          )}
          
          <div>
            <h2 className="font-semibold text-gray-800">{displayUser?.name || 'User'}</h2>
            <p className="text-sm text-gray-500">
              {displayUser?.city && `${displayUser.city}, `}{displayUser?.state}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDeleteChat}
          className="p-2 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg"
          title="Delete chat"
        >
          <FaTrash />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMoreMessages}
              className="text-sm text-blue-500 hover:text-blue-600"
              disabled={loading}
            >
              Load older messages
            </button>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((message, index) => {
            const showDate = index === 0 || 
              new Date(message.createdAt).toDateString() !== 
              new Date(messages[index - 1].createdAt).toDateString();
            
            return (
              <React.Fragment key={message._id}>
                {showDate && (
                  <div className="text-center my-6">
                    <span className="bg-gray-200 text-gray-700 px-4 py-1 rounded-full text-sm">
                      {formatMessageDate(message.createdAt)}
                    </span>
                  </div>
                )}
                
                <div className={`flex ${message.sender?._id === displayUser?._id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] ${message.sender?._id === displayUser?._id ? 'bg-white' : 'bg-blue-500 text-white'} rounded-2xl px-4 py-2 shadow`}>
                    <div className="flex items-start">
                      {message.sender?._id === displayUser?._id && (
                        <div className="mr-2 mt-1">
                          {message.sender?.profileImage && message.sender.profileImage !== 'default-profile.jpg' ? (
                            <img
                              src={`http://localhost:5000/uploads/profiles/${message.sender.profileImage}`}
                              alt={message.sender.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                              {message.sender?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm">{message.text}</p>
                        <div className={`text-xs mt-1 ${message.sender?._id === displayUser?._id ? 'text-gray-500' : 'text-blue-100'}`}>
                          {formatMessageTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`px-6 py-3 rounded-r-lg font-medium flex items-center ${
              !newMessage.trim() || sending
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <IoIosSend className="text-xl" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrivateChatRoom;