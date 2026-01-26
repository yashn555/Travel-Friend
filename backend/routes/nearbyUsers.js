// backend/routes/nearbyUsers.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Helper function to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// @desc    Update user location
// @route   PUT /api/nearby-users/location
// @access  Private
router.put('/location', protect, async (req, res) => {
  try {
    const { latitude, longitude, city, country } = req.body;
    
    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Please provide latitude and longitude' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user location
    user.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)], // MongoDB uses [longitude, latitude]
      city: city || user.location?.city,
      country: country || user.location?.country,
      lastUpdated: new Date()
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      location: user.location
    });
    
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get nearby users
// @route   GET /api/nearby-users
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      maxDistance = 50, // Default 50km radius
      minDistance = 0,
      limit = 50,
      interests,
      sortBy = 'distance',
      showOnlineOnly = false
    } = req.query;
    
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser.location || !currentUser.location.coordinates) {
      return res.status(400).json({ 
        message: 'Please update your location first to find nearby users',
        code: 'LOCATION_REQUIRED'
      });
    }
    
    const [longitude, latitude] = currentUser.location.coordinates;
    
    // Build match query
    const matchQuery = {
      _id: { $ne: currentUser._id }, // Exclude current user
      'location.coordinates': { $exists: true },
      'location.coordinates.0': { $exists: true, $ne: null },
      'location.coordinates.1': { $exists: true, $ne: null }
    };
    
    // Add interests filter if provided
    if (interests) {
      const interestArray = interests.split(',').map(i => i.trim()).filter(i => i);
      if (interestArray.length > 0) {
        matchQuery.interests = { $in: interestArray };
      }
    }
    
    // Add online status filter
    if (showOnlineOnly === 'true') {
      // Check if user was active in last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      matchQuery.lastActive = { $gte: fifteenMinutesAgo };
    }
    
    // FIXED: Use proper MongoDB aggregation with $geoNear
    const users = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: "distance",
          maxDistance: parseFloat(maxDistance) * 1000, // Convert km to meters
          spherical: true,
          query: matchQuery
        }
      },
      {
        $match: {
          distance: { $gte: parseFloat(minDistance) * 1000 } // Convert km to meters
        }
      },
      {
        $addFields: {
          distance: { $divide: ["$distance", 1000] }, // Convert back to km
          isOnline: {
            $cond: {
              if: { $gte: ["$lastActive", new Date(Date.now() - 15 * 60 * 1000)] },
              then: true,
              else: false
            }
          },
          mutualInterests: {
            $size: {
              $setIntersection: [
                { $ifNull: [currentUser.interests, []] },
                { $ifNull: ["$interests", []] }
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          profileImage: 1,
          bio: 1,
          interests: 1,
          location: 1,
          distance: { $round: ["$distance", 2] },
          isOnline: 1,
          mutualInterests: 1,
          lastActive: 1,
          createdAt: 1
        }
      },
      {
        $sort: sortBy === 'distance' ? { distance: 1 } : { mutualInterests: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments({
      _id: { $ne: currentUser._id },
      'location.coordinates': { $exists: true }
    });
    
    res.json({
      success: true,
      count: users.length,
      totalUsers,
      currentUserLocation: currentUser.location,
      users: users.map(user => ({
        ...user,
        distance: `${user.distance} km`
      }))
    });
    
  } catch (error) {
    console.error('❌ Nearby users error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to fetch nearby users', 
      error: error.message 
    });
  }
});

// @desc    Get user statistics - SIMPLIFIED VERSION
// @route   GET /api/nearby-users/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser.location || !currentUser.location.coordinates) {
      return res.json({
        success: true,
        stats: {
          totalUsers: 0,
          nearbyUsers: 0,
          onlineUsers: 0,
          usersWithSameInterests: 0,
          message: 'Update location to see statistics'
        }
      });
    }
    
    const [longitude, latitude] = currentUser.location.coordinates;
    const maxDistance = 50; // 50km radius
    
    // Get all users with location
    const allUsers = await User.find({
      _id: { $ne: currentUser._id },
      'location.coordinates': { $exists: true }
    }).select('location interests lastActive');
    
    // Calculate stats manually
    const stats = {
      totalUsers: allUsers.length,
      nearbyUsers: 0,
      onlineUsers: 0,
      usersWithSameInterests: 0
    };
    
    const currentUserInterests = currentUser.interests || [];
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    allUsers.forEach(user => {
      if (user.location && user.location.coordinates) {
        const [userLon, userLat] = user.location.coordinates;
        
        // Calculate distance
        const distance = calculateDistance(
          latitude, 
          longitude, 
          userLat, 
          userLon
        );
        
        // Check if nearby (within 50km)
        if (distance <= maxDistance) {
          stats.nearbyUsers++;
        }
        
        // Check if online
        if (user.lastActive && user.lastActive >= fifteenMinutesAgo) {
          stats.onlineUsers++;
        }
        
        // Check mutual interests
        const userInterests = user.interests || [];
        const mutualInterests = currentUserInterests.filter(interest => 
          userInterests.includes(interest)
        );
        
        if (mutualInterests.length > 0) {
          stats.usersWithSameInterests++;
        }
      }
    });
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
});

// @desc    Get common interests for suggestions
// @route   GET /api/nearby-users/interests
// @access  Private
router.get('/interests', protect, async (req, res) => {
  try {
    const commonInterests = [
      'Hiking', 'Camping', 'Beach', 'Mountains', 'City Tours',
      'Food & Dining', 'Photography', 'Adventure Sports',
      'Cultural Heritage', 'Wildlife', 'Road Trips',
      'Sightseeing', 'Shopping', 'Nightlife', 'Yoga & Wellness',
      'Historical Sites', 'Art & Museums', 'Music Festivals',
      'Local Cuisine', 'Water Sports'
    ];
    
    res.json({
      success: true,
      interests: commonInterests
    });
  } catch (error) {
    console.error('Interests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's current location
// @route   GET /api/nearby-users/my-location
// @access  Private
router.get('/my-location', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('location city country');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      location: user.location,
      city: user.city,
      country: user.country
    });
  } catch (error) {
    console.error('Location fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;