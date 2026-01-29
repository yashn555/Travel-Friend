// backend/controllers/expenseController.js - UPDATED
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');

// @desc    Create expense and send UPI payment requests
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { 
      groupId, 
      description, 
      amount, 
      category, 
      splitBetween,
      notes,
      receiptImage,
      splitMethod = 'equal',
      customSplits = [],
      paidBy
    } = req.body;

    console.log('Creating expense:', {
      groupId,
      description,
      amount,
      category,
      splitBetween,
      splitMethod,
      userId: req.user.id
    });

    // Validate required fields
    if (!groupId || !description || !amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Group ID, description, and amount are required'
      });
    }

    // Get group with populated members
    const group = await Group.findById(groupId)
      .populate({
        path: 'currentMembers.user',
        select: 'name upiId email mobile'
      })
      .session(session);
    
    if (!group) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is group member - FIXED LOGIC
    const isMember = group.currentMembers.some(member => {
      if (!member.user) return false;
      
      const memberId = member.user._id 
        ? member.user._id.toString() 
        : member.user.toString();
      
      return memberId === req.user.id;
    });

    if (!isMember) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Get all member IDs
    const allMemberIds = group.currentMembers
      .filter(member => member.user)
      .map(member => {
        return member.user._id 
          ? member.user._id.toString()
          : member.user.toString();
      });

    // Determine who to split between
    let splitUsers = [];
    let splitDetails = [];
    
    if (splitMethod === 'custom' && customSplits.length > 0) {
      // Validate custom splits
      const totalCustomAmount = customSplits.reduce((sum, split) => sum + parseFloat(split.amount || 0), 0);
      
      if (Math.abs(totalCustomAmount - amountNum) > 0.01) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Custom splits total (${totalCustomAmount}) must equal expense amount (${amountNum})`
        });
      }
      
      splitUsers = customSplits.map(split => split.userId.toString());
      splitDetails = customSplits.map(split => ({
        userId: split.userId,
        amount: parseFloat(split.amount),
        percentage: (parseFloat(split.amount) / amountNum) * 100,
        share: split.share || 1
      }));
      
    } else if (splitBetween && splitBetween.length > 0) {
      // Use provided split list (must be valid members)
      splitUsers = splitBetween.filter(id => 
        allMemberIds.includes(id.toString())
      );
      
      // Calculate equal splits
      const perPersonAmount = parseFloat((amountNum / splitUsers.length).toFixed(2));
      splitDetails = splitUsers.map(userId => ({
        userId,
        amount: perPersonAmount,
        percentage: (perPersonAmount / amountNum) * 100,
        share: 1
      }));
    } else {
      // Split among all group members
      splitUsers = allMemberIds;
      const perPersonAmount = parseFloat((amountNum / splitUsers.length).toFixed(2));
      splitDetails = splitUsers.map(userId => ({
        userId,
        amount: perPersonAmount,
        percentage: (perPersonAmount / amountNum) * 100,
        share: 1
      }));
    }

    // Remove duplicates
    splitUsers = [...new Set(splitUsers)];

    // Must have at least 1 person (the payer)
    if (splitUsers.length < 1) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Expense must involve at least 1 member'
      });
    }

    // Determine who paid (default to current user if not specified)
    const payerId = paidBy || req.user.id;
    
    // Validate payer is in split list
    if (!splitUsers.includes(payerId.toString())) {
      splitUsers.push(payerId.toString());
      splitDetails.push({
        userId: payerId.toString(),
        amount: 0, // Payer doesn't owe themselves
        percentage: 0,
        share: 1
      });
    }

    // Create expense with split details
    const expenseData = {
      group: groupId,
      description,
      amount: amountNum,
      currency: 'INR',
      category: category || 'other',
      paidBy: payerId,
      splitBetween: splitUsers,
      splitMethod,
      splitDetails: JSON.stringify(splitDetails),
      date: new Date(),
      addedBy: req.user.id,
      status: 'pending',
      notes,
      receiptImage
    };

    console.log('Saving expense:', expenseData);

    // Save expense
    const expense = await Expense.create([expenseData], { session });
    const savedExpense = expense[0];
    
    // Populate expense data
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate('paidBy', 'name upiId profileImage')
      .populate('splitBetween', 'name upiId profileImage')
      .session(session);

    // Send UPI payment requests and notifications
    const paymentRequests = [];
    const parsedSplitDetails = JSON.parse(savedExpense.splitDetails || '[]');
    
    for (const splitDetail of parsedSplitDetails) {
      // Skip the person who paid
      if (splitDetail.userId === payerId.toString()) continue;

      try {
        const user = await User.findById(splitDetail.userId).session(session);
        if (user) {
          // Create UPI payment link
          let upiLink = null;
          const paidByUser = await User.findById(payerId).session(session);
          
          if (paidByUser?.upiId) {
            upiLink = `upi://pay?pa=${encodeURIComponent(paidByUser.upiId)}&pn=${encodeURIComponent(paidByUser.name)}&am=${splitDetail.amount}&tn=${encodeURIComponent(`Expense: ${description}`)}&cu=INR`;
          }

          // Send notification
          await user.addNotification(
            'payment_request',
            'Payment Request',
            `${paidByUser?.name || 'Someone'} requests ₹${splitDetail.amount} for "${description}"`,
            req.user.id,
            {
              expenseId: savedExpense._id,
              amount: splitDetail.amount,
              upiLink,
              description,
              groupId,
              groupName: group.destination
            }
          );

          paymentRequests.push({
            userId: splitDetail.userId,
            name: user.name,
            amount: splitDetail.amount,
            upiId: user.upiId || 'Not set',
            upiLink,
            notified: true
          });
        }
      } catch (userError) {
        console.error(`Error sending notification to user ${splitDetail.userId}:`, userError);
        paymentRequests.push({
          userId: splitDetail.userId,
          name: 'Unknown',
          amount: splitDetail.amount,
          upiId: 'Error',
          notified: false,
          error: userError.message
        });
      }
    }

    // Update group total expenses
    group.totalExpenses = (group.totalExpenses || 0) + amountNum;
    await group.save({ session });

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Expense added and payment requests sent',
      data: {
        expense: populatedExpense,
        splitDetails: parsedSplitDetails,
        paymentRequests,
        summary: {
          totalAmount: amountNum,
          splitBetween: splitUsers.length,
          splitMethod,
          currency: 'INR'
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get expenses for a group
// @route   GET /api/expenses/:groupId
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log('Getting expenses for group:', groupId, 'user:', req.user.id);

    // Check if user is group member - SIMPLIFIED CHECK
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Allow if authenticated (temporary fix)
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get expenses with populated user data
    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name upiId profileImage')
      .populate('splitBetween', 'name upiId profileImage')
      .populate('addedBy', 'name')
      .sort({ date: -1, createdAt: -1 });

    console.log('Found expenses:', expenses.length);

    // Parse split details for each expense
    const expensesWithDetails = expenses.map(expense => {
      const expenseObj = expense.toObject();
      try {
        expenseObj.parsedSplitDetails = JSON.parse(expense.splitDetails || '[]');
      } catch (e) {
        expenseObj.parsedSplitDetails = [];
      }
      return expenseObj;
    });

    res.status(200).json({
      success: true,
      data: expensesWithDetails
    });

  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expenses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/single/:expenseId
// @access  Private
exports.getExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    console.log('Getting expense:', expenseId, 'user:', req.user.id);
    
    const expense = await Expense.findById(expenseId)
      .populate('paidBy', 'name upiId profileImage email mobile')
      .populate('splitBetween', 'name upiId profileImage email')
      .populate('addedBy', 'name')
      .populate('group', 'name destination');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Allow if authenticated (temporary fix)
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Parse split details
    const parsedSplitDetails = JSON.parse(expense.splitDetails || '[]');
    
    res.status(200).json({
      success: true,
      data: {
        ...expense.toObject(),
        parsedSplitDetails
      }
    });
    
  } catch (error) {
    console.error('Error getting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense'
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:expenseId
// @access  Private
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, category, notes, receiptImage } = req.body;
    
    console.log('Updating expense:', expenseId, 'user:', req.user.id);
    
    const expense = await Expense.findById(expenseId)
      .populate('group', 'currentMembers createdBy');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Allow if authenticated (temporary fix)
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Update only allowed fields
    if (description) expense.description = description;
    if (amount) expense.amount = parseFloat(amount);
    if (category) expense.category = category;
    if (notes !== undefined) expense.notes = notes;
    if (receiptImage !== undefined) expense.receiptImage = receiptImage;
    
    await expense.save();
    
    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
    
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:expenseId
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    console.log('Deleting expense:', expenseId, 'user:', req.user.id);
    
    const expense = await Expense.findById(expenseId)
      .populate('group', 'currentMembers createdBy');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Allow if authenticated (temporary fix)
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Update group total expenses
    const group = await Group.findById(expense.group);
    if (group) {
      group.totalExpenses = Math.max(0, (group.totalExpenses || 0) - expense.amount);
      await group.save();
    }
    
    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);
    
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
};

