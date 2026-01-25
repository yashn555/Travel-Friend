const User = require('../models/User');

class MatchService {
  /**
   * Calculate match percentage between two users
   */
  calculateMatchPercentage(currentUser, otherUser) {
    let totalScore = 0;
    
    // 1. Travel Preferences (50%)
    const travelPrefScore = this.calculateTravelPreferencesScore(currentUser, otherUser);
    totalScore += travelPrefScore * 0.5;
    
    // 2. Travel Budget (15%)
    const budgetScore = this.calculateBudgetScore(currentUser, otherUser);
    totalScore += budgetScore * 0.15;
    
    // 3. Travel Experience (10%)
    const experienceScore = this.calculateExperienceScore(currentUser, otherUser);
    totalScore += experienceScore * 0.1;
    
    // 4. Languages (15%)
    const languageScore = this.calculateLanguageScore(currentUser, otherUser);
    totalScore += languageScore * 0.15;
    
    // 5. Preferred Transport (5%)
    const transportScore = this.calculateTransportScore(currentUser, otherUser);
    totalScore += transportScore * 0.05;
    
    // 6. Location (5%)
    const locationScore = this.calculateLocationScore(currentUser, otherUser);
    totalScore += locationScore * 0.05;
    
    return Math.round(totalScore * 100);
  }

  /**
   * Calculate travel preferences score
   * Score = (commonTrue / userTrueCount) * 100
   */
  calculateTravelPreferencesScore(user1, user2) {
    const prefs1 = user1.travelPreferences || {};
    const prefs2 = user2.travelPreferences || {};
    
    const keys = Object.keys(prefs1);
    if (keys.length === 0) return 50; // Default if no preferences set
    
    let commonTrue = 0;
    let user1TrueCount = 0;
    
    for (const key of keys) {
      if (prefs1[key] === true) {
        user1TrueCount++;
        if (prefs2[key] === true) {
          commonTrue++;
        }
      }
    }
    
    if (user1TrueCount === 0) return 50; // No preferences set by user1
    
    return (commonTrue / user1TrueCount) * 100;
  }

  /**
   * Calculate budget score
   */
  calculateBudgetScore(user1, user2) {
    const budgetOrder = ['budget', 'medium', 'high', 'luxury'];
    const budget1 = user1.travelBudget || 'medium';
    const budget2 = user2.travelBudget || 'medium';
    
    if (budget1 === budget2) return 100;
    
    const index1 = budgetOrder.indexOf(budget1);
    const index2 = budgetOrder.indexOf(budget2);
    
    if (index1 === -1 || index2 === -1) return 50;
    
    const diff = Math.abs(index1 - index2);
    
    if (diff === 1) return 70; // Adjacent
    if (diff === 2) return 30; // Two levels apart
    return 0; // Far mismatch
  }

  /**
   * Calculate experience score
   */
  calculateExperienceScore(user1, user2) {
    const experienceOrder = ['beginner', 'intermediate', 'expert'];
    const exp1 = user1.travelExperience || 'beginner';
    const exp2 = user2.travelExperience || 'beginner';
    
    if (exp1 === exp2) return 100;
    
    const index1 = experienceOrder.indexOf(exp1);
    const index2 = experienceOrder.indexOf(exp2);
    
    if (index1 === -1 || index2 === -1) return 50;
    
    const diff = Math.abs(index1 - index2);
    
    if (diff === 1) return 60; // Adjacent
    return 20; // Far mismatch
  }

  /**
   * Calculate language score
   */
  calculateLanguageScore(user1, user2) {
    const langs1 = Array.isArray(user1.languages) ? user1.languages : [];
    const langs2 = Array.isArray(user2.languages) ? user2.languages : [];
    
    if (langs1.length === 0 && langs2.length === 0) return 50;
    if (langs1.length === 0 || langs2.length === 0) return 20;
    
    const commonLangs = langs1.filter(lang => langs2.includes(lang));
    const totalUniqueLangs = new Set([...langs1, ...langs2]).size;
    
    return (commonLangs.length / totalUniqueLangs) * 100;
  }

  /**
   * Calculate transport score
   */
  calculateTransportScore(user1, user2) {
    const transport1 = Array.isArray(user1.preferredTransport) ? user1.preferredTransport : [];
    const transport2 = Array.isArray(user2.preferredTransport) ? user2.preferredTransport : [];
    
    if (transport1.length === 0 && transport2.length === 0) return 50;
    if (transport1.length === 0 || transport2.length === 0) return 20;
    
    const commonTransport = transport1.filter(t => transport2.includes(t));
    const totalUniqueTransport = new Set([...transport1, ...transport2]).size;
    
    return (commonTransport.length / totalUniqueTransport) * 100;
  }

  /**
   * Calculate location score
   */
  calculateLocationScore(user1, user2) {
    // Check city and state match
    let score = 0;
    
    if (user1.city && user2.city && user1.city.toLowerCase() === user2.city.toLowerCase()) {
      score += 70;
    }
    
    if (user1.state && user2.state && user1.state.toLowerCase() === user2.state.toLowerCase()) {
      score += 30;
    }
    
    // If no location data, return 50%
    if (!user1.city && !user1.state && !user2.city && !user2.state) {
      return 50;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Find matches for a user
   */
  async findMatches(currentUserId, limit = 20) {
    try {
      // Get current user with all preferences
      const currentUser = await User.findById(currentUserId)
        .select('travelPreferences travelBudget travelExperience languages preferredTransport city state country isActive');
      
      if (!currentUser) {
        throw new Error('Current user not found');
      }
      
      // Find all active users excluding current user
      const allUsers = await User.find({
        _id: { $ne: currentUserId },
        isActive: true
      })
      .select('name profileImage bio city state country travelPreferences travelBudget travelExperience languages preferredTransport')
      .limit(limit + 10); // Get extra for filtering
      
      // Calculate match scores for each user
      const matches = allUsers.map(otherUser => {
        const matchPercentage = this.calculateMatchPercentage(currentUser, otherUser);
        
        return {
          user: {
            _id: otherUser._id,
            name: otherUser.name,
            profileImage: otherUser.profileImage,
            bio: otherUser.bio,
            city: otherUser.city,
            state: otherUser.state,
            travelPreferences: otherUser.travelPreferences,
            travelBudget: otherUser.travelBudget,
            travelExperience: otherUser.travelExperience,
            languages: otherUser.languages,
            preferredTransport: otherUser.preferredTransport
          },
          matchPercentage,
          matchDetails: {
            travelPreferences: this.calculateTravelPreferencesScore(currentUser, otherUser),
            travelBudget: this.calculateBudgetScore(currentUser, otherUser),
            travelExperience: this.calculateExperienceScore(currentUser, otherUser),
            languages: this.calculateLanguageScore(currentUser, otherUser),
            preferredTransport: this.calculateTransportScore(currentUser, otherUser),
            location: this.calculateLocationScore(currentUser, otherUser)
          }
        };
      });
      
      // Sort by match percentage (highest first)
      matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
      
      // Return top N matches
      return matches.slice(0, limit);
      
    } catch (error) {
      console.error('Error finding matches:', error);
      throw error;
    }
  }
}

module.exports = new MatchService();