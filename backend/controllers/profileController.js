// server/controllers/profileController.js - UPDATED VERSION
const User = require('../models/User');
const Group = require('../models/Group');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    console.log('👤 Fetching profile for user:', req.user.id);
    
    const user = await User.findById(req.user.id)
      .select('-password -otp')
      .populate('followers.user', 'name profileImage')
      .populate('following.user', 'name profileImage')
      .populate('friends.user', 'name profileImage');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate real stats from arrays
    const realStats = {
      tripsCount: user.pastTrips ? user.pastTrips.length : 0,
      friendsCount: user.friends ? user.friends.filter(f => f.status === 'accepted').length : 0,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      totalDistance: 0,
      countriesVisited: 0
    };
    
    // Update user stats if they're different
    if (JSON.stringify(user.stats) !== JSON.stringify(realStats)) {
      user.stats = realStats;
      await user.save();
    }
    
    // Get user's created and joined groups
    const createdGroups = await Group.find({ createdBy: req.user.id })
      .select('destination startDate endDate status maxMembers currentMembers')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const joinedGroups = await Group.find({
      'currentMembers.user': req.user.id,
      'currentMembers.status': 'approved'
    })
    .select('destination startDate endDate status createdBy currentMembers maxMembers')
    .populate('createdBy', 'name')
    .sort({ startDate: -1 })
    .limit(5);
    
    // Prepare comprehensive profile response
    const profileResponse = {
      success: true,
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        upiId: user.upiId,
        profileImage: user.profileImage,
        bio: user.bio || '',
        town: user.town || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India',
        dateOfBirth: user.dateOfBirth || null,
        gender: user.gender || 'prefer-not-to-say',
        languages: user.languages || [],
        travelPreferences: user.travelPreferences || {
          adventure: false,
          luxury: false,
          budget: false,
          solo: false,
          group: false,
          beach: false,
          mountain: false,
          cultural: false,
          backpacking: false,
          roadtrip: false,
          family: false,
          soloFemale: false
        },
        travelExperience: user.travelExperience || 'beginner',
        travelBudget: user.travelBudget || 'medium',
        preferredTransport: user.preferredTransport || [],
        socialLinks: user.socialLinks || {
          instagram: '',
          twitter: '',
          facebook: '',
          linkedin: ''
        },
        stats: user.stats || {
          tripsCount: 0,
          friendsCount: 0,
          followersCount: 0,
          followingCount: 0,
          totalDistance: 0,
          countriesVisited: 0
        },
        isAnonymous: user.isAnonymous || false,
        isVerified: user.isVerified || false,
        isPremium: user.isPremium || false,
        rating: user.rating || 4.5,
        role: user.role || 'user',
        privacySettings: user.privacySettings || {
          profileVisibility: 'public',
          showOnlineStatus: true,
          showLastSeen: true,
          showTripsTo: 'friends'
        },
        followers: user.followers || [],
        following: user.following || [],
        friends: user.friends || [],
        pastTrips: user.pastTrips || [],
        upcomingTrips: user.upcomingTrips || [],
        reviews: user.reviews || [],
        notifications: user.notifications || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
    
    console.log('✅ Profile fetched successfully');
    res.status(200).json(profileResponse);
    
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile/update
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    console.log('✏️ Updating profile for user:', req.user.id);
    console.log('📝 Update data received:', req.body);
    
    const {
      name, bio, travelPreferences, isAnonymous, 
      town, city, state, country, dateOfBirth, gender,
      languages, travelExperience, travelBudget, preferredTransport,
      socialLinks, upiId
    } = req.body;
    
    // Build update object with all possible fields
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (town !== undefined) updateData.town = town;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (languages !== undefined) updateData.languages = languages;
    if (travelPreferences) updateData.travelPreferences = travelPreferences;
    if (travelExperience !== undefined) updateData.travelExperience = travelExperience;
    if (travelBudget !== undefined) updateData.travelBudget = travelBudget;
    if (preferredTransport !== undefined) updateData.preferredTransport = preferredTransport;
    if (socialLinks) updateData.socialLinks = socialLinks;
    if (upiId !== undefined) updateData.upiId = upiId;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;
    
    console.log('📋 Update data to save:', updateData);
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -otp');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ Profile updated successfully');
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        upiId: user.upiId,
        profileImage: user.profileImage,
        bio: user.bio,
        town: user.town,
        city: user.city,
        state: user.state,
        country: user.country,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        languages: user.languages,
        travelPreferences: user.travelPreferences,
        travelExperience: user.travelExperience,
        travelBudget: user.travelBudget,
        preferredTransport: user.preferredTransport,
        socialLinks: user.socialLinks,
        stats: user.stats,
        isAnonymous: user.isAnonymous,
        rating: user.rating
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating profile:', error.message);
    console.error('Error details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/profile/upload-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    console.log('🖼️ Uploading profile image for user:', req.user.id);
    
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }
    
    const image = req.files.image;
    
    // Check file type
    if (!image.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file (jpg, jpeg, png)'
      });
    }
    
    // Check file size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 5MB'
      });
    }
    
    // Create custom filename
    const extension = image.name.split('.').pop();
    const filename = `profile-${req.user.id}-${Date.now()}.${extension}`;
    
    // Define upload path
    const uploadPath = path.join(__dirname, '../uploads/profiles', filename);
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Move the file
    await image.mv(uploadPath);
    
    // Update user profile image
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: filename },
      { new: true }
    ).select('-password -otp');
    
    console.log('✅ Profile image uploaded successfully');
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: filename,
      imageUrl: `/uploads/profiles/${filename}`
    });
    
  } catch (error) {
    console.error('❌ Error uploading profile image:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Change password
// @route   PUT /api/profile/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    console.log('🔐 Changing password for user:', req.user.id);
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    console.log('✅ Password changed successfully');
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/profile/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    console.log('🗑️ Deleting account for user:', req.user.id);
    
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to confirm account deletion'
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    // Soft delete: mark as inactive instead of removing
    user.isActive = false;
    user.email = `deleted-${Date.now()}-${user.email}`;
    user.mobile = `deleted-${Date.now()}-${user.mobile}`;
    await user.save();
    
    console.log('✅ Account marked as deleted');
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting account:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user stats
// @route   GET /api/profile/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate real stats
    const stats = {
      tripsCount: user.pastTrips ? user.pastTrips.length : 0,
      friendsCount: user.friends ? user.friends.filter(f => f.status === 'accepted').length : 0,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      totalDistance: user.stats?.totalDistance || 0,
      countriesVisited: user.stats?.countriesVisited || 0,
      createdTripsCount: await Group.countDocuments({ createdBy: req.user.id }),
      joinedTripsCount: await Group.countDocuments({
        'currentMembers.user': req.user.id,
        'currentMembers.status': 'approved'
      })
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error getting user stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while getting stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get friends list
// @route   GET /api/profile/friends
// @access  Private
exports.getFriendsList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends.user', 'name profileImage email mobile town city state')
      .select('friends');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Filter only accepted friends
    const friends = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user);
    
    res.status(200).json({
      success: true,
      data: friends
    });
    
  } catch (error) {
    console.error('❌ Error getting friends list:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while getting friends list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get followers list
// @route   GET /api/profile/followers
// @access  Private
exports.getFollowersList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers.user', 'name profileImage email mobile town city state')
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
      data: followers
    });
    
  } catch (error) {
    console.error('❌ Error getting followers list:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while getting followers list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get following list
// @route   GET /api/profile/following
// @access  Private
exports.getFollowingList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('following.user', 'name profileImage email mobile town city state')
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
      data: following
    });
    
  } catch (error) {
    console.error('❌ Error getting following list:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while getting following list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user notifications
// @route   GET /api/profile/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    
    res.status(200).json({
      success: true,
      data: user.notifications
    });
    
  } catch (error) {
    console.error('❌ Error fetching notifications:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/profile/notifications/:notificationId/read
// @access  Private
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const user = await User.findById(req.user.id);
    const notification = user.notifications.id(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notification.read = true;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('❌ Error marking notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/profile/notifications
// @access  Private
exports.clearAllNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.notifications = [];
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'All notifications cleared'
    });
    
  } catch (error) {
    console.error('❌ Error clearing notifications:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Search users
// @route   GET /api/profile/search?q=query
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }
    
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { town: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { state: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }, // Exclude current user
      isActive: true
    })
    .select('name profileImage email mobile town city state bio rating stats')
    .limit(20);
    
    res.status(200).json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('❌ Error searching users:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// In your profileController.js, replace the getTripHistory function with this:

// @desc    Get user's trip history
// @route   GET /api/profile/trips
// @access  Private
exports.getTripHistory = async (req, res) => {
  try {
    console.log('📅 Fetching trip history for user:', req.user.id);
    
    const mongoose = require('mongoose');
    const userId = req.user.id;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Convert to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // 🔥 IMPORTANT: First auto-complete any past trips for this user
    const now = new Date();
    
    // Update user's past trips to completed status
    await Group.updateMany(
      {
        $or: [
          { createdBy: userObjectId },
          { 
            'currentMembers.user': userObjectId,
            'currentMembers.status': 'approved'
          }
        ],
        endDate: { $lt: now },
        status: { $in: ['planning', 'confirmed', 'active'] }
      },
      {
        $set: { status: 'completed' }
      }
    );

    // Now fetch completed trips
    const trips = await Group.find({
      $or: [
        { createdBy: userObjectId },
        { 
          'currentMembers.user': userObjectId,
          'currentMembers.status': 'approved'
        }
      ],
      status: 'completed'
    })
    .populate('createdBy', 'name profileImage email')
    .populate('currentMembers.user', 'name profileImage email')
    .select('destination startDate endDate status description budget currentMembers maxMembers createdBy startingLocation destinationLocation tags')
    .sort({ endDate: -1 })
    .limit(50);

    // Format the response
    const formattedTrips = trips.map(trip => {
      const approvedMembers = trip.currentMembers ? 
        trip.currentMembers.filter(m => m && m.status === 'approved') : 
        [];
      
      const isCreator = trip.createdBy ? 
        trip.createdBy._id.toString() === userId.toString() : 
        false;
      
      // Calculate duration
      let durationDays = 1;
      if (trip.startDate && trip.endDate) {
        try {
          const start = new Date(trip.startDate);
          const end = new Date(trip.endDate);
          durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          if (durationDays < 1) durationDays = 1;
        } catch (e) {
          console.error('Error calculating duration:', e);
        }
      }
      
      return {
        _id: trip._id,
        destination: trip.destination || 'Unnamed Trip',
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        description: trip.description || '',
        groupSize: approvedMembers.length,
        maxMembers: trip.maxMembers || 0,
        budget: trip.budget || { min: 0, max: 0, currency: 'INR' },
        isCreator: isCreator,
        durationDays: durationDays,
        startingLocation: trip.startingLocation,
        destinationLocation: trip.destinationLocation,
        tags: trip.tags || [],
        createdBy: {
          _id: trip.createdBy._id,
          name: trip.createdBy.name,
          profileImage: trip.createdBy.profileImage
        },
        members: approvedMembers.map(m => ({
          _id: m.user._id,
          name: m.user.name,
          profileImage: m.user.profileImage
        }))
      };
    });

    console.log(`✅ Returning ${formattedTrips.length} completed trips for user ${userId}`);
    
    res.status(200).json({
      success: true,
      count: formattedTrips.length,
      data: formattedTrips
    });
    
  } catch (error) {
    console.error('❌ Error in getTripHistory:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trip history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};