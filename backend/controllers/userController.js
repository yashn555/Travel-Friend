const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');

// @desc    Get user profile
// @route   GET /api/users/profile/:userId
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    
    let user;
    
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId)
        .select('-password -otp -notifications')
        .populate('followers.user', 'name profileImage')
        .populate('following.user', 'name profileImage')
        .populate('friends.user', 'name profileImage')
        .populate('pastTrips')
        .lean();
    } else {
      user = await User.findOne({ username: userId })
        .select('-password -otp -notifications')
        .populate('followers.user', 'name profileImage')
        .populate('following.user', 'name profileImage')
        .populate('friends.user', 'name profileImage')
        .populate('pastTrips')
        .lean();
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if current user is following this user
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      user.isFollowing = currentUser.following.some(f => f.user.toString() === userId);
      user.isFriend = currentUser.friends.some(
        f => f.user.toString() === userId && f.status === 'accepted'
      );
    }
    
    // Calculate mutual friends if current user is logged in
    if (currentUserId && currentUserId !== userId) {
      const currentUser = await User.findById(currentUserId);
      const mutualFriends = user.friends.filter(friend => 
        currentUser.friends.some(f => 
          f.user.toString() === friend.user.toString() && 
          f.status === 'accepted'
        )
      );
      user.mutualFriendsCount = mutualFriends.length;
    }
    
    // Get user's upcoming trips
    const upcomingTrips = await Group.find({
      'currentMembers.user': userId,
      startDate: { $gte: new Date() },
      status: { $in: ['planning', 'confirmed'] }
    })
    .select('destination startDate endDate maxMembers currentMembers')
    .populate('currentMembers.user', 'name profileImage')
    .lean();
    
    user.upcomingTrips = upcomingTrips;
    
    res.status(200).json({
      success: true,
      profile: user
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Get my profile
// @route   GET /api/dashboard/profile
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .select('-password -otp')
      .populate('followers.user', 'name profileImage')
      .populate('following.user', 'name profileImage')
      .populate('friends.user', 'name profileImage')
      .populate('friendRequests.from', 'name profileImage')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get upcoming trips
    const upcomingTrips = await Group.find({
      'currentMembers.user': userId,
      startDate: { $gte: new Date() },
      status: { $in: ['planning', 'confirmed'] }
    })
    .select('destination startDate endDate maxMembers currentMembers')
    .populate('currentMembers.user', 'name profileImage')
    .lean();
    
    user.upcomingTrips = upcomingTrips;
    
    // Get pending friend requests count
    user.pendingFriendRequests = user.friendRequests.filter(
      req => req.status === 'pending'
    ).length;
    
    res.status(200).json({
      success: true,
      profile: user
    });
    
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update profile
// @route   PUT /api/dashboard/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData.email;
    delete updateData.password;
    delete updateData.role;
    delete updateData.isVerified;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update stats
    user.updateStats();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: user
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/dashboard/profile/upload-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: req.file.filename },
      { new: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: req.file.filename
    });
    
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading image'
    });
  }
};

// @desc    Get my stats
// @route   GET /api/dashboard/stats
// @access  Private
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('stats pastTrips');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate additional stats
    const groupsCreated = await Group.countDocuments({ createdBy: userId });
    const groupsJoined = await Group.countDocuments({
      'currentMembers.user': userId,
      'currentMembers.status': 'approved'
    });
    
    // Get recent activity
    const recentActivity = await Group.find({
      'currentMembers.user': userId,
      status: { $in: ['planning', 'confirmed', 'active'] }
    })
    .select('destination startDate status')
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();
    
    const stats = {
      ...user.stats,
      groupsCreated,
      groupsJoined,
      totalTrips: user.pastTrips.length,
      recentActivity
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get my stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats'
    });
  }
};

// @desc    Get user stats
// @route   GET /api/users/stats/:userId
// @access  Public
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('stats pastTrips');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate additional stats
    const groupsCreated = await Group.countDocuments({ createdBy: userId });
    const groupsJoined = await Group.countDocuments({
      'currentMembers.user': userId,
      'currentMembers.status': 'approved'
    });
    
    const stats = {
      ...user.stats,
      groupsCreated,
      groupsJoined,
      totalTrips: user.pastTrips.length
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats'
    });
  }
};

