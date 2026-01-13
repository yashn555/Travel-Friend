const mongoose = require('mongoose');
const Group = require('./models/Group');
const Agency = require('./models/Agency');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

// Check if MongoDB URI is defined
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/traveler_friend';

console.log('🔍 Checking MongoDB URI:', MONGODB_URI);

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  console.log('💡 Please add: MONGODB_URI=mongodb://localhost:27017/traveler_friend to your .env file');
  process.exit(1);
}

const sampleGroups = [
  {
    destination: 'Goa',
    description: 'Looking for travel buddies to explore beaches in Goa',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-22'),
    budget: { min: 15000, max: 25000, currency: 'INR' },
    maxMembers: 6,
    currentMembers: [],
    groupType: 'anonymous',
    status: 'planning',
    createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    tags: ['beach', 'budget', 'adventure']  // Changed 'party' to 'adventure'
  },
  {
    destination: 'Manali',
    description: 'Adventure trip to Manali for trekking and camping',
    startDate: new Date('2024-03-10'),
    endDate: new Date('2024-03-17'),
    budget: { min: 20000, max: 35000, currency: 'INR' },
    maxMembers: 8,
    currentMembers: [],
    groupType: 'known',
    status: 'planning',
    createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
    tags: ['mountain', 'adventure', 'budget']
  },
  {
    destination: 'Kerala',
    description: 'Relaxing backwater cruise and Ayurvedic retreat',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-04-08'),
    budget: { min: 25000, max: 40000, currency: 'INR' },
    maxMembers: 4,
    currentMembers: [],
    groupType: 'anonymous',
    status: 'confirmed',
    createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
    tags: ['cultural', 'luxury', 'adventure']
  },
  {
    destination: 'Rajasthan',
    description: 'Cultural heritage tour of Rajasthan forts and palaces',
    startDate: new Date('2024-03-20'),
    endDate: new Date('2024-03-28'),
    budget: { min: 30000, max: 50000, currency: 'INR' },
    maxMembers: 10,
    currentMembers: [],
    groupType: 'known',
    status: 'planning',
    createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
    tags: ['cultural', 'luxury', 'family']
  },
  {
    destination: 'Ladakh',
    description: 'Road trip from Manali to Leh covering beautiful landscapes',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-10'),
    budget: { min: 35000, max: 60000, currency: 'INR' },
    maxMembers: 12,
    currentMembers: [],
    groupType: 'anonymous',
    status: 'planning',
    createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439015'),
    tags: ['adventure', 'mountain', 'solo']
  }
];

const sampleAgencies = [
  {
    name: 'Kesari Tours',
    description: 'One of India\'s leading tour operators with 35+ years of experience',
    logo: 'kesari-logo.jpg',
    website: 'https://www.kesari.in',
    contactEmail: 'info@kesari.in',
    contactPhone: '1800102222',
    address: {
      street: '7, Juhu Supreme Shopping Center',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400049'
    },
    verified: true,
    rating: 4.7,
    specialties: ['international', 'luxury', 'cultural'],
    featured: true
  },
  {
    name: 'Thomas Cook India',
    description: 'Leading integrated travel and travel related financial services company',
    logo: 'thomascook-logo.jpg',
    website: 'https://www.thomascook.in',
    contactEmail: 'customercare@thomascook.in',
    contactPhone: '1800209999',
    address: {
      street: 'Thomas Cook Building',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400021'
    },
    verified: true,
    rating: 4.5,
    specialties: ['international', 'domestic', 'honeymoon'],
    featured: true
  },
  {
    name: 'MakeMyTrip',
    description: 'India\'s leading online travel company',
    logo: 'makemytrip-logo.jpg',
    website: 'https://www.makemytrip.com',
    contactEmail: 'care@makemytrip.com',
    contactPhone: '0124491101',
    address: {
      street: 'DLF Building No. 5, Tower B',
      city: 'Gurgaon',
      state: 'Haryana',
      country: 'India',
      zipCode: '122002'
    },
    verified: true,
    rating: 4.6,
    specialties: ['domestic', 'budget', 'family'],
    featured: true
  },
  {
    name: 'Cox & Kings',
    description: 'Oldest travel company in the world, operating since 1758',
    logo: 'coxkings-logo.jpg',
    website: 'https://www.coxandkings.com',
    contactEmail: 'info@coxandkings.com',
    contactPhone: '1800209997',
    address: {
      street: 'Cox & Kings House',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400001'
    },
    verified: true,
    rating: 4.4,
    specialties: ['luxury', 'cultural', 'international'],
    featured: false
  },
  {
    name: 'SOTC',
    description: 'Trusted name in travel for over 70 years',
    logo: 'sotc-logo.jpg',
    website: 'https://www.sotc.in',
    contactEmail: 'care@sotc.in',
    contactPhone: '1800102123',
    address: {
      street: 'SOTC House',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400001'
    },
    verified: true,
    rating: 4.3,
    specialties: ['family', 'domestic', 'budget'],
    featured: false
  }
];

