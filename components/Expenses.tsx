
import React, { useState } from 'react';
import { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { Plus, Tag, Calendar, User } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  societyId: string;
  onAddExpense: (expense: Expense) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, societyId, onAddExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ amount: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.category && newExpense.amount && newExpense.vendor) {
      onAddExpense({
        id: `E${Date.now()}`,
        societyId,
        category: newExpense.category,
        amount: Number(newExpense.amount),
        date: newExpense.date || new Date().toISOString().split('T')[0],
        description: newExpense.description || '',
        vendor: newExpense.vendor
      });
      setIsModalOpen(false);
      setNewExpense({ amount: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Expense Ledger</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={18} />
          Log Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {expenses.map(expense => (
          <div key={expense.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-slate-800">{expense.description}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Tag size={12} />
                    {expense.category}
                  </div>
                </div>
                <span className="font-bold text-lg text-slate-800">-₹{expense.amount}</span>
             </div>
             <div className="border-t border-slate-100 pt-3 mt-2 flex justify-between text-sm text-slate-500">
               <div className="flex items-center gap-2">
                  <User size={14} />
                  {expense.vendor}
               </div>
               <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {expense.date}
               </div>
             </div>
          </div>
        ))}
        {expenses.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                No expenses recorded for this society.
            </div>
        )}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Log New Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded-md"
                  required
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border border-slate-300 rounded-md"
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Payee</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border border-slate-300 rounded-md"
                  onChange={e => setNewExpense({...newExpense, vendor: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full p-2 border border-slate-300 rounded-md"
                    onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-2 border border-slate-300 rounded-md"
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
