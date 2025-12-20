
import React, { useState, useRef, useMemo } from 'react';
import { Bill, PaymentStatus, Resident, BillItem, Society, BillLayout, PaymentDetails } from '../types';
import { FileText, Plus, Trash2, Calculator, DollarSign, AlertCircle, Upload, Users, Download, Clock, Settings, FileDown, Eye, Check, CreditCard, Receipt, CalendarRange, QrCode, ExternalLink, Image as ImageIcon, Save, Scissors, LayoutTemplate, X } from 'lucide-react';
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
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  
  const [generationMode, setGenerationMode] = useState<'SINGLE' | 'BULK_RULES' | 'BULK_CSV'>('SINGLE');

  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [items, setItems] = useState<BillItem[]>([
    { id: '1', description: 'Maintenance Charges', type: 'Fixed', rate: 0, amount: 0 }
  ]);
  const [interest, setInterest] = useState<number>(0);
  const [billingFrequency, setBillingFrequency] = useState<'MONTHLY' | 'BI_MONTHLY' | 'QUARTERLY'>('MONTHLY');
  
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentDetails>({
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      reference: '',
      remarks: ''
  });

  const csvInputRef = useRef<HTMLInputElement>(null);

  const defaultLayout: BillLayout = {
      title: 'MAINTENANCE BILL',
      showSocietyAddress: true,
      showBankDetails: true,
      showFooterNote: true,
      colorTheme: '#4f46e5',
      showLogoPlaceholder: true,
      logo: '',
      template: 'MODERN',
      columns: { description: true, type: true, rate: true, amount: true }
  };

  const [settings, setSettings] = useState<BillLayout>(activeSociety.billLayout || defaultLayout);
  const [previewTemplate, setPreviewTemplate] = useState<'MODERN' | 'CLASSIC' | 'MINIMAL' | 'SPLIT_RECEIPT'>(settings.template || 'MODERN');

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.status === filter);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0) + interest;

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return 'bg-green-100 text-green-700 border-green-200';
      case PaymentStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case PaymentStatus.OVERDUE: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getMultiplier = (freq: string = billingFrequency) => {
    if (freq === 'BI_MONTHLY') return 2;
    if (freq === 'QUARTERLY') return 3;
    return 1;
  };

  const recalculateItems = (residentId: string, currentItems: BillItem[], freq: string = billingFrequency) => {
    const resident = residents.find(r => r.id === residentId);
    const sqFt = resident ? resident.sqFt : 0;
    const multiplier = getMultiplier(freq);

    const updatedItems = currentItems.map(item => {
      let amount = 0;
      if (item.type === 'SqFt') {
        amount = item.rate * sqFt * multiplier;
      } else {
        amount = item.rate * multiplier;
      }
      return { ...item, amount };
    });
    setItems(updatedItems);
  };

  const handleResidentChange = (residentId: string) => {
    setSelectedResidentId(residentId);
    recalculateItems(residentId, items, billingFrequency);
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    const multiplier = getMultiplier();

    if (field === 'rate' || field === 'type') {
       const resident = residents.find(r => r.id === selectedResidentId);
       const sqFt = resident ? resident.sqFt : 0;
       if (item.type === 'SqFt') {
         item.amount = (resident ? item.rate * sqFt : 0) * multiplier;
       } else {
         item.amount = Number(item.rate) * multiplier;
       }
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', type: 'Fixed', rate: 0, amount: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSaveSettings = () => {
      onUpdateSociety({ ...activeSociety, billLayout: settings });
      setIsSettingsOpen(false);
  };

  const handleOpenGenerateModal = () => {
      if (activeSociety.billingHeads && activeSociety.billingHeads.length > 0) {
          setItems(activeSociety.billingHeads.map((h, i) => ({...h, id: `def-${Date.now()}-${i}`, amount: 0})));
      } else {
          setItems([{ id: Date.now().toString(), description: 'Maintenance Charges', type: 'Fixed', rate: 0, amount: 0 }]);
      }
      setGenerationMode('SINGLE');
      setIsModalOpen(true);
  };

  const handleSingleGenerate = () => {
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
        billMonth: billingMonth
      });
      closeModal();
    }
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setItems([{ id: Date.now().toString(), description: 'Maintenance Charges', type: 'Fixed', rate: 0, amount: 0 }]);
      setSelectedResidentId('');
      setInterest(0);
      setDueDate('');
      setBillDate(new Date().toISOString().split('T')[0]);
      setBillingMonth(new Date().toISOString().slice(0, 7));
      setBillingFrequency('MONTHLY');
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (generationMode === 'SINGLE') handleSingleGenerate();
  };

  const handlePaymentClick = (bill: Bill) => {
      setSelectedBillForPayment(bill);
      setPaymentForm({ date: new Date().toISOString().split('T')[0], mode: 'UPI', reference: '', remarks: '' });
      // Fixed typo: Corrected setIsPaymentModal to setIsPaymentModalOpen
      setIsPaymentModalOpen(true);
  };

  const handlePreview = (bill: Bill) => {
      setPreviewBill(bill);
      setPreviewTemplate(activeSociety.billLayout?.template || 'MODERN');
      setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={handleOpenGenerateModal}
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
        <button 
          onClick={handleOpenGenerateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Generate Bill
        </button>
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
                 <div key={i} className="flex justify-between">
                   <span className="text-slate-500">{item.description}</span>
                   <span className="text-slate-800 font-medium">₹{item.amount.toLocaleString()}</span>
                 </div>
               ))}
               {bill.interest > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Late Interest</span>
                    <span>₹{bill.interest.toLocaleString()}</span>
                  </div>
               )}
            </div>
            
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Due Date</p>
                <p className="text-sm font-semibold text-slate-700">{bill.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Amount</p>
                <p className="text-lg font-bold text-slate-900">₹{bill.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
               {bill.status !== PaymentStatus.PAID ? (
                  <button 
                    onClick={() => handlePaymentClick(bill)}
                    className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    <CreditCard size={14} /> Record Payment
                  </button>
               ) : (
                  <button 
                    onClick={() => handlePreview(bill)}
                    className="flex-1 bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
                  >
                    <Receipt size={14} /> View Receipt
                  </button>
               )}
               <button 
                onClick={() => handlePreview(bill)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                title="Preview Bill"
               >
                 <Eye size={18} />
               </button>
            </div>
          </div>
        ))}
        {filteredBills.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">No bills found for the selected filter.</p>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="text-indigo-600" /> Generate Maintenance Bill</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Select Resident *</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                  value={selectedResidentId}
                  onChange={e => handleResidentChange(e.target.value)}
                >
                  <option value="">-- Choose Resident --</option>
                  {residents.map(r => <option key={r.id} value={r.id}>{r.unitNumber} - {r.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Bill Date *</label>
                  <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={billDate} onChange={e => setBillDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Due Date *</label>
                  <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Bill Components</h3>
                  <button type="button" onClick={addItem} className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Row
                  </button>
                </div>
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="col-span-5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Description</label>
                      <input type="text" placeholder="e.g. Water Charges" className="w-full p-1.5 text-sm border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Type</label>
                      <select className="w-full p-1.5 text-xs border-b border-slate-200 bg-transparent focus:border-indigo-500 outline-none" value={item.type} onChange={e => handleItemChange(index, 'type', e.target.value)}>
                        <option value="Fixed">Fixed</option>
                        <option value="SqFt">Per SqFt</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Rate (₹)</label>
                      <input type="number" placeholder="0.00" className="w-full p-1.5 text-sm border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent" value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value)} />
                    </div>
                    <div className="col-span-1 text-right">
                      <button type="button" onClick={() => removeItem(index)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="text-slate-500 font-bold text-sm">
                   Grand Total: <span className="text-slate-900 text-lg ml-2">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={closeModal} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all">Generate & Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedBillForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><CreditCard className="text-green-600" /> Record Payment</h2>
            <p className="text-sm text-slate-500 mb-6 border-b border-slate-100 pb-2">
                Settling dues for <span className="font-bold text-slate-800">{selectedBillForPayment.unitNumber} - {selectedBillForPayment.residentName}</span>
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateBill({...selectedBillForPayment, status: PaymentStatus.PAID, paymentDetails: paymentForm});
              setIsPaymentModalOpen(false);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Payment Mode *</label>
                <select className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={paymentForm.mode} onChange={e => setPaymentForm({...paymentForm, mode: e.target.value as any})}>
                  <option value="UPI">UPI / Digital Transfer</option>
                  <option value="Cash">Cash Payment</option>
                  <option value="Cheque">Cheque Deposit</option>
                  <option value="Bank Transfer">NEFT / RTGS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reference No / Txn ID *</label>
                <input 
                    type="text" 
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    placeholder="e.g. UPI-123456 or Cheque No." 
                    value={paymentForm.reference} 
                    onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Remarks</label>
                <textarea 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    rows={2}
                    placeholder="Additional notes..."
                    value={paymentForm.remarks} 
                    onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg transition-all">Confirm & Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
