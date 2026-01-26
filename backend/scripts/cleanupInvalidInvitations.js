const mongoose = require('mongoose');
const Group = require('../models/Group');
require('dotenv').config();

const cleanupInvalidInvitations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all groups with invitations
    const groups = await Group.find({ invitations: { $exists: true, $ne: [] } });
    
    console.log(`🔍 Found ${groups.length} groups with invitations`);
    
    let totalCleaned = 0;
    let groupsUpdated = 0;
    
    for (const group of groups) {
      if (!group.invitations || !Array.isArray(group.invitations)) continue;
      
      const originalCount = group.invitations.length;
      
      // Filter out invalid invitations (without user or invitedBy)
      const validInvitations = group.invitations.filter(inv => 
        inv && 
        (inv.user && mongoose.Types.ObjectId.isValid(inv.user)) &&
        (inv.invitedBy && mongoose.Types.ObjectId.isValid(inv.invitedBy))
      );
      
      const removedCount = originalCount - validInvitations.length;
      
      if (removedCount > 0) {
        group.invitations = validInvitations;
        await group.save();
        
        console.log(`🧹 Group ${group._id}: Removed ${removedCount} invalid invitations`);
        totalCleaned += removedCount;
        groupsUpdated++;
      }
    }
    
    console.log(`\n✅ Cleanup complete:`);
    console.log(`   Groups updated: ${groupsUpdated}`);
    console.log(`   Invalid invitations removed: ${totalCleaned}`);
    
  } catch (error) {
    console.error('❌ Error cleaning up invitations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

cleanupInvalidInvitations();