const PrivateChat = require('../models/PrivateChat');
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');

// @desc    Check mutual follow status for private chat
// @route   GET /api/private-chat/check-mutual/:userId
// @access  Private
const checkMutualFollowForChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    console.log(`🔒 [PRIVATE CHAT] Checking mutual follow:`);
    console.log(`   Current User: ${currentUserId}`);
    console.log(`   Target User: ${userId}`);

    if (currentUserId.toString() === userId) {
      return res.json({
        success: true,
        isMutualFollow: false,
        currentUserFollows: false,
        otherUserFollows: false,
        message: 'Cannot start chat with yourself'
      });
    }

    // Get both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).select('following followers'),
      User.findById(userId).select('following followers')
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user follows target user
    const currentUserFollows = currentUser.following.some(f => 
      f.user && f.user.toString() === userId
    );

    // Check if target user follows current user
    const otherUserFollows = targetUser.followers.some(f => 
      f.user && f.user.toString() === currentUserId.toString()
    );

    console.log(`   Current follows Other: ${currentUserFollows}`);
    console.log(`   Other follows Current: ${otherUserFollows}`);
    console.log(`   Can Start Private Chat: ${currentUserFollows && otherUserFollows}`);

    res.json({
      success: true,
      isMutualFollow: currentUserFollows && otherUserFollows,
      currentUserFollows,
      otherUserFollows,
      message: currentUserFollows && otherUserFollows 
        ? 'You can start a private chat' 
        : 'You need to follow each other to start a private chat'
    });

  } catch (error) {
    console.error('❌ Error checking mutual follow for chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking mutual follow status'
    });
  }
};

// @desc    Start or get existing private chat
// @route   POST /api/private-chat
// @access  Private
const startPrivateChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    console.log(`💬 Starting private chat: ${currentUserId} with ${userId}`);

    // Validate
    if (currentUserId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start chat with yourself'
      });
    }

    // Get both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).select('name profileImage following'),
      User.findById(userId).select('name profileImage followers')
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check mutual follow
    const currentUserFollows = currentUser.following.some(f => 
      f.user && f.user.toString() === userId
    );

    const otherUserFollows = targetUser.followers.some(f => 
      f.user && f.user.toString() === currentUserId.toString()
    );

    if (!currentUserFollows || !otherUserFollows) {
      return res.status(400).json({
        success: false,
        message: 'You can only chat with users who follow you back'
      });
    }

    // Create sorted participants array for consistent query
    const participants = [currentUserId, userId].sort();
    
    // Check if chat already exists using sorted participants
    let chat = await PrivateChat.findOne({
      participants: participants
    })
    .populate('participants', 'name profileImage email')
    .populate('lastMessage');

    if (chat) {
      // Get unread count
      const unreadCount = await PrivateMessage.countDocuments({
        chat: chat._id,
        sender: userId,
        readBy: { $ne: currentUserId }
      });

      return res.json({
        success: true,
        chatId: chat._id,
        chat,
        isNew: false,
        unreadCount
      });
    }

    // Create new private chat with sorted participants
    chat = await PrivateChat.create({
      participants: participants
    });

    // Populate participant details
    chat = await PrivateChat.findById(chat._id)
      .populate('participants', 'name profileImage email');

    res.status(201).json({
      success: true,
      chatId: chat._id,
      chat,
      isNew: true,
      unreadCount: 0
    });

  } catch (error) {
    console.error('❌ Error starting private chat:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      // Try to find existing chat
      const participants = [req.user._id, userId].sort();
      const existingChat = await PrivateChat.findOne({
        participants: participants
      })
      .populate('participants', 'name profileImage email');
      
      if (existingChat) {
        return res.json({
          success: true,
          chatId: existingChat._id,
          chat: existingChat,
          isNew: false,
          message: 'Chat already exists'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error starting private chat'
    });
  }
};
// @desc    Get all private chats for current user
// @route   GET /api/private-chat
// @access  Private
const getMyPrivateChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await PrivateChat.find({
      participants: userId
    })
    .populate('participants', 'name profileImage email')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name profileImage'
      }
    })
    .sort({ updatedAt: -1 });

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await PrivateMessage.countDocuments({
          chat: chat._id,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        });

        const otherParticipant = chat.participants.find(
          p => p._id.toString() !== userId.toString()
        );

        return {
          ...chat.toObject(),
          unreadCount,
          otherParticipant
        };
      })
    );

    res.json(chatsWithUnread);

  } catch (error) {
    console.error('❌ Error fetching private chats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching private chats'
    });
  }
};

// @desc    Get specific private chat
// @route   GET /api/private-chat/:chatId
// @access  Private
const getPrivateChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await PrivateChat.findOne({
      _id: chatId,
      participants: userId
    })
    .populate('participants', 'name profileImage email')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name profileImage'
      }
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Get unread count
    const unreadCount = await PrivateMessage.countDocuments({
      chat: chat._id,
      sender: { $ne: userId },
      readBy: { $ne: userId }
    });

    const otherParticipant = chat.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    res.json({
      ...chat.toObject(),
      unreadCount,
      otherParticipant
    });

  } catch (error) {
    console.error('❌ Error fetching private chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching private chat'
    });
  }
};

// @desc    Get messages for a private chat
// @route   GET /api/private-chat/:chatId/messages
// @access  Private
const getPrivateMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const chat = await PrivateChat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    const messages = await PrivateMessage.find({ chat: chatId })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalMessages = await PrivateMessage.countDocuments({ chat: chatId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      page: parseInt(page),
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages
    });

  } catch (error) {
    console.error('❌ Error fetching private messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching private messages'
    });
  }
};

// @desc    Send private message
// @route   POST /api/private-chat/:chatId/messages
// @access  Private
const sendPrivateMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Verify user is participant
    const chat = await PrivateChat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    if (!text || text.trim() === '') {
      res.status(400);
      throw new Error('Message cannot be empty');
    }

    // Create message
    const message = await PrivateMessage.create({
      sender: userId,
      chat: chatId,
      text: text.trim()
    });

    // Populate sender info
    await message.populate('sender', 'name profileImage');

    // Update chat's last message
    chat.lastMessage = message._id;
    await chat.save();

    res.status(201).json(message);

  } catch (error) {
    console.error('❌ Error sending private message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending private message'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/private-chat/:chatId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Mark all unread messages from other participant as read
    await PrivateMessage.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
};

// @desc    Delete private chat
// @route   DELETE /api/private-chat/:chatId
// @access  Private
const deletePrivateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await PrivateChat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Delete all messages
    await PrivateMessage.deleteMany({ chat: chatId });

    // Delete chat
    await chat.deleteOne();

    res.json({ success: true, message: 'Chat deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting private chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting private chat'
    });
  }
};

// Export all functions
module.exports = {
  checkMutualFollowForChat,
  startPrivateChat,
  getMyPrivateChats,
  getPrivateChatById,
  getPrivateMessages,
  sendPrivateMessage,
  markAsRead,
  deletePrivateChat
};