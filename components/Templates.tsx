
import React, { useState } from 'react';
import StandardToolbar from './StandardToolbar';
import { Copy, FileText, Check, Sparkles, Loader2, Wand2, Send, History, X, MessageSquarePlus } from 'lucide-react';
import { generateCustomTemplate } from '../services/geminiService';

interface TemplatesProps {
    balances?: { cash: number; bank: number };
}

const SAMPLE_TEMPLATES = {
    'CIRCULARS': [
        {
            title: 'Festival Celebration',
            content: "Dear Residents,\n\nWe are pleased to inform you that the society is organizing a celebration for [Festival Name] on [Date] at [Time].\n\nVenue: Community Hall\n\nAll members are requested to join us for the celebration followed by dinner.\n\nWarm Regards,\nSecretary"
        },
        {
            title: 'Water Tank Cleaning',
            content: "Dear Residents,\n\nThis is to inform you that the water tank cleaning is scheduled for [Date]. Water supply will be disrupted from [Start Time] to [End Time].\n\nPlease store sufficient water for your usage.\n\nRegards,\nMaintenance Team"
        }
    ],
    'NOTICES': [
        {
            title: 'AGM Notice',
            content: "NOTICE\n\nThe Annual General Meeting (AGM) of the society will be held on [Date] at [Time] in the Society Office.\n\nAgenda:\n1. Approval of Accounts\n2. Appointment of Auditor\n3. Any other matter with permission of Chair\n\nAll members are requested to attend.\n\nSecretary"
        },
        {
            title: 'Renovation Rules',
            content: "NOTICE\n\nMembers planning renovation work in their flats are requested to obtain prior NOC from the committee. Work is permitted only between 9 AM and 6 PM on weekdays.\n\nDebris must be cleared daily.\n\nSociety Manager"
        }
    ],
    'REMINDERS': [
        {
            title: 'Maintenance Due Payment',
            content: "Dear Member,\n\nThis is a gentle reminder that your maintenance bill for [Month] amounting to Rs. [Amount] is due. Please clear the dues by [Date] to avoid late payment interest.\n\nIgnore if already paid.\n\nTreasurer"
        },
        {
            title: 'Parking Sticker',
            content: "Dear Residents,\n\nPlease collect your new vehicle parking stickers from the society office before [Date]. Vehicles without stickers will not be allowed inside the premises after this date.\n\nSecurity In-charge"
        }
    ],
    'MINUTES': [
        {
             title: 'Annual General Meeting (AGM)',
             content: "MINUTES OF THE ANNUAL GENERAL MEETING\n\nHeld on: [Date]\nVenue: Society Premises\n\nPresent:\n- [Chairman Name] (Chairman)\n- [Secretary Name] (Secretary)\n- [Number] Members (Attendance sheet attached)\n\nPROCEEDINGS:\n\n1. Reading of Previous Minutes:\n   The minutes of the last AGM held on [Date] were read by the Secretary and confirmed unanimously.\n   Proposed by: [Name]\n   Seconded by: [Name]\n\n2. Adoption of Accounts:\n   The Audited Accounts for the year ended 31st March [Year] were presented. The Treasurer explained the key expenses. The accounts were adopted unanimously.\n\n3. Appointment of Auditor:\n   M/s [Auditor Name] were appointed as Statutory Auditors for the next Financial Year.\n\nVote of Thanks given by the Chairman."
        },
        {
             title: 'Managing Committee Meeting (MCM)',
             content: "MINUTES OF MANAGING COMMITTEE MEETING\n\nDate: [Date]\nTime: [Time]\n\nAttendees: [List of Committee Members]\n\nAGENDA ITEMS DISCUSSED:\n\n1. Review of Monthly Expenses:\n   - Expenses for [Month] totaling Rs. [Amount] were reviewed and approved.\n   - Security agency bill was passed for payment.\n\n2. Membership Transfer:\n   - Application from Mr. [Seller] to transfer Flat [No] to Mr. [Buyer] was reviewed.\n   - RESOLUTION: Transfer approved. Share certificate to be endorsed.\n\n3. Leakage Complaint:\n   - Complaint from Flat [No] regarding terrace leakage discussed.\n   - Decided to inspect with plumber on [Date].\n\nHon. Secretary"
        }
    ]
};

