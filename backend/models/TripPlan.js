// backend/models/TripPlan.js
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: String,
  activity: String,
  duration: String
}, { _id: false });

const dayPlanSchema = new mongoose.Schema({
  day: Number,
  date: Date,
  activities: [activitySchema],
  accommodation: String,
  meals: String,
  estimatedCost: Number
}, { _id: false });

const recommendationsSchema = new mongoose.Schema({
  hotels: [String],
  transport: String,
  bestSeason: String,
  weather: String,
  mustVisit: [String],
  tips: [String]
}, { _id: false });

const tripPlanSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    unique: true
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
    max: Number,
    currency: String
  },
  preferences: mongoose.Schema.Types.Mixed,
  plan: {
    itinerary: [dayPlanSchema],
    totalEstimatedCost: Number,
    costPerPerson: Number,
    recommendations: recommendationsSchema,
    durationDays: Number,
    season: String
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  promptUsed: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
tripPlanSchema.index({ group: 1 });
tripPlanSchema.index({ generatedBy: 1 });
tripPlanSchema.index({ destination: 1 });
tripPlanSchema.index({ isActive: 1 });

// Add a method to get formatted data
tripPlanSchema.methods.getFormattedPlan = function() {
  return {
    ...this.plan,
    generatedAt: this.createdAt,
    lastUpdated: this.updatedAt,
    generatedBy: this.generatedBy
  };
};

const TripPlan = mongoose.model('TripPlan', tripPlanSchema);

module.exports = TripPlan;