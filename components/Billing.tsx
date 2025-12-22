
import React, { useState, useRef, useMemo } from 'react';
import { Bill, PaymentStatus, Resident, BillItem, Society, BillLayout, PaymentDetails } from '../types';
import { FileText, Plus, Trash2, Calculator, IndianRupee, AlertCircle, Upload, Users, Download, Clock, Settings, FileDown, Eye, Check, CreditCard, Receipt, CalendarRange, QrCode, ExternalLink, Image as ImageIcon, Save, Scissors, LayoutTemplate, X, MessageSquarePlus, Calendar, Layers, User, ShieldCheck, Percent, Zap, Lock, Shield, ArrowRight, Loader2, Smartphone, Landmark, RefreshCcw, Info } from 'lucide-react';
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
  onBulkUpdateBills: (bills: Bill[]) => void;
  balances?: { cash: number; bank: number };
}

const Billing: React.FC<BillingProps> = ({ bills, residents, societyId, activeSociety, onGenerateBill, onBulkAddBills, onUpdateSociety, onUpdateBill, onBulkUpdateBills, balances }) => {
  const [filter, setFilter] = useState<PaymentStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<'TOP_BILL' | 'BILL_WITH_RECEIPT' | 'FOOTER_NOTES'>('TOP_BILL');

  // Generation Modal State
  const [generationMode, setGenerationMode] = useState<'INDIVIDUAL' | 'ALL'>('INDIVIDUAL');
  const [billingFrequency, setBillingFrequency] = useState<'MONTHLY' | 'BI-MONTHLY' | 'QUARTERLY'>('MONTHLY');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); 
  
  // Interest States
  const [applyInterest, setApplyInterest] = useState(false);
  const [interestRate, setInterestRate] = useState(21); // Default 21% p.a.

  // Update Modal State
  const [updateMode, setUpdateMode] = useState<'INDIVIDUAL' | 'ALL'>('ALL');
  const [updateResidentId, setUpdateResidentId] = useState('');

  const [items, setItems] = useState<BillItem[]>([]);
  
  // Custom Notes State for Generation
  const [customBillNotes, setCustomBillNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState('');

  // Settings State
  const [tempFooterNotes, setTempFooterNotes] = useState<string[]>(activeSociety.footerNotes || [activeSociety.footerNote || '']);
  const [tempBillingHeads, setTempBillingHeads] = useState<BillItem[]>(activeSociety.billingHeads || []);
  const [tempUpiId, setTempUpiId] = useState(activeSociety.upiId || '');
  const [tempGstEnabled, setTempGstEnabled] = useState(activeSociety.gstEnabled || false);
  const [tempGstPercentage, setTempGstPercentage] = useState(activeSociety.gstPercentage || 18);

  // Online Payment Flow States
  const [selectedBillForPay, setSelectedBillForPay] = useState<Bill | null>(null);
  const [paymentStep, setPaymentStep] = useState<'METHODS' | 'PROCESSING' | 'SUCCESS'>('METHODS');
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NB'>('UPI');

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.status === filter);

  // Helper to calculate strictly PRINCIPAL arrears
  const getResidentPrincipalArrears = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return 0;
    
    const unpaidPrincipal = bills
      .filter(b => b.residentId === residentId && b.status !== PaymentStatus.PAID)
      .reduce((sum, b) => {
          const billPrincipal = b.items.reduce((s, i) => s + i.amount, 0);
          return sum + billPrincipal;
      }, 0);
      
    return resident.openingBalance + unpaidPrincipal;
  };

  // Dynamic SIMPLE Interest Calculation
  const calculatedInterest = useMemo(() => {
    if (!applyInterest || generationMode !== 'INDIVIDUAL' || !selectedResidentId) return 0;
    const principalArrears = getResidentPrincipalArrears(selectedResidentId);
    if (principalArrears <= 0) return 0;
    
    const divisor = billingFrequency === 'QUARTERLY' ? 4 : (billingFrequency === 'BI-MONTHLY' ? 6 : 12);
    return (principalArrears * interestRate / 100) / divisor;
  }, [applyInterest, generationMode, selectedResidentId, interestRate, billingFrequency]);

  const totalPrincipal = items.reduce((sum, item) => sum + item.amount, 0);
  
  // GST Calculation Logic
  const calculatedGst = useMemo(() => {
    if (!activeSociety.gstEnabled) return 0;
    return (totalPrincipal * (activeSociety.gstPercentage || 18)) / 100;
  }, [totalPrincipal, activeSociety.gstEnabled, activeSociety.gstPercentage]);

  const totalAmount = totalPrincipal + calculatedInterest + calculatedGst;

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

    setItems(prev => prev.map(item => {
        if (item.description.toLowerCase().includes('non-occupancy') && resident.occupancyType === 'Owner') {
            return { ...item, amount: 0 };
        }
        return {
            ...item,
            amount: item.type === 'SqFt' ? item.rate * resident.sqFt : item.rate
        };
    }));
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    const resident = residents.find(r => r.id === selectedResidentId);
    
    if (field === 'rate' || field === 'type') {
       const rate = Number(value) || 0;
       item.amount = (item.type === 'SqFt' && resident && generationMode === 'INDIVIDUAL') ? rate * resident.sqFt : rate;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', type: 'Fixed', rate: 0, amount: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleOpenGenerateModal = () => {
      const defaults = activeSociety.billingHeads || [
          { id: '1', description: 'Maintenance Charges', type: 'Fixed', rate: 0, amount: 0 }
      ];
      setItems(defaults.map(d => ({ ...d, id: Math.random().toString() })));
      
      setCustomBillNotes([]);
      setBillDate(new Date().toISOString().split('T')[0]);
      setBillingMonth(new Date().toISOString().slice(0, 7));
      setGenerationMode('INDIVIDUAL');
      setBillingFrequency('MONTHLY');
      setApplyInterest(false);
      setIsModalOpen(true);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const targets = generationMode === 'ALL' ? residents : residents.filter(r => r.id === selectedResidentId);
    
    if (targets.length > 0 && dueDate && billDate) {
      const generatedBills: Bill[] = targets.map(resident => {
          const residentItems = items.map(item => {
              if (item.description.toLowerCase().includes('non-occupancy') && resident.occupancyType === 'Owner') {
                  return { ...item, amount: 0 };
              }
              return {
                  ...item,
                  amount: item.type === 'SqFt' ? item.rate * resident.sqFt : item.rate
              };
          }).filter(item => item.amount > 0);
          
          let residentInterest = 0;
          if (applyInterest) {
              const principalArrears = getResidentPrincipalArrears(resident.id);
              if (principalArrears > 0) {
                  const divisor = billingFrequency === 'QUARTERLY' ? 4 : (billingFrequency === 'BI-MONTHLY' ? 6 : 12);
                  residentInterest = (principalArrears * interestRate / 100) / divisor;
              }
          }

          const residentPrincipal = residentItems.reduce((sum, item) => sum + item.amount, 0);
          const residentGst = activeSociety.gstEnabled ? (residentPrincipal * (activeSociety.gstPercentage || 18)) / 100 : 0;

          return {
            id: `B${Date.now()}-${resident.unitNumber}`,
            societyId,
            residentId: resident.id,
            residentName: resident.name,
            unitNumber: resident.unitNumber,
            items: residentItems,
            interest: residentInterest,
            gstAmount: residentGst,
            totalAmount: residentPrincipal + residentInterest + residentGst,
            dueDate: dueDate,
            status: PaymentStatus.PENDING,
            generatedDate: billDate,
            billMonth: billingMonth,
            customNotes: [...customBillNotes, `Frequency: ${billingFrequency}`, `Interest: ${interestRate}% p.a. (Simple)`]
          };
      });

      if (generatedBills.length === 1) {
          onGenerateBill(generatedBills[0]);
      } else {
          onBulkAddBills(generatedBills);
      }
      setIsModalOpen(false);
    }
  };

  const handleUpdateBillsProcess = (e: React.FormEvent) => {
      e.preventDefault();
      const heads = activeSociety.billingHeads || [];
      const updatedBills = bills.map(bill => {
          if (bill.status !== PaymentStatus.PAID) {
              if (updateMode === 'ALL' || bill.residentId === updateResidentId) {
                  const resident = residents.find(r => r.id === bill.residentId);
                  if (!resident) return bill;

                  const newItems = heads.map(head => {
                      if (head.description.toLowerCase().includes('non-occupancy') && resident.occupancyType === 'Owner') {
                          return { ...head, amount: 0 };
                      }
                      return {
                          ...head,
                          amount: head.type === 'SqFt' ? head.rate * resident.sqFt : head.rate
                      };
                  }).filter(i => i.amount > 0);

                  const principal = newItems.reduce((s, i) => s + i.amount, 0);
                  
                  let newInterest = bill.interest;
                  if (applyInterest) {
                      const principalArrears = getResidentPrincipalArrears(bill.residentId);
                      const divisor = billingFrequency === 'QUARTERLY' ? 4 : (billingFrequency === 'BI-MONTHLY' ? 6 : 12);
                      newInterest = (principalArrears * interestRate / 100) / divisor;
                  }

                  const newGst = activeSociety.gstEnabled ? (principal * (activeSociety.gstPercentage || 18)) / 100 : 0;

                  return {
                      ...bill,
                      items: newItems,
                      interest: newInterest,
                      gstAmount: newGst,
                      totalAmount: principal + newInterest + newGst
                  };
              }
          }
          return bill;
      });

      onBulkUpdateBills(updatedBills);
      setIsUpdateModalOpen(false);
      alert("Billing figures updated successfully with GST and Simple Interest applied.");
  };

  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentDetails>({
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      reference: '',
      remarks: ''
  });

  const handlePaymentClick = (bill: Bill) => {
    setSelectedBillForPayment(bill);
    setPaymentForm({ date: new Date().toISOString().split('T')[0], mode: 'UPI', reference: '', remarks: '' });
    setIsPaymentModalOpen(true);
};

