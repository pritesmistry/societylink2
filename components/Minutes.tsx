
import React, { useState } from 'react';
import { MeetingMinutes, Society } from '../types';
import { generateMinutesFromNotes } from '../services/geminiService';
import { Plus, Download, Calendar, Users, FileText, Sparkles, Loader2, Trash2 } from 'lucide-react';

interface MinutesProps {
  minutesList: MeetingMinutes[];
  activeSociety: Society;
  onAddMinute: (minute: MeetingMinutes) => void;
  onDeleteMinute: (id: string) => void;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const Minutes: React.FC<MinutesProps> = ({ minutesList, activeSociety, onAddMinute, onDeleteMinute }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  
  const [formData, setFormData] = useState<Partial<MeetingMinutes>>({
      title: '',
      date: new Date().toISOString().split('T')[0],
      attendees: '',
      agenda: '',
      discussion: '',
      actionItems: ''
  });

  const handleAIFormat = async () => {
    if (!rawNotes) return;
    setIsLoading(true);
    const formattedText = await generateMinutesFromNotes(rawNotes);
    
    setFormData(prev => ({
        ...prev,
        discussion: formattedText // Populating detailed discussion with AI output
    }));
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMinute({
        id: `M${Date.now()}`,
        societyId: activeSociety.id,
        title: formData.title!,
        date: formData.date!,
        attendees: formData.attendees || '',
        agenda: formData.agenda || '',
        discussion: formData.discussion || '',
        actionItems: formData.actionItems || ''
    });
    setIsModalOpen(false);
    setFormData({ title: '', date: '', attendees: '', agenda: '', discussion: '', actionItems: '' });
    setRawNotes('');
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
            
            <h3 style="background: #f3f4f6; padding: 5px 10px; border-left: 4px solid #4f46e5;">Discussion / Minutes</h3>
            <p style="white-space: pre-wrap; margin-bottom: 20px;">${minute.discussion}</p>
            
            <h3 style="background: #f3f4f6; padding: 5px 10px; border-left: 4px solid #4f46e5;">Action Items</h3>
            <p style="white-space: pre-wrap; margin-bottom: 40px;">${minute.actionItems}</p>
            
            <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                <div>
                    <div style="border-top: 1px solid #333; width: 150px; padding-top: 5px;">Secretary</div>
                </div>
                <div>
                    <div style="border-top: 1px solid #333; width: 150px; padding-top: 5px;">Chairman</div>
                </div>
            </div>
        </div>
    `;

    const opt = {
      margin: 0.5,
      filename: `Minutes_${minute.date}_${minute.title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-semibold text-slate-800">Meeting Minutes</h2>
                <p className="text-sm text-slate-500 mt-1">Record and manage society meeting proceedings.</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md"
            >
                <Plus size={18} />
                Add Minutes
            </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {minutesList.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 mb-2">No meeting minutes recorded yet.</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-medium hover:underline">Record your first meeting</button>
                </div>
            ) : (
                minutesList.map(minute => (
                    <div key={minute.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{minute.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {minute.date}</span>
                                    <span className="flex items-center gap-1"><Users size={14} /> Attendees Recorded</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => downloadPDF(minute)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                                >
                                    <Download size={18} /> PDF
                                </button>
                                <button 
                                    onClick={() => onDeleteMinute(minute.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div>
                                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Agenda</h4>
                                 <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{minute.agenda}</p>
                             </div>
                             <div>
                                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Discussion Highlights</h4>
                                 <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg line-clamp-4 hover:line-clamp-none transition-all">{minute.discussion}</p>
                             </div>
                             <div>
                                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Action Items</h4>
                                 <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{minute.actionItems}</p>
                             </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-10">
                <div className="bg-white rounded-xl p-8 w-full max-w-4xl shadow-2xl my-auto">
                    <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        Record Meeting Minutes
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Meeting Title *</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. Annual General Meeting"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Date *</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Attendees</label>
                                <textarea 
                                    rows={2}
                                    placeholder="List names of members present..."
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.attendees}
                                    onChange={e => setFormData({...formData, attendees: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* AI Assistant Section */}
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                             <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="text-indigo-600" size={18} />
                                <h3 className="font-bold text-indigo-900">AI Assistant: Draft from Raw Notes</h3>
                             </div>
                             <p className="text-sm text-indigo-700 mb-3">Paste your rough notes here, and AI will format the discussion points for you.</p>
                             <div className="flex gap-2">
                                <textarea 
                                    className="flex-1 p-3 border border-indigo-200 rounded-lg focus:outline-none text-sm"
                                    rows={3}
                                    placeholder="e.g. Discussed water tank cleaning - agreed to do it next tuesday - budget 5k approved..."
                                    value={rawNotes}
                                    onChange={e => setRawNotes(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={handleAIFormat}
                                    disabled={!rawNotes || isLoading}
                                    className="bg-indigo-600 text-white px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                    Format
                                </button>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Agenda Items</label>
                                <textarea 
                                    rows={6}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.agenda}
                                    onChange={e => setFormData({...formData, agenda: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Decisions / Action Items</label>
                                <textarea 
                                    rows={6}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.actionItems}
                                    onChange={e => setFormData({...formData, actionItems: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Detailed Discussion / Minutes</label>
                                <textarea 
                                    rows={8}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.discussion}
                                    onChange={e => setFormData({...formData, discussion: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-lg"
                            >
                                Save Minutes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Minutes;
