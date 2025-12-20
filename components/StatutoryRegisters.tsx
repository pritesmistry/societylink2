
import React, { useState, useMemo } from 'react';
import { Resident, Society, Bill, Expense, Income } from '../types';
import { generateStatutoryDraft } from '../services/geminiService';
import { Download, Book, FileText, UserCheck, Users, FileCheck, ClipboardCheck, ScrollText, Landmark, CalendarClock, Building, FolderOpen, Printer, Copy, Check, Briefcase, Shield, Archive, Sparkles, Wand2, Loader2, X, AlertCircle, Scale, MessageSquareCode } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface StatutoryRegistersProps {
  residents: Resident[];
  activeSociety: Society;
  bills?: Bill[];
  expenses?: Expense[];
  incomes?: Income[];
}

type RegisterType = 'I_REGISTER' | 'J_REGISTER' | 'SHARE_REGISTER' | 'NOMINATION_REGISTER' | 'AUDIT_REPORT' | 'O_FORM' | 'RULES_REGULATIONS' | 'INCOME_TAX' | 'DUE_DATES' | 'CONVEYANCE_DEED' | 'SOCIETY_FORMS' | 'FIXED_DEPOSIT' | 'IMPORTANT_DOCUMENTS' | 'INSURANCE';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const QUICK_SCENARIOS = [
    { label: 'Defaulter Notice', type: 'Legal Notice', context: 'Member in Flat 402 has not paid dues for 6 months. Total outstanding ₹45,000. Final warning before Section 101 action.' },
    { label: 'Audit Reply', type: 'Form O Response', context: 'Auditor objected to high maintenance expense in May. Reply that it was for emergency pump replacement approved in GBM.' },
    { label: 'Pet Policy', type: 'Society Rule', context: 'Detailed policy for pet owners including registration, leash rules, and cleaning penalties.' },
    { label: 'Parking Dispute', type: 'Committee Resolution', context: 'Resolution to implement rotational parking for the 10 available stilt slots among 15 owners.' }
];

