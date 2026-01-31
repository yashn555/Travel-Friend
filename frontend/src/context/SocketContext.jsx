// SocketContext.jsx - UPDATED
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getWebSocketUrl } from '../services/api'; // Import the helper function

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Use the helper function from api.js to get correct WebSocket URL
    const socketUrl = getWebSocketUrl();
    
    console.log('🔌 Connecting WebSocket to:', socketUrl);
    console.log('🌍 Environment:', process.env.NODE_ENV);

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      // Set secure flag based on protocol
      secure: socketUrl.startsWith('wss://'),
      auth: (cb) => {
        try {
          const token = localStorage.getItem('token');
          cb({ token: token || '' });
        } catch (error) {
          console.error('Auth error:', error);
          cb({ token: '' });
        }
      }
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setIsConnected(false);
      
      // If it's a WebSocket error, try fallback to polling
      if (error.message.includes('websocket error')) {
        console.log('🔄 Trying to reconnect with polling transport...');
        setTimeout(() => {
          newSocket.io.opts.transports = ['polling'];
          newSocket.connect();
        }, 1000);
      }
    });

    // Reconnection events
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection failed:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌❌ All reconnection attempts failed');
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
    };
  }, []);

  // Function to join a group room
  const joinGroupRoom = (groupId) => {
    if (socket && groupId) {
      socket.emit('join-group', groupId);
      console.log(`👥 Joined group room: ${groupId}`);
    }
  };

  // Function to leave a group room
  const leaveGroupRoom = (groupId) => {
    if (socket && groupId) {
      socket.emit('leave-group', groupId);
      console.log(`👋 Left group room: ${groupId}`);
    }
  };

  // Function to send message
  const sendMessage = (groupId, message) => {
    if (socket && groupId && message) {
      socket.emit('send-message', { groupId, message });
    }
  };

  // Function to send typing indicator
  const sendTyping = (groupId, userId, isTyping) => {
    if (socket && groupId) {
      socket.emit('typing', { groupId, userId, isTyping });
    }
  };

  const value = {
    socket,
    isConnected,
    joinGroupRoom,
    leaveGroupRoom,
    sendMessage,
    sendTyping,
    on: socket ? socket.on.bind(socket) : () => {},
    off: socket ? socket.off.bind(socket) : () => {},
    emit: socket ? socket.emit.bind(socket) : () => {}
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};