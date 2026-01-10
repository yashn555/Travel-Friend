const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Send response with token
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  const options = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    ),
    httpOnly: true
  };
  
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isVerified: user.isVerified,
        role: user.role
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {  // REMOVED 'next' parameter
  try {
    console.log('📝 Registration attempt for:', req.body.email);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { name, email, mobile, password } = req.body;
    
    console.log('🔍 Checking for existing user...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobile }] 
    });
    
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile number'
      });
    }
    
    console.log('✅ No existing user found, creating new user...');
    
    // Create user
    const user = await User.create({
      name,
      email,
      mobile,
      password
    });
    
    console.log('✅ User created in DB:', user._id);
    
    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    console.log('🔑 Generated OTP:', otp);
    
    // Send OTP via email
    console.log('📧 Sending OTP email...');
    await sendOTPEmail(email, otp);
    
    // Send response
    console.log('✅ Registration successful for:', email);
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for OTP.',
      userId: user._id,
      email: user.email,
      otp: otp // Always include OTP for testing
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Server error during registration';
    
    if (error.code === 11000) {
      // MongoDB duplicate key error
      if (error.keyValue && error.keyValue.email) {
        errorMessage = 'Email already exists';
      } else if (error.keyValue && error.keyValue.mobile) {
        errorMessage = 'Mobile number already exists';
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  // DO NOT call next() here
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {  // REMOVED 'next' parameter
  try {
    const { userId, otp } = req.body;
    
    console.log('🔐 OTP Verification Request:', { userId, otp });
    
    if (!userId || !otp) {
      console.log('❌ Missing fields');
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register again.'
      });
    }
    
    console.log('👤 User found:', user.email);
    
    // Check if user is already verified
    if (user.isVerified) {
      console.log('ℹ️ User already verified');
      return res.status(400).json({
        success: false,
        message: 'User is already verified. Please login.'
      });
    }
    
    // Check if OTP exists
    if (!user.otp || !user.otp.code) {
      console.log('❌ No OTP found');
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }
    
    console.log('🔍 Checking OTP...');
    
    // Verify OTP
    const isOTPValid = user.isOTPValid(otp);
    
    if (!isOTPValid) {
      console.log('❌ Invalid or expired OTP');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    console.log('✅ OTP verified successfully');
    
    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.clearOTP();
    await user.save();
    
    console.log('✅ User marked as verified');
    
    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log('✅ Welcome email sent');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError.message);
    }
    
    // Send token response
    return sendTokenResponse(user, 200, res);
    
  } catch (error) {
    console.error('❌ OTP verification error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  // DO NOT call next() here
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {  // REMOVED 'next' parameter
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { email, password } = req.body;
    
    console.log('🔑 Login attempt for:', email);
    
    // Find user by email with password selected
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      console.log('❌ User not verified');
      return res.status(401).json({
        success: false,
        message: 'Please verify your account first'
      });
    }
    
    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('✅ Login successful');
    
    // Send token response
    return sendTokenResponse(user, 200, res);
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  // DO NOT call next() here
};

// Other functions remain the same but REMOVE 'next' parameter
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('🔄 Resend OTP request');
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.isVerified) {
      console.log('ℹ️ User already verified');
      return res.status(400).json({
        success: false,
        message: 'User is already verified'
      });
    }
    
    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();
    console.log('🔑 New OTP:', otp);
    
    // Send OTP via email
    await sendOTPEmail(user.email, otp);
    
    console.log('✅ New OTP sent');
    
    return res.status(200).json({
      success: true,
      message: 'New OTP sent to your email',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
    
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while resending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};