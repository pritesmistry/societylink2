
import React, { useState } from 'react';
import { Expense, Society } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { Plus, Download, Printer, Banknote, Building, FileText, BookOpen } from 'lucide-react';

interface PaymentVouchersProps {
  expenses: Expense[];
  activeSociety: Society;
  onAddExpense: (expense: Expense) => void;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const PaymentVouchers: React.FC<PaymentVouchersProps> = ({ expenses, activeSociety, onAddExpense }) => {
  const [activeTab, setActiveTab] = useState<'CASH' | 'BANK' | 'JOURNAL'>('CASH');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Expense | null>(null);

  const [formData, setFormData] = useState<Partial<Expense>>({
    paymentMode: 'Cash',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const filteredExpenses = expenses.filter(e => {
      if (activeTab === 'CASH') return e.paymentMode === 'Cash';
      if (activeTab === 'JOURNAL') return e.paymentMode === 'Journal';
      return e.paymentMode === 'Cheque' || e.paymentMode === 'Online';
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenModal = () => {
      let defaultMode = 'Cash';
      if (activeTab === 'BANK') defaultMode = 'Cheque';
      if (activeTab === 'JOURNAL') defaultMode = 'Journal';

      setFormData({
        paymentMode: defaultMode as any,
        amount: 0,
        date: new Date().toISOString().split('T')[0]
      });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.vendor && formData.amount && formData.category) {
        onAddExpense({
            id: `VCH-${Date.now()}`,
            societyId: activeSociety.id,
            category: formData.category,
            amount: Number(formData.amount),
            date: formData.date || new Date().toISOString().split('T')[0],
            description: formData.description || '',
            vendor: formData.vendor,
            paymentMode: formData.paymentMode as any,
            referenceNo: formData.referenceNo,
            bankName: formData.bankName
        });
        setIsModalOpen(false);
    }
  };

  const handlePreview = (voucher: Expense) => {
      setSelectedVoucher(voucher);
      setIsPreviewOpen(true);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Voucher Management</h2>
           <p className="text-sm text-slate-500 mt-1">Create and print formal Cash, Bank, and Journal vouchers.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-1 flex-wrap">
          <button 
            onClick={() => setActiveTab('CASH')}
            className={`px-4 md:px-6 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'CASH' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Banknote size={18} /> Cash Vouchers
          </button>
          <button 
            onClick={() => setActiveTab('BANK')}
            className={`px-4 md:px-6 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'BANK' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Building size={18} /> Bank Vouchers
          </button>
          <button 
            onClick={() => setActiveTab('JOURNAL')}
            className={`px-4 md:px-6 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'JOURNAL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <BookOpen size={18} /> Journal Vouchers
          </button>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
           <div className="text-sm text-slate-500">
               Showing {filteredExpenses.length} {activeTab.toLowerCase()} vouchers
           </div>
           <button 
            onClick={handleOpenModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md"
           >
            <Plus size={18} />
            Create {activeTab === 'CASH' ? 'Cash' : activeTab === 'BANK' ? 'Bank' : 'Journal'} Voucher
           </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map(voucher => (
              <div key={voucher.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                      <div className="bg-slate-100 px-2 py-1 rounded text-xs font-mono font-bold text-slate-600">
                          {voucher.id}
                      </div>
                      <span className="font-bold text-lg text-slate-800">₹{voucher.amount.toFixed(2)}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">{voucher.vendor}</h3>
                  <div className="flex gap-2 mb-2">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{voucher.category}</span>
                      {voucher.paymentMode === 'Journal' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">JV</span>}
                  </div>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{voucher.description}</p>
                  
                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span>{voucher.date}</span>
                      <button 
                        onClick={() => handlePreview(voucher)}
                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <Printer size={14} /> Print
                      </button>
                  </div>
              </div>
          ))}
          {filteredExpenses.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                   No vouchers found. Create one to get started.
               </div>
          )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create {activeTab === 'CASH' ? 'Cash' : activeTab === 'BANK' ? 'Bank' : 'Journal'} Voucher</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {activeTab === 'JOURNAL' ? 'Credit Ledger (Vendor/Payable)' : 'Payee Name (Vendor)'}
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.vendor}
                  onChange={e => setFormData({...formData, vendor: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                    <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                    type="date" 
                    required
                    className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {activeTab === 'JOURNAL' ? 'Debit Ledger (Category)' : 'Category'}
                </label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {activeTab === 'JOURNAL' ? 'Narration' : 'Description / Towards'}
                </label>
                <textarea 
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {activeTab === 'BANK' && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cheque No / Ref</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Chq No."
                            value={formData.referenceNo || ''}
                            onChange={e => setFormData({...formData, referenceNo: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Drawing Bank"
                            value={formData.bankName || ''}
                            onChange={e => setFormData({...formData, bankName: e.target.value})}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.paymentMode}
                            onChange={e => setFormData({...formData, paymentMode: e.target.value as any})}
                        >
                            <option value="Cheque">Cheque</option>
                            <option value="Online">Online / NEFT</option>
                        </select>
                      </div>
                  </div>
              )}
              
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
                  Create Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {isPreviewOpen && selectedVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-2xl flex flex-col items-center">
                  <div className="flex gap-4 mb-4">
                      <button 
                        onClick={() => downloadPDF('voucher-preview', `Voucher_${selectedVoucher.id}.pdf`)}
                        className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-50 flex items-center gap-2"
                      >
                          <Download size={20} /> Download PDF
                      </button>
                      <button 
                        onClick={() => setIsPreviewOpen(false)}
                        className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-900"
                      >
                          Close
                      </button>
                  </div>

                  <div 
                    id="voucher-preview" 
                    className="bg-white w-[210mm] h-[148mm] p-[10mm] shadow-xl border border-slate-300 mx-auto text-slate-800"
                    style={{ fontFamily: 'serif' }}
                  >
                      <div className="border-2 border-slate-800 h-full p-6 relative">
                          {/* Header */}
                          <div className="text-center border-b-2 border-slate-800 pb-4">
                              <h1 className="text-2xl font-bold uppercase tracking-widest">{activeSociety.name}</h1>
                              <p className="text-sm italic">{activeSociety.address}</p>
                              <div className="mt-4 inline-block bg-slate-800 text-white px-6 py-1 font-bold text-lg uppercase">
                                  {selectedVoucher.paymentMode === 'Cash' ? 'Cash Voucher' : 
                                   selectedVoucher.paymentMode === 'Journal' ? 'Journal Voucher' : 
                                   'Bank Payment Voucher'}
                              </div>
                          </div>

                          <div className="flex justify-between items-center mt-6">
                              <p className="font-bold">No: <span className="font-normal border-b border-dotted border-slate-400 px-2">{selectedVoucher.id}</span></p>
                              <p className="font-bold">Date: <span className="font-normal border-b border-dotted border-slate-400 px-2">{selectedVoucher.date}</span></p>
                          </div>

                          {selectedVoucher.paymentMode === 'Journal' ? (
                              <div className="mt-8 space-y-6 text-lg leading-loose">
                                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-2">
                                      <span><strong>Debit:</strong> {selectedVoucher.category}</span>
                                      <span>₹ {selectedVoucher.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-2">
                                      <span><strong>Credit:</strong> {selectedVoucher.vendor}</span>
                                      <span>₹ {selectedVoucher.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="pt-4">
                                      <p><strong>Narration:</strong> {selectedVoucher.description}</p>
                                  </div>
                              </div>
                          ) : (
                              <div className="mt-8 space-y-6 text-lg leading-loose">
                                  <p>
                                      Paid to Mr./Ms./M/s 
                                      <span className="font-bold border-b border-dotted border-slate-400 px-4 ml-2 w-full inline-block">{selectedVoucher.vendor}</span>
                                  </p>
                                  <p>
                                      A sum of Rupees 
                                      <span className="font-bold border-b border-dotted border-slate-400 px-4 ml-2 inline-block">₹ {selectedVoucher.amount.toLocaleString()} /-</span>
                                  </p>
                                  
                                  {selectedVoucher.paymentMode !== 'Cash' && (
                                      <p>
                                          By Cheque No / Ref 
                                          <span className="font-bold border-b border-dotted border-slate-400 px-4 mx-2">{selectedVoucher.referenceNo || '________'}</span>
                                          dated 
                                          <span className="font-bold border-b border-dotted border-slate-400 px-4 mx-2">{selectedVoucher.date}</span>
                                          Drawn on 
                                          <span className="font-bold border-b border-dotted border-slate-400 px-4 mx-2">{selectedVoucher.bankName || '________'}</span>
                                      </p>
                                  )}

                                  <p>
                                      Towards 
                                      <span className="font-bold border-b border-dotted border-slate-400 px-4 ml-2 inline-block w-full">{selectedVoucher.description} ({selectedVoucher.category})</span>
                                  </p>
                              </div>
                          )}

                          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pt-12">
                              <div className="text-center">
                                  <div className="border-t border-slate-400 w-32"></div>
                                  <p className="text-sm font-bold mt-1">Prepared By</p>
                              </div>
                              {selectedVoucher.paymentMode !== 'Journal' && (
                                  <div className="text-center">
                                      <div className="border-t border-slate-400 w-32"></div>
                                      <p className="text-sm font-bold mt-1">Receiver's Sign</p>
                                  </div>
                              )}
                              <div className="text-center">
                                  <div className="border-t border-slate-400 w-32"></div>
                                  <p className="text-sm font-bold mt-1">Authorised Signatory</p>
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
