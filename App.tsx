
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
import { ViewState, Bill, Resident, Expense, Notice, Society, MeetingMinutes, Income, PaymentStatus } from './types';
import { MOCK_BILLS, MOCK_EXPENSES, MOCK_NOTICES, MOCK_RESIDENTS, MOCK_SOCIETIES, MOCK_MINUTES, MOCK_INCOME } from './constants';
import { Clock, Wallet, Landmark } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Centralized State (Simulating Database)
  const [societies, setSocieties] = useState<Society[]>(MOCK_SOCIETIES);
  const [activeSocietyId, setActiveSocietyId] = useState<string>(MOCK_SOCIETIES[0].id);
  
  const [residents, setResidents] = useState<Resident[]>(MOCK_RESIDENTS);
  const [bills, setBills] = useState<Bill[]>(MOCK_BILLS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [incomes, setIncomes] = useState<Income[]>(MOCK_INCOME);
  const [notices, setNotices] = useState<Notice[]>(MOCK_NOTICES);
  const [minutes, setMinutes] = useState<MeetingMinutes[]>(MOCK_MINUTES);

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

  // --- BALANCE CALCULATION LOGIC ---
  const financialBalances = useMemo(() => {
      let cash = 0;
      let bank = 0;

      // 1. Add Income from Bills (Collections)
      activeBills.forEach(b => {
          if (b.status === PaymentStatus.PAID && b.paymentDetails) {
              if (b.paymentDetails.mode === 'Cash') {
                  cash += b.totalAmount;
              } else {
                  bank += b.totalAmount; // UPI, Cheque, Bank Transfer
              }
          }
      });

      // 2. Add Other Income (Receipt Vouchers)
      activeIncomes.forEach(i => {
          if (i.mode === 'Cash') {
              cash += i.amount;
          } else {
              bank += i.amount;
          }
      });

      // 3. Subtract Expenses
      activeExpenses.forEach(e => {
          if (e.paymentMode === 'Cash') {
              cash -= e.amount;
          } else if (e.paymentMode !== 'Journal' && e.paymentMode !== 'Debit Note' && e.paymentMode !== 'Credit Note') {
              bank -= e.amount; // Cheque, Online
          }
      });

      return { cash, bank };
  }, [activeBills, activeIncomes, activeExpenses]);

  // Handlers
  const handleAddSociety = (society: Society) => {
    setSocieties(prev => [...prev, society]);
    setActiveSocietyId(society.id); // Switch to new society
  };

  const handleUpdateSociety = (updatedSociety: Society) => {
    setSocieties(prev => prev.map(s => s.id === updatedSociety.id ? updatedSociety : s));
  };

  const handleDeleteSociety = (id: string) => {
    if (societies.length <= 1) {
      alert("Cannot delete the last society. You must have at least one active society.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this society? This will hide all associated residents and data.")) {
       const newSocieties = societies.filter(s => s.id !== id);
       setSocieties(newSocieties);
       
       if (id === activeSocietyId) {
         setActiveSocietyId(newSocieties[0].id);
       }
    }
  };

  const handleAddResident = (resident: Resident) => {
    setResidents(prev => [...prev, resident]);
  };

  const handleBulkAddResidents = (newResidents: Resident[]) => {
    setResidents(prev => [...prev, ...newResidents]);
  };

  const handleUpdateResident = (updatedResident: Resident) => {
    setResidents(prev => prev.map(r => r.id === updatedResident.id ? updatedResident : r));
  };

  const handleDeleteResident = (id: string) => {
    if(window.confirm("Are you sure you want to remove this resident?")) {
      setResidents(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleGenerateBill = (bill: Bill) => {
    setBills(prev => [bill, ...prev]);
  };

  const handleBulkAddBills = (newBills: Bill[]) => {
    setBills(prev => [...newBills, ...prev]);
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
  };

  const handleBulkUpdateBills = (updatedBills: Bill[]) => {
    setBills(prev => prev.map(b => {
      const updated = updatedBills.find(ub => ub.id === b.id);
      return updated ? updated : b;
    }));
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
  };

  const handleAddIncome = (income: Income) => {
    setIncomes(prev => [income, ...prev]);
  };

  const handleAddNotice = (notice: Notice) => {
    setNotices(prev => [notice, ...prev]);
  };

  const handleAddMinute = (minute: MeetingMinutes) => {
    setMinutes(prev => [minute, ...prev]);
  };

  const handleDeleteMinute = (id: string) => {
      if(window.confirm("Are you sure you want to delete these minutes?")) {
          setMinutes(prev => prev.filter(m => m.id !== id));
      }
  };

  const renderContent = () => {
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
      case 'TEMPLATES':
        return <Templates balances={financialBalances} />;
      case 'AI_INSIGHTS':
        return <AIInsights bills={activeBills} expenses={activeExpenses} balances={financialBalances} />;
      default:
        return <Dashboard bills={activeBills} expenses={activeExpenses} residentCount={activeResidents.length} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen relative">
        <header className="sticky top-0 z-40 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-slate-100 transition-all">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-slate-800">
              {currentView === 'AI_INSIGHTS' ? 'AI Analysis & Insights' : 
               currentView === 'SOCIETIES' ? 'My Societies' :
               currentView === 'REPORTS' ? 'Financial Reports' :
               currentView === 'MINUTES' ? 'Meeting Minutes' :
               currentView === 'RESIDENTS' ? 'Members' :
               currentView === 'RECEIPTS' ? 'Members Receipts' :
               currentView === 'INCOME' ? 'Receipt Voucher' :
               currentView === 'EXPENSES' ? 'Ledger (Personal & General)' :
               currentView === 'VOUCHERS' ? 'Payment Vouchers' :
               currentView === 'TEMPLATES' ? 'Templates' :
               currentView === 'STATUTORY_REGISTERS' ? 'Statutory Registers & Audit' :
               currentView.charAt(0) + currentView.slice(1).toLowerCase().replace('_', ' ')}
            </h2>
            <p className="text-slate-500 text-sm">Welcome back, Admin</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {/* Live Financial Stats in Header */}
            <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-100" title="Cash Balance">
                    <Wallet size={18} className="text-green-600" />
                    <div>
                        <p className="text-[10px] text-green-700 font-bold uppercase">Cash Bal</p>
                        <p className="text-sm font-bold text-slate-800">₹{financialBalances.cash.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100" title="Bank Balance">
                    <Landmark size={18} className="text-blue-600" />
                    <div>
                        <p className="text-[10px] text-blue-700 font-bold uppercase">Bank Bal</p>
                        <p className="text-sm font-bold text-slate-800">₹{financialBalances.bank.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

            {/* Live Time & Date */}
            <div className="flex items-center gap-3 text-right bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 w-full md:w-auto justify-center md:justify-end">
                <Clock className="text-indigo-600" size={24} />
                <div>
                  <p className="text-xl font-bold text-slate-700 leading-none">
                    {currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
                    {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-800">{activeSociety.name}</p>
                <p className="text-xs text-slate-500">Reg: {activeSociety.registrationNumber || 'N/A'}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-200 shadow-sm shrink-0">
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
