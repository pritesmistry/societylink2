
import React, { useState, useRef, useMemo } from 'react';
import { Bill, PaymentStatus, Resident, BillItem, Society, BillLayout, PaymentDetails } from '../types';
import { FileText, Plus, Trash2, IndianRupee, AlertCircle, Upload, Users, Download, Clock, Settings, FileDown, Eye, Check, CreditCard, Receipt, CalendarRange, QrCode, ExternalLink, Image as ImageIcon, Save, Scissors, LayoutTemplate, X, MessageSquarePlus, Calendar, Layers, User, ShieldCheck, Percent, Zap, Lock, Shield, ArrowRight, Loader2, Smartphone, Landmark, RefreshCcw, Info, ToggleLeft, Columns } from 'lucide-react';
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
  const [previewTemplate, setPreviewTemplate] = useState<BillLayout['template']>('MODERN');

  // Generation Modal State
  const [generationMode, setGenerationMode] = useState<'INDIVIDUAL' | 'ALL'>('INDIVIDUAL');
  const [billingFrequency, setBillingFrequency] = useState<'MONTHLY' | 'BI-MONTHLY' | 'QUARTERLY'>('MONTHLY');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); 
  
  // Interest States
  const [applyInterest, setApplyInterest] = useState(false);
  const [interestRate, setInterestRate] = useState(21); 

  // Settings State
  const [tempFooterNotes, setTempFooterNotes] = useState<string[]>(activeSociety.footerNotes || [activeSociety.footerNote || '']);
  const [tempUpiId, setTempUpiId] = useState(activeSociety.upiId || '');
  const [tempGstEnabled, setTempGstEnabled] = useState(activeSociety.gstEnabled || false);
  const [tempGstPercentage, setTempGstPercentage] = useState(activeSociety.gstPercentage || 18);
  
  // Enhanced Layout Settings
  const [tempLayout, setTempLayout] = useState<BillLayout>(activeSociety.billLayout || {
      title: 'MAINTENANCE BILL',
      showSocietyAddress: true,
      showBankDetails: true,
      showFooterNote: true,
      colorTheme: '#4f46e5',
      showLogoPlaceholder: true,
      template: 'MODERN',
      columns: { description: true, type: true, rate: true, amount: true }
  });

  const [items, setItems] = useState<BillItem[]>([]);
  const [customBillNotes, setCustomBillNotes] = useState<string[]>([]);

  const [selectedBillForPay, setSelectedBillForPay] = useState<Bill | null>(null);
  const [paymentStep, setPaymentStep] = useState<'METHODS' | 'PROCESSING' | 'SUCCESS'>('METHODS');
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NB'>('UPI');

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.status === filter);

  const getResidentPrincipalArrears = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return 0;
    const unpaidPrincipal = bills
      .filter(b => b.residentId === residentId && b.status !== PaymentStatus.PAID)
      .reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.amount, 0), 0);
    return resident.openingBalance + unpaidPrincipal;
  };

  const calculatedInterest = useMemo(() => {
    if (!applyInterest || generationMode !== 'INDIVIDUAL' || !selectedResidentId) return 0;
    const principalArrears = getResidentPrincipalArrears(selectedResidentId);
    if (principalArrears <= 0) return 0;
    const divisor = billingFrequency === 'QUARTERLY' ? 4 : (billingFrequency === 'BI-MONTHLY' ? 6 : 12);
    return (principalArrears * interestRate / 100) / divisor;
  }, [applyInterest, generationMode, selectedResidentId, interestRate, billingFrequency]);

  const totalPrincipal = items.reduce((sum, item) => sum + item.amount, 0);
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setTempLayout({ ...tempLayout, logo: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveGlobalSettings = () => {
      onUpdateSociety({ 
          ...activeSociety, 
          footerNotes: tempFooterNotes,
          upiId: tempUpiId,
          gstEnabled: tempGstEnabled,
          gstPercentage: tempGstPercentage,
          billLayout: tempLayout
      });
      setIsSettingsOpen(false);
  };

  const handlePreview = (bill: Bill) => {
      setPreviewBill(bill);
      setIsPreviewOpen(true);
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

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const targets = generationMode === 'ALL' ? residents : residents.filter(r => r.id === selectedResidentId);
    if (targets.length > 0 && dueDate && billDate) {
      const generatedBills: Bill[] = targets.map(resident => {
          const residentItems = items.map(item => ({
              ...item,
              amount: item.type === 'SqFt' ? item.rate * resident.sqFt : item.rate
          })).filter(item => item.amount > 0);
          const residentPrincipal = residentItems.reduce((sum, item) => sum + item.amount, 0);
          const residentGst = activeSociety.gstEnabled ? (residentPrincipal * (activeSociety.gstPercentage || 18)) / 100 : 0;
          return {
            id: `B${Date.now()}-${resident.unitNumber}`,
            societyId,
            residentId: resident.id,
            residentName: resident.name,
            unitNumber: resident.unitNumber,
            items: residentItems,
            interest: applyInterest ? (getResidentPrincipalArrears(resident.id) * interestRate / 100) / 12 : 0,
            gstAmount: residentGst,
            totalAmount: residentPrincipal + (applyInterest ? (getResidentPrincipalArrears(resident.id) * interestRate / 100) / 12 : 0) + residentGst,
            dueDate: dueDate,
            status: PaymentStatus.PENDING,
            generatedDate: billDate,
            billMonth: billingMonth,
            customNotes: customBillNotes
          };
      });
      if (generatedBills.length === 1) onGenerateBill(generatedBills[0]);
      else onBulkAddBills(generatedBills);
      setIsModalOpen(false);
    }
  };

  const handlePayNow = (bill: Bill) => {
    setSelectedBillForPay(bill);
    setPaymentStep('METHODS');
    setIsGatewayOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={() => { setIsModalOpen(true); setItems(activeSociety.billingHeads || []); }}
        onModify={() => { 
            setTempFooterNotes(activeSociety.footerNotes || [activeSociety.footerNote || '']); 
            setTempUpiId(activeSociety.upiId || '');
            setTempGstEnabled(activeSociety.gstEnabled || false);
            setTempGstPercentage(activeSociety.gstPercentage || 18);
            setTempLayout(activeSociety.billLayout || tempLayout);
            setIsSettingsOpen(true); 
        }}
        balances={balances} 
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          {['All', PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.OVERDUE].map((s) => (
            <button key={s} onClick={() => setFilter(s as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsUpdateModalOpen(true)} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100 font-bold text-sm">
                <RefreshCcw size={18} /> Update Bills
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100">
                <Settings size={18} /> Layout Settings
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                <Plus size={18} /> Generate Bill
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.map(bill => (
          <div key={bill.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{bill.id}</span>
                <h3 className="font-bold text-slate-800">{bill.unitNumber} - {bill.residentName}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${getStatusColor(bill.status)} uppercase`}>{bill.status}</span>
            </div>
            <div className="mt-4 border-t border-slate-50 pt-4 flex justify-between items-center">
                <span className="text-xl font-black text-indigo-900">₹{bill.totalAmount.toLocaleString()}</span>
                <div className="flex gap-2">
                    <button onClick={() => handlePayNow(bill)} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Zap size={16} /></button>
                    <button onClick={() => handlePreview(bill)} className="p-2 text-slate-400 hover:text-indigo-600 border border-slate-100 rounded-lg"><Eye size={18} /></button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Settings className="text-indigo-600" /> Bill Preview Customization</h2>
                        <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest">Personalize your society's official invoice</p>
                    </div>
                    <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        {/* Logo Upload */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Society Logo</label>
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                                    {tempLayout.logo ? <img src={tempLayout.logo} className="h-full w-full object-contain" /> : <ImageIcon className="text-slate-300" size={32} />}
                                </div>
                                <div className="flex-1">
                                    <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoUpload} />
                                    <label htmlFor="logo-upload" className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
                                        <Upload size={14} /> Upload Branding Logo
                                    </label>
                                    <p className="text-[10px] text-slate-400 mt-2 italic">Recommended: 200x200 PNG/JPG</p>
                                </div>
                            </div>
                        </div>

                        {/* Column Selection */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Columns size={14} /> Visible Columns in Bill</h4>
                             <div className="grid grid-cols-2 gap-4">
                                {Object.keys(tempLayout.columns).map(col => (
                                    <label key={col} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-all">
                                        <input 
                                            type="checkbox" 
                                            checked={(tempLayout.columns as any)[col]} 
                                            onChange={(e) => setTempLayout({ ...tempLayout, columns: { ...tempLayout.columns, [col]: e.target.checked } })}
                                            className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-700 capitalize">{col}</span>
                                    </label>
                                ))}
                             </div>
                        </div>

                        {/* Layout Mode */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><LayoutTemplate size={14} /> Style & Templates</h4>
                             <div className="space-y-2">
                                {[
                                    { id: 'MODERN', label: 'Bill for this Month (Modern)', desc: 'Clean, professional grid layout' },
                                    { id: 'SPLIT_RECEIPT', label: 'Bill Top + Previous Receipt Down', desc: 'Combined invoice with historical proof' },
                                    { id: 'CLASSIC', label: 'Classic Corporate', desc: 'Standard business invoice format' },
                                    { id: 'MINIMAL', label: 'Blank / Plain Receipt', desc: 'Minimalistic receipt for manual use' }
                                ].map(tpl => (
                                    <button 
                                        key={tpl.id}
                                        onClick={() => setTempLayout({ ...tempLayout, template: tpl.id as any })}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${tempLayout.template === tpl.id ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <p className={`text-sm font-black ${tempLayout.template === tpl.id ? 'text-indigo-900' : 'text-slate-800'}`}>{tpl.label}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{tpl.desc}</p>
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Quick Preview</h4>
                        <div className="flex-1 bg-slate-900 rounded-3xl p-6 flex items-center justify-center text-slate-500 text-xs text-center italic border-4 border-slate-800 shadow-inner">
                            <div className="space-y-4">
                                <LayoutTemplate size={48} className="mx-auto opacity-20" />
                                <p>Live layout changes will apply to<br/>the official PDF generator.</p>
                                <div className="mt-4 p-2 bg-indigo-600/20 text-indigo-400 rounded-lg font-bold border border-indigo-500/30">
                                    Active: {tempLayout.template}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t mt-8">
                    <button onClick={() => setIsSettingsOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">Cancel</button>
                    <button onClick={handleSaveGlobalSettings} className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <Check size={20} /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && previewBill && (
        <div className="fixed inset-0 bg-slate-900/95 flex flex-col items-center z-[120] p-4 overflow-y-auto backdrop-blur-md">
           <div className="sticky top-0 w-full max-w-[210mm] bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-6 shadow-2xl flex justify-between items-center gap-4 z-20">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><FileText size={24}/></div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Draft Bill Preview</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{activeSociety.billLayout?.template || 'MODERN'} Layout</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => downloadPDF('invoice-render', `Bill_${previewBill.unitNumber}.pdf`)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg"><Download size={16} /> Export PDF</button>
                    <button onClick={() => setIsPreviewOpen(false)} className="bg-slate-100 text-slate-700 p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"><X size={20}/></button>
                </div>
           </div>

           <div id="invoice-render" className="bg-white w-[210mm] min-h-[297mm] shadow-2xl mx-auto flex flex-col text-slate-800 border-x border-slate-100 relative">
                {/* BLANK RECEIPT TEMPLATE */}
                {activeSociety.billLayout?.template === 'MINIMAL' ? (
                    <div className="p-16 flex flex-col h-full items-center justify-center text-center opacity-40">
                         <div className="border-4 border-dashed border-slate-300 rounded-[4rem] p-20">
                            <Receipt size={80} className="mx-auto mb-6 text-slate-300" />
                            <h2 className="text-4xl font-black uppercase text-slate-400">Blank Receipt</h2>
                            <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest">Valid for society manual entries only</p>
                         </div>
                    </div>
                ) : (
                    <div className="p-12 flex-1 flex flex-col">
                        {/* Header with Logo */}
                        <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-8 mb-10">
                            <div className="flex items-start gap-6">
                                {activeSociety.billLayout?.logo && (
                                    <div className="h-24 w-24 bg-white rounded-2xl p-1 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                                        <img src={activeSociety.billLayout.logo} className="max-h-full max-w-full object-contain" />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-3xl font-black text-indigo-700 tracking-tighter uppercase">{activeSociety.name}</h1>
                                    <p className="text-xs text-slate-500 mt-2 max-w-xs font-medium leading-relaxed">{activeSociety.address}</p>
                                    <div className="flex gap-4 mt-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>REG: {activeSociety.registrationNumber}</span>
                                        <span className="w-px h-3 bg-slate-200"></span>
                                        <span>GST: {activeSociety.gstNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{activeSociety.billLayout?.title || 'INVOICE'}</h2>
                                <div className="mt-6 space-y-1">
                                    <p className="text-xs font-black uppercase text-indigo-600">Bill Period</p>
                                    <p className="text-lg font-black text-slate-800">{formatBillingMonth(previewBill.billMonth)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Resident Details */}
                        <div className="grid grid-cols-2 gap-8 mb-12 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member / Payee</h4>
                                <p className="text-xl font-black text-slate-800">{previewBill.residentName}</p>
                                <p className="text-sm font-bold text-indigo-600">Flat/Unit: {previewBill.unitNumber}</p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bill Identifiers</h4>
                                <p className="text-sm font-bold text-slate-700">Invoice No: <span className="font-mono">{previewBill.id}</span></p>
                                <p className="text-sm font-bold text-slate-700">Due Date: <span className="text-red-600">{previewBill.dueDate}</span></p>
                            </div>
                        </div>

                        {/* Bill Items Table */}
                        <table className="w-full mb-10 border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    {activeSociety.billLayout?.columns.description && <th className="p-4 text-left uppercase text-xs tracking-widest font-black">Description</th>}
                                    {activeSociety.billLayout?.columns.type && <th className="p-4 text-center uppercase text-xs tracking-widest font-black">Type</th>}
                                    {activeSociety.billLayout?.columns.rate && <th className="p-4 text-right uppercase text-xs tracking-widest font-black">Rate</th>}
                                    {activeSociety.billLayout?.columns.amount && <th className="p-4 text-right uppercase text-xs tracking-widest font-black">Total Amount</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                                {previewBill.items.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-indigo-50/30 transition-colors">
                                        {activeSociety.billLayout?.columns.description && <td className="p-5 font-bold text-slate-700">{item.description}</td>}
                                        {activeSociety.billLayout?.columns.type && <td className="p-5 text-center text-xs font-black text-slate-400 uppercase">{item.type}</td>}
                                        {activeSociety.billLayout?.columns.rate && <td className="p-5 text-right font-medium text-slate-600">₹{item.rate.toLocaleString()}</td>}
                                        {activeSociety.billLayout?.columns.amount && <td className="p-5 text-right font-black text-slate-900">₹{item.amount.toLocaleString()}</td>}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 font-black">
                                    <td colSpan={Object.values(activeSociety.billLayout?.columns || {}).filter(v => v).length - 1} className="p-5 text-right text-slate-500 uppercase tracking-widest text-[10px]">Net Principal</td>
                                    <td className="p-5 text-right text-slate-700">₹{previewBill.items.reduce((s, i) => s + i.amount, 0).toLocaleString()}</td>
                                </tr>
                                {previewBill.gstAmount ? (
                                    <tr className="font-bold text-indigo-600">
                                        <td colSpan={Object.values(activeSociety.billLayout?.columns || {}).filter(v => v).length - 1} className="p-4 text-right text-[10px] uppercase">Tax (GST {activeSociety.gstPercentage}%)</td>
                                        <td className="p-4 text-right">₹{previewBill.gstAmount.toLocaleString()}</td>
                                    </tr>
                                ) : null}
                                {previewBill.interest > 0 && (
                                    <tr className="font-bold text-red-600">
                                        <td colSpan={Object.values(activeSociety.billLayout?.columns || {}).filter(v => v).length - 1} className="p-4 text-right text-[10px] uppercase">Late Fee / Interest</td>
                                        <td className="p-4 text-right">₹{previewBill.interest.toLocaleString()}</td>
                                    </tr>
                                )}
                                <tr className="bg-indigo-600 text-white font-black text-2xl">
                                    <td colSpan={Object.values(activeSociety.billLayout?.columns || {}).filter(v => v).length - 1} className="p-6 text-right uppercase tracking-tighter">Amount Payable</td>
                                    <td className="p-6 text-right">₹{previewBill.totalAmount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* --- CONDITIONAL RECEIPT (SPLIT LAYOUT) --- */}
                        {activeSociety.billLayout?.template === 'SPLIT_RECEIPT' && lastReceipt && (
                            <div className="mt-12 pt-12 border-t-4 border-dashed border-slate-200">
                                <div className="bg-green-50/50 p-8 rounded-[2rem] border-2 border-green-100 relative">
                                    <div className="absolute top-4 right-8 bg-green-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Last Month Receipt</div>
                                    <h4 className="text-lg font-black text-green-800 mb-4 flex items-center gap-2"><Check className="text-green-600"/> Payment Confirmation</h4>
                                    <p className="text-sm leading-relaxed text-green-700 font-medium">
                                        We gratefully acknowledge the receipt of <span className="font-black">₹{lastReceipt.totalAmount.toLocaleString()}</span> paid via <span className="font-black">{lastReceipt.paymentDetails?.mode}</span> 
                                        (Ref: {lastReceipt.paymentDetails?.reference}) dated <span className="font-black">{lastReceipt.paymentDetails?.date}</span> against Bill No: {lastReceipt.id}.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Terms</h4>
                                    <div className="space-y-2">
                                        {(activeSociety.footerNotes || [activeSociety.footerNote]).map((note, idx) => (
                                            <p key={idx} className="text-[10px] text-slate-500 leading-relaxed font-bold italic">• {note}</p>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-end">
                                    <div className="h-16 w-48 border-b-2 border-slate-300 mb-2"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{activeSociety.processedBy}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase">Authorized Signatory</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Print watermark/footer */}
                <div className="h-8 bg-indigo-600 w-full flex items-center justify-between px-10 text-[8px] text-indigo-100 font-bold uppercase tracking-widest">
                    <span>Generated by SocietyLink Estate OS</span>
                    <span>System Time: {new Date().toLocaleString()}</span>
                </div>
           </div>
        </div>
      )}

      {/* --- REST OF THE MODALS --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Plus className="text-indigo-600" /> Bill Generation</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-6">
                <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 border border-slate-200">
                    <button type="button" onClick={() => setGenerationMode('INDIVIDUAL')} className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${generationMode === 'INDIVIDUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}><User size={16} /> Individual</button>
                    <button type="button" onClick={() => setGenerationMode('ALL')} className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${generationMode === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}><Layers size={16} /> Bulk (All)</button>
                </div>
                {generationMode === 'INDIVIDUAL' && (
                    <div className="animate-fade-in">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Select Member *</label>
                        <select className="w-full p-4 border border-slate-200 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-indigo-100 outline-none" required value={selectedResidentId} onChange={e => setSelectedResidentId(e.target.value)}>
                            <option value="">-- Choose Member --</option>
                            {residents.map(r => <option key={r.id} value={r.id}>{r.unitNumber} - {r.name}</option>)}
                        </select>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Month</label>
                        <input type="month" className="w-full p-4 border border-slate-200 rounded-2xl font-black focus:ring-4 focus:ring-indigo-100 outline-none" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Due Date</label>
                        <input type="date" required className="w-full p-4 border border-slate-200 rounded-2xl font-black focus:ring-4 focus:ring-indigo-100 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold">Cancel</button>
                    <button type="submit" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl">Process Bills</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
