// backend/models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    maxlength: 2000 // Increased for detailed descriptions
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'INR' }
  },

  maxMembers: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },

  currentMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['approved'],
      default: 'approved'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['creator', 'member'],
      default: 'member'
    }
  }],

  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // 🔥 ENHANCED: Group Privacy & Type
  groupType: {
    type: String,
    enum: ['open', 'verified', 'invite', 'friends', 'anonymous'],
    default: 'open'
  },
  
  privacy: {
    type: String,
    enum: ['public', 'private', 'hidden'],
    default: 'public'
  },

  tags: [String],
  
  // 🔥 NEW: Interests
  interests: [{
    type: String,
    trim: true
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: ['planning', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },

  isFull: {
    type: Boolean,
    default: false
  },
  
  availableSlots: {
    type: Number
  },
  
  // 🔥 ENHANCED: Travel Preferences Object
  travelPreferences: {
    // Travel Styles (Multi-select)
    travelStyle: [{
      type: String,
      enum: [
        'adventure', 'luxury', 'budget', 'backpacking', 
        'solo', 'family', 'digital_nomad', 'slow_travel'
      ]
    }],
    
    // Accommodation
    accommodationType: {
      type: String,
      enum: ['hotel', 'hostel', 'airbnb', 'camping', 'couchsurfing', 'resort'],
      default: 'hotel'
    },
    
    // Transport Modes (Multi-select)
    transportMode: [{
      type: String,
      enum: ['flight', 'train', 'bus', 'car', 'bike', 'hitchhiking', 'walking']
    }],
    
    // Lifestyle Preferences
    smokingAllowed: {
      type: String,
      enum: ['no', 'outside', 'yes'],
      default: 'no'
    },
    
    drinkingAllowed: {
      type: String,
      enum: ['no', 'social', 'yes'],
      default: 'social'
    },
    
    petsAllowed: {
      type: String,
      enum: ['no', 'small', 'yes'],
      default: 'no'
    },
    
    genderPreference: {
      type: String,
      enum: ['any', 'male', 'female', 'mixed', 'lgbtq'],
      default: 'any'
    },
    
    // Age preferences
    ageRange: {
      min: { type: Number, min: 18, max: 100 },
      max: { type: Number, min: 18, max: 100 }
    }
  },
  
  // 🔥 NEW: Trip Itinerary (Optional)
  itinerary: [{
    day: Number,
    date: Date,
    location: String,
    activities: [String],
    notes: String
  }],
  
  // 🔥 NEW: Meeting Point
  meetingPoint: {
    location: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    dateTime: Date
  },
  
  // 🔥 NEW: Photos
  photos: [{
    url: String,
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 🔥 NEW: Ratings & Reviews
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 🔥 NEW: Average Rating (Virtual)
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: false },
  toObject: { virtuals: false }
});

// 🔥 FIXED: SAFE VIRTUAL FOR AVAILABLE SLOTS
GroupSchema.virtual('availableSlotsCalc').get(function() {
  if (!this.currentMembers || !Array.isArray(this.currentMembers)) {
    return this.maxMembers || 0;
  }
  
  const approvedMembers = this.currentMembers.filter(m => 
    m && m.status === 'approved'
  );
  
  return (this.maxMembers || 0) - approvedMembers.length;
});

// 🔥 FIXED: SAFE VIRTUAL FOR IS FULL
GroupSchema.virtual('isFullCalc').get(function() {
  const slots = this.availableSlotsCalc;
  return slots <= 0;
});

// 🔥 ENHANCED: Calculate average rating
GroupSchema.virtual('avgRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) {
    return 0;
  }
  
  const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
  return sum / this.ratings.length;
});

// 🔥 FIXED: MIDDLEWARE TO UPDATE AVAILABLE SLOTS AND IS FULL
GroupSchema.pre('save', function(next) {
  try {
    if (this.currentMembers && Array.isArray(this.currentMembers)) {
      const approvedMembers = this.currentMembers.filter(m => 
        m && m.status === 'approved'
      );
      this.availableSlots = (this.maxMembers || 0) - approvedMembers.length;
      this.isFull = this.availableSlots <= 0;
    } else {
      this.availableSlots = this.maxMembers || 0;
      this.isFull = false;
    }
    
    // Update average rating
    if (this.ratings && Array.isArray(this.ratings) && this.ratings.length > 0) {
      const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
      this.averageRating = sum / this.ratings.length;
    }
    
  } catch (error) {
    console.error('Error in pre-save middleware:', error);
    this.availableSlots = this.maxMembers || 0;
    this.isFull = false;
  }
  next();
});

