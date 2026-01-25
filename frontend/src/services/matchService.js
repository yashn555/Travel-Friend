import api from './api';

const matchService = {
  /**
   * Get matching travelers
   * @param {number} limit - Number of matches to return
   */
  getMatches: async (limit = 20) => {
    try {
      const response = await api.get(`/match/find?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting matches:', error);
      throw error;
    }
  },

  /**
   * Get detailed match analysis for a specific user
   * @param {string} userId - ID of the user to analyze
   */
  getDetailedMatch: async (userId) => {
    try {
      const response = await api.get(`/match/detailed/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting detailed match:', error);
      throw error;
    }
  }
};

export default matchService;