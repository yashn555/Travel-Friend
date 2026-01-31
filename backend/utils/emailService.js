// backend/utils/emailService.js

const nodemailer = require('nodemailer');

let transporter = null;
let emailProvider = 'simulation';
let isVerified = false;

/* ================================
   INITIALIZE EMAIL SERVICE
================================ */
const initEmailService = () => {
  console.log('\n📧 ===== EMAIL SERVICE INITIALIZATION =====');
  
  // Clear any existing transporter
  transporter = null;
  
  // ✅ Use ONLY personal Gmail (NO SendGrid)
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  console.log(`📧 Checking Gmail credentials...`);
  console.log(`   Email: ${emailUser ? emailUser.substring(0, 3) + '***' : 'Not set'}`);
  console.log(`   Password: ${emailPass ? 'Set (' + emailPass.length + ' chars)' : 'Not set'}`);
  
  // Check if we should use Gmail (preferred)
  if (emailUser && emailPass) {
    console.log('✅ Found Gmail credentials, configuring...');
    
    // Remove any spaces from password
    const cleanPassword = emailPass.replace(/\s+/g, '');
    
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: cleanPassword
        },
        // Gmail specific settings
        port: 465,
        secure: true, // true for 465, false for other ports
        tls: {
          rejectUnauthorized: false
        }
      });
      
      emailProvider = 'gmail';
      console.log('✅ Gmail transporter created');
      console.log(`📤 Will send emails from: ${emailUser}`);
      
      // Test connection
      testGmailConnection();
      
    } catch (error) {
      console.error('❌ Failed to create Gmail transporter:', error.message);
      emailProvider = 'simulation';
    }
    
  } else {
    console.log('⚠️ Gmail credentials not found');
    console.log('📧 Running in SIMULATION MODE');
    console.log('💡 To enable emails, set in Render:');
    console.log('   EMAIL_USER=yashnagapure25@gmail.com');
    console.log('   EMAIL_PASS=gjsdzfkviolwlecv');
  }
};

/* ================================
   TEST GMAIL CONNECTION
================================ */
const testGmailConnection = async () => {
  if (!transporter || emailProvider !== 'gmail') return;
  
  console.log('🔍 Testing Gmail connection...');
  
  try {
    await transporter.verify();
    isVerified = true;
    console.log('✅ Gmail connection successful!');
    console.log('🚀 Ready to send OTP emails');
  } catch (error) {
    console.error('❌ Gmail connection failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING TIPS:');
    console.log('1. Make sure EMAIL_PASS has NO spaces (16 characters)');
    console.log('2. Verify 2-Step Verification is enabled on Google');
    console.log('3. Check you generated an "App Password" for Mail');
    console.log('4. Current password length:', process.env.EMAIL_PASS?.length || 0);
    
    // Try alternative configuration
    console.log('\n🔄 Trying alternative Gmail configuration...');
    try {
      const altTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS?.replace(/\s+/g, '')
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      await altTransporter.verify();
      transporter = altTransporter;
      isVerified = true;
      console.log('✅ Alternative Gmail connection successful!');
    } catch (altError) {
      console.error('❌ Alternative also failed:', altError.message);
    }
  }
};

// Initialize immediately
initEmailService();

/* ================================
   SEND OTP EMAIL (MAIN FUNCTION)
================================ */
exports.sendOTPEmail = async (email, otp) => {
  console.log('\n📧 ===== SENDING OTP =====');
  console.log(`To: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log(`Provider: ${emailProvider}`);
  console.log(`Verified: ${isVerified}`);
  
  const otpExpiry = process.env.OTP_EXPIRE_MINUTES || 10;
  
  // Create email content
  const mailOptions = {
    from: `"Traveler Friend" <${process.env.EMAIL_USER || 'yashnagapure25@gmail.com'}>`,
    to: email,
    subject: '🔐 Your Traveler Friend OTP Code',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px;">
      <h2 style="color: #2c3e50;">Traveler Friend Verification</h2>
      <p>Your One-Time Password is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #2c3e50; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          ${otp}
        </div>
      </div>
      <p style="color: #666;">
        ⏰ Valid for ${otpExpiry} minutes<br>
        🔒 Do not share with anyone<br>
        ❓ If you didn't request this, ignore this email
      </p>
    </div>
    `,
    text: `Your Traveler Friend OTP: ${otp}\nValid for ${otpExpiry} minutes.\nDo not share this code.`
  };
  
  try {
    // Send via Gmail if available
    if (transporter && emailProvider === 'gmail' && isVerified) {
      console.log('📤 Sending real email via Gmail...');
      
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully!');
      console.log(`📨 Message ID: ${info.messageId}`);
      
      return {
        success: true,
        message: 'OTP sent to email',
        messageId: info.messageId
      };
    }
    // Simulation mode
    else {
      console.log('\n📧 ===== SIMULATION MODE =====');
      console.log('From:', mailOptions.from);
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('OTP:', otp);
      console.log('\n💡 To send real emails:');
      console.log('   1. Set EMAIL_USER and EMAIL_PASS in Render');
      console.log('   2. Use 16-character App Password (no spaces)');
      console.log('   3. Enable Google 2-Step Verification');
      
      return {
        success: true,
        simulated: true,
        otp: otp,
        message: 'Simulation mode - check console for OTP'
      };
    }
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.log(`💡 OTP for ${email}: ${otp}`);
    
    // Fallback - don't break the app
    return {
      success: false,
      error: 'Email service error',
      otp: otp, // Still provide OTP
      message: 'Please check console for OTP code'
    };
  }
};

/* ================================
   SEND WELCOME EMAIL
================================ */
exports.sendWelcomeEmail = async (email, name) => {
  try {
    if (transporter && emailProvider === 'gmail' && isVerified) {
      await transporter.sendMail({
        from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎉 Welcome to Traveler Friend!',
        html: `<h2>Welcome ${name}!</h2><p>Start planning your trips! ✈️</p>`
      });
      console.log(`✅ Welcome email sent to ${email}`);
    } else {
      console.log(`📧 [SIM] Welcome email for ${name}`);
    }
  } catch (error) {
    console.error('Welcome email error:', error.message);
  }
};

/* ================================
   GET SERVICE STATUS
================================ */
exports.getEmailStatus = () => {
  return {
    provider: emailProvider,
    from: process.env.EMAIL_USER || 'Not set',
    isActive: emailProvider === 'gmail',
    isVerified: isVerified,
    message: emailProvider === 'gmail' 
      ? (isVerified 
          ? `✅ Ready! Emails from ${process.env.EMAIL_USER}` 
          : `⏳ Testing connection to ${process.env.EMAIL_USER}`)
      : '📧 Simulation mode - set EMAIL_USER & EMAIL_PASS'
  };
};

/* ================================
   MANUAL TEST FUNCTION
================================ */
exports.testEmailConnection = async () => {
  console.log('\n🧪 ===== EMAIL CONNECTION TEST =====');
  
  const status = this.getEmailStatus();
  console.log('Status:', status);
  
  if (transporter && emailProvider === 'gmail') {
    try {
      await transporter.verify();
      console.log('✅ Connection test PASSED');
      return { success: true, status };
    } catch (error) {
      console.error('❌ Connection test FAILED:', error.message);
      return { success: false, error: error.message, status };
    }
  }
  
  console.log('📧 No active email service to test');
  return { success: false, status };
};