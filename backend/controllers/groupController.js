// backend/controllers/groupController.js
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const Chat = require('../models/Chat'); // Add this import

// @desc    Create a new group
// @route   POST /api/groups/create
// @access  Private
// In groupController.js - update createGroup function:

// In groupController.js - update createGroup function:

exports.createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      destination,
      startingLocation,
      destinationLocation,
      description,
      startDate,
      endDate,
      budget,
      maxMembers,
      groupType,
      privacy,
      travelPreferences,
      interests,
      tags
    } = req.body;

    console.log('📝 Creating enhanced group with locations:', { 
      destination, 
      startingLocation: startingLocation?.address,
      userId 
    });

    // 🔥 NEW: Validate both locations are provided
    if (!startingLocation || !startingLocation.address || !startingLocation.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Starting location is required for route planning'
      });
    }

    if (!destinationLocation || !destinationLocation.address || !destinationLocation.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Destination location with coordinates is required'
      });
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate budget
    if (budget && parseInt(budget.min) > parseInt(budget.max)) {
      return res.status(400).json({
        success: false,
        message: 'Maximum budget must be greater than minimum budget'
      });
    }

    // Build group object
    const groupData = {
      destination,
      startingLocation: {
        address: startingLocation.address,
        coordinates: startingLocation.coordinates
      },
      destinationLocation: {
        address: destinationLocation.address || destination,
        coordinates: destinationLocation.coordinates
      },
      description,
      startDate,
      endDate,
      budget: budget || { min: 0, max: 0, currency: 'INR' },
      maxMembers: parseInt(maxMembers) || 10,
      groupType: groupType || 'open',
      privacy: privacy || 'public',
      createdBy: userId,
      status: 'planning',
      currentMembers: [{
        user: userId,
        status: 'approved',
        joinedAt: Date.now(),
        role: 'creator'
      }]
    };

    // Add optional enhanced fields
    if (travelPreferences) {
      groupData.travelPreferences = {
        travelStyle: travelPreferences.travelStyle || [],
        accommodationType: travelPreferences.accommodationType || 'hotel',
        transportMode: travelPreferences.transportMode || [],
        smokingAllowed: travelPreferences.smokingAllowed || 'no',
        drinkingAllowed: travelPreferences.drinkingAllowed || 'social',
        petsAllowed: travelPreferences.petsAllowed || 'no',
        genderPreference: travelPreferences.genderPreference || 'any',
        ageRange: travelPreferences.ageRange || { min: 18, max: 60 }
      };
    }

    if (interests && Array.isArray(interests)) {
      groupData.interests = interests;
    }

    if (tags && Array.isArray(tags)) {
      groupData.tags = tags;
    }

    const group = await Group.create(groupData);

    console.log('✅ Enhanced group created with locations:', group._id);

    // Auto-create chat for the group
    try {
      await Chat.create({
        group: group._id,
        participants: [userId],
        messages: [{
          sender: userId,
          text: `Group "${destination}" has been created! Starting from ${startingLocation.address} to ${destination}. Let's plan our adventure! ✈️`,
          timestamp: new Date(),
          isSystemMessage: true
        }],
        lastActivity: new Date()
      });
      console.log(`✅ Chat automatically created for group: ${group.destination}`);
    } catch (chatError) {
      console.error('❌ Error creating chat:', chatError.message);
      // Don't fail the group creation if chat fails
    }

    // Get enhanced group data with populated fields
    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name profileImage rating')
      .populate('currentMembers.user', 'name profileImage rating')
      .lean();

    // Add enhanced data
    const enhancedGroup = {
      ...populatedGroup,
      availableSlots: (populatedGroup.maxMembers || 0) - 1, // Creator is already a member
      isFull: populatedGroup.maxMembers <= 1,
      currentMembersCount: 1,
      durationDays: Math.ceil((new Date(populatedGroup.endDate) - new Date(populatedGroup.startDate)) / (1000 * 60 * 60 * 24))
    };

    // Calculate distance for the enhanced group
    if (populatedGroup.startingLocation && populatedGroup.destinationLocation) {
      const start = populatedGroup.startingLocation.coordinates;
      const dest = populatedGroup.destinationLocation.coordinates;
      
      // Haversine formula
      const R = 6371;
      const dLat = (dest.lat - start.lat) * Math.PI / 180;
      const dLng = (dest.lng - start.lng) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(start.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      enhancedGroup.distanceKm = Math.round(R * c);
    }

    res.status(201).json({
      success: true,
      message: 'Travel squad created successfully! 🎉',
      data: enhancedGroup
    });

  } catch (error) {
    console.error('❌ Error creating group:', error);
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
    console.log('📋 Fetching all groups');
    
    // 🔥 FIRST: Run auto-complete for any past trips
    const { autoCompletePastTrips } = require('../utils/autoCompleteTrips');
    await autoCompletePastTrips();
    
    // Get only active groups (not completed or cancelled)
    const groups = await Group.find({
      status: { $in: ['planning', 'confirmed', 'active'] }, // Exclude completed
      endDate: { $gte: new Date() } // Only future or ongoing trips
    })
    .populate('createdBy', 'name profileImage')
    .populate('currentMembers.user', 'name profileImage')
    .sort({ createdAt: -1 });

    // Add isFull and availableSlots to each group
    const enhancedGroups = groups.map(group => {
      const enhanced = group.getEnhancedData();
      
      // Add current members count
      if (group.currentMembers && Array.isArray(group.currentMembers)) {
        const approvedMembers = group.currentMembers.filter(m => 
          m && m.status === 'approved'
        );
        enhanced.currentMembersCount = approvedMembers.length;
      } else {
        enhanced.currentMembersCount = 0;
      }
      
      return enhanced;
    });

    console.log(`✅ Found ${enhancedGroups.length} active groups (excluding completed/cancelled)`);
    
    res.status(200).json({
      success: true,
      data: enhancedGroups
    });

  } catch (error) {
    console.error('❌ Error fetching all groups:', error);
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
    console.log(`📋 Fetching groups for user: ${userId}`);

    const groups = await Group.find({
      'currentMembers.user': userId,
      'currentMembers.status': 'approved'
    })
    .populate('createdBy', 'name profileImage')
    .populate('currentMembers.user', 'name profileImage')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${groups.length} groups for user`);
    
    res.status(200).json({
      success: true,
      data: groups
    });

  } catch (error) {
    console.error('❌ Error fetching user groups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching user groups',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// In groupController.js - update getGroupById function:

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
      .populate('joinRequests.user', 'name profileImage email status');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // ✅ FIXED: Use getEnhancedData method
    const enhancedGroup = group.getEnhancedData();

    console.log('✅ Group found:', group.destination);
    console.log('✅ Group members:', enhancedGroup.currentMembersCount);
    
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
    console.error('❌ Error sending join request:', error);
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
      .populate('createdBy', 'name _id');

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

    // Validate groupId format
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
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
      
      // ✅ AUTO-ADD USER TO GROUP CHAT
      try {
        // Find or create chat for this group
        let chat = await Chat.findOne({ group: groupId });
        
        if (!chat) {
          // Create new chat with all approved members
          const participants = group.currentMembers
            .filter(m => m.status === 'approved')
            .map(m => m.user);
          
          chat = await Chat.create({
            group: groupId,
            participants: participants,
            messages: [{
              sender: null,
              text: `Group chat created for "${group.destination}"`,
              timestamp: new Date(),
              isSystemMessage: true
            }],
            lastActivity: new Date()
          });
        } else {
          // Add user to existing chat if not already there
          const userId = request.user;
          if (!chat.participants.includes(userId)) {
            chat.participants.push(userId);
            
            // Add system message
            const newUser = await User.findById(userId);
            if (newUser) {
              chat.messages.push({
                sender: null,
                text: `${newUser.name} has joined the chat`,
                timestamp: new Date(),
                isSystemMessage: true
              });
              
              chat.lastActivity = new Date();
              await chat.save();
              console.log(`✅ User ${newUser.name} added to group chat`);
            }
          }
        }
      } catch (chatError) {
        console.error('❌ Error adding user to chat:', chatError.message);
        // Don't fail the approval if chat addition fails
      }
      
      // Notify the user about approval
      const user = await User.findById(request.user);
      if (user) {
        user.addNotification(
          'trip_update',
          'Join Request Approved',
          `Your request to join ${group.destination} trip has been approved! You can now access the group chat.`
        );
        await user.save();
      }
      
      console.log(`✅ Request approved: ${request.user} added to ${group.destination}`);
      
    } else if (action === 'reject') {
      request.status = 'rejected';
      request.respondedAt = new Date();
      
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
      
      console.log(`❌ Request rejected: ${request.user} for ${group.destination}`);
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: `Join request ${action}d successfully`
    });

  } catch (error) {
    console.error('❌ Error handling join request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while handling join request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:userId
// @access  Private (Group admin only)
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if requester is group creator
    if (group.createdBy.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can remove members'
      });
    }

    // Check if trying to remove creator
    if (userId === group.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }

    // Remove from currentMembers
    group.currentMembers = group.currentMembers.filter(
      member => member.user.toString() !== userId
    );

    await group.save();

    // Remove from chat if exists
    try {
      const chat = await Chat.findOne({ group: groupId });
      if (chat) {
        chat.participants = chat.participants.filter(
          participant => participant.toString() !== userId
        );
        
        // Add system message
        const removedUser = await User.findById(userId);
        if (removedUser) {
          chat.messages.push({
            sender: null,
            text: `${removedUser.name} has been removed from the group`,
            timestamp: new Date(),
            isSystemMessage: true
          });
          
          await chat.save();
        }
      }
    } catch (chatError) {
      console.error('Error updating chat:', chatError);
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
};
// @desc    TEST: Get user's created groups
// @route   GET /api/groups/my-created-groups
// @access  Private
exports.getMyCreatedGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🔍 TEST: Fetching groups created by user ${userId}`);

    const groups = await Group.find({
      createdBy: userId
    })
    .populate('createdBy', 'name profileImage')
    .populate('currentMembers.user', 'name profileImage')
    .populate('joinRequests.user', 'name profileImage email')
    .sort({ createdAt: -1 });

    console.log(`✅ TEST: Found ${groups.length} groups created by user`);

    res.status(200).json({
      success: true,
      data: groups,
      user: { id: userId }
    });

  } catch (error) {
    console.error('❌ TEST Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test endpoint error',
      error: error.message
    });
  }
};


