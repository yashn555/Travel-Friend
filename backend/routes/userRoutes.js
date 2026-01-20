const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

// Public routes (no auth required)
router.get('/profile/:userId', userController.getUserProfile);
router.get('/search', userController.searchUsers);
router.get('/users/stats/:userId', userController.getUserStats);
router.get('/users/followers/:userId', userController.getFollowers);
router.get('/users/following/:userId', userController.getFollowing);
router.get('/users/friends/:userId', userController.getUserFriends);

// Protected routes (auth required)
router.use(auth.protect);

// Profile routes
router.get('/dashboard/profile', userController.getMyProfile);
router.put('/dashboard/profile', userController.updateProfile);
router.post('/dashboard/profile/upload-image', userController.uploadProfileImage);

// Stats routes
router.get('/dashboard/stats', userController.getMyStats);

// Follow system routes
router.post('/users/follow/:userId', userController.followUser);
router.delete('/users/follow/:userId', userController.unfollowUser);
router.get('/dashboard/followers', userController.getMyFollowers);
router.get('/dashboard/following', userController.getMyFollowing);

// Friends system routes
router.get('/dashboard/friends', userController.getMyFriends);
router.post('/users/friend-request/:userId', userController.sendFriendRequest);
router.put('/users/friend-request/accept/:requestId', userController.acceptFriendRequest);
router.put('/users/friend-request/reject/:requestId', userController.rejectFriendRequest);
router.get('/friend-requests', userController.getFriendRequests);
router.delete('/users/friends/:friendshipId', userController.removeFriend);
router.get('/users/suggested', userController.getSuggestedFriends);

// Mutual connections
router.get('/users/mutual/:userId', userController.getMutualConnections);
// Search users route
router.get('/search', userController.searchUsers);
module.exports = router;