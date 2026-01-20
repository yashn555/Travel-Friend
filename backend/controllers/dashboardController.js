const Group = require('../models/Group');
const Agency = require('../models/Agency');
const User = require('../models/User');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard data for user:', req.user.id);
    
    // 🔥 FIX: Remove status filter since it doesn't exist initially
    const groups = await Group.find({
      endDate: { $gte: new Date() }
    })
    .populate('createdBy', 'name profileImage')
    .populate('currentMembers.user', 'name profileImage')
    .populate('joinRequests.user', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(10);
    
    console.log(`📝 Found ${groups.length} groups in database`);
    
    // Fetch user's groups for myGroups section
    const userGroups = await Group.find({
      'currentMembers.user': req.user.id
    })
    .select('destination startDate endDate')
    .sort({ startDate: 1 })
    .limit(5);
    
    // Format response
    const dashboardData = {
      success: true,
      groups: groups.map(group => {
        const approvedMembers = group.currentMembers.filter(m => m.status === 'approved');
        const availableSlots = group.maxMembers - approvedMembers.length;
        const isFull = availableSlots <= 0;
        
        // Check if current user is a member
        const isMember = group.currentMembers.some(
          member => member.user && member.user._id.toString() === req.user.id.toString()
        );
        
        // Check if current user is creator
        const isCreator = group.createdBy._id.toString() === req.user.id.toString();
        
        // Check if user has pending request
        const hasPendingRequest = group.joinRequests.some(
          req => req.user && req.user._id.toString() === req.user.id.toString() && req.status === 'pending'
        );
        
        return {
          id: group._id,
          destination: group.destination,
          description: group.description,
          startDate: group.startDate,
          endDate: group.endDate,
          duration: Math.ceil((group.endDate - group.startDate) / (1000 * 60 * 60 * 24)),
          budget: group.budget,
          maxMembers: group.maxMembers,
          currentMembers: group.currentMembers,
          currentMembersCount: approvedMembers.length,
          availableSlots: availableSlots,
          isFull: isFull,
          groupType: group.groupType,
          status: group.status || 'planning',
          tags: group.tags,
          createdBy: {
            id: group.createdBy._id,
            name: group.groupType === 'anonymous' ? 'Anonymous Traveler' : group.createdBy.name,
            profileImage: group.groupType === 'anonymous' ? 'anonymous-profile.jpg' : group.createdBy.profileImage
          },
          isMember: isMember,
          isCreator: isCreator,
          hasPendingRequest: hasPendingRequest,
          createdAt: group.createdAt
        };
      }),
      myGroups: userGroups.map(trip => ({
        id: trip._id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status || 'planning'
      }))
    };
    
    console.log('✅ Dashboard data fetched successfully');
    console.log(`📝 Sending ${dashboardData.groups.length} groups to frontend`);
    
    res.status(200).json(dashboardData);
    
  } catch (error) {
    console.error('❌ Error fetching dashboard:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get groups with filters (for Browse Groups page)
// @route   GET /api/dashboard/groups
// @access  Private
exports.getGroups = async (req, res) => {
  try {
    const { destination, minBudget, maxBudget, startDate, groupType, page = 1, limit = 10 } = req.query;
    
    console.log('🔍 Fetching groups with filters:', { destination, minBudget, maxBudget, startDate, groupType });
    
    // Build filter query
    const filter = {
      endDate: { $gte: new Date() }
    };
    
    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }
    
    if (groupType) {
      filter.groupType = groupType;
    }
    
    if (minBudget || maxBudget) {
      filter['budget.min'] = {};
      filter['budget.max'] = {};
      
      if (minBudget) {
        filter['budget.max']['$gte'] = parseInt(minBudget);
      }
      
      if (maxBudget) {
        filter['budget.min']['$lte'] = parseInt(maxBudget);
      }
    }
    
    if (startDate) {
      filter.startDate = { $gte: new Date(startDate) };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const groups = await Group.find(filter)
      .populate('createdBy', 'name profileImage')
      .populate('currentMembers.user', 'name profileImage')
      .populate('joinRequests.user', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Group.countDocuments(filter);
    
    console.log(`✅ Found ${groups.length} groups out of ${total}`);
    
    // Format groups with additional data
    const formattedGroups = groups.map(group => {
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
      data: formattedGroups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching groups:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Request to join a group
// @route   POST /api/dashboard/groups/:groupId/join
// @access  Private
exports.requestToJoin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;
    
    console.log(`👥 Join request for group ${groupId} from user ${req.user.id}`);
    
    // Find the group
    const group = await Group.findById(groupId)
      .populate('createdBy', 'name email');
    
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
        message: 'This group is already full'
      });
    }
    
    // Check if user is the creator
    if (group.createdBy._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot join your own group'
      });
    }
    
    // Check if already requested
    const existingRequest = group.joinRequests.find(
      request => request.user.toString() === req.user.id && request.status === 'pending'
    );
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to join this group'
      });
    }
    
    // Check if already a member
    const existingMember = group.currentMembers.find(
      member => member.user.toString() === req.user.id && member.status === 'approved'
    );
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }
    
    // Add join request
    group.joinRequests.push({
      user: req.user.id,
      message: message || 'I would like to join your travel group',
      status: 'pending',
      requestedAt: new Date()
    });
    
    await group.save();
    
    // Notify group creator
    if (group.createdBy) {
      const creator = await User.findById(group.createdBy._id);
      if (creator) {
        const requester = await User.findById(req.user.id);
        creator.addNotification(
          'join_request',
          'New Join Request',
          `${requester.name} wants to join your ${group.destination} trip`
        );
        await creator.save();
        
        console.log(`📩 Notification sent to creator ${creator.name}`);
      }
    }
    
    console.log('✅ Join request submitted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Join request submitted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error submitting join request:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting join request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
