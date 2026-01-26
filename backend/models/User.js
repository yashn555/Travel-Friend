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
  
  upiId: {
    type: String,
    trim: true,
    match: [
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/,
      'Please provide a valid UPI ID (e.g., username@upi)'
    ],
    default: ''
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
  
  coverImage: {
    type: String,
    default: ''
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  // ==================== LOCATION FIELD FOR NEARBY USERS ====================
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: null
    },
    city: String,
    country: String,
    lastUpdated: Date
  },
  
  // Town/City/State details (for display purposes)
  town: {
    type: String,
    trim: true,
    default: ''
  },
  
  city: {
    type: String,
    trim: true,
    default: ''
  },
  
  state: {
    type: String,
    trim: true,
    default: ''
  },
  
  country: {
    type: String,
    trim: true,
    default: 'India'
  },
  
  // Personal Details
  dateOfBirth: {
    type: Date,
    default: null
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  
  // ==================== INTERESTS FOR NEARBY USERS FILTERING ====================
  interests: {
    type: [String],
    default: []
  },
  
  // Social Features
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  following: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'accepted'
    },
    becameFriendsAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  
  // Social Links
  socialLinks: {
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  
  // Travel Preferences Enhanced
  languages: [{
    type: String,
    enum: ['English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Arabic', 'Portuguese', 'Russian']
  }],
  
  travelPreferences: {
    adventure: { type: Boolean, default: false },
    luxury: { type: Boolean, default: false },
    budget: { type: Boolean, default: false },
    solo: { type: Boolean, default: false },
    group: { type: Boolean, default: false },
    beach: { type: Boolean, default: false },
    mountain: { type: Boolean, default: false },
    cultural: { type: Boolean, default: false },
    backpacking: { type: Boolean, default: false },
    roadtrip: { type: Boolean, default: false },
    family: { type: Boolean, default: false },
    soloFemale: { type: Boolean, default: false }
  },
  
  travelExperience: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: 'beginner'
  },
  
  travelBudget: {
    type: String,
    enum: ['budget', 'medium', 'high', 'luxury'],
    default: 'medium'
  },
  
  preferredTransport: [{
    type: String,
    enum: ['flight', 'train', 'bus', 'car', 'bike', 'cruise']
  }],
  
  // Trip History
  pastTrips: [{
    destination: String,
    startDate: Date,
    endDate: Date,
    groupSize: Number,
    notes: String,
    rating: Number,
    photos: [String],
    distance: Number,
    country: String
  }],
  
  upcomingTrips: [{
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    role: {
      type: String,
      enum: ['creator', 'member', 'pending']
    }
  }],
  
  // User Stats
  stats: {
    tripsCount: { type: Number, default: 0 },
    friendsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    countriesVisited: { type: Number, default: 0 }
  },
  
  // ==================== LAST ACTIVE FOR ONLINE STATUS ====================
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  isPremium: {
    type: Boolean,
    default: false
  },
  
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 4.5
  },
  
  reviews: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  notifications: [{
    type: {
      type: String,
      enum: ['join_request', 'trip_update', 'message', 'friend_request', 'follow', 'system'],
      required: true
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  otp: {
    code: String,
    expiresAt: Date
  },
  
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    showOnlineStatus: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true },
    showTripsTo: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends'
    },
    // ==================== PRIVACY FOR LOCATION ====================
    showLocationTo: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends'
    }
  },
  
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  lastSeen: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for followers count
UserSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
UserSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Virtual for friends count
UserSchema.virtual('friendsCount').get(function() {
  return this.friends ? this.friends.filter(f => f.status === 'accepted').length : 0;
});

// Virtual for mutual friends (to be calculated at runtime)
UserSchema.virtual('mutualFriendsCount').get(function() {
  return 0;
});