const handlePayNow = (bill: Bill) => {
    setSelectedBillForPay(bill);
    setPaymentStep('METHODS');
    setIsGatewayOpen(true);
};

const processMockPayment = () => {
    setPaymentStep('PROCESSING');
    setTimeout(() => {
        if (selectedBillForPay) {
            onUpdateBill({
                ...selectedBillForPay,
                status: PaymentStatus.PAID,
                paymentDetails: {
                    date: new Date().toISOString().split('T')[0],
                    mode: selectedMethod === 'UPI' ? 'UPI' : (selectedMethod === 'CARD' ? 'Bank Transfer' : 'Bank Transfer'),
                    reference: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    remarks: `Online Payment via ${selectedMethod}`
                }
            });
            setPaymentStep('SUCCESS');
        }
    }, 2500);
};

  const handlePreview = (bill: Bill) => {
      setPreviewBill(bill);
      setPreviewTemplate('TOP_BILL');
      setIsPreviewOpen(true);
  };

  const handleSaveGlobalSettings = () => {
      onUpdateSociety({ 
          ...activeSociety, 
          footerNotes: tempFooterNotes,
          billingHeads: tempBillingHeads,
          upiId: tempUpiId,
          gstEnabled: tempGstEnabled,
          gstPercentage: tempGstPercentage
      });
      setIsSettingsOpen(true);
      setTimeout(() => setIsSettingsOpen(false), 500);
  };

  const addTempBillingHead = () => {
      setTempBillingHeads([...tempBillingHeads, { id: Date.now().toString(), description: '', type: 'Fixed', rate: 0, amount: 0 }]);
  };

  const removeTempBillingHead = (idx: number) => {
      setTempBillingHeads(tempBillingHeads.filter((_, i) => i !== idx));
  };

  const handleTempHeadChange = (idx: number, field: keyof BillItem, value: any) => {
      const updated = [...tempBillingHeads];
      updated[idx] = { ...updated[idx], [field]: value };
      setTempBillingHeads(updated);
  };

  const addFooterNote = () => setTempFooterNotes([...tempFooterNotes, '']);
  const removeFooterNote = (idx: number) => setTempFooterNotes(tempFooterNotes.filter((_, i) => i !== idx));
  const handleFooterNoteChange = (idx: number, val: string) => {
      const updated = [...tempFooterNotes];
      updated[idx] = val;
      setTempFooterNotes(updated);
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
    if (billingFrequency === 'MONTHLY') return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + (billingFrequency === 'BI-MONTHLY' ? 1 : 2));
    return `${date.toLocaleDateString('default', { month: 'short' })} - ${endDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })}`;
  };

  const getUpiQrUrl = (amount: number, billId: string) => {
    if (!activeSociety.upiId) return null;
    const upiLink = `upi://pay?pa=${activeSociety.upiId}&pn=${encodeURIComponent(activeSociety.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Bill '+billId)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={handleOpenGenerateModal} 
        onModify={() => { 
            setTempFooterNotes(activeSociety.footerNotes || [activeSociety.footerNote || '']); 
            setTempBillingHeads(activeSociety.billingHeads || []);
            setTempUpiId(activeSociety.upiId || '');
            setTempGstEnabled(activeSociety.gstEnabled || false);
            setTempGstPercentage(activeSociety.gstPercentage || 18);
            setIsSettingsOpen(true); 
        }}
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
            <button onClick={() => setIsUpdateModalOpen(true)} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition-colors font-bold text-sm">
                <RefreshCcw size={18} /> Update Bills
            </button>
            <button onClick={() => { 
                setTempFooterNotes(activeSociety.footerNotes || [activeSociety.footerNote || '']); 
                setTempBillingHeads(activeSociety.billingHeads || []);
                setTempUpiId(activeSociety.upiId || '');
                setTempGstEnabled(activeSociety.gstEnabled || false);
                setTempGstPercentage(activeSociety.gstPercentage || 18);
                setIsSettingsOpen(true); 
            }} className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                <Settings size={18} /> Global Settings
            </button>
            <button onClick={handleOpenGenerateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
                <Plus size={18} /> Generate Bill
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.map(bill => {
          const principal = bill.items.reduce((s, i) => s + i.amount, 0);
          return (
            <div key={bill.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 tracking-tighter">{bill.id}</span>
                  <h3 className="font-bold text-slate-800">{bill.unitNumber} - {bill.residentName}</h3>
                  <p className="text-xs text-indigo-600 font-bold flex items-center gap-1 mt-1"><Calendar size={12} /> {formatBillingMonth(bill.billMonth)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${getStatusColor(bill.status)} uppercase`}>
                  {bill.status}
                </span>
              </div>
              
              <div className="space-y-1.5 mb-4 text-sm mt-4 border-t border-slate-50 pt-4">
                {bill.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs"><span className="text-slate-500">{item.description}</span><span className="text-slate-800">Rs. {item.amount.toLocaleString()}</span></div>
                ))}
                
                <div className="flex justify-between font-bold border-t border-slate-100 pt-2 text-slate-600">
                    <span>Sub-Total</span>
                    <span>Rs. {principal.toLocaleString()}</span>
                </div>
                
                {bill.gstAmount && bill.gstAmount > 0 && (
                    <div className="flex justify-between text-indigo-600 text-xs font-bold">
                        <span>GST ({activeSociety.gstPercentage || 18}%)</span>
                        <span>Rs. {bill.gstAmount.toLocaleString()}</span>
                    </div>
                )}

                {bill.interest > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                        <span>Interest on Arrears</span>
                        <span>Rs. {bill.interest.toLocaleString()}</span>
                    </div>
                )}
                
                <div className="flex justify-between font-black border-t-2 border-indigo-100 pt-2 text-indigo-900 text-base">
                    <span>Grand Total</span>
                    <span>Rs. {bill.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {bill.status !== PaymentStatus.PAID ? (
                    <button onClick={() => handlePayNow(bill)} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md">
                        <Zap size={14} fill="currentColor" /> Pay Online
                    </button>
                ) : (
                    <button onClick={() => handlePreview(bill)} className="flex-1 bg-green-50 text-green-700 border border-green-200 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2">
                        <Check size={14} /> Settled
                    </button>
                )}
                <button onClick={() => handlePreview(bill)} className="p-2 text-slate-400 hover:text-indigo-600 border border-slate-100 rounded-lg">
                    <Eye size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><Settings className="text-indigo-600" /> Billing Customization</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                
                <div className="space-y-8">
                    {/* GST Section */}
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                <Percent size={20} /> GST Inclusion Settings
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setTempGstEnabled(!tempGstEnabled)}
                                className={`w-12 h-6 rounded-full transition-colors relative shadow-inner ${tempGstEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${tempGstEnabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        {tempGstEnabled && (
                            <div className="flex items-center gap-4 animate-fade-in">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-indigo-400 uppercase mb-1">GST Percentage (%)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 border border-indigo-200 rounded-xl font-bold text-indigo-700 outline-none"
                                        value={tempGstPercentage}
                                        onChange={(e) => setTempGstPercentage(Number(e.target.value))}
                                    />
                                </div>
                                <div className="text-[10px] text-indigo-600 leading-relaxed max-w-[200px] italic">
                                    Enabling this will automatically add GST to the total principal amount of all future bills.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Notes Section */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">Custom Footer Notes (Multiple)</label>
                            <button onClick={addFooterNote} className="text-xs bg-slate-900 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-slate-800"><Plus size={14} /> Add Note</button>
                        </div>
                        <div className="space-y-3">
                            {tempFooterNotes.map((note, idx) => (
                                <div key={idx} className="flex gap-2 items-start">
                                    <textarea 
                                        rows={2}
                                        className="flex-1 p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 outline-none"
                                        value={note}
                                        onChange={(e) => handleFooterNoteChange(idx, e.target.value)}
                                        placeholder="e.g. Please note that cheque bounce charges are Rs. 500."
                                    />
                                    <button onClick={() => removeFooterNote(idx)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={20} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Global UPI & Heads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        <div>
                            <label className="block text-sm font-black text-indigo-700 uppercase tracking-wider mb-2">Society UPI ID</label>
                            <input 
                                type="text"
                                className="w-full p-4 border border-slate-300 rounded-xl font-bold"
                                value={tempUpiId}
                                onChange={(e) => setTempUpiId(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t mt-8">
                    <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
                    <button onClick={handleSaveGlobalSettings} className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-black hover:bg-indigo-700 shadow-lg">Save Changes</button>
                </div>
            </div>
        </div>
      )}

      {/* --- PREVIEW MODAL (Showing GST and multiple notes) --- */}
      {isPreviewOpen && previewBill && (
        <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center z-[90] p-4 overflow-y-auto backdrop-blur-md">
           <div className="sticky top-0 w-full max-w-4xl bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-2xl flex flex-wrap justify-between items-center gap-4 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => downloadPDF('invoice-render', `Bill_${previewBill.unitNumber}.pdf`)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700"><Download size={18} /> Download PDF</button>
                    <button onClick={() => setIsPreviewOpen(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 flex items-center gap-2"><X size={18} /> Close</button>
                </div>
           </div>

           <div id="invoice-render" className="bg-white w-[210mm] min-h-[297mm] p-10 shadow-2xl mx-auto flex flex-col text-slate-800 border">
                <div className="flex-1">
                    <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-indigo-700">{activeSociety.name}</h1>
                            <p className="text-sm text-slate-600 mt-2 max-w-xs">{activeSociety.address}</p>
                            <p className="text-xs text-slate-400 mt-1">Reg No: {activeSociety.registrationNumber} | GST: {activeSociety.gstNumber || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-black text-slate-900">INVOICE</h2>
                            <p className="mt-4 text-sm font-bold text-indigo-700">Period: {formatBillingMonth(previewBill.billMonth)}</p>
                        </div>
                    </div>

                    <table className="w-full mb-8">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-3 text-left">Description</th>
                                <th className="p-3 text-right">Amount (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {previewBill.items.map((item, idx) => (
                                <tr key={idx}><td className="p-4">{item.description}</td><td className="p-4 text-right">Rs. {item.amount.toLocaleString()}</td></tr>
                            ))}
                            <tr className="bg-slate-50 font-bold">
                                <td className="p-4 text-right uppercase text-xs">Principal Amount</td>
                                <td className="p-4 text-right">Rs. {previewBill.items.reduce((s, i) => s + i.amount, 0).toLocaleString()}</td>
                            </tr>
                            {previewBill.gstAmount ? (
                                <tr className="text-indigo-600 font-bold">
                                    <td className="p-4 text-right text-xs">GST ({activeSociety.gstPercentage || 18}%) (CGST + SGST)</td>
                                    <td className="p-4 text-right">Rs. {previewBill.gstAmount.toLocaleString()}</td>
                                </tr>
                            ) : null}
                            {previewBill.interest > 0 && (
                                <tr className="text-red-700 font-bold">
                                    <td className="p-4 text-right text-xs">Interest on Arrears</td>
                                    <td className="p-4 text-right">Rs. {previewBill.interest.toLocaleString()}</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-indigo-50 font-black text-xl text-indigo-900">
                                <td className="p-4 text-right uppercase">Total Payable</td>
                                <td className="p-4 text-right">Rs. {previewBill.totalAmount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="mt-12 pt-6 border-t border-slate-200">
                        <h4 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Important Notes & Policy</h4>
                        <div className="space-y-3">
                            {(activeSociety.footerNotes || [activeSociety.footerNote]).map((note, idx) => (
                                <div key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed font-medium italic">
                                    <span>{idx + 1}.</span>
                                    <span>{note}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-10 flex justify-between items-end border-t pt-8 opacity-60">
                    <p className="text-[10px] font-bold">Generated via SocietyLink Estate OS</p>
                    <div className="text-right"><div className="h-10 w-32 border-b border-slate-300 mb-1"></div><p className="text-[10px] font-black uppercase">Authorized Signatory</p></div>
                </div>
           </div>
        </div>
      )}

      {/* --- REST OF THE MODALS UNCHANGED --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Plus className="text-indigo-600" /> Bill Generation Wizard</h2>
            
            <form onSubmit={handleGenerate} className="space-y-6">
                <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-200">
                    <button type="button" onClick={() => setGenerationMode('INDIVIDUAL')} className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${generationMode === 'INDIVIDUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}><User size={16} /> Individual Member</button>
                    <button type="button" onClick={() => setGenerationMode('ALL')} className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${generationMode === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}><Layers size={16} /> All Members</button>
                </div>

                {generationMode === 'INDIVIDUAL' && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Select Resident Member *</label>
                        <select className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800" required value={selectedResidentId} onChange={e => handleResidentChange(e.target.value)}>
                            <option value="">-- Choose Member --</option>
                            {residents.map(r => <option key={r.id} value={r.id}>{r.unitNumber} - {r.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Billing Cycle</label>
                        <select className="w-full p-3 border border-slate-300 rounded-xl font-bold" value={billingFrequency} onChange={(e) => setBillingFrequency(e.target.value as any)}>
                            <option value="MONTHLY">Monthly</option>
                            <option value="BI-MONTHLY">Bi-Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Billing Month *</label>
                        <input type="month" className="w-full p-3 border border-slate-300 rounded-xl font-bold" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}/>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Estimated Bill (Single)</span>
                        <div className="flex flex-col">
                            <span className="text-2xl text-slate-900 font-black">Rs. {totalAmount.toLocaleString()}</span>
                            <div className="flex gap-4 mt-1">
                                {activeSociety.gstEnabled && <span className="text-[10px] text-indigo-600 font-bold">+ GST (₹{calculatedGst.toLocaleString()})</span>}
                                {applyInterest && calculatedInterest > 0 && <span className="text-[10px] text-red-600 font-bold">+ Interest (₹{calculatedInterest.toLocaleString()})</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
                        <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-xl transition-all">Generate & Save</button>
                    </div>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
