
import React, { useState } from 'react';
import { Income } from '../types';
import { INCOME_CATEGORIES } from '../constants';
import { Plus, Tag, Calendar, User, TrendingUp } from 'lucide-react';

interface IncomeProps {
  incomes: Income[];
  societyId: string;
  onAddIncome: (income: Income) => void;
}

const IncomeSection: React.FC<IncomeProps> = ({ incomes, societyId, onAddIncome }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newIncome, setNewIncome] = useState<Partial<Income>>({ 
      amount: 0,
      mode: 'Bank Transfer'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncome.category && newIncome.amount && newIncome.payer) {
      onAddIncome({
        id: `INC${Date.now()}`,
        societyId,
        category: newIncome.category,
        amount: Number(newIncome.amount),
        date: newIncome.date || new Date().toISOString().split('T')[0],
        description: newIncome.description || '',
        payer: newIncome.payer,
        mode: newIncome.mode || 'Bank Transfer'
      });
      setIsModalOpen(false);
      setNewIncome({ amount: 0, mode: 'Bank Transfer' });
    }
  };

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-semibold text-slate-800">Other Income Register</h2>
            <p className="text-sm text-slate-500 mt-1">Record non-maintenance revenue (Interest, Rent, etc.)</p>
        </div>
        
        <div className="flex items-center gap-4">
             <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex flex-col items-end">
                <span className="text-xs font-bold text-green-700 uppercase">Total Other Income</span>
                <span className="text-lg font-bold text-green-800">₹{totalIncome.toLocaleString()}</span>
            </div>
            <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-md"
            >
            <Plus size={18} />
            Record Income
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incomes.map(income => (
          <div key={income.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-slate-800">{income.description}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Tag size={12} />
                    {income.category}
                  </div>
                </div>
                <span className="font-bold text-lg text-green-700">+₹{income.amount}</span>
             </div>
             <div className="border-t border-slate-100 pt-3 mt-2 flex justify-between text-sm text-slate-500">
               <div className="flex items-center gap-2">
                  <User size={14} />
                  {income.payer}
               </div>
               <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {income.date}
               </div>
             </div>
              <div className="mt-2 text-xs text-slate-400 bg-slate-50 p-1 rounded inline-block w-fit">
                  Mode: {income.mode}
              </div>
          </div>
        ))}
        {incomes.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <TrendingUp size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No miscellaneous income recorded.</p>
                <p className="text-sm">Use this to track Bank Interest, Rent, or other society revenue.</p>
            </div>
        )}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-600" />
                Record Income
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                  required
                  value={newIncome.category}
                  onChange={e => setNewIncome({...newIncome, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {INCOME_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. FD Quarterly Interest"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={e => setNewIncome({...newIncome, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Received From (Payer)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bank Name / Advertiser Name"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={e => setNewIncome({...newIncome, payer: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                    onChange={e => setNewIncome({...newIncome, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                    onChange={e => setNewIncome({...newIncome, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                 <select 
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                    value={newIncome.mode}
                    onChange={e => setNewIncome({...newIncome, mode: e.target.value as any})}
                  >
                     <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/Direct Credit)</option>
                     <option value="Cheque">Cheque</option>
                     <option value="Cash">Cash</option>
                  </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-lg"
                >
                  Save Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeSection;