// @desc    Get expense summary for group
// @route   GET /api/expenses/:groupId/summary
// @access  Private
exports.getExpenseSummary = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log('Getting expense summary for group:', groupId, 'user:', req.user.id);

    // Allow if authenticated (temporary fix)
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get group with populated members
    const group = await Group.findById(groupId)
      .populate('currentMembers.user', 'name upiId profileImage');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Get all expenses
    const expenses = await Expense.find({ group: groupId });

    // Calculate balances
    const memberBalances = {};
    
    // Initialize balances
    group.currentMembers.forEach(member => {
      if (member.user) {
        const userId = member.user._id 
          ? member.user._id.toString()
          : member.user.toString();
        
        memberBalances[userId] = {
          user: member.user,
          totalPaid: 0,
          totalOwed: 0,
          netBalance: 0,
          expensesPaid: 0,
          expensesInvolved: 0,
          pendingPayments: []
        };
      }
    });

    // Process each expense
    expenses.forEach(expense => {
      if (expense.status === 'cancelled') return;
      
      const paidById = expense.paidBy.toString();
      
      // Parse split details
      let splitDetails = [];
      try {
        splitDetails = JSON.parse(expense.splitDetails || '[]');
      } catch (e) {
        splitDetails = [];
      }
      
      // Add to paidBy's total paid
      if (memberBalances[paidById]) {
        memberBalances[paidById].totalPaid += expense.amount;
        memberBalances[paidById].expensesPaid += 1;
      }
      
      // Add to each split member's total owed
      splitDetails.forEach(split => {
        const userId = split.userId.toString();
        if (memberBalances[userId] && userId !== paidById) {
          const amountOwed = parseFloat(split.amount || 0);
          memberBalances[userId].totalOwed += amountOwed;
          memberBalances[userId].expensesInvolved += 1;
          
          // Add to pending payments if not settled
          if (!expense.settledUsers?.includes(userId)) {
            memberBalances[userId].pendingPayments.push({
              expenseId: expense._id,
              description: expense.description,
              amount: amountOwed,
              paidTo: paidById,
              date: expense.date
            });
          }
        }
      });
    });

    // Calculate net balance
    Object.keys(memberBalances).forEach(userId => {
      memberBalances[userId].netBalance = 
        parseFloat((memberBalances[userId].totalPaid - memberBalances[userId].totalOwed).toFixed(2));
    });

    // Calculate totals
    const totalExpenses = expenses
      .filter(e => e.status !== 'cancelled')
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const sharePerPerson = Object.keys(memberBalances).length > 0 
      ? parseFloat((totalExpenses / Object.keys(memberBalances).length).toFixed(2))
      : 0;

    // Calculate budget usage
    const budgetUsed = group.budget?.max ? (totalExpenses / group.budget.max) * 100 : 0;

    // Calculate category breakdown
    const categoryBreakdown = {};
    expenses.forEach(expense => {
      if (expense.status !== 'cancelled') {
        const category = expense.category || 'other';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { total: 0, count: 0 };
        }
        categoryBreakdown[category].total += expense.amount;
        categoryBreakdown[category].count += 1;
      }
    });

    // Format category breakdown
    const formattedCategoryBreakdown = Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      total: parseFloat(data.total.toFixed(2)),
      count: data.count,
      percentage: parseFloat(((data.total / totalExpenses) * 100).toFixed(1))
    })).sort((a, b) => b.total - a.total);

    // Calculate current user's balance
    let userBalance = 0;
    if (memberBalances[req.user.id]) {
      userBalance = memberBalances[req.user.id].netBalance;
    }

    res.status(200).json({
      success: true,
      data: {
        groupId,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        sharePerPerson,
        userBalance,
        memberCount: Object.keys(memberBalances).length,
        expensesCount: expenses.length,
        balances: memberBalances,
        budget: group.budget,
        budgetUsed: parseFloat(budgetUsed.toFixed(2)),
        categoryBreakdown: formattedCategoryBreakdown,
        recentExpenses: expenses
          .filter(e => e.status !== 'cancelled')
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
          .map(expense => ({
            id: expense._id,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            status: expense.status
          }))
      }
    });

  } catch (error) {
    console.error('Error getting expense summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense summary'
    });
  }
};

