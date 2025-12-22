
import React, { useState, useRef, useMemo } from 'react';
import { Bill, PaymentStatus, Resident, BillItem, Society, BillLayout, PaymentDetails } from '../types';
import { FileText, Plus, Trash2, IndianRupee, AlertCircle, Upload, Users, Download, Clock, Settings, FileDown, Eye, Check, CreditCard, Receipt, CalendarRange, QrCode, ExternalLink, Image as ImageIcon, Save, Scissors, LayoutTemplate, X, MessageSquarePlus, Calendar, Layers, User, ShieldCheck, Percent, Zap, Lock, Shield, ArrowRight, Loader2, Smartphone, Landmark, RefreshCcw, Info, ToggleLeft, Columns, GripVertical, Sparkles, Wand2, MessageSquare, Send, Search } from 'lucide-react';
import StandardToolbar from './StandardToolbar';
import { generateArrearsRecoveryStrategy } from '../services/geminiService';

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
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // AI State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [selectedBillForAi, setSelectedBillForAi] = useState<Bill | null>(null);

  const [previewBill, setPreviewBill] = useState<Bill | null>(null);

  // Generation Modal State
  const [generationMode, setGenerationMode] = useState<'INDIVIDUAL' | 'ALL'>('INDIVIDUAL');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); 
  
  // Settings State for Customization
  const [tempFooterNotes, setTempFooterNotes] = useState<string[]>(activeSociety.footerNotes || [activeSociety.footerNote || '']);
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

  const [items, setItems] = useState<BillItem[]>(activeSociety.billingHeads || []);

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchesFilter = filter === 'All' || b.status === filter;
      const matchesSearch = b.residentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           b.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           b.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [bills, filter, searchQuery]);

  // Helper to find the last receipt for a resident
  const lastReceipt = useMemo(() => {
    if (!previewBill) return null;
    return bills
      .filter(b => b.residentId === previewBill.residentId && b.status === PaymentStatus.PAID && b.paymentDetails)
      .sort((a, b) => new Date(b.paymentDetails!.date).getTime() - new Date(a.paymentDetails!.date).getTime())[0];
  }, [previewBill, bills]);

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

  const handleArrearsAi = async (bill: Bill) => {
      setSelectedBillForAi(bill);
      setAiResult(null);
      setIsAiPanelOpen(true);
      setAiLoading(true);
      try {
          const result = await generateArrearsRecoveryStrategy(bill, activeSociety.name);
          setAiResult(result);
      } catch (err) {
          setAiResult("Failed to generate AI strategy.");
      } finally {
          setAiLoading(false);
      }
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
            interest: 0,
            gstAmount: residentGst,
            totalAmount: residentPrincipal + residentGst,
            dueDate: dueDate,
            status: PaymentStatus.PENDING,
            generatedDate: billDate,
            billMonth: billingMonth,
          };
      });
      if (generatedBills.length === 1) onGenerateBill(generatedBills[0]);
      else onBulkAddBills(generatedBills);
      setIsModalOpen(false);
    }
  };

  const addFooterNote = () => setTempFooterNotes([...tempFooterNotes, '']);
  const removeFooterNote = (idx: number) => setTempFooterNotes(tempFooterNotes.filter((_, i) => i !== idx));
  const handleFooterNoteChange = (idx: number, val: string) => {
      const updated = [...tempFooterNotes];
      updated[idx] = val;
      setTempFooterNotes(updated);
  };

  const formatBillingMonth = (monthStr?: string) => {
    if (!monthStr) return '';
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={() => setIsModalOpen(true)}
        onModify={() => { 
            setTempFooterNotes(activeSociety.footerNotes || [activeSociety.footerNote || '']); 
            setTempGstEnabled(activeSociety.gstEnabled || false);
            setTempGstPercentage(activeSociety.gstPercentage || 18);
            setTempLayout(activeSociety.billLayout || tempLayout);
            setIsSettingsOpen(true); 
        }}
        onSearch={() => searchInputRef.current?.focus()}
        balances={balances} 
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          {['All', PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.OVERDUE].map((s) => (
            <button key={s} onClick={() => setFilter(s as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search by name/unit..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold whitespace-nowrap">
                <Settings size={18} /> Layout
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md whitespace-nowrap">
                <Plus size={18} /> New Bill
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
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{formatBillingMonth(bill.billMonth)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-1 rounded-full text-[10px] font-black border uppercase ${bill.status === PaymentStatus.PAID ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                    {bill.status}
                </span>
                {bill.status === PaymentStatus.OVERDUE && (
                    <button onClick={() => handleArrearsAi(bill)} className="text-[9px] font-black text-indigo-600 flex items-center gap-1 hover:underline">
                        <Sparkles size={10} /> AI RECOVERY
                    </button>
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-50 pt-4 flex justify-between items-center">
                <span className="text-xl font-black text-indigo-900">₹{bill.totalAmount.toLocaleString()}</span>
                <div className="flex gap-2">
                    <button onClick={() => handlePreview(bill)} className="p-2 text-slate-400 hover:text-indigo-600 border border-slate-100 rounded-lg transition-all"><Eye size={18} /></button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI ARREARS RECOVERY MODAL */}
      {isAiPanelOpen && selectedBillForAi && (
          <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[130] backdrop-blur-md p-4">
              <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Sparkles size={32} /></div>
                          <div>
                              <h2 className="text-2xl font-black uppercase tracking-tighter">AI Recovery Assistant</h2>
                              <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Analyzing arrears for {selectedBillForAi.residentName} ({selectedBillForAi.unitNumber})</p>
                          </div>
                      </div>
                      <button onClick={() => setIsAiPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  
                  <div className="p-8 flex flex-col lg:flex-row gap-10">
                      <div className="flex-1 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Arrears Amount</p>
                                  <p className="text-2xl font-black text-red-600">₹{selectedBillForAi.totalAmount.toLocaleString()}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Due Date</p>
                                  <p className="text-2xl font-black text-slate-800">{selectedBillForAi.dueDate}</p>
                              </div>
                          </div>

                          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                              <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2"><Wand2 size={16}/> AI Recovery Logic</h4>
                              <p className="text-sm text-indigo-900 leading-relaxed font-medium italic">
                                  "Our AI suggests a two-pronged approach: A personalized gentle nudge via WhatsApp followed by a formal society notice if payment isn't cleared within 48 hours."
                              </p>
                          </div>

                          <div className="flex gap-4">
                              <button onClick={() => handleArrearsAi(selectedBillForAi)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-2">
                                  <RefreshCcw size={18} /> Regenerate Strategy
                              </button>
                          </div>
                      </div>

                      <div className="w-full lg:w-96 flex flex-col">
                          <div className="flex-1 bg-slate-900 rounded-[2rem] p-6 text-slate-300 font-mono text-[11px] leading-loose overflow-y-auto max-h-[400px] border border-slate-800 shadow-inner relative custom-scrollbar">
                              {aiLoading ? (
                                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                                      <Loader2 className="animate-spin text-indigo-500" size={40} />
                                      <p className="text-indigo-400 font-black animate-pulse uppercase text-[10px]">Analyzing Arrears Patterns...</p>
                                  </div>
                              ) : (
                                  <div className="animate-fade-in">
                                      {aiResult}
                                  </div>
                              )}
                          </div>
                          <div className="mt-4 flex gap-2">
                             <button className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-700">
                                 <MessageSquare size={16} /> WhatsApp Member
                             </button>
                             <button className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                 <Send size={18} />
                             </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Settings className="text-indigo-600" /> Professional Bill Customization</h2>
                        <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest">Brand your society's official documents</p>
                    </div>
                    <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Society Branding Logo</label>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                    {tempLayout.logo ? <img src={tempLayout.logo} className="h-full w-full object-contain" /> : <ImageIcon className="text-slate-300" size={32} />}
                                </div>
                                <div className="flex-1">
                                    <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoUpload} />
                                    <label htmlFor="logo-upload" className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm">
                                        <Upload size={14} /> Upload Logo
                                    </label>
                                    <p className="text-[10px] text-slate-400 mt-2 italic">PNG/JPG recommended (200x200)</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Footer Notes</label>
                                <button onClick={addFooterNote} className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-lg font-black uppercase flex items-center gap-1 hover:bg-slate-800 transition-all"><Plus size={12} /> Add Note</button>
                            </div>
                            <div className="space-y-3">
                                {tempFooterNotes.map((note, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-white p-2 rounded-xl border border-slate-100">
                                        <textarea 
                                            rows={2}
                                            className="flex-1 p-2 text-xs font-medium focus:ring-0 outline-none resize-none"
                                            value={note}
                                            onChange={(e) => handleFooterNoteChange(idx, e.target.value)}
                                            placeholder="e.g. Please pay before 10th to avoid penalty."
                                        />
                                        <button onClick={() => removeFooterNote(idx)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                             <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2"><Percent size={14} /> GST Inclusion</h4>
                                <button 
                                    onClick={() => setTempGstEnabled(!tempGstEnabled)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${tempGstEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-md ${tempGstEnabled ? 'left-5.5' : 'left-0.5'}`} style={{ left: tempGstEnabled ? '22px' : '2px' }}></div>
                                </button>
                             </div>
                             {tempGstEnabled && (
                                 <div className="flex items-center gap-4 animate-fade-in">
                                     <input 
                                        type="number" 
                                        className="w-20 p-2 bg-white border border-indigo-200 rounded-lg font-black text-indigo-900 text-sm"
                                        value={tempGstPercentage}
                                        onChange={(e) => setTempGstPercentage(Number(e.target.value))}
                                     />
                                     <span className="text-[10px] font-bold text-indigo-400 uppercase italic">Applied to principal charges</span>
                                 </div>
                             )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Columns size={14} /> Visible Bill Columns</h4>
                             <div className="grid grid-cols-2 gap-4">
                                {Object.keys(tempLayout.columns).map(col => (
                                    <label key={col} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-all shadow-sm">
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

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><LayoutTemplate size={14} /> Preview Style Templates</h4>
                             <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {[
                                    { id: 'MODERN', label: 'Bill for this Month (Modern)', desc: 'Clean layout for current charges only.' },
                                    { id: 'SPLIT_RECEIPT', label: 'Bill Top + Previous Receipt Down', desc: 'Combined invoice with payment proof.' },
                                    { id: 'CLASSIC', label: 'Classic Ledger / Corporate', desc: 'Formal business invoice format.' },
                                    { id: 'LEDGER', label: 'Detailed Member Ledger View', desc: 'Shows transactional history on bill.' },
                                    { id: 'MINIMAL', label: 'Blank Receipt (Manual Entry)', desc: 'Empty template for handwritten entries.' }
                                ].map(tpl => (
                                    <button 
                                        key={tpl.id}
                                        onClick={() => setTempLayout({ ...tempLayout, template: tpl.id as any })}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${tempLayout.template === tpl.id ? 'bg-indigo-50 border-indigo-600 shadow-md' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <p className={`text-sm font-black ${tempLayout.template === tpl.id ? 'text-indigo-900' : 'text-slate-800'}`}>{tpl.label}</p>
                                            {tempLayout.template === tpl.id && <Check size={16} className="text-indigo-600" />}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">{tpl.desc}</p>
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t mt-8">
                    <button onClick={() => setIsSettingsOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Discard Changes</button>
                    <button onClick={handleSaveGlobalSettings} className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <Save size={20} /> Save Professional Configuration
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {isPreviewOpen && previewBill && (
        <div className="fixed inset-0 bg-slate-900/95 flex flex-col items-center z-[120] p-4 overflow-y-auto backdrop-blur-md">
           <div className="sticky top-0 w-full max-w-[210mm] bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-2xl flex justify-between items-center gap-4 z-20">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><FileText size={24}/></div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Draft Preview: {activeSociety.billLayout?.template || 'MODERN'}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Ready for Official Dispatch</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => downloadPDF('invoice-render', `Bill_${previewBill.unitNumber}.pdf`)} className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all"><Download size={16} /> Export Final PDF</button>
                    <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-all"><X size={24}/></button>
                </div>
           </div>

           <div id="invoice-render" className="bg-white w-[210mm] min-h-[297mm] shadow-2xl mx-auto flex flex-col text-slate-800 relative">
                {activeSociety.billLayout?.template === 'MINIMAL' ? (
                    <div className="p-16 flex flex-col h-full items-center justify-center text-center opacity-30">
                         <div className="border-4 border-dashed border-slate-300 rounded-[4rem] p-24">
                            <Receipt size={120} className="mx-auto mb-8 text-slate-300" />
                            <h2 className="text-5xl font-black uppercase text-slate-400 tracking-tighter">Blank Society Receipt</h2>
                            <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-sm">Official Format for Manual Endorsement</p>
                         </div>
                    </div>
                ) : (
                    <div className="p-12 flex-1 flex flex-col">
                        <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-8 mb-10">
                            <div className="flex items-start gap-6">
                                {activeSociety.billLayout?.logo && (
                                    <div className="h-28 w-28 bg-white rounded-2xl p-1 flex items-center justify-center overflow-hidden border-2 border-slate-50 shadow-sm shrink-0">
                                        <img src={activeSociety.billLayout.logo} className="max-h-full max-w-full object-contain" />
                                    </div>
                                )}
                                <div className="max-w-md">
                                    <h1 className="text-3xl font-black text-indigo-700 tracking-tighter uppercase leading-none">{activeSociety.name}</h1>
                                    <p className="text-xs text-slate-500 mt-3 font-bold leading-relaxed">{activeSociety.address}</p>
                                    <div className="flex gap-4 mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 inline-flex px-3 py-1 rounded-full border border-slate-100">
                                        <span>REG: {activeSociety.registrationNumber}</span>
                                        <span className="w-px h-3 bg-slate-300"></span>
                                        <span className="text-indigo-600">GST: {activeSociety.gstNumber || 'UNREGISTERED'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none opacity-10">INVOICE</h2>
                                <div className="mt-8 space-y-1">
                                    <p className="text-xs font-black uppercase text-indigo-600 tracking-widest">Bill Period</p>
                                    <p className="text-xl font-black text-slate-800">{formatBillingMonth(previewBill.billMonth)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-10 bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100">
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Member / Payee</h4>
                                <p className="text-2xl font-black text-slate-800 leading-tight">{previewBill.residentName}</p>
                                <p className="text-sm font-bold text-indigo-600 mt-1">FLAT / UNIT NO: {previewBill.unitNumber}</p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Billing Reference</h4>
                                <p className="text-sm font-bold text-slate-700">Invoice No: <span className="font-mono text-indigo-600">{previewBill.id}</span></p>
                                <p className="text-sm font-bold text-slate-700 mt-1">Due Date: <span className="text-red-600 font-black underline decoration-2">{previewBill.dueDate}</span></p>
                            </div>
                        </div>

                        <table className="w-full mb-10 border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    {activeSociety.billLayout?.columns.description && <th className="p-4 text-left uppercase text-[10px] tracking-widest font-black">Particulars / Charges</th>}
                                    {activeSociety.billLayout?.columns.type && <th className="p-4 text-center uppercase text-[10px] tracking-widest font-black">Type</th>}
                                    {activeSociety.billLayout?.columns.rate && <th className="p-4 text-right uppercase text-[10px] tracking-widest font-black">Rate / Unit</th>}
                                    {activeSociety.billLayout?.columns.amount && <th className="p-4 text-right uppercase text-[10px] tracking-widest font-black">Net Amount</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {previewBill.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        {activeSociety.billLayout?.columns.description && <td className="p-5 font-bold text-slate-700 text-sm">{item.description}</td>}
                                        {activeSociety.billLayout?.columns.type && <td className="p-5 text-center text-[10px] font-black text-slate-400 uppercase">{item.type}</td>}
                                        {activeSociety.billLayout?.columns.rate && <td className="p-5 text-right font-medium text-slate-500 text-sm">₹{item.rate.toLocaleString()}</td>}
                                        {activeSociety.billLayout?.columns.amount && <td className="p-5 text-right font-black text-slate-900 text-sm">₹{item.amount.toLocaleString()}</td>}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-900">
                                <tr className="bg-slate-50">
                                    <td colSpan={Object.values(activeSociety.billLayout?.columns || {}).filter(v => v).length - 1} className="p-5 text-right text-slate-400 uppercase tracking-widest text-[10px] font-black">Total Principal Charges</td>
                                    <td className="p-5 text-right text-slate-700 font-bold">₹{previewBill.items.reduce((s, i) => s + i.amount, 0).toLocaleString()}</td>
                                </tr>
                                {previewBill.gstAmount ? (
                                    <tr className="text-indigo-600 font-bold">
                                        <td colSpan={Object.values(activeSociety.billLayout?.columns || {}).filter(v => v).length - 1} className="p-4 text-right text-[10px] uppercase tracking-widest">Tax Inclusion (GST {activeSociety.gstPercentage}%)</td>
                                        <td className="p-4 text-right">₹{previewBill.gstAmount.toLocaleString()}</td>
                                    </tr>
                                ) : null}
                                <tr className="bg-indigo-600 text-white font-black text-3xl">
                                    <td colSpan={Object.values(activeSociety.billLayout?.columns || {}).filter(v => v).length - 1} className="p-6 text-right uppercase tracking-tighter">Gross Amount Payable</td>
                                    <td className="p-6 text-right">₹{previewBill.totalAmount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {activeSociety.billLayout?.template === 'SPLIT_RECEIPT' && lastReceipt && (
                            <div className="mt-12 pt-12 border-t-8 border-dashed border-slate-100 animate-in slide-in-from-bottom-8 duration-700">
                                <div className="bg-emerald-50/50 p-10 rounded-[3rem] border-2 border-emerald-100 relative overflow-hidden">
                                    <div className="absolute top-6 right-10 bg-emerald-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Last Transaction Receipt</div>
                                    <h4 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-3"><Check className="text-emerald-600" size={28} /> Payment Acknowledgment</h4>
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <p className="text-sm leading-relaxed text-emerald-800 font-medium">
                                                We gratefully acknowledge receipt of <span className="font-black text-emerald-950">₹{lastReceipt.totalAmount.toLocaleString()}</span> against previous month dues.
                                            </p>
                                            <div className="flex gap-8 text-[10px] font-black uppercase text-emerald-600/60">
                                                <span>MODE: {lastReceipt.paymentDetails?.mode}</span>
                                                <span>REF: {lastReceipt.paymentDetails?.reference}</span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] font-black uppercase text-emerald-400">Payment Date</p>
                                            <p className="text-lg font-black text-emerald-900">{lastReceipt.paymentDetails?.date}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 italic mt-2">Verified & Processed by System</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSociety.billLayout?.template === 'LEDGER' && (
                             <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Member Ledger Quick Reference</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold border-b border-slate-200 pb-2">
                                        <span>Opening Arrears</span>
                                        <span>₹{previewBill.residentId ? bills.find(b => b.residentId === previewBill.residentId && b.status === PaymentStatus.OVERDUE)?.totalAmount.toLocaleString() || '0' : '0'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-black text-indigo-700">
                                        <span>Current Assessment</span>
                                        <span>₹{previewBill.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                             </div>
                        )}

                        <div className="mt-auto pt-12">
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Important Disclaimers</h4>
                                    <div className="space-y-3">
                                        {(activeSociety.footerNotes || [activeSociety.footerNote]).map((note, idx) => (
                                            <p key={idx} className="text-[10px] text-slate-500 leading-relaxed font-bold italic border-l-2 border-indigo-100 pl-3"> {note}</p>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-end">
                                    <div className="h-20 w-56 border-b-2 border-slate-300 mb-3 flex items-center justify-center italic text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">Signature</div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">{activeSociety.processedBy}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Authorized Official Signatory</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="h-10 bg-indigo-600 w-full flex items-center justify-between px-12 text-[9px] text-indigo-100 font-black uppercase tracking-[0.2em]">
                    <span>Securely Generated by SocietyLink OS</span>
                    <div className="flex gap-6">
                        <span>IP: 192.168.1.1</span>
                        <span>TS: {new Date().toLocaleString()}</span>
                    </div>
                </div>
           </div>
        </div>
      )}

      {/* GENERATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl my-auto animate-in zoom-in duration-200 border border-white/20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tighter underline decoration-indigo-600 decoration-4 underline-offset-8 uppercase">Process Maintenance</h2>
                    <p className="text-xs text-slate-500 mt-4 uppercase font-bold tracking-widest">Select Scope & Period for Assessment</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={28}/></button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-8">
                <div className="bg-slate-50 p-2 rounded-[1.5rem] flex gap-2 border border-slate-200">
                    <button type="button" onClick={() => setGenerationMode('INDIVIDUAL')} className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${generationMode === 'INDIVIDUAL' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}><User size={18} /> Single Flat</button>
                    <button type="button" onClick={() => setGenerationMode('ALL')} className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${generationMode === 'ALL' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}><Layers size={18} /> Bulk Run (All)</button>
                </div>
                {generationMode === 'INDIVIDUAL' && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Select Target Member</label>
                        <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" required value={selectedResidentId} onChange={e => setSelectedResidentId(e.target.value)}>
                            <option value="">-- CHOOSE RESIDENT --</option>
                            {residents.map(r => <option key={r.id} value={r.id}>{r.unitNumber} | {r.name}</option>)}
                        </select>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Billing Month</label>
                        <input type="month" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black focus:ring-4 focus:ring-indigo-100 outline-none" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Payment Due Date</label>
                        <input type="date" required className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black focus:ring-4 focus:ring-indigo-100 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                    <button type="submit" className="px-14 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95">Run Batch Execution</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