// Update group
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params; // ✅ Use groupId from params
    const updates = req.body;
    
    console.log('🔧 UPDATE GROUP DEBUG START ==========');
    console.log('Group ID from params:', groupId);
    console.log('User ID:', req.user?.id);
    console.log('Updates:', updates);
    
    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      console.log('❌ Group not found for ID:', groupId);
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    console.log('✅ Group found:', group.destination);
    console.log('Group owner:', group.createdBy.toString());
    console.log('Request user:', req.user.id);
    
    // Check if user is the creator
    if (group.createdBy.toString() !== req.user.id) {
      console.log('❌ User is not the creator');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this group'
      });
    }
    
    console.log('✅ User authorized. Updating...');
    
    // ✅ Use groupId, not id
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId, // ✅ Correct variable name
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    console.log('✅ Group updated successfully');
    console.log('🔧 UPDATE GROUP DEBUG END ==========');
    
    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: updatedGroup
    });
    
  } catch (error) {
    console.error('❌ Update group error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update group',
      error: error.message
    });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is the creator
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this group'
      });
    }
    
    // TODO: Also delete related data (chats, requests, etc.)
    
    // Delete group
    await Group.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group',
      error: error.message
    });
  }
};
// =============================================================================
// NEW FUNCTIONS TO ADD - Location Management & Additional Features
// =============================================================================

