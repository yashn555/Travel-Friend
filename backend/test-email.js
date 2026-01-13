require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailService');

async function testEmail() {
  console.log('\n🚀 ===== EMAIL TEST SCRIPT =====\n');
  
  console.log('📋 Checking Environment Variables:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  
  console.log('\n📧 Testing Email Sending...');
  
  const testEmail = 'yashnagapure25@gmail.com'; // Change to your email
  const testOTP = '123456';
  
  try {
    console.log(`\nSending test email to: ${testEmail}`);
    console.log(`Test OTP: ${testOTP}`);
    
    const result = await sendOTPEmail(testEmail, testOTP);
    
    if (result) {
      console.log('\n✅ SUCCESS: Email was sent successfully!');
      console.log('💡 Check your Gmail inbox (and spam folder)');
    } else {
      console.log('\n📧 Simulation Mode: Email was not sent');
      console.log('💡 OTP is logged in console for testing');
    }
    
    console.log('\n🔧 If email is not working, check:');
    console.log('   1. .env file has correct credentials');
    console.log('   2. Gmail App Password is valid');
    console.log('   3. Internet connection is working');
    console.log('   4. Check Gmail security settings');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
  
  console.log('\n✨ ===== TEST COMPLETE =====\n');
}

testEmail();