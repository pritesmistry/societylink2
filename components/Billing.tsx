
import React, { useState, useRef, useMemo } from 'react';
import { Bill, PaymentStatus, Resident, BillItem, Society, BillLayout, PaymentDetails } from '../types';
import { FileText, Plus, Trash2, Calculator, DollarSign, AlertCircle, Upload, Users, Download, Clock, Settings, FileDown, Eye, Check, CreditCard, Receipt, CalendarRange, QrCode, ExternalLink, Image as ImageIcon, Save, Scissors, LayoutTemplate } from 'lucide-react';
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

  // Form State
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [items, setItems] = useState<BillItem[]>([
    { id: '1', description: 'Maintenance Charges', type: 'Fixed', rate: 0, amount: 0 }
  ]);
  const [interest, setInterest] = useState<number>(0);
  const [billingFrequency, setBillingFrequency] = useState<'MONTHLY' | 'BI_MONTHLY' | 'QUARTERLY'>('MONTHLY');
  
  // Payment Form State
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentDetails>({
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      reference: '',
      remarks: ''
  });

  const csvInputRef = useRef<HTMLInputElement>(null);

  // Settings State (Initialized from Society)
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

  // Local state for preview customization
  const [previewTemplate, setPreviewTemplate] = useState<'MODERN' | 'CLASSIC' | 'MINIMAL' | 'SPLIT_RECEIPT'>(settings.template || 'MODERN');

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.status === filter);

  // Calculate Total for Single Mode
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0) + interest;

  // Derive Previous Paid Receipt for Preview
  const lastReceipt = useMemo(() => {
      if (!previewBill) return null;
      // Find bills for same resident, that are PAID, excluding current bill
      const paidBills = bills.filter(b => 
          b.residentId === previewBill.residentId && 
          b.status === PaymentStatus.PAID && 
          b.id !== previewBill.id &&
          b.paymentDetails
      );
      // Sort by payment date descending
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
       
       if (field === 'type' && value === 'Fixed') {
           item.amount = Number(item.rate) * multiplier;
       }
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', type: 'Fixed', rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveSettings = () => {
      onUpdateSociety({
          ...activeSociety,
          billLayout: settings
      });
      setIsSettingsOpen(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSettings({...settings, logo: reader.result as string});
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveDefaultRules = () => {
      const rulesToSave = items.map(item => ({
          ...item,
          amount: 0
      }));
      
      onUpdateSociety({
          ...activeSociety,
          billingHeads: rulesToSave
      });
      alert("Billing rules saved as default for this society!");
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

  const handleBulkRulesGenerate = () => {
    if (!dueDate || !billDate) {
        alert("Please select bill date and due date");
        return;
    }

    const multiplier = getMultiplier();

    const newBills: Bill[] = residents.map((resident, idx) => {
        const residentItems = items.map(item => {
            let amount = item.rate * multiplier;
            if (item.type === 'SqFt') {
                amount = item.rate * resident.sqFt * multiplier;
            }
            return { ...item, amount };
        });

        const residentTotal = residentItems.reduce((sum, i) => sum + i.amount, 0) + interest;

        return {
            id: `B${Date.now()}-${idx}`,
            societyId,
            residentId: resident.id,
            residentName: resident.name,
            unitNumber: resident.unitNumber,
            items: residentItems,
            interest: interest,
            totalAmount: residentTotal,
            dueDate: dueDate,
            status: PaymentStatus.PENDING,
            generatedDate: billDate,
            billMonth: billingMonth
        };
    });

    onBulkAddBills(newBills);
    alert(`Successfully generated ${billingFrequency.toLowerCase().replace('_', ' ')} bills for ${newBills.length} members.`);
    closeModal();
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) return;

        const lines = content.split(/\r\n|\n/);
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim());
        const flatIndex = headers.findIndex(h => h.toLowerCase().includes('flat') || h.toLowerCase().includes('unit'));
        
        if (flatIndex === -1) {
            alert("CSV must have a 'Flat No' or 'Unit' column.");
            return;
        }

        const chargeIndices = headers.map((h, i) => i).filter(i => i !== flatIndex);
        const generatedBills: Bill[] = [];
        let notFoundCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',').map(p => p.trim());
            const flatNo = parts[flatIndex];
            
            const resident = residents.find(r => r.unitNumber.toLowerCase() === flatNo.toLowerCase());
            
            if (resident) {
                const billItems: BillItem[] = [];
                let total = 0;

                chargeIndices.forEach(idx => {
                    const amount = parseFloat(parts[idx]) || 0;
                    if (amount > 0) {
                        billItems.push({
                            id: `bi-${idx}`,
                            description: headers[idx],
                            type: 'Fixed', 
                            rate: amount,
                            amount: amount
                        });
                        total += amount;
                    }
                });

                if (total > 0) {
                    generatedBills.push({
                        id: `BCSV-${Date.now()}-${i}`,
                        societyId,
                        residentId: resident.id,
                        residentName: resident.name,
                        unitNumber: resident.unitNumber,
                        items: billItems,
                        interest: 0,
                        totalAmount: total,
                        dueDate: dueDate || new Date().toISOString().split('T')[0],
                        status: PaymentStatus.PENDING,
                        generatedDate: billDate || new Date().toISOString().split('T')[0],
                        billMonth: billingMonth
                    });
                }
            } else {
                notFoundCount++;
            }
        }

        if (generatedBills.length > 0) {
            onBulkAddBills(generatedBills);
            let msg = `Generated ${generatedBills.length} bills from CSV.`;
            if (notFoundCount > 0) msg += ` (${notFoundCount} flat numbers not found in system)`;
            alert(msg);
            closeModal();
        } else {
            alert("No valid bills generated. Check CSV format and Flat Numbers.");
        }
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
      const headers = "Flat No,Maintenance Charge,Water Charge,Sinking Fund,Arrears\n";
      const row = "A-101,1500,200,500,0";
      const blob = new Blob([headers + row], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'billing_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
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
      if (generationMode === 'BULK_RULES') handleBulkRulesGenerate();
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
      setPaymentForm({
          date: new Date().toISOString().split('T')[0],
          mode: 'UPI',
          reference: '',
          remarks: ''
      });
      setIsPaymentModalOpen(true);
  };

  const submitPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedBillForPayment) {
          onUpdateBill({
              ...selectedBillForPayment,
              status: PaymentStatus.PAID,
              paymentDetails: paymentForm
          });
          setIsPaymentModalOpen(false);
          setSelectedBillForPayment(null);
      }
  };

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.remove('shadow-2xl', 'border');
    
    const opt = {
      margin:       0,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        element.classList.add('shadow-2xl', 'border');
    });
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
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
            <button 
            onClick={() => setIsSettingsOpen(true)}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm"
            >
            <Settings size={18} />
            Settings
            </button>
            <button 
            onClick={handleOpenGenerateModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
            >
            <Plus size={18} />
            Generate New Bill
            </button>
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
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{bill.unitNumber}</div>
                    <div className="text-xs text-slate-500">{bill.residentName}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-800 text-lg">₹{bill.totalAmount.toFixed(2)}</td>
                  <td className="p-4 text-sm text-slate-600">
                      {bill.billMonth ? formatBillingMonth(bill.billMonth) : bill.generatedDate}
                  </td>
                  <td className="p-4 text-sm text-slate-600">{bill.dueDate}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handlePreview(bill)}
                            className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 p-2 rounded-full transition-colors"
                            title="Preview Bill"
                          >
                              <Eye size={20} />
                          </button>

                          <button 
                            onClick={() => handlePreview(bill)}
                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                            title="Download Invoice"
                          >
                              <FileDown size={20} />
                          </button>
                          
                          {bill.status === PaymentStatus.PAID ? (
                             <button 
                                onClick={() => handleReceipt(bill)}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-full transition-colors"
                                title="View Receipt"
                              >
                                  <Receipt size={20} />
                              </button>
                          ) : (
                              <>
                                <button 
                                    onClick={() => window.open(`https://payment-gateway.example.com/pay?billId=${bill.id}&amount=${bill.totalAmount}`, '_blank')}
                                    className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-2 rounded-full transition-colors"
                                    title="Pay Now (Online)"
                                >
                                    <ExternalLink size={20} />
                                </button>
                                <button 
                                    onClick={() => handlePaymentClick(bill)}
                                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                                    title="Record Payment"
                                >
                                    <CreditCard size={20} />
                                </button>
                              </>
                          )}
                      </div>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No bills found matching current filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {isPaymentModalOpen && selectedBillForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] backdrop-blur-sm">
             <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                 <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                     <CreditCard className="text-indigo-600" />
                     Record Payment
                 </h2>
                 <p className="text-sm text-slate-600 mb-6">
                     Record payment for Bill <strong>{selectedBillForPayment.id}</strong> ({selectedBillForPayment.unitNumber})
                 </p>
                 
                 <form onSubmit={submitPayment} className="space-y-4">
                     <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Date</label>
                         <input 
                            type="date" 
                            required 
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={paymentForm.date}
                            onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Mode</label>
                         <select 
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={paymentForm.mode}
                            onChange={(e) => setPaymentForm({...paymentForm, mode: e.target.value as any})}
                         >
                             <option value="UPI">UPI / GPay / PhonePe</option>
                             <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                             <option value="Cheque">Cheque</option>
                             <option value="Cash">Cash</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1">Reference / Cheque No.</label>
                         <input 
                            type="text" 
                            required 
                            placeholder="e.g. UPI-12345678"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={paymentForm.reference}
                            onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1">Remarks</label>
                         <input 
                            type="text" 
                            placeholder="Optional notes"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={paymentForm.remarks}
                            onChange={(e) => setPaymentForm({...paymentForm, remarks: e.target.value})}
                         />
                     </div>

                     <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                         <button 
                            type="button" 
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                         >
                             Cancel
                         </button>
                         <button 
                            type="submit" 
                            className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-sm"
                         >
                             Confirm Payment
                         </button>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {/* --- RECEIPT PREVIEW MODAL --- */}
      {isReceiptOpen && previewBill && previewBill.paymentDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-2xl flex flex-col items-center">
                  <div className="flex gap-4 mb-4">
                      <button 
                        onClick={() => downloadPDF('receipt-preview', `Receipt_${previewBill.id}.pdf`)}
                        className="bg-white text-green-600 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-50 flex items-center gap-2"
                      >
                          <Download size={20} /> Download Receipt
                      </button>
                      <button 
                        onClick={() => setIsReceiptOpen(false)}
                        className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-900"
                      >
                          Close
                      </button>
                  </div>

                  <div 
                    id="receipt-preview" 
                    className="bg-white w-[210mm] h-[148mm] p-[10mm] shadow-2xl mx-auto text-slate-800 relative border border-slate-200"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                        <div className="border-4 border-double border-slate-200 h-full p-8 flex flex-col justify-between">
                            {/* Header */}
                            <div className="text-center border-b pb-4">
                                <h1 className="text-2xl font-bold text-slate-900">{activeSociety.name}</h1>
                                <p className="text-sm text-slate-500">{activeSociety.address}</p>
                                <h2 className="text-xl font-bold text-green-700 mt-4 uppercase tracking-wider border-2 border-green-700 inline-block px-4 py-1 rounded">Payment Receipt</h2>
                            </div>
                            
                            {/* Details */}
                            <div className="flex justify-between items-start my-6">
                                <div className="space-y-2">
                                    <p className="text-sm">Receipt No: <span className="font-bold">RCP-{previewBill.id}</span></p>
                                    <p className="text-sm">Date: <span className="font-bold">{previewBill.paymentDetails.date}</span></p>
                                </div>
                                <div className="space-y-2 text-right">
                                    <p className="text-sm">Unit No: <span className="font-bold">{previewBill.unitNumber}</span></p>
                                    <p className="text-sm">Bill No: <span className="font-bold">{previewBill.id}</span></p>
                                </div>
                            </div>

                            <div className="space-y-4 text-lg">
                                <p>
                                    Received with thanks from <span className="font-bold border-b border-slate-400 px-2">{previewBill.residentName}</span>
                                </p>
                                <p>
                                    A sum of Rupees <span className="font-bold border-b border-slate-400 px-2">₹ {previewBill.totalAmount.toFixed(2)} /-</span>
                                </p>
                                <p>
                                    By <span className="font-bold border-b border-slate-400 px-2">{previewBill.paymentDetails.mode}</span> 
                                    (Ref: {previewBill.paymentDetails.reference})
                                </p>
                                <p>
                                    Towards <span className="font-bold border-b border-slate-400 px-2">Maintenance Bill #{previewBill.id}</span>
                                </p>
                            </div>

                            <div className="flex justify-between items-end mt-8 pt-8">
                                <div className="text-sm text-slate-500">
                                    * This is a computer generated receipt.
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-32 mb-2"></div>
                                    <p className="font-bold text-slate-800 border-t border-slate-400 pt-1 px-4">Authorized Signatory</p>
                                </div>
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- INVOICE PREVIEW MODAL --- */}
      {isPreviewOpen && previewBill && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-4xl flex flex-col items-center">
                  <div className="flex gap-4 mb-4 items-center">
                      {/* Template Selector in Preview */}
                      <select 
                        className="bg-white text-slate-800 px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-slate-50 border-r-8 border-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={previewTemplate}
                        onChange={(e) => setPreviewTemplate(e.target.value as any)}
                      >
                          <option value="MODERN">Modern (Color)</option>
                          <option value="CLASSIC">Classic (Formal)</option>
                          <option value="MINIMAL">Minimal (Eco)</option>
                          <option value="SPLIT_RECEIPT">Bill + Prev. Receipt</option>
                      </select>

                      <button 
                        onClick={() => downloadPDF('invoice-preview', `Invoice_${previewBill?.id}.pdf`)}
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

                  {/* INVOICE TEMPLATE FOR PDF */}
                  <div 
                    id="invoice-preview" 
                    className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl mx-auto text-slate-800 relative flex flex-col"
                    style={{ fontFamily: previewTemplate === 'CLASSIC' ? 'serif' : 'Inter, sans-serif' }}
                  >
                      {/* --- RENDER BILL CONTENT BASED ON TEMPLATE --- */}
                      
                      {/* HEADER SECTION */}
                      <div className={`flex justify-between items-start mb-6 ${previewTemplate === 'MODERN' ? 'border-b-2 pb-6' : 'border-b pb-4'}`} style={{ borderColor: previewTemplate === 'MODERN' ? activeLayout.colorTheme : '#000' }}>
                          <div>
                              {activeLayout.logo ? (
                                  <img src={activeLayout.logo} alt="Society Logo" className="h-20 w-auto object-contain mb-3" />
                              ) : activeLayout.showLogoPlaceholder && (
                                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 text-2xl font-bold ${previewTemplate === 'MODERN' ? 'bg-slate-100 text-slate-400' : 'border border-slate-800 text-slate-800'}`}>
                                      {activeSociety.name.substring(0, 2).toUpperCase()}
                                  </div>
                              )}
                              <h1 className={`text-2xl font-bold ${previewTemplate === 'MODERN' ? 'text-slate-900' : 'text-black uppercase'}`}>{activeSociety.name}</h1>
                              {activeLayout.showSocietyAddress && (
                                  <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap max-w-sm">{activeSociety.address}</p>
                              )}
                              {activeSociety.registrationNumber && (
                                   <p className="text-xs text-slate-400 mt-1">Reg No: {activeSociety.registrationNumber}</p>
                              )}
                          </div>
                          <div className="text-right">
                              <h2 className={`text-3xl font-black tracking-tight ${previewTemplate === 'MODERN' ? '' : 'uppercase'}`} style={{ color: previewTemplate === 'MODERN' ? activeLayout.colorTheme : '#000' }}>{activeLayout.title}</h2>
                              <div className="mt-4 space-y-1">
                                  <p className="text-sm">Invoice # <span className="font-bold">{previewBill.id}</span></p>
                                  <p className="text-sm">Date: <span className="font-bold">{previewBill.generatedDate}</span></p>
                                  <p className="text-sm">Due Date: <span className="font-bold">{previewBill.dueDate}</span></p>
                              </div>
                          </div>
                      </div>

                      {/* BILL TO SECTION */}
                      <div className={`mb-6 flex justify-between items-end ${previewTemplate === 'CLASSIC' ? 'border p-4' : ''}`}>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Bill To</p>
                            <h3 className="text-xl font-bold">{previewBill.residentName}</h3>
                            <p>Unit No: <span className="font-semibold">{previewBill.unitNumber}</span></p>
                          </div>
                          {previewBill.billMonth && (
                              <div className={`text-right ${previewTemplate === 'MODERN' ? 'bg-slate-50 p-3 rounded-lg border border-slate-100' : ''}`}>
                                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Bill for the month of</p>
                                  <p className="text-lg font-bold flex items-center justify-end gap-2">
                                      {formatBillingMonth(previewBill.billMonth)}
                                  </p>
                              </div>
                          )}
                      </div>

                      {/* TABLE SECTION */}
                      <table className={`w-full mb-8 ${previewTemplate === 'CLASSIC' ? 'border-collapse border border-slate-300' : ''}`}>
                          <thead>
                              <tr style={{ backgroundColor: previewTemplate === 'MODERN' ? activeLayout.colorTheme : '#f3f4f6', color: previewTemplate === 'MODERN' ? 'white' : 'black' }}>
                                  {activeLayout.columns.description && <th className={`p-3 text-left text-sm font-semibold ${previewTemplate === 'CLASSIC' ? 'border border-slate-400' : 'first:rounded-tl-lg'}`}>Description</th>}
                                  {activeLayout.columns.type && <th className={`p-3 text-left text-sm font-semibold ${previewTemplate === 'CLASSIC' ? 'border border-slate-400' : ''}`}>Type</th>}
                                  {activeLayout.columns.rate && <th className={`p-3 text-right text-sm font-semibold ${previewTemplate === 'CLASSIC' ? 'border border-slate-400' : ''}`}>Rate</th>}
                                  {activeLayout.columns.amount && <th className={`p-3 text-right text-sm font-semibold ${previewTemplate === 'CLASSIC' ? 'border border-slate-400' : 'last:rounded-tr-lg'}`}>Amount</th>}
                              </tr>
                          </thead>
                          <tbody className={`${previewTemplate === 'CLASSIC' ? '' : 'divide-y divide-slate-100'}`}>
                              {previewBill.items.map((item, idx) => (
                                  <tr key={idx}>
                                      {activeLayout.columns.description && <td className={`p-3 text-sm ${previewTemplate === 'CLASSIC' ? 'border border-slate-300' : 'text-slate-700'}`}>{item.description}</td>}
                                      {activeLayout.columns.type && (
                                        <td className={`p-3 text-sm ${previewTemplate === 'CLASSIC' ? 'border border-slate-300' : 'text-slate-500'}`}>
                                            {item.type === 'SqFt' ? 'Per Sq. Ft.' : 'Fixed'}
                                        </td>
                                      )}
                                      {activeLayout.columns.rate && <td className={`p-3 text-sm text-right ${previewTemplate === 'CLASSIC' ? 'border border-slate-300' : 'text-slate-700'}`}>₹{item.rate}</td>}
                                      {activeLayout.columns.amount && <td className={`p-3 text-sm text-right font-semibold ${previewTemplate === 'CLASSIC' ? 'border border-slate-300' : 'text-slate-900'}`}>₹{item.amount.toFixed(2)}</td>}
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      {/* TOTALS SECTION */}
                      <div className="flex justify-end mb-8">
                          <div className="w-1/2 space-y-2">
                               <div className="flex justify-between text-sm">
                                   <span>Subtotal</span>
                                   <span>₹{(previewBill.totalAmount - previewBill.interest).toFixed(2)}</span>
                               </div>
                               {previewBill.interest > 0 && (
                                   <div className="flex justify-between text-sm text-orange-600 font-medium">
                                       <span>Late Fee / Interest</span>
                                       <span>₹{previewBill.interest.toFixed(2)}</span>
                                   </div>
                               )}
                               <div className={`flex justify-between text-xl font-bold pt-2 ${previewTemplate === 'CLASSIC' ? 'border-t-2 border-black' : 'border-t border-slate-200'}`}>
                                   <span>Total Due</span>
                                   <span>₹{previewBill.totalAmount.toFixed(2)}</span>
                               </div>
                          </div>
                      </div>
                      
                       {/* FOOTER INFO - BILL PART */}
                      <div className={`grid grid-cols-2 gap-8 border-t border-slate-200 pt-6 ${previewTemplate === 'SPLIT_RECEIPT' ? 'mb-8' : 'mb-auto'}`}>
                          <div className="flex gap-6 items-start">
                              {activeLayout.showBankDetails && (
                                  <div>
                                      <h4 className="font-bold text-sm mb-2">Bank Details</h4>
                                      <p className="text-sm text-slate-500 whitespace-pre-line">{activeSociety.bankDetails || 'N/A'}</p>
                                  </div>
                              )}
                              
                              <div className="flex flex-col items-center gap-1">
                                  <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400">
                                      <div className="text-center">
                                          <QrCode size={32} className="mx-auto mb-1 opacity-50" />
                                          <span className="text-[10px] font-bold block">QR CODE</span>
                                      </div>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-medium">Scan to Pay</span>
                              </div>
                          </div>
                          
                          <div className="text-right flex flex-col justify-end">
                               {activeLayout.showFooterNote && (
                                   <p className="text-xs text-slate-400 italic mb-4">{activeSociety.footerNote}</p>
                               )}
                               <div className="h-12 border-b border-slate-300 w-48 ml-auto mb-1"></div>
                               <p className="text-sm font-semibold">Authorized Signatory</p>
                          </div>
                      </div>

                      {/* --- PREVIOUS RECEIPT FOOTER (SPLIT VIEW) --- */}
                      {(previewTemplate === 'SPLIT_RECEIPT' || settings.template === 'SPLIT_RECEIPT') && (
                          <div className="mt-auto pt-8 border-t-2 border-dashed border-slate-400 relative">
                              <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-white px-2 text-slate-400 flex items-center gap-1 text-xs">
                                  <Scissors size={14} /> Cut Here
                              </div>
                              <h4 className="text-center font-bold text-slate-700 uppercase mb-4 text-sm border-b pb-2">Receipt for Previous Payment</h4>
                              
                              {lastReceipt ? (
                                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                                      <div className="flex justify-between mb-2">
                                          <span><strong>Receipt No:</strong> RCP-{lastReceipt.id}</span>
                                          <span><strong>Date:</strong> {lastReceipt.paymentDetails?.date}</span>
                                      </div>
                                      <div className="flex justify-between mb-2">
                                          <span><strong>Received From:</strong> {lastReceipt.residentName} ({lastReceipt.unitNumber})</span>
                                          <span><strong>Mode:</strong> {lastReceipt.paymentDetails?.mode}</span>
                                      </div>
                                      <div className="flex justify-between items-center border-t border-slate-300 pt-2 mt-2">
                                          <span>Being payment towards Bill #{lastReceipt.id}</span>
                                          <span className="text-lg font-bold">₹ {lastReceipt.totalAmount.toFixed(2)}</span>
                                      </div>
                                      <div className="text-right mt-4">
                                          <p className="text-xs font-bold">For {activeSociety.name}</p>
                                          <p className="text-[10px] text-slate-500">(Computer Generated)</p>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center text-slate-400 italic py-4">
                                      No previous payment receipt found for this member.
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}


      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] backdrop-blur-sm">
              <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl">
                  <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                      <Settings className="text-slate-600" />
                      Invoice Customization
                  </h2>
                  
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                      <div>
                          <label className="block text-sm font-bold text-slate-900 mb-2">Invoice Title</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded text-slate-900"
                            value={settings.title}
                            onChange={(e) => setSettings({...settings, title: e.target.value})}
                          />
                      </div>

                      {/* Template Selector with Visual Grid */}
                      <div>
                          <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                              <LayoutTemplate size={16} /> Bill Style & Format
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                              {[
                                  { id: 'MODERN', label: 'Modern Theme', desc: 'Clean, colorful, full-page design.' },
                                  { id: 'CLASSIC', label: 'Classic Formal', desc: 'Traditional black & white table format.' },
                                  { id: 'MINIMAL', label: 'Compact / Eco', desc: 'High density, saves paper and ink.' },
                                  { id: 'SPLIT_RECEIPT', label: 'Bill + Receipt', desc: 'Top Bill, Bottom Previous Month Receipt.' }
                              ].map((style) => (
                                  <button
                                      key={style.id}
                                      onClick={() => setSettings({ ...settings, template: style.id as any })}
                                      className={`p-3 rounded-lg border-2 text-left transition-all flex flex-col justify-between h-20 ${
                                          settings.template === style.id 
                                          ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                      }`}
                                  >
                                      <span className={`font-bold text-sm ${settings.template === style.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                          {style.label}
                                      </span>
                                      <span className="text-xs text-slate-500 leading-tight">
                                          {style.desc}
                                      </span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Logo Upload */}
                      <div>
                          <label className="block text-sm font-bold text-slate-900 mb-2">Society Logo</label>
                          <div className="flex items-center gap-4">
                              {settings.logo ? (
                                  <img src={settings.logo} alt="Logo Preview" className="h-12 w-12 object-contain border rounded bg-slate-50" />
                              ) : (
                                  <div className="h-12 w-12 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                      <ImageIcon size={20} />
                                  </div>
                              )}
                              <label className="cursor-pointer bg-slate-100 px-4 py-2 rounded text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                                  <span>{settings.logo ? 'Change Logo' : 'Upload Logo'}</span>
                                  <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={handleLogoUpload}
                                  />
                              </label>
                              {settings.logo && (
                                  <button onClick={() => setSettings({...settings, logo: ''})} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                              )}
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-900 mb-2">Color Theme</label>
                          <div className="flex gap-3">
                              {['#4f46e5', '#0891b2', '#059669', '#dc2626', '#111827'].map(color => (
                                  <button 
                                    key={color}
                                    onClick={() => setSettings({...settings, colorTheme: color})}
                                    className={`w-8 h-8 rounded-full border-2 ${settings.colorTheme === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                  />
                              ))}
                          </div>
                      </div>

                      <div className="space-y-3">
                          <label className="block text-sm font-bold text-slate-900">Visibility & Notes</label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.showSocietyAddress} 
                                onChange={e => setSettings({...settings, showSocietyAddress: e.target.checked})}
                              />
                              Show Society Address
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.showBankDetails} 
                                onChange={e => setSettings({...settings, showBankDetails: e.target.checked})}
                              />
                              Show Bank Details
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.showFooterNote} 
                                onChange={e => setSettings({...settings, showFooterNote: e.target.checked})}
                              />
                              Show Footer Note
                          </label>
                           <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.showLogoPlaceholder} 
                                onChange={e => setSettings({...settings, showLogoPlaceholder: e.target.checked})}
                              />
                              Show Logo Placeholder (if no image)
                          </label>
                      </div>

                      <div className="space-y-3">
                          <label className="block text-sm font-bold text-slate-900">Table Columns</label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.columns.description} 
                                onChange={e => setSettings({...settings, columns: { ...settings.columns, description: e.target.checked }})}
                              />
                              Show Description
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.columns.type} 
                                onChange={e => setSettings({...settings, columns: { ...settings.columns, type: e.target.checked }})}
                              />
                              Show Charge Type
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.columns.rate} 
                                onChange={e => setSettings({...settings, columns: { ...settings.columns, rate: e.target.checked }})}
                              />
                              Show Rate Column
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.columns.amount} 
                                onChange={e => setSettings({...settings, columns: { ...settings.columns, amount: e.target.checked }})}
                              />
                              Show Amount
                          </label>
                      </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-slate-100">
                        <button 
                            onClick={() => setIsSettingsOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveSettings}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
                        >
                            <Check size={18} /> Save Changes
                        </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Billing;
