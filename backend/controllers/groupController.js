// server/controllers/groupController.js
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');

// @desc    Create a new group
// @route   POST /api/groups/create
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      destination,
      description,
      startDate,
      endDate,
      minBudget,
      maxBudget,
      maxMembers,
      groupType,
      tags
    } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate budget
    if (parseInt(minBudget) > parseInt(maxBudget)) {
      return res.status(400).json({
        success: false,
        message: 'Maximum budget must be greater than minimum budget'
      });
    }

    const group = await Group.create({
      destination,
      description,
      startDate,
      endDate,
      budget: { 
        min: parseInt(minBudget), 
        max: parseInt(maxBudget),
        currency: 'INR' 
      },
      maxMembers: parseInt(maxMembers),
      groupType: groupType || 'anonymous',
      tags: tags || [],
      createdBy: userId,
      status: 'planning',
      currentMembers: [{
        user: userId,
        status: 'approved',
        joinedAt: Date.now(),
        role: 'creator'
      }]
    });

    // Populate creator info
    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name profileImage')
      .populate('currentMembers.user', 'name profileImage');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: populatedGroup
    });

  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all groups (for browsing)
// @route   GET /api/groups/all-groups
// @access  Private
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      status: { $in: ['planning', 'confirmed'] },
      endDate: { $gte: new Date() }
    })
    .populate('createdBy', 'name profileImage')
    .populate('currentMembers.user', 'name profileImage')
    .populate('joinRequests.user', 'name profileImage')
    .sort({ createdAt: -1 });

    // Add isFull and availableSlots to each group
    const enhancedGroups = groups.map(group => {
      const approvedMembers = group.currentMembers.filter(m => m.status === 'approved');
      const availableSlots = group.maxMembers - approvedMembers.length;
      const isFull = availableSlots <= 0;
      
      return {
        ...group.toObject(),
        availableSlots,
        isFull,
        currentMembersCount: approvedMembers.length
      };
    });

    res.status(200).json({
      success: true,
      data: enhancedGroups
    });

  } catch (error) {
    console.error('Error fetching all groups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching groups',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups/my-groups
// @access  Private
exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({
      'currentMembers.user': userId,
      'currentMembers.status': 'approved'
    })
    .populate('createdBy', 'name profileImage')
    .populate('currentMembers.user', 'name profileImage')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: groups
    });

  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching user groups',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:groupId
