
import React, { useState } from 'react';
import { MeetingMinutes, Society } from '../types';
import { generateMinutesFromNotes, generateMinutesDraft } from '../services/geminiService';
import { Plus, Download, Calendar, Users, FileText, Sparkles, Loader2, Trash2, FileInput, Wand2, X, Check, Info, ShieldAlert, Zap, Building2, Gavel } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface MinutesProps {
  minutesList: MeetingMinutes[];
  activeSociety: Society;
  onAddMinute: (minute: MeetingMinutes) => void;
  onDeleteMinute: (id: string) => void;
  balances?: { cash: number; bank: number };
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const QUICK_AGENDAS = [
    { label: 'Security Review', topic: 'Review of security agency performance and CCTV upgrade proposal.', type: 'MCM' },
    { label: 'Maintenance Hike', topic: 'Proposed 15% hike in maintenance charges due to rising municipal taxes.', type: 'AGM' },
    { label: 'Festival Plan', topic: 'Budgeting and cultural committee formation for upcoming Annual Day.', type: 'MCM' },
    { label: 'Vendor Dispute', topic: 'Non-performance of painting contractor and pending payment resolution.', type: 'MCM' }
];

const Minutes: React.FC<MinutesProps> = ({ minutesList, activeSociety, onAddMinute, onDeleteMinute, balances }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Drafting State
  const [aiTopic, setAiTopic] = useState('');
  const [aiAudience, setAiAudience] = useState('Managing Committee');
  const [aiTone, setAiTone] = useState('Professional');
  const [aiResult, setAiResult] = useState('');

  const [formData, setFormData] = useState<Partial<MeetingMinutes>>({
      title: '',
      date: new Date().toISOString().split('T')[0],
      attendees: '',
      agenda: '',
      discussion: '',
      actionItems: ''
  });

  const handleAIDraft = async () => {
    if (!aiTopic) return;
    setIsLoading(true);
    try {
        const result = await generateMinutesDraft(aiTopic, aiAudience, aiTone);
        setAiResult(result);
    } catch (err) {
        setAiResult("Error generating draft. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const applyAIDraft = () => {
    if (!aiResult) return;
    
    // Simple parser for the AI format [TITLE], [AGENDA], etc.
    const extract = (tag: string) => {
        const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[|$)`, 'i');
        const match = aiResult.match(regex);
        return match ? match[1].trim() : '';
    };

    setFormData(prev => ({
        ...prev,
        title: extract('TITLE') || prev.title,
        agenda: extract('AGENDA') || prev.agenda,
        discussion: extract('DISCUSSION') || prev.discussion,
        actionItems: extract('ACTION ITEMS') || prev.actionItems
    }));
    setIsDraftingAI(false);
    setAiResult('');
    setAiTopic('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    onAddMinute({
        id: `M${Date.now()}`,
        societyId: activeSociety.id,
        title: formData.title,
        date: formData.date!,
        attendees: formData.attendees || '',
        agenda: formData.agenda || '',
        discussion: formData.discussion || '',
        actionItems: formData.actionItems || ''
    });
    setIsModalOpen(false);
    setFormData({ title: '', date: new Date().toISOString().split('T')[0], attendees: '', agenda: '', discussion: '', actionItems: '' });
  };

  const downloadPDF = (minute: MeetingMinutes) => {
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; color: #333;">
            <h1 style="text-align: center; text-transform: uppercase; margin-bottom: 5px;">${activeSociety.name}</h1>
            <p style="text-align: center; font-size: 14px; color: #666; margin-bottom: 30px;">${activeSociety.address}</p>
            <h2 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">MINUTES OF MEETING</h2>
            <div style="margin-bottom: 20px;">
                <p><strong>Meeting:</strong> ${minute.title}</p>
                <p><strong>Date:</strong> ${minute.date}</p>
                <p><strong>Attendees:</strong> ${minute.attendees}</p>
            </div>
            <h3 style="background: #f3f4f6; padding: 5px 10px; border-left: 4px solid #4f46e5;">Agenda</h3>
            <p style="white-space: pre-wrap; margin-bottom: 20px;">${minute.agenda}</p>
            <h3 style="background: #f3f4f6; padding: 5px 10px; border-left: 4px solid #4f46e5;">Discussion</h3>
            <p style="white-space: pre-wrap; margin-bottom: 20px;">${minute.discussion}</p>
            <h3 style="background: #f3f4f6; padding: 5px 10px; border-left: 4px solid #4f46e5;">Action Items</h3>
            <p style="white-space: pre-wrap; margin-bottom: 40px;">${minute.actionItems}</p>
        </div>
    `;
    const opt = { margin: 0.5, filename: `Minutes_${minute.date}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <StandardToolbar onSave={() => setIsModalOpen(true)} balances={balances} />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <Gavel className="text-indigo-600" size={24} />
                    Meeting Minutes Archive
                </h2>
                <p className="text-sm text-slate-500 mt-1">Official proceedings and resolutions of the society.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => { setIsDraftingAI(true); setIsModalOpen(true); }} 
                    className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-100 transition-all font-bold shadow-sm"
                >
                    <Sparkles size={18} />
                    Draft with AI
                </button>
                <button 
                    onClick={() => { setIsDraftingAI(false); setIsModalOpen(true); }} 
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all font-bold shadow-lg"
                >
                    <Plus size={18} />
                    Manual Record
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {minutesList.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-slate-500">No meeting minutes found.</p>
                    <p className="text-sm text-slate-400 mt-1">Start by recording an MCM or AGM.</p>
                </div>
            ) : (
                minutesList.map(minute => (
                    <div key={minute.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{minute.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg font-bold"><Calendar size={14} className="text-indigo-500" /> {minute.date}</span>
                                    <span className="flex items-center gap-1.5"><Users size={14} /> {minute.attendees.split(',').length} Attendees</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => downloadPDF(minute)} className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm">
                                    <Download size={20} />
                                </button>
                                <button onClick={() => onDeleteMinute(minute.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div>
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500" /> Agenda
                                 </h4>
                                 <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[120px]">
                                     {minute.agenda}
                                 </div>
                             </div>
                             <div className="md:col-span-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Info size={14} className="text-indigo-500" /> Key Discussions & Decisions
                                 </h4>
                                 <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[120px]">
                                     {minute.discussion}
                                 </div>
                                 {minute.actionItems && (
                                     <div className="mt-4">
                                         <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Action Items</h4>
                                         <div className="text-xs text-slate-600 font-bold bg-green-50/50 p-3 rounded-xl border border-green-100 italic">
                                             {minute.actionItems}
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* --- MAIN MODAL --- */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[100] backdrop-blur-md overflow-y-auto py-10 px-4">
                <div className="bg-white rounded-3xl p-8 w-full max-w-5xl shadow-2xl my-auto animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <FileText className="text-indigo-600" size={32} />
                                {isDraftingAI ? 'AI Minutes Assistant' : 'Record New Meeting Minutes'}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {isDraftingAI ? 'Generate formal proceedings from simple topics.' : 'Manually record society resolutions and member points.'}
                            </p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-full"><X size={24}/></button>
                    </div>

                    {isDraftingAI ? (
                        /* --- AI DRAFTING VIEW --- */
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Main Discussion Topic / Subject *</label>
                                        <textarea 
                                            rows={4}
                                            className="w-full p-4 rounded-2xl border border-indigo-200 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-lg leading-relaxed shadow-sm"
                                            placeholder="What was the meeting about? (e.g. Major terrace leakage repairs and sinking fund usage)"
                                            value={aiTopic}
                                            onChange={e => setAiTopic(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Participant Level (Audience)</label>
                                            <select 
                                                className="w-full p-3 rounded-xl border border-indigo-100 bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={aiAudience}
                                                onChange={e => setAiAudience(e.target.value)}
                                            >
                                                <option>Managing Committee</option>
                                                <option>Annual General Body (All Members)</option>
                                                <option>Special General Body</option>
                                                <option>Security/Staff Meeting</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Desired Language Tone</label>
                                            <select 
                                                className="w-full p-3 rounded-xl border border-indigo-100 bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={aiTone}
                                                onChange={e => setAiTone(e.target.value)}
                                            >
                                                <option>Professional & Objective</option>
                                                <option>Neutral & Concise</option>
                                                <option>Strict & Disciplinary</option>
                                                <option>Elaborate & Detailed</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <label className="block text-[10px] font-black text-indigo-400 uppercase mb-3">Quick Agendas</label>
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_AGENDAS.map((q, idx) => (
                                                <button 
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => { setAiTopic(q.topic); setAiAudience(q.type === 'AGM' ? 'Annual General Body (All Members)' : 'Managing Committee'); }}
                                                    className="bg-white border border-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm"
                                                >
                                                    {q.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
                                        <Zap className="mb-4 opacity-50" size={32} />
                                        <h3 className="text-xl font-black mb-2">AI Preview</h3>
                                        <p className="text-xs text-indigo-100 leading-relaxed mb-6">
                                            The Smart Assistant will draft your minutes with standardized society headers and proper legal formatting.
                                        </p>
                                        
                                        <button 
                                            onClick={handleAIDraft}
                                            disabled={isLoading || !aiTopic}
                                            className="w-full bg-white text-indigo-700 py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                                            {isLoading ? 'Drafting...' : 'Generate Proceedings'}
                                        </button>
                                    </div>
                                    
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                        <ShieldAlert size={20} className="text-amber-600 mb-2" />
                                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium italic">
                                            Note: AI generated minutes should always be reviewed by the Secretary before final adoption in the next meeting.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {aiResult && !isLoading && (
                                <div className="bg-slate-900 text-slate-300 p-8 rounded-3xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-indigo-400 font-black flex items-center gap-2">
                                            <Check size={18} /> Generated Draft Preview
                                        </h4>
                                        <button 
                                            onClick={applyAIDraft}
                                            className="bg-green-600 text-white px-6 py-2 rounded-xl font-black text-sm hover:bg-green-700 transition-all shadow-lg"
                                        >
                                            Apply to Official Record
                                        </button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto font-mono text-xs leading-loose whitespace-pre-wrap pr-4 custom-scrollbar">
                                        {aiResult}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center pt-4">
                                <button onClick={() => setIsDraftingAI(false)} className="text-slate-400 font-bold hover:text-slate-600 text-sm">Switch to Manual Mode</button>
                            </div>
                        </div>
                    ) : (
                        /* --- MANUAL FORM VIEW --- */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Information</label>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Title / Reference *</label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold" 
                                                    value={formData.title} 
                                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                                    placeholder="e.g. 15th Managing Committee Meeting"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                                                    <input type="date" required className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Time (Optional)</label>
                                                    <input type="time" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                            Attendees List
                                            <span className="text-indigo-500 normal-case font-bold flex items-center gap-1"><Users size={12}/> {activeSociety.processedBy} is default</span>
                                        </label>
                                        <textarea rows={3} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm" placeholder="List names separated by commas..." value={formData.attendees} onChange={e => setFormData({...formData, attendees: e.target.value})}/>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Approved Agenda Items</label>
                                        <textarea rows={4} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-medium bg-slate-50" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} placeholder="1. Reading of minutes... 2. Finance review..."/>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resolution / Decisions</label>
                                        <textarea rows={4} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-bold text-indigo-700" value={formData.actionItems} onChange={e => setFormData({...formData, actionItems: e.target.value})} placeholder="Decided to hire New Security Agency... Approved repair budget of Rs 50k..."/>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-t border-slate-100 pt-6">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detailed Proceedings & Discussion</label>
                                <textarea rows={10} className="w-full p-5 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm leading-relaxed" value={formData.discussion} onChange={e => setFormData({...formData, discussion: e.target.value})} placeholder="The Secretary informed the board that... Mr. XYZ raised a point about..."/>
                            </div>

                            <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                                <button type="button" onClick={() => setIsDraftingAI(true)} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                                    <Sparkles size={16} /> Use AI to refine these notes
                                </button>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">Cancel</button>
                                    <button type="submit" className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                                        <Check size={20} />
                                        Save Official Minutes
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default Minutes;
