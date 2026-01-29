import React, { useState } from 'react';
import { createExpense } from '../../services/expenseService';

const AddExpenseModal = ({ group, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    splitMethod: 'equal',
    notes: '',
    receiptImage: '',
    splitBetween: group.currentMembers?.map(member => member.user?._id || member.user) || [],
    customSplits: [],
    paidBy: ''
  });

  const [loading, setLoading] = useState(false);
  const [showCustomSplit, setShowCustomSplit] = useState(false);

  const categories = [
    'food', 'transport', 'accommodation', 'shopping', 
    'entertainment', 'sightseeing', 'emergency', 'other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSplitMethodChange = (method) => {
    setFormData(prev => ({ ...prev, splitMethod: method }));
    setShowCustomSplit(method === 'custom');
  };

  const handleMemberToggle = (userId) => {
    const current = formData.splitBetween;
    if (current.includes(userId)) {
      setFormData(prev => ({
        ...prev,
        splitBetween: current.filter(id => id !== userId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        splitBetween: [...current, userId]
      }));
    }
  };

  const handleCustomSplitChange = (userId, amount) => {
    const customSplits = [...formData.customSplits];
    const existingIndex = customSplits.findIndex(split => split.userId === userId);
    
    if (existingIndex >= 0) {
      customSplits[existingIndex].amount = parseFloat(amount) || 0;
    } else {
      customSplits.push({ userId, amount: parseFloat(amount) || 0 });
    }
    
    setFormData(prev => ({ ...prev, customSplits }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.paidBy) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.splitBetween.length === 0) {
      alert('Please select at least one member to split with');
      return;
    }

    if (formData.splitMethod === 'custom' && formData.customSplits.length === 0) {
      alert('Please set custom splits for all selected members');
      return;
    }

    try {
      setLoading(true);
      
      const expenseData = {
        groupId: group._id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        splitMethod: formData.splitMethod,
        splitBetween: formData.splitBetween,
        notes: formData.notes,
        receiptImage: formData.receiptImage,
        paidBy: formData.paidBy
      };

      if (formData.splitMethod === 'custom') {
        expenseData.customSplits = formData.customSplits;
      }

      await createExpense(expenseData);
      
      onSuccess();
      alert('Expense added successfully! Payment requests sent to members.');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const totalCustomAmount = formData.customSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const amountDifference = Math.abs(totalCustomAmount - parseFloat(formData.amount || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Expense</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What was this expense for?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid By *
                  </label>
                  <select
                    name="paidBy"
                    value={formData.paidBy}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select who paid</option>
                    {group.currentMembers?.map(member => (
                      <option key={member.user?._id || member.user} value={member.user?._id || member.user}>
                        {member.user?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Split Method
                </label>
                <div className="flex space-x-4 mb-6">
                  {['equal', 'percentage', 'custom'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handleSplitMethodChange(method)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        formData.splitMethod === method
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)} Split
                    </button>
                  ))}
                </div>

                {/* Split Members Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Split Between ({formData.splitBetween.length} members selected)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {group.currentMembers?.map(member => {
                      const userId = member.user?._id || member.user;
                      const isSelected = formData.splitBetween.includes(userId);
                      
                      return (
                        <button
                          key={userId}
                          type="button"
                          onClick={() => handleMemberToggle(userId)}
                          className={`p-3 rounded-lg border text-left ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3 ${
                              isSelected ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <span className="font-medium">{member.user?.name}</span>
                          </div>
                          
                          {showCustomSplit && isSelected && (
                            <div className="mt-2">
                              <input
                                type="number"
                                placeholder="Amount"
                                step="0.01"
                                min="0"
                                className="w-full px-2 py-1 text-sm border rounded"
                                onChange={(e) => handleCustomSplitChange(userId, e.target.value)}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Split Summary */}
                {showCustomSplit && formData.splitBetween.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Custom Split Summary:</span>
                      <span className={`font-bold ${
                        amountDifference < 0.01 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Total: ₹{totalCustomAmount.toFixed(2)} / ₹{parseFloat(formData.amount || 0).toFixed(2)}
                      </span>
                    </div>
                    {amountDifference > 0.01 && (
                      <p className="text-sm text-red-600">
                        Warning: Custom splits total doesn't match expense amount (difference: ₹{amountDifference.toFixed(2)})
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes about this expense..."
                />
              </div>

              {/* Receipt Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    name="receiptImage"
                    value={formData.receiptImage}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter image URL"
                  />
                  <button
                    type="button"
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                  >
                    Upload
                  </button>
                </div>
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
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding Expense...
                  </span>
                ) : (
                  'Add Expense & Send Payment Requests'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;