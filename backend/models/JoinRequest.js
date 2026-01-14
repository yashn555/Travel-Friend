// models/JoinRequest.js
const mongoose = require('mongoose');

const JoinRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
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
  },
  respondedAt: {
    type: Date
  },
  responseMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
JoinRequestSchema.index({ user: 1, group: 1 }, { unique: true });
JoinRequestSchema.index({ status: 1, requestedAt: -1 });

module.exports = mongoose.model('JoinRequest', JoinRequestSchema);