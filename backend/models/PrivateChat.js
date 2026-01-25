const mongoose = require('mongoose');

const privateChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrivateMessage'
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

// Ensure only 2 participants in private chat
privateChatSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Private chat must have exactly 2 participants'));
  }
  
  // Sort participants to ensure consistent ordering
  this.participants.sort();
  next();
});

// Create compound unique index for participants (sorted)
privateChatSchema.index({ participants: 1 }, { 
  unique: true,
  // Only apply uniqueness for arrays with exactly 2 participants
  partialFilterExpression: {
    $expr: { $eq: [{ $size: "$participants" }, 2] }
  }
});

// Also add an index for finding chats by participant
privateChatSchema.index({ 'participants': 1 });

const PrivateChat = mongoose.model('PrivateChat', privateChatSchema);
module.exports = PrivateChat;