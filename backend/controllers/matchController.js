const matchService = require('../services/matchService');

/**
 * @desc    Get matching travelers
 * @route   GET /api/match/find
 * @access  Private
 */
exports.findMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    
    const matches = await matchService.findMatches(userId, limit);
    
    res.status(200).json({
      success: true,
      count: matches.length,
      matches: matches.map(match => ({
        user: match.user,
        matchPercentage: match.matchPercentage
      }))
    });
    
  } catch (error) {
    console.error('Error in findMatches:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding matches',
      error: error.message
    });
  }
};

/**
 * @desc    Get detailed match analysis
 * @route   GET /api/match/detailed/:userId
 * @access  Private
 */
exports.getDetailedMatch = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;
    
    // Get both users
    const User = require('../models/User');
    const [currentUser, otherUser] = await Promise.all([
      User.findById(currentUserId)
        .select('travelPreferences travelBudget travelExperience languages preferredTransport city state'),
      User.findById(otherUserId)
        .select('name profileImage bio city state travelPreferences travelBudget travelExperience languages preferredTransport')
    ]);
    
    if (!currentUser || !otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate match details
    const matchPercentage = matchService.calculateMatchPercentage(currentUser, otherUser);
    const matchDetails = {
      travelPreferences: matchService.calculateTravelPreferencesScore(currentUser, otherUser),
      travelBudget: matchService.calculateBudgetScore(currentUser, otherUser),
      travelExperience: matchService.calculateExperienceScore(currentUser, otherUser),
      languages: matchService.calculateLanguageScore(currentUser, otherUser),
      preferredTransport: matchService.calculateTransportScore(currentUser, otherUser),
      location: matchService.calculateLocationScore(currentUser, otherUser)
    };
    
    res.status(200).json({
      success: true,
      match: {
        user: {
          _id: otherUser._id,
          name: otherUser.name,
          profileImage: otherUser.profileImage,
          bio: otherUser.bio,
          city: otherUser.city,
          state: otherUser.state
        },
        matchPercentage,
        matchDetails
      }
    });
    
  } catch (error) {
    console.error('Error in getDetailedMatch:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting match details',
      error: error.message
    });
  }
};