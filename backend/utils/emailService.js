// backend/utils/emailService.js

const nodemailer = require('nodemailer');

let transporter = null;
let emailProvider = 'simulation';

/* ================================
   INITIALIZE EMAIL SERVICE
================================ */
const initEmailService = () => {
  console.log('\n📧 ===== EMAIL SERVICE INITIALIZATION =====');

  // ✅ Your Personal Gmail Configuration
  const emailUser = process.env.EMAIL_USER;  // Your personal email
  const emailPass = process.env.EMAIL_PASS;  // App password (NOT your regular password)
  const emailFrom = process.env.EMAIL_FROM || `"Traveler Friend" <${emailUser}>`;

  if (emailUser && emailPass) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      emailProvider = 'gmail';
      console.log('✅ Personal Gmail transporter created');
      console.log(`📨 Sending emails from: ${emailFrom}`);
      console.log(`📨 Using account: ${emailUser.substring(0, 3)}***@gmail.com`);
      return;
    } catch (error) {
      console.error('❌ Failed to create Gmail transporter:', error.message);
    }
  }

  // 🧪 No credentials found
  console.log('⚠️ Personal Gmail credentials not found');
  console.log('📧 Running in SIMULATION MODE');
  console.log('💡 To use your personal Gmail, set:');
  console.log('   EMAIL_USER=your-email@gmail.com');
  console.log('   EMAIL_PASS=your-app-password');
};

initEmailService();

/* ================================
   VERIFY EMAIL CONFIGURATION
================================ */
const verifyEmailConfig = async () => {
  try {
    if (transporter && emailProvider === 'gmail') {
      console.log('🔍 Verifying Gmail connection...');
      await transporter.verify();
      console.log('✅ Gmail verified and ready to send emails');
    } else {
      console.log('📧 Simulation mode active');
    }
  } catch (err) {
    console.error('❌ Gmail verification failed:', err.message);
    console.log('\n🔧 TROUBLESHOOTING GUIDE:');
    console.log('   1. Make sure you\'re using an APP PASSWORD, not your regular password');
    console.log('   2. Go to: https://myaccount.google.com/security');
    console.log('   3. Enable "2-Step Verification"');
    console.log('   4. Generate an "App Password" for Mail/Other');
    console.log('   5. Use that 16-character password as EMAIL_PASS');
  }
};

setTimeout(verifyEmailConfig, 2000);

/* ================================
   SEND OTP EMAIL (Simplified)
================================ */
exports.sendOTPEmail = async (email, otp) => {
  console.log('\n📧 ===== SENDING OTP EMAIL =====');
  console.log(`From: ${process.env.EMAIL_USER}`);
  console.log(`To: ${email}`);
  console.log(`OTP: ${otp}`);

  const otpExpiry = process.env.OTP_EXPIRE_MINUTES || 10;
  
  const html = `<!DOCTYPE html>
  <html>
  <body style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; padding: 30px;">
      <h2 style="color: #2c3e50;">Traveler Friend OTP Verification</h2>
      <p>Hello,</p>
      <p>Your OTP for account verification is:</p>
      
      <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
        <div style="font-size: 32px; letter-spacing: 10px; font-weight: bold; color: #2c3e50;">
          ${otp}
        </div>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        ⚠️ This OTP is valid for ${otpExpiry} minutes.<br>
        ⚠️ Never share this OTP with anyone.<br>
        ⚠️ If you didn't request this, please ignore this email.
      </p>
      
      <hr style="margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Sent by Traveler Friend App<br>
        This is an automated email, please do not reply.
      </p>
    </div>
  </body>
  </html>`;

  try {
    if (transporter && emailProvider === 'gmail') {
      const mailOptions = {
        from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your Traveler Friend OTP Code',
        html: html,
        text: `Your Traveler Friend OTP is: ${otp}. Valid for ${otpExpiry} minutes.`
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully from your personal Gmail`);
      console.log(`📨 Message ID: ${info.messageId}`);
      return { success: true, message: 'OTP sent successfully' };
    } else {
      // Simulation mode
      console.log('\n📧 ===== SIMULATION MODE =====');
      console.log('Subject: 🔐 Your Traveler Friend OTP Code');
      console.log(`HTML: ${html.substring(0, 100)}...`);
      console.log('\n💡 Set up your Gmail credentials to send real emails');
      return { success: true, simulated: true, otp: otp };
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.log(`💡 OTP for manual use: ${otp}`);
    
    // Don't fail the registration, just log the OTP
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Email service error', otp: otp };
    }
    throw new Error(`Email failed: ${error.message}`);
  }
};

/* ================================
   SEND WELCOME EMAIL
================================ */
exports.sendWelcomeEmail = async (email, name) => {
  try {
    if (transporter && emailProvider === 'gmail') {
      await transporter.sendMail({
        from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎉 Welcome to Traveler Friend!',
        html: `<h2>Welcome ${name}!</h2><p>Your account is now verified. Happy travels! ✈️</p>`
      });
      console.log(`✅ Welcome email sent to ${email}`);
    } else {
      console.log(`📧 [SIM] Welcome email for ${name} <${email}>`);
    }
  } catch (error) {
    console.error('Welcome email error:', error.message);
  }
};

/* ================================
   CHECK EMAIL STATUS
================================ */
exports.getEmailStatus = () => {
  return {
    provider: emailProvider,
    fromEmail: process.env.EMAIL_USER,
    isActive: emailProvider === 'gmail',
    message: emailProvider === 'gmail' 
      ? `Sending emails from ${process.env.EMAIL_USER.substring(0, 3)}***@gmail.com`
      : 'Simulation mode - set EMAIL_USER & EMAIL_PASS to send real emails'
  };
};