// @desc    Update group starting location
// @route   PUT /api/groups/:groupId/update-location
// @access  Private (Group admin only)
exports.updateGroupLocation = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { startingLocation, destinationLocation } = req.body;

    console.log('📍 Updating group location for:', groupId);

    // Validate groupId
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid group ID is required'
      });
    }

    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group creator or has admin role
    const isCreator = group.createdBy.toString() === req.user.id;
    const isAdmin = group.currentMembers.some(member => 
      member.user.toString() === req.user.id && member.role === 'creator'
    );

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can update location'
      });
    }

    // Update starting location if provided
    if (startingLocation) {
      if (!startingLocation.address || !startingLocation.coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Valid starting location with address and coordinates is required'
        });
      }

      group.startingLocation = {
        address: startingLocation.address.trim(),
        coordinates: {
          lat: parseFloat(startingLocation.coordinates.lat),
          lng: parseFloat(startingLocation.coordinates.lng)
        }
      };

      console.log('✅ Updated starting location to:', startingLocation.address);
    }

    // Update destination location if provided
    if (destinationLocation) {
      if (!destinationLocation.address || !destinationLocation.coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Valid destination location with address and coordinates is required'
        });
      }

      group.destinationLocation = {
        address: destinationLocation.address.trim(),
        coordinates: {
          lat: parseFloat(destinationLocation.coordinates.lat),
          lng: parseFloat(destinationLocation.coordinates.lng)
        }
      };

      console.log('✅ Updated destination location to:', destinationLocation.address);
    }

    // Also update destination field if destination location was provided
    if (destinationLocation && destinationLocation.address) {
      group.destination = destinationLocation.address;
    }

    await group.save();

    // Get enhanced group data
    const populatedGroup = await Group.findById(groupId)
      .populate('createdBy', 'name profileImage email')
      .populate('currentMembers.user', 'name profileImage email');

    const enhancedGroup = populatedGroup.getEnhancedData();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: enhancedGroup
    });

  } catch (error) {
    console.error('❌ Error updating group location:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:groupId/add-member
// @access  Private (Group admin only)
exports.addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, role = 'member' } = req.body;

    console.log(`👥 Adding member ${userId} to group ${groupId}`);

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group admin
    const isAdmin = group.currentMembers.some(member => 
      member.user.toString() === req.user.id && member.role === 'creator'
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can add members'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if group is full
    const approvedMembers = group.currentMembers.filter(m => m.status === 'approved');
    if (approvedMembers.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is already full'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.currentMembers.some(member => 
      member.user.toString() === userId && member.status === 'approved'
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
      });
    }

    // Add member using the schema method
    const added = group.addMember(userId, role);
    
    if (!added) {
      return res.status(400).json({
        success: false,
        message: 'Failed to add member to group'
      });
    }

    await group.save();

    // Add user to group chat
    try {
      let chat = await Chat.findOne({ group: groupId });
      
      if (!chat) {
        // Create new chat with all members
        const participants = group.currentMembers
          .filter(m => m.status === 'approved')
          .map(m => m.user);
        
        chat = await Chat.create({
          group: groupId,
          participants: participants,
          messages: [{
            sender: null,
            text: `Group chat created for "${group.destination}"`,
            timestamp: new Date(),
            isSystemMessage: true
          }],
          lastActivity: new Date()
        });
      } else {
        // Add user to existing chat if not already there
        if (!chat.participants.includes(userId)) {
          chat.participants.push(userId);
          
          // Add system message
          chat.messages.push({
            sender: null,
            text: `${user.name} has joined the chat`,
            timestamp: new Date(),
            isSystemMessage: true
          });
          
          chat.lastActivity = new Date();
          await chat.save();
        }
      }
      
      console.log(`✅ User ${user.name} added to group chat`);
    } catch (chatError) {
      console.error('❌ Error adding user to chat:', chatError.message);
      // Don't fail the member addition if chat fails
    }

    // Notify the user
    user.addNotification(
      'trip_update',
      'Added to Group',
      `You have been added to "${group.destination}" trip`
    );
    await user.save();

    // Populate user details in response
    const updatedGroup = await Group.findById(groupId)
      .populate('currentMembers.user', 'name email profilePicture')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: updatedGroup.getEnhancedData()
    });

  } catch (error) {
    console.error('❌ Error adding member to group:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group or user ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add member to group'
    });
  }
};

