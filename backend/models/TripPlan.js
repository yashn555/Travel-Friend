// backend/models/TripPlan.js
const mongoose = require('mongoose');

const tripPlanSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    unique: true // Only one trip plan per group
  },
  destination: {
    type: String,
    required: true
  },
  startDate: Date,
  endDate: Date,
  groupSize: Number,
  budget: {
    min: Number,
    max: Number
  },
  preferences: {
    type: Object,
    default: {}
  },
  plan: {
    type: Object,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promptUsed: String,
  aiGenerated: {
    type: Boolean,
    default: true
  },
  aiProvider: {
    type: String,
    default: 'Google Gemini'
  },
  status: {
    type: String,
    enum: ['generated', 'modified', 'confirmed'],
    default: 'generated'
  }
}, {
  timestamps: true
});

tripPlanSchema.index({ group: 1 });
tripPlanSchema.index({ generatedBy: 1 });
tripPlanSchema.index({ createdAt: -1 });

const TripPlan = mongoose.model('TripPlan', tripPlanSchema);

module.exports = TripPlan;