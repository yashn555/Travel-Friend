// backend/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const userController = require('../controllers/userController'); // Add this import
const auth = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(auth.protect);

// Profile routes
router.get('/', profileController.getProfile);
router.put('/update', profileController.updateProfile);
router.post('/upload-image', profileController.uploadProfileImage);

// Search users (make this endpoint available)
router.get('/search', userController.searchUsers); // Add this line

// Follow routes (make these endpoints available)
router.post('/follow/:userId', userController.followUser); // Add this line

module.exports = router;