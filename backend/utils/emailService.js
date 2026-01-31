// backend/utils/emailService.js - FINAL PRODUCTION VERSION
const nodemailer = require('nodemailer');

console.log('\n📧 ===== EMAIL SERVICE INITIALIZING =====');
console.log('Environment:', process.env.NODE_ENV);

let transporter = null;
let isVerified = false;
let initializationPromise = null;

/* ================================
   UNIVERSAL EMAIL INITIALIZATION
================================ */
const initializeEmailService = async () => {
  console.log('🔧 Starting email service initialization...');
  
  // Check environment
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  console.log('📊 Environment check:');
  console.log('  EMAIL_USER:', emailUser ? emailUser.substring(0, 3) + '***' : 'Not set');
  console.log('  EMAIL_PASS:', emailPass ? `${emailPass.length} chars` : 'Not set');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  
  // If no credentials, use simulation mode
  if (!emailUser || !emailPass) {
    console.log('📧 Running in SIMULATION MODE (no credentials)');
    return;
  }
  
  // Clean password
  const cleanPass = emailPass.toString().replace(/\s+/g, '');
  
  if (cleanPass.length !== 16) {
    console.log(`⚠️ Password should be 16 chars (App Password), got ${cleanPass.length}`);
    console.log('📧 Will use simulation mode');
    return;
  }
  
  try {
    console.log('🚀 Creating Gmail transporter...');
    
    // Use Gmail with proper settings for both local and Render
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: cleanPass
      },
      // Render-specific optimizations
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      // Connection settings for reliable delivery
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Security
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Transporter created, verifying connection...');
    
    // Verify connection with timeout
    const verificationPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    
    await Promise.race([verificationPromise, timeoutPromise]);
    isVerified = true;
    
    console.log('✅ Gmail connection verified successfully!');
    console.log(`📤 Ready to send emails from: ${emailUser}`);
    
  } catch (error) {
    console.error('❌ Gmail setup failed:', error.message);
    console.log('📧 Falling back to simulation mode');
    transporter = null;
    isVerified = false;
  }
};

/* ================================
   INITIALIZE ONCE
================================ */
const ensureInitialized = async () => {
  if (!initializationPromise) {
    initializationPromise = initializeEmailService();
  }
  return initializationPromise;
};

/* ================================
   SEND OTP EMAIL (PRODUCTION READY)
================================ */
exports.sendOTPEmail = async (email, otp) => {
  console.log(`\n📧 ===== SENDING OTP =====`);
  console.log(`To: ${email}`);
  console.log(`OTP: ${otp}`);
  
  try {
    // Ensure email service is initialized
    await ensureInitialized();
    
    const otpExpiry = process.env.OTP_EXPIRE_MINUTES || 10;
    
    if (transporter && isVerified) {
      console.log('📤 Sending via Gmail...');
      
      const mailOptions = {
        from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your Traveler Friend OTP Code',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 10px; }
            .otp-box { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .otp-code { font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #2c3e50; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Traveler Friend OTP Verification</h2>
            <p>Hello,</p>
            <p>Your One-Time Password is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p>Valid for ${otpExpiry} minutes</p>
            </div>
            <p><strong>⚠️ Security Notice:</strong> Never share this OTP with anyone.</p>
            <div class="footer">
              <p>This is an automated email from Traveler Friend.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
        `,
        text: `Your Traveler Friend OTP: ${otp}\nValid for ${otpExpiry} minutes.\nDo not share this code with anyone.`
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully!');
      console.log('📨 Message ID:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        emailSent: true,
        message: 'OTP sent to your email'
      };
      
    } else {
      // Simulation mode for development or when email fails
      console.log('📧 SIMULATION MODE - No email sent');
      console.log('💡 OTP for testing:', otp);
      
      // In production, we should still return success but log the OTP
      // In development, we can show the OTP
      
      return {
        success: true,
        simulated: true,
        otp: otp,
        emailSent: false,
        message: process.env.NODE_ENV === 'production' 
          ? 'Please contact support for OTP' 
          : 'Development mode - OTP in console'
      };
    }
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.log('💡 OTP for manual use:', otp);
    
    // Don't fail the registration in production
    // Just provide the OTP for manual verification
    return {
      success: false,
      error: error.message,
      otp: otp,
      emailSent: false,
      message: process.env.NODE_ENV === 'production'
        ? 'Email service temporarily unavailable. Please contact support.'
        : `Email failed: ${error.message}`
    };
  }
};

/* ================================
   GET STATUS
================================ */
exports.getEmailStatus = async () => {
  await ensureInitialized();
  
  return {
    environment: process.env.NODE_ENV,
    isVerified: isVerified,
    hasTransporter: !!transporter,
    mode: isVerified ? 'GMAIL' : 'SIMULATION',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'Not set'
  };
};

// Initialize on module load (non-blocking)
setTimeout(() => {
  ensureInitialized().catch(err => {
    console.error('Email initialization error:', err.message);
  });
}, 1000);