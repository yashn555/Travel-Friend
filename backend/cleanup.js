const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Drop users collection
    console.log('\n🗑️  Dropping users collection...');
    await db.collection('users').drop();
    console.log('✅ Users collection dropped');
    
    // List all indexes
    console.log('\n🔍 Checking indexes...');
    const indexes = await db.collection('users').indexes();
    console.log('Indexes:', indexes);
    
    // Create fresh indexes
    console.log('\n🔧 Creating fresh indexes...');
    
    // Close connection
    await mongoose.disconnect();
    console.log('\n✅ Cleanup completed successfully!');
    console.log('🚀 You can now start your server: npm run dev');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    
    // If collection doesn't exist, that's fine
    if (error.code === 26) {
      console.log('ℹ️  Collection already dropped or does not exist');
    } else {
      console.error(error);
    }
    
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanupDatabase();