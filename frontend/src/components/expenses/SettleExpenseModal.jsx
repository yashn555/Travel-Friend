import React, { useState, useEffect } from 'react';
import { getExpense, markAsSettled, updateExpenseStatus } from '../../services/expenseService';

const SettleExpenseModal = ({ expenseId, onClose, onSuccess }) => {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchExpense();
  }, [expenseId]);

  const fetchExpense = async () => {
    try {
      const response = await getExpense(expenseId);
      const expenseData = response.data;
      setExpense(expenseData);
      
      // Initialize selected users with already settled users
      const settled = expenseData.settledUsers || [];
      setSelectedUsers(settled);
    } catch (error) {
      console.error('Error fetching expense:', error);
      alert('Failed to load expense details');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleUserToggle = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const handleMarkAsSettled = async (userId) => {
    try {
      setLoading(true);
      await markAsSettled(expenseId, userId);
      
      // Update local state
      setSelectedUsers(prev => [...prev, userId]);
      alert('Payment marked as settled!');
    } catch (error) {
      console.error('Error marking as settled:', error);
      alert('Failed to mark as settled: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsSettled = async () => {
    if (!window.confirm('Mark all payments as settled?')) return;
    
    try {
      setLoading(true);
      await updateExpenseStatus(expenseId, 'settled');
      onSuccess();
      alert('All payments marked as settled!');
    } catch (error) {
      console.error('Error marking all as settled:', error);
      alert('Failed to mark all as settled');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settlement details...</p>
        </div>
      </div>
    );
  }

  if (!expense) return null;

  const parsedSplitDetails = expense.parsedSplitDetails || [];
  const paidById = expense.paidBy?._id || expense.paidBy;

  // Filter out the person who paid
  const usersToSettle = parsedSplitDetails.filter(
    split => split.userId !== paidById
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Settle Expense</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Expense Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{expense.description}</span>
              <span className="font-bold text-lg">₹{expense.amount.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600">
              Paid by: <span className="font-medium">{expense.paidBy?.name}</span> • 
              Status: <span className={`font-medium ${
                expense.status === 'settled' ? 'text-green-600' :
                expense.status === 'pending' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {expense.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Users to Settle */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Mark Payments as Settled
            </h3>
            
            {usersToSettle.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No users to settle (expense might already be fully settled)
              </p>
            ) : (
              usersToSettle.map((split, index) => {
                const isSettled = selectedUsers.includes(split.userId);
                const user = expense.splitBetween?.find(u => u._id === split.userId);
                
                return (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg flex items-center justify-between ${
                      isSettled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        isSettled ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <span className={`font-medium ${
                          isSettled ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user?.name || 'Unknown User'}</p>
                        {user?.upiId && (
                          <p className="text-sm text-gray-500">UPI: {user.upiId}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{split.amount?.toFixed(2)}</p>
                      <button
                        onClick={() => handleMarkAsSettled(split.userId)}
                        disabled={isSettled || loading}
                        className={`mt-2 px-4 py-2 rounded-lg font-medium ${
                          isSettled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isSettled ? '✓ Settled' : 'Mark Settled'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          {usersToSettle.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Quick Actions</h4>
              <button
                onClick={handleMarkAllAsSettled}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Mark All as Settled
              </button>
            </div>
          )}

          {/* Status Overview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {selectedUsers.length}
                </p>
                <p className="text-sm text-gray-600">Settled</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {usersToSettle.length - selectedUsers.length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              disabled={loading}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettleExpenseModal;