// frontend/src/components/groupDetails/ExpenseManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaUsers, 
  FaBalanceScale, 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaCheckCircle,
  FaSpinner,
  FaExclamationCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getExpenses, addExpense as addExpenseAPI, deleteExpense as deleteExpenseAPI } from '../../services/tripService';

const ExpenseManagement = ({ group, isMember, user }) => {
  const [expenses, setExpenses] = useState([]);
  const [totalBudget, setTotalBudget] = useState(group.budget?.max || 0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'food',
    paidBy: user?._id || '',
    splitBetween: []
  });

  useEffect(() => {
    fetchExpenses();
  }, [group._id]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await getExpenses(group._id);
      if (response.success) {
        setExpenses(response.data || []);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const calculateBalances = () => {
    const balances = {};
    const members = group.currentMembers || [];
    
    // Initialize balances
    members.forEach(member => {
      if (member.user?._id) {
        balances[member.user._id] = {
          name: member.user?.name || 'Member',
          totalPaid: 0,
          share: 0,
          balance: 0
        };
      }
    });
    
    // Calculate total paid by each member
    expenses.forEach(expense => {
      if (expense.paidBy && balances[expense.paidBy]) {
        balances[expense.paidBy].totalPaid += expense.amount;
      }
    });
    
    // Calculate share for each member
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const sharePerMember = totalExpenses / (members.length || 1);
    
    members.forEach(member => {
      if (member.user?._id && balances[member.user._id]) {
        balances[member.user._id].share = sharePerMember;
        balances[member.user._id].balance = 
          balances[member.user._id].totalPaid - sharePerMember;
      }
    });
    
    return { balances, totalExpenses, sharePerMember };
  };

  const { balances, totalExpenses, sharePerMember } = calculateBalances();

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paidBy) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      const expenseData = {
        groupId: group._id,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        paidBy: newExpense.paidBy,
        splitBetween: newExpense.splitBetween.length > 0 
          ? newExpense.splitBetween 
          : group.currentMembers?.map(m => m.user?._id).filter(id => id) || []
      };
      
      const response = await addExpenseAPI(expenseData);
      
      if (response.success) {
        // Refresh expenses
        await fetchExpenses();
        
        // Reset form
        setNewExpense({
          description: '',
          amount: '',
          category: 'food',
          paidBy: user?._id || '',
          splitBetween: []
        });
        setShowAddForm(false);
        
        toast.success('Expense added successfully!');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    
    try {
      const response = await deleteExpenseAPI(expenseId);
      if (response.success) {
        await fetchExpenses();
        toast.success('Expense deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const budgetPercentage = totalBudget > 0 ? Math.min((totalExpenses / totalBudget) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3 text-gray-600">Loading expenses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaMoneyBillWave className="mr-2 text-blue-500" />
              Expense Management
            </h2>
            <p className="text-gray-600 mt-2">
              Track expenses, split costs, and manage group budget
            </p>
          </div>
          {isMember && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 md:mt-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center mb-3">
            <FaMoneyBillWave className="text-green-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ₹{totalExpenses.toLocaleString()}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            {totalBudget > 0 ? `of ₹${totalBudget.toLocaleString()}` : 'No budget set'}
          </p>
          {totalBudget > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    budgetPercentage > 80 ? 'bg-red-500' : 
                    budgetPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${budgetPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-600">{budgetPercentage.toFixed(1)}% used</span>
                <span className="text-xs text-gray-600">
                  ₹{(totalBudget - totalExpenses).toLocaleString()} remaining
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center mb-3">
            <FaUsers className="text-blue-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Per Person Share</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ₹{sharePerMember.toLocaleString()}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            For {group.currentMembers?.length || 1} members
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center mb-3">
            <FaBalanceScale className="text-purple-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Expenses Tracked</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {expenses.length}
          </p>
          <p className="text-gray-600 text-sm mt-2">Total expenses</p>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Description *</label>
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="E.g., Dinner, Hotel, Tickets"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Amount (₹) *</label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Category</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="food">Food & Dining</option>
                <option value="accommodation">Accommodation</option>
                <option value="transport">Transport</option>
                <option value="activities">Activities</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Paid By *</label>
              <select
                value={newExpense.paidBy}
                onChange={(e) => setNewExpense({...newExpense, paidBy: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select member</option>
                {group.currentMembers?.map((member) => (
                  <option key={member.user?._id} value={member.user?._id}>
                    {member.user?._id === user?._id ? 'You' : member.user?.name || 'Member'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-gray-700 mb-2">Split Between</label>
            <div className="flex flex-wrap gap-2">
              {group.currentMembers?.map((member) => (
                member.user?._id && (
                  <label key={member.user._id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newExpense.splitBetween.includes(member.user._id)}
                      onChange={(e) => {
                        const splitBetween = e.target.checked
                          ? [...newExpense.splitBetween, member.user._id]
                          : newExpense.splitBetween.filter(id => id !== member.user._id);
                        setNewExpense({...newExpense, splitBetween});
                      }}
                      className="mr-2"
                    />
                    <span>{member.user?.name || 'Member'}</span>
                  </label>
                )
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              disabled={submitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExpense}
              disabled={submitting}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Expenses</h3>
        {expenses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <FaExclamationCircle className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">No expenses tracked yet.</p>
            {isMember && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
              >
                Add your first expense
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    {isMember && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense, index) => (
                    <tr key={expense._id || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">₹{expense.amount?.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          expense.category === 'food' ? 'bg-green-100 text-green-800' :
                          expense.category === 'accommodation' ? 'bg-blue-100 text-blue-800' :
                          expense.category === 'transport' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.paidByName || 'Member'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                      </td>
                      {isMember && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {(expense.addedBy === user?._id || expense.paidBy === user?._id) && (
                            <button
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Member Balances */}
      {Object.keys(balances).length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Member Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(balances).map(([memberId, balance]) => (
              <div key={memberId} className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">
                        {balance.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{balance.name}</h4>
                      <p className="text-gray-600 text-sm">Member</p>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    balance.balance > 0 
                      ? 'text-green-600' 
                      : balance.balance < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {balance.balance > 0 ? '+' : ''}₹{Math.abs(balance.balance).toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-medium">₹{balance.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Share:</span>
                    <span className="font-medium">₹{balance.share.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Status:</span>
                      <span className={
                        balance.balance > 0 
                          ? 'text-green-600' 
                          : balance.balance < 0 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                      }>
                        {balance.balance > 0 
                          ? 'Will Receive' 
                          : balance.balance < 0 
                          ? 'Should Pay' 
                          : 'Settled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;