const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validationMiddleware = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post(
  '/register',
  validationMiddleware.registerValidation,
  authController.register  // No need for error handler
);

router.post(
  '/login',
  validationMiddleware.loginValidation,
  authController.login  // No need for error handler
);

router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Protected routes
router.get('/me', authMiddleware.protect, authController.getMe);
router.get('/logout', authMiddleware.protect, authController.logout);

module.exports = router;