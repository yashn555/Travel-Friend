const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const fileUpload = require('express-fileupload');

// Protect all dashboard routes
router.use(authMiddleware.protect);

// Dashboard routes
router.get('/', dashboardController.getDashboard);
router.get('/groups', dashboardController.getGroups);
router.post('/groups/:groupId/join', dashboardController.requestToJoin);

// Profile routes
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);

// Profile image upload
router.use(fileUpload({ useTempFiles: false, limits: { fileSize: 5 * 1024 * 1024 } }));
router.post('/profile/upload-image', profileController.uploadProfileImage);

// Notifications
router.get('/profile/notifications', profileController.getNotifications);
router.put('/profile/notifications/:notificationId/read', profileController.markNotificationAsRead);
router.delete('/profile/notifications', profileController.clearAllNotifications);

module.exports = router;
