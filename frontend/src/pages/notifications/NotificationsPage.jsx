// frontend/src/pages/notifications/NotificationsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getCurrentUser } from '../../services/authService';
import Loader from '../../components/common/Loader';
import { 
  FaBell, 
  FaEnvelope, 
  FaUserPlus, 
  FaCheckCircle, 
  FaTimesCircle,
  FaCalendarAlt,
  FaUsers,
  FaExclamationCircle
} from 'react-icons/fa';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get user with notifications
      const userData = await getCurrentUser();
      
      if (userData && userData.user && userData.user.notifications) {
        // Sort notifications by createdAt (newest first)
        const sortedNotifications = [...userData.user.notifications].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);
      } else {
        setNotifications([]);
      }
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'join_request':
        return <FaUserPlus className="text-blue-500 text-lg" />;
      case 'trip_update':
        return <FaCalendarAlt className="text-green-500 text-lg" />;
      case 'message':
        return <FaEnvelope className="text-purple-500 text-lg" />;
      case 'system':
        return <FaBell className="text-yellow-500 text-lg" />;
      default:
        return <FaExclamationCircle className="text-gray-500 text-lg" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'join_request':
        return 'bg-blue-50 border-blue-100';
      case 'trip_update':
        return 'bg-green-50 border-green-100';
      case 'message':
        return 'bg-purple-50 border-purple-100';
      case 'system':
        return 'bg-yellow-50 border-yellow-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60 * 1000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }
    
    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
        <span className="ml-3 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600">Stay updated with your travel activities</p>
        </div>
        
        {unreadCount > 0 && (
          <div className="flex items-center space-x-4">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
            <button 
              onClick={markAllAsRead}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
            >
              Mark All as Read
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Notifications</h2>
            <p className="text-gray-600">You're all caught up!</p>
            <div className="mt-6">
              <button 
                onClick={() => navigate('/groups')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Browse Groups
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification._id || notification.createdAt}
                className={`p-6 transition-colors ${!notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {notification.title || 'Notification'}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">
                      {notification.message}
                    </p>
                    
                    {/* Action Buttons based on notification type */}
                    <div className="flex items-center space-x-3">
                      {notification.type === 'join_request' && (
                        <button 
                          onClick={() => navigate('/group-requests')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                        >
                          View Requests
                        </button>
                      )}
                      
                      {notification.type === 'trip_update' && notification.message?.includes('approved') && (
                        <button 
                          onClick={() => navigate('/my-groups')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                        >
                          View My Groups
                        </button>
                      )}
                      
                      {notification.type === 'message' && (
                        <button 
                          onClick={() => navigate('/chat')}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
                        >
                          Go to Messages
                        </button>
                      )}
                      
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notification.type === 'join_request' ? 'bg-blue-100 text-blue-800' :
                        notification.type === 'trip_update' ? 'bg-green-100 text-green-800' :
                        notification.type === 'message' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.type === 'join_request' ? 'Join Request' :
                         notification.type === 'trip_update' ? 'Trip Update' :
                         notification.type === 'message' ? 'Message' : 'System'}
                      </span>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="ml-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Stats */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FaBell className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <FaBell className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{unreadCount}</p>
                <p className="text-sm text-gray-500">Unread</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <FaUserPlus className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {notifications.filter(n => n.type === 'join_request').length}
                </p>
                <p className="text-sm text-gray-500">Join Requests</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <FaEnvelope className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {notifications.filter(n => n.type === 'message').length}
                </p>
                <p className="text-sm text-gray-500">Messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;