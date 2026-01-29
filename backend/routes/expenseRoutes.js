// backend/routes/expenseRoutes.js - MINIMAL WORKING VERSION
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(protect);

// Only use routes that definitely exist in your controller
router.post('/', expenseController.createExpense);
router.get('/:groupId', expenseController.getExpenses);
router.delete('/:expenseId', expenseController.deleteExpense);
router.get('/:groupId/summary', expenseController.getExpenseSummary);
router.post('/:expenseId/settle/:userId', expenseController.markAsSettled);
router.put('/:expenseId/status', expenseController.updateExpenseStatus);

// Optional: Add routes that might exist
if (expenseController.getExpense) {
  router.get('/single/:expenseId', expenseController.getExpense);
}

if (expenseController.updateExpense) {
  router.put('/:expenseId', expenseController.updateExpense);
}

if (expenseController.getExpenseAnalytics) {
  router.get('/:groupId/analytics', expenseController.getExpenseAnalytics);
}

if (expenseController.getMemberBalances) {
  router.get('/:groupId/balances', expenseController.getMemberBalances);
}

if (expenseController.getSettlementSuggestions) {
  router.get('/:groupId/settlement-suggestions', expenseController.getSettlementSuggestions);
}

if (expenseController.sendPaymentReminder) {
  router.post('/:expenseId/remind/:userId', expenseController.sendPaymentReminder);
}

if (expenseController.exportExpensesCSV) {
  router.get('/:groupId/export/csv', expenseController.exportExpensesCSV);
}

// Comment out problematic routes temporarily
// router.post('/:expenseId/split', expenseController.createCustomSplit);
// router.post('/settle-balance', expenseController.settleBalance);

module.exports = router;