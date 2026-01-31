// backend/routes/health.js
const express = require('express');
const router = express.Router();
const { getEmailStatus } = require('../utils/emailService');

// Comprehensive health check
router.get('/health', async (req, res) => {
  try {
    const emailStatus = await getEmailStatus();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        database: 'connected', // Add actual DB check
        email: emailStatus.mode,
        emailVerified: emailStatus.isVerified
      },
      email: emailStatus,
      endpoints: {
        register: 'POST /api/auth/register',
        verifyOTP: 'POST /api/auth/verify-otp',
        login: 'POST /api/auth/login',
        testEmail: 'GET /api/test/email?email=your@email.com'
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;