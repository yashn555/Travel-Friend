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
    }
  }],

  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
  }

}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
