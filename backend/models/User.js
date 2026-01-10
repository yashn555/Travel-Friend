const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  
  mobile: {
    type: String,
    required: [true, 'Please provide your mobile number'],
    unique: true,
    trim: true,
    match: [
      /^[0-9]{10}$/,
      'Please provide a valid 10-digit mobile number'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  otp: {
    code: String,
    expiresAt: Date
  },
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Remove any pre-existing indexes that might cause issues
UserSchema.pre('save', async function(next) {
  // Clean up any undefined or null values
  if (this.email === undefined || this.email === null) {
    return next(new Error('Email is required'));
  }
  if (this.mobile === undefined || this.mobile === null) {
    return next(new Error('Mobile is required'));
  }
  next();
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt timestamp
UserSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// In backend/models/User.js, add these methods:

// Generate OTP method
UserSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  this.otp = {
    code: otp,
    expiresAt: expiresAt
  };
  
  return otp;
};

// Check if OTP is valid
UserSchema.methods.isOTPValid = function(otp) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  const now = new Date();
  const isCodeValid = this.otp.code === otp;
  const isNotExpired = this.otp.expiresAt > now;
  
  return isCodeValid && isNotExpired;
};

// Clear OTP after verification
UserSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Drop problematic indexes before creating new ones
UserSchema.pre('init', async function(next) {
  try {
    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();
    
    // Check for problematic indexes
    for (const index of indexes) {
      if (index.name === 'username_1' || index.key.username) {
        console.log('⚠️ Removing problematic index:', index.name);
        await collection.dropIndex(index.name);
      }
    }
  } catch (error) {
    console.log('No problematic indexes found or could not remove them');
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);