// @desc    Follow a user
// @route   POST /api/users/follow/:userId
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if already following
    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.some(f => f.user.toString() === targetUserId);
    
    if (isFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }
    
    // Add to following list
    currentUser.following.push({ 
      user: targetUserId,
      followedAt: new Date()
    });
    await currentUser.save();
    
    // Add to target user's followers
    targetUser.followers.push({ 
      user: currentUserId,
      followedAt: new Date()
    });
    
    // Send notification to target user
    targetUser.addNotification(
      'follow',
      'New Follower',
      `${currentUser.name} started following you`,
      currentUserId,
      { action: 'view_profile' }
    );
    
    await targetUser.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully followed user',
      data: {
        isFollowing: true,
        followersCount: targetUser.followers.length
      }
    });
    
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/follow/:userId
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if actually following
    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.some(f => f.user.toString() === targetUserId);
    
    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Not following this user'
      });
    }
    
    // Remove from following list
    currentUser.following = currentUser.following.filter(
      f => f.user.toString() !== targetUserId
    );
    await currentUser.save();
    
    // Remove from target user's followers
    targetUser.followers = targetUser.followers.filter(
      f => f.user.toString() !== currentUserId
    );
    await targetUser.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user',
      data: {
        isFollowing: false,
        followersCount: targetUser.followers.length
      }
    });
    
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfollowing user'
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/followers/:userId
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'followers.user',
        select: 'name profileImage bio city rating followersCount',
        options: { 
          limit: parseInt(limit), 
          skip: parseInt(skip),
          sort: { followedAt: -1 }
        }
      })
      .select('followers');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const followers = user.followers.map(f => ({
      ...f.user.toObject(),
      followedAt: f.followedAt
    }));
    
    res.status(200).json({
      success: true,
      data: followers,
      count: followers.length,
      total: user.followers.length
    });
    
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching followers'
    });
  }
};

// @desc    Get users I'm following
// @route   GET /api/users/following/:userId
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'following.user',
        select: 'name profileImage bio city rating followersCount',
        options: { 
          limit: parseInt(limit), 
          skip: parseInt(skip),
          sort: { followedAt: -1 }
        }
      })
      .select('following');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const following = user.following.map(f => ({
      ...f.user.toObject(),
      followedAt: f.followedAt
    }));
    
    res.status(200).json({
      success: true,
      data: following,
      count: following.length,
      total: user.following.length
    });
    
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching following'
    });
  }
};

// @desc    Get my followers
// @route   GET /api/dashboard/followers
// @access  Private
exports.getMyFollowers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'followers.user',
        select: 'name profileImage bio city rating isFollowing',
        options: { 
          limit: parseInt(limit), 
          skip: parseInt(skip),
          sort: { followedAt: -1 }
        }
      })
      .select('followers');
    
    // Check if I'm following them back
    const followersWithStatus = await Promise.all(
      user.followers.map(async (follower) => {
        const followerUser = follower.user;
        const isFollowingBack = user.following.some(
          f => f.user.toString() === followerUser._id.toString()
        );
        
        return {
          ...followerUser.toObject(),
          followedAt: follower.followedAt,
          isFollowingBack
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: followersWithStatus,
      count: followersWithStatus.length,
      total: user.followers.length
    });
    
  } catch (error) {
    console.error('Get my followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching followers'
    });
  }
};

// @desc    Get users I'm following
// @route   GET /api/dashboard/following
// @access  Private
exports.getMyFollowing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'following.user',
        select: 'name profileImage bio city rating followersCount',
        options: { 
          limit: parseInt(limit), 
          skip: parseInt(skip),
          sort: { followedAt: -1 }
        }
      })
      .select('following');
    
    // Check if they follow me back
    const followingWithStatus = await Promise.all(
      user.following.map(async (follow) => {
        const followingUser = follow.user;
        const followsMeBack = user.followers.some(
          f => f.user.toString() === followingUser._id.toString()
        );
        
        return {
          ...followingUser.toObject(),
          followedAt: follow.followedAt,
          followsMeBack
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: followingWithStatus,
      count: followingWithStatus.length,
      total: user.following.length
    });
    
  } catch (error) {
    console.error('Get my following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching following'
    });
  }
};

// @desc    Get user friends
// @route   GET /api/users/friends/:userId
// @access  Public
exports.getUserFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'friends.user',
        select: 'name profileImage bio city rating travelPreferences',
        match: { status: 'accepted' },
        options: { 
          limit: parseInt(limit), 
          skip: parseInt(skip),
          sort: { becameFriendsAt: -1 }
        }
      })
      .select('friends');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const friends = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => ({
        ...f.user.toObject(),
        becameFriendsAt: f.becameFriendsAt,
        friendshipId: f._id
      }));
    
    res.status(200).json({
      success: true,
      data: friends,
      count: friends.length,
      total: user.friends.filter(f => f.status === 'accepted').length
    });
    
  } catch (error) {
    console.error('Get user friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching friends'
    });
  }
};

