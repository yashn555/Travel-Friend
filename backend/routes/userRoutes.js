// backend/routes/userRoutes.js - UPDATED VERSION
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

// Public routes (no auth required)
router.get('/profile/:userId', userController.getUserProfile);
router.get('/search', userController.searchUsers);
router.get('/stats/:userId', userController.getUserStats);
router.get('/followers/:userId', userController.getFollowers);
router.get('/following/:userId', userController.getFollowing);
router.get('/friends/:userId', userController.getUserFriends);

// Protected routes (auth required)
router.use(auth.protect);

// Dashboard profile routes
router.get('/dashboard/profile', userController.getMyProfile);
router.put('/dashboard/profile', userController.updateProfile);
router.post('/dashboard/profile/upload-image', userController.uploadProfileImage);

// Dashboard stats routes
router.get('/dashboard/stats', userController.getMyStats);

// Follow system routes - ADDED /users prefix to match frontend
router.post('/follow/:userId', userController.followUser); // This is already correct
router.delete('/follow/:userId', userController.unfollowUser); // This is already correct
router.get('/dashboard/followers', userController.getMyFollowers);
router.get('/dashboard/following', userController.getMyFollowing);

// Friends system routes - ADDED /users prefix
router.get('/dashboard/friends', userController.getMyFriends);
router.post('/friend-request/:userId', userController.sendFriendRequest);
router.put('/friend-request/accept/:requestId', userController.acceptFriendRequest);
router.put('/friend-request/reject/:requestId', userController.rejectFriendRequest);
router.get('/friend-requests', userController.getFriendRequests);
router.delete('/friends/:friendshipId', userController.removeFriend);
router.get('/suggested', userController.getSuggestedFriends);
router.get('/check-follow/:userId', auth.protect, userController.checkFollowStatus);

// Mutual connections
router.get('/mutual/:userId', userController.getMutualConnections);
router.get('/check-mutual-follow/:userId', userController.checkMutualFollow);

module.exports = router;