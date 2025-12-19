
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

  const lastReceipt = useMemo(() => {
      if (!previewBill) return null;
      const paidBills = bills.filter(b => 
          b.residentId === previewBill.residentId && 
          b.status === PaymentStatus.PAID && 
          b.id !== previewBill.id &&
          b.paymentDetails
      );
      return paidBills.sort((a, b) => new Date(b.paymentDetails!.date).getTime() - new Date(a.paymentDetails!.date).getTime())[0];
  }, [previewBill, bills]);

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

  const handleFrequencyChange = (newFreq: 'MONTHLY' | 'BI_MONTHLY' | 'QUARTERLY') => {
    setBillingFrequency(newFreq);
    if (generationMode === 'SINGLE') {
         recalculateItems(selectedResidentId, items, newFreq);
    }
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSettings({...settings, logo: reader.result as string});
          reader.readAsDataURL(file);
      }
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

  const handlePreview = (bill: Bill) => {
      setPreviewBill(bill);
      setPreviewTemplate(activeSociety.billLayout?.template || 'MODERN');
      setIsPreviewOpen(true);
  };

  const handleReceipt = (bill: Bill) => {
      setPreviewBill(bill);
      setIsReceiptOpen(true);
  };

  const handlePaymentClick = (bill: Bill) => {
      setSelectedBillForPayment(bill);
      setPaymentForm({ date: new Date().toISOString().split('T')[0], mode: 'UPI', reference: '', remarks: '' });
      setIsPaymentModalOpen(true);
  };

  const submitPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedBillForPayment) {
          onUpdateBill({ ...selectedBillForPayment, status: PaymentStatus.PAID, paymentDetails: paymentForm });
          setIsPaymentModalOpen(false);
          setSelectedBillForPayment(null);
      }
  };

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.classList.remove('shadow-2xl', 'border');
    const opt = { margin: 0, filename: filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save().then(() => element.classList.add('shadow-2xl', 'border'));
  };

  const activeLayout = activeSociety.billLayout || defaultLayout;
  const formatBillingMonth = (monthStr?: string) => {
    if (!monthStr) return '';
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <StandardToolbar 
        onNew={handleOpenGenerateModal}
        onSave={handleOpenGenerateModal}
        onModify={() => setIsSettingsOpen(true)}
        balances={balances}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {['All', PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.OVERDUE].map(s => (
            <button key={s} onClick={() => setFilter(s as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{s}</button>
          ))}
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm"><Settings size={18} /> Settings</button>
            <button onClick={handleOpenGenerateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"><Plus size={18} /> Generate New Bill</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600 text-sm">Bill ID</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Unit / Member</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Amount</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">For Month</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Due Date</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-500 font-mono">{bill.id}</td>
                  <td className="p-4"><div className="font-medium text-slate-800">{bill.unitNumber}</div><div className="text-xs text-slate-500">{bill.residentName}</div></td>
                  <td className="p-4 font-bold text-slate-800 text-lg">₹{bill.totalAmount.toFixed(2)}</td>
                  <td className="p-4 text-sm text-slate-600">{bill.billMonth ? formatBillingMonth(bill.billMonth) : bill.generatedDate}</td>
                  <td className="p-4 text-sm text-slate-600">{bill.dueDate}</td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bill.status)}`}>{bill.status}</span></td>
                  <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                          <button onClick={() => handlePreview(bill)} className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 p-2 rounded-full" title="Preview"><Eye size={20} /></button>
                          <button onClick={() => handlePreview(bill)} className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-full" title="Download"><FileDown size={20} /></button>
                          {bill.status === PaymentStatus.PAID ? (<button onClick={() => handleReceipt(bill)} className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-full"><Receipt size={20} /></button>) : (<><button onClick={() => handlePaymentClick(bill)} className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-full"><CreditCard size={20} /></button></>)}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isPreviewOpen && previewBill && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-4xl flex flex-col items-center">
                  <div className="flex gap-4 mb-4 items-center">
                      <select className="bg-white text-slate-800 px-4 py-2 rounded-lg font-medium shadow-lg outline-none" value={previewTemplate} onChange={(e) => setPreviewTemplate(e.target.value as any)}>
                          <option value="MODERN">Modern (Color)</option>
                          <option value="CLASSIC">Classic (Formal)</option>
                          <option value="MINIMAL">Minimal (Eco)</option>
                          <option value="SPLIT_RECEIPT">Bill + Prev. Receipt</option>
                      </select>
                      <button onClick={() => downloadPDF('invoice-preview', `Invoice_${previewBill?.id}.pdf`)} className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-50 flex items-center gap-2"><Download size={20} /> Download PDF</button>
                      <button onClick={() => setIsPreviewOpen(false)} className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-900 flex items-center gap-2" title="Close Preview"><X size={18} /> Cancel</button>
                  </div>
                  <div id="invoice-preview" className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl mx-auto text-slate-800 relative flex flex-col">
                      <div className="flex justify-between items-start mb-6 border-b-2 pb-6" style={{ borderColor: activeLayout.colorTheme }}>
                          <div>
                              {activeLayout.logo ? <img src={activeLayout.logo} className="h-20 w-auto mb-3" /> : activeLayout.showLogoPlaceholder && <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center mb-3 text-2xl font-bold">{activeSociety.name.substring(0,2).toUpperCase()}</div>}
                              <h1 className="text-2xl font-bold">{activeSociety.name}</h1>
                              {activeLayout.showSocietyAddress && <p className="text-sm text-slate-500 mt-1 max-w-sm">{activeSociety.address}</p>}
                          </div>
                          <div className="text-right">
                              <h2 className="text-3xl font-black" style={{ color: activeLayout.colorTheme }}>{activeLayout.title}</h2>
                              <p className="mt-4 text-sm">Invoice # <span className="font-bold">{previewBill.id}</span></p>
                              <p className="text-sm">Date: <span className="font-bold">{previewBill.generatedDate}</span></p>
                          </div>
                      </div>
                      <div className="mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Bill To</p>
                        <h3 className="text-xl font-bold">{previewBill.residentName}</h3>
                        <p>Unit: <span className="font-semibold">{previewBill.unitNumber}</span></p>
                      </div>
                      <table className="w-full mb-8">
                          <thead>
                              <tr style={{ backgroundColor: activeLayout.colorTheme, color: 'white' }}>
                                  <th className="p-3 text-left">Description</th>
                                  <th className="p-3 text-right">Amount</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {previewBill.items.map((item, idx) => (
                                  <tr key={idx}><td className="p-3">{item.description}</td><td className="p-3 text-right">₹{item.amount.toFixed(2)}</td></tr>
                              ))}
                          </tbody>
                      </table>
                      <div className="flex justify-end mb-8"><div className="w-1/2 flex justify-between text-xl font-bold border-t pt-2"><span>Total Due</span><span>₹{previewBill.totalAmount.toFixed(2)}</span></div></div>
                      <div className="mt-auto border-t pt-6 grid grid-cols-2 gap-8">
                          <div><h4 className="font-bold text-sm mb-2">Bank Details</h4><p className="text-sm text-slate-500 whitespace-pre-line">{activeSociety.bankDetails}</p></div>
                          <div className="text-right flex flex-col justify-end"><p className="text-sm font-semibold">Authorized Signatory</p></div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-xl p-8 w-full max-w-4xl shadow-2xl my-auto">
            <h2 className="text-2xl font-bold mb-6">Generate Bill</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <select className="w-full p-3 border rounded-lg" required value={selectedResidentId} onChange={e => handleResidentChange(e.target.value)}>
                <option value="">-- Select Member --</option>
                {residents.map(r => <option key={r.id} value={r.id}>{r.unitNumber} - {r.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-6">
                  <input type="month" required className="p-3 border rounded-lg" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}/>
                  <input type="date" required className="p-3 border rounded-lg" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
              </div>
              <div className="flex justify-end gap-4"><button type="button" onClick={closeModal} className="px-6 py-3 border rounded-lg">Cancel</button><button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-lg">Generate</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
