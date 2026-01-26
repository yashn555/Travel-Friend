// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  BellIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { 
  BellIcon as BellIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hideRead, setHideRead] = useState(true); // Toggle to hide/show read notifications
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications');
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await api.put(`/api/notifications/${notification._id}/read`);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      }

      // Handle navigation based on notification type
      switch (notification.type) {
        case 'group_invitation':
          if (notification.data?.invitationId) {
            navigate(`/invitations/${notification.data.invitationId}`);
          } else if (notification.data?.groupId) {
            navigate(`/groups/${notification.data.groupId}`);
          }
          break;
          
        case 'join_request':
          navigate('/group-requests');
          break;
          
        case 'group_join':
        case 'trip_update':
          if (notification.data?.groupId) {
            navigate(`/groups/${notification.data.groupId}`);
          }
          break;
          
        case 'chat_message':
          if (notification.data?.chatId) {
            navigate(`/chat/${notification.data.chatId}`);
          }
          break;
          
        default:
          // Default fallback
          break;
      }

      setShowDropdown(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    
    try {
      await api.delete('/api/notifications/clear-all');
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'group_invitation':
        return <UserGroupIcon className="h-5 w-5 text-purple-500" />;
      case 'join_request':
        return <EnvelopeIcon className="h-5 w-5 text-blue-500" />;
      case 'group_join':
        return <UserGroupIcon className="h-5 w-5 text-green-500" />;
      case 'trip_update':
        return <CalendarIcon className="h-5 w-5 text-orange-500" />;
      case 'chat_message':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-teal-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return created.toLocaleDateString();
  };

  // Filter notifications based on hideRead setting
  const filteredNotifications = hideRead 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none transition-colors duration-200"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6 text-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                <p className="text-sm text-gray-600">
                  {unreadCount} unread • {notifications.length} total
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-full transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Toggle for hiding read notifications */}
          {notifications.some(n => n.read) && (
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideRead}
                  onChange={() => setHideRead(!hideRead)}
                  className="sr-only"
                />
                <div className={`relative w-10 h-5 rounded-full transition-colors ${hideRead ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${hideRead ? 'translate-x-5' : ''}`} />
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {hideRead ? 'Showing unread only' : 'Showing all'}
                </span>
              </label>
            </div>
          )}
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-gray-400 text-sm mt-1">
                  {hideRead ? 'All notifications are read' : 'You have no notifications'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-semibold text-sm truncate ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                          )}
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {getNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {/* Notification type badge */}
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          notification.type === 'group_invitation' 
                            ? 'bg-purple-100 text-purple-800'
                            : notification.type === 'join_request'
                            ? 'bg-blue-100 text-blue-800'
                            : notification.type === 'group_join'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Read status indicator */}
                    {notification.read && (
                      <CheckCircleIcon className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setShowDropdown(false);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all notifications
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-gray-500 hover:text-red-600 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;