
import React, { useMemo } from 'react';
import { Bill, Expense, Resident, Society, PaymentStatus } from '../types';
import { Download, TrendingUp, Scale, AlertCircle } from 'lucide-react';

interface ReportsProps {
  bills: Bill[];
  expenses: Expense[];
  residents: Resident[];
  activeSociety: Society;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const Reports: React.FC<ReportsProps> = ({ bills, expenses, residents, activeSociety }) => {

  const financials = useMemo(() => {
    // 1. Income (Billed)
    const totalBilled = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const collectedAmount = bills
      .filter(b => b.status === PaymentStatus.PAID)
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
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
    // Cash = Collected Revenue - Expenses paid
    const cashInHand = collectedAmount - totalExpenses;

    // 5. Net Surplus (Equity)
    // Surplus = Total Income (Accrual Basis) - Total Expenses
    const netSurplus = totalBilled - totalExpenses;
    
    // Total Assets Check = Cash + Receivables
    // Equity Check = Net Surplus + Opening Balance Adjustments
    const totalAssets = cashInHand + totalReceivables;
    
    // For the balance sheet liability side to match assets in this simple system:
    // Equity/Funds = Total Assets
    const totalFunds = totalAssets;

    return {
      totalBilled,
      collectedAmount,
      totalExpenses,
      cashInHand,
      totalReceivables,
      netSurplus,
      totalAssets,
      totalFunds,
      totalOpeningBalances
    };
  }, [bills, expenses, residents]);

  const downloadReport = () => {
    const element = document.getElementById('financial-report');
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     `Balance_Sheet_${activeSociety.name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Financial Reports</h2>
           <p className="text-slate-500 text-sm">Statement of Accounts & Balance Sheet</p>
        </div>
        <button 
          onClick={downloadReport}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md"
        >
          <Download size={18} />
          Download Report PDF
        </button>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Income</p>
              <p className="text-xl font-bold text-slate-800">₹{financials.totalBilled.toFixed(2)}</p>
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

      {/* Preview Container */}
      <div className="bg-slate-200 p-4 md:p-8 rounded-xl overflow-auto flex justify-center border border-slate-300">
        <div 
          id="financial-report" 
          className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-xl text-slate-800"
        >
          {/* Report Header */}
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900">{activeSociety.name}</h1>
            <p className="text-slate-600 mt-2 whitespace-pre-wrap">{activeSociety.address}</p>
            {activeSociety.registrationNumber && <p className="text-sm text-slate-500 mt-1">Reg No: {activeSociety.registrationNumber}</p>}
            <h2 className="text-xl font-semibold mt-6 underline decoration-indigo-500 underline-offset-4">Statement of Accounts & Balance Sheet</h2>
            <p className="text-sm text-slate-400 mt-2">Generated on: {new Date().toLocaleDateString()}</p>
          </div>

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
                    {/* Expenses grouped by category would go here, simplified for now */}
                    {expenses.length > 0 ? expenses.map((e, i) => (
                         <tr key={i}>
                             <td className="py-1 text-slate-600">{e.description} <span className="text-xs text-slate-400">({e.category})</span></td>
                             <td className="py-1 text-right">₹{e.amount.toFixed(2)}</td>
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
                       <td className="py-2 text-right font-bold">₹{Math.max(financials.totalBilled, financials.totalExpenses).toFixed(2)}</td>
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
                        <td className="py-2 text-slate-600">Maintenance Charges Billed</td>
                        <td className="py-2 text-right">₹{financials.totalBilled.toFixed(2)}</td>
                     </tr>
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
                       <td className="py-2 text-right font-bold">₹{Math.max(financials.totalBilled, financials.totalExpenses).toFixed(2)}</td>
                     </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="break-inside-avoid">
            <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-indigo-600 mb-4 flex items-center gap-2">
              <Scale size={18} /> Balance Sheet / Statement of Affairs
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
                        <td className="py-2 font-bold text-slate-700">General Fund / Reserves</td>
                        <td className="py-2 text-right"></td>
                    </tr>
                    <tr>
                         <td className="py-1 pl-4 text-slate-600">Opening Balances (Arrears b/f)</td>
                         <td className="py-1 text-right">₹{financials.totalOpeningBalances.toFixed(2)}</td>
                    </tr>
                    <tr>
                         <td className="py-1 pl-4 text-slate-600">Add: Current Year Surplus</td>
                         <td className="py-1 text-right">₹{financials.netSurplus.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                        <td className="py-2 font-semibold text-indigo-700">Total Funds</td>
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
                     <tr>
                        <td className="py-2 font-bold text-slate-700">Current Assets</td>
                        <td className="py-2 text-right"></td>
                     </tr>
                     <tr>
                        <td className="py-1 pl-4 text-slate-600">Cash in Hand / Bank</td>
                        <td className="py-1 text-right">₹{financials.cashInHand.toFixed(2)}</td>
                     </tr>
                     <tr>
                        <td className="py-1 pl-4 text-slate-600">Accounts Receivable (Dues)</td>
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
