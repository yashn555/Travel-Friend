const mongoose = require('mongoose');
const Group = require('../models/Group');

// Test valid tags
const testTags = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/traveler_friend', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check the schema
    const groupSchema = Group.schema;
    const tagsPath = groupSchema.path('tags');
    
    console.log('\n🔍 Valid tags in Group schema:');
    console.log(tagsPath.enumValues);
    
    // Test with valid tags
    const validGroup = new Group({
      destination: 'Test Destination',
      description: 'Test description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      budget: { min: 10000, max: 20000, currency: 'INR' },
      maxMembers: 4,
      currentMembers: [],
      groupType: 'anonymous',
      createdBy: new mongoose.Types.ObjectId(),
      tags: ['beach', 'budget', 'adventure'] // Valid tags
    });
    
    await validGroup.save();
    console.log('\n✅ Test group with valid tags created successfully');
    
    // Test with invalid tag (should fail)
    const invalidGroup = new Group({
      destination: 'Test Destination 2',
      description: 'Test description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      budget: { min: 10000, max: 20000, currency: 'INR' },
      maxMembers: 4,
      currentMembers: [],
      groupType: 'anonymous',
      createdBy: new mongoose.Types.ObjectId(),
      tags: ['beach', 'budget', 'party'] // 'party' is invalid
    });
    
    try {
      await invalidGroup.save();
    } catch (error) {
      console.log('\n❌ Invalid group correctly rejected');
      console.log('Error:', error.message);
    }
    
    await mongoose.disconnect();
    console.log('\n✨ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testTags();