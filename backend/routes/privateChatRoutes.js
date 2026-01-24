const express = require('express');
const {
  checkMutualFollowForChat,
  startPrivateChat,
  getMyPrivateChats,
  getPrivateChatById,
  getPrivateMessages,
  sendPrivateMessage,
  markAsRead,
  deletePrivateChat
} = require('../controllers/privateChatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Check mutual follow status (for private chat)
router.get('/check-mutual/:userId', checkMutualFollowForChat);

// Private chat management
router.route('/')
  .post(startPrivateChat)  // Start new private chat
  .get(getMyPrivateChats); // Get all private chats

router.route('/:chatId')
  .get(getPrivateChatById)    // Get specific chat
  .delete(deletePrivateChat); // Delete chat

// Messages
router.route('/:chatId/messages')
  .get(getPrivateMessages)    // Get chat messages
  .post(sendPrivateMessage);  // Send message

// Mark messages as read
router.put('/:chatId/read', markAsRead);

module.exports = router;