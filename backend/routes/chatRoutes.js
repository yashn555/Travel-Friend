// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware.protect);

// Group chat routes
router.get('/group/:groupId', chatController.getGroupChat);
router.post('/group/:groupId/message', chatController.sendMessage);
router.post('/group/:groupId/add-user/:userId', chatController.addUserToChat);

// User's chat routes
router.get('/my-chats', chatController.getMyChats);

module.exports = router;