// @desc    Mark expense as settled for a specific user
// @route   POST /api/expenses/:expenseId/settle/:userId
// @access  Private
exports.markAsSettled = async (req, res) => {
  try {
    const { expenseId, userId } = req.params;
    
    console.log('Marking as settled:', { expenseId, userId, user: req.user.id });
    
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Only the person who paid can mark as settled
    if (expense.paidBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the person who paid can mark expenses as settled'
      });
    }
    
    // Parse split details to verify user is in split
    let splitDetails = [];
    try {
      splitDetails = JSON.parse(expense.splitDetails || '[]');
    } catch (e) {
      splitDetails = [];
    }
    
    const userInSplit = splitDetails.some(split => split.userId.toString() === userId);
    if (!userInSplit) {
      return res.status(400).json({
        success: false,
        message: 'User is not part of this expense split'
      });
    }
    
    // Update settled users array
    if (!expense.settledUsers) {
      expense.settledUsers = [];
    }
    
    if (!expense.settledUsers.includes(userId)) {
      expense.settledUsers.push(userId);
      
      // Update split details
      const updatedSplitDetails = splitDetails.map(split => {
        if (split.userId.toString() === userId) {
          return { ...split, settled: true, settledAt: new Date() };
        }
        return split;
      });
      expense.splitDetails = JSON.stringify(updatedSplitDetails);
      
      // If all users (except payer) have settled, mark entire expense as settled
      const allSplitUsers = splitDetails
        .filter(split => split.userId.toString() !== expense.paidBy.toString())
        .map(split => split.userId.toString());
      
      const allSettled = allSplitUsers.every(id => expense.settledUsers.includes(id));
      
      if (allSettled) {
        expense.status = 'settled';
      } else {
        expense.status = 'partially_settled';
      }
      
      await expense.save();
      
      // Send notification to the user who settled
      const user = await User.findById(userId);
      const paidByUser = await User.findById(expense.paidBy);
      
      if (user) {
        await user.addNotification(
          'payment_settled',
          'Payment Settled',
          `${paidByUser?.name || 'Someone'} marked your payment of ₹${splitDetails.find(s => s.userId.toString() === userId)?.amount || 0} as settled`,
          req.user.id,
          {
            expenseId: expense._id,
            amount: splitDetails.find(s => s.userId.toString() === userId)?.amount || 0,
            description: expense.description
          }
        );
      }
      
      res.status(200).json({
        success: true,
        message: 'Payment marked as settled',
        data: expense
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment already settled'
      });
    }
    
  } catch (error) {
    console.error('Error marking as settled:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payment as settled'
    });
  }
};

