const mongoose = require('mongoose');
const Group = require('../models/Group');
require('dotenv').config();

const testGroupStructure = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const groupId = '69749c598a9ed3298ad078fd';
    const group = await Group.findById(groupId);
    
    if (!group) {
      console.log('❌ Group not found');
      return;
    }
    
    console.log('\n🔍 Checking group structure:');
    console.log('Group ID:', group._id);
    console.log('Destination:', group.destination);
    
    console.log('\n📊 Current Members:');
    console.log('Type:', typeof group.currentMembers);
    console.log('Is Array:', Array.isArray(group.currentMembers));
    if (group.currentMembers && Array.isArray(group.currentMembers)) {
      console.log('Length:', group.currentMembers.length);
      group.currentMembers.forEach((member, index) => {
        console.log(`  Member ${index + 1}:`, {
          user: member.user,
          status: member.status,
          joinedAt: member.joinedAt
        });
      });
    } else {
      console.log('❌ currentMembers is not an array or is undefined');
    }
    
    console.log('\n📨 Invitations:');
    console.log('Type:', typeof group.invitations);
    console.log('Is Array:', Array.isArray(group.invitations));
    if (group.invitations && Array.isArray(group.invitations)) {
      console.log('Length:', group.invitations.length);
    } else {
      console.log('❌ invitations is not an array or is undefined');
    }
    
    console.log('\n🎯 Max Members:', group.maxMembers);
    
    // Check schema
    console.log('\n📝 Schema paths:');
    const paths = Object.keys(group.schema.paths);
    console.log('Total paths:', paths.length);
    console.log('Relevant paths:');
    paths.filter(p => p.includes('currentMembers') || p.includes('invitations') || p.includes('maxMembers')).forEach(p => {
      console.log(`  ${p}:`, group.schema.paths[p].options);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

testGroupStructure();