const Templates: React.FC<TemplatesProps> = ({ balances }) => {
  const [activeCategory, setActiveCategory] = useState<'CIRCULARS' | 'NOTICES' | 'REMINDERS' | 'MINUTES'>('CIRCULARS');
  const [copiedIndex, setCopiedIndex] = useState<number | string | null>(null);

  // AI Creator State
  const [aiRequest, setAiRequest] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string, content: string } | null>(null);

  const handleCopy = (text: string, index: number | string) => {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiRequest.trim()) return;

      setIsAiLoading(true);
      try {
          const draft = await generateCustomTemplate(aiRequest);
          // Split first line as title
          const lines = draft.split('\n');
          const title = lines[0].replace('Subject:', '').trim() || 'AI Generated Template';
          const content = lines.slice(1).join('\n').trim() || draft;
          setAiResult({ title, content });
      } catch (err) {
          setAiResult({ title: 'Error', content: 'Failed to generate template. Please try again.' });
      } finally {
          setIsAiLoading(false);
      }
  };

  const clearAi = () => {
      setAiResult(null);
      setAiRequest('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <FileText className="text-indigo-600" />
                    Standard Document Vault
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Professional templates and AI-powered document drafting.</p>
             </div>
        </div>

        <StandardToolbar 
            onSearch={() => {}} 
            onPrint={() => window.print()}
            balances={balances}
        />

        {/* --- AI TEMPLATE CREATOR --- */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Sparkles size={160} />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                        <Wand2 className="text-indigo-200" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter">AI Template Creator</h3>
                    </div>
                    <p className="text-indigo-100 text-sm leading-relaxed max-w-xl">
                        Can't find the right template? Describe the document you need (e.g., "NOC for loan", "Permission letter for pet", "Warning letter for noise"), and our AI will draft a professional version for you.
                    </p>
                    
                    <form onSubmit={handleAiGenerate} className="relative group">
                        <input 
                            type="text"
                            placeholder="e.g., Draft an NOC for a bank loan for Flat 501..."
                            className="w-full pl-4 pr-32 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl outline-none focus:bg-white focus:text-indigo-900 transition-all font-bold placeholder:text-white/50"
                            value={aiRequest}
                            onChange={(e) => setAiRequest(e.target.value)}
                        />
                        <button 
                            type="submit"
                            disabled={isAiLoading || !aiRequest.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-indigo-700 px-6 py-2 rounded-xl font-black text-xs hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            DRAFT NOW
                        </button>
                    </form>
                </div>

                {aiResult && (
                    <div className="w-full lg:w-1/2 animate-in slide-in-from-right-4 duration-500">
                        <div className="bg-white text-slate-800 rounded-2xl p-6 shadow-2xl border border-white/20 relative group">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                                    <Sparkles size={14} /> AI Draft Result
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleCopy(aiResult.content, 'ai-res')}
                                        className={`p-2 rounded-lg transition-colors ${copiedIndex === 'ai-res' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                                        title="Copy response"
                                    >
                                        {copiedIndex === 'ai-res' ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                    <button onClick={clearAi} className="p-2 bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                <h4 className="font-black text-indigo-900 text-sm underline">{aiResult.title}</h4>
                                <div className="text-xs leading-loose text-slate-600 whitespace-pre-wrap font-medium">
                                    {aiResult.content}
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">Personalized Draft by Gemini 3 Flash</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- STATIC LIBRARY --- */}
        <div className="flex items-center gap-3 px-1 border-b border-slate-100 pb-2">
             <History className="text-slate-400" size={20} />
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Static Library Reference</h3>
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
            {Object.keys(SAMPLE_TEMPLATES).map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as any)}
                    className={`px-6 py-2 text-sm font-bold rounded-t-xl transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SAMPLE_TEMPLATES[activeCategory].map((template, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                            <FileText size={18} className="text-indigo-600" />
                            {template.title}
                        </h3>
                        <button 
                            onClick={() => handleCopy(template.content, idx)}
                            className={`p-2 rounded-xl text-sm font-medium flex items-center gap-1 transition-all ${copiedIndex === idx ? 'bg-green-100 text-green-700 shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
                        >
                            {copiedIndex === idx ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
                            <span className="text-[10px] font-black uppercase">{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl text-[13px] text-slate-600 whitespace-pre-wrap font-medium leading-relaxed border border-slate-100 flex-1 overflow-auto max-h-96 custom-scrollbar">
                        {template.content}
                    </div>
                    <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>Standard Reference</span>
                        <span className="text-indigo-400">Ready to Edit</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default Templates;