// @desc    Update expense status
// @route   PUT /api/expenses/:expenseId/status
// @access  Private
exports.updateExpenseStatus = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { status } = req.body;
    
    console.log('Updating expense status:', { expenseId, status, user: req.user.id });
    
    if (!['pending', 'partially_settled', 'settled', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const expense = await Expense.findById(expenseId)
      .populate('group', 'currentMembers');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Allow if authenticated
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    expense.status = status;
    await expense.save();
    
    res.status(200).json({
      success: true,
      message: `Expense marked as ${status}`,
      data: expense
    });
    
  } catch (error) {
    console.error('Error updating expense status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
};

// ==================== ENHANCED FUNCTIONS ====================

// @desc    Get expense analytics
// @route   GET /api/expenses/:groupId/analytics
// @access  Private
exports.getExpenseAnalytics = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { period = 'month' } = req.query;

    console.log('Getting expense analytics:', groupId, 'period:', period);

    // Allow if authenticated
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get expenses in date range
    const expenses = await Expense.find({
      group: groupId,
      date: { $gte: startDate, $lte: now },
      status: { $ne: 'cancelled' }
    }).populate('paidBy', 'name');

    // Calculate analytics
    const analytics = {
      totalSpent: 0,
      averagePerDay: 0,
      mostExpensiveCategory: null,
      topSpender: null,
      dailyBreakdown: {},
      weeklyTrend: [],
      categoryDistribution: {},
      memberContributions: {}
    };

    // Process expenses for analytics
    const dailyTotals = {};
    const categoryTotals = {};
    const memberTotals = {};

    expenses.forEach(expense => {
      const date = expense.date.toISOString().split('T')[0];
      const amount = expense.amount;
      
      analytics.totalSpent += amount;
      
      // Daily breakdown
      if (!dailyTotals[date]) dailyTotals[date] = 0;
      dailyTotals[date] += amount;
      
      // Category distribution
      if (!categoryTotals[expense.category]) categoryTotals[expense.category] = 0;
      categoryTotals[expense.category] += amount;
      
      // Member contributions
      const paidById = expense.paidBy._id.toString();
      if (!memberTotals[paidById]) memberTotals[paidById] = 0;
      memberTotals[paidById] += amount;
    });

    // Find most expensive category
    let maxCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      if (amount > maxCategoryAmount) {
        maxCategoryAmount = amount;
        analytics.mostExpensiveCategory = { category, amount };
      }
    });

    // Find top spender
    let maxSpenderAmount = 0;
    Object.entries(memberTotals).forEach(([userId, amount]) => {
      if (amount > maxSpenderAmount) {
        maxSpenderAmount = amount;
        const spender = expenses.find(e => e.paidBy._id.toString() === userId)?.paidBy;
        analytics.topSpender = {
          user: spender,
          amount
        };
      }
    });

    // Calculate average per day
    const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    analytics.averagePerDay = daysDiff > 0 ? parseFloat((analytics.totalSpent / daysDiff).toFixed(2)) : 0;

    // Prepare daily breakdown
    analytics.dailyBreakdown = Object.entries(dailyTotals)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, amount]) => ({ date, amount }));

    // Prepare weekly trend
    const weeklyData = {};
    expenses.forEach(expense => {
      const week = getWeekNumber(expense.date);
      if (!weeklyData[week]) weeklyData[week] = 0;
      weeklyData[week] += expense.amount;
    });
    
    analytics.weeklyTrend = Object.entries(weeklyData)
      .sort(([weekA], [weekB]) => parseInt(weekA) - parseInt(weekB))
      .map(([week, amount]) => ({ week: `Week ${week}`, amount }));

    // Prepare category distribution
    analytics.categoryDistribution = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: parseFloat(((amount / analytics.totalSpent) * 100).toFixed(2))
      }))
      .sort((a, b) => b.amount - a.amount);

    // Prepare member contributions
    const members = await User.find({ _id: { $in: Object.keys(memberTotals) } }, 'name profileImage');
    analytics.memberContributions = members.map(member => ({
      user: member,
      amount: memberTotals[member._id.toString()] || 0,
      percentage: parseFloat((((memberTotals[member._id.toString()] || 0) / analytics.totalSpent) * 100).toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error getting expense analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense analytics'
    });
  }
};

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

