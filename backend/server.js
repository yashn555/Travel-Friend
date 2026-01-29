require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const fileUpload = require('express-fileupload');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const groupRoutes = require('./routes/groupRoutes');
const chatRoutes = require('./routes/chatRoutes');
const tripRoutes = require('./routes/tripRoutes');
const userRoutes = require('./routes/userRoutes');
const privateChatRoutes = require('./routes/privateChatRoutes');
const matchRoutes = require('./routes/matchRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const groupNotificationRoutes = require('./routes/groupNotificationRoutes');
const userGroupRoutes = require('./routes/userGroupRoutes');
const nearbyUsersRoutes = require('./routes/nearbyUsers');
const testRoutes = require('./routes/testRoutes');
const autoTripRoutes = require('./routes/autoTripRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const { initAutoComplete } = require('./utils/autoCompleteTrips');

// Initialize express
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'http://localhost:3000'
      : 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/private-chat', privateChatRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/notifications/group', groupNotificationRoutes);
app.use('/api/user-groups', userGroupRoutes);
app.use('/api/nearby-users', nearbyUsersRoutes);
app.use('/api/auto-trip', autoTripRoutes);
app.use('/api/test', testRoutes);
app.use('/api/expenses', expenseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('🔌 New WebSocket connection:', socket.id);

  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`👥 Socket ${socket.id} joined group-${groupId}`);
  });

  socket.on('leave-group', (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`👋 Socket ${socket.id} left group-${groupId}`);
  });

  socket.on('send-message', (data) => {
    const { groupId, message } = data;
    console.log(`💬 New message in group-${groupId}:`, message);
    io.to(`group-${groupId}`).emit('new-message', message);
  });

  socket.on('typing', (data) => {
    const { groupId, userId, isTyping } = data;
    socket.to(`group-${groupId}`).emit('user-typing', {
      userId,
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }

    // Check if MongoDB URI is pointing to localhost in production
    if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI.includes('localhost')) {
      console.warn('⚠️  Warning: MONGO_URI contains localhost in production environment');
    }

    console.log(`🔗 Attempting to connect to MongoDB...`);
    
    // Configure mongoose connection options
    const mongooseOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    };

    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log('✅ MongoDB Connected');
    
    // Initialize auto-complete system AFTER successful DB connection
    initAutoComplete();
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Tip: Make sure your MongoDB server is running and accessible');
      console.error('💡 For Render.com, use MongoDB Atlas or Render\'s own MongoDB service');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Tip: Check your MongoDB username and password');
    }
    
    // Don't exit immediately in production, let the health check show the status
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    throw error;
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    
    // Even if DB fails, start server in production for health checks
    if (process.env.NODE_ENV === 'production') {
      server.listen(PORT, () => {
        console.log(`⚠️  Server started without database connection on port ${PORT}`);
        console.log(`💡 Health check will show database as disconnected`);
      });
    } else {
      process.exit(1);
    }
  }
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  console.error(err.stack);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('👋 HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('👋 MongoDB connection closed');
      process.exit(0);
    });
  });
});