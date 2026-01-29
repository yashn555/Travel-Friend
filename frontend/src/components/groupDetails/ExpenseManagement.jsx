import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExpenses, getExpenseSummary } from '../../services/expenseService';

const ExpenseManagement = ({ group, user }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [isGroupMember, setIsGroupMember] = useState(false);

  useEffect(() => {
    fetchExpenseData();
    checkIfGroupMember();
  }, [group._id, user]);

  const checkIfGroupMember = () => {
    if (!group || !user) {
      setIsGroupMember(false);
      return;
    }

    // Check if user is a member of the group
    const isMember = group.currentMembers?.some(member => {
      const memberId = member.user?._id || member.user;
      return memberId === user._id;
    });

    // Check if user is the group creator
    const isCreator = group.createdBy?._id === user._id || group.createdBy === user._id;

    // User can access if they're a member OR the creator
    setIsGroupMember(isMember || isCreator);
  };

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const [expensesData, summaryData] = await Promise.all([
        getExpenses(group._id),
        getExpenseSummary(group._id).catch(() => null)
      ]);
      
      setExpenses(expensesData.data || []);
      setSummary(summaryData?.data || null);
    } catch (error) {
      console.error('Error fetching expense data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchExpenseData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading expenses...</span>
      </div>
    );
  }

  // Calculate user's personal balance
  const getUserBalance = () => {
    if (!summary || !summary.balances || !user?._id) return 0;
    const userBalance = summary.balances[user._id];
    return userBalance?.netBalance || 0;
  };

  const userBalance = getUserBalance();

  return (
    <div className="space-y-6">
      {/* Header with Manage Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Expense Management</h2>
          <p className="text-gray-600 mt-1">
            Track and manage all group expenses in one place
          </p>
          {isGroupMember ? (
            <p className="text-sm text-green-600 mt-1">✓ You can manage expenses</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">View-only mode</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            🔄 Refresh
          </button>
          
          {/* Always show View Expenses button, but different text based on access */}
          <Link
            to={`/groups/${group._id}/expenses`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isGroupMember 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {isGroupMember ? '🧾 Manage Expenses' : '👁️ View Expenses'}
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Total Expenses</h3>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                ₹{summary?.totalExpenses?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="text-blue-600 text-3xl">💰</div>
          </div>
          <p className="text-blue-700 text-sm mt-2">
            {expenses.length} expenses • {summary?.memberCount || group.currentMembers?.length || 0} members
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Average Share</h3>
              <p className="text-3xl font-bold text-green-900 mt-2">
                ₹{summary?.sharePerPerson?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="text-green-600 text-3xl">👥</div>
          </div>
          <p className="text-green-700 text-sm mt-2">
            Per person share
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${
          userBalance >= 0 
            ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200' 
            : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {userBalance >= 0 ? 'You are Owed' : 'You Owe'}
              </h3>
              <p className={`text-3xl font-bold mt-2 ${
                userBalance >= 0 ? 'text-purple-900' : 'text-amber-900'
              }`}>
                ₹{Math.abs(userBalance).toFixed(2)}
              </p>
            </div>
            <div className={`text-3xl ${userBalance >= 0 ? 'text-purple-600' : 'text-amber-600'}`}>
              {userBalance >= 0 ? '💵' : '📝'}
            </div>
          </div>
          <p className={`text-sm mt-2 ${userBalance >= 0 ? 'text-purple-700' : 'text-amber-700'}`}>
            {userBalance >= 0 ? 'People owe you money' : 'You need to pay others'}
          </p>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Recent Expenses</h3>
            {expenses.length > 0 && (
              <button
                onClick={() => setShowAllExpenses(!showAllExpenses)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {showAllExpenses ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {expenses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-5xl mb-4">💸</div>
              <h4 className="text-lg font-medium text-gray-700">No expenses yet</h4>
              <p className="text-gray-500 mt-2">Be the first to add an expense!</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to={`/groups/${group._id}/expenses`}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-center"
                >
                  🧾 Go to Expense Page
                </Link>
                {isGroupMember && (
                  <Link
                    to={`/groups/${group._id}/expenses?view=add`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center"
                  >
                    ＋ Add First Expense
                  </Link>
                )}
              </div>
            </div>
          ) : (
            (showAllExpenses ? expenses : expenses.slice(0, 3)).map((expense) => (
              <div key={expense._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        expense.status === 'settled' ? 'bg-green-500' :
                        expense.status === 'pending' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <h4 className="font-medium text-gray-900">{expense.description}</h4>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                        {expense.category}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="font-medium">₹{expense.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs mr-2">
                          👤
                        </span>
                        <span>Paid by {expense.paidBy?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs mr-2">
                          👥
                        </span>
                        <span>Split between {expense.splitBetween?.length || 1} people</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      expense.status === 'settled' ? 'bg-green-100 text-green-800' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {expense.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    <Link 
                      to={`/groups/${group._id}/expenses?expense=${expense._id}`}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Split Details */}
                {expense.parsedSplitDetails && expense.parsedSplitDetails.length > 0 && (
                  <div className="mt-3 pl-6">
                    <div className="text-xs font-medium text-gray-500 mb-2">Split Details:</div>
                    <div className="flex flex-wrap gap-2">
                      {expense.parsedSplitDetails.slice(0, 3).map((split, index) => (
                        <div key={index} className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                          <span className="text-xs text-gray-700">
                            ₹{split.amount?.toFixed(2)} each
                          </span>
                        </div>
                      ))}
                      {expense.parsedSplitDetails.length > 3 && (
                        <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                          <span className="text-xs text-gray-700">
                            +{expense.parsedSplitDetails.length - 3} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* View All Button */}
        {expenses.length > 3 && !showAllExpenses && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Link
              to={`/groups/${group._id}/expenses`}
              className="block text-center w-full py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              View All {expenses.length} Expenses →
            </Link>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
          <div className="space-y-4">
            {summary.categoryBreakdown.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-blue-600">💰</span>
                    </div>
                    <span className="font-medium text-gray-700 capitalize">{category.category}</span>
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

      {/* Quick Actions - Only for group members */}
      {isGroupMember && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Ready to manage expenses?</h3>
              <p className="text-gray-600 mt-2">
                Go to the full expense management page to add, edit, split, and settle expenses.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/groups/${group._id}/expenses?view=add`}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-center transition-colors"
              >
                ＋ Add New Expense
              </Link>
              <Link
                to={`/groups/${group._id}/expenses?view=settlements`}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-center transition-colors"
              >
                💰 Check Settlements
              </Link>
              <Link
                to={`/groups/${group._id}/expenses?view=analytics`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition-colors"
              >
                📊 View Analytics
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Non-member message */}
      {!isGroupMember && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Want to manage expenses?</h3>
              <p className="text-gray-600 mt-2">
                Join this group to add, edit, and settle expenses with other members.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => alert('Join group functionality to be implemented')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-center transition-colors"
              >
                Join Group
              </button>
              <Link
                to={`/groups/${group._id}/expenses`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition-colors"
              >
                👁️ View Expense Details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;