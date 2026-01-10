const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  try {
    console.log('📧 Configuring email with:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASS
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use service name instead of host/port
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      debug: true, // Enable debug logs
      logger: true // Enable logger
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

const transporter = createTransporter();

// Verify email configuration
const verifyEmailConfig = async () => {
  if (!transporter) {
    console.log('📧 Using simulated email (no transporter)');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    console.log('📧 Will use simulated email for development');
    return false;
  }
};

// Call verification on startup
verifyEmailConfig();

// Send OTP email
exports.sendOTPEmail = async (email, otp) => {
  try {
    console.log(`📧 Attempting to send OTP to: ${email}`);
    
    if (!transporter || !process.env.EMAIL_PASS) {
      console.log(`📧 SIMULATED - OTP for ${email}: ${otp}`);
      console.log(`📧 In production, this would be sent to ${email}`);
      return;
    }

    const mailOptions = {
      from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Account - Traveler Friend',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
                .content { background: #f9f9f9; padding: 30px; }
                .otp-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 20px 0; }
                .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Traveler Friend! ✈️</h1>
                </div>
                <div class="content">
                    <h2>Verify Your Email Address</h2>
                    <p>Thank you for registering with Traveler Friend. To complete your registration, please verify your email address using the OTP below:</p>
                    
                    <div class="otp-box">
                        <p>Your One-Time Password (OTP):</p>
                        <div class="otp-code">${otp}</div>
                        <p>This OTP is valid for 10 minutes only.</p>
                    </div>
                    
                    <p>Enter this OTP in the verification screen to complete your registration.</p>
                    
                    <p>If you didn't create an account with Traveler Friend, please ignore this email.</p>
                    
                    <p>Happy Travels! 🌍</p>
                    <p><strong>The Traveler Friend Team</strong></p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>© ${new Date().getFullYear()} Traveler Friend. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}: ${otp}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.log(`📧 FALLBACK - Simulated OTP for ${email}: ${otp}`);
    console.log('For testing, use this OTP:', otp);
    
    // In development, we don't throw error so registration continues
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Failed to send OTP email');
    }
  }
};

// Send welcome email after verification
exports.sendWelcomeEmail = async (email, name) => {
  try {
    console.log(`📧 Attempting to send welcome email to: ${email}`);
    
    if (!transporter || !process.env.EMAIL_PASS) {
      console.log(`📧 SIMULATED - Welcome email for ${name} (${email})`);
      return;
    }

    const mailOptions = {
      from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Traveler Friend! 🎉 Your Account is Verified',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; color: white; }
                .content { background: #f9f9f9; padding: 30px; }
                .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome Aboard, ${name}! 🚀</h1>
                </div>
                <div class="content">
                    <h2>Your Account is Now Verified! ✅</h2>
                    <p>Congratulations! Your Traveler Friend account has been successfully verified and activated.</p>
                    <p>You can now log in and start exploring amazing destinations.</p>
                    <p>If you have any questions, feel free to contact our support team.</p>
                    <p>Happy Travels! ✈️</p>
                    <p><strong>The Traveler Friend Team</strong></p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Traveler Friend. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
  }
};