
import React, { useState, useMemo } from 'react';
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
import { ViewState, Bill, Resident, Expense, Notice, Society, MeetingMinutes, Income } from './types';
import { MOCK_BILLS, MOCK_EXPENSES, MOCK_NOTICES, MOCK_RESIDENTS, MOCK_SOCIETIES, MOCK_MINUTES, MOCK_INCOME } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
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
       
       // If the deleted society was the active one, switch to the first available one
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
            />
        );
      case 'RECEIPTS':
        return (
            <Receipts 
                bills={activeBills} 
                activeSociety={activeSociety} 
                onBulkUpdateBills={handleBulkUpdateBills}
            />
        );
      case 'INCOME':
        return (
            <IncomeSection 
                incomes={activeIncomes} 
                societyId={activeSocietyId} 
                onAddIncome={handleAddIncome} 
            />
        );
      case 'EXPENSES':
        return <Expenses expenses={activeExpenses} societyId={activeSocietyId} onAddExpense={handleAddExpense} />;
      case 'VOUCHERS':
        return (
            <PaymentVouchers 
                expenses={activeExpenses} 
                activeSociety={activeSociety} 
                onAddExpense={handleAddExpense} 
            />
        );
      case 'STATEMENTS':
        return (
            <Statements 
                bills={activeBills} 
                expenses={activeExpenses} 
                residents={activeResidents}
                activeSociety={activeSociety}
            />
        );
      case 'BANK_RECONCILIATION':
        return (
            <BankReconciliation 
                bills={activeBills} 
                expenses={activeExpenses} 
                activeSociety={activeSociety} 
            />
        );
      case 'STATUTORY_REGISTERS':
        return (
            <StatutoryRegisters 
                residents={activeResidents} 
                activeSociety={activeSociety} 
            />
        );
      case 'REPORTS':
        return <Reports bills={activeBills} expenses={activeExpenses} residents={activeResidents} activeSociety={activeSociety} />;
      case 'MINUTES':
        return (
            <Minutes 
                minutesList={activeMinutes} 
                activeSociety={activeSociety} 
                onAddMinute={handleAddMinute} 
                onDeleteMinute={handleDeleteMinute} 
            />
        );
      case 'NOTICES':
        return <Notices notices={activeNotices} societyId={activeSocietyId} onAddNotice={handleAddNotice} />;
      case 'AI_INSIGHTS':
        return <AIInsights bills={activeBills} expenses={activeExpenses} />;
      default:
        return <Dashboard bills={activeBills} expenses={activeExpenses} residentCount={activeResidents.length} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {currentView === 'AI_INSIGHTS' ? 'AI Analysis & Insights' : 
               currentView === 'SOCIETIES' ? 'My Societies' :
               currentView === 'REPORTS' ? 'Reports & Balance Sheet' :
               currentView === 'MINUTES' ? 'Meeting Minutes' :
               currentView === 'RESIDENTS' ? 'Members' :
               currentView === 'INCOME' ? 'Other Income' :
               currentView === 'VOUCHERS' ? 'Payment Vouchers' :
               currentView.charAt(0) + currentView.slice(1).toLowerCase().replace('_', ' ')}
            </h2>
            <p className="text-slate-500 text-sm">Welcome back, Admin</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-800">{activeSociety.name}</p>
              <p className="text-xs text-slate-500">Reg: {activeSociety.registrationNumber || 'N/A'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-200">
              {activeSociety.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
