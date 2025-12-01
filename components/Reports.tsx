import React, { useState, useMemo } from 'react';
import { Bill, Expense, Resident, Society, PaymentStatus, Income } from '../types';
import { Download, TrendingUp, Scale, AlertCircle, FileBarChart, Coins, ArrowRightLeft, Calendar } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface ReportsProps {
  bills: Bill[];
  expenses: Expense[];
  residents: Resident[];
  activeSociety: Society;
  incomes: Income[];
}

type ReportType = 'BALANCE_SHEET' | 'TRIAL_BALANCE' | 'RECEIPTS_AND_PAYMENTS';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const Reports: React.FC<ReportsProps> = ({ bills, expenses, residents, activeSociety, incomes }) => {
  const [activeTab, setActiveTab] = useState<ReportType>('BALANCE_SHEET');
  // Default to current year ending March (e.g., if today is Oct 2023, current FY is 2023-24, ending 2024)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  // If month is Jan-Mar (0-2), FY ends this year. Else next year.
  const defaultFYEnd = currentMonth < 3 ? currentYear : currentYear + 1;
  
  const [selectedFYEnd, setSelectedFYEnd] = useState<number>(defaultFYEnd);

  // Helper to calculate financials for a specific date range
  const calculateFinancialsForPeriod = (fyEndYear: number) => {
    const startStr = `${fyEndYear - 1}-04-01`;
    const endStr = `${fyEndYear}-03-31`;

    const isInPeriod = (dateStr: string) => dateStr >= startStr && dateStr <= endStr;

    // Filter Data
    const periodBills = bills.filter(b => isInPeriod(b.generatedDate));
    const periodExpenses = expenses.filter(e => isInPeriod(e.date));
    const periodIncomes = incomes.filter(i => isInPeriod(i.date));

    // 1. Income (Billed)
    const totalBilled = periodBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const collectedAmount = periodBills
      .filter(b => b.status === PaymentStatus.PAID)
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    // Other Income
    const totalOtherIncome = periodIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalIncome = totalBilled + totalOtherIncome;

    // 2. Receivables (Assets) - Point in time (Cumulative usually, but for period view we take bills generated)
    // For Balance Sheet items (Assets/Liabilities), usually it's "As on Date". 
    // Simplified logic: We sum up pending bills generated *up to* end date.
    const pendingBillsAmount = bills
      .filter(b => b.generatedDate <= endStr && (b.status === PaymentStatus.PENDING || b.status === PaymentStatus.OVERDUE))
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    const totalOpeningBalances = residents.reduce((sum, r) => sum + r.openingBalance, 0);
    const totalReceivables = pendingBillsAmount + totalOpeningBalances;

    // 3. Expenditure
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Cash Position (Assets) - Simplified: Cash In - Cash Out (Cumulative)
    // We calculate cumulative cash up to endStr
    const allIncomesTillDate = incomes.filter(i => i.date <= endStr).reduce((s, i) => s + i.amount, 0);
    const allCollectionsTillDate = bills.filter(b => b.status === PaymentStatus.PAID && b.paymentDetails && b.paymentDetails.date <= endStr).reduce((s, b) => s + b.totalAmount, 0);
    const allExpensesTillDate = expenses.filter(e => e.date <= endStr).reduce((s, e) => s + e.amount, 0);
    
    // Assuming 0 opening cash for simplicity or derived from residents opening balance?
    // Let's stick to the simpler formula used previously but time-bounded
    const cashInHand = (allCollectionsTillDate + allIncomesTillDate) - allExpensesTillDate;

    // 5. Net Surplus (For the Period)
    const netSurplus = totalIncome - totalExpenses;
    
    // 6. Assets Breakdown
    const fixedAssets = 0; 
    const currentAssets = cashInHand + totalReceivables;
    const totalAssets = fixedAssets + currentAssets;
    
    // Liabilities
    const totalFunds = totalAssets; // Balancing figure simplified

    // Grouping Expenses for UI
    const expensesByCategory = periodExpenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    return {
      totalBilled,
      totalOtherIncome,
      totalIncome,
      collectedAmount,
      totalExpenses,
      cashInHand,
      totalReceivables,
      netSurplus,
      totalAssets,
      fixedAssets,
      currentAssets,
      totalFunds,
      totalOpeningBalances,
      expensesByCategory,
      periodIncomes,
      periodExpenses
    };
  };

  const financials = useMemo(() => {
    return {
        current: calculateFinancialsForPeriod(selectedFYEnd),
        previous: calculateFinancialsForPeriod(selectedFYEnd - 1)
    };
  }, [bills, expenses, residents, incomes, selectedFYEnd]);

  // Trial Balance Data (Current Year Only usually, but let's stick to standard single col for TB or reuse Comparative logic if needed)
  // Standard TB is usually for a period. We will use Current Year data for TB.
  const trialBalanceData = useMemo(() => {
      const currentStats = financials.current;
      const ledgers: { name: string, debit: number, credit: number, group: string }[] = [];

      // Debits
      Object.entries(currentStats.expensesByCategory).forEach(([cat, amt]) => {
          ledgers.push({ name: `${cat} Expenses`, debit: amt, credit: 0, group: 'Expenses' });
      });
      ledgers.push({ name: 'Sundry Debtors (Members)', debit: currentStats.totalReceivables, credit: 0, group: 'Current Assets' });
      ledgers.push({ name: 'Cash / Bank Balance', debit: currentStats.cashInHand, credit: 0, group: 'Current Assets' });

      // Credits
      ledgers.push({ name: 'Maintenance Income', debit: 0, credit: currentStats.totalBilled, group: 'Direct Income' });
      currentStats.periodIncomes.forEach(i => {
          ledgers.push({ name: `${i.category} - ${i.description}`, debit: 0, credit: i.amount, group: 'Indirect Income' });
      });
      if (currentStats.totalOpeningBalances > 0) {
          ledgers.push({ name: 'Opening Reserves', debit: 0, credit: currentStats.totalOpeningBalances, group: 'Capital Account' });
      }

      const totalDebit = ledgers.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = ledgers.reduce((sum, l) => sum + l.credit, 0);

      return { ledgers, totalDebit, totalCredit };
  }, [financials]);

  // Receipts and Payments (Current Year)
  const receiptsAndPaymentsData = useMemo(() => {
    // We'll focus on the Selected FY for R&P
    const startStr = `${selectedFYEnd - 1}-04-01`;
    const endStr = `${selectedFYEnd}-03-31`;
    const isInPeriod = (dateStr: string) => dateStr >= startStr && dateStr <= endStr;

    // 1. Receipts
    const maintenanceCollections = bills
      .filter(b => b.status === PaymentStatus.PAID && b.paymentDetails && isInPeriod(b.paymentDetails.date))
      .reduce((sum: number, b) => sum + b.totalAmount, 0);

    const otherIncomesByCategory: Record<string, number> = {};
    incomes.filter(i => isInPeriod(i.date)).forEach(i => {
      otherIncomesByCategory[i.category] = (otherIncomesByCategory[i.category] || 0) + i.amount;
    });

    // 2. Payments
    const expensesByCategory: Record<string, number> = {};
    expenses.filter(e => isInPeriod(e.date)).forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    // Opening Balance (Cash in hand BEFORE start date)
    const prevStats = financials.previous;
    const openingBalance = prevStats.cashInHand; // Closing of prev year is Opening of this year

    const totalReceipts = openingBalance + maintenanceCollections + (Object.values(otherIncomesByCategory) as number[]).reduce((a: number, b: number) => a + b, 0);
    const totalPayments = (Object.values(expensesByCategory) as number[]).reduce((a: number, b: number) => a + b, 0);
    const closingBalance = totalReceipts - totalPayments;

    return {
      openingBalance,
      maintenanceCollections,
      otherIncomesByCategory,
      expensesByCategory,
      totalReceipts,
      totalPayments,
      closingBalance
    };
  }, [bills, incomes, expenses, selectedFYEnd, financials.previous]);

  const downloadReport = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const opt = {
      margin:       0.3,
      filename:     `${activeTab}_FY${selectedFYEnd}_${activeSociety.name}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save();
  };

  const formatMoney = (amount: number) => {
      return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Financial Reports</h2>
           <p className="text-sm text-slate-500 mt-1">Comparative Statements & Balance Sheet</p>
        </div>
        
        {/* Year Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <Calendar className="text-indigo-600" size={20} />
            <span className="text-sm font-bold text-slate-700">Financial Year:</span>
            <select 
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedFYEnd}
                onChange={(e) => setSelectedFYEnd(Number(e.target.value))}
            >
                {[0, 1, 2, 3].map(offset => {
                    const year = new Date().getFullYear() + 1 - offset;
                    return <option key={year} value={year}>{year - 1}-{year}</option>
                })}
            </select>
        </div>
      </div>

      <StandardToolbar 
        onPrint={downloadReport} 
        onSearch={() => alert("Search within reports")}
        onSave={() => alert("Reports are auto-generated")}
      />
      
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200 pb-1 flex-wrap">
          <button 
            onClick={() => setActiveTab('BALANCE_SHEET')}
            className={`px-4 md:px-6 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'BALANCE_SHEET' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <FileBarChart size={18} /> Balance Sheet
          </button>
          <button 
            onClick={() => setActiveTab('TRIAL_BALANCE')}
            className={`px-4 md:px-6 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'TRIAL_BALANCE' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Scale size={18} /> Trial Balance
          </button>
          <button 
            onClick={() => setActiveTab('RECEIPTS_AND_PAYMENTS')}
            className={`px-4 md:px-6 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'RECEIPTS_AND_PAYMENTS' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <ArrowRightLeft size={18} /> Receipts & Payments
          </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Income ({selectedFYEnd-1}-{selectedFYEnd.toString().slice(-2)})</p>
              <p className="text-xl font-bold text-slate-800">₹{formatMoney(financials.current.totalIncome)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Expense</p>
              <p className="text-xl font-bold text-red-600">₹{formatMoney(financials.current.totalExpenses)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Net Surplus</p>
              <p className={`text-xl font-bold ${financials.current.netSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{formatMoney(financials.current.netSurplus)}
              </p>
          </div>
           <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Cash in Hand</p>
              <p className="text-xl font-bold text-indigo-600">₹{formatMoney(financials.current.cashInHand)}</p>
          </div>
      </div>

      {/* Report Preview */}
      <div className="bg-slate-200 p-4 md:p-8 rounded-xl overflow-auto flex justify-center border border-slate-300 min-h-[600px]">
        <div 
          id="report-content" 
          className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-xl text-slate-800"
        >
          {/* Report Header */}
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900">{activeSociety.name}</h1>
            <p className="text-slate-600 mt-2 whitespace-pre-wrap">{activeSociety.address}</p>
            {activeSociety.registrationNumber && <p className="text-sm text-slate-500 mt-1">Reg No: {activeSociety.registrationNumber}</p>}
            <h2 className="text-xl font-semibold mt-6 underline decoration-indigo-500 underline-offset-4 uppercase">
                {activeTab === 'BALANCE_SHEET' ? 'Statement of Accounts & Balance Sheet' : 
                 activeTab === 'TRIAL_BALANCE' ? 'Trial Balance Report' : 
                 'Receipts & Payments Account'}
            </h2>
            <p className="text-sm text-slate-800 font-bold mt-2 uppercase">
                For the Year Ended 31st March, {selectedFYEnd}
            </p>
          </div>

          {activeTab === 'BALANCE_SHEET' && (
              <>
                {/* Income & Expenditure Statement */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} /> Income & Expenditure Account
                    </h3>
                    
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="border border-slate-300 p-2 text-right w-24">Prev Year<br/>({selectedFYEnd-2}-{selectedFYEnd-1})</th>
                                <th className="border border-slate-300 p-2 text-left">Expenditure</th>
                                <th className="border border-slate-300 p-2 text-right w-32">Current Year<br/>({selectedFYEnd-1}-{selectedFYEnd})</th>
                                <th className="border border-slate-300 p-2 text-right w-24">Prev Year<br/>({selectedFYEnd-2}-{selectedFYEnd-1})</th>
                                <th className="border border-slate-300 p-2 text-left">Income</th>
                                <th className="border border-slate-300 p-2 text-right w-32">Current Year<br/>({selectedFYEnd-1}-{selectedFYEnd})</th>
                            </tr>
                        </thead>
                        <tbody className="align-top">
                            <tr>
                                {/* --- EXPENDITURE COLUMN --- */}
                                <td className="border-l border-slate-300 p-0" colSpan={3}>
                                    <table className="w-full">
                                        <tbody>
                                            {/* Get unique categories from both years */}
                                            {Array.from(new Set([
                                                ...Object.keys(financials.current.expensesByCategory), 
                                                ...Object.keys(financials.previous.expensesByCategory)
                                            ])).map((cat, i) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    <td className="p-2 text-right w-24 text-slate-500">
                                                        {formatMoney(financials.previous.expensesByCategory[cat] || 0)}
                                                    </td>
                                                    <td className="p-2 text-slate-700">{cat}</td>
                                                    <td className="p-2 text-right w-32 font-medium">
                                                        {formatMoney(financials.current.expensesByCategory[cat] || 0)}
                                                    </td>
                                                </tr>
                                            ))}
                                            
                                            {/* Surplus Row */}
                                            <tr className="bg-green-50 font-bold border-t border-slate-300">
                                                <td className="p-2 text-right w-24 text-green-700">
                                                    {financials.previous.netSurplus > 0 ? formatMoney(financials.previous.netSurplus) : ''}
                                                </td>
                                                <td className="p-2 text-green-900">Excess of Income over Expenditure (Surplus)</td>
                                                <td className="p-2 text-right w-32 text-green-900">
                                                    {financials.current.netSurplus > 0 ? formatMoney(financials.current.netSurplus) : ''}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>

                                {/* --- INCOME COLUMN --- */}
                                <td className="border-l border-r border-slate-300 p-0" colSpan={3}>
                                    <table className="w-full">
                                        <tbody>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-2 text-right w-24 text-slate-500">{formatMoney(financials.previous.totalBilled)}</td>
                                                <td className="p-2 text-slate-700">Maintenance Charges</td>
                                                <td className="p-2 text-right w-32 font-medium">{formatMoney(financials.current.totalBilled)}</td>
                                            </tr>
                                            {/* We group other incomes by category for cleaner comparative view */}
                                            {Array.from(new Set([
                                                ...financials.current.periodIncomes.map(i => i.category),
                                                ...financials.previous.periodIncomes.map(i => i.category)
                                            ])).map((cat, i) => {
                                                const currAmt = financials.current.periodIncomes.filter(inc => inc.category === cat).reduce((s, x) => s + x.amount, 0);
                                                const prevAmt = financials.previous.periodIncomes.filter(inc => inc.category === cat).reduce((s, x) => s + x.amount, 0);
                                                return (
                                                    <tr key={i} className="border-b border-slate-100">
                                                        <td className="p-2 text-right w-24 text-slate-500">{formatMoney(prevAmt)}</td>
                                                        <td className="p-2 text-slate-700">{cat}</td>
                                                        <td className="p-2 text-right w-32 font-medium">{formatMoney(currAmt)}</td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Deficit Row */}
                                            {(financials.current.netSurplus < 0 || financials.previous.netSurplus < 0) && (
                                                <tr className="bg-red-50 font-bold border-t border-slate-300">
                                                     <td className="p-2 text-right w-24 text-red-700">
                                                        {financials.previous.netSurplus < 0 ? formatMoney(Math.abs(financials.previous.netSurplus)) : ''}
                                                    </td>
                                                    <td className="p-2 text-red-900">Excess of Expenditure over Income (Deficit)</td>
                                                    <td className="p-2 text-right w-32 text-red-900">
                                                        {financials.current.netSurplus < 0 ? formatMoney(Math.abs(financials.current.netSurplus)) : ''}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-800 text-white font-bold">
                            <tr>
                                <td className="p-2 text-right w-24 border-r border-slate-600">
                                    {formatMoney(Math.max(financials.previous.totalIncome, financials.previous.totalExpenses))}
                                </td>
                                <td className="p-2 text-center">TOTAL</td>
                                <td className="p-2 text-right w-32 border-r border-slate-600">
                                    {formatMoney(Math.max(financials.current.totalIncome, financials.current.totalExpenses))}
                                </td>
                                
                                <td className="p-2 text-right w-24 border-r border-slate-600">
                                    {formatMoney(Math.max(financials.previous.totalIncome, financials.previous.totalExpenses))}
                                </td>
                                <td className="p-2 text-center">TOTAL</td>
                                <td className="p-2 text-right w-32">
                                    {formatMoney(Math.max(financials.current.totalIncome, financials.current.totalExpenses))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Balance Sheet */}
                <div className="break-inside-avoid">
                    <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
                    <Coins size={18} /> Balance Sheet
                    </h3>
                    
                     <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="border border-slate-300 p-2 text-right w-24">Prev Year</th>
                                <th className="border border-slate-300 p-2 text-left">Liabilities</th>
                                <th className="border border-slate-300 p-2 text-right w-32">Current Year</th>
                                <th className="border border-slate-300 p-2 text-right w-24">Prev Year</th>
                                <th className="border border-slate-300 p-2 text-left">Assets</th>
                                <th className="border border-slate-300 p-2 text-right w-32">Current Year</th>
                            </tr>
                        </thead>
                        <tbody className="align-top">
                            <tr>
                                {/* --- LIABILITIES --- */}
                                <td className="border-l border-slate-300 p-0" colSpan={3}>
                                    <table className="w-full">
                                        <tbody>
                                            <tr className="border-b border-slate-100 font-bold bg-slate-50">
                                                <td colSpan={3} className="p-2">Reserves & Surplus</td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-2 text-right w-24 text-slate-500">{formatMoney(financials.previous.totalOpeningBalances)}</td>
                                                <td className="p-2 pl-4 text-slate-700">Opening Balance</td>
                                                <td className="p-2 text-right w-32 font-medium">{formatMoney(financials.current.totalOpeningBalances)}</td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-2 text-right w-24 text-slate-500">{formatMoney(financials.previous.netSurplus)}</td>
                                                <td className="p-2 pl-4 text-slate-700">Add: Current Surplus</td>
                                                <td className="p-2 text-right w-32 font-medium">{formatMoney(financials.current.netSurplus)}</td>
                                            </tr>
                                            <tr className="border-b border-slate-100 font-semibold bg-indigo-50">
                                                <td className="p-2 text-right w-24 text-slate-600">{formatMoney(financials.previous.totalFunds)}</td>
                                                <td className="p-2 text-indigo-800">Total Reserves</td>
                                                <td className="p-2 text-right w-32 text-indigo-800">{formatMoney(financials.current.totalFunds)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>

                                {/* --- ASSETS --- */}
                                <td className="border-l border-r border-slate-300 p-0" colSpan={3}>
                                    <table className="w-full">
                                        <tbody>
                                            <tr className="border-b border-slate-100 font-bold bg-slate-50">
                                                <td colSpan={3} className="p-2">Fixed Assets</td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-2 text-right w-24 text-slate-500">{formatMoney(financials.previous.fixedAssets)}</td>
                                                <td className="p-2 pl-4 text-slate-700">Property, Plant & Equipment</td>
                                                <td className="p-2 text-right w-32 font-medium">{formatMoney(financials.current.fixedAssets)}</td>
                                            </tr>

                                            <tr className="border-b border-slate-100 font-bold bg-slate-50">
                                                <td colSpan={3} className="p-2">Current Assets</td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-2 text-right w-24 text-slate-500">{formatMoney(financials.previous.cashInHand)}</td>
                                                <td className="p-2 pl-4 text-slate-700">Cash & Bank Balance</td>
                                                <td className="p-2 text-right w-32 font-medium">{formatMoney(financials.current.cashInHand)}</td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-2 text-right w-24 text-slate-500">{formatMoney(financials.previous.totalReceivables)}</td>
                                                <td className="p-2 pl-4 text-slate-700">Sundry Debtors (Receivables)</td>
                                                <td className="p-2 text-right w-32 font-medium">{formatMoney(financials.current.totalReceivables)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-800 text-white font-bold">
                            <tr>
                                <td className="p-2 text-right w-24 border-r border-slate-600">{formatMoney(financials.previous.totalFunds)}</td>
                                <td className="p-2 text-center">TOTAL</td>
                                <td className="p-2 text-right w-32 border-r border-slate-600">{formatMoney(financials.current.totalFunds)}</td>
                                
                                <td className="p-2 text-right w-24 border-r border-slate-600">{formatMoney(financials.previous.totalAssets)}</td>
                                <td className="p-2 text-center">TOTAL</td>
                                <td className="p-2 text-right w-32">{formatMoney(financials.current.totalAssets)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
              </>
          )}

          {activeTab === 'TRIAL_BALANCE' && (
             /* TRIAL BALANCE VIEW */
             <div className="break-inside-avoid">
                 <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
                    <Scale size={18} /> Trial Balance (FY {selectedFYEnd-1}-{selectedFYEnd})
                </h3>
                 <table className="w-full text-sm">
                     <thead>
                         <tr className="bg-slate-50 border-y border-slate-300">
                             <th className="text-left py-3 px-2 font-bold uppercase">Particulars</th>
                             <th className="text-left py-3 px-2 font-bold uppercase">Group</th>
                             <th className="text-right py-3 px-2 font-bold uppercase">Debit (₹)</th>
                             <th className="text-right py-3 px-2 font-bold uppercase">Credit (₹)</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {trialBalanceData.ledgers.map((row, idx) => (
                             <tr key={idx} className="hover:bg-slate-50">
                                 <td className="py-2 px-2 text-slate-700">{row.name}</td>
                                 <td className="py-2 px-2 text-slate-500 text-xs uppercase">{row.group}</td>
                                 <td className="py-2 px-2 text-right font-mono">{row.debit > 0 ? formatMoney(row.debit) : '-'}</td>
                                 <td className="py-2 px-2 text-right font-mono">{row.credit > 0 ? formatMoney(row.credit) : '-'}</td>
                             </tr>
                         ))}
                     </tbody>
                     <tfoot className="bg-slate-800 text-white border-t-2 border-slate-900">
                         <tr>
                             <td colSpan={2} className="py-3 px-2 font-bold text-right uppercase">Grand Total</td>
                             <td className="py-3 px-2 text-right font-bold font-mono">₹{formatMoney(trialBalanceData.totalDebit)}</td>
                             <td className="py-3 px-2 text-right font-bold font-mono">₹{formatMoney(trialBalanceData.totalCredit)}</td>
                         </tr>
                     </tfoot>
                 </table>
             </div>
          )}

          {activeTab === 'RECEIPTS_AND_PAYMENTS' && (
            /* RECEIPTS AND PAYMENTS VIEW */
            <div className="break-inside-avoid">
               <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
                 <ArrowRightLeft size={18} /> Receipts & Payments (FY {selectedFYEnd-1}-{selectedFYEnd})
               </h3>
               <div className="grid grid-cols-2 gap-8">
                 {/* Receipts Side */}
                 <div>
                   <table className="w-full text-sm">
                     <thead>
                       <tr className="border-b border-slate-300">
                         <th className="text-left py-2 font-semibold">Receipts</th>
                         <th className="text-right py-2 font-semibold">Amount (₹)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        <tr>
                           <td className="py-2 text-slate-700 font-semibold">To Opening Balance</td>
                           <td className="py-2 text-right"></td>
                        </tr>
                        <tr>
                           <td className="py-1 pl-4 text-slate-600">Cash & Bank (from Prev Year)</td>
                           <td className="py-1 text-right">₹{formatMoney(receiptsAndPaymentsData.openingBalance)}</td>
                        </tr>
                        
                        <tr>
                           <td className="py-2 text-slate-700 font-semibold mt-2">To Maintenance Collections</td>
                           <td className="py-2 text-right">₹{formatMoney(receiptsAndPaymentsData.maintenanceCollections)}</td>
                        </tr>

                        <tr>
                           <td className="py-2 text-slate-700 font-semibold mt-2">To Other Income</td>
                           <td className="py-2 text-right"></td>
                        </tr>
                        {Object.entries(receiptsAndPaymentsData.otherIncomesByCategory).map(([cat, amt], idx) => (
                           <tr key={idx}>
                             <td className="py-1 pl-4 text-slate-600">{cat}</td>
                             <td className="py-1 text-right">₹{formatMoney(Number(amt))}</td>
                           </tr>
                        ))}
                     </tbody>
                     <tfoot className="border-t-2 border-slate-800">
                        <tr>
                          <td className="py-2 font-bold">Total</td>
                          <td className="py-2 text-right font-bold">₹{formatMoney(receiptsAndPaymentsData.totalReceipts)}</td> 
                        </tr>
                     </tfoot>
                   </table>
                 </div>

                 {/* Payments Side */}
                 <div>
                    <table className="w-full text-sm">
                     <thead>
                       <tr className="border-b border-slate-300">
                         <th className="text-left py-2 font-semibold">Payments</th>
                         <th className="text-right py-2 font-semibold">Amount (₹)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        <tr>
                           <td className="py-2 text-slate-700 font-semibold">By Expenses</td>
                           <td className="py-2 text-right"></td>
                        </tr>
                        {Object.entries(receiptsAndPaymentsData.expensesByCategory).map(([cat, amt], idx) => (
                           <tr key={idx}>
                             <td className="py-1 pl-4 text-slate-600">{cat}</td>
                             <td className="py-1 text-right">₹{formatMoney(Number(amt))}</td>
                           </tr>
                        ))}
                        {Object.keys(receiptsAndPaymentsData.expensesByCategory).length === 0 && (
                            <tr><td className="py-1 pl-4 text-slate-400 italic">No payments recorded</td><td className="text-right">-</td></tr>
                        )}

                        <tr>
                           <td className="py-2 text-slate-700 font-semibold mt-2">By Closing Balance</td>
                           <td className="py-2 text-right"></td>
                        </tr>
                        <tr>
                           <td className="py-1 pl-4 text-slate-600">Cash & Bank</td>
                           <td className="py-1 text-right">₹{formatMoney(receiptsAndPaymentsData.closingBalance)}</td>
                        </tr>
                     </tbody>
                     <tfoot className="border-t-2 border-slate-800">
                        <tr>
                          <td className="py-2 font-bold">Total</td>
                          <td className="py-2 text-right font-bold">₹{formatMoney(receiptsAndPaymentsData.totalReceipts)}</td> 
                        </tr>
                     </tfoot>
                   </table>
                 </div>
               </div>
            </div>
          )}

          {/* Footer Signature */}
          <div className="flex justify-between items-end mt-16 break-inside-avoid">
              <div className="text-center">
                  <div className="h-12 w-32 mb-2 border-b border-slate-300"></div>
                  <p className="text-xs font-bold text-slate-600">Treasurer</p>
              </div>
              <div className="text-center">
                  <div className="h-12 w-32 mb-2 border-b border-slate-300"></div>
                  <p className="text-xs font-bold text-slate-600">Secretary</p>
              </div>
              <div className="text-center">
                  <div className="h-12 w-32 mb-2 border-b border-slate-300"></div>
                  <p className="text-xs font-bold text-slate-600">Auditor</p>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Reports;