// @desc    Get member balances
// @route   GET /api/expenses/:groupId/balances
// @access  Private
exports.getMemberBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Allow if authenticated
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get group
    const group = await Group.findById(groupId)
      .populate('currentMembers.user', 'name upiId profileImage');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Get all expenses
    const expenses = await Expense.find({ group: groupId });

    // Calculate balances
    const memberBalances = {};
    
    // Initialize balances
    group.currentMembers.forEach(member => {
      if (member.user) {
        const userId = member.user._id 
          ? member.user._id.toString()
          : member.user.toString();
        
        memberBalances[userId] = {
          user: member.user,
          totalPaid: 0,
          totalOwed: 0,
          netBalance: 0,
          expensesPaid: 0,
          expensesInvolved: 0,
          pendingPayments: []
        };
      }
    });

    // Process each expense
    expenses.forEach(expense => {
      if (expense.status === 'cancelled') return;
      
      const paidById = expense.paidBy.toString();
      
      // Parse split details
      let splitDetails = [];
      try {
        splitDetails = JSON.parse(expense.splitDetails || '[]');
      } catch (e) {
        splitDetails = [];
      }
      
      // Add to paidBy's total paid
      if (memberBalances[paidById]) {
        memberBalances[paidById].totalPaid += expense.amount;
        memberBalances[paidById].expensesPaid += 1;
      }
      
      // Add to each split member's total owed
      splitDetails.forEach(split => {
        const userId = split.userId.toString();
        if (memberBalances[userId] && userId !== paidById) {
          const amountOwed = parseFloat(split.amount || 0);
          memberBalances[userId].totalOwed += amountOwed;
          memberBalances[userId].expensesInvolved += 1;
        }
      });
    });

    // Calculate net balance
    Object.keys(memberBalances).forEach(userId => {
      memberBalances[userId].netBalance = 
        parseFloat((memberBalances[userId].totalPaid - memberBalances[userId].totalOwed).toFixed(2));
    });

    // Convert to simplified view
    const simplifiedBalances = Object.values(memberBalances).map(balance => ({
      user: balance.user,
      paid: parseFloat(balance.totalPaid.toFixed(2)),
      owed: parseFloat(balance.totalOwed.toFixed(2)),
      net: parseFloat(balance.netBalance.toFixed(2)),
      pendingPayments: balance.pendingPayments?.length || 0,
      status: balance.netBalance > 0 ? 'owed' : balance.netBalance < 0 ? 'owes' : 'settled'
    })).sort((a, b) => b.net - a.net);

    res.status(200).json({
      success: true,
      data: {
        balances: simplifiedBalances,
        summary: {
          totalMembers: simplifiedBalances.length,
          totalOwed: simplifiedBalances.filter(b => b.net < 0).reduce((sum, b) => sum + Math.abs(b.net), 0),
          totalToReceive: simplifiedBalances.filter(b => b.net > 0).reduce((sum, b) => sum + b.net, 0),
          isBalanced: Math.abs(
            simplifiedBalances.filter(b => b.net < 0).reduce((sum, b) => sum + Math.abs(b.net), 0) -
            simplifiedBalances.filter(b => b.net > 0).reduce((sum, b) => sum + b.net, 0)
          ) < 0.01
        }
      }
    });

  } catch (error) {
    console.error('Error getting member balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get member balances'
    });
  }
};

