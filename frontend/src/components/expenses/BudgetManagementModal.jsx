import React, { useState } from 'react';
import { updateGroup } from '../../services/tripService'; // Keep this from tripService

const BudgetManagementModal = ({ group, onClose, onSuccess }) => {
  const [budgetData, setBudgetData] = useState({
    max: group.budget?.max || '',
    currency: group.budget?.currency || 'INR',
    categories: group.budget?.categories || {}
  });

  const [loading, setLoading] = useState(false);

  const expenseCategories = [
    'food', 'transport', 'accommodation', 'shopping',
    'entertainment', 'sightseeing', 'emergency', 'other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBudgetData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (category, value) => {
    setBudgetData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value ? parseFloat(value) : undefined
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (budgetData.max && isNaN(parseFloat(budgetData.max))) {
      alert('Please enter a valid budget amount');
      return;
    }

    try {
      setLoading(true);
      
      await updateGroup(group._id, {
        budget: {
          max: budgetData.max ? parseFloat(budgetData.max) : null,
          currency: budgetData.currency,
          categories: budgetData.categories
        }
      });
      
      onSuccess();
      alert('Budget updated successfully!');
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Failed to update budget: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBudget = async () => {
    if (!window.confirm('Are you sure you want to remove the budget?')) {
      return;
    }

    try {
      setLoading(true);
      await updateGroup(group._id, { budget: null });
      onSuccess();
      alert('Budget removed successfully!');
    } catch (error) {
      console.error('Error removing budget:', error);
      alert('Failed to remove budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Manage Budget</h2>
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
            <div className="space-y-6">
              {/* Overall Budget */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Overall Budget</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Budget (₹)
                    </label>
                    <input
                      type="number"
                      name="max"
                      value={budgetData.max}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={budgetData.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Set an overall budget limit for your trip
                </p>
              </div>

              {/* Category-wise Budget */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  Category-wise Budget (Optional)
                </h3>
                <p className="text-sm text-green-600 mb-4">
                  Set specific budgets for different expense categories
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenseCategories.map(category => (
                    <div key={category} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </label>
                      <div className="flex items-center">
                        <span className="mr-2">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={budgetData.categories[category] || ''}
                          onChange={(e) => handleCategoryChange(category, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="No limit"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Budget Summary</h3>
                
                {budgetData.max ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Budget:</span>
                      <span className="font-bold">
                        ₹{parseFloat(budgetData.max).toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Show category totals if any */}
                    {Object.keys(budgetData.categories).filter(cat => budgetData.categories[cat]).length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Category Budgets:</p>
                        <div className="space-y-1">
                          {Object.entries(budgetData.categories)
                            .filter(([_, amount]) => amount)
                            .map(([category, amount]) => (
                              <div key={category} className="flex justify-between text-sm">
                                <span className="text-gray-600 capitalize">{category}:</span>
                                <span>₹{amount.toFixed(2)}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No budget set yet</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center space-x-4 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleRemoveBudget}
                className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
                disabled={loading || !budgetData.max}
              >
                Remove Budget
              </button>
              
              <div className="flex space-x-4">
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
                  {loading ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BudgetManagementModal;