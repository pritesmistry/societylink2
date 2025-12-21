
import React, { useState } from 'react';
import { Society, AccountHead, Resident } from '../types';
import { Plus, Building2, MapPin, Phone, Mail, CheckCircle, FileText, Trash2, Edit, Copy, ArrowRight, ShieldCheck, Info, X } from 'lucide-react';
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
  const [newSociety, setNewSociety] = useState<Partial<Society>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // Copy Master State
  const [copySourceId, setCopySourceId] = useState('');
  const [copyTargetId, setCopyTargetId] = useState(activeSocietyId);
  const [copyHeads, setCopyHeads] = useState(true);
  const [copyMembers, setCopyMembers] = useState(true);

  const handleOpenAddModal = () => {
    setNewSociety({});
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
            <h2 className="text-xl font-semibold text-slate-800">Estate Management</h2>
            <p className="text-sm text-slate-500 mt-1">Configure multi-society ledgers and master data.</p>
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
                Register Society
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
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl shadow-inner transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                        <Building2 size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-xl truncate max-w-[180px] ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {society.name}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">ESTATE ID: {society.id}</p>
                    </div>
                </div>
              </div>
              
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-1 shrink-0 text-slate-300" />
                  <span className="line-clamp-2 font-medium leading-relaxed">{society.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText size={18} className="shrink-0 text-slate-300" />
                  <span className="font-bold text-xs uppercase tracking-tighter">Reg: {society.registrationNumber || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {isActive ? 'Current Active Estate' : 'Select Estate'}
                </span>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => handleOpenEditModal(e, society)}
                        className="p-2 rounded-xl text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                        title="Edit Society"
                    >
                        <Edit size={18} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSociety(society.id);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Delete Society"
                    >
                        <Trash2 size={18} />
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- COPY MASTER DATA MODAL --- */}
      {isCopyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[110] backdrop-blur-md p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                      <Copy size={150} />
                  </div>

                  <div className="flex justify-between items-center mb-8 relative z-10">
                      <div>
                          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                              <Copy className="text-indigo-600" />
                              Copy Society Master
                          </h2>
                          <p className="text-sm text-slate-500 mt-1">Replicate Accounting Heads and Member Lists between societies.</p>
                      </div>
                      <button onClick={() => setIsCopyModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
                  </div>

                  <form onSubmit={handleProcessCopy} className="space-y-8 relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                          <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Society</label>
                              <select 
                                required
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-50"
                                value={copySourceId}
                                onChange={e => setCopySourceId(e.target.value)}
                              >
                                  <option value="">-- Choose Source --</option>
                                  {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center pt-6">
                              <ArrowRight className="text-indigo-300" size={32} />
                          </div>

                          <div className="space-y-2 md:col-start-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Society</label>
                              <select 
                                required
                                className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-2xl outline-none font-black text-indigo-900 focus:ring-4 focus:ring-indigo-100"
                                value={copyTargetId}
                                onChange={e => setCopyTargetId(e.target.value)}
                              >
                                  {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Select Data to Replicate</h4>
                          
                          <label className="flex items-center gap-4 cursor-pointer p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all group">
                              <div className={`p-2 rounded-lg transition-colors ${copyHeads ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <ShieldCheck size={20} />
                              </div>
                              <div className="flex-1">
                                  <p className="font-bold text-slate-800 text-sm">Master Account Heads (Chart of Accounts)</p>
                                  <p className="text-[10px] text-slate-500 font-medium italic">Ledgers, Main Groups, and Sub Groups</p>
                              </div>
                              <input type="checkbox" checked={copyHeads} onChange={e => setCopyHeads(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                          </label>

                          <label className="flex items-center gap-4 cursor-pointer p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all group">
                              <div className={`p-2 rounded-lg transition-colors ${copyMembers ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <FileText size={20} />
                              </div>
                              <div className="flex-1">
                                  <p className="font-bold text-slate-800 text-sm">Member Master & Opening Balances</p>
                                  <p className="text-[10px] text-slate-500 font-medium italic">Names, Units, and starting Ledger Balances</p>
                              </div>
                              <input type="checkbox" checked={copyMembers} onChange={e => setCopyMembers(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                          </label>
                      </div>

                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                          <Info className="text-amber-600 shrink-0" size={20} />
                          <p className="text-[10px] text-amber-800 leading-relaxed font-bold uppercase tracking-tight">
                              Warning: This action will append data to the target society. Ensure the target is empty or needs these additions.
                          </p>
                      </div>

                      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                          <button type="button" onClick={() => setIsCopyModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
                          <button type="submit" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
                              <Copy size={20} /> Process Replication
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Register/Edit Society Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-3xl p-10 w-full max-w-3xl shadow-2xl animate-in zoom-in duration-200 my-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-cyan-400"></div>
            <h2 className="text-3xl font-black mb-8 text-slate-800 flex items-center gap-3">
                <Building2 className="text-indigo-600" size={32} />
                {editingId ? 'Modify Estate Registry' : 'New Estate Registration'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Legal Name of Society *</label>
                    <input 
                      type="text" 
                      required
                      value={newSociety.name || ''}
                      placeholder="e.g. Royal Palms Co-operative Housing Society Ltd."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black text-slate-800"
                      onChange={e => setNewSociety({...newSociety, name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Complete Physical Address *</label>
                    <textarea 
                      required
                      rows={2}
                      value={newSociety.address || ''}
                      placeholder="Street, Landmark, City, State, PIN"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-700"
                      onChange={e => setNewSociety({...newSociety, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Govt. Registration No.</label>
                    <input 
                      type="text" 
                      value={newSociety.registrationNumber || ''}
                      placeholder="HSG-2024-..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                      onChange={e => setNewSociety({...newSociety, registrationNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Primary Admin/Secretary</label>
                    <input 
                      type="text" 
                      value={newSociety.processedBy || ''}
                      placeholder="Name (Role)"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                      onChange={e => setNewSociety({...newSociety, processedBy: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Default Bank Details (Printed on Bills)</label>
                    <textarea
                      rows={3}
                      value={newSociety.bankDetails || ''}
                      placeholder="Account Name, Bank Name, Account Number, IFSC, Branch"
                      className="w-full p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-indigo-900"
                      onChange={e => setNewSociety({...newSociety, bankDetails: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Contact Phone</label>
                    <input 
                      type="tel" 
                      value={newSociety.contactPhone || ''}
                      placeholder="+91..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                      onChange={e => setNewSociety({...newSociety, contactPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Contact Email</label>
                    <input 
                      type="email" 
                      value={newSociety.contactEmail || ''}
                      placeholder="admin@estate.com"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                      onChange={e => setNewSociety({...newSociety, contactEmail: e.target.value})}
                    />
                  </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
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
