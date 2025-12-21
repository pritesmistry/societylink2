
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

  const [generationMode, setGenerationMode] = useState<'INDIVIDUAL' | 'ALL'>('INDIVIDUAL');
  const [billingFrequency, setBillingFrequency] = useState<'MONTHLY' | 'BI-MONTHLY' | 'QUARTERLY'>('MONTHLY');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [applyInterest, setApplyInterest] = useState(false);
  const [interestRate, setInterestRate] = useState(21); 

  const [updateMode, setUpdateMode] = useState<'INDIVIDUAL' | 'ALL'>('ALL');
  const [updateResidentId, setUpdateResidentId] = useState('');

  const [items, setItems] = useState<BillItem[]>([]);
  const [customBillNotes, setCustomBillNotes] = useState<string[]>([]);

  const [tempFooterNote, setTempFooterNote] = useState(activeSociety.footerNote || '');
  const [tempBillingHeads, setTempBillingHeads] = useState<BillItem[]>(activeSociety.billingHeads || []);
  const [tempUpiId, setTempUpiId] = useState(activeSociety.upiId || '');

  const [selectedBillForPay, setSelectedBillForPay] = useState<Bill | null>(null);
  const [paymentStep, setPaymentStep] = useState<'METHODS' | 'PROCESSING' | 'SUCCESS'>('METHODS');
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NB'>('UPI');

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.status === filter);

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

  const calculatedInterest = useMemo(() => {
    if (!applyInterest || generationMode !== 'INDIVIDUAL' || !selectedResidentId) return 0;
    const principalArrears = getResidentPrincipalArrears(selectedResidentId);
    if (principalArrears <= 0) return 0;
    const divisor = billingFrequency === 'QUARTERLY' ? 4 : (billingFrequency === 'BI-MONTHLY' ? 6 : 12);
    return (principalArrears * interestRate / 100) / divisor;
  }, [applyInterest, generationMode, selectedResidentId, interestRate, billingFrequency]);

  const totalPrincipal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = totalPrincipal + calculatedInterest;

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
          return {
            id: `B${Date.now()}-${resident.unitNumber}`,
            societyId,
            residentId: resident.id,
            residentName: resident.name,
            unitNumber: resident.unitNumber,
            items: residentItems,
            interest: residentInterest,
            totalAmount: residentPrincipal + residentInterest,
            dueDate: dueDate,
            status: PaymentStatus.PENDING,
            generatedDate: billDate,
            billMonth: billingMonth,
            customNotes: [...customBillNotes, `Frequency: ${billingFrequency}`, `Interest: ${interestRate}% p.a. (Simple)`]
          };
      });
      if (generatedBills.length === 1) onGenerateBill(generatedBills[0]);
      else onBulkAddBills(generatedBills);
      setIsModalOpen(false);
    }
  };

  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentDetails>({
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      reference: '',
      remarks: ''
  });

  const handleSaveGlobalSettings = () => {
      onUpdateSociety({ ...activeSociety, footerNote: tempFooterNote, billingHeads: tempBillingHeads, upiId: tempUpiId });
      setIsSettingsOpen(false);
  };

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const opt = { margin: 0, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onNew={handleOpenGenerateModal}
        onModify={() => { 
            setTempFooterNote(activeSociety.footerNote || ''); 
            setTempBillingHeads(activeSociety.billingHeads || []);
            setTempUpiId(activeSociety.upiId || '');
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
            <button onClick={() => setIsUpdateModalOpen(true)} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100 shadow-sm font-bold text-sm">
                <RefreshCcw size={18} /> Update Bills
            </button>
            <button onClick={handleOpenGenerateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
                <Plus size={18} /> Generate Bill
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.map(bill => (
            <div key={bill.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 tracking-tighter">{bill.id}</span>
                  <h3 className="font-bold text-slate-800">{bill.unitNumber} - {bill.residentName}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${getStatusColor(bill.status)} uppercase`}>{bill.status}</span>
              </div>
              <div className="flex justify-between font-black border-t border-slate-100 pt-4 text-indigo-900 text-lg">
                <span>Total Due</span>
                <span>Rs. {bill.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setPreviewBill(bill); setIsPreviewOpen(true); }} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg text-xs font-black hover:bg-slate-200 transition-colors">View Bill</button>
                <button onClick={() => { setSelectedBillForPayment(bill); setIsPaymentModalOpen(true); }} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-black hover:bg-indigo-700 transition-colors">Record Payment</button>
              </div>
            </div>
        ))}
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black flex items-center gap-2 text-slate-800"><Settings className="text-indigo-600" /> Global Billing Settings</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-black text-indigo-700 uppercase tracking-widest">Society UPI ID (For QR Code)</label>
                        </div>
                        <input type="text" className="w-full p-4 border border-slate-300 rounded-xl outline-none font-bold" placeholder="society@bank" value={tempUpiId} onChange={(e) => setTempUpiId(e.target.value)}/>
                    </div>
                    <div className="border-t pt-6">
                        <label className="block text-xs font-black text-indigo-700 uppercase tracking-widest mb-2">Static Footer Note</label>
                        <textarea rows={3} className="w-full p-4 border border-slate-300 rounded-xl outline-none font-medium text-sm" value={tempFooterNote} onChange={(e) => setTempFooterNote(e.target.value)}/>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-8 border-t mt-8">
                    <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
                    <button onClick={handleSaveGlobalSettings} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-lg">Apply All Global Settings</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
