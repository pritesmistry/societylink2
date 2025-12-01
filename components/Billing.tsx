import React, { useState, useRef } from 'react';
import { Bill, PaymentStatus, Resident, BillItem, Society, BillLayout, PaymentDetails } from '../types';
import { FileText, Plus, Trash2, Calculator, DollarSign, AlertCircle, Upload, Users, Download, Clock, Settings, FileDown, Eye, Check, CreditCard, Receipt } from 'lucide-react';

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
}

const Billing: React.FC<BillingProps> = ({ bills, residents, societyId, activeSociety, onGenerateBill, onBulkAddBills, onUpdateSociety, onUpdateBill }) => {
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
      columns: { description: true, type: true, rate: true, amount: true }
  };

  const [settings, setSettings] = useState<BillLayout>(activeSociety.billLayout || defaultLayout);

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.status === filter);

  // Calculate Total for Single Mode
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

  const handleSingleGenerate = () => {
    const resident = residents.find(r => r.id === selectedResidentId);
    
    if (resident && dueDate && totalAmount > 0) {
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
        generatedDate: new Date().toISOString().split('T')[0]
      });
      closeModal();
    }
  };

  const handleBulkRulesGenerate = () => {
    if (!dueDate) {
        alert("Please select a due date");
        return;
    }

    const multiplier = getMultiplier();

    const newBills: Bill[] = residents.map((resident, idx) => {
        // Calculate items specifically for this resident
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
            generatedDate: new Date().toISOString().split('T')[0]
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

        // Parse Headers: Flat No, Maintenance, Water, ...
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
                        generatedDate: new Date().toISOString().split('T')[0]
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
      setBillingFrequency('MONTHLY');
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (generationMode === 'SINGLE') handleSingleGenerate();
      if (generationMode === 'BULK_RULES') handleBulkRulesGenerate();
  };

  const handlePreview = (bill: Bill) => {
      setPreviewBill(bill);
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
    
    // Temporarily remove shadow and border for clean print
    element.classList.remove('shadow-2xl', 'border');
    
    const opt = {
      margin:       0,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        // Restore styles
        element.classList.add('shadow-2xl', 'border');
    });
  };

  const activeLayout = activeSociety.billLayout || defaultLayout;

  return (
    <div className="space-y-6">
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
            onClick={() => { setGenerationMode('SINGLE'); setIsModalOpen(true); }}
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
                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                            title="Invoice Preview"
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
                              <button 
                                onClick={() => handlePaymentClick(bill)}
                                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                                title="Record Payment"
                              >
                                  <CreditCard size={20} />
                              </button>
                          )}
                      </div>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No bills found matching current filter.</td>
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
                  <div className="flex gap-4 mb-4">
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
                    className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl mx-auto text-slate-800"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                      {/* Header */}
                      <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: activeLayout.colorTheme }}>
                          <div>
                              {activeLayout.showLogoPlaceholder && (
                                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mb-3 text-2xl font-bold text-slate-400">
                                      {activeSociety.name.substring(0, 2).toUpperCase()}
                                  </div>
                              )}
                              <h1 className="text-3xl font-bold text-slate-900">{activeSociety.name}</h1>
                              {activeLayout.showSocietyAddress && (
                                  <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap max-w-sm">{activeSociety.address}</p>
                              )}
                              {activeSociety.registrationNumber && (
                                   <p className="text-xs text-slate-400 mt-1">Reg No: {activeSociety.registrationNumber}</p>
                              )}
                          </div>
                          <div className="text-right">
                              <h2 className="text-4xl font-black tracking-tight" style={{ color: activeLayout.colorTheme }}>{activeLayout.title}</h2>
                              <div className="mt-4 space-y-1">
                                  <p className="text-sm text-slate-500">Invoice # <span className="font-bold text-slate-800">{previewBill.id}</span></p>
                                  <p className="text-sm text-slate-500">Date: <span className="font-bold text-slate-800">{previewBill.generatedDate}</span></p>
                                  <p className="text-sm text-slate-500">Due Date: <span className="font-bold text-slate-800">{previewBill.dueDate}</span></p>
                              </div>
                          </div>
                      </div>

                      {/* Bill To */}
                      <div className="mb-8">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Bill To</p>
                          <h3 className="text-xl font-bold text-slate-900">{previewBill.residentName}</h3>
                          <p className="text-slate-600">Unit No: <span className="font-semibold">{previewBill.unitNumber}</span></p>
                      </div>

                      {/* Items Table */}
                      <table className="w-full mb-8">
                          <thead>
                              <tr style={{ backgroundColor: activeLayout.colorTheme }} className="text-white">
                                  {activeLayout.columns.description && <th className="p-3 text-left text-sm font-semibold first:rounded-tl-lg">Description</th>}
                                  {activeLayout.columns.type && <th className="p-3 text-left text-sm font-semibold">Type</th>}
                                  {activeLayout.columns.rate && <th className="p-3 text-right text-sm font-semibold">Rate</th>}
                                  {activeLayout.columns.amount && <th className="p-3 text-right text-sm font-semibold last:rounded-tr-lg">Amount</th>}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {previewBill.items.map((item, idx) => (
                                  <tr key={idx}>
                                      {activeLayout.columns.description && <td className="p-3 text-sm text-slate-700">{item.description}</td>}
                                      {activeLayout.columns.type && (
                                        <td className="p-3 text-sm text-slate-500">
                                            {item.type === 'SqFt' ? 'Per Sq. Ft.' : 'Fixed'}
                                        </td>
                                      )}
                                      {activeLayout.columns.rate && <td className="p-3 text-sm text-right text-slate-700">₹{item.rate}</td>}
                                      {activeLayout.columns.amount && <td className="p-3 text-sm text-right font-semibold text-slate-900">₹{item.amount.toFixed(2)}</td>}
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      {/* Totals */}
                      <div className="flex justify-end mb-12">
                          <div className="w-1/2 space-y-3">
                               <div className="flex justify-between text-sm text-slate-600">
                                   <span>Subtotal</span>
                                   <span>₹{(previewBill.totalAmount - previewBill.interest).toFixed(2)}</span>
                               </div>
                               {previewBill.interest > 0 && (
                                   <div className="flex justify-between text-sm text-orange-600">
                                       <span>Late Fee / Interest</span>
                                       <span>₹{previewBill.interest.toFixed(2)}</span>
                                   </div>
                               )}
                               <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-200">
                                   <span>Total Due</span>
                                   <span>₹{previewBill.totalAmount.toFixed(2)}</span>
                               </div>
                          </div>
                      </div>
                      
                       {/* Footer Info */}
                      <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8">
                          {activeLayout.showBankDetails && (
                              <div>
                                  <h4 className="font-bold text-sm text-slate-900 mb-2">Bank Details</h4>
                                  <p className="text-sm text-slate-500 whitespace-pre-line">{activeSociety.bankDetails || 'N/A'}</p>
                              </div>
                          )}
                          <div className="text-right flex flex-col justify-end">
                               {activeLayout.showFooterNote && (
                                   <p className="text-xs text-slate-400 italic mb-8">{activeSociety.footerNote}</p>
                               )}
                               <div className="h-16 border-b border-slate-300 w-48 ml-auto mb-2"></div>
                               <p className="text-sm font-semibold text-slate-700">Authorized Signatory</p>
                          </div>
                      </div>
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
                          <label className="block text-sm font-bold text-slate-900">Visibility</label>
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
                              Show Logo Placeholder
                          </label>
                      </div>

                      <div className="space-y-3">
                          <label className="block text-sm font-bold text-slate-900">Table Columns</label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.columns.type} 
                                onChange={e => setSettings({...settings, columns: { ...settings.columns, type: e.target.checked }})}
                              />
                              Show Charge Type (Fixed/SqFt)
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.columns.rate} 
                                onChange={e => setSettings({...settings, columns: { ...settings.columns, rate: e.target.checked }})}
                              />
                              Show Rate Column
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


      {/* --- GENERATE BILL MODAL (Existing) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-xl p-8 w-full max-w-4xl shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-indigo-600" />
                    Generate Bills
                </h2>
                {generationMode === 'SINGLE' && (
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Total Amount</p>
                        <p className="text-3xl font-bold text-indigo-600">₹{totalAmount.toFixed(2)}</p>
                    </div>
                )}
            </div>
            
            {/* Generation Mode Tabs */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit h-fit">
                    <button 
                        onClick={() => setGenerationMode('SINGLE')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${generationMode === 'SINGLE' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200' : 'text-slate-500'}`}
                    >
                        Single Bill
                    </button>
                    <button 
                        onClick={() => setGenerationMode('BULK_RULES')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${generationMode === 'BULK_RULES' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200' : 'text-slate-500'}`}
                    >
                        Bulk (Rules)
                    </button>
                    <button 
                        onClick={() => setGenerationMode('BULK_CSV')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${generationMode === 'BULK_CSV' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200' : 'text-slate-500'}`}
                    >
                        Bulk (CSV Upload)
                    </button>
                </div>

                {(generationMode === 'SINGLE' || generationMode === 'BULK_RULES') && (
                     <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                         <Clock size={16} className="text-indigo-600" />
                         <label className="text-sm font-bold text-indigo-900">Frequency:</label>
                         <select 
                            className="bg-white border border-indigo-200 text-indigo-900 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            value={billingFrequency}
                            onChange={(e) => handleFrequencyChange(e.target.value as any)}
                         >
                             <option value="MONTHLY">Monthly</option>
                             <option value="BI_MONTHLY">Bi-Monthly (x2)</option>
                             <option value="QUARTERLY">Quarterly (x3)</option>
                         </select>
                     </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Single Mode: Resident Selection */}
              {generationMode === 'SINGLE' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-2">Select Member</label>
                      <select 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        required
                        value={selectedResidentId}
                        onChange={e => handleResidentChange(e.target.value)}
                      >
                        <option value="">-- Choose Unit / Member --</option>
                        {residents.map(r => (
                          <option key={r.id} value={r.id}>{r.unitNumber} - {r.name} ({r.sqFt} Sq. Ft.)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-2">Due Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
              )}

              {/* Bulk Rules: Date Selection only */}
              {generationMode === 'BULK_RULES' && (
                  <div>
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-4 flex items-start gap-3">
                          <Users className="text-indigo-600 mt-1" size={20} />
                          <div>
                              <h4 className="font-bold text-indigo-900">Generate for All Members</h4>
                              <p className="text-sm text-indigo-700">This will generate {residents.length} bills. Amounts set to "Per Sq. Ft." will be calculated automatically. All Monthly rates below will be multiplied by <strong>{getMultiplier()}</strong> for {billingFrequency.toLowerCase()} billing.</p>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-900 mb-2">Due Date for All Bills</label>
                          <input 
                            type="date" 
                            required
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                          />
                        </div>
                  </div>
              )}

              {/* CSV Mode */}
              {generationMode === 'BULK_CSV' && (
                  <div className="space-y-6">
                       <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-4 flex items-start gap-3">
                          <Upload className="text-blue-600 mt-1" size={20} />
                          <div>
                              <h4 className="font-bold text-blue-900">Upload Billing Data</h4>
                              <p className="text-sm text-blue-800">Upload a CSV where the first column is "Flat No" and subsequent columns are charge heads (e.g., Maintenance, Water). Values should be fixed amounts.</p>
                          </div>
                      </div>
                      
                       <div>
                          <label className="block text-sm font-bold text-slate-900 mb-2">Due Date (Default)</label>
                          <input 
                            type="date" 
                            required
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                          />
                        </div>

                      <div className="flex gap-4">
                          <button 
                            type="button" 
                            onClick={() => csvInputRef.current?.click()}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                          >
                              <Upload size={20} /> Upload CSV
                          </button>
                          <button 
                            type="button" 
                            onClick={downloadCSVTemplate}
                            className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-slate-50"
                          >
                              <Download size={20} /> Download Template
                          </button>
                          <input 
                            type="file" 
                            accept=".csv" 
                            ref={csvInputRef} 
                            className="hidden" 
                            onChange={handleCSVUpload}
                          />
                      </div>
                  </div>
              )}

              {/* Billing Heads Table - Show only for Single or Bulk Rules */}
              {(generationMode === 'SINGLE' || generationMode === 'BULK_RULES') && (
                  <>
                      <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-slate-900">Billing Heads (Enter Monthly Rates)</label>
                            <button type="button" onClick={addItem} className="text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1">
                                <Plus size={16} /> Add Head
                            </button>
                          </div>
                          
                          <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-sm">
                              <table className="w-full text-left">
                                  <thead className="bg-slate-100 border-b border-slate-300 text-xs uppercase text-slate-700 font-bold">
                                      <tr>
                                          <th className="p-3 w-1/3">Description</th>
                                          <th className="p-3 w-1/4">Type</th>
                                          <th className="p-3 w-1/4">Monthly Rate / Amount</th>
                                          {generationMode === 'SINGLE' && <th className="p-3 w-1/6 text-right">Total ({billingFrequency})</th>}
                                          <th className="p-3 w-10"></th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                      {items.map((item, index) => (
                                          <tr key={index}>
                                              <td className="p-2">
                                                  <input 
                                                      type="text" 
                                                      placeholder="e.g. Maintenance"
                                                      className="w-full p-2 border border-slate-300 rounded focus:outline-indigo-500 text-sm text-slate-900"
                                                      value={item.description}
                                                      onChange={e => handleItemChange(index, 'description', e.target.value)}
                                                      required
                                                  />
                                              </td>
                                              <td className="p-2">
                                                  <select 
                                                      className="w-full p-2 border border-slate-300 rounded focus:outline-indigo-500 text-sm text-slate-900"
                                                      value={item.type}
                                                      onChange={e => handleItemChange(index, 'type', e.target.value)}
                                                  >
                                                      <option value="Fixed">Fixed Amount</option>
                                                      <option value="SqFt">Per Sq. Ft.</option>
                                                  </select>
                                              </td>
                                              <td className="p-2">
                                                  <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full pl-6 p-2 border border-slate-300 rounded focus:outline-indigo-500 text-sm text-slate-900"
                                                        value={item.rate}
                                                        onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                                                        required
                                                    />
                                                  </div>
                                              </td>
                                              {generationMode === 'SINGLE' && (
                                                  <td className="p-2 text-right font-mono font-bold text-slate-900">
                                                      ₹{item.amount.toFixed(2)}
                                                  </td>
                                              )}
                                              <td className="p-2 text-center">
                                                  {items.length > 1 && (
                                                      <button 
                                                        type="button" 
                                                        onClick={() => removeItem(index)}
                                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                                      >
                                                          <Trash2 size={16} />
                                                      </button>
                                                  )}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      {/* Interest / Penalty */}
                      <div className="flex justify-end">
                          <div className="w-full md:w-1/3 bg-orange-50 p-4 rounded-lg border border-orange-200">
                              <label className="block text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                                  <AlertCircle size={14} />
                                  Late Fee / Interest
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 font-bold">₹</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full pl-8 p-2 border border-orange-300 rounded focus:ring-2 focus:ring-orange-400 outline-none bg-white text-orange-900 font-bold"
                                    value={interest}
                                    onChange={e => setInterest(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <p className="text-xs text-orange-800 mt-1 font-medium">Added once (not multiplied by frequency).</p>
                          </div>
                      </div>
                  </>
              )}

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition-colors border border-slate-300"
                >
                  Cancel
                </button>
                {generationMode !== 'BULK_CSV' && (
                    <button 
                      type="submit"
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                      <FileText size={18} />
                      {generationMode === 'SINGLE' ? 'Generate Bill' : 'Generate All Bills'}
                    </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;