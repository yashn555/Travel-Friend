// frontend/src/components/expenses/ExpenseSummaryCard.jsx - NEW
import React from 'react';

const ExpenseSummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium opacity-90">Total Expenses</h3>
            <p className="text-3xl font-bold mt-2">₹{summary.totalExpenses?.toFixed(2)}</p>
          </div>
          <div className="text-3xl">💰</div>
        </div>
        <p className="text-sm opacity-80 mt-3">{summary.expensesCount} expenses</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium opacity-90">Per Person</h3>
            <p className="text-3xl font-bold mt-2">₹{summary.sharePerPerson?.toFixed(2)}</p>
          </div>
          <div className="text-3xl">👥</div>
        </div>
        <p className="text-sm opacity-80 mt-3">Split between {summary.memberCount} members</p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium opacity-90">Budget Used</h3>
            <p className="text-3xl font-bold mt-2">{summary.budgetUsed?.toFixed(1)}%</p>
          </div>
          <div className="text-3xl">🎯</div>
        </div>
        <p className="text-sm opacity-80 mt-3">
          {summary.budget?.max ? `of ₹${summary.budget.max}` : 'No budget set'}
        </p>
      </div>
      
      <div className={`p-6 rounded-2xl shadow-lg ${
        summary.userBalance >= 0 
          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
          : 'bg-gradient-to-br from-amber-500 to-amber-600'
      } text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium opacity-90">
              {summary.userBalance >= 0 ? 'You are Owed' : 'You Owe'}
            </h3>
            <p className="text-3xl font-bold mt-2">₹{Math.abs(summary.userBalance || 0).toFixed(2)}</p>
          </div>
          <div className="text-3xl">{summary.userBalance >= 0 ? '💵' : '📝'}</div>
        </div>
        <p className="text-sm opacity-80 mt-3">
          {summary.userBalance >= 0 ? 'People owe you money' : 'You need to pay others'}
        </p>
      </div>
    </div>
  );
};

export default ExpenseSummaryCard;