// frontend/src/components/expenses/ExpenseList.jsx - NEW
import React from 'react';
import { Link } from 'react-router-dom';

const ExpenseList = ({ expenses, onRefresh, groupId, currentUserId }) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Expenses</h2>
        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            🔄 Refresh
          </button>
          <Link
            to={`/groups/${groupId}/expenses?view=add`}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            + Add Expense
          </Link>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💸</div>
          <h3 className="text-xl font-medium text-gray-700">No expenses yet</h3>
          <p className="text-gray-500 mt-2">Add your first expense to get started</p>
          <Link
            to={`/groups/${groupId}/expenses?view=add`}
            className="mt-4 inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            + Add First Expense
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{expense.description}</h4>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                    <span className="font-medium">₹{expense.amount.toFixed(2)}</span>
                    <span>•</span>
                    <span className="capitalize">{expense.category}</span>
                    <span>•</span>
                    <span>Paid by {expense.paidBy?.name}</span>
                    <span>•</span>
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  expense.status === 'settled' ? 'bg-green-100 text-green-800' :
                  expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {expense.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details
                </button>
                {expense.addedBy === currentUserId && (
                  <>
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium ml-3">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium ml-3">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;