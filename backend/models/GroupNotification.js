// backend/models/GroupNotification.js
const mongoose = require('mongoose');

const groupNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['trip_update', 'invitation_response', 'trip_update', 'member_update', 'trip_reminder'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitation: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
  }
}, {
  timestamps: true
});

// Indexes for performance
groupNotificationSchema.index({ recipient: 1, createdAt: -1 });
groupNotificationSchema.index({ recipient: 1, isRead: 1 });
groupNotificationSchema.index({ group: 1, type: 1 });
groupNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const GroupNotification = mongoose.model('GroupNotification', groupNotificationSchema);

module.exports = GroupNotification;