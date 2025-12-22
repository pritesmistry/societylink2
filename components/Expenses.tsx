
import React, { useState, useMemo, useRef } from 'react';
import { Expense, Resident, Bill, PaymentStatus } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { Plus, Tag, Calendar, User, BookOpen, Users, Search } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface ExpensesProps {
  expenses: Expense[];
  societyId: string;
  onAddExpense: (expense: Expense) => void;
  residents?: Resident[];
  bills?: Bill[];
  balances?: { cash: number; bank: number };
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, societyId, onAddExpense, residents = [], bills = [], balances }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PERSONAL'>('GENERAL');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ amount: 0 });

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => 
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  // Calculate Personal Ledger (Member Balances)
  const personalLedger = useMemo(() => {
      return residents.map(r => {
          const memberBills = bills.filter(b => b.residentId === r.id);
          const totalBilled = memberBills.reduce((sum, b) => sum + b.totalAmount, 0);
          
          const totalPaid = memberBills
            .filter(b => b.status === PaymentStatus.PAID)
            .reduce((sum, b) => sum + b.totalAmount, 0);
          
          const outstanding = memberBills
            .filter(b => b.status !== PaymentStatus.PAID)
            .reduce((sum, b) => sum + b.totalAmount, 0);

          const currentBalance = r.openingBalance + outstanding;

          return {
              ...r,
              totalBilled,
              totalPaid,
              currentBalance
          };
      });
  }, [residents, bills]);

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
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={() => activeTab === 'GENERAL' ? setIsModalOpen(true) : alert("Manage Members in Residents tab")}
        onModify={() => activeTab === 'GENERAL' ? setIsModalOpen(true) : null}
        onSearch={() => searchInputRef.current?.focus()}
        balances={balances}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-xl font-semibold text-slate-800">Ledger Management</h2>
            <p className="text-sm text-slate-500 mt-1">General Society Expenses & Member Balances</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search ledger..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {activeTab === 'GENERAL' && (
                <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md whitespace-nowrap"
                >
                <Plus size={18} />
                Log Expense
                </button>
            )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-1">
          <button 
            onClick={() => setActiveTab('GENERAL')}
            className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'GENERAL' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <BookOpen size={16} /> General Ledger
          </button>
          <button 
            onClick={() => setActiveTab('PERSONAL')}
            className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'PERSONAL' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Users size={16} /> Members Ledger
          </button>
      </div>

      {activeTab === 'GENERAL' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExpenses.map(expense => (
            <div key={expense.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                    <h3 className="font-semibold text-slate-800">{expense.description}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Tag size={12} />
                        {expense.category}
                    </div>
                    </div>
                    <span className="font-bold text-lg text-slate-800">-₹{expense.amount.toLocaleString()}</span>
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
            {filteredExpenses.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    No matching records found in General Ledger.
                </div>
            )}
          </div>
      )}

      {activeTab === 'PERSONAL' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                          <th className="p-4 font-semibold text-slate-600 text-sm">Unit No</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm">Member Name</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm text-right">Opening Bal</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm text-right">Total Billed</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm text-right">Total Paid</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm text-right">Current Balance (Due)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {personalLedger.map(member => (
                          <tr key={member.id} className="hover:bg-slate-50">
                              <td className="p-4 text-slate-800 font-medium">{member.unitNumber}</td>
                              <td className="p-4 text-slate-600">{member.name}</td>
                              <td className="p-4 text-right text-slate-500">₹{member.openingBalance.toFixed(2)}</td>
                              <td className="p-4 text-right text-slate-600">₹{member.totalBilled.toFixed(2)}</td>
                              <td className="p-4 text-right text-green-600">₹{member.totalPaid.toFixed(2)}</td>
                              <td className={`p-4 text-right font-bold ${member.currentBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                  ₹{member.currentBalance.toFixed(2)}
                              </td>
                          </tr>
                      ))}
                      {personalLedger.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">No members found.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plus className="text-indigo-600" /> Log General Ledger Expense
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category (Head)</label>
                <select 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  placeholder="Service description"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Payee</label>
                <input 
                  type="text" 
                  required
                  placeholder="Business name"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-md transition-all active:scale-95"
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
