
import React, { useState, useRef, useMemo } from 'react';
import { Expense, Society, AccountHead, MainAccountGroup } from '../types';
import { Plus, Download, Printer, Banknote, Building, FileText, BookOpen, ArrowUpRight, ArrowDownLeft, Upload, Tags, Layers, FolderPlus, X, Check, Search } from 'lucide-react';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voucher Form State
  const [formData, setFormData] = useState<Partial<Expense>>({
    paymentMode: 'Cash',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    mainGroup: 'Expenses',
    accountHeadId: ''
  });

  // New Account Head Form State
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

  // Filter heads based on selected Main Group in Voucher Form
  const filteredHeads = useMemo(() => {
    return accountHeads.filter(h => h.mainGroup === formData.mainGroup);
  }, [accountHeads, formData.mainGroup]);

  const handleOpenModal = () => {
      let defaultMode = 'Cash';
      if (activeTab === 'BANK') defaultMode = 'Cheque';
      if (activeTab === 'JOURNAL') defaultMode = 'Journal';
      if (activeTab === 'DEBIT_NOTE') defaultMode = 'Debit Note';
      if (activeTab === 'CREDIT_NOTE') defaultMode = 'Credit Note';

      setFormData({
        paymentMode: defaultMode as any,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        mainGroup: 'Expenses',
        accountHeadId: ''
      });
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
          const head: AccountHead = {
              id: `H${Date.now()}`,
              name: newHead.name,
              mainGroup: newHead.mainGroup as MainAccountGroup,
              subGroup: newHead.subGroup,
              societyId: activeSociety.id
          };
          onAddAccountHead(head);
          // Auto select the new head in the voucher form
          setFormData(prev => ({ ...prev, mainGroup: head.mainGroup, accountHeadId: head.id }));
          setIsAddHeadOpen(false);
          setNewHead({ mainGroup: 'Expenses', subGroup: '' });
      }
  };

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.classList.remove('shadow-xl', 'border');
    
    const opt = {
      margin:       0.5,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a5', orientation: 'landscape' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        element.classList.add('shadow-xl', 'border');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onNew={handleOpenModal}
        onSave={handleOpenModal} 
        balances={balances}
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Accounting Vouchers</h2>
           <p className="text-sm text-slate-500 mt-1">Multi-group structured entry for professional auditing.</p>
        </div>
      </div>
      
      <div className="flex gap-2 border-b border-slate-200 pb-1 flex-wrap">
          <button onClick={() => setActiveTab('CASH')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'CASH' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Banknote size={16} /> Cash</button>
          <button onClick={() => setActiveTab('BANK')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'BANK' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Building size={16} /> Bank</button>
          <button onClick={() => setActiveTab('JOURNAL')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'JOURNAL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><BookOpen size={16} /> Journal</button>
          <button onClick={() => setActiveTab('DEBIT_NOTE')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'DEBIT_NOTE' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><ArrowUpRight size={16} /> Debit Note</button>
          <button onClick={() => setActiveTab('CREDIT_NOTE')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'CREDIT_NOTE' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><ArrowDownLeft size={16} /> Credit Note</button>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
           <div className="text-sm text-slate-500">Showing {filteredExpenses.length} records in {activeTab} register</div>
           <button onClick={handleOpenModal} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"><Plus size={18} /> New Voucher Entry</button>
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
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{voucher.accountHeadName}</span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase">{voucher.paymentMode}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 italic">"{voucher.description}"</p>
                  
                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span className="font-bold">{voucher.date}</span>
                      <button onClick={() => { setSelectedVoucher(voucher); setIsPreviewOpen(true); }} className="text-indigo-600 font-black flex items-center gap-1 hover:underline">
                          <Printer size={14} /> PRINT VOUCHER
                      </button>
                  </div>
              </div>
          ))}
          {filteredExpenses.length === 0 && (
               <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                   <FileText size={48} className="mx-auto mb-4 opacity-10" />
                   <p className="font-bold">No vouchers in this register.</p>
               </div>
          )}
      </div>

      {/* VOUCHER CREATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-auto animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Plus className="text-indigo-600" /> New Voucher Entry</h2>
                    <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest">{activeTab.replace('_', ' ')} Register</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
            </div>
            
            <form onSubmit={handleSaveVoucher} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payee Name / Vendor *</label>
                        <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-slate-800" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} placeholder="e.g. Clean Squad Pvt Ltd." />
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-3xl md:col-span-2 border border-indigo-100">
                        <div className="flex justify-between items-center mb-4 px-1">
                             <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Accounting Grouping</h4>
                             <button type="button" onClick={() => setIsAddHeadOpen(true)} className="text-[10px] font-black bg-white text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">+ Add New Account Head</button>
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
                                    {filteredHeads.map(h => <option key={h.id} value={h.id}>{h.name} ({h.subGroup})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Voucher Amount (₹) *</label>
                            <input type="number" required min="0" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-black text-xl text-slate-800" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Voucher Date *</label>
                            <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Narration / Description</label>
                    <textarea rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Being amount paid towards..." />
                </div>

                {activeTab === 'BANK' && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-100 p-6 rounded-3xl">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Cheque No / Ref</label>
                        <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold" placeholder="Chq No." value={formData.referenceNo || ''} onChange={e => setFormData({...formData, referenceNo: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Bank Name</label>
                        <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold" placeholder="Drawing Bank" value={formData.bankName || ''} onChange={e => setFormData({...formData, bankName: e.target.value})} />
                      </div>
                  </div>
                )}
              
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                    <button type="submit" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
                        <Check size={20} /> Save Official Voucher
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT HEAD CREATION MODAL (POPUP WITHIN MODAL) */}
      {isAddHeadOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><FolderPlus className="text-indigo-600" /> New Account Head</h3>
                      <button onClick={() => setIsAddHeadOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSaveNewHead} className="space-y-5">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Main Group</label>
                          <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={newHead.mainGroup} onChange={e => setNewHead({...newHead, mainGroup: e.target.value as any})}>
                              {MAIN_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sub Group / Category</label>
                          <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" placeholder="e.g. Current Assets, Utilities" value={newHead.subGroup} onChange={e => setNewHead({...newHead, subGroup: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Head Name</label>
                          <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" placeholder="e.g. Lift AMC charges" value={newHead.name} onChange={e => setNewHead({...newHead, name: e.target.value})} />
                      </div>
                      <div className="flex gap-2 pt-4">
                          <button type="button" onClick={() => setIsAddHeadOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                          <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">Add Account</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* VOUCHER PREVIEW MODAL */}
      {isPreviewOpen && selectedVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[120] backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-2xl flex flex-col items-center">
                  <div className="flex gap-4 mb-4">
                      <button onClick={() => downloadPDF('voucher-preview', `Voucher_${selectedVoucher.id}.pdf`)} className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-50 flex items-center gap-2"><Printer size={20} /> Download PDF</button>
                      <button onClick={() => setIsPreviewOpen(false)} className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-900">Close</button>
                  </div>

                  <div id="voucher-preview" className="bg-white w-[210mm] h-[148mm] p-[10mm] shadow-2xl border border-slate-200 mx-auto text-slate-800" style={{ fontFamily: 'serif' }}>
                      <div className="border-4 border-double border-slate-800 h-full p-8 relative flex flex-col">
                          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                              <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">{activeSociety.name}</h1>
                              <p className="text-xs italic text-slate-500">{activeSociety.address}</p>
                              <div className="mt-4 inline-block bg-slate-800 text-white px-8 py-1.5 font-bold text-lg uppercase tracking-widest rounded-lg">
                                  {selectedVoucher.paymentMode} Voucher
                              </div>
                          </div>

                          <div className="flex justify-between items-center mb-8">
                              <p className="font-bold text-lg">Vch No: <span className="font-mono text-indigo-700 px-2">{selectedVoucher.id}</span></p>
                              <p className="font-bold text-lg">Date: <span className="px-2">{selectedVoucher.date}</span></p>
                          </div>

                          <div className="space-y-8 text-lg leading-loose flex-1">
                              <div className="flex items-end gap-2">
                                  <span>Paid to Mr./Ms./M/s :</span>
                                  <span className="font-bold border-b-2 border-dotted border-slate-400 px-4 flex-1 pb-1">{selectedVoucher.vendor}</span>
                              </div>
                              <div className="flex items-end gap-2">
                                  <span>A sum of Rupees :</span>
                                  <span className="font-black text-xl border-b-2 border-dotted border-slate-400 px-4 flex-1 pb-1">₹ {selectedVoucher.amount.toLocaleString()} /-</span>
                              </div>
                              
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                                  <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Classification</p>
                                      <p className="text-sm font-bold">{selectedVoucher.mainGroup} / {selectedVoucher.accountHeadName}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Sub-Category</p>
                                      <p className="text-sm font-bold">{selectedVoucher.category}</p>
                                  </div>
                              </div>

                              <div className="flex items-end gap-2">
                                  <span>Towards :</span>
                                  <span className="italic border-b-2 border-dotted border-slate-400 px-4 flex-1 pb-1">"{selectedVoucher.description}"</span>
                              </div>

                              {selectedVoucher.paymentMode !== 'Cash' && selectedVoucher.paymentMode !== 'Journal' && (
                                  <p className="text-sm font-bold bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex justify-between">
                                      <span>Mode: {selectedVoucher.paymentMode}</span>
                                      <span>Ref: {selectedVoucher.referenceNo || 'N/A'}</span>
                                      <span>Bank: {selectedVoucher.bankName || 'N/A'}</span>
                                  </p>
                              )}
                          </div>

                          <div className="mt-auto grid grid-cols-3 gap-10 pt-12">
                              <div className="text-center">
                                  <div className="border-t border-slate-400 pt-2 font-black text-xs uppercase tracking-widest text-slate-500">Prepared By</div>
                              </div>
                              <div className="text-center">
                                  <div className="border-t border-slate-400 pt-2 font-black text-xs uppercase tracking-widest text-slate-500">Receiver's Sign</div>
                              </div>
                              <div className="text-center">
                                  <div className="border-t border-slate-400 pt-2 font-black text-xs uppercase tracking-widest text-slate-800">Authorised Signatory</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PaymentVouchers;