// @desc    Get group join requests (admin only)
// @route   GET /api/groups/:groupId/join-requests
// @access  Private (Group admin only)
exports.getJoinRequests = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log(`📋 Fetching join requests for group: ${groupId}`);

    const group = await Group.findById(groupId)
      .populate('joinRequests.user', 'name email profilePicture')
      .populate('currentMembers.user', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group admin
    const isAdmin = group.currentMembers.some(member => 
      member.user._id.toString() === req.user.id && member.role === 'creator'
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can view join requests'
      });
    }

    // Filter only pending requests
    const pendingRequests = group.joinRequests.filter(request => 
      request.status === 'pending'
    );

    console.log(`✅ Found ${pendingRequests.length} pending requests`);

    res.status(200).json({
      success: true,
      data: pendingRequests,
      count: pendingRequests.length
    });

  } catch (error) {
    console.error('❌ Error getting join requests:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get join requests'
    });
  }
};

// @desc    Handle join request (approve/reject)
// @route   PUT /api/groups/:groupId/handle-request/:requestId
// @access  Private (Group admin only)
exports.handleJoinRequest = async (req, res) => {
  try {
    const { groupId, requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    console.log(`🔄 Handling request ${action} for group ${groupId}, request ${requestId}`);

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group admin
    const isAdmin = group.currentMembers.some(member => 
      member.user.toString() === req.user.id && member.role === 'creator'
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can handle join requests'
      });
    }

    // Find the request
    const request = group.joinRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    // Handle the request
    const handled = group.handleJoinRequest(requestId, action);
    
    if (!handled) {
      return res.status(400).json({
        success: false,
        message: action === 'approve' ? 'Group is full' : 'Failed to process request'
      });
    }

    await group.save();

    // Add to chat if approved
    if (action === 'approve') {
      try {
        let chat = await Chat.findOne({ group: groupId });
        const user = await User.findById(request.user);
        
        if (chat && user) {
          if (!chat.participants.includes(request.user)) {
            chat.participants.push(request.user);
            
            // Add system message
            chat.messages.push({
              sender: null,
              text: `${user.name} has joined the chat`,
              timestamp: new Date(),
              isSystemMessage: true
            });
            
            chat.lastActivity = new Date();
            await chat.save();
          }
        }
      } catch (chatError) {
        console.error('❌ Error adding user to chat:', chatError.message);
      }
    }

    // Populate user info for response
    const updatedGroup = await Group.findById(groupId)
      .populate('currentMembers.user', 'name email')
      .populate('joinRequests.user', 'name email');

    res.status(200).json({
      success: true,
      message: `Join request ${action}d successfully`,
      data: updatedGroup.getEnhancedData()
    });

  } catch (error) {
    console.error('❌ Error handling join request:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group or request ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to handle join request'
    });
  }
};

// @desc    Get group analytics
// @route   GET /api/groups/:groupId/analytics
// @access  Private (Group members only)
exports.getGroupAnalytics = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log(`📊 Fetching analytics for group: ${groupId}`);

    const group = await Group.findById(groupId)
      .populate('currentMembers.user', 'name email')
      .populate('ratings.user', 'name');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group member
    const isMember = group.currentMembers.some(member => 
      member.user._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only group members can view analytics'
      });
    }

    // Calculate analytics using getEnhancedData
    const enhancedGroup = group.getEnhancedData();
    
    // Additional analytics
    const analytics = {
      totalMembers: enhancedGroup.currentMembersCount || group.currentMembers.length,
      availableSlots: enhancedGroup.availableSlots || 0,
      isFull: enhancedGroup.isFull || false,
      averageRating: enhancedGroup.averageRating || 0,
      totalRatings: group.ratings?.length || 0,
      tripDuration: enhancedGroup.durationDays || 0,
      daysUntilTrip: enhancedGroup.daysUntilStart || null,
      distanceKm: enhancedGroup.distanceKm || 0,
      budgetRange: group.budget ? {
        min: group.budget.min,
        max: group.budget.max,
        currency: group.budget.currency || 'INR'
      } : null,
      tripStatus: group.status,
      isActive: enhancedGroup.isActive || false,
      isUpcoming: enhancedGroup.isUpcoming || false
    };

    console.log(`✅ Analytics calculated for group ${group.destination}`);

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('❌ Error getting group analytics:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get group analytics'
    });
  }
};

