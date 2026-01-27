// backend/utils/autoCompleteTrips.js
const Group = require('../models/Group');

// Simple function to auto-complete past trips
const autoCompletePastTrips = async () => {
  try {
    console.log('🕐 Running auto-complete for past trips...');
    const updatedCount = await Group.autoUpdateAllPastTrips();
    console.log(`✅ Auto-completed ${updatedCount} past trips`);
    return updatedCount;
  } catch (error) {
    console.error('❌ Error in auto-complete:', error);
    return 0;
  }
};

// Run immediately and then set interval
const initAutoComplete = () => {
  console.log('🚀 Initializing auto-complete system...');
  
  // Run immediately on server start
  setTimeout(() => {
    autoCompletePastTrips();
  }, 5000); // Wait 5 seconds after server starts
  
  // Run every 1 hour
  setInterval(autoCompletePastTrips, 60 * 60 * 1000);
  
  console.log('✅ Auto-complete system initialized (runs every hour)');
};

module.exports = { initAutoComplete, autoCompletePastTrips };