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

  // In your Group.js model, make sure joinRequests schema is correct
joinRequests: [{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // Add required: true
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

  // 🔥 ADD THIS STATUS FIELD
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'completed', 'cancelled'],
    default: 'planning'
  },

  // 🔥 ADD THESE HELPER FIELDS
  isFull: {
    type: Boolean,
    default: false
  },
  
  availableSlots: {
    type: Number
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔥 ADD VIRTUAL FOR AVAILABLE SLOTS
GroupSchema.virtual('availableSlotsCalc').get(function() {
  const approvedMembers = this.currentMembers.filter(m => m.status === 'approved');
  return this.maxMembers - approvedMembers.length;
});

// 🔥 ADD VIRTUAL FOR IS FULL
GroupSchema.virtual('isFullCalc').get(function() {
  return this.availableSlotsCalc <= 0;
});

// 🔥 MIDDLEWARE TO UPDATE AVAILABLE SLOTS AND IS FULL
GroupSchema.pre('save', function(next) {
  const approvedMembers = this.currentMembers.filter(m => m.status === 'approved');
  this.availableSlots = this.maxMembers - approvedMembers.length;
  this.isFull = this.availableSlots <= 0;
  next();
});

// 🔥 INDEXES FOR BETTER PERFORMANCE
GroupSchema.index({ status: 1, endDate: 1 });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ 'currentMembers.user': 1 });

module.exports = mongoose.model('Group', GroupSchema);