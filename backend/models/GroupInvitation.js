const mongoose = require('mongoose');

const groupInvitationSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  respondedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate active invitations
groupInvitationSchema.index({ group: 1, invitee: 1, status: 'pending' }, { unique: true });

// Update updatedAt on save
groupInvitationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

groupInvitationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const GroupInvitation = mongoose.model('GroupInvitation', groupInvitationSchema);

module.exports = GroupInvitation;