
import React, { useState, useRef, useMemo } from 'react';
import { Bill, PaymentStatus, Resident, BillItem, Society, BillLayout, PaymentDetails } from '../types';
import { FileText, Plus, Trash2, Calculator, DollarSign, AlertCircle, Upload, Users, Download, Clock, Settings, FileDown, Eye, Check, CreditCard, Receipt, CalendarRange, QrCode, ExternalLink, Image as ImageIcon, Save, Scissors, LayoutTemplate, X, MessageSquarePlus } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

declare global {
  interface Window {
    html2pdf: any;
  }
}

interface BillingProps {
  bills: Bill[];
  residents: Resident[];
  societyId: string;
  activeSociety: Society;
  onGenerateBill: (bill: Bill) => void;
  onBulkAddBills: (bills: Bill[]) => void;
  onUpdateSociety: (society: Society) => void;
  onUpdateBill: (bill: Bill) => void;
  balances?: { cash: number; bank: number };
}

const Billing: React.FC<BillingProps> = ({ bills, residents, societyId, activeSociety, onGenerateBill, onBulkAddBills, onUpdateSociety, onUpdateBill, balances }) => {
  const [filter, setFilter] = useState<PaymentStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<'TOP_BILL' | 'BILL_WITH_RECEIPT' | 'FOOTER_NOTES'>('TOP_BILL');

  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [items, setItems] = useState<BillItem[]>([
    { id: '1', description: 'Maintenance Charges', type: 'Fixed', rate: 0, amount: 0 }
  ]);
  const [interest, setInterest] = useState<number>(0);
  
  // Custom Notes State for Generation
  const [customBillNotes, setCustomBillNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState('');

  // Settings State
  const [tempFooterNote, setTempFooterNote] = useState(activeSociety.footerNote || '');

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.status === filter);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0) + interest;

  const lastReceipt = useMemo(() => {
    if (!previewBill) return null;
    return bills
      .filter(b => b.residentId === previewBill.residentId && b.status === PaymentStatus.PAID && b.paymentDetails)
      .sort((a, b) => new Date(b.paymentDetails!.date).getTime() - new Date(a.paymentDetails!.date).getTime())[0];
  }, [previewBill, bills]);

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return 'bg-green-100 text-green-700 border-green-200';
      case PaymentStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case PaymentStatus.OVERDUE: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleResidentChange = (residentId: string) => {
    setSelectedResidentId(residentId);
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return;

    setItems(prev => prev.map(item => ({
      ...item,
      amount: item.type === 'SqFt' ? item.rate * resident.sqFt : item.rate
    })));
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    const resident = residents.find(r => r.id === selectedResidentId);
    
    if (field === 'rate' || field === 'type') {
       const rate = Number(value) || 0;
       item.amount = (item.type === 'SqFt' && resident) ? rate * resident.sqFt : rate;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', type: 'Fixed', rate: 0, amount: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleAddCustomNote = () => {
      if (noteInput.trim()) {
          setCustomBillNotes([...customBillNotes, noteInput.trim()]);
          setNoteInput('');
      }
  };

  const removeCustomNote = (idx: number) => {
      setCustomBillNotes(customBillNotes.filter((_, i) => i !== idx));
  };

  const handleOpenGenerateModal = () => {
      setItems([{ id: Date.now().toString(), description: 'Maintenance Charges', type: 'Fixed', rate: 0, amount: 0 }]);
      setCustomBillNotes([]);
      setIsModalOpen(true);
  };

  const handleSingleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const resident = residents.find(r => r.id === selectedResidentId);
    if (resident && dueDate && billDate && totalAmount > 0) {
      onGenerateBill({
        id: `B${Date.now()}`,
        societyId,
        residentId: resident.id,
        residentName: resident.name,
        unitNumber: resident.unitNumber,
        items: items,
        interest: interest,
        totalAmount: totalAmount,
        dueDate: dueDate,
        status: PaymentStatus.PENDING,
        generatedDate: billDate,
        billMonth: billingMonth,
        customNotes: customBillNotes
      });
      setIsModalOpen(false);
    }
  };

  const handlePaymentClick = (bill: Bill) => {
      setSelectedBillForPayment(bill);
      setPaymentForm({ date: new Date().toISOString().split('T')[0], mode: 'UPI', reference: '', remarks: '' });
      setIsPaymentModalOpen(true);
  };

  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentDetails>({
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      reference: '',
      remarks: ''
  });

  const handlePreview = (bill: Bill) => {
      setPreviewBill(bill);
      setPreviewTemplate('TOP_BILL');
      setIsPreviewOpen(true);
  };

  const handleSaveGlobalSettings = () => {
      onUpdateSociety({ ...activeSociety, footerNote: tempFooterNote });
      setIsSettingsOpen(false);
  };

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const opt = { 
        margin: 0, 
        filename: filename, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2 }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } 
    };
    window.html2pdf().set(opt).from(element).save();
  };

  const formatBillingMonth = (monthStr?: string) => {
    if (!monthStr) return '';
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={handleOpenGenerateModal} 
        onModify={() => { setTempFooterNote(activeSociety.footerNote || ''); setIsSettingsOpen(true); }}
        balances={balances} 
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          {['All', PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.OVERDUE].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { setTempFooterNote(activeSociety.footerNote || ''); setIsSettingsOpen(true); }}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
            >
                <Settings size={18} /> Global Settings
            </button>
            <button onClick={handleOpenGenerateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus size={18} /> Generate Bill
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.map(bill => (
          <div key={bill.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono text-slate-400">{bill.id}</span>
                <h3 className="font-bold text-slate-800">{bill.unitNumber} - {bill.residentName}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(bill.status)}`}>
                {bill.status}
              </span>
            </div>
            <div className="space-y-2 mb-4 text-sm">
               {bill.items.map((item, i) => (
                 <div key={i} className="flex justify-between"><span className="text-slate-500">{item.description}</span><span className="text-slate-800 font-medium">₹{item.amount.toLocaleString()}</span></div>
               ))}
               <div className="flex justify-between font-bold border-t border-slate-100 pt-2"><span>Total</span><span>₹{bill.totalAmount.toLocaleString()}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
               {bill.status !== PaymentStatus.PAID ? (
                  <button onClick={() => handlePaymentClick(bill)} className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"><CreditCard size={14} /> Record Payment</button>
               ) : (
                  <button onClick={() => handlePreview(bill)} className="flex-1 bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"><Receipt size={14} /> View Bill</button>
               )}
               <button onClick={() => handlePreview(bill)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Eye size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-xl shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><Settings className="text-indigo-600" /> Billing Settings</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Default Global Footer Note (Static)</label>
                        <textarea 
                            rows={4}
                            className="w-full p-4 border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm leading-relaxed"
                            placeholder="This note will appear on every bill generated by the society."
                            value={tempFooterNote}
                            onChange={(e) => setTempFooterNote(e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-2">Recommended for bank details, office hours, or general payment policy.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-8 border-t mt-8">
                    <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                    <button onClick={handleSaveGlobalSettings} className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-black hover:bg-indigo-700 shadow-lg">Save Global Footer</button>
                </div>
            </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && previewBill && (
        <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center z-[90] p-4 overflow-y-auto backdrop-blur-md">
           {/* Preview Controls */}
           <div className="sticky top-0 w-full max-w-4xl bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-2xl flex flex-wrap justify-between items-center gap-4 z-10">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-bold text-slate-700">Bill Format:</label>
                    <select 
                        className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                        value={previewTemplate}
                        onChange={(e) => setPreviewTemplate(e.target.value as any)}
                    >
                        <option value="TOP_BILL">Standard Top Bill</option>
                        <option value="BILL_WITH_RECEIPT">Bottom Prev. Month Receipt</option>
                        <option value="FOOTER_NOTES">Footer Notes (Detailed)</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => downloadPDF('invoice-render', `Bill_${previewBill.unitNumber}.pdf`)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"><Download size={18} /> Download PDF</button>
                    <button onClick={() => setIsPreviewOpen(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"><X size={18} /> Close</button>
                </div>
           </div>

           <div id="invoice-render" className="bg-white w-[210mm] min-h-[297mm] p-10 shadow-2xl mx-auto flex flex-col text-slate-800 border relative">
                {/* --- MAIN BILL SECTION --- */}
                <div className="flex-1">
                    <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-indigo-700">{activeSociety.name}</h1>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Co-operative Housing Society Ltd.</p>
                            <p className="text-sm text-slate-600 mt-2 max-w-xs">{activeSociety.address}</p>
                            <p className="text-xs text-slate-400 mt-1">Reg No: {activeSociety.registrationNumber}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-black text-slate-900">INVOICE</h2>
                            <div className="mt-4 text-sm space-y-1">
                                <p>Bill No: <span className="font-bold">{previewBill.id}</span></p>
                                <p>Date: <span className="font-bold">{previewBill.generatedDate}</span></p>
                                <p>For: <span className="font-bold">{formatBillingMonth(previewBill.billMonth)}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Member Details</p>
                            <h3 className="text-xl font-bold">{previewBill.residentName}</h3>
                            <p className="text-lg font-semibold text-indigo-600">Unit: {previewBill.unitNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Status</p>
                            <span className={`px-4 py-1 rounded-full text-sm font-black border-2 ${previewBill.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-500' : 'bg-red-50 text-red-700 border-red-500'}`}>
                                {previewBill.status.toUpperCase()}
                            </span>
                            <p className="text-sm mt-4 font-bold text-slate-700">Due Date: <span className="text-red-600">{previewBill.dueDate}</span></p>
                        </div>
                    </div>

                    <table className="w-full mb-8">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-3 text-left rounded-tl-lg">Description</th>
                                <th className="p-3 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {previewBill.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-4">{item.description}</td>
                                    <td className="p-4 text-right font-semibold">₹{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-indigo-50">
                                <td className="p-4 text-right font-black uppercase text-indigo-900">Grand Total</td>
                                <td className="p-4 text-right font-black text-xl text-indigo-900 border-l-2 border-white">₹{previewBill.totalAmount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="grid grid-cols-2 gap-10 mt-12">
                        <div className="text-sm">
                            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">Bank Details</h4>
                            <p className="text-slate-600 whitespace-pre-line leading-relaxed">{activeSociety.bankDetails}</p>
                        </div>
                        <div className="text-center flex flex-col justify-end">
                            <div className="h-16 w-40 border-b border-slate-300 mx-auto"></div>
                            <p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-widest">Authorized Signatory</p>
                        </div>
                    </div>
                </div>

                {/* --- OPTIONAL: FOOTER NOTES --- */}
                <div className={`mt-10 border-t-2 border-dashed border-slate-200 pt-6 ${previewTemplate === 'FOOTER_NOTES' ? 'bg-slate-50 p-6 rounded-xl border-solid border-2 border-indigo-100' : ''}`}>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Society Notes & Policy</h4>
                    
                    {/* Default Society Note */}
                    <p className="text-xs text-slate-600 leading-relaxed italic whitespace-pre-wrap">{activeSociety.footerNote || 'Thank you for your timely payment.'}</p>
                    
                    {/* Custom Per-Bill Notes */}
                    {previewBill.customNotes && previewBill.customNotes.length > 0 && (
                        <div className="mt-4 space-y-1">
                            {previewBill.customNotes.map((note, idx) => (
                                <div key={idx} className="flex gap-2 text-xs font-bold text-indigo-700">
                                    <span>•</span>
                                    <span>{note}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {previewTemplate === 'FOOTER_NOTES' && (
                        <div className="mt-6 grid grid-cols-2 gap-4 text-[9px] text-slate-500 uppercase font-black tracking-tight border-t pt-4">
                            <p>* Interest of 21% p.a. charged on delays beyond due date.</p>
                            <p>* Non-occupancy charges apply as per MCS Act bye-laws.</p>
                            <p>* Illegal parking inside premises will be fined ₹500/day.</p>
                            <p>* Garbage segregation (Wet/Dry) is mandatory for all units.</p>
                        </div>
                    )}
                </div>

                {/* --- OPTIONAL: BOTTOM RECEIPT --- */}
                {previewTemplate === 'BILL_WITH_RECEIPT' && (
                    <div className="mt-auto pt-10 border-t-4 border-double border-slate-300">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Receipt className="text-green-600" size={24} />
                                <h3 className="text-lg font-black text-green-700 uppercase tracking-tighter">Previous Month Payment Acknowledgment</h3>
                            </div>
                            <p className="text-xs font-bold bg-slate-100 px-3 py-1 rounded">OFFICE COPY / ATTACHED RECEIPT</p>
                        </div>
                        
                        {lastReceipt ? (
                            <div className="bg-green-50/50 p-6 border-2 border-green-100 rounded-2xl">
                                <div className="grid grid-cols-3 gap-6 text-sm mb-6">
                                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">Receipt No</p><p className="font-bold">RCP-{lastReceipt.id}</p></div>
                                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">Payment Date</p><p className="font-bold">{lastReceipt.paymentDetails?.date}</p></div>
                                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">Mode</p><p className="font-bold text-indigo-600">{lastReceipt.paymentDetails?.mode} ({lastReceipt.paymentDetails?.reference})</p></div>
                                </div>
                                <p className="text-lg leading-loose italic text-slate-700">
                                    Received with thanks from <span className="font-black border-b border-dotted border-slate-400 px-2">{lastReceipt.residentName}</span>, 
                                    Unit <span className="font-black border-b border-dotted border-slate-400 px-2">{lastReceipt.unitNumber}</span>, 
                                    a sum of <span className="font-black border-b border-dotted border-slate-400 px-2">₹ {lastReceipt.totalAmount.toLocaleString()} /-</span> 
                                    towards maintenance dues for {lastReceipt.billMonth ? formatBillingMonth(lastReceipt.billMonth) : 'Previous Period'}.
                                </p>
                                <div className="mt-6 text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Hon. Treasurer / Secretary</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 italic bg-slate-50">
                                <AlertCircle size={32} className="mb-2 opacity-20" />
                                <p>No previous paid record found for this member to generate automated receipt.</p>
                            </div>
                        )}
                    </div>
                )}
           </div>
        </div>
      )}

      {/* --- GENERATE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Plus className="text-indigo-600" /> New Bill Generation</h2>
            <form onSubmit={handleSingleGenerate} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Resident Member *</label>
                    <select className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all" required value={selectedResidentId} onChange={e => handleResidentChange(e.target.value)}>
                        <option value="">-- Choose Member --</option>
                        {residents.map(r => <option key={r.id} value={r.id}>{r.unitNumber} - {r.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Billing Month</label><input type="month" className="w-full p-3 border border-slate-300 rounded-xl" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}/></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Due Date</label><input type="date" required className="w-full p-3 border border-slate-300 rounded-xl" value={dueDate} onChange={e => setDueDate(e.target.value)}/></div>
                </div>
                
                {/* Bill Items Section */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-slate-400 uppercase">Bill Items</h3><button type="button" onClick={addItem} className="text-indigo-600 text-xs font-bold flex items-center gap-1"><Plus size={14} /> Add Head</button></div>
                    {items.map((item, idx) => (
                        <div key={item.id} className="flex gap-2 items-center">
                            <input type="text" placeholder="Description" className="flex-1 p-2 border border-slate-200 rounded-lg text-sm" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)}/>
                            <input type="number" placeholder="Rate" className="w-24 p-2 border border-slate-200 rounded-lg text-sm" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)}/>
                            <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>

                {/* ADDITIONAL FOOTER SECTION */}
                <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2"><MessageSquarePlus size={14} /> Additional Footer Notes</h3>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border border-slate-200 rounded-lg text-sm" 
                            placeholder="e.g. Please update your nomination form."
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomNote())}
                        />
                        <button type="button" onClick={handleAddCustomNote} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-700">Add</button>
                    </div>
                    {customBillNotes.length > 0 && (
                        <div className="space-y-2 mt-2">
                            {customBillNotes.map((note, i) => (
                                <div key={i} className="bg-white px-3 py-1.5 rounded-lg border border-indigo-100 text-xs text-indigo-700 flex justify-between items-center group">
                                    <span className="flex-1 truncate mr-2">{note}</span>
                                    <button type="button" onClick={() => removeCustomNote(i)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                    <span className="text-slate-500 font-bold">Total Bill: <span className="text-xl text-slate-900 ml-2">₹{totalAmount.toLocaleString()}</span></span>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-black hover:bg-indigo-700 shadow-lg transition-all">Generate & Save</button>
                    </div>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {isPaymentModalOpen && selectedBillForPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-green-700"><CreditCard /> Settle Dues</h2>
            <p className="text-sm text-slate-500 mb-6">Confirm payment for <span className="font-black text-slate-800">{selectedBillForPayment.unitNumber} - {selectedBillForPayment.residentName}</span></p>
            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateBill({...selectedBillForPayment, status: PaymentStatus.PAID, paymentDetails: paymentForm});
              setIsPaymentModalOpen(false);
            }} className="space-y-4">
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Mode</label><select className="w-full p-3 border border-slate-300 rounded-xl" value={paymentForm.mode} onChange={e => setPaymentForm({...paymentForm, mode: e.target.value as any})}><option value="UPI">UPI</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="Bank Transfer">Bank Transfer</option></select></div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Reference No</label><input type="text" required className="w-full p-3 border border-slate-300 rounded-xl" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})}/></div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2 bg-green-600 text-white rounded-xl font-black shadow-lg">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
