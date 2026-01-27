// backend/models/Group.js
const mongoose = require('mongoose');

// 🔥 UPDATED: Invitation Schema
const invitationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  }
}, { _id: true }); // Ensure invitations have their own _id

const GroupSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true,
    trim: true
  },

  // 🔥 NEW: Starting Location (required for route planning)
  startingLocation: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },

  // 🔥 NEW: Destination with coordinates
  destinationLocation: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
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
  
  autoCreated: {
  type: Boolean,
  default: false
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
  
  // 🔥 UPDATED: Invitations using the new schema
  invitations: [invitationSchema],

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

// 🔥 NEW: Calculate distance between start and destination (in km)
GroupSchema.virtual('distance').get(function() {
  if (!this.startingLocation || !this.destinationLocation) {
    return 0;
  }
  
  const start = this.startingLocation.coordinates;
  const dest = this.destinationLocation.coordinates;
  
  // Haversine formula to calculate distance
  const R = 6371; // Earth's radius in km
  const dLat = (dest.lat - start.lat) * Math.PI / 180;
  const dLng = (dest.lng - start.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(start.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
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
    
    // Calculate distance between start and destination
    if (groupObj.startingLocation && groupObj.destinationLocation) {
      const start = groupObj.startingLocation.coordinates;
      const dest = groupObj.destinationLocation.coordinates;
      
      // Haversine formula
      const R = 6371;
      const dLat = (dest.lat - start.lat) * Math.PI / 180;
      const dLng = (dest.lng - start.lng) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(start.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      groupObj.distanceKm = Math.round(R * c);
    }
    
  } catch (error) {
    console.error('Error in getEnhancedData:', error);
    groupObj.availableSlots = groupObj.maxMembers || 0;
    groupObj.isFull = false;
    groupObj.currentMembersCount = 0;
    groupObj.averageRating = 0;
    groupObj.distanceKm = 0;
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

// 🔥 NEW: Add invitation method
GroupSchema.methods.addInvitation = function(userId, invitedBy, message = '') {
  // Check if invitation already exists and is pending
  const existingInvitation = this.invitations.find(inv => 
    inv.user.toString() === userId.toString() && inv.status === 'pending'
  );
  
  // Check if user is already a member
  const isMember = this.currentMembers.find(m => 
    m.user.toString() === userId.toString() && m.status === 'approved'
  );
  
  if (!existingInvitation && !isMember) {
    this.invitations.push({
      user: userId,
      invitedBy: invitedBy,
      message: message,
      status: 'pending',
      invitedAt: new Date(),
      notificationSent: false,
      emailSent: false
    });
    return true;
  }
  return false;
};

// 🔥 NEW: Handle invitation method
GroupSchema.methods.handleInvitation = function(invitationId, action) {
  const invitation = this.invitations.id(invitationId);
  
  if (!invitation || invitation.status !== 'pending') {
    return false;
  }
  
  if (action === 'accept') {
    // Check if group is full
    const approvedMembers = this.currentMembers.filter(m => m.status === 'approved');
    if (approvedMembers.length >= this.maxMembers) {
      return false;
    }
    
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    this.addMember(invitation.user);
    return true;
    
  } else if (action === 'decline') {
    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    return true;
  }
  
  return false;
};

// 🔥 NEW: Mark invitation as expired
GroupSchema.methods.expireInvitation = function(invitationId) {
  const invitation = this.invitations.id(invitationId);
  
  if (!invitation || invitation.status !== 'pending') {
    return false;
  }
  
  invitation.status = 'expired';
  return true;
};

// Add this method to your GroupSchema methods:

// 🔥 NEW: Auto-complete past trips
GroupSchema.methods.autoCompleteIfPast = function() {
  const now = new Date();
  const endDate = new Date(this.endDate);
  
  // If trip ended in the past and is not already completed/cancelled
  if (endDate < now && 
      this.status !== 'completed' && 
      this.status !== 'cancelled') {
    
    console.log(`🔄 Auto-completing trip ${this._id} (ended on ${this.endDate})`);
    this.status = 'completed';
    return true;
  }
  
  return false;
};

// Add this static method to auto-complete all past trips for a user
GroupSchema.statics.completeUserPastTrips = async function(userId) {
  try {
    const now = new Date();
    const pastTrips = await this.find({
      $or: [
        { createdBy: userId },
        { 'currentMembers.user': userId, 'currentMembers.status': 'approved' }
      ],
      endDate: { $lt: now },
      status: { $in: ['planning', 'confirmed', 'active'] }
    });
    
    let completedCount = 0;
    for (const trip of pastTrips) {
      trip.status = 'completed';
      await trip.save();
      completedCount++;
      
      // Add to user's pastTrips
      const User = require('./User');
      const user = await User.findById(userId);
      if (user) {
        const tripExists = user.pastTrips.some(pt => 
          pt._id && pt._id.toString() === trip._id.toString()
        );
        
        if (!tripExists) {
          user.pastTrips.push({
            _id: trip._id,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            groupSize: trip.currentMembers.filter(m => m.status === 'approved').length,
            description: trip.description,
            budget: trip.budget,
            status: 'completed',
            isCreator: trip.createdBy.toString() === userId.toString()
          });
          await user.save();
        }
      }
    }
    
    console.log(`✅ Auto-completed ${completedCount} past trips for user ${userId}`);
    return completedCount;
    
  } catch (error) {
    console.error('Error auto-completing past trips:', error);
    return 0;
  }
};
// 🔥 NEW: Auto-complete past trips (Add at the end of the file, before module.exports)
GroupSchema.statics.autoUpdateAllPastTrips = async function() {
  try {
    const now = new Date();
    console.log(`🔄 [AUTO-COMPLETE] Checking for past trips at ${now}`);
    
    // Find trips that ended in the past but aren't marked as completed
    const result = await this.updateMany(
      {
        endDate: { $lt: now },
        status: { $in: ['planning', 'confirmed', 'active'] }
      },
      {
        $set: { 
          status: 'completed',
          updatedAt: now
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ [AUTO-COMPLETE] Updated ${result.modifiedCount} trips to 'completed' status`);
    }
    
    return result.modifiedCount;
    
  } catch (error) {
    console.error('❌ [AUTO-COMPLETE] Error:', error);
    return 0;
  }
};

// 🔥 NEW: Check and auto-complete a single trip
GroupSchema.methods.checkAndAutoComplete = function() {
  try {
    const now = new Date();
    const endDate = new Date(this.endDate);
    
    // If trip ended in the past and is not already completed/cancelled
    if (endDate < now && 
        this.status !== 'completed' && 
        this.status !== 'cancelled') {
      
      console.log(`🔄 Auto-completing trip ${this._id} (ended on ${this.endDate})`);
      this.status = 'completed';
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Error in checkAndAutoComplete:', error);
    return false;
  }
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
// 🔥 NEW: Index for location-based search
GroupSchema.index({ 'startingLocation.coordinates': '2dsphere' });
GroupSchema.index({ 'destinationLocation.coordinates': '2dsphere' });
// 🔥 NEW: Index for invitations
GroupSchema.index({ 'invitations.user': 1 });
GroupSchema.index({ 'invitations.status': 1 });
GroupSchema.index({ 'invitations.invitedAt': 1 });

module.exports = mongoose.model('Group', GroupSchema);