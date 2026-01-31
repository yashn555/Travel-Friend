// backend/testEmailLocal.js
const { sendOTPEmail, getEmailStatus } = require('./utils/emailService');

async function testEmail() {
  console.log('\n🧪 TESTING EMAIL LOCALLY...');
  
  // Check status
  const status = getEmailStatus ? getEmailStatus() : { error: 'No status function' };
  console.log('📊 Email Status:', status);
  
  // Send test email
  const testEmail = 'yashnagapure25@gmail.com';
  const otp = '123456';
  
  console.log(`\n📧 Sending test to: ${testEmail}`);
  console.log(`🔐 Test OTP: ${otp}`);
  
  try {
    const result = await sendOTPEmail(testEmail, otp);
    console.log('\n📋 Result:', result);
    
    if (result.simulated) {
      console.log('\n⚠️  EMAIL SERVICE IS IN SIMULATION MODE!');
      console.log('💡 OTP for testing:', otp);
      console.log('\n🔧 To fix this:');
      console.log('   1. Check your .env file has correct credentials');
      console.log('   2. Make sure EMAIL_PASS has NO spaces (16 characters)');
      console.log('   3. Enable "Less Secure Apps" or use App Password');
    } else if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log('📨 Message ID:', result.messageId);
    } else {
      console.log('\n❌ Email failed:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run test
testEmail();