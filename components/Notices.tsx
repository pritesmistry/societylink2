
import React, { useState } from 'react';
import { Notice } from '../types';
import { generateNoticeDraft } from '../services/geminiService';
import { Bell, Sparkles, Loader2 } from 'lucide-react';

interface NoticesProps {
  notices: Notice[];
  societyId: string;
  onAddNotice: (notice: Notice) => void;
}

const Notices: React.FC<NoticesProps> = ({ notices, societyId, onAddNotice }) => {
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
    const draft = await generateNoticeDraft(aiTopic, aiAudience, aiTone);
    setGeneratedContent(draft);
    setIsLoading(false);
  };

  const handlePublish = () => {
    if (title && generatedContent) {
      onAddNotice({
        id: `N${Date.now()}`,
        societyId,
        title,
        content: generatedContent,
        date: new Date().toISOString().split('T')[0],
        priority: 'Medium',
        type: 'General'
      });
      setIsDrafting(false);
      setGeneratedContent('');
      setTitle('');
      setAiTopic('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-800">Digital Notice Board</h2>
        <button 
          onClick={() => setIsDrafting(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Sparkles size={18} />
          Draft Notice with AI
        </button>
      </div>

      {isDrafting && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl animate-fade-in">
          <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2">
            <Sparkles size={20} />
            AI Notice Assistant
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input 
              type="text" 
              placeholder="Topic (e.g. Lift Repair, Diwali Party)"
              className="p-2 rounded-md border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none"
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
            />
            <select 
              className="p-2 rounded-md border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none"
              value={aiAudience}
              onChange={e => setAiAudience(e.target.value)}
            >
              <option>All Residents</option>
              <option>Tenants Only</option>
              <option>Owners Only</option>
              <option>Committee Members</option>
            </select>
            <select 
              className="p-2 rounded-md border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none"
              value={aiTone}
              onChange={e => setAiTone(e.target.value)}
            >
              <option>Professional</option>
              <option>Friendly</option>
              <option>Urgent</option>
              <option>Strict</option>
            </select>
          </div>

          <button 
            onClick={handleAIGenerate}
            disabled={isLoading || !aiTopic}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mb-4"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Generate Draft'}
          </button>

          {generatedContent && (
            <div className="space-y-4 bg-white p-4 rounded-lg border border-indigo-100">
              <input
                type="text"
                placeholder="Enter Notice Title"
                className="w-full p-2 font-bold border-b border-slate-200 focus:outline-none"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <textarea 
                className="w-full h-32 p-2 text-slate-700 border-none focus:ring-0 resize-none"
                value={generatedContent}
                onChange={e => setGeneratedContent(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsDrafting(false)}
                  className="text-slate-500 hover:text-slate-700 text-sm px-3 py-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePublish}
                  disabled={!title}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                >
                  Publish Notice
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {notices.map(notice => (
          <div key={notice.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-800">{notice.title}</h3>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Bell size={12} />
                {notice.date}
              </span>
            </div>
            <p className="text-slate-600 whitespace-pre-wrap">{notice.content}</p>
            <div className="mt-4 flex gap-2">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {notice.type}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                notice.priority === 'High' ? 'bg-red-100 text-red-700' : 
                notice.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-green-100 text-green-700'
              }`}>
                {notice.priority} Priority
              </span>
            </div>
          </div>
        ))}
         {notices.length === 0 && (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                No notices posted for this society.
            </div>
        )}
      </div>
    </div>
  );
};

export default Notices;
