// backend/routes/inviteRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getConnections,
  inviteToGroup,
  getMyInvitations,
  respondToInvitation
  // Make sure this matches exactly with your controller exports
} = require('../controllers/inviteController');

// Make sure all controller functions are defined
console.log('🔍 Checking inviteController exports:');
console.log('getConnections:', typeof getConnections);
console.log('inviteToGroup:', typeof inviteToGroup);
console.log('getMyInvitations:', typeof getMyInvitations);
console.log('respondToInvitation:', typeof respondToInvitation);

// Get user's connections (followers + following)
router.get('/connections', protect, getConnections);

// Invite friends to group
router.post('/:groupId/send', protect, inviteToGroup);

// Get user's pending invitations
router.get('/my-invitations', protect, getMyInvitations);

// Respond to invitation
router.put('/:invitationId/respond', protect, respondToInvitation);

module.exports = router;