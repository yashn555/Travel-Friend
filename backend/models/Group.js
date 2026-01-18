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
    maxlength: 1000
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

  groupType: {
    type: String,
    enum: ['anonymous', 'known'],
    default: 'anonymous'
  },

  tags: [String],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: ['planning', 'confirmed', 'completed', 'cancelled'],
    default: 'planning'
  },

  isFull: {
    type: Boolean,
    default: false
  },
  
  availableSlots: {
    type: Number
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: false }, // Disable virtuals in toJSON
  toObject: { virtuals: false } // Disable virtuals in toObject
});

// 🔥 FIXED: SAFE VIRTUAL FOR AVAILABLE SLOTS
GroupSchema.virtual('availableSlotsCalc').get(function() {
  // Always check if currentMembers exists
  if (!this.currentMembers || !Array.isArray(this.currentMembers)) {
    return this.maxMembers || 0;
  }
  
  // Safely filter approved members
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
  } catch (error) {
    console.error('Error in pre-save middleware:', error);
    this.availableSlots = this.maxMembers || 0;
    this.isFull = false;
  }
  next();
});

// 🔥 FIXED: MANUAL METHOD TO GET ENHANCED DATA
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
  } catch (error) {
    console.error('Error in getEnhancedData:', error);
    groupObj.availableSlots = groupObj.maxMembers || 0;
    groupObj.isFull = false;
    groupObj.currentMembersCount = 0;
  }
  
  return groupObj;
};

// 🔥 INDEXES FOR BETTER PERFORMANCE
GroupSchema.index({ status: 1, endDate: 1 });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ 'currentMembers.user': 1 });

module.exports = mongoose.model('Group', GroupSchema);