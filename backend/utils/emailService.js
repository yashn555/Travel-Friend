// backend/utils/emailService.js

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

let transporter = null;
let emailProvider = 'simulation';

/* ================================
   INITIALIZE EMAIL SERVICE
================================ */
const initEmailService = () => {
  console.log('\n📧 ===== EMAIL SERVICE INITIALIZATION =====');

  // ✅ Prefer SendGrid if API key exists (Render / Production)
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    emailProvider = 'sendgrid';
    console.log('✅ SendGrid email provider enabled');
    return;
  }

  // ✅ Fallback to Gmail for local development
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log('⚠️ Email credentials missing');
    console.log('📧 Running in SIMULATION MODE');
    return;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: { rejectUnauthorized: false }
  });

  emailProvider = 'gmail';
  console.log('✅ Gmail transporter created');
};

initEmailService();

/* ================================
   VERIFY EMAIL (non-blocking)
================================ */
const verifyEmailConfig = async () => {
  try {
    if (emailProvider === 'gmail' && transporter) {
      console.log('🔍 Verifying Gmail transporter...');
      await transporter.verify();
      console.log('✅ Gmail email verified');
    } else if (emailProvider === 'sendgrid') {
      console.log('✅ SendGrid ready (no SMTP verification needed)');
    } else {
      console.log('📧 Simulation mode active');
    }
  } catch (err) {
    console.error('❌ Email verification failed:', err.message);
  }
};

setTimeout(verifyEmailConfig, 2000);

/* ================================
   SEND OTP EMAIL
================================ */
exports.sendOTPEmail = async (email, otp) => {
  console.log('\n📧 ===== SENDING OTP EMAIL =====');
  console.log(`Recipient: ${email}`);
  console.log(`💡 OTP: ${otp}`);

  const subject = '🔐 Your OTP for Traveler Friend Account Verification';

  const html = `<!DOCTYPE html>
  <html>
  <body>
    <h2>Your OTP is:</h2>
    <h1 style="letter-spacing:8px;">${otp}</h1>
    <p>Valid for ${process.env.OTP_EXPIRE_MINUTES} minutes.</p>
    <p>Never share this OTP with anyone.</p>
  </body>
  </html>`;

  try {
    // ✅ SendGrid
    if (emailProvider === 'sendgrid') {
      await sgMail.send({
        to: email,
        from: process.env.EMAIL_FROM,
        subject,
        html
      });

      console.log('✅ OTP email sent via SendGrid');
      return;
    }

    // ✅ Gmail
    if (emailProvider === 'gmail' && transporter) {
      await transporter.sendMail({
        from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html
      });

      console.log('✅ OTP email sent via Gmail');
      return;
    }

    // 🧪 Simulation
    console.log('📧 Simulation mode: OTP shown in console');

  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    console.log(`💡 OTP fallback: ${otp}`);

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Failed to send OTP email');
    }
  }
};

/* ================================
   SEND WELCOME EMAIL
================================ */
exports.sendWelcomeEmail = async (email, name) => {
  const subject = '🎉 Welcome to Traveler Friend!';
  const html = `<h2>Welcome ${name}!</h2><p>Your account is verified.</p>`;

  try {
    if (emailProvider === 'sendgrid') {
      await sgMail.send({
        to: email,
        from: process.env.EMAIL_FROM,
        subject,
        html
      });
      console.log('✅ Welcome email sent via SendGrid');
      return;
    }

    if (emailProvider === 'gmail' && transporter) {
      await transporter.sendMail({
        from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html
      });
      console.log('✅ Welcome email sent via Gmail');
    }
  } catch (err) {
    console.error('❌ Welcome email failed:', err.message);
  }
};