async function seedDatabase() {
  try {
    console.log('\n🚀 ===== SEEDING DATABASE =====\n');
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    console.log('\n🗑️ Clearing existing data...');
    await Group.deleteMany({});
    await Agency.deleteMany({});
    console.log('✅ Existing data cleared');
    
    // Insert sample groups
    console.log('\n📝 Inserting sample groups...');
    const groups = await Group.insertMany(sampleGroups);
    console.log(`✅ ${groups.length} groups created`);
    
    // Insert sample agencies
    console.log('\n🏢 Inserting sample agencies...');
    const agencies = await Agency.insertMany(sampleAgencies);
    console.log(`✅ ${agencies.length} agencies created`);
    
    // Create a test user if doesn't exist
    console.log('\n👤 Checking test user...');
    const testUserEmail = 'test@example.com';
    let testUser = await User.findOne({ email: testUserEmail });
    
    if (!testUser) {
      console.log('Creating test user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Test@123', salt);
      
      testUser = await User.create({
        name: 'Test User',
        email: testUserEmail,
        mobile: '1234567890',
        password: hashedPassword,
        profileImage: 'default-profile.jpg',
        bio: 'This is a test user for development purposes',
        travelPreferences: {
          adventure: true,
          luxury: false,
          budget: true,
          solo: false,
          group: true,
          beach: true,
          mountain: false,
          cultural: true
        },
        isAnonymous: false,
        isVerified: true,
        rating: 4.5,
        role: 'user'
      });
      console.log('✅ Test user created');
      console.log('   📧 Email: test@example.com');
      console.log('   🔑 Password: Test@123');
    } else {
      console.log('✅ Test user already exists');
    }
    
    // Summary
    console.log('\n📊 ===== SEEDING SUMMARY =====');
    console.log(`📝 Groups created: ${groups.length}`);
    console.log(`🏢 Agencies created: ${agencies.length}`);
    console.log(`👤 Test user: ${testUserEmail}`);
    console.log('\n✨ ===== DATABASE SEEDED SUCCESSFULLY! =====\n');
    
    console.log('💡 Next steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start frontend: cd frontend && npm start');
    console.log('   3. Login with: test@example.com / Test@123');
    console.log('   4. Visit: http://localhost:3000/dashboard\n');
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    
    if (error.errors) {
      console.log('\n🔍 Validation Errors:');
      Object.keys(error.errors).forEach(key => {
        console.log(`   ${key}: ${error.errors[key].message}`);
      });
    }
    
    process.exit(1);
  }
}

// Check if .env file exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Creating a sample .env file...');
  
  const sampleEnv = `NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/traveler_friend
JWT_SECRET=your_jwt_secret_yash123
JWT_EXPIRE=7d
OTP_EXPIRE_MINUTES=10

# GMAIL CREDENTIALS
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yashnagapure25@gmail.com
EMAIL_PASS=awmtyyfozljwmbvu

FRONTEND_URL=http://localhost:3000`;
  
  fs.writeFileSync(envPath, sampleEnv);
  console.log('✅ Created .env file. Please update it with your credentials.');
  console.log('💡 Edit the .env file and then run: node seedData.js\n');
} else {
  // Run the seeding
  seedDatabase();
}