import api from './api';

// ==================== EXPENSE CRUD OPERATIONS ====================

export const getExpenses = async (groupId) => {
  try {
    console.log('Fetching expenses for group:', groupId);
    const response = await api.get(`/expenses/${groupId}`);
    console.log('✅ Get expenses API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get expenses API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get expenses');
  }
};

export const getExpense = async (expenseId) => {
  try {
    console.log('Fetching expense:', expenseId);
    const response = await api.get(`/expenses/single/${expenseId}`);
    console.log('✅ Get expense API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get expense API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get expense');
  }
};

export const createExpense = async (expenseData) => {
  try {
    console.log('Creating expense:', expenseData);
    const response = await api.post('/expenses', expenseData);
    console.log('✅ Create expense API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Create expense API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to create expense');
  }
};

// Alias for addExpense (for compatibility)
export const addExpense = createExpense;

export const updateExpense = async (expenseId, expenseData) => {
  try {
    console.log('Updating expense:', expenseId, expenseData);
    const response = await api.put(`/expenses/${expenseId}`, expenseData);
    console.log('✅ Update expense API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Update expense API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to update expense');
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    console.log('Deleting expense:', expenseId);
    const response = await api.delete(`/expenses/${expenseId}`);
    console.log('✅ Delete expense API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Delete expense API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete expense');
  }
};

// ==================== EXPENSE STATUS & SETTLEMENT ====================

export const markAsSettled = async (expenseId, userId) => {
  try {
    console.log('Marking expense as settled:', { expenseId, userId });
    const response = await api.post(`/expenses/${expenseId}/settle/${userId}`);
    console.log('✅ Mark as settled API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Mark as settled API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to mark as settled');
  }
};

export const markExpenseAsSettled = async (expenseId) => {
  try {
    console.log('Marking expense as fully settled:', expenseId);
    const response = await api.put(`/expenses/${expenseId}/status`, { status: 'settled' });
    console.log('✅ Mark expense as settled API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Mark expense as settled API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to mark expense as settled');
  }
};

export const updateExpenseStatus = async (expenseId, status) => {
  try {
    console.log('Updating expense status:', { expenseId, status });
    const response = await api.put(`/expenses/${expenseId}/status`, { status });
    console.log('✅ Update expense status API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Update expense status API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to update expense status');
  }
};

export const sendPaymentReminder = async (expenseId, userId) => {
  try {
    console.log('Sending payment reminder:', { expenseId, userId });
    const response = await api.post(`/expenses/${expenseId}/remind/${userId}`);
    console.log('✅ Send payment reminder API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Send payment reminder API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to send payment reminder');
  }
};

// ==================== EXPENSE ANALYTICS & SUMMARY ====================

export const getExpenseSummary = async (groupId) => {
  try {
    console.log('Fetching expense summary for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/summary`);
    console.log('✅ Get expense summary API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get expense summary API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get expense summary');
  }
};

export const getExpenseAnalytics = async (groupId, period = 'month') => {
  try {
    console.log('Fetching expense analytics for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/analytics`, {
      params: { period }
    });
    console.log('✅ Get expense analytics API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get expense analytics API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get expense analytics');
  }
};