// @desc    Get my friends
// @route   GET /api/dashboard/friends
// @access  Private
exports.getMyFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0, search } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'friends.user',
        select: 'name profileImage bio city rating mobile upiId travelPreferences',
        match: { 
          status: 'accepted',
          ...(search && {
            'user.name': { $regex: search, $options: 'i' }
          })
        },
        options: { 
          limit: parseInt(limit), 
          skip: parseInt(skip),
          sort: { becameFriendsAt: -1 }
        }
      })
      .select('friends');
    
    const friends = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => ({
        ...f.user.toObject(),
        becameFriendsAt: f.becameFriendsAt,
        friendshipId: f._id
      }));
    
    res.status(200).json({
      success: true,
      data: friends,
      count: friends.length,
      total: user.friends.filter(f => f.status === 'accepted').length
    });
    
  } catch (error) {
    console.error('Get my friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching friends'
    });
  }
};

// @desc    Send friend request
// @route   POST /api/users/friend-request/:userId
// @access  Private
exports.sendFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    const { message } = req.body;
    
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send friend request to yourself'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if already friends
    const currentUser = await User.findById(currentUserId);
    const isAlreadyFriend = currentUser.friends.some(
      f => f.user.toString() === targetUserId && f.status === 'accepted'
    );
    
    if (isAlreadyFriend) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }
    
    // Check if request already sent
    const existingRequest = targetUser.friendRequests.find(
      req => req.from.toString() === currentUserId && req.status === 'pending'
    );
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }
    
    // Send friend request
    targetUser.friendRequests.push({
      from: currentUserId,
      message: message || `${currentUser.name} wants to be your friend`,
      status: 'pending',
      sentAt: new Date()
    });
    
    // Send notification to target user
    targetUser.addNotification(
      'friend_request',
      'New Friend Request',
      `${currentUser.name} sent you a friend request`,
      currentUserId,
      { 
        action: 'view_request',
        requestId: targetUser.friendRequests[targetUser.friendRequests.length - 1]._id
      }
    );
    
    await targetUser.save();
    
    res.status(200).json({
      success: true,
      message: 'Friend request sent successfully'
    });
    
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending friend request'
    });
  }
};

// @desc    Accept friend request
// @route   PUT /api/users/friend-request/accept/:requestId
// @access  Private
exports.acceptFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { requestId } = req.params;
    
    const currentUser = await User.findById(currentUserId);
    
    // Find the friend request
    const friendRequest = currentUser.friendRequests.id(requestId);
    
    if (!friendRequest || friendRequest.status !== 'pending') {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found or already processed'
      });
    }
    
    const requesterId = friendRequest.from;
    
    // Accept the request
    friendRequest.status = 'accepted';
    
    // Add to current user's friends list
    currentUser.friends.push({
      user: requesterId,
      status: 'accepted',
      becameFriendsAt: new Date()
    });
    
    // Add to requester's friends list
    const requester = await User.findById(requesterId);
    requester.friends.push({
      user: currentUserId,
      status: 'accepted',
      becameFriendsAt: new Date()
    });
    
    // Remove from requester's pending requests (if any)
    const reverseRequest = requester.friendRequests.find(
      req => req.from.toString() === currentUserId && req.status === 'pending'
    );
    if (reverseRequest) {
      reverseRequest.status = 'accepted';
    }
    
    // Send notification to requester
    requester.addNotification(
      'friend_request',
      'Friend Request Accepted',
      `${currentUser.name} accepted your friend request`,
      currentUserId,
      { action: 'view_profile' }
    );
    
    await currentUser.save();
    await requester.save();
    
    res.status(200).json({
      success: true,
      message: 'Friend request accepted successfully',
      data: {
        friendId: requesterId,
        friendshipId: currentUser.friends[currentUser.friends.length - 1]._id
      }
    });
    
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting friend request'
    });
  }
};

