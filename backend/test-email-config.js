require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailService');

async function testEmailConfiguration() {
  console.log('🔍 Testing Email Configuration\n');
  
  console.log('1. Checking Environment Variables:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not Set');
  
  console.log('\n2. Testing Email Sending...');
  
  const testEmail = 'yashnagapure25@gmail.com'; // Change to your email
  const testOTP = '123456';
  
  try {
    console.log(`   Sending test email to: ${testEmail}`);
    console.log(`   Test OTP: ${testOTP}`);
    
    await sendOTPEmail(testEmail, testOTP);
    
    console.log('\n✅ Email test completed!');
    console.log('\n💡 Check:');
    console.log('   - Your email inbox (and spam folder)');
    console.log('   - Backend console for OTP');
    console.log('   - Gmail app password is correct');
    
  } catch (error) {
    console.error('\n❌ Email test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check .env file has correct credentials');
    console.log('   2. Verify Gmail app password is valid');
    console.log('   3. Check if "Less secure app access" is enabled');
    console.log('   4. Try using a different email provider');
  }
}

testEmailConfiguration();