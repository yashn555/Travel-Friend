// frontend/src/components/expenses/ExpenseAnalytics.jsx - NEW
import React from 'react';

const ExpenseAnalytics = ({ expenses, summary, groupId }) => {
  // Calculate analytics from expenses
  const categoryTotals = {};
  expenses.forEach(expense => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Expense Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 capitalize">{category}</span>
                  <span className="font-bold text-gray-900">₹{total.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(total / totalSpent) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700">Total Expenses</span>
              <span className="font-bold text-blue-900">{expenses.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">Total Amount</span>
              <span className="font-bold text-green-900">₹{totalSpent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-purple-700">Average per Expense</span>
              <span className="font-bold text-purple-900">
                ₹{(totalSpent / (expenses.length || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
              <span className="text-amber-700">Budget Used</span>
              <span className="font-bold text-amber-900">
                {summary?.budgetUsed?.toFixed(1) || '0'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Timeline</h3>
        <div className="text-center text-gray-500 py-8">
          <p>Expense timeline chart will be displayed here</p>
          <p className="text-sm mt-2">(Chart implementation pending)</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalytics;