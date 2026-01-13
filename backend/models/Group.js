const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  budget: {
    min: {
      type: Number,
      required: [true, 'Minimum budget is required'],
      min: [0, 'Budget cannot be negative']
    },
    max: {
      type: Number,
      required: [true, 'Maximum budget is required'],
      validate: {
        validator: function(value) {
          return value >= this.budget.min;
        },
        message: 'Max budget must be greater than or equal to min budget'
      }
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  maxMembers: {
    type: Number,
    required: [true, 'Maximum members is required'],
    min: [2, 'Minimum 2 members required'],
    max: [20, 'Maximum 20 members allowed']
  },
  
  currentMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  
  groupType: {
    type: String,
    enum: ['anonymous', 'known'],
    default: 'anonymous',
    required: true
  },
  
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'planning'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: String,
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
  
  tags: [{
    type: String,
    enum: ['adventure', 'luxury', 'budget', 'family', 'solo', 'beach', 'mountain', 'cultural']
  }],
  
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

// Virtual for available slots
GroupSchema.virtual('availableSlots').get(function() {
  const approvedMembers = this.currentMembers.filter(m => m.status === 'approved').length;
  return this.maxMembers - approvedMembers;
});

// Virtual for isFull
GroupSchema.virtual('isFull').get(function() {
  return this.availableSlots <= 0;
});

// Indexes for better query performance
GroupSchema.index({ destination: 'text', description: 'text' });
GroupSchema.index({ status: 1, startDate: 1 });
GroupSchema.index({ 'budget.min': 1, 'budget.max': 1 });

module.exports = mongoose.model('Group', GroupSchema);