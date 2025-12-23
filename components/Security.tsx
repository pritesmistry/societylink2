
import React, { useState } from 'react';
import { User, ViewState } from '../types';
import { Shield, UserPlus, Lock, Unlock, Eye, EyeOff, Save, Trash2, ShieldCheck, ShieldAlert, Key, Users } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface SecurityProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  balances?: { cash: number; bank: number };
}

const MODULES: { id: ViewState; label: string; desc: string }[] = [
  { id: 'DASHBOARD', label: 'Financial Dashboard', desc: 'Main stats and charts' },
  { id: 'SOCIETIES', label: 'Society Registry', desc: 'Manage legal society entities' },
  { id: 'RESIDENTS', label: 'Member Master', desc: 'Manage resident database' },
  { id: 'BILLING', label: 'Maintenance Billing', desc: 'Raise and generate invoices' },
  { id: 'RECEIPTS', label: 'Member Receipts', desc: 'Process and view payments' },
  { id: 'INCOME', label: 'Receipt Vouchers', desc: 'Non-maintenance income' },
  { id: 'EXPENSES', label: 'General Ledger', desc: 'Expense tracking' },
  { id: 'VOUCHERS', label: 'Payment Vouchers', desc: 'Statutory accounting vouchers' },
  { id: 'STATEMENTS', label: 'Statements & Lists', desc: 'Outstanding lists and ledgers' },
  { id: 'BANK_RECONCILIATION', label: 'Bank Reconciliation', desc: 'Sync with bank statements' },
  { id: 'STATUTORY_REGISTERS', label: 'Legal Registers', desc: 'I/J Registers and Form O' },
  { id: 'REPORTS', label: 'Financial Reports', desc: 'Balance sheet and P&L' },
  { id: 'MINUTES', label: 'Meeting Minutes', desc: 'MCM and AGM records' },
  { id: 'NOTICES', label: 'Digital Notices', desc: 'Broadcast communications' },
  { id: 'TEMPLATES', label: 'Document Templates', desc: 'Standard forms and letters' },
  { id: 'KNOWLEDGE_BASE', label: 'Legal Knowledge Base', desc: 'Bye-laws and Q&A' },
  { id: 'AI_INSIGHTS', label: 'AI Analytics', desc: 'Gemini-powered financial insights' }
];

const Security: React.FC<SecurityProps> = ({ users, onUpdateUser, onAddUser, onDeleteUser, balances }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Staff' | 'Accountant'>('Staff');

  const selectedUser = users.find(u => u.id === selectedUserId);

  const togglePermission = (moduleId: ViewState) => {
    if (!selectedUser || selectedUser.role === 'Admin') return;
    const updatedPermissions = { ...selectedUser.permissions, [moduleId]: !selectedUser.permissions[moduleId] };
    onUpdateUser({ ...selectedUser, permissions: updatedPermissions });
  };

  const handleAddUser = () => {
    if (!newName) return;
    const defaultPermissions = {} as any;
    MODULES.forEach(m => defaultPermissions[m.id] = false);
    
    onAddUser({
      id: `u-${Date.now()}`,
      name: newName,
      role: newRole,
      permissions: defaultPermissions
    });
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar balances={balances} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* User List Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Staff & Access
            </h3>
            <button 
                onClick={() => setIsAdding(true)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
            >
                <UserPlus size={18} />
            </button>
          </div>

          <div className="space-y-2">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  selectedUserId === user.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                }`}
              >
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">{user.name}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedUserId === user.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {user.role}
                  </p>
                </div>
                {user.role === 'Admin' ? (
                  <ShieldCheck size={18} className={selectedUserId === user.id ? 'text-indigo-300' : 'text-indigo-600'} />
                ) : (
                  <Key size={18} className={selectedUserId === user.id ? 'text-indigo-300' : 'text-slate-300'} />
                )}
              </button>
            ))}
          </div>

          {isAdding && (
            <div className="bg-slate-900 p-4 rounded-2xl space-y-4 animate-in zoom-in duration-200">
               <input 
                type="text" 
                placeholder="User Full Name" 
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={newName}
                onChange={e => setNewName(e.target.value)}
               />
               <select 
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm outline-none"
                value={newRole}
                onChange={e => setNewRole(e.target.value as any)}
               >
                 <option value="Staff">Staff (Clerical)</option>
                 <option value="Accountant">Accountant</option>
               </select>
               <div className="flex gap-2 pt-2">
                 <button onClick={() => setIsAdding(false)} className="flex-1 text-slate-400 text-xs font-bold">Cancel</button>
                 <button onClick={handleAddUser} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-black uppercase">Create</button>
               </div>
            </div>
          )}
        </div>

        {/* Permission Manager */}
        <div className="flex-1">
          {selectedUser ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Module Access Control</h2>
                        <p className="text-sm text-slate-500 font-medium">Define which sections <span className="text-indigo-600 font-black">{selectedUser.name}</span> can access.</p>
                    </div>
                    {selectedUser.role === 'Admin' && (
                        <div className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                            <ShieldCheck size={16} /> Super Admin Access
                        </div>
                    )}
                    {selectedUser.role !== 'Admin' && (
                        <button 
                            onClick={() => onDeleteUser(selectedUser.id)}
                            className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>

                <div className="p-8">
                    {selectedUser.role === 'Admin' ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Master Administrative Privileges</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">Admins have unrestricted access to all modules including sensitive security settings. Permissions cannot be limited for this role.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {MODULES.map(module => {
                                const isGranted = selectedUser.permissions[module.id];
                                return (
                                    <button
                                        key={module.id}
                                        onClick={() => togglePermission(module.id)}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all group ${
                                            isGranted 
                                                ? 'border-indigo-600 bg-indigo-50/50' 
                                                : 'border-slate-100 hover:border-indigo-200'
                                        }`}
                                    >
                                        <div className={`p-3 rounded-xl transition-colors ${isGranted ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                            {isGranted ? <Unlock size={20} /> : <Lock size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-black text-xs uppercase tracking-widest ${isGranted ? 'text-indigo-900' : 'text-slate-600'}`}>{module.label}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{module.desc}</p>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-all ${isGranted ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isGranted ? 'left-5.5' : 'left-0.5'}`} style={{ left: isGranted ? '22px' : '2px' }}></div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-[2rem]">
                Select a user to manage their access.
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 flex gap-4 mt-8 shadow-sm">
        <ShieldAlert className="text-amber-600 shrink-0" size={24} />
        <div className="space-y-1">
            <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Access Control Protocol</p>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Administrative access gives power to view sensitive financial data and change system-wide settings. Ensure that "Staff" roles are only given modules necessary for their specific tasks (e.g., Billing and Notices). Changes to permissions take effect immediately for the logged-in user.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Security;
