// backend/testEmailFinal.js
require('dotenv').config();

console.log('🧪 FINAL EMAIL TEST\n');

const { testEmail, getEmailStatus } = require('./utils/emailService');

async function runTest() {
  try {
    console.log('📊 Getting email status...');
    const status = await getEmailStatus();
    console.log('Status:', status);
    
    console.log('\n📧 Testing email to yashnagapure25@gmail.com...');
    const result = await testEmail('yashnagapure25@gmail.com');
    
    console.log('\n📋 Result:', result);
    
    if (result.success && !result.simulated) {
      console.log('\n🎉 SUCCESS! Email sent via Gmail!');
      console.log('📨 Check your Gmail:');
      console.log('   1. Inbox (might be in Updates tab)');
      console.log('   2. Spam folder');
      console.log('   3. Sent folder (shows as sent from yashnagapure25@gmail.com)');
    } else if (result.simulated) {
      console.log('\n⚠️ Still in simulation mode');
      console.log('💡 OTP for testing:', result.otp);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest();