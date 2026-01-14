// controllers/chatController.js
const Chat = require('../models/Chat');
const Group = require('../models/Group');
const User = require('../models/User');

// @desc    Get or create chat for a group
// @route   GET /api/chat/group/:groupId
// @access  Private
exports.getGroupChat = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isMember = group.currentMembers.some(
      member => member.user.toString() === userId && member.status === 'approved'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the group to access the chat'
      });
    }

    // Find or create chat
    let chat = await Chat.findOne({ group: groupId })
      .populate('messages.sender', 'name profileImage')
      .populate('participants', 'name profileImage');

    if (!chat) {
      // Create new chat with all approved members
      const participants = group.currentMembers
        .filter(m => m.status === 'approved')
        .map(m => m.user);

      chat = await Chat.create({
        group: groupId,
        participants: participants,
        messages: []
      });

      chat = await Chat.findById(chat._id)
        .populate('messages.sender', 'name profileImage')
        .populate('participants', 'name profileImage');
    }

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('Error fetching group chat:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Send message to group chat
// @route   POST /api/chat/group/:groupId/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isMember = group.currentMembers.some(
      member => member.user.toString() === userId && member.status === 'approved'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the group to send messages'
      });
    }

    // Find or create chat
    let chat = await Chat.findOne({ group: groupId });
    
    if (!chat) {
      // Create new chat with all approved members
      const participants = group.currentMembers
        .filter(m => m.status === 'approved')
        .map(m => m.user);

      chat = await Chat.create({
        group: groupId,
        participants: participants,
        messages: []
      });
    }

    // Add message
    chat.messages.push({
      sender: userId,
      text: text.trim(),
      timestamp: new Date()
    });

    await chat.save();

    // Populate sender info
    const populatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name profileImage')
      .populate('participants', 'name profileImage');

    // Get the last message
    const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add user to group chat when they join (automatically called when request is approved)
// @route   POST /api/chat/group/:groupId/add-user/:userId
// @access  Private (Group admin only)
exports.addUserToChat = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user.id;

    // Check if requester is group creator
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.createdBy.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can add users to chat'
      });
    }

    // Check if user is approved member
    const isApprovedMember = group.currentMembers.some(
      member => member.user.toString() === userId && member.status === 'approved'
    );

    if (!isApprovedMember) {
      return res.status(400).json({
        success: false,
        message: 'User is not an approved member of the group'
      });
    }

    // Find or create chat
    let chat = await Chat.findOne({ group: groupId });

    if (!chat) {
      // Create new chat with all approved members including new user
      const participants = group.currentMembers
        .filter(m => m.status === 'approved')
        .map(m => m.user);

      chat = await Chat.create({
        group: groupId,
        participants: participants,
        messages: []
      });
    } else {
      // Add user to existing chat if not already there
      if (!chat.participants.includes(userId)) {
        chat.participants.push(userId);
        await chat.save();
      }
    }

    // Add system message
    const newUser = await User.findById(userId);
    chat.messages.push({
      sender: null, // System message
      text: `${newUser.name} has joined the chat`,
      timestamp: new Date(),
      isSystemMessage: true
    });

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'User added to chat successfully'
    });

  } catch (error) {
    console.error('Error adding user to chat:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding user to chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's chat groups
// @route   GET /api/chat/my-chats
// @access  Private
exports.getMyChats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find groups where user is a member
    const groups = await Group.find({
      'currentMembers.user': userId,
      'currentMembers.status': 'approved'
    }).select('_id destination');

    // Find chats for these groups
    const chats = await Chat.find({
      group: { $in: groups.map(g => g._id) }
    })
    .populate('group', 'destination')
    .populate({
      path: 'messages',
      options: { sort: { timestamp: -1 }, limit: 1 }
    })
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: chats
    });

  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};