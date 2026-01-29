import React, { useState, useEffect } from 'react';
import { getExpense, updateExpense } from '../../services/expenseService';

const EditExpenseModal = ({ expenseId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    notes: '',
    receiptImage: ''
  });

  const [loading, setLoading] = useState(false);
  const [expense, setExpense] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const categories = [
    'food', 'transport', 'accommodation', 'shopping', 
    'entertainment', 'sightseeing', 'emergency', 'other'
  ];

  useEffect(() => {
    fetchExpense();
  }, [expenseId]);

  const fetchExpense = async () => {
    try {
      const response = await getExpense(expenseId);
      const expenseData = response.data;
      setExpense(expenseData);
      
      setFormData({
        description: expenseData.description || '',
        amount: expenseData.amount || '',
        category: expenseData.category || 'other',
        notes: expenseData.notes || '',
        receiptImage: expenseData.receiptImage || ''
      });
    } catch (error) {
      console.error('Error fetching expense:', error);
      alert('Failed to load expense details');
      onClose();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      await updateExpense(expenseId, {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        notes: formData.notes,
        receiptImage: formData.receiptImage
      });
      
      onSuccess();
      alert('Expense updated successfully!');
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Expense</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {expense && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Details</p>
                  <p className="text-sm text-gray-600">
                    Paid by: {expense.paidBy?.name} • Status: {expense.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">₹{expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{expense.splitBetween?.length} people</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                  required
                />
              </div>

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
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Image URL
                </label>
                <input
                  type="text"
                  name="receiptImage"
                  value={formData.receiptImage}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/receipt.jpg"
                />
              </div>
            </div>

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
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;