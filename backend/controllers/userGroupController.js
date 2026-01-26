const Group = require('../models/Group');

// Get groups that the user has joined
const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get current date for trip status
    const currentDate = new Date();
    
    // First, get all groups user is involved with
    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { 'currentMembers.user': userId },
        { 'joinRequests.user': userId }
      ]
    })
    .populate('createdBy', 'name email profilePicture')
    .populate('currentMembers.user', 'name email profilePicture')
    .populate({
      path: 'joinRequests.user',
      select: 'name email',
      match: { _id: userId } // Only populate requests for current user
    })
    .lean(); // Use lean for better performance

    // Process groups to add membership status and trip status
    const processedGroups = groups.map(group => {
      // Determine membership status
      let membershipStatus = 'none';
      
      // Check if creator
      const isCreator = group.createdBy?._id?.toString() === userId.toString();
      
      // Check if member
      const isMember = group.currentMembers?.some(member => 
        member.user?._id?.toString() === userId.toString()
      );
      
      // Check for pending request
      const hasPendingRequest = group.joinRequests?.some(request => 
        request.user && request.user._id?.toString() === userId.toString() && request.status === 'pending'
      );
      
      // Check for accepted request (should already be in currentMembers)
      const hasAcceptedRequest = group.joinRequests?.some(request => 
        request.user && request.user._id?.toString() === userId.toString() && request.status === 'accepted'
      );

      if (isCreator) {
        membershipStatus = 'creator';
      } else if (isMember || hasAcceptedRequest) {
        membershipStatus = 'member';
      } else if (hasPendingRequest) {
        membershipStatus = 'pending';
      }

      // Calculate trip status
      let tripStatus = 'upcoming';
      let daysUntilTrip = null;
      
      if (group.startDate) {
        const startDate = new Date(group.startDate);
        const endDate = new Date(group.endDate);
        
        if (endDate < currentDate) {
          tripStatus = 'completed';
        } else if (startDate <= currentDate && endDate >= currentDate) {
          tripStatus = 'ongoing';
        } else {
          daysUntilTrip = Math.ceil((startDate - currentDate) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        ...group,
        membershipStatus,
        tripStatus,
        daysUntilTrip
      };
    });

    // Sort by start date (earliest first) and then by membership type
    processedGroups.sort((a, b) => {
      // First, sort by trip status: ongoing > upcoming > completed
      const statusOrder = { 'ongoing': 1, 'upcoming': 2, 'completed': 3 };
      const statusDiff = statusOrder[a.tripStatus] - statusOrder[b.tripStatus];
      if (statusDiff !== 0) return statusDiff;
      
      // Then by start date (earliest first)
      if (a.startDate && b.startDate) {
        return new Date(a.startDate) - new Date(b.startDate);
      }
      
      // Finally by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    console.log(`Found ${processedGroups.length} groups for user ${userId}`);
    console.log('Membership distribution:', {
      creator: processedGroups.filter(g => g.membershipStatus === 'creator').length,
      member: processedGroups.filter(g => g.membershipStatus === 'member').length,
      pending: processedGroups.filter(g => g.membershipStatus === 'pending').length
    });

    res.status(200).json({
      success: true,
      count: processedGroups.length,
      data: processedGroups
    });
  } catch (err) {
    console.error('Error fetching user groups:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message 
    });
  }
};

// Remove user from a group
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Group creator cannot leave. Please delete the group or transfer ownership first.' 
      });
    }

    // Check if user is a member
    const isMember = group.currentMembers.some(member => 
      member.user && member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are not a member of this group' 
      });
    }

    // Remove user from current members
    group.currentMembers = group.currentMembers.filter(
      member => member.user && member.user.toString() !== userId.toString()
    );

    // Decrease members count
    group.currentMembersCount = group.currentMembers.length;
    
    // Update isFull status
    group.isFull = group.currentMembersCount >= group.maxMembers;

    await group.save();

    res.status(200).json({ 
      success: true,
      message: 'Successfully left the group',
      data: {
        groupId: group._id,
        membersCount: group.currentMembersCount
      }
    });
  } catch (err) {
    console.error('Error leaving group:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message 
    });
  }
};

// Cancel pending join request
const cancelJoinRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Find pending request
    const pendingRequestIndex = group.joinRequests.findIndex(request => 
      request.user && request.user.toString() === userId.toString() && request.status === 'pending'
    );

    if (pendingRequestIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending join request found' 
      });
    }

    // Remove the request
    group.joinRequests.splice(pendingRequestIndex, 1);
    await group.save();

    res.status(200).json({ 
      success: true,
      message: 'Join request cancelled successfully',
      data: {
        groupId: group._id,
        remainingRequests: group.joinRequests.length
      }
    });
  } catch (err) {
    console.error('Error cancelling join request:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message 
    });
  }
};

module.exports = {
  getMyGroups,
  leaveGroup,
  cancelJoinRequest
};