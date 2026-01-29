// backend/models/Expense.js - ENHANCED VERSION
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  category: {
    type: String,
    enum: ['accommodation', 'food', 'transport', 'activities', 'shopping', 'other', 'settlement'],
    default: 'other'
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitBetween: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Enhanced split management
  splitMethod: {
    type: String,
    enum: ['equal', 'custom', 'percentage', 'shares'],
    default: 'equal'
  },
  // Store detailed split information as JSON string
  splitDetails: {
    type: String,
    default: '[]'
  },
  date: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'partially_settled', 'settled', 'cancelled'],
    default: 'pending'
  },
  settledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  receiptImage: String,
  notes: String,
  // Additional fields for better analytics
  location: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationNotes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for parsed split details
expenseSchema.virtual('parsedSplitDetails').get(function() {
  try {
    return JSON.parse(this.splitDetails || '[]');
  } catch {
    return [];
  }
});

// Virtual field for settled amount
expenseSchema.virtual('settledAmount').get(function() {
  try {
    const splits = JSON.parse(this.splitDetails || '[]');
    const paidById = this.paidBy.toString();
    
    return splits.reduce((total, split) => {
      const isSettled = split.userId === paidById || 
                       (this.settledUsers && this.settledUsers.includes(split.userId));
      return total + (isSettled ? (split.amount || 0) : 0);
    }, 0);
  } catch {
    return 0;
  }
});

// Virtual field for pending amount
expenseSchema.virtual('pendingAmount').get(function() {
  return this.amount - this.settledAmount;
});

// Indexes for better performance
expenseSchema.index({ group: 1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ group: 1, date: -1 });
expenseSchema.index({ group: 1, category: 1 });
expenseSchema.index({ group: 1, status: 1 });

// Pre-save middleware to validate split details
expenseSchema.pre('save', function(next) {
  if (this.splitDetails && this.isModified('splitDetails')) {
    try {
      const splits = JSON.parse(this.splitDetails);
      const total = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
      
      // Allow small rounding differences (0.01)
      if (Math.abs(total - this.amount) > 0.01) {
        return next(new Error(`Split details total (${total}) doesn't match expense amount (${this.amount})`));
      }
    } catch (error) {
      return next(new Error('Invalid split details JSON'));
    }
  }
  next();
});

// Static method to calculate group summary
expenseSchema.statics.getGroupSummary = async function(groupId) {
  return this.aggregate([
    { $match: { group: mongoose.Types.ObjectId(groupId), status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        maxAmount: { $max: '$amount' },
        minAmount: { $min: '$amount' }
      }
    }
  ]);
};

// Static method to get category breakdown
expenseSchema.statics.getCategoryBreakdown = async function(groupId) {
  return this.aggregate([
    { $match: { group: mongoose.Types.ObjectId(groupId), status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

// Instance method to check if user is involved
expenseSchema.methods.isUserInvolved = function(userId) {
  const userIdStr = userId.toString();
  return this.paidBy.toString() === userIdStr || 
         this.splitBetween.some(id => id.toString() === userIdStr);
};

// Instance method to get user's share
expenseSchema.methods.getUserShare = function(userId) {
  try {
    const splits = JSON.parse(this.splitDetails || '[]');
    const userSplit = splits.find(split => split.userId.toString() === userId.toString());
    return userSplit ? userSplit.amount : 0;
  } catch {
    return 0;
  }
};

// Instance method to check if user has settled
expenseSchema.methods.hasUserSettled = function(userId) {
  const userIdStr = userId.toString();
  if (userIdStr === this.paidBy.toString()) return true;
  return this.settledUsers && this.settledUsers.some(id => id.toString() === userIdStr);
};

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;