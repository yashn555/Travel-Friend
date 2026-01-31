import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
  // Use socket URL without /api
  const socketUrl = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : 'http://localhost:5000';

  console.log('🔌 Connecting WebSocket to:', socketUrl);

  const newSocket = io(socketUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: (cb) => {
      const token = localStorage.getItem('token');
      cb({ token });
    }
  });

  setSocket(newSocket);

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
  });

  return () => {
    if (newSocket) {
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