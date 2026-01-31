// backend/testGmail.js
require('dotenv').config(); // This loads .env file

console.log('🧪 TESTING GMAIL WITH .env LOADED\n');

// Check if dotenv loaded properly
console.log('🔍 Checking environment after dotenv:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Now test email
const { testEmail, getEmailStatus } = require('./utils/emailService');

async function runTest() {
  console.log('\n📊 Email Status:', getEmailStatus());
  
  const result = await testEmail('yashnagapure25@gmail.com');
  
  console.log('\n📋 Test Result:', result);
  
  if (result.simulated) {
    console.log('\n⚠️ STILL IN SIMULATION MODE!');
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Make sure .env file is in backend/ folder');
    console.log('2. EMAIL_PASS should be 16 characters (no spaces)');
    console.log('3. Restart your terminal/editor after changing .env');
    console.log('4. Try: EMAIL_PASS="gjsdzfkviolwlecv" (exactly 16 chars)');
  } else if (result.success) {
    console.log('\n✅ EMAIL SENT SUCCESSFULLY!');
    console.log('📨 Check your Gmail inbox and spam folder');
  }
}

runTest();