// ==================== NEW VIRTUAL FOR ONLINE STATUS ====================
UserSchema.virtual('isOnline').get(function() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return this.lastActive >= fifteenMinutesAgo;
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

// Update lastSeen on certain actions
UserSchema.pre('save', function(next) {
  if (this.isModified('lastSeen')) {
    this.lastSeen = Date.now();
  }
  next();
});

// ==================== NEW PRE-SAVE HOOK FOR LOCATION ====================
UserSchema.pre('save', function(next) {
  // Update lastActive when location is updated
  if (this.isModified('location')) {
    this.location.lastUpdated = new Date();
    this.lastActive = new Date();
  }
  
  // Update lastActive on any save (for online status)
  if (!this.isModified('lastActive')) {
    this.lastActive = new Date();
  }
  
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ==================== NEW METHOD FOR LOCATION UPDATE ====================
UserSchema.methods.updateLocation = async function(latitude, longitude, city, country) {
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }
  
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude], // MongoDB GeoJSON format
    city: city || this.location?.city || '',
    country: country || this.location?.country || '',
    lastUpdated: new Date()
  };
  
  this.lastActive = new Date();
  
  // Update city/country fields for backward compatibility
  if (city) this.city = city;
  if (country) this.country = country;
  
  return this.save();
};

// ==================== NEW METHOD FOR GETTING NEARBY USERS ====================
UserSchema.statics.findNearbyUsers = async function(userId, maxDistance = 50, filters = {}) {
  const currentUser = await this.findById(userId);
  
  if (!currentUser.location || !currentUser.location.coordinates) {
    throw new Error('Current user location not found');
  }
  
  const [longitude, latitude] = currentUser.location.coordinates;
  
  const query = {
    _id: { $ne: currentUser._id },
    'location.coordinates': { $exists: true },
    'location.coordinates.0': { $exists: true },
    'location.coordinates.1': { $exists: true }
  };
  
  // Apply privacy settings filter
  query.$or = [
    { 'privacySettings.showLocationTo': 'public' },
    { 
      'privacySettings.showLocationTo': 'friends',
      'friends.user': currentUser._id,
      'friends.status': 'accepted'
    },
    { _id: currentUser._id }
  ];
  
  // Apply interests filter
  if (filters.interests && filters.interests.length > 0) {
    query.interests = { $in: filters.interests };
  }
  
  // Apply online status filter
  if (filters.showOnlineOnly) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    query.lastActive = { $gte: fifteenMinutesAgo };
  }
  
  const nearbyUsers = await this.aggregate([
    {
      $geoNear: {
        near: { 
          type: 'Point', 
          coordinates: [longitude, latitude] 
        },
        distanceField: 'distance',
        spherical: true,
        maxDistance: maxDistance * 1000, // Convert km to meters
        query: query
      }
    },
    {
      $addFields: {
        distance: { $divide: ['$distance', 1000] }, // Convert meters to km
        isOnline: {
          $cond: {
            if: { $gte: ['$lastActive', new Date(Date.now() - 15 * 60 * 1000)] },
            then: true,
            else: false
          }
        },
        mutualInterests: {
          $size: {
            $setIntersection: [
              { $ifNull: [currentUser.interests, []] },
              { $ifNull: ['$interests', []] }
            ]
          }
        }
      }
    },
    {
      $project: {
        password: 0,
        otp: 0,
        notifications: 0,
        friendRequests: 0,
        'friends.message': 0,
        'followers.followedAt': 0,
        'following.followedAt': 0
      }
    },
    {
      $sort: filters.sortBy === 'distance' ? 
        { distance: 1 } : 
        { mutualInterests: -1 }
    },
    {
      $limit: filters.limit || 50
    }
  ]);
  
  return nearbyUsers;
};

// Follow a user
UserSchema.methods.follow = async function(userId) {
  if (this._id.equals(userId)) {
    throw new Error('You cannot follow yourself');
  }
  
  if (!this.following.some(f => f.user.equals(userId))) {
    this.following.push({ user: userId });
    return true;
  }
  return false;
};

// Unfollow a user
UserSchema.methods.unfollow = async function(userId) {
  const index = this.following.findIndex(f => f.user.equals(userId));
  if (index > -1) {
    this.following.splice(index, 1);
    return true;
  }
  return false;
};

// Add follower
UserSchema.methods.addFollower = async function(userId) {
  if (!this.followers.some(f => f.user.equals(userId))) {
    this.followers.push({ user: userId });
    return true;
  }
  return false;
};

// Remove follower
UserSchema.methods.removeFollower = async function(userId) {
  const index = this.followers.findIndex(f => f.user.equals(userId));
  if (index > -1) {
    this.followers.splice(index, 1);
    return true;
  }
  return false;
};