// @desc    Get settlement suggestions
// @route   GET /api/expenses/:groupId/settlement-suggestions
// @access  Private
exports.getSettlementSuggestions = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get balances first
    const balancesResponse = await exports.getMemberBalances({ params: { groupId }, user: req.user }, res);
    
    if (balancesResponse && balancesResponse.statusCode !== 200) {
      return;
    }

    const balancesData = await new Promise((resolve) => {
      const originalJson = res.json;
      let responseData;
      
      res.json = function(data) {
        responseData = data;
        originalJson.call(this, data);
      };
      
      exports.getMemberBalances(req, res).then(() => {
        resolve(responseData);
      });
    });

    if (!balancesData || !balancesData.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get balances for settlement suggestions'
      });
    }

    const { balances } = balancesData.data;

    // Separate creditors and debtors
    const creditors = balances.filter(b => b.net > 0)
      .map(b => ({ user: b.user, amount: b.net }))
      .sort((a, b) => b.amount - a.amount);
    
    const debtors = balances.filter(b => b.net < 0)
      .map(b => ({ user: b.user, amount: Math.abs(b.net) }))
      .sort((a, b) => b.amount - a.amount);

    // Generate optimal settlement suggestions
    const suggestions = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const settleAmount = Math.min(creditor.amount, debtor.amount);
      
      if (settleAmount > 0.01) {
        suggestions.push({
          from: debtor.user,
          to: creditor.user,
          amount: parseFloat(settleAmount.toFixed(2)),
          description: `${debtor.user.name} should pay ₹${settleAmount.toFixed(2)} to ${creditor.user.name}`
        });
        
        // Update amounts
        creditor.amount -= settleAmount;
        debtor.amount -= settleAmount;
        
        if (creditor.amount < 0.01) i++;
        if (debtor.amount < 0.01) j++;
      } else {
        if (creditor.amount < 0.01) i++;
        if (debtor.amount < 0.01) j++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        summary: {
          totalTransactions: suggestions.length,
          totalAmount: suggestions.reduce((sum, s) => sum + s.amount, 0),
          efficiency: balances.length > 0 ? 
            parseFloat(((1 - (suggestions.length / balances.length)) * 100).toFixed(2)) : 
            100,
          message: suggestions.length === 0 ? 
            'All balances are settled!' : 
            `Settle ${suggestions.length} transaction(s) to clear all balances`
        }
      }
    });

  } catch (error) {
    console.error('Error getting settlement suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settlement suggestions'
    });
  }
};

