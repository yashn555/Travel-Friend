import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import expenseService from '../services/expenseService'; // Import expenseService
import { getGroup, updateGroup } from '../services/tripService'; // Import from tripService
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import EditExpenseModal from '../components/expenses/EditExpenseModal';
import SettleExpenseModal from '../components/expenses/SettleExpenseModal';
import SplitExpenseModal from '../components/expenses/SplitExpenseModal';
import BudgetManagementModal from '../components/expenses/BudgetManagementModal';

const ExpenseManagementPage = () => {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(null);
  const [showSplitModal, setShowSplitModal] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
    
    // Check if there's an expense ID in URL
    const expenseId = searchParams.get('expense');
    if (expenseId) {
      setShowEditModal(expenseId);
    }
    
    const view = searchParams.get('view');
    if (view === 'add') {
      setShowAddModal(true);
    } else if (view === 'settlements') {
      setActiveTab('settlements');
    } else if (view === 'budget') {
      setShowBudgetModal(true);
    }
  }, [groupId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupData, expensesData] = await Promise.all([
        getGroup(groupId), // From tripService
        expenseService.getExpenses(groupId) // From expenseService
      ]);
      
      setGroup(groupData.data);
      setExpenses(expensesData.data || []);
      
      // Load additional data based on active tab
      if (activeTab === 'summary') {
        const summaryData = await expenseService.getExpenseSummary(groupId);
        setSummary(summaryData.data);
      } else if (activeTab === 'analytics') {
        const analyticsData = await expenseService.getExpenseAnalytics(groupId);
        setAnalytics(analyticsData.data);
      } else if (activeTab === 'balances') {
        const balancesData = await expenseService.getMemberBalances(groupId);
        setBalances(balancesData?.data?.balances || []);
      } else if (activeTab === 'settlements') {
        const settlementsData = await expenseService.getSettlementSuggestions(groupId);
        setSettlements(settlementsData?.data?.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    setShowAddModal(true);
  };

  const handleEditExpense = (expenseId) => {
    setShowEditModal(expenseId);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      fetchData();
      alert('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const handleSettleExpense = (expenseId) => {
    setShowSettleModal(expenseId);
  };

  const handleSplitExpense = (expenseId) => {
    setShowSplitModal(expenseId);
  };

  const handleMarkAsSettled = async (expenseId, userId) => {
    try {
      await expenseService.markAsSettled(expenseId, userId);
      fetchData();
      alert('Marked as settled successfully');
    } catch (error) {
      console.error('Error marking as settled:', error);
      alert('Failed to mark as settled');
    }
  };

  const handleSendReminder = async (expenseId, userId) => {
    try {
      await expenseService.sendPaymentReminder(expenseId, userId);
      alert('Payment reminder sent successfully');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await expenseService.exportExpensesCSV(groupId);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses-${groupId}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export expenses');
    }
  };

  const handleUpdateStatus = async (expenseId, status) => {
    try {
      await expenseService.updateExpenseStatus(expenseId, status);
      fetchData();
      alert(`Expense marked as ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update expense status');
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    // Category filter
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && expense.status !== statusFilter) {
      return false;
    }
    
    // Search query
    if (searchQuery && !expense.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Date range filter
    if (dateRange.start && dateRange.end) {
      const expenseDate = new Date(expense.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      if (expenseDate < startDate || expenseDate > endDate) {
        return false;
      }
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense management...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Group not found</h2>
          <p className="text-gray-600 mt-2">The group you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
              <p className="text-gray-600 mt-1">
                {group.destination} • {group.currentMembers?.length || 0} members
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                📊 Export CSV
              </button>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium"
              >
                💰 Manage Budget
              </button>
              <button
                onClick={handleAddExpense}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                + Add Expense
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {['all', 'summary', 'analytics', 'balances', 'settlements'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab === 'all' && 'All Expenses'}
                    {tab === 'summary' && 'Summary'}
                    {tab === 'analytics' && 'Analytics'}
                    {tab === 'balances' && 'Balances'}
                    {tab === 'settlements' && 'Settlements'}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {['food', 'transport', 'accommodation', 'shopping', 'entertainment', 'other'].map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="partially_settled">Partially Settled</option>
                <option value="settled">Settled</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                  setDateRange({ start: null, end: null });
                }}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                All Expenses ({filteredExpenses.length})
              </h2>
            </div>
            
            {filteredExpenses.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-5xl mb-4">💸</div>
                <h3 className="text-lg font-medium text-gray-700">No expenses found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your filters or add a new expense</p>
                <button
                  onClick={handleAddExpense}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  + Add Your First Expense
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600">💰</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {expense.description}
                              </div>
                              <div className="text-sm text-gray-500">
                                Split: {expense.splitBetween?.length || 1} people
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            ₹{expense.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {expense.paidBy?.name || 'Unknown'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            expense.status === 'settled' ? 'bg-green-100 text-green-800' :
                            expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {expense.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditExpense(expense._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleSettleExpense(expense._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Settle
                            </button>
                            <button
                              onClick={() => handleSplitExpense(expense._id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Split
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && summary && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Expenses</h3>
                <p className="text-3xl font-bold text-gray-900">₹{summary.totalExpenses?.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {summary.expensesCount} expenses across {summary.memberCount} members
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Average Share</h3>
                <p className="text-3xl font-bold text-gray-900">₹{summary.sharePerPerson?.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-2">Per person average</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Budget Used</h3>
                <p className="text-3xl font-bold text-gray-900">{summary.budgetUsed?.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(summary.budgetUsed, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {summary.categoryBreakdown && summary.categoryBreakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Breakdown</h3>
                <div className="space-y-4">
                  {summary.categoryBreakdown.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 capitalize">{category.category}</span>
                          <span className="ml-2 text-sm text-gray-500">({category.count})</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">₹{category.total.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">{category.percentage}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Expenses */}
            {summary.recentExpenses && summary.recentExpenses.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Expenses</h3>
                <div className="space-y-4">
                  {summary.recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <p className="text-sm text-gray-500">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{expense.amount.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          expense.status === 'settled' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'balances' && balances.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Member Balances</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {balances.map((balance) => (
                    <tr key={balance.user._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 text-lg">
                                {balance.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {balance.user.name}
                            </div>
                            {balance.user.upiId && (
                              <div className="text-sm text-gray-500">
                                UPI: {balance.user.upiId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{balance.paid.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{balance.owed.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${
                          balance.net > 0 ? 'text-green-600' :
                          balance.net < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {balance.net > 0 ? '+' : ''}₹{Math.abs(balance.net).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          balance.net > 0 ? 'bg-green-100 text-green-800' :
                          balance.net < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {balance.net > 0 ? 'Owed' : balance.net < 0 ? 'Owes' : 'Settled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {balance.net < 0 && (
                          <button
                            onClick={() => {
                              // Handle pay action
                              alert(`Initiate payment to ${balance.user.name}`);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settlements' && settlements.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Settlement Suggestions</h2>
            <p className="text-gray-600 mb-6">
              Optimized payments to settle all balances with minimum transactions
            </p>
            
            <div className="space-y-4">
              {settlements.map((settlement, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600">
                            {settlement.from.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="ml-2 font-medium">{settlement.from.name}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="mx-2 font-bold text-gray-700">₹{settlement.amount.toFixed(2)}</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600">
                            {settlement.to.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="ml-2 font-medium">{settlement.to.name}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Handle settlement payment
                        alert(`Process payment of ₹${settlement.amount.toFixed(2)} from ${settlement.from.name} to ${settlement.to.name}`);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      Settle
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">{settlement.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}

      {showEditModal && (
        <EditExpenseModal
          expenseId={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSuccess={() => {
            setShowEditModal(null);
            fetchData();
          }}
        />
      )}

      {showSettleModal && (
        <SettleExpenseModal
          expenseId={showSettleModal}
          onClose={() => setShowSettleModal(null)}
          onSuccess={() => {
            setShowSettleModal(null);
            fetchData();
          }}
        />
      )}

      {showSplitModal && (
        <SplitExpenseModal
          expenseId={showSplitModal}
          group={group}
          onClose={() => setShowSplitModal(null)}
          onSuccess={() => {
            setShowSplitModal(null);
            fetchData();
          }}
        />
      )}

      {showBudgetModal && (
        <BudgetManagementModal
          group={group}
          onClose={() => setShowBudgetModal(false)}
          onSuccess={() => {
            setShowBudgetModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default ExpenseManagementPage;