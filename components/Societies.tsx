
import React, { useState } from 'react';
import { Society } from '../types';
import { Plus, Building2, MapPin, Phone, Mail, CheckCircle, CreditCard, FileText, Trash2, Edit } from 'lucide-react';

interface SocietiesProps {
  societies: Society[];
  activeSocietyId: string;
  onAddSociety: (society: Society) => void;
  onUpdateSociety: (society: Society) => void;
  onDeleteSociety: (id: string) => void;
  onSelectSociety: (id: string) => void;
}

const Societies: React.FC<SocietiesProps> = ({ societies, activeSocietyId, onAddSociety, onUpdateSociety, onDeleteSociety, onSelectSociety }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSociety, setNewSociety] = useState<Partial<Society>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

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
        // Update existing
        onUpdateSociety({
          ...newSociety as Society,
          id: editingId
        });
      } else {
        // Add new
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-semibold text-slate-800">Society Management</h2>
            <p className="text-sm text-slate-500 mt-1">Manage multiple estates from a single dashboard.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md"
        >
          <Plus size={18} />
          Add New Society
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {societies.map(society => {
          const isActive = society.id === activeSocietyId;
          return (
            <div 
              key={society.id} 
              onClick={() => onSelectSociety(society.id)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md group ${
                isActive 
                  ? 'bg-indigo-50 border-indigo-500 shadow-md' 
                  : 'bg-white border-slate-100 hover:border-indigo-200'
              }`}
            >
              {isActive && (
                <div className="absolute top-4 right-4 text-indigo-600">
                  <CheckCircle size={24} fill="currentColor" className="text-white" />
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'}`}>
                    <Building2 size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg truncate max-w-[150px] ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {society.name}
                        </h3>
                    </div>
                </div>
                 {/* Action Buttons - Always Visible */}
                 <div className="flex gap-1 z-10">
                     <button 
                        onClick={(e) => handleOpenEditModal(e, society)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Edit Society"
                    >
                        <Edit size={16} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSociety(society.id);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Society"
                    >
                        <Trash2 size={16} />
                    </button>
                 </div>
              </div>
              
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-1 shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{society.address}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200 mt-2">
                    <div className="flex items-center gap-1">
                        <FileText size={12} />
                        Reg: {society.registrationNumber || 'N/A'}
                    </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <span className={isActive ? 'font-semibold text-indigo-600' : ''}>
                    {isActive ? 'Active Dashboard' : 'Click to Switch'}
                </span>
              </div>
            </div>
          );
        })}
        
        {/* Quick Add Card */}
        <div 
            onClick={handleOpenAddModal}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-colors min-h-[200px]"
        >
            <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-3 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                <Plus size={24} />
            </div>
            <p className="font-medium text-slate-500 group-hover:text-indigo-600">Register Another Society</p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 my-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                {editingId ? 'Edit Society Details' : 'Register New Society'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Society Name *</label>
                    <input 
                      type="text" 
                      required
                      value={newSociety.name || ''}
                      placeholder="e.g. Royal Palms Residency"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      onChange={e => setNewSociety({...newSociety, name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Address *</label>
                    <textarea 
                      required
                      rows={2}
                      value={newSociety.address || ''}
                      placeholder="Full street address, City, Zip Code"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      onChange={e => setNewSociety({...newSociety, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Registration Number</label>
                    <input 
                      type="text" 
                      value={newSociety.registrationNumber || ''}
                      placeholder="Govt Reg No."
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      onChange={e => setNewSociety({...newSociety, registrationNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Processed By (Name/Role)</label>
                    <input 
                      type="text" 
                      value={newSociety.processedBy || ''}
                      placeholder="e.g. John Doe (Secretary)"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      onChange={e => setNewSociety({...newSociety, processedBy: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bank Details for Payment</label>
                    <textarea
                      rows={3}
                      value={newSociety.bankDetails || ''}
                      placeholder="Bank Name, Account No, IFSC Code, Branch"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      onChange={e => setNewSociety({...newSociety, bankDetails: e.target.value})}
                    />
                    <p className="text-xs text-slate-400 mt-1">This will be printed on the bills.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Phone</label>
                    <input 
                      type="tel" 
                      value={newSociety.contactPhone || ''}
                      placeholder="+1 234 567 890"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      onChange={e => setNewSociety({...newSociety, contactPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Email</label>
                    <input 
                      type="email" 
                      value={newSociety.contactEmail || ''}
                      placeholder="admin@society.com"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      onChange={e => setNewSociety({...newSociety, contactEmail: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Footer Note</label>
                    <input 
                      type="text" 
                      value={newSociety.footerNote || ''}
                      placeholder="e.g. Please pay by 5th to avoid penalty."
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      onChange={e => setNewSociety({...newSociety, footerNote: e.target.value})}
                    />
                  </div>
              </div>

              <div className="flex justify-end gap-4 pt-2 border-t border-slate-100 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition-all"
                >
                  {editingId ? 'Update Society' : 'Create Society'}
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
