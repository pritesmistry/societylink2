
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Users, Receipt, CreditCard, Bell, BrainCircuit, LogOut, Building2, FileBarChart, BookOpen, ScrollText, ClipboardList, Landmark, BookCopy, TrendingUp, Ticket } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  
  const menuItems: { view: ViewState; label: string; icon: React.ElementType }[] = [
    { view: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'SOCIETIES', label: 'My Societies', icon: Building2 },
    { view: 'RESIDENTS', label: 'Members', icon: Users },
    { view: 'BILLING', label: 'Billing', icon: Receipt },
    { view: 'RECEIPTS', label: 'Receipts', icon: ScrollText },
    { view: 'INCOME', label: 'Other Income', icon: TrendingUp },
    { view: 'EXPENSES', label: 'Expenses', icon: CreditCard },
    { view: 'VOUCHERS', label: 'Payment Vouchers', icon: Ticket },
    { view: 'STATEMENTS', label: 'Statements', icon: ClipboardList },
    { view: 'BANK_RECONCILIATION', label: 'Bank Reconciliation', icon: Landmark },
    { view: 'STATUTORY_REGISTERS', label: 'Statutory Registers', icon: BookCopy },
    { view: 'REPORTS', label: 'Balance Sheet', icon: FileBarChart },
    { view: 'MINUTES', label: 'Minutes', icon: BookOpen },
    { view: 'NOTICES', label: 'Notices', icon: Bell },
    { view: 'AI_INSIGHTS', label: 'AI Insights', icon: BrainCircuit },
  ];

  return (
    <div className="h-screen w-64 bg-slate-900 text-white fixed left-0 top-0 flex flex-col shadow-xl z-20">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          SocietyLink
        </h1>
        <p className="text-xs text-slate-400 mt-1">Estate Management OS</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onChangeView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors px-4 py-2 w-full">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
