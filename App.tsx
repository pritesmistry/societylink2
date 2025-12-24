
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Societies from './components/Societies';
import Residents from './components/Residents';
import Billing from './components/Billing';
import Receipts from './components/Receipts';
import IncomeSection from './components/Income';
import Expenses from './components/Expenses';
import Notices from './components/Notices';
import AIInsights from './components/AIInsights';
import Reports from './components/Reports';
import Minutes from './components/Minutes';
import Statements from './components/Statements';
import BankReconciliation from './components/BankReconciliation';
import StatutoryRegisters from './components/StatutoryRegisters';
import PaymentVouchers from './components/PaymentVouchers';
import Templates from './components/Templates';
import KnowledgeBase from './components/KnowledgeBase';
import Security from './components/Security';
import { ViewState, Bill, Resident, Expense, Notice, Society, MeetingMinutes, Income, PaymentStatus, AccountHead, User } from './types';
import { MOCK_BILLS, MOCK_EXPENSES, MOCK_NOTICES, MOCK_RESIDENTS, MOCK_SOCIETIES, MOCK_MINUTES, MOCK_INCOME, INITIAL_ACCOUNT_HEADS } from './constants';
import { Clock, Wallet, Landmark, ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Security State
  const [users, setUsers] = useState<User[]>([
    {
      id: 'admin-1',
      name: 'Super Admin',
      role: 'Admin',
      permissions: {} as any // Admin sees all
    },
    {
      id: 'staff-1',
      name: 'Clerk Operator',
      role: 'Staff',
      permissions: {
        'BILLING': true,
        'NOTICES': true,
        'RESIDENTS': true,
        'DASHBOARD': true
      } as any
    }
  ]);
  const [activeUserId, setActiveUserId] = useState<string>('admin-1');

  const currentUser = useMemo(() => 
    users.find(u => u.id === activeUserId) || users[0], 
  [users, activeUserId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Centralized State
  const [societies, setSocieties] = useState<Society[]>(MOCK_SOCIETIES);
  const [activeSocietyId, setActiveSocietyId] = useState<string>(MOCK_SOCIETIES[0].id);
  
  const [residents, setResidents] = useState<Resident[]>(MOCK_RESIDENTS);
  const [bills, setBills] = useState<Bill[]>(MOCK_BILLS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [incomes, setIncomes] = useState<Income[]>(MOCK_INCOME);
  const [notices, setNotices] = useState<Notice[]>(MOCK_NOTICES);
  const [minutes, setMinutes] = useState<MeetingMinutes[]>(MOCK_MINUTES);
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>(INITIAL_ACCOUNT_HEADS);

  // Derived State for Active Society
  const activeSociety = useMemo(() => 
    societies.find(s => s.id === activeSocietyId) || societies[0], 
  [societies, activeSocietyId]);

  const activeResidents = useMemo(() => residents.filter(r => r.societyId === activeSocietyId), [residents, activeSocietyId]);
  const activeBills = useMemo(() => bills.filter(b => b.societyId === activeSocietyId), [bills, activeSocietyId]);
  const activeExpenses = useMemo(() => expenses.filter(e => e.societyId === activeSocietyId), [expenses, activeSocietyId]);
  const activeIncomes = useMemo(() => incomes.filter(i => i.societyId === activeSocietyId), [incomes, activeSocietyId]);
  const activeNotices = useMemo(() => notices.filter(n => n.societyId === activeSocietyId), [notices, activeSocietyId]);
  const activeMinutes = useMemo(() => minutes.filter(m => m.societyId === activeSocietyId), [minutes, activeSocietyId]);
  const activeAccountHeads = useMemo(() => accountHeads.filter(h => h.societyId === activeSocietyId), [accountHeads, activeSocietyId]);

  // Balance Calculation
  const financialBalances = useMemo(() => {
      let cash = 0;
      let bank = 0;

      activeBills.forEach(b => {
          if (b.status === PaymentStatus.PAID && b.paymentDetails) {
              if (b.paymentDetails.mode === 'Cash') cash += b.totalAmount;
              else bank += b.totalAmount;
          }
      });

      activeIncomes.forEach(i => {
          if (i.mode === 'Cash') cash += i.amount;
          else bank += i.amount;
      });

      activeExpenses.forEach(e => {
          if (e.paymentMode === 'Cash') cash -= e.amount;
          else if (e.paymentMode !== 'Journal' && e.paymentMode !== 'Debit Note' && e.paymentMode !== 'Credit Note') {
              bank -= e.amount;
          }
      });

      return { cash, bank };
  }, [activeBills, activeIncomes, activeExpenses]);

  // Handlers
  const handleUpdateUser = (updated: User) => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  const handleAddUser = (newUser: User) => setUsers(prev => [...prev, newUser]);
  const handleDeleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const handleAddSociety = (society: Society) => {
    setSocieties(prev => [...prev, society]);
    setActiveSocietyId(society.id);
  };

  const handleUpdateSociety = (updatedSociety: Society) => {
    setSocieties(prev => prev.map(s => s.id === updatedSociety.id ? updatedSociety : s));
  };

  const handleDeleteSociety = (id: string) => {
    if (societies.length <= 1) return;
    
    // Safety check for society deletion
    const hasData = residents.some(r => r.societyId === id) || bills.some(b => b.societyId === id) || expenses.some(e => e.societyId === id);
    if (hasData) {
        alert("SECURITY ALERT: This society has active data (Members, Bills, or Vouchers). Delete all associated records before removing the society registry.");
        return;
    }

    if (window.confirm("Delete this society registry?")) {
       const newSocieties = societies.filter(s => s.id !== id);
       setSocieties(newSocieties);
       if (id === activeSocietyId) setActiveSocietyId(newSocieties[0].id);
    }
  };

  const handleCopyMasterData = (sourceId: string, targetId: string, options: { copyHeads: boolean; copyMembers: boolean }) => {
      if (options.copyHeads) {
          const sourceHeads = accountHeads.filter(h => h.societyId === sourceId);
          const newHeads = sourceHeads.map(h => ({
              ...h,
              id: `cpy-h-${Date.now()}-${Math.random()}`,
              societyId: targetId
          }));
          setAccountHeads(prev => [...prev, ...newHeads]);
      }

      if (options.copyMembers) {
          const sourceResidents = residents.filter(r => r.societyId === sourceId);
          const newResidents = sourceResidents.map(r => ({
              ...r,
              id: `cpy-res-${Date.now()}-${Math.random()}`,
              societyId: targetId
          }));
          setResidents(prev => [...prev, ...newResidents]);
      }
      
      alert("Master replication complete!");
      setActiveSocietyId(targetId);
      setCurrentView('DASHBOARD');
  };

  const handleAddResident = (resident: Resident) => setResidents(prev => [...prev, resident]);
  const handleBulkAddResidents = (newResidents: Resident[]) => setResidents(prev => [...prev, ...newResidents]);
  const handleUpdateResident = (updatedResident: Resident) => setResidents(prev => prev.map(r => r.id === updatedResident.id ? updatedResident : r));
  
  const handleDeleteResident = (id: string) => {
    // SECURITY GUARD: Check for Personal Ledger transactions
    const hasTransactions = bills.some(b => b.residentId === id);
    if (hasTransactions) {
        alert("CRITICAL SECURITY ACTION DENIED:\n\nThis member has active transactions in their Personal Ledger (Bills or Receipts).\n\nTo delete this member, you must first delete ALL their maintenance bills and payment receipts.");
        return;
    }

    if(window.confirm("Are you sure you want to remove this resident? This action cannot be undone.")) {
        setResidents(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleGenerateBill = (bill: Bill) => setBills(prev => [bill, ...prev]);
  const handleBulkAddBills = (newBills: Bill[]) => setBills(prev => [...newBills, ...prev]);
  const handleUpdateBill = (updatedBill: Bill) => setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
  const handleBulkUpdateBills = (updatedBills: Bill[]) => {
    setBills(prev => prev.map(b => {
      const updated = updatedBills.find(ub => ub.id === b.id);
      return updated ? updated : b;
    }));
  };

  const handleAddExpense = (expense: Expense) => setExpenses(prev => [expense, ...prev]);
  const handleAddIncome = (income: Income) => setIncomes(prev => [income, ...prev]);
  const handleAddNotice = (notice: Notice) => setNotices(prev => [notice, ...prev]);
  const handleAddMinute = (minute: MeetingMinutes) => setMinutes(prev => [minute, ...prev]);
  const handleDeleteMinute = (id: string) => {
      if(window.confirm("Delete these minutes?")) setMinutes(prev => prev.filter(m => m.id !== id));
  };

  const handleAddAccountHead = (head: AccountHead) => setAccountHeads(prev => [...prev, head]);
  
  const handleDeleteAccountHead = (id: string) => {
      // SECURITY GUARD: Check for General Ledger transactions
      const hasTransactions = expenses.some(e => e.accountHeadId === id);
      if (hasTransactions) {
          alert("CRITICAL SECURITY ACTION DENIED:\n\nThis Account Head is being used in the General Ledger (Vouchers).\n\nTo delete this ledger, you must first delete or re-assign all vouchers linked to this head.");
          return;
      }

      if (window.confirm("Remove this account head from society master?")) {
          setAccountHeads(prev => prev.filter(h => h.id !== id));
      }
  };

  // Permission Guard
  const hasAccess = (view: ViewState) => {
      if (currentUser.role === 'Admin') return true;
      if (view === 'SECURITY') return false; // Non-admins never see security
      return currentUser.permissions[view] === true;
  };

  const renderContent = () => {
    if (!hasAccess(currentView)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-[3rem] border border-slate-100 shadow-sm text-center p-12">
                <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-8">
                    <Lock size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">Access Restricted</h2>
                <p className="text-slate-500 max-w-md mb-8 font-medium leading-relaxed">
                    You do not have permission to access the <span className="text-indigo-600 font-bold">"{currentView.replace('_', ' ')}"</span> module. 
                    Please contact your Society Administrator to update your access profile.
                </p>
                <button 
                    onClick={() => setCurrentView('DASHBOARD')}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                    <ArrowLeft size={18} />
                    Return to Dashboard
                </button>
            </div>
        );
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard bills={activeBills} expenses={activeExpenses} residentCount={activeResidents.length} />;
      case 'SOCIETIES':
        return (
            <Societies 
                societies={societies} 
                activeSocietyId={activeSocietyId} 
                onAddSociety={handleAddSociety}
                onUpdateSociety={handleUpdateSociety}
                onDeleteSociety={handleDeleteSociety}
                onSelectSociety={(id) => { setActiveSocietyId(id); setCurrentView('DASHBOARD'); }}
                onCopyMasterData={handleCopyMasterData}
                balances={financialBalances}
            />
        );
      case 'RESIDENTS':
        return (
          <Residents 
            residents={activeResidents} 
            societyId={activeSocietyId} 
            onAddResident={handleAddResident} 
            onBulkAddResidents={handleBulkAddResidents}
            onUpdateResident={handleUpdateResident}
            onDeleteResident={handleDeleteResident}
            balances={financialBalances}
          />
        );
      case 'BILLING':
        return (
            <Billing 
                bills={activeBills} 
                residents={activeResidents} 
                societyId={activeSocietyId} 
                activeSociety={activeSociety}
                onGenerateBill={handleGenerateBill}
                onBulkAddBills={handleBulkAddBills}
                onUpdateSociety={handleUpdateSociety}
                onUpdateBill={handleUpdateBill}
                onBulkUpdateBills={handleBulkUpdateBills}
                balances={financialBalances}
            />
        );
      case 'RECEIPTS':
        return (
            <Receipts 
                bills={activeBills} 
                activeSociety={activeSociety} 
                onBulkUpdateBills={handleBulkUpdateBills}
                onUpdateBill={handleUpdateBill}
                balances={financialBalances}
            />
        );
      case 'INCOME':
        return (
            <IncomeSection 
                incomes={activeIncomes} 
                societyId={activeSocietyId} 
                onAddIncome={handleAddIncome} 
                balances={financialBalances}
            />
        );
      case 'EXPENSES':
        return (
            <Expenses 
                expenses={activeExpenses} 
                societyId={activeSocietyId} 
                onAddExpense={handleAddExpense} 
                residents={activeResidents}
                bills={activeBills}
                balances={financialBalances}
            />
        );
      case 'VOUCHERS':
        return (
            <PaymentVouchers 
                expenses={activeExpenses} 
                activeSociety={activeSociety} 
                onAddExpense={handleAddExpense} 
                balances={financialBalances}
                accountHeads={activeAccountHeads}
                onAddAccountHead={handleAddAccountHead}
                onDeleteAccountHead={handleDeleteAccountHead}
            />
        );
      case 'STATEMENTS':
        return (
            <Statements 
                bills={activeBills} 
                expenses={activeExpenses} 
                residents={activeResidents} 
                activeSociety={activeSociety}
                balances={financialBalances}
            />
        );
      case 'BANK_RECONCILIATION':
        return (
            <BankReconciliation 
                bills={activeBills} 
                expenses={activeExpenses} 
                activeSociety={activeSociety} 
                balances={financialBalances}
            />
        );
      case 'STATUTORY_REGISTERS':
        return (
            <StatutoryRegisters 
                residents={activeResidents} 
                activeSociety={activeSociety}
                bills={activeBills}
                expenses={activeExpenses}
                incomes={activeIncomes}
                balances={financialBalances}
            />
        );
      case 'REPORTS':
        return (
            <Reports 
                bills={activeBills} 
                expenses={activeExpenses} 
                residents={activeResidents} 
                activeSociety={activeSociety} 
                incomes={activeIncomes} 
                balances={financialBalances}
            />
        );
      case 'MINUTES':
        return (
            <Minutes 
                minutesList={activeMinutes} 
                activeSociety={activeSociety} 
                onAddMinute={handleAddMinute} 
                onDeleteMinute={handleDeleteMinute} 
                balances={financialBalances}
            />
        );
      case 'NOTICES':
        return (
            <Notices 
                notices={activeNotices} 
                societyId={activeSocietyId} 
                onAddNotice={handleAddNotice} 
                balances={financialBalances}
            />
        );
      case 'SECURITY':
        return (
            <Security 
                users={users}
                onUpdateUser={handleUpdateUser}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                balances={financialBalances}
            />
        );
      case 'TEMPLATES':
        return <Templates balances={financialBalances} />;
      case 'KNOWLEDGE_BASE':
        return <KnowledgeBase balances={financialBalances} />;
      case 'AI_INSIGHTS':
        return <AIInsights bills={activeBills} expenses={activeExpenses} balances={financialBalances} />;
      default:
        return <Dashboard bills={activeBills} expenses={activeExpenses} residentCount={activeResidents.length} />;
    }
  };

  const getHeaderTitle = () => {
      if (currentView === 'AI_INSIGHTS') return 'AI Financial Analysis';
      if (currentView === 'SOCIETIES') return 'Society Registry';
      if (currentView === 'KNOWLEDGE_BASE') return 'Society Knowledge Hub';
      if (currentView === 'SECURITY') return 'Access Control Panel';
      return currentView.replace('_', ' ');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} currentUser={currentUser} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen relative">
        <header className="sticky top-0 z-40 flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-slate-100 transition-all">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tighter">
              {getHeaderTitle()}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Admin Control Panel</p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
            {/* Quick User Switch (Demo Purpose) */}
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                <ShieldAlert size={18} className="text-indigo-600" />
                <select 
                    className="bg-transparent text-xs font-black text-indigo-700 outline-none uppercase"
                    value={activeUserId}
                    onChange={e => { setActiveUserId(e.target.value); setCurrentView('DASHBOARD'); }}
                >
                    {users.map(u => <option key={u.id} value={u.id}>{u.role}: {u.name}</option>)}
                </select>
            </div>

            <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-100" title="Cash Balance">
                    <Wallet size={18} className="text-green-600" />
                    <div>
                        <p className="text-[10px] text-green-700 font-black uppercase">Cash</p>
                        <p className="text-sm font-bold text-slate-800">₹{financialBalances.cash.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100" title="Bank Balance">
                    <Landmark size={18} className="text-blue-600" />
                    <div>
                        <p className="text-[10px] text-blue-700 font-black uppercase">Bank</p>
                        <p className="text-sm font-bold text-slate-800">₹{financialBalances.bank.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden lg:block"></div>

            <div className="flex items-center gap-3 text-right bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 w-full lg:w-auto justify-center lg:justify-end">
                <Clock className="text-indigo-600" size={24} />
                <div>
                  <p className="text-xl font-black text-slate-700 leading-none">
                    {currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                    {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden lg:block"></div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <div className="text-right hidden lg:block">
                <p className="text-sm font-black text-indigo-900">{activeSociety.name}</p>
                <p className="text-[10px] font-bold text-slate-400">ID: {activeSociety.id}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black border-2 border-indigo-200 shadow-md shrink-0">
                {activeSociety.name.substring(0, 2).toUpperCase()}
                </div>
            </div>
          </div>
        </header>
        
        <div className="pb-8">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
