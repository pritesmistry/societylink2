
import React, { useState } from 'react';
import { Notice } from '../types';
import { generateNoticeDraft } from '../services/geminiService';
import { Bell, Sparkles, Loader2, Megaphone, Info, Check, X, Wand2, History, AlertTriangle, Droplets, Zap, PartyPopper } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface NoticesProps {
  notices: Notice[];
  societyId: string;
  onAddNotice: (notice: Notice) => void;
  balances?: { cash: number; bank: number };
}

const QUICK_TOPICS = [
    { label: 'Water Shortage', icon: Droplets, topic: 'Scheduled water disruption for tank cleaning on Sunday.' },
    { label: 'Lift Maintenance', icon: Zap, topic: 'AMC maintenance for Lift No. 1 and 2.' },
    { label: 'Security Alert', icon: AlertTriangle, topic: 'New visitor entry rules and ID verification.' },
    { label: 'Festival Party', icon: PartyPopper, topic: 'Upcoming Diwali celebration and potluck dinner.' },
    { label: 'Maintenance Hike', icon: Megaphone, topic: '10% increase in monthly service charges due to inflation.' }
];

const Notices: React.FC<NoticesProps> = ({ notices, societyId, onAddNotice, balances }) => {
  const [isDrafting, setIsDrafting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Form State
  const [aiTopic, setAiTopic] = useState('');
  const [aiAudience, setAiAudience] = useState('All Residents');
  const [aiTone, setAiTone] = useState('Professional');
  
  const [generatedContent, setGeneratedContent] = useState('');
  const [title, setTitle] = useState('');

  const handleAIGenerate = async () => {
    if (!aiTopic) return;
    setIsLoading(true);
    try {
        const draft = await generateNoticeDraft(aiTopic, aiAudience, aiTone);
        setGeneratedContent(draft);
        // Extract first line as title if possible
        if (draft.includes('\n')) {
            const firstLine = draft.split('\n')[0].replace('Subject:', '').replace('SUBJECT:', '').trim();
            setTitle(firstLine || 'New Society Notice');
        } else {
            setTitle('New Society Notice');
        }
    } catch (err) {
        setGeneratedContent("Error generating notice. Please try manually.");
    } finally {
        setIsLoading(false);
    }
  };

  const handlePublish = () => {
    if (title && generatedContent) {
      onAddNotice({
        id: `N${Date.now()}`,
        societyId,
        title,
        content: generatedContent,
        date: new Date().toISOString().split('T')[0],
        priority: aiTone === 'Urgent' ? 'High' : 'Medium',
        type: aiTopic.toLowerCase().includes('emergency') ? 'Emergency' : 'General'
      });
      setIsDrafting(false);
      setGeneratedContent('');
      setTitle('');
      setAiTopic('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={() => setIsDrafting(true)}
        balances={balances}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Megaphone className="text-indigo-600" size={24} />
                Digital Notice Board
            </h2>
            <p className="text-sm text-slate-500 mt-1">Communicate effectively with all members.</p>
        </div>
        {!isDrafting && (
            <button 
                onClick={() => setIsDrafting(true)}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
                <Sparkles size={18} />
                Draft New Notice with AI
            </button>
        )}
      </div>

      {isDrafting && (
        <div className="bg-indigo-50 border-2 border-indigo-200 p-8 rounded-2xl animate-fade-in shadow-inner">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-indigo-900 text-lg flex items-center gap-2">
                <Wand2 size={24} className="text-indigo-600" />
                AI Notice Assistant
              </h3>
              <button onClick={() => setIsDrafting(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X /></button>
          </div>
          
          <div className="space-y-6">
              {/* Quick Topics */}
              <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Quick Scenarios</label>
                  <div className="flex flex-wrap gap-2">
                      {QUICK_TOPICS.map((t, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setAiTopic(t.topic)}
                            className="bg-white border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-700 flex items-center gap-1.5 hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm"
                          >
                            <t.icon size={14} />
                            {t.label}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">What is this notice about? *</label>
                    <input 
                    type="text" 
                    placeholder="e.g. Painting work starting from next week in Wing B..."
                    className="w-full p-3 rounded-xl border border-indigo-200 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Desired Tone</label>
                    <select 
                        className="w-full p-3 rounded-xl border border-indigo-200 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-indigo-700"
                        value={aiTone}
                        onChange={e => setAiTone(e.target.value)}
                    >
                        <option value="Professional">Professional & Firm</option>
                        <option value="Friendly">Friendly & Social</option>
                        <option value="Urgent">Emergency / Urgent</option>
                        <option value="Strict">Strict / Disciplinary</option>
                    </select>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-indigo-400 uppercase">Audience:</span>
                    <div className="flex gap-2">
                        {['All Residents', 'Owners Only', 'Tenants Only'].map(aud => (
                            <button 
                                key={aud}
                                onClick={() => setAiAudience(aud)}
                                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${aiAudience === aud ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-400 border border-indigo-100 hover:bg-indigo-50'}`}
                            >
                                {aud}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleAIGenerate}
                    disabled={isLoading || !aiTopic}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl shadow-indigo-200 transition-all active:scale-95"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {isLoading ? 'Drafting...' : 'Generate Professional Draft'}
                </button>
              </div>

              {generatedContent && !isLoading && (
                <div className="space-y-4 bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Subject / Title</label>
                      <input
                        type="text"
                        placeholder="Notice Title"
                        className="w-full p-2 text-xl font-black border-b-2 border-indigo-50 focus:border-indigo-500 outline-none transition-colors"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                      />
                  </div>
                  <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Body Content</label>
                       <textarea 
                        className="w-full h-48 p-4 text-slate-700 bg-slate-50 rounded-xl border border-slate-100 focus:ring-4 focus:ring-indigo-100 outline-none resize-none font-medium leading-relaxed"
                        value={generatedContent}
                        onChange={e => setGeneratedContent(e.target.value)}
                      />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => setGeneratedContent('')}
                      className="text-slate-400 hover:text-red-500 font-bold text-sm px-4"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={handlePublish}
                      disabled={!title}
                      className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-black hover:bg-green-700 shadow-lg shadow-green-100 flex items-center gap-2"
                    >
                      <Check size={18} />
                      Publish to Board
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notices.map(notice => (
          <div key={notice.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-8 border-l-indigo-600 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-3">
              <div>
                  <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                        notice.priority === 'High' ? 'bg-red-100 text-red-700' : 
                        notice.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {notice.priority} Priority
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">
                        {notice.type}
                      </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{notice.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                    <Bell size={12} />
                    {notice.date}
                </span>
              </div>
            </div>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">{notice.content}</p>
          </div>
        ))}
         {notices.length === 0 && (
            <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold">No active notices.</p>
                <p className="text-sm">Use the AI Assistant to broadcast your first message.</p>
            </div>
        )}
      </div>

      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
          <Info className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Compliance Tip:</strong> As per most bye-laws, notices for General Body Meetings (AGM/SGM) must be published at least 14 days in advance and sent via registered post or email to all members.
          </p>
      </div>
    </div>
  );
};

export default Notices;
