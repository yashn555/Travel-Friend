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
  
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  travelPreferences: {
    adventure: { type: Boolean, default: false },
    luxury: { type: Boolean, default: false },
    budget: { type: Boolean, default: false },
    solo: { type: Boolean, default: false },
    group: { type: Boolean, default: false },
    beach: { type: Boolean, default: false },
    mountain: { type: Boolean, default: false },
    cultural: { type: Boolean, default: false }
  },
  
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 4.5
  },
  
  pastTrips: [{
    destination: String,
    startDate: Date,
    endDate: Date,
    notes: String,
    rating: Number
  }],
  
  notifications: [{
    type: {
      type: String,
      enum: ['join_request', 'trip_update', 'message', 'system'],
      required: true
    },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
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
  return this.otp.code === otp && this.otp.expiresAt > now;
};

// Clear OTP after verification
UserSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Add notification
UserSchema.methods.addNotification = function(type, title, message) {
  this.notifications.unshift({
    type,
    title,
    message,
    read: false,
    createdAt: new Date()
  });
  
  // Keep only last 20 notifications
  if (this.notifications.length > 20) {
    this.notifications = this.notifications.slice(0, 20);
  }
};

module.exports = mongoose.model('User', UserSchema);