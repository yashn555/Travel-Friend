// server/controllers/profileController.js - UPDATED
const User = require('../models/User');
const Group = require('../models/Group');
const fs = require('fs');
const path = require('path');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    console.log('👤 Fetching profile for user:', req.user.id);
    
    const user = await User.findById(req.user.id)
      .select('-password -otp -notifications');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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
    
    // Safely handle pastTrips - ensure it's an array
    const pastTrips = Array.isArray(user.pastTrips) ? user.pastTrips : [];
    
    const profileData = {
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        bio: user.bio || '',
        travelPreferences: user.travelPreferences || {
          adventure: false,
          luxury: false,
          budget: false,
          solo: false,
          group: false,
          beach: false,
          mountain: false,
          cultural: false
        },
        isAnonymous: user.isAnonymous || false,
        isVerified: user.isVerified || false,
        rating: user.rating || 4.5,
        role: user.role || 'user',
        createdAt: user.createdAt
      },
      stats: {
        createdTrips: await Group.countDocuments({ createdBy: req.user.id }),
        joinedTrips: await Group.countDocuments({
          'currentMembers.user': req.user.id,
          'currentMembers.status': 'approved'
        }),
        completedTrips: await Group.countDocuments({
          'currentMembers.user': req.user.id,
          'currentMembers.status': 'approved',
          status: 'completed'
        })
      },
      trips: {
        created: createdGroups,
        joined: joinedGroups
      },
      pastTrips: pastTrips
    };
    
    console.log('✅ Profile fetched successfully');
    res.status(200).json(profileData);
    
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
    
    const { name, bio, travelPreferences, isAnonymous, town, state } = req.body;
    
    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (town !== undefined) updateData.town = town;
    if (state !== undefined) updateData.state = state;
    if (travelPreferences) updateData.travelPreferences = travelPreferences;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -otp -notifications');
    
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
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        bio: user.bio,
        travelPreferences: user.travelPreferences,
        isAnonymous: user.isAnonymous,
        town: user.town,
        state: user.state
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating profile:', error.message);
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
    ).select('-password -otp -notifications');
    
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

// ... rest of the functions remain the same ...

// @desc    Get user notifications
// @route   GET /api/profile/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    
    res.status(200).json({
      success: true,
      notifications: user.notifications
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