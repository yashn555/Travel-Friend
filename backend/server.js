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

// ============================================
// CORS CONFIGURATION - UPDATED
// ============================================

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://travel-friend.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Check for subdomains or variations
      const originMatch = allowedOrigins.some(allowedOrigin => {
        return origin.startsWith(allowedOrigin.replace('https://', 'http://')) ||
               origin.startsWith(allowedOrigin);
      });
      
      if (originMatch) {
        callback(null, true);
      } else {
        console.log('⚠️ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Socket.io configuration
const io = socketio(server, {
  cors: corsOptions
});

// ============================================
// MIDDLEWARE
// ============================================

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

// ============================================
// ROUTES
// ============================================

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

// ============================================
// ROOT AND INFO ROUTES - ADDED
// ============================================

// Root route - Welcome message
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Travel Friend Backend API',
    version: '1.0.0',
    documentation: 'All API endpoints are under /api/',
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      profile: '/api/profile',
      groups: '/api/groups',
      chat: '/api/chat',
      trips: '/api/trips',
      users: '/api/users',
      health: '/api/health'
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Travel Friend API',
    status: 'Running',
    baseUrl: req.protocol + '://' + req.get('host') + '/api',
    endpoints: [
      { path: '/auth', methods: ['POST', 'GET'], description: 'Authentication endpoints' },
      { path: '/dashboard', methods: ['GET'], description: 'User dashboard data' },
      { path: '/profile', methods: ['GET', 'PUT'], description: 'User profile management' },
      { path: '/groups', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Group management' },
      { path: '/chat', methods: ['GET', 'POST'], description: 'Chat functionality' },
      { path: '/trips', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Trip planning' },
      { path: '/users', methods: ['GET'], description: 'User management' },
      { path: '/health', methods: ['GET'], description: 'Server health check' }
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ============================================
// SOCKET.IO CONNECTION
// ============================================

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

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: '/api',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

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

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
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

// ============================================
// PROCESS HANDLERS
// ============================================

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