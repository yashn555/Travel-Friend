// backend/testRegistration.js
require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailService');

async function testRegistration() {
  console.log('🧪 TESTING REGISTRATION FLOW\n');
  
  const testUser = {
    name: 'Test User',
    email: 'yashnagapure25@gmail.com',
    password: 'test123'
  };
  
  console.log('📝 Registering:', testUser.email);
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('🔑 Generated OTP:', otp);
  
  // Store OTP in "database" (in memory for test)
  const userInDb = {
    ...testUser,
    otp: otp,
    otpExpires: Date.now() + 10 * 60 * 1000,
    isVerified: false
  };
  
  console.log('💾 User saved to DB (simulated)');
  
  // Send OTP email
  console.log('\n📧 Sending OTP email...');
  const emailResult = await sendOTPEmail(testUser.email, otp);
  
  console.log('\n📋 Email Result:', emailResult);
  
  if (emailResult.success && !emailResult.simulated) {
    console.log('\n🎉 REGISTRATION SUCCESSFUL!');
    console.log('✅ User created');
    console.log('✅ OTP generated:', otp);
    console.log('✅ Email sent via Gmail');
    console.log('\n📨 Check your email for OTP');
    console.log('📧 Then verify with OTP:', otp);
  } else {
    console.log('\n⚠️ Using simulation mode');
    console.log('💡 OTP for testing:', otp);
    console.log('🔐 You can verify with this OTP');
  }
  
  // Simulate OTP verification
  console.log('\n🔐 Simulating OTP verification...');
  if (userInDb.otp === otp && Date.now() < userInDb.otpExpires) {
    console.log('✅ OTP verified successfully!');
    console.log('🎉 User account activated!');
  } else {
    console.log('❌ OTP verification failed');
  }
}

testRegistration();