// @desc    Reject friend request
// @route   PUT /api/users/friend-request/reject/:requestId
// @access  Private
exports.rejectFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { requestId } = req.params;
    
    const currentUser = await User.findById(currentUserId);
    
    // Find the friend request
    const friendRequest = currentUser.friendRequests.id(requestId);
    
    if (!friendRequest || friendRequest.status !== 'pending') {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found or already processed'
      });
    }
    
    const requesterId = friendRequest.from;
    
    // Reject the request
    friendRequest.status = 'rejected';
    
    // Send notification to requester
    const requester = await User.findById(requesterId);
    requester.addNotification(
      'friend_request',
      'Friend Request Rejected',
      `${currentUser.name} declined your friend request`,
      currentUserId
    );
    
    await currentUser.save();
    await requester.save();
    
    res.status(200).json({
      success: true,
      message: 'Friend request rejected successfully'
    });
    
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting friend request'
    });
  }
};

// @desc    Get friend requests
// @route   GET /api/friend-requests
// @access  Private
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'pending', limit = 20, skip = 0 } = req.query;
    
    const user = await User.findById(userId)
      .populate({
        path: 'friendRequests.from',
        select: 'name profileImage bio city',
        match: { status },
        options: { 
          limit: parseInt(limit), 
          skip: parseInt(skip),
          sort: { sentAt: -1 }
        }
      })
      .select('friendRequests');
    
    const requests = user.friendRequests
      .filter(req => req.status === status)
      .map(req => ({
        ...req.from.toObject(),
        requestId: req._id,
        message: req.message,
        sentAt: req.sentAt,
        status: req.status
      }));
    
    res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
      total: user.friendRequests.filter(req => req.status === status).length
    });
    
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching friend requests'
    });
  }
};

// @desc    Get mutual connections
// @route   GET /api/users/mutual/:userId
// @access  Private
exports.getMutualConnections = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    const { limit = 20, skip = 0 } = req.query;
    
    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot get mutual connections with yourself'
      });
    }
    
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).select('friends'),
      User.findById(userId).select('friends')
    ]);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get mutual friends
    const currentFriends = currentUser.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user.toString());
    
    const targetFriends = targetUser.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user.toString());
    
    const mutualFriendIds = currentFriends.filter(id => targetFriends.includes(id));
    
    // Get mutual friends details
    const mutualFriends = await User.find({
      _id: { $in: mutualFriendIds }
    })
    .select('name profileImage bio city rating')
    .limit(parseInt(limit))
    .skip(parseInt(skip));
    
    res.status(200).json({
      success: true,
      data: mutualFriends,
      count: mutualFriends.length,
      total: mutualFriendIds.length
    });
    
  } catch (error) {
    console.error('Get mutual connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching mutual connections'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res) => {
  try {
    const { q, city, preferences, isFriend = false } = req.query;
    const currentUserId = req.user?.id;
    const { limit = 20, skip = 0 } = req.query;
    
    let query = { _id: { $ne: currentUserId } };
    
    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    
    // City filter
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    // Preferences filter
    if (preferences) {
      const prefs = preferences.split(',');
      query.$or = prefs.map(pref => ({
        [`travelPreferences.${pref}`]: true
      }));
    }
    
    const users = await User.find(query)
      .select('name profileImage bio city rating followersCount followingCount travelPreferences')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ rating: -1, followersCount: -1 });
    
    // If current user is logged in, add friendship status
    let usersWithStatus = users;
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('friends following');
      
      usersWithStatus = users.map(user => {
        const isFriend = currentUser.friends.some(
          f => f.user.toString() === user._id.toString() && f.status === 'accepted'
        );
        const isFollowing = currentUser.following.some(
          f => f.user.toString() === user._id.toString()
        );
        
        return {
          ...user.toObject(),
          isFriend,
          isFollowing
        };
      });
    }
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: usersWithStatus,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

// @desc    Remove friend
// @route   DELETE /api/users/friends/:friendshipId
// @access  Private
exports.removeFriend = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { friendshipId } = req.params;
    
    const currentUser = await User.findById(currentUserId);
    
    // Find the friendship
    const friendship = currentUser.friends.id(friendshipId);
    
    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }
    
    const friendId = friendship.user;
    
    // Remove from current user's friends list
    currentUser.friends = currentUser.friends.filter(
      f => f._id.toString() !== friendshipId
    );
    
    // Remove from friend's friends list
    const friend = await User.findById(friendId);
    friend.friends = friend.friends.filter(
      f => f.user.toString() !== currentUserId
    );
    
    await currentUser.save();
    await friend.save();
    
    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
    
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing friend'
    });
  }
};

