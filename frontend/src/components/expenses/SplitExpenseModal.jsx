import React, { useState, useEffect } from 'react';
import { getExpense, createCustomSplit } from '../../services/expenseService';

const SplitExpenseModal = ({ expenseId, group, onClose, onSuccess }) => {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [splitMethod, setSplitMethod] = useState('equal');
  const [customSplits, setCustomSplits] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchExpense();
  }, [expenseId]);

  const fetchExpense = async () => {
    try {
      const response = await getExpense(expenseId);
      const expenseData = response.data;
      setExpense(expenseData);
      
      // Initialize with current split
      const parsedSplits = expenseData.parsedSplitDetails || [];
      setCustomSplits(parsedSplits);
      setSelectedUsers(parsedSplits.map(split => split.userId));
      
      // Determine current split method
      setSplitMethod(expenseData.splitMethod || 'equal');
    } catch (error) {
      console.error('Error fetching expense:', error);
      alert('Failed to load expense details');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSplitMethodChange = (method) => {
    setSplitMethod(method);
    
    if (method === 'equal') {
      // Reset to equal split among selected users
      const perPerson = expense.amount / selectedUsers.length;
      const newSplits = selectedUsers.map(userId => ({
        userId,
        amount: parseFloat(perPerson.toFixed(2)),
        percentage: parseFloat(((perPerson / expense.amount) * 100).toFixed(2))
      }));
      setCustomSplits(newSplits);
    } else if (method === 'percentage') {
      // Initialize with equal percentages
      const percentage = parseFloat((100 / selectedUsers.length).toFixed(2));
      const newSplits = selectedUsers.map(userId => ({
        userId,
        amount: parseFloat(((percentage / 100) * expense.amount).toFixed(2)),
        percentage
      }));
      setCustomSplits(newSplits);
    }
  };

  const handleUserToggle = (userId) => {
    if (selectedUsers.includes(userId)) {
      // Remove user from split
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      setCustomSplits(prev => prev.filter(split => split.userId !== userId));
    } else {
      // Add user to split
      setSelectedUsers(prev => [...prev, userId]);
      
      if (splitMethod === 'equal') {
        const perPerson = expense.amount / (selectedUsers.length + 1);
        setCustomSplits(prev => [
          ...prev.map(split => ({
            ...split,
            amount: parseFloat(perPerson.toFixed(2)),
            percentage: parseFloat(((perPerson / expense.amount) * 100).toFixed(2))
          })),
          {
            userId,
            amount: parseFloat(perPerson.toFixed(2)),
            percentage: parseFloat(((perPerson / expense.amount) * 100).toFixed(2))
          }
        ]);
      } else if (splitMethod === 'percentage') {
        const percentage = parseFloat((100 / (selectedUsers.length + 1)).toFixed(2));
        setCustomSplits(prev => [
          ...prev.map(split => ({
            ...split,
            amount: parseFloat(((percentage / 100) * expense.amount).toFixed(2)),
            percentage
          })),
          {
            userId,
            amount: parseFloat(((percentage / 100) * expense.amount).toFixed(2)),
            percentage
          }
        ]);
      }
    }
  };

  const handleCustomSplitChange = (userId, value, type) => {
    setCustomSplits(prev => prev.map(split => {
      if (split.userId === userId) {
        if (type === 'amount') {
          const amount = parseFloat(value) || 0;
          const percentage = parseFloat(((amount / expense.amount) * 100).toFixed(2));
          return { ...split, amount, percentage };
        } else if (type === 'percentage') {
          const percentage = parseFloat(value) || 0;
          const amount = parseFloat(((percentage / 100) * expense.amount).toFixed(2));
          return { ...split, percentage, amount };
        }
      }
      return split;
    }));
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to split with');
      return;
    }

    // Validate totals
    const totalAmount = customSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
    const totalPercentage = customSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
    
    const amountDiff = Math.abs(totalAmount - expense.amount);
    const percentageDiff = Math.abs(totalPercentage - 100);
    
    if (amountDiff > 0.01) {
      alert(`Total amount (₹${totalAmount.toFixed(2)}) must equal expense amount (₹${expense.amount.toFixed(2)})`);
      return;
    }
    
    if (splitMethod === 'percentage' && percentageDiff > 0.01) {
      alert(`Total percentage (${totalPercentage.toFixed(2)}%) must equal 100%`);
      return;
    }

    try {
      setLoading(true);
      
      await createCustomSplit(expenseId, {
        splits: customSplits.map(split => ({
          userId: split.userId,
          amount: split.amount,
          share: 1,
          percentage: split.percentage
        }))
      });
      
      onSuccess();
      alert('Expense split updated successfully!');
    } catch (error) {
      console.error('Error updating split:', error);
      alert('Failed to update split: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalAmount = customSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
    const totalPercentage = customSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
    return { totalAmount, totalPercentage };
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading split details...</p>
        </div>
      </div>
    );
  }

  if (!expense) return null;

  const { totalAmount, totalPercentage } = calculateTotals();
  const amountDiff = Math.abs(totalAmount - expense.amount);
  const percentageDiff = Math.abs(totalPercentage - 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Split Expense</h2>
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
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{expense.description}</p>
                <p className="text-sm text-gray-600">
                  Paid by: {expense.paidBy?.name} • Current Split: {expense.splitMethod}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">₹{expense.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-600">
                  {selectedUsers.length} people
                </p>
              </div>
            </div>
          </div>

          {/* Split Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Split Method
            </label>
            <div className="flex space-x-3">
              {['equal', 'percentage', 'custom'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleSplitMethodChange(method)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    splitMethod === method
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Members ({selectedUsers.length} selected)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {group.currentMembers?.map(member => {
                const userId = member.user?._id || member.user;
                const isSelected = selectedUsers.includes(userId);
                const userSplit = customSplits.find(split => split.userId === userId);
                
                return (
                  <div
                    key={userId}
                    className={`p-3 rounded-lg border ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <button
                        type="button"
                        onClick={() => handleUserToggle(userId)}
                        className={`w-5 h-5 rounded-full mr-2 flex-shrink-0 ${
                          isSelected ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="font-medium">{member.user?.name}</span>
                    </div>
                    
                    {isSelected && splitMethod !== 'equal' && (
                      <div className="space-y-2">
                        {splitMethod === 'percentage' ? (
                          <div>
                            <label className="text-xs text-gray-600">Percentage %</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={userSplit?.percentage || 0}
                              onChange={(e) => handleCustomSplitChange(userId, e.target.value, 'percentage')}
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="text-xs text-gray-600">Amount (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={expense.amount}
                              value={userSplit?.amount || 0}
                              onChange={(e) => handleCustomSplitChange(userId, e.target.value, 'amount')}
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                        )}
                        {userSplit?.amount && (
                          <p className="text-xs text-gray-500">
                            ₹{userSplit.amount.toFixed(2)} ({userSplit.percentage?.toFixed(2)}%)
                          </p>
                        )}
                      </div>
                    )}
                    
                    {isSelected && splitMethod === 'equal' && userSplit?.amount && (
                      <p className="text-sm text-gray-600 mt-1">
                        ₹{userSplit.amount.toFixed(2)} each
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3">Split Summary</h3>
            
            {customSplits.length > 0 ? (
              <div className="space-y-2">
                {customSplits.map((split, index) => {
                  const user = group.currentMembers?.find(
                    member => (member.user?._id || member.user) === split.userId
                  )?.user;
                  
                  return (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <span className="text-blue-600 text-sm">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span>{user?.name || 'Unknown'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">₹{split.amount?.toFixed(2)}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({split.percentage?.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2">No splits defined</p>
            )}
            
            {/* Total Validation */}
            <div className={`mt-4 p-3 rounded ${
              (amountDiff <= 0.01 && (splitMethod !== 'percentage' || percentageDiff <= 0.01))
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              <div className="flex justify-between items-center">
                <span>Total:</span>
                <div className="text-right">
                  <p className="font-bold">₹{totalAmount.toFixed(2)} / ₹{expense.amount.toFixed(2)}</p>
                  {splitMethod === 'percentage' && (
                    <p className="text-sm">{totalPercentage.toFixed(2)}% / 100%</p>
                  )}
                </div>
              </div>
              {(amountDiff > 0.01 || (splitMethod === 'percentage' && percentageDiff > 0.01)) && (
                <p className="text-sm mt-2">
                  Adjustment needed: ₹{amountDiff.toFixed(2)}
                  {splitMethod === 'percentage' && `, ${percentageDiff.toFixed(2)}%`}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || amountDiff > 0.01 || (splitMethod === 'percentage' && percentageDiff > 0.01)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Split'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitExpenseModal;