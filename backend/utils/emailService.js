// backend/utils/emailServiceSimple.js

const nodemailer = require('nodemailer');

console.log('\n📧 ===== SIMPLE GMAIL SETUP =====');
console.log('Email User:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('Email Pass Length:', process.env.EMAIL_PASS?.length || 0);

// Create transporter
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS?.replace(/\s+/g, '');
  
  if (!emailUser || !emailPass) {
    console.log('⚠️ Missing email credentials');
    return null;
  }
  
  try {
    console.log('🔧 Creating Gmail transporter...');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    
    console.log('✅ Transporter created');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create transporter:', error.message);
    return null;
  }
};

const transporter = createTransporter();

/* ================================
   TEST CONNECTION
================================ */
exports.testConnection = async () => {
  if (!transporter) {
    return { success: false, message: 'No transporter created' };
  }
  
  try {
    console.log('🔍 Testing Gmail connection...');
    await transporter.verify();
    console.log('✅ Gmail connection successful!');
    return { success: true, message: 'Connected to Gmail' };
  } catch (error) {
    console.error('❌ Gmail connection failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check App Password: gjsdzfkviolwlecv (16 chars, no spaces)');
    console.log('2. Verify 2-Step Verification is ON');
    console.log('3. App Password should be for "Mail" app');
    return { success: false, error: error.message };
  }
};

/* ================================
   SEND OTP EMAIL
================================ */
exports.sendOTPEmail = async (email, otp) => {
  console.log('\n📧 SENDING OTP EMAIL');
  console.log('To:', email);
  console.log('OTP:', otp);
  
  const mailOptions = {
    from: '"Traveler Friend" <yashnagapure25@gmail.com>',
    to: email,
    subject: 'Your Traveler Friend OTP',
    html: `
    <div>
      <h2>Traveler Friend Verification</h2>
      <p>Your OTP code is:</p>
      <h1 style="font-size: 36px; letter-spacing: 10px;">${otp}</h1>
      <p>Valid for 10 minutes</p>
      <p>Do not share this code with anyone.</p>
    </div>
    `,
    text: `Your Traveler Friend OTP: ${otp}\nValid for 10 minutes.`
  };
  
  try {
    if (!transporter) {
      console.log('📧 SIMULATION MODE - No transporter');
      console.log('💡 OTP for manual testing:', otp);
      return { 
        success: true, 
        simulated: true, 
        otp: otp,
        message: 'Check console for OTP' 
      };
    }
    
    console.log('📤 Sending email via Gmail...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      message: 'OTP sent to email' 
    };
    
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    console.log('💡 OTP for manual testing:', otp);
    
    return { 
      success: false, 
      error: error.message,
      otp: otp,
      message: 'Email failed, check console for OTP' 
    };
  }
};