// 🔥 ENHANCED: MANUAL METHOD TO GET ENHANCED DATA
GroupSchema.methods.getEnhancedData = function() {
  const groupObj = this.toObject();
  
  try {
    // Calculate available slots
    if (groupObj.currentMembers && Array.isArray(groupObj.currentMembers)) {
      const approvedMembers = groupObj.currentMembers.filter(m => 
        m && m.status === 'approved'
      );
      groupObj.availableSlots = (groupObj.maxMembers || 0) - approvedMembers.length;
      groupObj.isFull = groupObj.availableSlots <= 0;
      groupObj.currentMembersCount = approvedMembers.length;
    } else {
      groupObj.availableSlots = groupObj.maxMembers || 0;
      groupObj.isFull = false;
      groupObj.currentMembersCount = 0;
    }
    
    // Calculate average rating
    if (groupObj.ratings && Array.isArray(groupObj.ratings) && groupObj.ratings.length > 0) {
      const sum = groupObj.ratings.reduce((total, rating) => total + rating.rating, 0);
      groupObj.averageRating = sum / groupObj.ratings.length;
    } else {
      groupObj.averageRating = 0;
    }
    
    // Calculate trip duration in days
    if (groupObj.startDate && groupObj.endDate) {
      const start = new Date(groupObj.startDate);
      const end = new Date(groupObj.endDate);
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      groupObj.durationDays = duration > 0 ? duration : 1;
    }
    
    // Calculate days until trip starts
    if (groupObj.startDate) {
      const today = new Date();
      const start = new Date(groupObj.startDate);
      const daysUntil = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      groupObj.daysUntilStart = daysUntil > 0 ? daysUntil : 0;
      groupObj.isUpcoming = daysUntil > 0;
      groupObj.isActive = daysUntil <= 0 && groupObj.status === 'confirmed';
    }
    
  } catch (error) {
    console.error('Error in getEnhancedData:', error);
    groupObj.availableSlots = groupObj.maxMembers || 0;
    groupObj.isFull = false;
    groupObj.currentMembersCount = 0;
    groupObj.averageRating = 0;
  }
  
  return groupObj;
};

// 🔥 NEW: Add member to group
GroupSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.currentMembers.find(m => 
    m.user.toString() === userId.toString()
  );
  
  if (!existingMember) {
    this.currentMembers.push({
      user: userId,
      status: 'approved',
      role: role,
      joinedAt: new Date()
    });
    return true;
  }
  return false;
};

// 🔥 NEW: Remove member from group
GroupSchema.methods.removeMember = function(userId) {
  const initialLength = this.currentMembers.length;
  this.currentMembers = this.currentMembers.filter(m => 
    m.user.toString() !== userId.toString()
  );
  return this.currentMembers.length < initialLength;
};

// 🔥 NEW: Add join request
GroupSchema.methods.addJoinRequest = function(userId, message = '') {
  const existingRequest = this.joinRequests.find(r => 
    r.user.toString() === userId.toString() && r.status === 'pending'
  );
  
  const isMember = this.currentMembers.find(m => 
    m.user.toString() === userId.toString() && m.status === 'approved'
  );
  
  if (!existingRequest && !isMember) {
    this.joinRequests.push({
      user: userId,
      message: message || 'I would like to join your travel group',
      status: 'pending',
      requestedAt: new Date()
    });
    return true;
  }
  return false;
};

// 🔥 NEW: Handle join request
GroupSchema.methods.handleJoinRequest = function(requestId, action) {
  const request = this.joinRequests.id(requestId);
  
  if (!request || request.status !== 'pending') {
    return false;
  }
  
  if (action === 'approve') {
    // Check if group is full
    const approvedMembers = this.currentMembers.filter(m => m.status === 'approved');
    if (approvedMembers.length >= this.maxMembers) {
      return false;
    }
    
    request.status = 'approved';
    this.addMember(request.user);
    return true;
    
  } else if (action === 'reject') {
    request.status = 'rejected';
    return true;
  }
  
  return false;
};

// 🔥 ENHANCED INDEXES FOR BETTER PERFORMANCE
GroupSchema.index({ status: 1, endDate: 1 });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ 'currentMembers.user': 1 });
GroupSchema.index({ destination: 'text', description: 'text', tags: 'text' });
GroupSchema.index({ 'travelPreferences.travelStyle': 1 });
GroupSchema.index({ 'travelPreferences.interests': 1 });
GroupSchema.index({ 'travelPreferences.genderPreference': 1 });
GroupSchema.index({ startDate: 1 });
GroupSchema.index({ 'budget.min': 1, 'budget.max': 1 });

module.exports = mongoose.model('Group', GroupSchema);