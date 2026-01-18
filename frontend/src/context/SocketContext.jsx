// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
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
    off: socket ? socket.off.bind(socket) : () => {}
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};