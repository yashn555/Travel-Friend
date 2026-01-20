// backend/models/PaymentRequest.js
const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  expense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  upiId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'expired'],
    default: 'pending'
  },
  upiLink: String,
  paymentReference: String,
  paidAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Indexes
paymentRequestSchema.index({ expense: 1 });
paymentRequestSchema.index({ fromUser: 1 });
paymentRequestSchema.index({ toUser: 1 });
paymentRequestSchema.index({ status: 1 });
paymentRequestSchema.index({ expiresAt: 1 });

// Check if payment request is expired
paymentRequestSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);

module.exports = PaymentRequest;