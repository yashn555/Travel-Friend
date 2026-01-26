// backend/routes/groupNotificationRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const groupNotificationService = require('../services/groupNotificationService');

// @route   GET /api/notifications/group
// @desc    Get user's group notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      unread, 
      type, 
      groupId 
    } = req.query;
    
    const result = await groupNotificationService.getUserGroupNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unread === 'true',
      type: type,
      groupId: groupId
    });
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error getting group notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/notifications/group/unread-count
// @desc    Get count of unread group notifications
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await groupNotificationService.getUnreadCount(userId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/notifications/group/:id/read
// @desc    Mark group notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const result = await groupNotificationService.markAsRead(
      req.params.id,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/notifications/group/read-all
// @desc    Mark all group notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await groupNotificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;