// frontend/src/components/Notifications/GroupNotificationDropdown.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaBell, 
  FaEnvelope, 
  FaUserCheck, 
  FaUserTimes,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaEye,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { 
  getGroupNotifications, 
  markGroupNotificationAsRead,
  getUnreadGroupNotificationCount 
} from '../../services/groupNotificationService';

const GroupNotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getGroupNotifications({ limit: 10 });
      
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error loading group notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadGroupNotificationCount();
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markGroupNotificationAsRead(notification._id);
      setNotifications(prev => prev.map(n => 
        n._id === notification._id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    
    setShowDropdown(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'group_invitation':
        return <FaEnvelope className="text-blue-500 text-lg" />;
      case 'invitation_response':
        return <FaUserCheck className="text-green-500 text-lg" />;
      case 'trip_update':
        return <FaCalendarAlt className="text-purple-500 text-lg" />;
      case 'member_update':
        return <FaUsers className="text-orange-500 text-lg" />;
      default:
        return <FaBell className="text-gray-500 text-lg" />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'group_invitation':
        return `Invited to join ${notification.group?.destination || 'a trip'}`;
      case 'invitation_response':
        const status = notification.metadata?.status;
        return `${notification.sender?.name || 'Someone'} ${status} your invitation`;
      default:
        return notification.message;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) {
            loadNotifications();
            loadUnreadCount();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 transform transition-all duration-200">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">Trip Notifications</h3>
                <p className="text-sm text-gray-600">Invitations and trip updates</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={async () => {
                      // Implement mark all as read
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                      setUnreadCount(0);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={loadNotifications}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Refresh"
                >
                  <FaSync className="text-gray-500 text-sm" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FaBell className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No trip notifications yet</p>
                <p className="text-gray-400 text-sm mt-1">Trip invitations and updates will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {getNotificationText(notification)}
                        </p>
                        {notification.group?.destination && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <FaCalendarAlt className="text-gray-400" />
                            <span>{notification.group.destination}</span>
                          </div>
                        )}
                        {notification.actionUrl && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                            <FaExternalLinkAlt className="text-xs" />
                            <span>Click to view</span>
                          </div>
                        )}
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Link
              to="/notifications?tab=group"
              className="block text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
              onClick={() => setShowDropdown(false)}
            >
              View all trip notifications
            </Link>
          </div>
        </div>
      )}

      {/* Backdrop for closing dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default GroupNotificationDropdown;