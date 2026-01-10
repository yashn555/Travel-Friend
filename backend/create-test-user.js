require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    console.log('👤 Creating test user...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test@123', salt);
    
    // Create test user directly in collection
    const db = mongoose.connection.db;
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ 
      email: 'test@example.com' 
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: Test@123');
    } else {
      // Create new user
      const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        mobile: '1234567890',
        password: hashedPassword,
        isVerified: true,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('users').insertOne(testUser);
      console.log('✅ Test user created successfully!');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: Test@123');
      console.log('✅ Verified: Yes');
    }
    
    // Count users
    const count = await db.collection('users').countDocuments();
    console.log(`\n📊 Total users: ${count}`);
    
    // List all users
    const users = await db.collection('users').find({}).toArray();
    console.log('\n📋 All users in database:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Verified: ${user.isVerified || false}`);
    });
    
    await mongoose.disconnect();
    console.log('\n🎉 Ready to test!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();