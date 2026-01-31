// backend/routes/emailStatus.js - CREATE THIS FILE
const express = require('express');
const router = express.Router();
const { sendOTPEmail, getEmailStatus } = require('../utils/emailService');

// GET email service status
router.get('/status', async (req, res) => {
  try {
    console.log('\n📧 Checking email service status...');
    
    const status = getEmailStatus ? getEmailStatus() : { 
      error: 'getEmailStatus function not available',
      emailUser: process.env.EMAIL_USER ? 'Set' : 'Not set',
      emailPass: process.env.EMAIL_PASS ? 'Set' : 'Not set'
    };
    
    // Send a test email if requested
    let testResult = null;
    if (req.query.test === 'true' || req.query.email) {
      const testEmail = req.query.email || 'yashnagapure25@gmail.com';
      const testOTP = '123456';
      
      console.log(`🧪 Testing email to: ${testEmail}`);
      testResult = await sendOTPEmail(testEmail, testOTP);
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        EMAIL_USER: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'Not set',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'Set (' + process.env.EMAIL_PASS.length + ' chars)' : 'Not set',
        OTP_EXPIRE_MINUTES: process.env.OTP_EXPIRE_MINUTES || '10'
      },
      status: status,
      testResult: testResult,
      endpoints: {
        register: 'POST /api/auth/register',
        verifyOTP: 'POST /api/auth/verify-otp',
        resendOTP: 'POST /api/auth/resend-otp'
      }
    });
    
  } catch (error) {
    console.error('❌ Email status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check email status'
    });
  }
});

// Test email sending
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    console.log(`\n📧 Testing email to: ${email}`);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await sendOTPEmail(email, otp);
    
    res.json({
      success: result.success,
      message: result.simulated 
        ? 'Simulation mode - OTP shown in console'
        : 'Test email sent successfully',
      result: result,
      otp: result.simulated ? otp : undefined
    });
    
  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;