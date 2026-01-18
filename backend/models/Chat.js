// backend/models/Chat.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Removed required: true to allow system messages
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Add validation for non-system messages
MessageSchema.pre('validate', function(next) {
  if (!this.isSystemMessage && !this.sender) {
    return next(new Error('Sender is required for non-system messages'));
  }
  next();
});

const ChatSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    unique: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [MessageSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActivity when new message is added
ChatSchema.pre('save', function(next) {
  if (this.isModified('messages') && this.messages.length > 0) {
    this.lastActivity = Date.now();
  }
  next();
});

// Index for faster queries
ChatSchema.index({ group: 1 });
ChatSchema.index({ 'participants': 1 });
ChatSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Chat', ChatSchema);