// @access  Private
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log('🔍 Getting group by ID:', groupId);

    // Validate groupId
    if (!groupId || groupId === 'undefined' || groupId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }

    // Check if groupId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID format'
      });
    }

    const group = await Group.findById(groupId)
      .populate('createdBy', 'name profileImage email')
      .populate('currentMembers.user', 'name profileImage email')
      .populate('joinRequests.user', 'name profileImage email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Calculate available slots
    const approvedMembers = group.currentMembers.filter(m => m.status === 'approved');
    const availableSlots = group.maxMembers - approvedMembers.length;
    const isFull = availableSlots <= 0;

    const enhancedGroup = {
      ...group.toObject(),
      availableSlots,
      isFull,
      currentMembersCount: approvedMembers.length
    };

    console.log('✅ Group found:', group.destination);
    res.status(200).json({
      success: true,
      data: enhancedGroup
    });

  } catch (error) {
    console.error('❌ Error fetching group:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Request to join a group
// @route   POST /api/groups/join-request
// @access  Private
exports.requestJoinGroup = async (req, res) => {
  try {
    const { groupId, message } = req.body;
    const userId = req.user.id;

    console.log('👥 Join request for group:', groupId, 'from user:', userId);

    // Validate groupId
    if (!groupId || groupId === 'undefined' || groupId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Group ID is required' 
      });
    }

    // Validate groupId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid group ID format' 
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if group is full
    const approvedMembers = group.currentMembers.filter(m => m.status === 'approved');
    if (approvedMembers.length >= group.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group is full' 
      });
    }

    // Check if user is already a member
    const isMember = group.currentMembers.some(
      m => m.user.toString() === userId && m.status === 'approved'
    );
    if (isMember) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already a member of this group' 
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are the creator of this group' 
      });
    }

    // Check if already requested
    const alreadyRequested = group.joinRequests.some(
      r => r.user.toString() === userId && r.status === 'pending'
    );
    if (alreadyRequested) {
      return res.status(400).json({ 
        success: false, 
        message: 'Join request already sent' 
      });
    }

    // Add join request
    group.joinRequests.push({ 
      user: userId, 
      message: message || 'I would like to join your travel group',
      status: 'pending',
      requestedAt: new Date()
    });
    
    await group.save();

    // Notify group creator
    const creator = await User.findById(group.createdBy);
    if (creator) {
      creator.addNotification(
        'join_request',
        'New Join Request',
        `Someone wants to join your ${group.destination} trip`
      );
      await creator.save();
    }

    console.log('✅ Join request sent successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Join request sent successfully' 
    });

  } catch (error) {
    console.error('Error sending join request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while sending join request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get join requests for a group (admin only)
// @route   GET /api/groups/:groupId/requests
// @access  Private
exports.getJoinRequestsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log(`📋 Fetching join requests for group ${groupId} by user ${userId}`);

    // Validate groupId
    if (!groupId || groupId === 'undefined' || groupId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Group ID is required' 
      });
    }

    // Validate groupId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid group ID format' 
      });
    }

    // Find the group with populated join requests
    const group = await Group.findById(groupId)
      .populate('joinRequests.user', 'name email profileImage')
      .populate('createdBy', 'name');

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    console.log(`Group creator: ${group.createdBy._id}, Current user: ${userId}`);

    // Check if user is the creator
    if (group.createdBy._id.toString() !== userId.toString()) {
      console.log('❌ User is not the creator');
      return res.status(403).json({ 
        success: false, 
        message: 'Only group creator can view join requests' 
      });
    }

    // Get pending requests
    const pendingRequests = group.joinRequests.filter(r => r.status === 'pending');
    
    console.log(`✅ Found ${pendingRequests.length} pending requests`);

    res.status(200).json({ 
      success: true, 
      data: pendingRequests 
    });

  } catch (error) {
    console.error('❌ Error fetching join requests:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching join requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Handle join request (approve/reject)
// @route   PUT /api/groups/handle-request
// @access  Private
exports.handleJoinRequest = async (req, res) => {
  try {
    const { groupId, requestId, action } = req.body;
    const adminId = req.user.id;

    console.log(`🔄 Handling request ${action} for group ${groupId}, request ${requestId}`);

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action. Use "approve" or "reject"' 
      });
    }

    // Validate IDs
    if (!groupId || groupId === 'undefined' || !requestId || requestId === 'undefined') {
      return res.status(400).json({ 
        success: false, 
        message: 'Group ID and Request ID are required' 
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== adminId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only group creator can handle join requests' 
      });
    }

    const request = group.joinRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    if (action === 'approve') {
      // Check if group is full
      const approvedMembers = group.currentMembers.filter(m => m.status === 'approved');
      if (approvedMembers.length >= group.maxMembers) {
        return res.status(400).json({ 
          success: false, 
          message: 'Group is full. Cannot approve more members.' 
        });
      }

      // Check if user is already a member
      const alreadyMember = group.currentMembers.some(
        m => m.user.toString() === request.user.toString() && m.status === 'approved'
      );

      if (!alreadyMember) {
        group.currentMembers.push({
          user: request.user,
          status: 'approved',
          joinedAt: new Date(),
          role: 'member'
        });
      }

      request.status = 'approved';
      
      // Notify the user about approval
      const user = await User.findById(request.user);
      if (user) {
        user.addNotification(
          'trip_update',
          'Join Request Approved',
          `Your request to join ${group.destination} trip has been approved!`
        );
        await user.save();
      }
    } else if (action === 'reject') {
      request.status = 'rejected';
      
      // Notify the user about rejection
      const user = await User.findById(request.user);
      if (user) {
        user.addNotification(
          'trip_update',
          'Join Request Rejected',
          `Your request to join ${group.destination} trip has been rejected.`
        );
        await user.save();
      }
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: `Join request ${action}d successfully`
    });

  } catch (error) {
    console.error('Error handling join request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while handling join request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};