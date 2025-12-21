
import React, { useState, useRef, useMemo } from 'react';
import { Expense, Society, AccountHead, MainAccountGroup } from '../types';
// Added PlusCircle to imports from lucide-react
import { Plus, Download, Printer, Banknote, Building, FileText, BookOpen, ArrowUpRight, ArrowDownLeft, Upload, Tags, Layers, FolderPlus, X, Check, Search, PlusCircle } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface PaymentVouchersProps {
  expenses: Expense[];
  activeSociety: Society;
  onAddExpense: (expense: Expense) => void;
  balances?: { cash: number; bank: number };
  accountHeads: AccountHead[];
  onAddAccountHead: (head: AccountHead) => void;
}

const MAIN_GROUPS: MainAccountGroup[] = ['Assets', 'Liabilities', 'Expenses', 'Income'];

declare global {
  interface Window {
    html2pdf: any;
  }
}

const PaymentVouchers: React.FC<PaymentVouchersProps> = ({ expenses, activeSociety, onAddExpense, balances, accountHeads, onAddAccountHead }) => {
  const [activeTab, setActiveTab] = useState<'CASH' | 'BANK' | 'JOURNAL' | 'DEBIT_NOTE' | 'CREDIT_NOTE'>('CASH');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddHeadOpen, setIsAddHeadOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Expense | null>(null);

  const [formData, setFormData] = useState<Partial<Expense>>({
    paymentMode: 'Cash',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    mainGroup: 'Expenses',
    accountHeadId: ''
  });

  const [newHead, setNewHead] = useState<Partial<AccountHead>>({
      mainGroup: 'Expenses',
      subGroup: ''
  });

  const filteredExpenses = expenses.filter(e => {
      if (activeTab === 'CASH') return e.paymentMode === 'Cash';
      if (activeTab === 'JOURNAL') return e.paymentMode === 'Journal';
      if (activeTab === 'DEBIT_NOTE') return e.paymentMode === 'Debit Note';
      if (activeTab === 'CREDIT_NOTE') return e.paymentMode === 'Credit Note';
      return e.paymentMode === 'Cheque' || e.paymentMode === 'Online';
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredHeads = useMemo(() => {
    return accountHeads.filter(h => h.mainGroup === formData.mainGroup);
  }, [accountHeads, formData.mainGroup]);

  const handleOpenModal = () => {
      let defaultMode = 'Cash';
      if (activeTab === 'BANK') defaultMode = 'Cheque';
      if (activeTab === 'JOURNAL') defaultMode = 'Journal';
      if (activeTab === 'DEBIT_NOTE') defaultMode = 'Debit Note';
      if (activeTab === 'CREDIT_NOTE') defaultMode = 'Credit Note';
      setFormData({ paymentMode: defaultMode as any, amount: 0, date: new Date().toISOString().split('T')[0], mainGroup: 'Expenses', accountHeadId: '' });
      setIsModalOpen(true);
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.vendor && formData.amount && formData.accountHeadId) {
        const head = accountHeads.find(h => h.id === formData.accountHeadId);
        onAddExpense({
            id: `VCH-${Date.now()}`,
            societyId: activeSociety.id,
            category: head?.subGroup || 'General',
            amount: Number(formData.amount),
            date: formData.date || new Date().toISOString().split('T')[0],
            description: formData.description || '',
            vendor: formData.vendor,
            paymentMode: formData.paymentMode as any,
            referenceNo: formData.referenceNo,
            bankName: formData.bankName,
            mainGroup: formData.mainGroup as MainAccountGroup,
            accountHeadId: formData.accountHeadId,
            accountHeadName: head?.name
        });
        setIsModalOpen(false);
    }
  };

  const handleSaveNewHead = (e: React.FormEvent) => {
      e.preventDefault();
      if (newHead.name && newHead.mainGroup && newHead.subGroup) {
          const head: AccountHead = { id: `H${Date.now()}`, name: newHead.name, mainGroup: newHead.mainGroup as MainAccountGroup, subGroup: newHead.subGroup, societyId: activeSociety.id };
          onAddAccountHead(head);
          setFormData(prev => ({ ...prev, mainGroup: head.mainGroup, accountHeadId: head.id }));
          setIsAddHeadOpen(false);
          setNewHead({ mainGroup: 'Expenses', subGroup: '' });
      }
  };

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const opt = { margin: 0.5, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a5', orientation: 'landscape' } };
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onNew={handleOpenModal}
        balances={balances}
      />
      
      <div className="flex gap-2 border-b border-slate-200 pb-1 flex-wrap">
          <button onClick={() => setActiveTab('CASH')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'CASH' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Banknote size={16} /> Cash</button>
          <button onClick={() => setActiveTab('BANK')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'BANK' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Building size={16} /> Bank</button>
          <button onClick={() => setActiveTab('JOURNAL')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'JOURNAL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><BookOpen size={16} /> Journal</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map(voucher => (
              <div key={voucher.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                      <div className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono font-black text-slate-600 uppercase tracking-tighter">{voucher.id}</div>
                      <span className="font-black text-lg text-slate-800">₹{voucher.amount.toLocaleString()}</span>
                  </div>
                  <h3 className="font-black text-slate-800 mb-1 truncate">{voucher.vendor}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase">{voucher.mainGroup}</span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase">{voucher.paymentMode}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span className="font-bold">{voucher.date}</span>
                      <button onClick={() => { setSelectedVoucher(voucher); setIsPreviewOpen(true); }} className="text-indigo-600 font-black flex items-center gap-1 hover:underline">
                          <Printer size={14} /> PRINT
                      </button>
                  </div>
              </div>
          ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-auto animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
                <div>
                    {/* Fixed missing PlusCircle icon here */}
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><PlusCircle className="text-indigo-600" /> New Voucher</h2>
                    <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest">{activeTab.replace('_', ' ')} Register</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
            </div>
            <form onSubmit={handleSaveVoucher} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payee Name / Vendor *</label>
                        <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} placeholder="e.g. Clean Squad Pvt Ltd." />
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-3xl md:col-span-2 border border-indigo-100">
                        <div className="flex justify-between items-center mb-4 px-1">
                             <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Accounting Grouping</h4>
                             <button type="button" onClick={() => setIsAddHeadOpen(true)} className="text-[10px] font-black bg-white text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-200">+ Add Head</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-1 ml-1">Main Group</label>
                                <select className="w-full p-3 bg-white border border-indigo-100 rounded-xl font-bold text-indigo-900 outline-none" value={formData.mainGroup} onChange={e => setFormData({...formData, mainGroup: e.target.value as any, accountHeadId: ''})}>
                                    {MAIN_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-1 ml-1">Head of Account *</label>
                                <select required className="w-full p-3 bg-white border border-indigo-100 rounded-xl font-bold text-indigo-900 outline-none" value={formData.accountHeadId} onChange={e => setFormData({...formData, accountHeadId: e.target.value})}>
                                    <option value="">-- Select Head --</option>
                                    {filteredHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Voucher Amount (₹) *</label>
                            <input type="number" required min="0" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-slate-800" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Voucher Date *</label>
                            <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold">Cancel</button>
                    <button type="submit" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <Check size={20} /> Save Voucher
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVouchers;
