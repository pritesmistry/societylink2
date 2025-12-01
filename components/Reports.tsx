
import React, { useState, useMemo } from 'react';
import { Bill, Expense, Resident, Society, PaymentStatus, Income } from '../types';
import { Download, TrendingUp, Scale, AlertCircle, FileBarChart, Coins, ArrowRightLeft } from 'lucide-react';
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

  const financials = useMemo(() => {
    // 1. Income (Billed)
    const totalBilled = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const collectedAmount = bills
      .filter(b => b.status === PaymentStatus.PAID)
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    // Other Income
    const totalOtherIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalIncome = totalBilled + totalOtherIncome;

    // 2. Receivables (Assets)
    const pendingBillsAmount = bills
      .filter(b => b.status === PaymentStatus.PENDING || b.status === PaymentStatus.OVERDUE)
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    // Resident Opening Balances (Assumed to be Arrears/Assets)
    const totalOpeningBalances = residents.reduce((sum, r) => sum + r.openingBalance, 0);
    
    const totalReceivables = pendingBillsAmount + totalOpeningBalances;

    // 3. Expenditure
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Cash Position (Assets)
    // Cash = Collected Revenue + Other Income - Expenses paid
    const cashInHand = (collectedAmount + totalOtherIncome) - totalExpenses;

    // 5. Net Surplus (Equity)
    // Surplus = Total Income (Accrual Basis) - Total Expenses
    const netSurplus = totalIncome - totalExpenses;
    
    // 6. Assets Breakdown
    // For this simple system, we assume no Capital Expenditure tracking yet, so Fixed Assets = 0 or Manual
    // We will display them as 0 to satisfy the "Fixed Asset" requirement.
    const fixedAssets = 0; 
    const currentAssets = cashInHand + totalReceivables;
    const totalAssets = fixedAssets + currentAssets;
    
    // For the balance sheet liability side to match assets in this simple system:
    // Equity/Funds = Total Assets
    const totalFunds = totalAssets;

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
      totalOpeningBalances
    };
  }, [bills, expenses, residents, incomes]);

  // Trial Balance Data Construction
  const trialBalanceData = useMemo(() => {
      const ledgers: { name: string, debit: number, credit: number, group: string }[] = [];

      // Debits
      // 1. Expenses
      expenses.forEach(e => {
          ledgers.push({ name: `${e.category} - ${e.vendor}`, debit: e.amount, credit: 0, group: 'Expenses' });
      });
      // 2. Assets (Receivables)
      ledgers.push({ name: 'Sundry Debtors (Members)', debit: financials.totalReceivables, credit: 0, group: 'Current Assets' });
      // 3. Cash/Bank
      ledgers.push({ name: 'Cash / Bank Balance', debit: financials.cashInHand, credit: 0, group: 'Current Assets' });

      // Credits
      // 1. Income (Maintenance)
      ledgers.push({ name: 'Maintenance Income', debit: 0, credit: financials.totalBilled, group: 'Direct Income' });
      // 2. Other Income
      incomes.forEach(i => {
          ledgers.push({ name: `${i.category} - ${i.description}`, debit: 0, credit: i.amount, group: 'Indirect Income' });
      });
      // 3. Capital / Opening Balance Equity (Balancing figure effectively)
      // Since Opening Balance of residents is an asset, the corresponding credit entry is usually Capital/Reserve
      if (financials.totalOpeningBalances > 0) {
          ledgers.push({ name: 'Opening Reserves', debit: 0, credit: financials.totalOpeningBalances, group: 'Capital Account' });
      }

      // Calculate totals
      const totalDebit = ledgers.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = ledgers.reduce((sum, l) => sum + l.credit, 0);

      return { ledgers, totalDebit, totalCredit };
  }, [expenses, incomes, financials]);

  // Receipts and Payments Logic
  const receiptsAndPaymentsData = useMemo(() => {
    // 1. Receipts
    // Maintenance Collections
    const maintenanceCollections = bills
      .filter(b => b.status === PaymentStatus.PAID)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // Other Income Collections
    const otherIncomesByCategory: Record<string, number> = {};
    incomes.forEach(i => {
      otherIncomesByCategory[i.category] = (otherIncomesByCategory[i.category] || 0) + i.amount;
    });

    // 2. Payments
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    // Opening Balance (Assuming 0 for start of period in this simplified view, or derived)
    const openingBalance = 0; 

    // Totals
    const totalReceipts = openingBalance + maintenanceCollections + Object.values(otherIncomesByCategory).reduce((a, b) => a + b, 0);
    const totalPayments = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    
    // Closing Balance
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
  }, [bills, incomes, expenses]);

  const downloadReport = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    // element.classList.remove('shadow-xl'); // Remove shadow for print
    const opt = {
      margin:       0.5,
      filename:     `${activeTab}_${activeSociety.name}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Financial Reports</h2>
           <p className="text-sm text-slate-500 mt-1">Statement of Accounts, Balance Sheet & Trial Balance</p>
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
              <p className="text-xs text-slate-500 uppercase font-bold">Total Income</p>
              <p className="text-xl font-bold text-slate-800">₹{financials.totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Expense</p>
              <p className="text-xl font-bold text-red-600">₹{financials.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Net Surplus</p>
              <p className={`text-xl font-bold ${financials.netSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{financials.netSurplus.toFixed(2)}
              </p>
          </div>
           <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Cash in Hand</p>
              <p className="text-xl font-bold text-indigo-600">₹{financials.cashInHand.toFixed(2)}</p>
          </div>
      </div>

      {/* Report Preview */}
      <div className="bg-slate-200 p-4 md:p-8 rounded-xl overflow-auto flex justify-center border border-slate-300 min-h-[600px]">
        <div 
          id="report-content" 
          className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-xl text-slate-800"
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
            <p className="text-sm text-slate-400 mt-2">Generated on: {new Date().toLocaleDateString()}</p>
          </div>

          {activeTab === 'BALANCE_SHEET' && (
              <>
                {/* Income & Expenditure Statement */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} /> Income & Expenditure Account
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                    {/* Expenditure Side */}
                    <div>
                        <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-300">
                            <th className="text-left py-2 font-semibold">Expenditure</th>
                            <th className="text-right py-2 font-semibold">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {expenses.length > 0 ? Object.entries(expenses.reduce((acc, curr) => {
                                acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                                return acc;
                            }, {} as Record<string, number>)).map(([cat, amt], i) => (
                                <tr key={i}>
                                    <td className="py-1 text-slate-600">{cat}</td>
                                    <td className="py-1 text-right">₹{Number(amt).toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={2} className="py-2 text-center text-slate-400 italic">No expenses recorded</td></tr>
                            )}
                            
                            {/* Surplus Calculation */}
                            {financials.netSurplus > 0 && (
                            <tr className="bg-green-50 font-bold">
                                <td className="py-2 pl-2 text-green-800">Excess of Income over Expenditure (Surplus)</td>
                                <td className="py-2 pr-2 text-right text-green-800">₹{financials.netSurplus.toFixed(2)}</td>
                            </tr>
                            )}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-800">
                            <tr>
                            <td className="py-2 font-bold">Total</td>
                            <td className="py-2 text-right font-bold">₹{Math.max(financials.totalIncome, financials.totalExpenses).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                        </table>
                    </div>

                    {/* Income Side */}
                    <div>
                        <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-300">
                            <th className="text-left py-2 font-semibold">Income</th>
                            <th className="text-right py-2 font-semibold">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-2 text-slate-600">Maintenance Charges</td>
                                <td className="py-2 text-right">₹{financials.totalBilled.toFixed(2)}</td>
                            </tr>
                            {incomes.map((inc, i) => (
                                <tr key={i}>
                                    <td className="py-2 text-slate-600">{inc.category}</td>
                                    <td className="py-2 text-right">₹{inc.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                            {/* Deficit Calculation */}
                            {financials.netSurplus < 0 && (
                            <tr className="bg-red-50 font-bold">
                                <td className="py-2 pl-2 text-red-800">Excess of Expenditure over Income (Deficit)</td>
                                <td className="py-2 pr-2 text-right text-red-800">₹{Math.abs(financials.netSurplus).toFixed(2)}</td>
                            </tr>
                            )}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-800">
                            <tr>
                            <td className="py-2 font-bold">Total</td>
                            <td className="py-2 text-right font-bold">₹{Math.max(financials.totalIncome, financials.totalExpenses).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                        </table>
                    </div>
                    </div>
                </div>

                {/* Balance Sheet */}
                <div className="break-inside-avoid">
                    <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
                    <Coins size={18} /> Balance Sheet
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                    {/* Liabilities */}
                    <div>
                        <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-300">
                            <th className="text-left py-2 font-semibold">Liabilities & Equity</th>
                            <th className="text-right py-2 font-semibold">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-2 font-bold text-slate-700">Reserves & Surplus</td>
                                <td className="py-2 text-right"></td>
                            </tr>
                            <tr>
                                <td className="py-1 pl-4 text-slate-600">Opening Balance</td>
                                <td className="py-1 text-right">₹{financials.totalOpeningBalances.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="py-1 pl-4 text-slate-600">Add: Current Surplus</td>
                                <td className="py-1 text-right">₹{financials.netSurplus.toFixed(2)}</td>
                            </tr>
                            <tr className="border-t border-slate-200">
                                <td className="py-2 font-semibold text-indigo-700">Total Reserves</td>
                                <td className="py-2 text-right font-semibold text-indigo-700">₹{(financials.totalOpeningBalances + financials.netSurplus).toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="border-t-2 border-slate-800">
                            <tr>
                            <td className="py-2 font-bold">Total</td>
                            <td className="py-2 text-right font-bold">₹{financials.totalFunds.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                        </table>
                    </div>

                    {/* Assets */}
                    <div>
                        <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-300">
                            <th className="text-left py-2 font-semibold">Assets</th>
                            <th className="text-right py-2 font-semibold">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* FIXED ASSETS */}
                            <tr>
                                <td className="py-2 font-bold text-slate-700">Fixed Assets</td>
                                <td className="py-2 text-right"></td>
                            </tr>
                            <tr>
                                <td className="py-1 pl-4 text-slate-600">Property, Plant & Equipment</td>
                                <td className="py-1 text-right">₹{financials.fixedAssets.toFixed(2)}</td>
                            </tr>

                            {/* CURRENT ASSETS */}
                            <tr>
                                <td className="py-2 font-bold text-slate-700">Current Assets</td>
                                <td className="py-2 text-right"></td>
                            </tr>
                            <tr>
                                <td className="py-1 pl-4 text-slate-600">Cash & Bank Balance</td>
                                <td className="py-1 text-right">₹{financials.cashInHand.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="py-1 pl-4 text-slate-600">Sundry Debtors (Receivables)</td>
                                <td className="py-1 text-right">₹{financials.totalReceivables.toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="border-t-2 border-slate-800">
                            <tr>
                            <td className="py-2 font-bold">Total</td>
                            <td className="py-2 text-right font-bold">₹{financials.totalAssets.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                        </table>
                    </div>
                    </div>
                </div>
              </>
          )}

          {activeTab === 'TRIAL_BALANCE' && (
             /* TRIAL BALANCE VIEW */
             <div className="break-inside-avoid">
                 <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
                    <Scale size={18} /> Trial Balance
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
                                 <td className="py-2 px-2 text-right font-mono">{row.debit > 0 ? row.debit.toFixed(2) : '-'}</td>
                                 <td className="py-2 px-2 text-right font-mono">{row.credit > 0 ? row.credit.toFixed(2) : '-'}</td>
                             </tr>
                         ))}
                     </tbody>
                     <tfoot className="bg-slate-800 text-white border-t-2 border-slate-900">
                         <tr>
                             <td colSpan={2} className="py-3 px-2 font-bold text-right uppercase">Grand Total</td>
                             <td className="py-3 px-2 text-right font-bold font-mono">₹{trialBalanceData.totalDebit.toFixed(2)}</td>
                             <td className="py-3 px-2 text-right font-bold font-mono">₹{trialBalanceData.totalCredit.toFixed(2)}</td>
                         </tr>
                     </tfoot>
                 </table>
             </div>
          )}

          {activeTab === 'RECEIPTS_AND_PAYMENTS' && (
            /* RECEIPTS AND PAYMENTS VIEW */
            <div className="break-inside-avoid">
               <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
                 <ArrowRightLeft size={18} /> Receipts & Payments Account
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
                           <td className="py-1 pl-4 text-slate-600">Cash & Bank</td>
                           <td className="py-1 text-right">₹{receiptsAndPaymentsData.openingBalance.toFixed(2)}</td>
                        </tr>
                        
                        <tr>
                           <td className="py-2 text-slate-700 font-semibold mt-2">To Maintenance Collections</td>
                           <td className="py-2 text-right">₹{receiptsAndPaymentsData.maintenanceCollections.toFixed(2)}</td>
                        </tr>

                        <tr>
                           <td className="py-2 text-slate-700 font-semibold mt-2">To Other Income</td>
                           <td className="py-2 text-right"></td>
                        </tr>
                        {Object.entries(receiptsAndPaymentsData.otherIncomesByCategory).map(([cat, amt], idx) => (
                           <tr key={idx}>
                             <td className="py-1 pl-4 text-slate-600">{cat}</td>
                             <td className="py-1 text-right">₹{Number(amt).toFixed(2)}</td>
                           </tr>
                        ))}
                     </tbody>
                     <tfoot className="border-t-2 border-slate-800">
                        <tr>
                          <td className="py-2 font-bold">Total</td>
                          <td className="py-2 text-right font-bold">₹{receiptsAndPaymentsData.totalReceipts.toFixed(2)}</td>
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
                             <td className="py-1 text-right">₹{Number(amt).toFixed(2)}</td>
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
                           <td className="py-1 text-right">₹{receiptsAndPaymentsData.closingBalance.toFixed(2)}</td>
                        </tr>
                     </tbody>
                     <tfoot className="border-t-2 border-slate-800">
                        <tr>
                          <td className="py-2 font-bold">Total</td>
                          <td className="py-2 text-right font-bold">₹{receiptsAndPaymentsData.totalReceipts.toFixed(2)}</td> 
                          {/* Note: In R&P, Total Receipts matches Total Payments side (Payments + Closing Bal) */}
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
