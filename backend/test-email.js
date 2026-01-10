require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailService');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
  
  try {
    await sendOTPEmail('yashnagapure35@gmail.com', '123456');
    console.log('✅ Email test completed');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmail();