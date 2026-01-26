// backend/controllers/inviteController.js - COMPLETE FIXED VERSION
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');

// Helper function to safely get array length
const safeArrayLength = (array) => {
  return Array.isArray(array) ? array.length : 0;
};

// Helper function to get approved members count
const getApprovedMembersCount = (group) => {
  if (!group.currentMembers || !Array.isArray(group.currentMembers)) {
    return 0;
  }
  return group.currentMembers.filter(member => 
    member.status === 'approved'
  ).length;
};

// @desc    Get user's connections (followers + following)
// @route   GET /api/invite/connections
// @access  Private
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('👤 Getting connections for user:', userId);
    
    // Get user with followers and following populated
    const user = await User.findById(userId)
      .populate('followers.user', 'name username email profilePicture city state interests')
      .populate('following.user', 'name username email profilePicture city state interests');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Extract followers and following
    const followers = user.followers.map(f => ({
      _id: f.user._id,
      name: f.user.name,
      username: f.user.username,
      email: f.user.email,
      profilePicture: f.user.profilePicture,
      city: f.user.city,
      state: f.user.state,
      interests: f.user.interests || [],
      type: 'follower',
      followedAt: f.followedAt
    }));
    
    const following = user.following.map(f => ({
      _id: f.user._id,
      name: f.user.name,
      username: f.user.username,
      email: f.user.email,
      profilePicture: f.user.profilePicture,
      city: f.user.city,
      state: f.user.state,
      interests: f.user.interests || [],
      type: 'following',
      followedAt: f.followedAt
    }));
    
    // Combine and remove duplicates
    const allConnections = [...followers, ...following];
    const uniqueMap = new Map();
    
    allConnections.forEach(connection => {
      if (!uniqueMap.has(connection._id.toString())) {
        uniqueMap.set(connection._id.toString(), connection);
      }
    });
    
    const uniqueConnections = Array.from(uniqueMap.values());
    
    console.log(`✅ Found ${uniqueConnections.length} connections`);
    
    res.status(200).json({
      success: true,
      count: uniqueConnections.length,
      data: uniqueConnections
    });
    
  } catch (error) {
    console.error('❌ Error getting connections:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while getting connections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Invite friends to group - FIXED VERSION (NO TRANSACTIONS)
// @route   POST /api/invite/:groupId/send
// @access  Private
exports.inviteToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds, emails, message } = req.body;
    const inviterId = req.user.id;
    
    console.log('📥 Received invitation request:', {
      groupId,
      userIds: userIds || [],
      emails: emails || [],
      message,
      inviterId
    });
    
    // Validate input
    const hasUserIds = userIds && Array.isArray(userIds) && userIds.length > 0;
    const hasEmails = emails && Array.isArray(emails) && emails.length > 0;
    
    if (!hasUserIds && !hasEmails) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one friend to invite (userIds or emails)'
      });
    }
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    console.log('✅ Group found:', group.destination);
    
    // Check if user is group creator
    if (group.createdBy.toString() !== inviterId) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can invite members'
      });
    }
    
    // Check if group is full
    const approvedMembersCount = getApprovedMembersCount(group);
    if (approvedMembersCount >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is already full'
      });
    }
    
    // Get inviter details
    const inviter = await User.findById(inviterId);
    if (!inviter) {
      return res.status(404).json({
        success: false,
        message: 'Inviter not found'
      });
    }
    
    console.log('✅ Inviter found:', inviter.name);
    
    const invitations = [];
    let invitedCount = 0;
    const invitedUsers = new Set();
    
    // Initialize arrays if they don't exist
    if (!group.invitations) {
      group.invitations = [];
    }
    
    if (!group.currentMembers) {
      group.currentMembers = [];
    }
    
    // Get existing member IDs
    const groupMemberIds = new Set();
    if (group.currentMembers && Array.isArray(group.currentMembers)) {
      group.currentMembers.forEach(member => {
        if (member.user && member.user.toString()) {
          groupMemberIds.add(member.user.toString());
        }
      });
    }
    
    // Get existing invitation IDs
    const existingInvitations = new Set();
    if (group.invitations && Array.isArray(group.invitations)) {
      group.invitations.forEach(inv => {
        if (inv.user && inv.user.toString()) {
          existingInvitations.add(inv.user.toString());
        }
      });
    }
    
    console.log('📊 Existing member IDs:', Array.from(groupMemberIds));
    console.log('📊 Existing invitation IDs:', Array.from(existingInvitations));
    
    // Helper function to create invitation object
    const createInvitation = (userId) => {
      return {
        user: new mongoose.Types.ObjectId(userId),
        invitedBy: new mongoose.Types.ObjectId(inviterId),
        invitedAt: new Date(),
        message: message || `${inviter.name} invited you to join their trip to ${group.destination}!`,
        status: 'pending'
      };
    };
    
    // Process userIds
    if (hasUserIds) {
      for (const userId of userIds) {
        console.log(`👤 Processing userId: ${userId}`);
        
        if (invitedUsers.has(userId)) {
          console.log(`⏩ Skipping ${userId} - already processed`);
          continue;
        }
        
        try {
          // Check if user exists
          const user = await User.findById(userId);
          if (!user) {
            console.log(`❌ User ${userId} not found`);
            invitations.push({
              userId,
              success: false,
              error: 'User not found',
              type: 'user_not_found'
            });
            continue;
          }
          
          // Check if already a member
          if (groupMemberIds.has(userId)) {
            console.log(`⏭️ User ${user.name} (${userId}) is already a member`);
            invitations.push({
              userId,
              name: user.name,
              email: user.email,
              success: false,
              error: 'Already a member of this group',
              type: 'already_member'
            });
            continue;
          }
          
          // Check if already invited
          if (existingInvitations.has(userId)) {
            console.log(`⏭️ User ${user.name} (${userId}) already invited`);
            invitations.push({
              userId,
              name: user.name,
              email: user.email,
              success: false,
              error: 'Already invited to this group',
              type: 'already_invited'
            });
            continue;
          }
          
          // Create invitation
          const invitationData = createInvitation(userId);
          
          // Add invitation to group
          const invitation = group.invitations.create(invitationData);
          group.invitations.push(invitation);
          
          // Save group to get invitation ID
          await group.save();
          
          console.log(`📝 Created invitation with ID: ${invitation._id}`);
          
          // Add to user's personal notifications using EXISTING type
          user.addNotification(
            'trip_update',  // Use existing type from User.js enum
            '🎉 Trip Invitation',
            `${inviter.name} invited you to join their trip to ${group.destination}`,
            inviterId,
            {
              groupId: group._id,
              groupName: group.destination,
              inviterId: inviterId,
              inviterName: inviter.name,
              invitationId: invitation._id.toString(),
              actionUrl: `/invitations/${invitation._id}/respond`,
              originalType: 'group_invitation'
            }
          );
          
          await user.save();
          
          console.log(`✅ Successfully invited ${user.name} (${userId})`);
          invitations.push({
            userId,
            name: user.name,
            email: user.email,
            invitationId: invitation._id,
            success: true,
            type: 'new_invitation'
          });
          
          invitedUsers.add(userId);
          invitedCount++;
          existingInvitations.add(userId);
          
        } catch (error) {
          console.error(`❌ Error inviting user ${userId}:`, error.message);
          invitations.push({
            userId,
            success: false,
            error: error.message,
            type: 'error'
          });
        }
      }
    }
    
    // Process emails
    if (hasEmails) {
      for (const email of emails) {
        console.log(`📧 Processing email: ${email}`);
        
        try {
          // Find user by email
          const user = await User.findOne({ email });
          if (!user) {
            console.log(`❌ User with email ${email} not found`);
            invitations.push({
              email,
              success: false,
              error: 'User with this email not found',
              type: 'user_not_found'
            });
            continue;
          }
          
          const userId = user._id.toString();
          
          if (invitedUsers.has(userId)) {
            console.log(`⏩ Skipping ${email} - already processed as userId ${userId}`);
            continue;
          }
          
          // Check if already a member
          if (groupMemberIds.has(userId)) {
            console.log(`⏭️ User ${user.name} (${email}) is already a member`);
            invitations.push({
              userId,
              email,
              name: user.name,
              success: false,
              error: 'Already a member of this group',
              type: 'already_member'
            });
            continue;
          }
          
          // Check if already invited
          if (existingInvitations.has(userId)) {
            console.log(`⏭️ User ${user.name} (${email}) already invited`);
            invitations.push({
              userId,
              email,
              name: user.name,
              success: false,
              error: 'Already invited to this group',
              type: 'already_invited'
            });
            continue;
          }
          
          // Create invitation
          const invitationData = createInvitation(userId);
          
          // Add invitation to group
          const invitation = group.invitations.create(invitationData);
          group.invitations.push(invitation);
          
          await group.save();
          
          // Add to user's personal notifications
          user.addNotification(
            'trip_update',
            '🎉 Trip Invitation',
            `${inviter.name} invited you to join their trip to ${group.destination}`,
            inviterId,
            {
              groupId: group._id,
              groupName: group.destination,
              inviterId: inviterId,
              inviterName: inviter.name,
              invitationId: invitation._id.toString(),
              actionUrl: `/invitations/${invitation._id}/respond`,
              originalType: 'group_invitation'
            }
          );
          
          await user.save();
          
          console.log(`✅ Successfully invited ${user.name} (${email})`);
          invitations.push({
            userId,
            email,
            name: user.name,
            invitationId: invitation._id,
            success: true,
            type: 'new_invitation'
          });
          
          invitedUsers.add(userId);
          invitedCount++;
          existingInvitations.add(userId);
          
        } catch (error) {
          console.error(`❌ Error inviting email ${email}:`, error.message);
          invitations.push({
            email,
            success: false,
            error: error.message,
            type: 'error'
          });
        }
      }
    }
    
    // Final save
    await group.save();
    console.log('✅ Group saved successfully');
    
    const successfulInvitations = invitations.filter(i => i.success);
    const failedInvitations = invitations.filter(i => !i.success);
    
    console.log(`📊 Final results: ${invitedCount} invited, ${invitations.length} total processed`);
    
    res.status(200).json({
      success: true,
      message: invitedCount > 0 
        ? `Successfully sent ${invitedCount} invitation(s)`
        : 'No new invitations sent',
      invitedCount,
      totalProcessed: invitations.length,
      successful: successfulInvitations.length,
      failed: failedInvitations.length,
      invitations,
      summary: {
        newInvitations: successfulInvitations.length,
        alreadyMembers: invitations.filter(i => i.type === 'already_member').length,
        alreadyInvited: invitations.filter(i => i.type === 'already_invited').length,
        usersNotFound: invitations.filter(i => i.type === 'user_not_found').length,
        errors: invitations.filter(i => i.type === 'error').length
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending invitations:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error while sending invitations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get group invitations for current user
// @route   GET /api/invite/my-invitations
// @access  Private
exports.getMyInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📋 Getting invitations for user:', userId);
    
    // Find groups where user is in pending invitations
    const invitations = await Group.find({
      'invitations.user': userId
    })
    .populate('createdBy', 'name profileImage')
    .populate('invitations.invitedBy', 'name profileImage')
    .select('destination description startDate endDate maxMembers currentMembers budget invitations');
    
    const formattedInvitations = invitations.flatMap(group => {
      return group.invitations
        .filter(inv => inv.user && inv.user.toString() === userId)
        .map(invitation => ({
          invitationId: invitation._id,
          groupId: group._id,
          groupName: group.destination,
          description: group.description,
          startDate: group.startDate,
          endDate: group.endDate,
          budget: group.budget,
          destination: group.destination,
          currentMembers: getApprovedMembersCount(group),
          maxMembers: group.maxMembers,
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.invitedAt,
          message: invitation.message,
          status: invitation.status || 'pending',
          respondedAt: invitation.respondedAt,
          groupData: {
            destination: group.destination,
            startDate: group.startDate,
            endDate: group.endDate,
            maxMembers: group.maxMembers,
            currentMembersCount: getApprovedMembersCount(group),
            budget: group.budget
          }
        }));
    });
    
    console.log(`✅ Found ${formattedInvitations.length} invitations`);
    
    res.status(200).json({
      success: true,
      count: formattedInvitations.length,
      data: formattedInvitations
    });
    
  } catch (error) {
    console.error('❌ Error getting invitations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while getting invitations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Respond to group invitation - FIXED VERSION
// @route   PUT /api/invite/:invitationId/respond
// @access  Private
exports.respondToInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'
    const userId = req.user.id;
    
    console.log(`📝 Responding to invitation ${invitationId} with status: ${status}`);
    
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "accepted" or "declined"'
      });
    }
    
    // Find group with this invitation
    const group = await Group.findOne({
      'invitations._id': invitationId,
      'invitations.user': userId
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    // Update invitation status
    const invitation = group.invitations.id(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found in group'
      });
    }
    
    invitation.status = status;
    invitation.respondedAt = new Date();
    
    if (status === 'accepted') {
      // Add user to group members if not already a member
      const isAlreadyMember = group.currentMembers.some(
        member => member.user && member.user.toString() === userId
      );
      
      if (!isAlreadyMember) {
        group.currentMembers.push({
          user: new mongoose.Types.ObjectId(userId),
          status: 'approved',
          joinedAt: new Date(),
          role: 'member'
        });
        
        // Notify the user about successful join
        const user = await User.findById(userId);
        if (user) {
          user.addNotification(
            'trip_update',
            '✅ Successfully Joined Trip',
            `You have successfully joined the trip to ${group.destination}`,
            group.createdBy,
            {
              groupId: group._id,
              groupName: group.destination,
              actionUrl: `/groups/${group._id}`
            }
          );
          await user.save();
        }
      }
      
      // Notify group creator
      const user = await User.findById(userId);
      const creator = await User.findById(group.createdBy);
      if (creator && user) {
        creator.addNotification(
          'trip_update',
          '✅ New Group Member',
          `${user.name} accepted your invitation to join ${group.destination}`,
          userId,
          {
            groupId: group._id,
            userId: userId,
            userName: user.name,
            actionUrl: `/groups/${group._id}`
          }
        );
        await creator.save();
      }
      
    } else if (status === 'declined') {
      // Notify group creator
      const user = await User.findById(userId);
      const creator = await User.findById(group.createdBy);
      if (creator && user) {
        creator.addNotification(
          'trip_update',
          '❌ Invitation Declined',
          `${user.name} declined your invitation to join ${group.destination}`,
          userId,
          {
            groupId: group._id,
            userId: userId,
            userName: user.name
          }
        );
        await creator.save();
      }
    }
    
    await group.save();
    
    console.log(`✅ Invitation ${status} successfully`);
    
    res.status(200).json({
      success: true,
      message: `Invitation ${status} successfully`,
      data: {
        groupId: group._id,
        groupName: group.destination,
        status: status,
        redirectUrl: status === 'accepted' ? `/groups/${group._id}` : '/invites'
      }
    });
    
  } catch (error) {
    console.error('❌ Error responding to invitation:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error while responding to invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get invitation details
// @route   GET /api/invite/:invitationId
// @access  Private
exports.getInvitationDetails = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;
    
    console.log(`📋 Getting details for invitation: ${invitationId}`);
    
    // Find group with this invitation
    const group = await Group.findOne({
      'invitations._id': invitationId,
      'invitations.user': userId
    })
    .populate('createdBy', 'name profileImage')
    .populate('invitations.invitedBy', 'name profileImage')
    .populate('currentMembers.user', 'name profilePicture');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    const invitation = group.invitations.id(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found in group'
      });
    }
    
    // Format the response
    const formattedInvitation = {
      invitationId: invitation._id,
      groupId: group._id,
      groupName: group.destination,
      description: group.description,
      startDate: group.startDate,
      endDate: group.endDate,
      budget: group.budget,
      destination: group.destination,
      currentMembers: getApprovedMembersCount(group),
      maxMembers: group.maxMembers,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.invitedAt,
      message: invitation.message,
      status: invitation.status || 'pending',
      respondedAt: invitation.respondedAt,
      groupData: {
        destination: group.destination,
        startDate: group.startDate,
        endDate: group.endDate,
        maxMembers: group.maxMembers,
        currentMembersCount: getApprovedMembersCount(group),
        members: group.currentMembers?.map(member => ({
          name: member.user?.name,
          profilePicture: member.user?.profilePicture,
          role: member.role
        })) || []
      }
    };
    
    console.log(`✅ Found invitation for ${group.destination}`);
    
    res.status(200).json({
      success: true,
      data: formattedInvitation
    });
    
  } catch (error) {
    console.error('❌ Error getting invitation details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting invitation details'
    });
  }
};