// backend/models/Expense.js
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
    enum: ['accommodation', 'food', 'transport', 'activities', 'shopping', 'other'],
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
    enum: ['pending', 'settled', 'cancelled'],
    default: 'pending'
  },
  receiptImage: String,
  notes: String
}, {
  timestamps: true
});

// Indexes
expenseSchema.index({ group: 1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ status: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;