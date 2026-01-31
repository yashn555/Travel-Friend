// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Extract token from handshake
  const token = socket.handshake.auth.token;
  
  // Join group room
  socket.on('join-group', (groupId) => {
    socket.join(`group:${groupId}`);
    console.log(`Client ${socket.id} joined group ${groupId}`);
  });
  
  // Leave group room
  socket.on('leave-group', (groupId) => {
    socket.leave(`group:${groupId}`);
    console.log(`Client ${socket.id} left group ${groupId}`);
  });
  
  // Handle messages
  socket.on('send-message', (data) => {
    io.to(`group:${data.groupId}`).emit('new-message', {
      ...data,
      senderId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(`group:${data.groupId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping,
      groupId: data.groupId
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});