// @desc    Get groups by location (search)
// @route   GET /api/groups/search/location
// @access  Private
exports.searchGroupsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km

    console.log(`🗺️ Searching groups near coordinates: ${lat}, ${lng}, radius: ${radius}km`);

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for location search'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    // Convert radius to radians (Earth's radius = 6371 km)
    const radiusInRadians = searchRadius / 6371;

    // Find groups with starting location near the provided coordinates
    const groups = await Group.find({
      'startingLocation.coordinates': {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians]
        }
      },
      status: { $in: ['planning', 'confirmed'] },
      endDate: { $gte: new Date() }
    })
    .populate('createdBy', 'name profileImage')
    .populate('currentMembers.user', 'name profileImage')
    .sort({ createdAt: -1 });

    // Enhance groups with distance calculation
    const enhancedGroups = groups.map(group => {
      const enhanced = group.getEnhancedData();
      
      // Calculate exact distance from search point
      const start = group.startingLocation.coordinates;
      if (start) {
        // Haversine formula
        const R = 6371;
        const dLat = (latitude - start.lat) * Math.PI / 180;
        const dLng = (longitude - start.lng) * Math.PI / 180;
        
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(start.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        enhanced.distanceFromSearch = Math.round(R * c);
      }
      
      return enhanced;
    });

    console.log(`✅ Found ${enhancedGroups.length} groups within ${radius}km radius`);

    res.status(200).json({
      success: true,
      data: enhancedGroups,
      searchParams: {
        latitude,
        longitude,
        radius: searchRadius,
        unit: 'km'
      }
    });

  } catch (error) {
    console.error('❌ Error searching groups by location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search groups by location'
    });
  }
};

// @desc    Get route suggestions from group (for tripController compatibility)
// @route   GET /api/groups/:groupId/starting-city
// @access  Private (Group members only)
exports.getGroupStartingCity = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log(`📍 Getting starting city for group: ${groupId}`);

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group member
    const isMember = group.currentMembers.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only group members can view group details'
      });
    }

    if (!group.startingLocation || !group.startingLocation.address) {
      return res.status(404).json({
        success: false,
        message: 'Starting location not set for this group'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        startingCity: group.startingLocation.address,
        coordinates: group.startingLocation.coordinates,
        destination: group.destination
      }
    });

  } catch (error) {
    console.error('❌ Error getting group starting city:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get starting city'
    });
  }
};

