const Group = require('../models/Group');

// Request to join group
exports.requestJoinGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is already a member
    const isMember = group.currentMembers.some(
      member => member.userId.toString() === userId
    );
    
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }
    
    // Check if user already requested
    const hasRequested = group.requestedMembers.some(
      request => request.userId.toString() === userId && request.status === 'pending'
    );
    
    if (hasRequested) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to join this group'
      });
    }
    
    // Check if group is full
    if (group.currentMembers.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'This group is already full'
      });
    }
    
    // Add join request
    group.requestedMembers.push({
      userId,
      status: 'pending'
    });
    
    await group.save();
    
    res.status(200).json({
      success: true,
      message: 'Join request sent successfully'
    });
    
  } catch (error) {
    console.error('Join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create new group
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
    
    // Create new group
    const group = new Group({
      destination,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: {
        min: parseInt(minBudget),
        max: parseInt(maxBudget),
        currency: 'USD'
      },
      maxMembers: parseInt(maxMembers),
      groupType: groupType || 'anonymous',
      tags: tags || [],
      createdBy: userId,
      currentMembers: [{
        userId,
        joinedAt: new Date()
      }]
    });
    
    await group.save();
    
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
    
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user's groups
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { 'currentMembers.userId': userId }
      ]
    })
    .populate('createdBy', 'name')
    .populate('currentMembers.userId', 'name')
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: groups
    });
    
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};