// Send friend request
UserSchema.methods.sendFriendRequest = async function(toUserId, message = '') {
  // Check if already friends
  const isFriend = this.friends.some(f => f.user.equals(toUserId) && f.status === 'accepted');
  if (isFriend) {
    throw new Error('Already friends');
  }
  
  // Check if request already sent
  const existingRequest = this.friendRequests.some(
    req => req.from.equals(toUserId) && req.status === 'pending'
  );
  
  if (!existingRequest) {
    this.friendRequests.push({
      from: toUserId,
      message,
      status: 'pending'
    });
    return true;
  }
  return false;
};

// Accept friend request
UserSchema.methods.acceptFriendRequest = async function(requestId) {
  const request = this.friendRequests.id(requestId);
  if (request && request.status === 'pending') {
    request.status = 'accepted';
    
    // Add to friends list
    this.friends.push({
      user: request.from,
      status: 'accepted'
    });
    
    return true;
  }
  return false;
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

UserSchema.methods.isOTPValid = function(enteredOTP) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  const currentTime = new Date();
  const expiresAt = new Date(this.otp.expiresAt);
  
  console.log(`OTP Verification Details:
    - Entered OTP: ${enteredOTP}
    - Stored OTP: ${this.otp.code}
    - Stored Expiry: ${expiresAt}
    - Current Time: ${currentTime}
    - Is Expired: ${expiresAt <= currentTime}
    - OTP Match: ${this.otp.code === enteredOTP}`);
  
  // Check if OTP matches and is not expired
  return this.otp.code === enteredOTP && expiresAt > currentTime;
};

// Clear OTP method
UserSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Add notification
UserSchema.methods.addNotification = function(type, title, message, from = null, metadata = {}) {
  this.notifications.unshift({
    type,
    from,
    title,
    message,
    read: false,
    createdAt: new Date(),
    metadata
  });
  
  // Keep only last 50 notifications
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(0, 50);
  }
};

// Update stats method
UserSchema.methods.updateStats = function() {
  this.stats = {
    tripsCount: this.pastTrips ? this.pastTrips.length : 0,
    friendsCount: this.friends ? this.friends.filter(f => f.status === 'accepted').length : 0,
    followersCount: this.followers ? this.followers.length : 0,
    followingCount: this.following ? this.following.length : 0,
    totalDistance: this.pastTrips ? this.pastTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0) : 0,
    countriesVisited: this.pastTrips ? [...new Set(this.pastTrips.map(trip => trip.country).filter(Boolean))].length : 0
  };
};

// Check if user follows another user
UserSchema.methods.isFollowing = function(userId) {
  return this.following.some(f => 
    f.user && f.user.toString() === userId.toString()
  );
};

// Check if user is followed by another user
UserSchema.methods.isFollowedBy = function(userId) {
  return this.followers.some(f => 
    f.user && f.user.toString() === userId.toString()
  );
};

// Get clean follow arrays (just user IDs)
UserSchema.methods.getFollowingIds = function() {
  return this.following
    .filter(f => f.user)
    .map(f => f.user.toString());
};

UserSchema.methods.getFollowerIds = function() {
  return this.followers
    .filter(f => f.user)
    .map(f => f.user.toString());
};

// ==================== NEW METHOD FOR GETTING MUTUAL INTERESTS ====================
UserSchema.methods.getMutualInterests = function(otherUser) {
  const userInterests = this.interests || [];
  const otherInterests = otherUser.interests || [];
  
  return userInterests.filter(interest => 
    otherInterests.includes(interest)
  );
};

// Indexes for better performance
UserSchema.index({ name: 'text', bio: 'text', city: 'text', state: 'text' });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ mobile: 1 }, { unique: true });
UserSchema.index({ 'followers.user': 1 });
UserSchema.index({ 'following.user': 1 });
UserSchema.index({ 'friends.user': 1 });
UserSchema.index({ 'pastTrips.destination': 1 });
UserSchema.index({ 'travelPreferences': 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastActive: -1 });
UserSchema.index({ interests: 1 });

// ==================== 2DSPHERE INDEX FOR GEO SPATIAL QUERIES ====================
UserSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('User', UserSchema);