// @desc    Invite friends to a group
// @route   POST /api/groups/:groupId/invite-friends
// @access  Private
exports.inviteFriendsToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { friendIds, message } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one friend ID'
      });
    }

    // Check if group exists and user is the creator
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group admin/creator
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can invite friends'
      });
    }

    // Check if group is already full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is already full'
      });
    }

    const invitations = [];
    const errors = [];
    const invitedCount = 0;

    // Send invitations to each friend
    for (const friendId of friendIds) {
      try {
        // Check if friend exists
        const friend = await User.findById(friendId);
        if (!friend) {
          errors.push(`User ${friendId} not found`);
          continue;
        }

        // Check if friend is already a member
        if (group.members.some(member => member.toString() === friendId)) {
          errors.push(`${friend.name} is already a member`);
          continue;
        }

        // Check if there's already a pending invitation
        const existingInvitation = await GroupInvitation.findOne({
          group: groupId,
          invitee: friendId,
          status: 'pending'
        });

        if (existingInvitation) {
          errors.push(`You already sent an invitation to ${friend.name}`);
          continue;
        }

        // Create invitation
        const invitation = new GroupInvitation({
          group: groupId,
          inviter: userId,
          invitee: friendId,
          message: message || `Hey! I'm going to ${group.destination}. Want to join me?`,
          status: 'pending'
        });

        await invitation.save();

        // Add invitation reference to group
        group.invitations.push(invitation._id);
        
        // Create notification for friend
        const notification = new Notification({
          user: friendId,
          type: 'group_invitation',
          title: 'Trip Invitation ✈️',
          message: `${req.user.name} invited you to join their trip to ${group.destination}`,
          data: {
            groupId: group._id,
            groupName: group.destination,
            invitationId: invitation._id,
            inviterId: userId,
            inviterName: req.user.name
          }
        });

        await notification.save();

        invitations.push(invitation);
        invitedCount++;
      } catch (error) {
        console.error(`Error inviting friend ${friendId}:`, error);
        errors.push(`Failed to invite user ${friendId}`);
      }
    }

    // Save group with updated invitations
    await group.save();

    res.status(200).json({
      success: true,
      message: `Invitations sent successfully`,
      invitedCount,
      invitations,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error inviting friends to group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get invitations for a specific group
// @route   GET /api/groups/:groupId/invitations
// @access  Private
exports.getGroupInvitations = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group admin/creator
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can view invitations'
      });
    }

    // Get invitations for this group
    const invitations = await GroupInvitation.find({ group: groupId })
      .populate('invitee', 'name username profilePicture')
      .populate('inviter', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations
    });
  } catch (error) {
    console.error('Error getting group invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get my invitations
// @route   GET /api/groups/invitations/me
// @access  Private
exports.getMyInvitations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get invitations sent to me
    const invitations = await GroupInvitation.find({ 
      invitee: userId,
      status: 'pending'
    })
      .populate('group', 'destination description startDate endDate members maxMembers')
      .populate('inviter', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations
    });
  } catch (error) {
    console.error('Error getting my invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Respond to an invitation
// @route   PUT /api/groups/invitations/:invitationId/respond
// @access  Private
exports.respondToInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "rejected"'
      });
    }

    // Find invitation
    const invitation = await GroupInvitation.findById(invitationId)
      .populate('group')
      .populate('inviter', 'name username');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user is the invitee
    if (invitation.invitee.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation already ${invitation.status}`
      });
    }

    // Check if group still exists
    const group = await Group.findById(invitation.group._id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group no longer exists'
      });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is already full'
      });
    }

    // Update invitation status
    invitation.status = status;
    invitation.respondedAt = new Date();
    await invitation.save();

    if (status === 'accepted') {
      // Add user to group members
      group.members.push(userId);
      await group.save();

      // Create notification for inviter
      const notification = new Notification({
        user: invitation.inviter._id,
        type: 'group_invitation',
        title: 'Invitation Accepted ✅',
        message: `${req.user.name} accepted your invitation to join ${group.destination}`,
        data: {
          groupId: group._id,
          userId: userId,
          userName: req.user.name
        }
      });

      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: `Invitation ${status}`,
      invitation
    });
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};