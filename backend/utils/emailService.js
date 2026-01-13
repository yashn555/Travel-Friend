const nodemailer = require('nodemailer');

// Function to create email transporter
const createTransporter = () => {
  try {
    console.log('\n📧 ===== EMAIL SERVICE INITIALIZATION =====');
    console.log('Checking email configuration...');
    
    // Check if required environment variables are set
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass) {
      console.log('❌ Email credentials are missing in .env file');
      console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
      console.log('📧 Running in SIMULATION MODE - OTPs will be shown in console');
      return null;
    }
    
    console.log('✅ Email credentials found');
    console.log('📧 Email User:', emailUser);
    console.log('🔐 Email Password:', '••••••••');
    
    // Create transporter with Gmail configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false // For development
      },
      debug: true // Enable debug output
    });
    
    console.log('✅ Email transporter created successfully');
    return transporter;
    
  } catch (error) {
    console.error('❌ Error creating email transporter:', error.message);
    console.log('📧 Falling back to simulation mode');
    return null;
  }
};

// Create transporter
const transporter = createTransporter();

// Verify email configuration
const verifyEmailConfig = async () => {
  if (!transporter) {
    console.log('\n📧 EMAIL STATUS: Simulation Mode');
    console.log('   OTPs will be shown in console for testing');
    console.log('===========================================\n');
    return false;
  }

  try {
    console.log('\n🔍 Verifying email server connection...');
    await transporter.verify();
    console.log('✅ Email server connection successful!');
    console.log('✅ Real emails will be sent to users');
    console.log('===========================================\n');
    return true;
  } catch (error) {
    console.error('❌ Email server verification failed:', error.message);
    console.log('📧 Running in simulation mode');
    console.log('   OTPs will be shown in console for testing');
    console.log('===========================================\n');
    return false;
  }
};

// Call verification on startup (with delay to let server start)
setTimeout(() => {
  verifyEmailConfig();
}, 2000);

// Send OTP email
exports.sendOTPEmail = async (email, otp) => {
  try {
    console.log(`\n📧 ===== SENDING OTP EMAIL =====`);
    console.log(`Recipient: ${email}`);
    console.log(`OTP Code: ${otp}`);
    
    // Always log OTP to console (for development/testing)
    console.log(`💡 IMPORTANT: OTP for ${email} is: ${otp}`);
    
    // Check if we have a valid transporter
    if (!transporter) {
      console.log('📧 Simulation Mode: Email not sent');
      console.log('   OTP is logged above for testing');
      console.log('===========================================\n');
      return null;
    }
    
    // Prepare email content
    const mailOptions = {
      from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your OTP for Traveler Friend Account Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }
                .otp-box {
                    background: white;
                    padding: 25px;
                    text-align: center;
                    margin: 25px 0;
                    border-radius: 8px;
                    border: 2px solid #667eea;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .otp-code {
                    font-size: 42px;
                    font-weight: bold;
                    color: #667eea;
                    letter-spacing: 8px;
                    margin: 20px 0;
                    font-family: 'Courier New', monospace;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }
                .note {
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 12px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to Traveler Friend! ✈️</h1>
            </div>
            <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Hello Traveler,</p>
                <p>Thank you for registering with Traveler Friend. To complete your registration, please use the One-Time Password (OTP) below:</p>
                
                <div class="otp-box">
                    <h3>Your Verification Code</h3>
                    <div class="otp-code">${otp}</div>
                    <p><strong>Valid for 10 minutes</strong></p>
                </div>
                
                <div class="note">
                    <strong>⚠️ Security Alert:</strong> Never share this OTP with anyone. Traveler Friend will never ask for your OTP.
                </div>
                
                <h3>How to use this OTP:</h3>
                <ol>
                    <li>Copy the 6-digit code above</li>
                    <li>Return to the Traveler Friend website</li>
                    <li>Enter the code in the verification page</li>
                    <li>Click "Verify Account" to complete registration</li>
                </ol>
                
                <p>If you didn't request this, please ignore this email.</p>
                
                <p>Happy Travels! 🌍</p>
                <p><strong>The Traveler Friend Team</strong></p>
                
                <div class="footer">
                    <p>This is an automated message. Please do not reply.</p>
                    <p>© ${new Date().getFullYear()} Traveler Friend</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `Welcome to Traveler Friend!\n\nYour OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nEnter this code on the verification page to complete your registration.\n\nIf you didn't create an account, please ignore this email.\n\nHappy Travels!\nThe Traveler Friend Team`
    };

    console.log('📧 Attempting to send real email...');
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ REAL EMAIL SENT SUCCESSFULLY!');
    console.log(`📧 To: ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Preview URL: https://mail.google.com/mail/u/0/#all`);
    console.log('===========================================\n');
    
    return info;
    
  } catch (error) {
    console.error('❌ ERROR SENDING EMAIL:', error.message);
    console.log(`💡 OTP for ${email} (email failed): ${otp}`);
    console.log('📧 Running in fallback mode');
    console.log('===========================================\n');
    
    // Don't crash the app if email fails
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Failed to send OTP email');
    }
    
    return null;
  }
};

// Send welcome email after verification
exports.sendWelcomeEmail = async (email, name) => {
  try {
    console.log(`\n📧 Sending welcome email to: ${email}`);
    
    if (!transporter) {
      console.log('📧 Simulation Mode: Welcome email not sent');
      return;
    }

    const mailOptions = {
      from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to Traveler Friend - Account Verified!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome Aboard, ${name}! 🚀</h1>
                </div>
                <div class="content">
                    <h2>Your Account is Now Verified! ✅</h2>
                    <p>Congratulations! Your Traveler Friend account has been successfully verified and is now active.</p>
                    
                    <h3>🎯 What You Can Do Now:</h3>
                    <ul>
                        <li>🌍 Explore amazing travel destinations</li>
                        <li>📅 Plan your next adventure</li>
                        <li>👥 Connect with fellow travelers</li>
                        <li>⭐ Share your travel experiences</li>
                    </ul>
                    
                    <p>Start your journey now and discover the world!</p>
                    
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
  }
};