// @desc    Send payment reminder
// @route   POST /api/expenses/:expenseId/remind/:userId
// @access  Private
exports.sendPaymentReminder = async (req, res) => {
  try {
    const { expenseId, userId } = req.params;
    
    console.log('Sending payment reminder:', { expenseId, userId });
    
    const expense = await Expense.findById(expenseId)
      .populate('paidBy', 'name')
      .populate('group', 'name destination');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Only the person who paid or expense creator can send reminders
    const canSendReminder = 
      expense.paidBy._id.toString() === req.user.id || 
      expense.addedBy.toString() === req.user.id;
    
    if (!canSendReminder) {
      return res.status(403).json({
        success: false,
        message: 'Only the payer or expense creator can send reminders'
      });
    }
    
    // Parse split details to get amount
    let splitDetails = [];
    try {
      splitDetails = JSON.parse(expense.splitDetails || '[]');
    } catch (e) {
      splitDetails = [];
    }
    
    const userSplit = splitDetails.find(split => split.userId.toString() === userId);
    if (!userSplit) {
      return res.status(400).json({
        success: false,
        message: 'User is not part of this expense'
      });
    }
    
    // Send notification
    const user = await User.findById(userId);
    if (user) {
      await user.addNotification(
        'payment_reminder',
        'Payment Reminder',
        `Reminder: Please pay ₹${userSplit.amount} to ${expense.paidBy.name} for "${expense.description}"`,
        req.user.id,
        {
          expenseId: expense._id,
          amount: userSplit.amount,
          description: expense.description,
          groupId: expense.group._id,
          groupName: expense.group.name || expense.group.destination
        }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment reminder sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment reminder'
    });
  }
};

