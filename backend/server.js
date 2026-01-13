// Load environment variables FIRST - This is CRITICAL
require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/database');

console.log('\n🚀 ===== STARTING TRAVELER FRIEND BACKEND =====\n');

// Debug: Show environment variables
console.log('📋 Environment Check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not Set');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not Set');
console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ Not Set');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not Set');
console.log('');

// Connect to MongoDB
connectDatabase();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log('\n✨ ===== SERVER READY =====\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`\n❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('🛑 Shutting down server...');
    server.close(() => {
      process.exit(1);
    });
  }
});