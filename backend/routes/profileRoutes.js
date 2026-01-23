// backend/routes/profileRoutes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware.protect);

// ========== PROFILE ROUTES ==========
router.get('/', profileController.getProfile);
router.put('/update', profileController.updateProfile);
router.post('/upload-image', profileController.uploadProfileImage);

router.get('/trips', profileController.getTripHistory);

// ========== PASSWORD & ACCOUNT ROUTES ==========
router.put('/change-password', profileController.changePassword);
router.delete('/delete-account', profileController.deleteAccount);

// ========== STATS & SOCIAL ROUTES ==========
router.get('/stats', profileController.getUserStats);
router.get('/friends', profileController.getFriendsList);
router.get('/followers', profileController.getFollowersList);
router.get('/following', profileController.getFollowingList);
router.get('/search', profileController.searchUsers || userController.searchUsers);

// ========== NOTIFICATION ROUTES ==========
router.get('/notifications', profileController.getNotifications);
router.put('/notifications/:notificationId/read', profileController.markNotificationAsRead);
router.delete('/notifications', profileController.clearAllNotifications);

// ========== FOLLOW/UNFOLLOW ROUTES ==========
// Check if these routes exist in userController, otherwise use these
router.post('/follow/:userId', userController.followUser || profileController.followUser);
router.delete('/unfollow/:userId', userController.unfollowUser || profileController.unfollowUser);

module.exports = router;