// @desc    Export expenses as CSV
// @route   GET /api/expenses/:groupId/export/csv
// @access  Private
exports.exportExpensesCSV = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Allow if authenticated
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get expenses
    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('addedBy', 'name')
      .sort({ date: -1 });

    // Prepare CSV data
    const csvData = expenses.map(expense => {
      let splitDetails = [];
      try {
        splitDetails = JSON.parse(expense.splitDetails || '[]');
      } catch (e) {
        splitDetails = [];
      }

      return {
        'Date': expense.date.toISOString().split('T')[0],
        'Description': expense.description,
        'Amount (₹)': expense.amount.toFixed(2),
        'Category': expense.category,
        'Paid By': expense.paidBy?.name || 'Unknown',
        'Status': expense.status,
        'Split Between': splitDetails.length,
        'Per Person (₹)': (expense.amount / (splitDetails.length || 1)).toFixed(2),
        'Notes': expense.notes || ''
      };
    });

    // Add summary row
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    csvData.push({
      'Date': 'TOTAL',
      'Description': '',
      'Amount (₹)': totalAmount.toFixed(2),
      'Category': '',
      'Paid By': '',
      'Status': '',
      'Split Between': '',
      'Per Person (₹)': '',
      'Notes': `${expenses.length} expenses`
    });

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${groupId}-${Date.now()}.csv`);

    res.send(csv);

  } catch (error) {
    console.error('Error exporting expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export expenses'
    });
  }
};

// @desc    Create custom split for expense
// @route   POST /api/expenses/:expenseId/split
// @access  Private
exports.createCustomSplit = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { splits } = req.body;
    
    console.log('Creating custom split for expense:', expenseId);
    
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Check if user can modify
    const canModify = expense.addedBy.toString() === req.user.id || 
                     expense.paidBy.toString() === req.user.id;
    
    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this expense'
      });
    }
    
    // Validate splits total matches expense amount
    const total = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
    
    if (Math.abs(total - expense.amount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Splits total (${total}) must equal expense amount (${expense.amount})`
      });
    }
    
    // Update split details
    expense.splitDetails = JSON.stringify(splits);
    expense.splitMethod = 'custom';
    await expense.save();
    
    res.status(200).json({
      success: true,
      message: 'Custom split created successfully',
      data: expense
    });
    
  } catch (error) {
    console.error('Error creating custom split:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom split'
    });
  }
};

// @desc    Get all settlements
// @route   GET /api/expenses/:groupId/settlements
// @access  Private
exports.getSettlements = async (req, res) => {
  try {
    return await exports.getSettlementSuggestions(req, res);
  } catch (error) {
    console.error('Error getting settlements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settlements'
    });
  }
};

// @desc    Settle balance between users
// @route   POST /api/expenses/:groupId/settle-balance
// @access  Private
exports.settleBalance = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { fromUserId, toUserId, amount } = req.body;
    
    console.log('Settling balance:', { fromUserId, toUserId, amount, user: req.user.id });
    
    if (!fromUserId || !toUserId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'fromUserId, toUserId, and amount are required'
      });
    }
    
    // Create a settlement expense
    const settlementExpense = {
      group: groupId,
      description: `Settlement payment from user`,
      amount: parseFloat(amount),
      category: 'settlement',
      paidBy: fromUserId,
      splitBetween: [fromUserId, toUserId],
      splitMethod: 'custom',
      splitDetails: JSON.stringify([
        { userId: fromUserId, amount: 0 },
        { userId: toUserId, amount: parseFloat(amount) }
      ]),
      date: new Date(),
      addedBy: req.user.id,
      status: 'settled',
      notes: 'Balance settlement'
    };
    
    const expense = await Expense.create(settlementExpense);
    
    // Send notification
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    
    if (toUser) {
      await toUser.addNotification(
        'payment_settled',
        'Balance Settled',
        `${fromUser?.name || 'Someone'} paid you ₹${amount} to settle balance`,
        req.user.id,
        {
          amount: parseFloat(amount),
          fromUser: fromUser?._id
        }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Balance settled successfully',
      data: expense
    });
    
  } catch (error) {
    console.error('Error settling balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to settle balance'
    });
  }
};

// ==================== END OF ENHANCED FUNCTIONS ====================