// @desc    Get suggested friends
// @route   GET /api/users/suggested
// @access  Private
exports.getSuggestedFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    
    const user = await User.findById(userId).select('friends city travelPreferences');
    
    // Get friends of friends
    const friendIds = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user);
    
    // Find users with similar interests or location
    const suggestions = await User.find({
      _id: { 
        $ne: userId,
        $nin: friendIds 
      },
      $or: [
        { city: user.city },
        { 'travelPreferences.adventure': user.travelPreferences?.adventure },
        { 'travelPreferences.beach': user.travelPreferences?.beach },
        { 'travelPreferences.mountain': user.travelPreferences?.mountain }
      ]
    })
    .select('name profileImage bio city rating mutualFriendsCount')
    .limit(parseInt(limit))
    .sort({ rating: -1, followersCount: -1 });
    
    // Calculate mutual friends count
    const suggestionsWithMutual = await Promise.all(
      suggestions.map(async (suggestion) => {
        const mutualCount = await User.countDocuments({
          _id: suggestion._id,
          'friends.user': { $in: friendIds },
          'friends.status': 'accepted'
        });
        
        return {
          ...suggestion.toObject(),
          mutualFriendsCount: mutualCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: suggestionsWithMutual
    });
    
  } catch (error) {
    console.error('Get suggested friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting suggested friends'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { town: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { state: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user?.id } // Exclude current user
    })
    .select('name profileImage bio town city state rating followers following friends')
    .limit(20)
    .lean();
    
    // Calculate mutual friends if user is logged in
    if (req.user?.id) {
      const currentUser = await User.findById(req.user.id).select('friends');
      const currentUserFriends = currentUser.friends
        .filter(f => f.status === 'accepted')
        .map(f => f.user.toString());
      
      const usersWithMutual = users.map(user => {
        const userFriends = user.friends
          ?.filter(f => f.status === 'accepted')
          .map(f => f.user.toString()) || [];
        
        const mutualFriends = currentUserFriends.filter(friendId => 
          userFriends.includes(friendId)
        );
        
        return {
          ...user,
          mutualFriendsCount: mutualFriends.length,
          isFollowing: currentUser.following?.some(f => f.user.toString() === user._id.toString()),
          isFriend: currentUserFriends.includes(user._id.toString())
        };
      });
      
      return res.status(200).json({
        success: true,
        data: usersWithMutual
      });
    }
    
    res.status(200).json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};
// @desc    Search users
// @route   GET /api/profile/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    // Search users (excluding current user)
    const users = await User.find({
      $and: [
        { 
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { town: { $regex: q, $options: 'i' } },
            { state: { $regex: q, $options: 'i' } },
            { bio: { $regex: q, $options: 'i' } }
          ]
        },
        { _id: { $ne: currentUserId } } // Exclude current user
      ]
    })
    .select('name profileImage email town state bio rating followers following')
    .limit(20)
    .lean();
    
    // Get current user's following list to check follow status
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = currentUser.following.map(f => f.user.toString());
    
    // Add follow status to each user
    const usersWithStatus = users.map(user => ({
      ...user,
      isFollowing: followingIds.includes(user._id.toString()),
      isFriend: false, // You can implement friend check later
      mutualFriendsCount: 0 // You can implement mutual friends later
    }));
    
    res.status(200).json({
      success: true,
      data: usersWithStatus
    });
    
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

// @desc    Follow a user
// @route   POST /api/profile/follow/:userId
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get current user
    const currentUser = await User.findById(currentUserId);
    
    // Check if already following
    const isAlreadyFollowing = currentUser.following.some(
      f => f.user.toString() === targetUserId
    );
    
    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }
    
    // Add to current user's following list
    currentUser.following.push({
      user: targetUserId,
      followedAt: new Date()
    });
    
    // Add to target user's followers list
    targetUser.followers.push({
      user: currentUserId,
      followedAt: new Date()
    });
    
    // Save both users
    await currentUser.save();
    await targetUser.save();
    
    // Add notification to target user (optional)
    targetUser.addNotification(
      'follow',
      'New Follower',
      `${currentUser.name} started following you`,
      currentUserId
    );
    await targetUser.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully followed user'
    });
    
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/profile/follow/:userId
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    
    // Get current user
    const currentUser = await User.findById(currentUserId);
    
    // Remove from following list
    currentUser.following = currentUser.following.filter(
      f => f.user.toString() !== targetUserId
    );
    
    // Get target user and remove from followers list
    const targetUser = await User.findById(targetUserId);
    if (targetUser) {
      targetUser.followers = targetUser.followers.filter(
        f => f.user.toString() !== currentUserId
      );
      await targetUser.save();
    }
    
    await currentUser.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user'
    });
    
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfollowing user'
    });
  }
};