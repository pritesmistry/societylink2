
import React, { useState, useRef } from 'react';
import { Resident } from '../types';
import { Search, Plus, Mail, Phone, Upload, Download, Info, Edit, Trash2, Ruler, Wallet, MessageCircle } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface ResidentsProps {
  residents: Resident[];
  societyId: string;
  onAddResident: (r: Resident) => void;
  onBulkAddResidents: (r: Resident[]) => void;
  onUpdateResident: (r: Resident) => void;
  onDeleteResident: (id: string) => void;
  balances?: { cash: number; bank: number };
}

const Residents: React.FC<ResidentsProps> = ({ residents, societyId, onAddResident, onBulkAddResidents, onUpdateResident, onDeleteResident, balances }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const initialResidentState: Partial<Resident> = {
    occupancyType: 'Owner',
    sqFt: 0,
    openingBalance: 0,
    whatsappNumber: '',
  };

  const [formData, setFormData] = useState<Partial<Resident>>(initialResidentState);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(initialResidentState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (resident: Resident) => {
    setEditingId(resident.id);
    setFormData({ ...resident });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.unitNumber) {
      const residentData: Resident = {
        id: editingId || `RES-${Date.now()}`,
        societyId,
        name: formData.name,
        unitNumber: formData.unitNumber,
        contact: formData.contact || '',
        email: formData.email || '',
        occupancyType: (formData.occupancyType as 'Owner' | 'Tenant') || 'Owner',
        sqFt: Number(formData.sqFt) || 0,
        openingBalance: Number(formData.openingBalance) || 0,
        whatsappNumber: formData.whatsappNumber || '',
      };

      if (editingId) {
        onUpdateResident(residentData);
      } else {
        onAddResident(residentData);
      }
      
      setIsModalOpen(false);
      setFormData(initialResidentState);
      setEditingId(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) return;
        const lines = content.split(/\r\n|\n/);
        const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
        const newResidents: Resident[] = [];
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 2) { 
                const [name, unitNumber, sqFt, openingBalance, email, contact, typeRaw] = parts;
                if(!name || !unitNumber) continue;
                newResidents.push({
                    id: `csv-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                    societyId,
                    name,
                    unitNumber,
                    sqFt: Number(sqFt) || 0,
                    openingBalance: Number(openingBalance) || 0,
                    email: email || '',
                    contact: contact || '',
                    occupancyType: typeRaw?.toLowerCase().includes('tenant') ? 'Tenant' : 'Owner'
                });
            }
        }
        if (newResidents.length > 0) {
            onBulkAddResidents(newResidents);
            alert(`Successfully added ${newResidents.length} members.`);
        }
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onNew={handleOpenAddModal}
        onSearch={() => searchInputRef.current?.focus()}
        balances={balances}
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search members..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 shadow-sm transition-all">
            <Upload size={18} /> Upload CSV
          </button>
          <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all">
            <Plus size={18} /> Add Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredResidents.map(resident => (
          <div key={resident.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 text-lg">{resident.name}</h3>
                <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${resident.occupancyType === 'Owner' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                    {resident.occupancyType}
                    </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 ml-2">
                  <div className="bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-700 text-sm whitespace-nowrap">
                    {resident.unitNumber}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenEditModal(resident)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => onDeleteResident(resident.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                        <Trash2 size={16} />
                    </button>
                  </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 mt-4 border-t border-slate-100 pt-3">
               <div className="flex items-center gap-2 col-span-2">
                <Mail size={14} className="text-slate-400" />
                {resident.email || 'N/A'}
              </div>
              <div className="flex items-center gap-2 col-span-2 mb-2">
                <Phone size={14} className="text-slate-400" />
                <span>{resident.contact || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs"><Ruler size={14} className="text-slate-400" /><span>{resident.sqFt} Sq. Ft.</span></div>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-700"><Wallet size={14} className="text-slate-400" /><span>Op: ₹{resident.openingBalance}</span></div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl my-auto animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-6 text-slate-800">{editingId ? 'Edit Member Details' : 'Add New Member'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Full Name *</label><input type="text" required className="w-full p-3 border border-slate-300 rounded-xl outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Flat / Unit No *</label><input type="text" required className="w-full p-3 border border-slate-300 rounded-xl outline-none" value={formData.unitNumber || ''} onChange={e => setFormData({...formData, unitNumber: e.target.value})}/></div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Square Footage *</label><input type="number" required className="w-full p-3 border border-slate-300 rounded-xl outline-none" value={formData.sqFt} onChange={e => setFormData({...formData, sqFt: Number(e.target.value)})}/></div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Opening Balance (₹) *</label><input type="number" required className="w-full p-3 border border-slate-300 rounded-xl outline-none" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})}/></div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Email Address</label><input type="email" className="w-full p-3 border border-slate-300 rounded-xl outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}/></div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Contact No</label><input type="tel" className="w-full p-3 border border-slate-300 rounded-xl outline-none" value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})}/></div>
              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-lg">{editingId ? 'Update Record' : 'Save Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Residents;
