const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(auth.protect);

router.get('/', profileController.getProfile);
router.put('/update', profileController.updateProfile);
router.post('/upload-image', profileController.uploadProfileImage);

module.exports = router;