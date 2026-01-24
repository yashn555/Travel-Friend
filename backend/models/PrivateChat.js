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
    next(new Error('Private chat must have exactly 2 participants'));
  }
  next();
});

// Create compound index for participants
privateChatSchema.index({ participants: 1 }, { unique: true });

const PrivateChat = mongoose.model('PrivateChat', privateChatSchema);
module.exports = PrivateChat;