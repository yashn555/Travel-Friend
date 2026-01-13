const Group = require('../models/Group');
const Agency = require('../models/Agency');
const User = require('../models/User');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard data for user:', req.user.id);
    
    // Fetch active travel groups (excluding those created by current user)
    const groups = await Group.find({
      createdBy: { $ne: req.user.id },
      status: { $in: ['planning', 'confirmed'] },
      endDate: { $gte: new Date() }
    })
    .populate('createdBy', 'name profileImage')
    .select('-joinRequests')
    .sort({ createdAt: -1 })
    .limit(10);
    
    // Fetch verified agencies
    const agencies = await Agency.find({ verified: true })
      .sort({ rating: -1, featured: -1 })
      .limit(6);
    
    // Fetch user notifications
    const user = await User.findById(req.user.id).select('notifications');
    
    // Get user's joined groups
    const userGroups = await Group.find({
      'currentMembers.user': req.user.id,
      'currentMembers.status': 'approved'
    })
    .select('destination startDate endDate status')
    .sort({ startDate: 1 })
    .limit(5);
    
    // Format response
    const dashboardData = {
      success: true,
      stats: {
        totalGroups: groups.length,
        availableTrips: groups.filter(g => !g.isFull).length,
        verifiedAgencies: agencies.length,
        unreadNotifications: user.notifications.filter(n => !n.read).length
      },
      groups: groups.map(group => ({
        id: group._id,
        destination: group.destination,
        description: group.description,
        startDate: group.startDate,
        endDate: group.endDate,
        duration: Math.ceil((group.endDate - group.startDate) / (1000 * 60 * 60 * 24)),
        budget: group.budget,
        maxMembers: group.maxMembers,
        currentMembers: group.currentMembers.filter(m => m.status === 'approved').length,
        availableSlots: group.availableSlots,
        isFull: group.isFull,
        groupType: group.groupType,
        status: group.status,
        tags: group.tags,
        createdBy: {
          id: group.createdBy._id,
          name: group.groupType === 'anonymous' ? 'Anonymous Traveler' : group.createdBy.name,
          profileImage: group.groupType === 'anonymous' ? 'anonymous-profile.jpg' : group.createdBy.profileImage
        },
        createdAt: group.createdAt
      })),
      agencies: agencies.map(agency => ({
        id: agency._id,
        name: agency.name,
        description: agency.description,
        logo: agency.logo,
        website: agency.website,
        contactEmail: agency.contactEmail,
        contactPhone: agency.contactPhone,
        rating: agency.rating,
        specialties: agency.specialties,
        featured: agency.featured
      })),
      notifications: user.notifications.slice(0, 5).map(notification => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt
      })),
      userTrips: userGroups.map(trip => ({
        id: trip._id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status
      }))
    };
    
    console.log('✅ Dashboard data fetched successfully');
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

// @desc    Get groups with filters
// @route   GET /api/dashboard/groups
// @access  Private
exports.getGroups = async (req, res) => {
  try {
    const { destination, minBudget, maxBudget, startDate, groupType, page = 1, limit = 10 } = req.query;
    
    console.log('🔍 Fetching groups with filters:', { destination, minBudget, maxBudget, startDate, groupType });
    
    // Build filter query
    const filter = {
      createdBy: { $ne: req.user.id },
      status: { $in: ['planning', 'confirmed'] },
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
      .select('-joinRequests')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Group.countDocuments(filter);
    
    console.log(`✅ Found ${groups.length} groups out of ${total}`);
    
    res.status(200).json({
      success: true,
      data: groups,
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
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if group is full
    if (group.isFull) {
      return res.status(400).json({
        success: false,
        message: 'This group is already full'
      });
    }
    
    // Check if user is the creator
    if (group.createdBy.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot join your own group'
      });
    }
    
    // Check if already requested
    const existingRequest = group.joinRequests.find(
      request => request.user.toString() === req.user.id
    );
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to join this group'
      });
    }
    
    // Check if already a member
    const existingMember = group.currentMembers.find(
      member => member.user.toString() === req.user.id
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
      status: 'pending'
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