export const getCategoryBreakdown = async (groupId) => {
  try {
    console.log('Fetching category breakdown for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/category-breakdown`);
    return response.data;
  } catch (error) {
    console.error('❌ Get category breakdown API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get category breakdown');
  }
};

export const getExpenseTrends = async (groupId, timeframe = 'weekly') => {
  try {
    console.log('Fetching expense trends for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/trends`, {
      params: { timeframe }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Get expense trends API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get expense trends');
  }
};

// ==================== MEMBER BALANCES & SETTLEMENTS ====================

export const getMemberBalances = async (groupId) => {
  try {
    console.log('Fetching member balances for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/balances`);
    console.log('✅ Get member balances API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get member balances API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch member balances');
  }
};

export const getSettlementSuggestions = async (groupId) => {
  try {
    console.log('Fetching settlement suggestions for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/settlement-suggestions`);
    console.log('✅ Get settlement suggestions API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Get settlement suggestions API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch settlement suggestions');
  }
};

export const settleBalance = async (groupId, settlementData) => {
  try {
    console.log('Settling balance:', { groupId, settlementData });
    const response = await api.post(`/expenses/${groupId}/settle-balance`, settlementData);
    console.log('✅ Settle balance API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Settle balance API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to settle balance');
  }
};

export const getSettlements = async (groupId) => {
  try {
    console.log('Fetching settlements for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/settlements`);
    return response.data;
  } catch (error) {
    console.error('❌ Get settlements API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get settlements');
  }
};

// ==================== EXPENSE SPLITTING ====================

export const createCustomSplit = async (expenseId, splitData) => {
  try {
    console.log('Creating custom split:', { expenseId, splitData });
    const response = await api.post(`/expenses/${expenseId}/split`, splitData);
    console.log('✅ Create custom split API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Create custom split API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to create custom split');
  }
};

// ==================== EXPORT & UTILITIES ====================

export const exportExpensesCSV = async (groupId) => {
  try {
    console.log('Exporting expenses as CSV for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/export/csv`, {
      responseType: 'blob'
    });
    console.log('✅ Export expenses CSV API response:', response);
    return response;
  } catch (error) {
    console.error('❌ Export expenses CSV API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export expenses');
  }
};

export const uploadReceipt = async (formData) => {
  try {
    console.log('Uploading receipt');
    const response = await api.post('/expenses/upload-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('✅ Upload receipt API response:', response);
    return response.data;
  } catch (error) {
    console.error('❌ Upload receipt API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload receipt');
  }
};

export const getExpensesByDateRange = async (groupId, startDate, endDate) => {
  try {
    console.log('Fetching expenses by date range:', { groupId, startDate, endDate });
    const response = await api.get(`/expenses/${groupId}/by-date`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Get expenses by date range API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get expenses by date range');
  }
};

export const getTopSpenders = async (groupId) => {
  try {
    console.log('Fetching top spenders for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/top-spenders`);
    return response.data;
  } catch (error) {
    console.error('❌ Get top spenders API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get top spenders');
  }
};

export const getRecentActivity = async (groupId, limit = 10) => {
  try {
    console.log('Fetching recent activity for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/recent-activity`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Get recent activity API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get recent activity');
  }
};

export const duplicateExpense = async (expenseId) => {
  try {
    console.log('Duplicating expense:', expenseId);
    const response = await api.post(`/expenses/${expenseId}/duplicate`);
    return response.data;
  } catch (error) {
    console.error('❌ Duplicate expense API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to duplicate expense');
  }
};

export const mergeExpenses = async (groupId, expenseIds) => {
  try {
    console.log('Merging expenses:', { groupId, expenseIds });
    const response = await api.post(`/expenses/${groupId}/merge`, { expenseIds });
    return response.data;
  } catch (error) {
    console.error('❌ Merge expenses API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to merge expenses');
  }
};

export const getExpenseDashboardStats = async (groupId) => {
  try {
    console.log('Fetching dashboard stats for group:', groupId);
    const response = await api.get(`/expenses/${groupId}/dashboard-stats`);
    return response.data;
  } catch (error) {
    console.error('❌ Get expense dashboard stats API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get dashboard stats');
  }
};

export const getPaymentRequests = async () => {
  try {
    console.log('Fetching payment requests');
    const response = await api.get('/expenses/payment-requests');
    return response.data;
  } catch (error) {
    console.error('❌ Get payment requests API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get payment requests');
  }
};

export const getUserExpenseStats = async () => {
  try {
    console.log('Fetching user expense stats');
    const response = await api.get('/expenses/user/stats');
    return response.data;
  } catch (error) {
    console.error('❌ Get user expense stats API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get user expense stats');
  }
};

// Default export for convenience
const expenseService = {
  // CRUD Operations
  createExpense,
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  
  // Status & Settlement
  markAsSettled,
  markExpenseAsSettled,
  updateExpenseStatus,
  sendPaymentReminder,
  
  // Analytics & Summary
  getExpenseSummary,
  getExpenseAnalytics,
  getCategoryBreakdown,
  getExpenseTrends,
  
  // Balances & Settlements
  getMemberBalances,
  getSettlementSuggestions,
  settleBalance,
  getSettlements,
  
  // Splitting
  createCustomSplit,
  
  // Export & Utilities
  exportExpensesCSV,
  uploadReceipt,
  getExpensesByDateRange,
  getTopSpenders,
  getRecentActivity,
  duplicateExpense,
  mergeExpenses,
  getExpenseDashboardStats,
  getPaymentRequests,
  getUserExpenseStats
};

export default expenseService;