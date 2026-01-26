const express = require('express');
const router = express.Router();
const { 
  getMyGroups, 
  leaveGroup, 
  cancelJoinRequest 
} = require('../controllers/userGroupController');
const { protect } = require('../middleware/authMiddleware'); // Fixed import

// @route   GET /api/user-groups/my-groups
// @desc    Get groups user has joined or created
// @access  Private
router.get('/my-groups', protect, getMyGroups);

// @route   DELETE /api/user-groups/leave/:groupId
// @desc    Remove user from a group
// @access  Private
router.delete('/leave/:groupId', protect, leaveGroup);

// @route   DELETE /api/user-groups/cancel-request/:groupId
// @desc    Cancel pending join request
// @access  Private
router.delete('/cancel-request/:groupId', protect, cancelJoinRequest);

module.exports = router;