const StatutoryRegisters: React.FC<StatutoryRegistersProps> = ({ residents, activeSociety, bills = [], expenses = [], incomes = [] }) => {
  const [activeTab, setActiveTab] = useState<RegisterType>('I_REGISTER');
  const [selectedFormIndex, setSelectedFormIndex] = useState(0);
  const [copiedForm, setCopiedForm] = useState(false);

  // AI Assistant State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [aiTone, setAiTone] = useState('Formal & Legal');
  const [aiResult, setAiResult] = useState('');

  const members = residents.filter(r => r.occupancyType === 'Owner');

  const handleAiDraft = async () => {
      if (!aiContext) return;
      setAiLoading(true);
      try {
          const docType = activeTab.replace('_', ' ').toLowerCase();
          const draft = await generateStatutoryDraft(docType, aiContext, aiTone);
          setAiResult(draft);
      } catch (err) {
          setAiResult("Assistant encountered an error. Please try again.");
      } finally {
          setAiLoading(false);
      }
  };

  const handleApplyDraft = () => {
      // In a real app, this would append to a list or state
      alert("Draft copied to clipboard and ready for manual filing!");
      navigator.clipboard.writeText(aiResult);
  };

  // --- STATUTORY DATA (UNCHANGED) ---
  const STATUTORY_DEADLINES = [
    { title: "Finalization of Accounts", date: "15th May", description: "Books of accounts for previous FY must be finalized.", act: "MCS Act Rule 61" },
    { title: "Statutory Audit", date: "31st July", description: "Statutory Audit must be completed by this date.", act: "Section 81" },
    { title: "Annual General Meeting", date: "30th September", description: "AGM must be held within 6 months of FY end.", act: "Section 75(1)" }
  ];

  const SOCIETY_RULES = [
    { section: "1. General Discipline", rules: ["Loud music prohibited after 10 PM.", "No smoking in common areas."] },
    { section: "2. Parking", rules: ["Park in allotted slots only.", "Society stickers mandatory."] }
  ];

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const opt = { margin: 0.3, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={() => alert("Changes saved to register.")}
        onPrint={() => downloadPDF('register-container', `${activeTab}_${activeSociety.name}.pdf`)}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Statutory Registers & Compliance</h2>
           <p className="text-sm text-slate-500 mt-1">Official society records, Audit reports, and Tax filings.</p>
        </div>
        <button 
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black transition-all shadow-lg ${isAiOpen ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
            {isAiOpen ? <X size={18} /> : <Sparkles size={18} />}
            {isAiOpen ? 'Close Smart Assistant' : 'Smart Compliance Assistant'}
        </button>
      </div>

      {/* --- AI ASSISTANT PANEL --- */}
      {isAiOpen && (
          <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-200 p-8 rounded-3xl animate-in slide-in-from-top-4 duration-300 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Scale size={120} className="text-indigo-900" />
              </div>

              <div className="flex flex-col lg:flex-row gap-10 relative z-10">
                  <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                          <Wand2 className="text-indigo-600" />
                          <h3 className="text-xl font-black text-indigo-900">AI Statutory Drafting</h3>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Document Context / Raw Notes</label>
                              <textarea 
                                rows={4}
                                className="w-full p-4 rounded-2xl border border-indigo-100 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-700 bg-white/80"
                                placeholder="Describe what you need to draft... (e.g., Response to an audit query about sinking fund usage)"
                                value={aiContext}
                                onChange={e => setAiContext(e.target.value)}
                              />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Target Document</label>
                                  <div className="p-3 bg-white border border-indigo-100 rounded-xl font-bold text-indigo-900 text-sm">
                                      {activeTab.replace('_', ' ')}
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Drafting Tone</label>
                                  <select 
                                    className="w-full p-3 rounded-xl border border-indigo-100 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    value={aiTone}
                                    onChange={e => setAiTone(e.target.value)}
                                  >
                                      <option>Formal & Legal</option>
                                      <option>Firm & Warning</option>
                                      <option>Explanatory & Neutral</option>
                                      <option>Strictly Procedural</option>
                                  </select>
                              </div>
                          </div>

                          <div>
                              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Quick Scenarios</label>
                              <div className="flex flex-wrap gap-2">
                                  {QUICK_SCENARIOS.map((q, idx) => (
                                      <button 
                                        key={idx}
                                        onClick={() => { setAiContext(q.context); setAiTone('Formal & Legal'); }}
                                        className="bg-white/50 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                      >
                                          {q.label}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <button 
                            onClick={handleAiDraft}
                            disabled={aiLoading || !aiContext}
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <MessageSquareCode size={20} />}
                            {aiLoading ? 'Drafting Statutory Record...' : 'Generate Compliance Draft'}
                          </button>
                      </div>
                  </div>

                  <div className="w-full lg:w-96 flex flex-col">
                      <div className="flex-1 bg-slate-900 rounded-3xl p-6 text-slate-300 font-mono text-xs leading-relaxed overflow-y-auto max-h-[400px] border border-slate-800 shadow-inner relative group">
                          {aiResult ? (
                              <div className="animate-fade-in">
                                  <div className="sticky top-0 right-0 flex justify-end pb-4 bg-slate-900">
                                      <button 
                                        onClick={handleApplyDraft}
                                        className="bg-green-600 text-white px-4 py-1.5 rounded-full font-black text-[10px] uppercase flex items-center gap-1.5 hover:bg-green-500 shadow-lg"
                                      >
                                          <Check size={12} strokeWidth={4} /> Apply Draft
                                      </button>
                                  </div>
                                  <p className="whitespace-pre-wrap">{aiResult}</p>
                              </div>
                          ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-6">
                                  <AlertCircle size={40} className="mb-4 opacity-20" />
                                  <p>Select a scenario or type context to see the AI draft here.</p>
                              </div>
                          )}
                          {aiLoading && (
                              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                              </div>
                          )}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-3 text-center uppercase tracking-widest font-black italic">Powered by Gemini 3 Pro • Legal Assistant Mode</p>
                  </div>
              </div>
          </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          <button onClick={() => setActiveTab('I_REGISTER')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'I_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Book size={16} /> "I" Register</button>
          <button onClick={() => setActiveTab('J_REGISTER')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'J_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Users size={16} /> "J" Register</button>
          <button onClick={() => setActiveTab('NOMINATION_REGISTER')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'NOMINATION_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><UserCheck size={16} /> Nomination</button>
          <button onClick={() => setActiveTab('RULES_REGULATIONS')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'RULES_REGULATIONS' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><ScrollText size={16} /> Rules</button>
          <button onClick={() => setActiveTab('O_FORM')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'O_FORM' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><ClipboardCheck size={16} /> "O" Form</button>
          <button onClick={() => setActiveTab('DUE_DATES')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'DUE_DATES' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><CalendarClock size={16} /> Due Dates</button>
          <button onClick={() => setActiveTab('CONVEYANCE_DEED')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'CONVEYANCE_DEED' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Building size={16} /> Conveyance</button>
      </div>

      <div className="bg-slate-200 p-4 md:p-8 rounded-xl overflow-auto flex justify-center border border-slate-300 min-h-[500px]">
         <div 
            id="register-container" 
            className={`bg-white p-[10mm] shadow-xl text-slate-800 ${['RULES_REGULATIONS', 'DUE_DATES', 'CONVEYANCE_DEED', 'O_FORM'].includes(activeTab) ? 'w-[210mm]' : 'w-[297mm]'} min-h-[297mm]`}
         >
             {/* HEADER */}
             <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold uppercase">{activeSociety.name}</h1>
                <p className="text-sm text-slate-600">{activeSociety.address}</p>
                <h2 className="text-lg font-bold mt-4 bg-slate-100 inline-block px-4 py-1 rounded border border-slate-300 uppercase">
                    {activeTab.replace('_', ' ')}
                </h2>
             </div>

             {/* RENDER DYNAMIC TABLES BASED ON TAB */}
             {activeTab === 'I_REGISTER' && (
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border border-slate-300 p-2">Sr No</th>
                            <th className="border border-slate-300 p-2 text-left">Full Name of Member</th>
                            <th className="border border-slate-300 p-2 text-left">Address (Unit)</th>
                            <th className="border border-slate-300 p-2">Date of Admission</th>
                            <th className="border border-slate-300 p-2">Cert No</th>
                            <th className="border border-slate-300 p-2">Shares</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((m, idx) => (
                            <tr key={m.id}>
                                <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                                <td className="border border-slate-300 p-2">{m.name}</td>
                                <td className="border border-slate-300 p-2">{m.unitNumber}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.membershipDate || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.shareCertificateNumber || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">5</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}

             {activeTab === 'RULES_REGULATIONS' && (
                 <div className="space-y-6">
                    {SOCIETY_RULES.map((section, idx) => (
                        <div key={idx} className="mb-4">
                            <h3 className="font-bold text-slate-800 text-lg mb-2 border-b-2 border-slate-200 pb-1">{section.section}</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {section.rules.map((rule, rIdx) => (
                                    <li key={rIdx} className="text-sm text-slate-700">{rule}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                 </div>
             )}

             {activeTab === 'O_FORM' && (
                 <div className="space-y-6">
                     <p className="text-xs italic text-center mb-4 uppercase font-bold text-slate-400">Rectification Report under Section 82/87</p>
                     <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead className="bg-slate-100 text-xs">
                            <tr>
                                <th className="border border-slate-300 p-3 w-16">Sr No</th>
                                <th className="border border-slate-300 p-3">Audit Objection</th>
                                <th className="border border-slate-300 p-3">Society Explanation</th>
                                <th className="border border-slate-300 p-3 w-32">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-20 align-top">
                                <td className="border border-slate-300 p-2 text-center">1</td>
                                <td className="border border-slate-300 p-2">Voucher missing for repairs (₹2,500)</td>
                                <td className="border border-slate-300 p-2 font-medium italic text-indigo-700">
                                    [Drafted by Assistant] Duplicate voucher obtained from vendor and filed.
                                </td>
                                <td className="border border-slate-300 p-2 text-center text-green-600 font-bold">Rectified</td>
                            </tr>
                        </tbody>
                     </table>
                 </div>
             )}

             {/* Footer Signatures for all reports */}
             <div className="mt-16 flex justify-between px-10">
                  <div className="text-center w-32 border-t border-slate-300 pt-2 font-bold text-xs uppercase">Secretary</div>
                  <div className="text-center w-32 border-t border-slate-300 pt-2 font-bold text-xs uppercase">Chairman</div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default StatutoryRegisters;
