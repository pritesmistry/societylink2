
import React, { useState } from 'react';
import { Society, AccountHead, Resident } from '../types';
import { Plus, Building2, MapPin, Phone, Mail, CheckCircle, FileText, Trash2, Edit, Copy, ArrowRight, ShieldCheck, Info, X, Users, Calendar, Hash, Briefcase } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface SocietiesProps {
  societies: Society[];
  activeSocietyId: string;
  onAddSociety: (society: Society) => void;
  onUpdateSociety: (society: Society) => void;
  onDeleteSociety: (id: string) => void;
  onSelectSociety: (id: string) => void;
  onCopyMasterData: (sourceId: string, targetId: string, options: { copyHeads: boolean; copyMembers: boolean }) => void;
  balances?: { cash: number; bank: number };
}

const Societies: React.FC<SocietiesProps> = ({ societies, activeSocietyId, onAddSociety, onUpdateSociety, onDeleteSociety, onSelectSociety, onCopyMasterData, balances }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [newSociety, setNewSociety] = useState<Partial<Society>>({
      financialYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Copy Master State
  const [copySourceId, setCopySourceId] = useState('');
  const [copyTargetId, setCopyTargetId] = useState(activeSocietyId);
  const [copyHeads, setCopyHeads] = useState(true);
  const [copyMembers, setCopyMembers] = useState(true);

  const handleOpenAddModal = () => {
    setNewSociety({
        financialYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, society: Society) => {
    e.stopPropagation();
    setNewSociety({ ...society });
    setEditingId(society.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSociety.name && newSociety.address) {
      if (editingId) {
        onUpdateSociety({
          ...newSociety as Society,
          id: editingId
        });
      } else {
        onAddSociety({
          id: Date.now().toString(),
          name: newSociety.name,
          address: newSociety.address,
          registrationNumber: newSociety.registrationNumber || '',
          gstNumber: newSociety.gstNumber || '',
          financialYear: newSociety.financialYear || '',
          contactEmail: newSociety.contactEmail || '',
          contactPhone: newSociety.contactPhone || '',
          bankDetails: newSociety.bankDetails || '',
          processedBy: newSociety.processedBy || '',
          footerNote: newSociety.footerNote || '',
          totalUnits: 0
        });
      }
      setIsModalOpen(false);
      setNewSociety({});
      setEditingId(null);
    }
  };

  const handleProcessCopy = (e: React.FormEvent) => {
      e.preventDefault();
      if (!copySourceId || !copyTargetId || copySourceId === copyTargetId) {
          alert("Please select different source and target societies.");
          return;
      }
      onCopyMasterData(copySourceId, copyTargetId, { copyHeads, copyMembers });
      setIsCopyModalOpen(false);
      setCopySourceId('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={handleOpenAddModal}
        balances={balances}
      />

      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-semibold text-slate-800">Society Management</h2>
            <p className="text-sm text-slate-500 mt-1">Configure multi-society ledgers and master replication.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setIsCopyModalOpen(true)}
                className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-100 transition-all font-black text-sm shadow-sm"
            >
                <Copy size={18} />
                Copy Master Data
            </button>
            <button 
                onClick={handleOpenAddModal}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg font-black text-sm active:scale-95"
            >
                <Plus size={18} />
                Register New Society
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {societies.map(society => {
          const isActive = society.id === activeSocietyId;
          return (
            <div 
              key={society.id} 
              onClick={() => onSelectSociety(society.id)}
              className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl group ${
                isActive 
                  ? 'bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-100' 
                  : 'bg-white border-slate-100 hover:border-indigo-300'
              }`}
            >
              {isActive && (
                <div className="absolute top-4 right-4 text-indigo-600 animate-in zoom-in duration-500">
                  <CheckCircle size={28} fill="currentColor" className="text-white" />
                </div>
              )}
              <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-2xl transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                      <Building2 size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-xl truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {society.name}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">SOCIETY ID: {society.id}</p>
                  </div>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-1 shrink-0 text-slate-300" />
                  <span className="line-clamp-2 font-medium leading-relaxed">{society.address}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Hash size={16} className="text-slate-300 shrink-0" />
                    <span className="font-bold text-slate-700">Reg: {society.registrationNumber}</span>
                </div>
                {society.gstNumber && (
                    <div className="flex items-center gap-3">
                        <Briefcase size={16} className="text-slate-300 shrink-0" />
                        <span className="font-bold text-indigo-600">GST: {society.gstNumber}</span>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-300 shrink-0" />
                    <span className="font-medium">FY: {society.financialYear}</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {isActive ? 'Current Active Society' : 'Click to Select'}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => handleOpenEditModal(e, society)} className="p-2 rounded-xl text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all"><Edit size={18} /></button>
                     <button onClick={(e) => { e.stopPropagation(); onDeleteSociety(society.id); }} className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 size={18} /></button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {isCopyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[110] backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-8 relative z-10">
                      <div>
                          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                              <Copy className="text-indigo-600" />
                              Copy Master Accounts & Members
                          </h2>
                          <p className="text-sm text-slate-500 mt-1">Replicate Accounting Heads and Member Lists.</p>
                      </div>
                      <button onClick={() => setIsCopyModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleProcessCopy} className="space-y-8 relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                          <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Source Society</label>
                              <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-50" value={copySourceId} onChange={e => setCopySourceId(e.target.value)}>
                                  <option value="">-- Choose Source --</option>
                                  {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Target Society</label>
                              <select required className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-2xl outline-none font-black text-indigo-900 focus:ring-4 focus:ring-indigo-100" value={copyTargetId} onChange={e => setCopyTargetId(e.target.value)}>
                                  {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                          <label className="flex items-center gap-4 cursor-pointer p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all">
                              <div className={`p-2 rounded-lg transition-colors ${copyHeads ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><ShieldCheck size={20} /></div>
                              <div className="flex-1"><p className="font-bold text-slate-800 text-sm">Master Account Heads</p></div>
                              <input type="checkbox" checked={copyHeads} onChange={e => setCopyHeads(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                          </label>
                          <label className="flex items-center gap-4 cursor-pointer p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all">
                              <div className={`p-2 rounded-lg transition-colors ${copyMembers ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Users size={20} /></div>
                              <div className="flex-1"><p className="font-bold text-slate-800 text-sm">Member Master List</p></div>
                              <input type="checkbox" checked={copyMembers} onChange={e => setCopyMembers(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                          </label>
                      </div>
                      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                          <button type="button" onClick={() => setIsCopyModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
                          <button type="submit" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"><Copy size={20} /> Process Copy</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-3xl p-10 w-full max-w-4xl shadow-2xl animate-in zoom-in duration-200 my-auto relative overflow-hidden">
            <h2 className="text-3xl font-black mb-8 text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-4">
                <Building2 className="text-indigo-600" size={32} />
                {editingId ? 'Modify Society Registry' : 'New Society Registration'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Legal Name of Society *</label>
                    <input type="text" required value={newSociety.name || ''} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-black text-slate-800 text-lg" onChange={e => setNewSociety({...newSociety, name: e.target.value})}/>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 text-red-500">Address *</label>
                    <textarea required rows={2} value={newSociety.address || ''} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-medium text-slate-700" onChange={e => setNewSociety({...newSociety, address: e.target.value})} placeholder="Full registered address of the society"/>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Registration No. *</label>
                    <input type="text" required value={newSociety.registrationNumber || ''} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold" onChange={e => setNewSociety({...newSociety, registrationNumber: e.target.value})}/>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">GST No. (Optional)</label>
                    <input type="text" value={newSociety.gstNumber || ''} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-indigo-600" onChange={e => setNewSociety({...newSociety, gstNumber: e.target.value})} placeholder="e.g. 27AAAAA0000A1Z5"/>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Financial Year *</label>
                    <input type="text" required value={newSociety.financialYear || ''} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold" onChange={e => setNewSociety({...newSociety, financialYear: e.target.value})} placeholder="e.g. 2024-2025"/>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mobile No. *</label>
                    <input type="tel" required value={newSociety.contactPhone || ''} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold" onChange={e => setNewSociety({...newSociety, contactPhone: e.target.value})} placeholder="+91 ..."/>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Official Email Address *</label>
                    <input type="email" required value={newSociety.contactEmail || ''} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold" onChange={e => setNewSociety({...newSociety, contactEmail: e.target.value})} placeholder="society@email.com"/>
                  </div>

                  <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Accounting Details (Bank Info)</label>
                    <textarea rows={3} value={newSociety.bankDetails || ''} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-medium text-slate-600 text-sm" onChange={e => setNewSociety({...newSociety, bankDetails: e.target.value})} placeholder="Bank Name, A/C No, IFSC, Branch Name..."/>
                  </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                <button type="submit" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                    {editingId ? 'Update Official Registry' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Societies;
