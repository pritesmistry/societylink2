
import React, { useState, useMemo } from 'react';
import { Bill, Expense, Resident, Society, PaymentStatus, Income } from '../types';
import { Download, TrendingUp, Scale, AlertCircle, FileBarChart, Coins, ArrowRightLeft, Calendar, Sparkles, Loader2, Wand2, ShieldCheck, Check, ClipboardList, Info } from 'lucide-react';
import StandardToolbar from './StandardToolbar';
import { generateReportCommentary } from '../services/geminiService';

interface ReportsProps {
  bills: Bill[];
  expenses: Expense[];
  residents: Resident[];
  activeSociety: Society;
  incomes: Income[];
  balances?: { cash: number; bank: number };
}

type ReportType = 'BALANCE_SHEET' | 'TRIAL_BALANCE' | 'RECEIPTS_AND_PAYMENTS';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const Reports: React.FC<ReportsProps> = ({ bills, expenses, residents, activeSociety, incomes, balances }) => {
  const [activeTab, setActiveTab] = useState<ReportType>('BALANCE_SHEET');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAuditNote, setAiAuditNote] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); 
  const defaultFYEnd = currentMonth < 3 ? currentYear : currentYear + 1;
  const [selectedFYEnd, setSelectedFYEnd] = useState<number>(defaultFYEnd);

  // Helper to calculate financials for a specific date range
  const calculateFinancialsForPeriod = (fyEndYear: number) => {
    const startStr = `${fyEndYear - 1}-04-01`;
    const endStr = `${fyEndYear}-03-31`;
    const isInPeriod = (dateStr: string) => dateStr >= startStr && dateStr <= endStr;

    const periodBills = bills.filter(b => isInPeriod(b.generatedDate));
    const periodExpenses = expenses.filter(e => isInPeriod(e.date));
    const periodIncomes = incomes.filter(i => isInPeriod(i.date));

    const totalBilled = periodBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalOtherIncome = periodIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalIncome = totalBilled + totalOtherIncome;

    const pendingBillsAmount = bills
      .filter(b => b.generatedDate <= endStr && (b.status === PaymentStatus.PENDING || b.status === PaymentStatus.OVERDUE))
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    const totalOpeningBalances = residents.reduce((sum, r) => sum + r.openingBalance, 0);
    const totalReceivables = pendingBillsAmount + totalOpeningBalances;

    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const allIncomesTillDate = incomes.filter(i => i.date <= endStr).reduce((s, i) => s + i.amount, 0);
    const allCollectionsTillDate = bills.filter(b => b.status === PaymentStatus.PAID && b.paymentDetails && b.paymentDetails.date <= endStr).reduce((s, b) => s + b.totalAmount, 0);
    const allExpensesTillDate = expenses.filter(e => e.date <= endStr).reduce((s, e) => s + e.amount, 0);
    
    const cashInHand = (allCollectionsTillDate + allIncomesTillDate) - allExpensesTillDate;
    const netSurplus = totalIncome - totalExpenses;
    const totalAssets = cashInHand + totalReceivables;
    
    const expensesByCategory = periodExpenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    return {
      totalBilled,
      totalOtherIncome,
      totalIncome,
      totalExpenses,
      cashInHand,
      totalReceivables,
      netSurplus,
      totalAssets,
      totalOpeningBalances,
      expensesByCategory
    };
  };

  const financials = useMemo(() => ({
      current: calculateFinancialsForPeriod(selectedFYEnd),
      previous: calculateFinancialsForPeriod(selectedFYEnd - 1)
  }), [bills, expenses, residents, incomes, selectedFYEnd]);

  // Merge categories for comparative analysis
  const mergedExpenseCategories = useMemo(() => {
      const cats = new Set<string>();
      Object.keys(financials.current.expensesByCategory).forEach(c => cats.add(c));
      Object.keys(financials.previous.expensesByCategory).forEach(c => cats.add(c));
      return Array.from(cats).sort();
  }, [financials]);

  const handleAiAudit = async () => {
      setIsAiLoading(true);
      setAiAuditNote(null);
      try {
          const reportName = activeTab.replace('_', ' ').toLowerCase();
          const commentary = await generateReportCommentary(reportName, {
              currentYear: financials.current,
              previousYear: financials.previous,
              societyName: activeSociety.name
          });
          setAiAuditNote(commentary);
      } catch (err) {
          setAiAuditNote("Audit AI failed to analyze this period.");
      } finally {
          setIsAiLoading(false);
      }
  };

  const downloadReport = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    const opt = { 
        margin: 0.3, 
        filename: `${activeTab}_FY${selectedFYEnd}_Comparative_${activeSociety.name}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2 }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } 
    };
    window.html2pdf().set(opt).from(element).save();
  };

  const formatMoney = (amount: number) => (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Financial Reports</h2>
           <p className="text-sm text-slate-500 mt-1">Comparative Statements & AI-Powered Audit Notes.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="text-indigo-600" size={20} />
            <span className="text-sm font-bold text-slate-700">Financial Year:</span>
            <select 
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedFYEnd}
                onChange={(e) => { setSelectedFYEnd(Number(e.target.value)); setAiAuditNote(null); }}
            >
                {[0, 1, 2, 3].map(offset => {
                    const year = new Date().getFullYear() + 1 - offset;
                    return <option key={year} value={year}>{year - 1}-{year}</option>
                })}
            </select>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('BALANCE_SHEET')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'BALANCE_SHEET' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
                <FileBarChart size={18} /> Comparative Statements
            </button>
          </div>
          
          <div className="flex gap-3">
              <button 
                onClick={handleAiAudit}
                disabled={isAiLoading}
                className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-200"
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isAiLoading ? 'Analyzing Trends...' : 'AI Auditor Analysis'}
              </button>
              <button onClick={downloadReport} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all">
                <Download size={16} /> Export Landscape PDF
              </button>
          </div>
      </div>

      {aiAuditNote && (
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <ShieldCheck size={120} />
              </div>
              <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-black flex items-center gap-2">
                          <Wand2 size={24} />
                          Smart Auditor Observations (FY {selectedFYEnd-1}-{selectedFYEnd} Analysis)
                      </h3>
                      <button onClick={() => setAiAuditNote(null)} className="p-1 hover:bg-white/20 rounded-lg"><Check size={18} /></button>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-sm leading-relaxed font-medium max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                      {aiAuditNote}
                  </div>
                  <p className="text-[10px] mt-4 opacity-70 uppercase tracking-widest font-black italic">Generated by Gemini 3 Pro Auditor Engine • YOY Comparative Draft</p>
              </div>
          </div>
      )}

      <div className="bg-slate-200 p-4 md:p-10 rounded-3xl overflow-auto flex justify-center border border-slate-300 min-h-[700px] shadow-inner">
        <div id="report-content" className="bg-white w-[297mm] min-h-[210mm] p-[15mm] shadow-2xl text-slate-800 flex flex-col">
          <div className="text-center border-b-4 border-slate-900 pb-8 mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">{activeSociety.name}</h1>
            <p className="text-slate-600 mt-2 font-medium">{activeSociety.address}</p>
            <div className="mt-6 inline-block bg-slate-900 text-white px-8 py-2 rounded-full text-lg font-black uppercase tracking-widest">
                Comparative Statement of Accounts
            </div>
            <p className="text-sm text-slate-800 font-bold mt-4 uppercase">
                Reporting Period: FY {selectedFYEnd - 1}-{selectedFYEnd} | (Previous: FY {selectedFYEnd - 2}-{selectedFYEnd - 1})
            </p>
          </div>

          {activeTab === 'BALANCE_SHEET' && (
              <div className="space-y-16">
                {/* 1. INCOME & EXPENDITURE */}
                <div className="break-inside-avoid">
                    <h3 className="text-xl font-black bg-slate-100 p-3 border-l-8 border-indigo-600 mb-6 uppercase tracking-tighter">I. Comparative Income & Expenditure Statement</h3>
                    <table className="w-full text-[11px] border-collapse border border-slate-800">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="p-2 text-left border border-slate-800" rowSpan={2}>Particulars (Expenditure)</th>
                                <th className="p-2 text-center border border-slate-800" colSpan={2}>Amount (₹)</th>
                                <th className="p-2 text-left border border-slate-800" rowSpan={2}>Particulars (Income)</th>
                                <th className="p-2 text-center border border-slate-800" colSpan={2}>Amount (₹)</th>
                            </tr>
                            <tr className="bg-slate-800 text-[10px]">
                                <th className="p-2 text-right border border-slate-700 w-24">Current FY</th>
                                <th className="p-2 text-right border border-slate-700 w-24">Previous FY</th>
                                <th className="p-2 text-right border border-slate-700 w-24">Current FY</th>
                                <th className="p-2 text-right border border-slate-700 w-24">Previous FY</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="align-top">
                                <td className="p-0 border border-slate-300" colSpan={3}>
                                    <table className="w-full">
                                        <tbody>
                                            {mergedExpenseCategories.map((cat, i) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    <td className="p-2 text-slate-700">{cat}</td>
                                                    <td className="p-2 text-right font-bold w-24 border-l border-slate-100">
                                                        {formatMoney(financials.current.expensesByCategory[cat])}
                                                    </td>
                                                    <td className="p-2 text-right text-slate-400 w-24 border-l border-slate-100 italic">
                                                        {formatMoney(financials.previous.expensesByCategory[cat])}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-indigo-50 font-black">
                                                <td className="p-2">Surplus (Net Profit)</td>
                                                <td className="p-2 text-right text-green-700 w-24 border-l border-slate-200">
                                                    {financials.current.netSurplus > 0 ? formatMoney(financials.current.netSurplus) : '0.00'}
                                                </td>
                                                <td className="p-2 text-right text-green-500/50 w-24 border-l border-slate-200">
                                                    {financials.previous.netSurplus > 0 ? formatMoney(financials.previous.netSurplus) : '0.00'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td className="p-0 border border-slate-300" colSpan={3}>
                                    <table className="w-full">
                                        <tbody>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-2 text-slate-700">Maintenance Collections</td>
                                                <td className="p-2 text-right font-bold w-24 border-l border-slate-100">{formatMoney(financials.current.totalBilled)}</td>
                                                <td className="p-2 text-right text-slate-400 w-24 border-l border-slate-100 italic">{formatMoney(financials.previous.totalBilled)}</td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-2 text-slate-700">Other Society Income</td>
                                                <td className="p-2 text-right font-bold w-24 border-l border-slate-100">{formatMoney(financials.current.totalOtherIncome)}</td>
                                                <td className="p-2 text-right text-slate-400 w-24 border-l border-slate-100 italic">{formatMoney(financials.previous.totalOtherIncome)}</td>
                                            </tr>
                                            {financials.current.netSurplus < 0 && (
                                                <tr className="bg-red-50 font-black">
                                                    <td className="p-2">Deficit (Net Loss)</td>
                                                    <td className="p-2 text-right text-red-700 w-24 border-l border-slate-200">{formatMoney(Math.abs(financials.current.netSurplus))}</td>
                                                    <td className="p-2 text-right text-red-500/50 w-24 border-l border-slate-200">{formatMoney(Math.abs(financials.previous.netSurplus))}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-100 font-black text-[12px]">
                            <tr>
                                <td className="p-2 text-right uppercase">Total Expenditure</td>
                                <td className="p-2 text-right border-l border-slate-300">{formatMoney(Math.max(financials.current.totalIncome, financials.current.totalExpenses))}</td>
                                <td className="p-2 text-right border-l border-slate-300 text-slate-500">{formatMoney(Math.max(financials.previous.totalIncome, financials.previous.totalExpenses))}</td>
                                <td className="p-2 text-right uppercase border-l border-slate-300">Total Income</td>
                                <td className="p-2 text-right border-l border-slate-300">{formatMoney(Math.max(financials.current.totalIncome, financials.current.totalExpenses))}</td>
                                <td className="p-2 text-right border-l border-slate-300 text-slate-500">{formatMoney(Math.max(financials.previous.totalIncome, financials.previous.totalExpenses))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* 2. BALANCE SHEET */}
                <div className="break-inside-avoid">
                    <h3 className="text-xl font-black bg-slate-100 p-3 border-l-8 border-indigo-600 mb-6 uppercase tracking-tighter">II. Comparative Balance Sheet</h3>
                    <table className="w-full text-[11px] border-collapse border border-slate-800">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="p-2 text-left border border-slate-800" rowSpan={2}>Liabilities</th>
                                <th className="p-2 text-center border border-slate-800" colSpan={2}>Amount (₹)</th>
                                <th className="p-2 text-left border border-slate-800" rowSpan={2}>Assets</th>
                                <th className="p-2 text-center border border-slate-800" colSpan={2}>Amount (₹)</th>
                            </tr>
                            <tr className="bg-slate-800 text-[10px]">
                                <th className="p-2 text-right border border-slate-700 w-24">Current FY</th>
                                <th className="p-2 text-right border border-slate-700 w-24">Previous FY</th>
                                <th className="p-2 text-right border border-slate-700 w-24">Current FY</th>
                                <th className="p-2 text-right border border-slate-700 w-24">Previous FY</th>
                            </tr>
                        </thead>
                        <tbody className="align-top">
                            <tr className="h-40">
                                <td className="p-4 border border-slate-300">
                                    <p className="font-bold text-indigo-700 mb-2 uppercase text-[10px]">Reserves & Funds</p>
                                    <div className="flex justify-between pl-2 text-[10px] mb-1"><span>Opening Balance / Corpus</span></div>
                                    <div className="flex justify-between pl-2 text-[10px]"><span>Accumulated Surplus</span></div>
                                </td>
                                <td className="p-4 border border-slate-300 text-right font-black bg-slate-50 w-24">
                                    <div className="h-4 mb-1"></div>
                                    {formatMoney(financials.current.totalOpeningBalances + financials.current.netSurplus)}
                                </td>
                                <td className="p-4 border border-slate-300 text-right text-slate-400 italic bg-slate-50/50 w-24">
                                    <div className="h-4 mb-1"></div>
                                    {formatMoney(financials.previous.totalOpeningBalances + financials.previous.netSurplus)}
                                </td>
                                <td className="p-4 border border-slate-300">
                                    <p className="font-bold text-indigo-700 mb-2 uppercase text-[10px]">Current Assets</p>
                                    <div className="flex justify-between pl-2 text-[10px] mb-1"><span>Cash & Bank Balances</span></div>
                                    <div className="flex justify-between pl-2 text-[10px]"><span>Sundry Debtors (Members)</span></div>
                                </td>
                                <td className="p-4 border border-slate-300 text-right font-black bg-slate-50 w-24">
                                    <p className="mb-1">{formatMoney(financials.current.cashInHand)}</p>
                                    <p>{formatMoney(financials.current.totalReceivables)}</p>
                                </td>
                                <td className="p-4 border border-slate-300 text-right text-slate-400 italic bg-slate-50/50 w-24">
                                    <p className="mb-1">{formatMoney(financials.previous.cashInHand)}</p>
                                    <p>{formatMoney(financials.previous.totalReceivables)}</p>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-black text-[12px]">
                            <tr>
                                <td className="p-2 text-right">TOTAL LIABILITIES</td>
                                <td className="p-2 text-right border-l border-slate-700">{formatMoney(financials.current.totalAssets)}</td>
                                <td className="p-2 text-right border-l border-slate-700 text-slate-400 italic">{formatMoney(financials.previous.totalAssets)}</td>
                                <td className="p-2 text-right border-l border-slate-700">TOTAL ASSETS</td>
                                <td className="p-2 text-right border-l border-slate-700">{formatMoney(financials.current.totalAssets)}</td>
                                <td className="p-2 text-right border-l border-slate-700 text-slate-400 italic">{formatMoney(financials.previous.totalAssets)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
              </div>
          )}

          {aiAuditNote && (
              <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300 break-inside-avoid">
                  <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="text-indigo-600" size={24} />
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Annexure: Auditor's Comparative Analysis (AI)</h3>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-[10pt] leading-relaxed italic text-slate-700 whitespace-pre-wrap font-serif">
                      {aiAuditNote}
                  </div>
              </div>
          )}

          <div className="mt-auto pt-20 flex justify-between items-end pb-4">
              <div className="text-center w-40">
                  <div className="border-b-2 border-slate-400 mb-2"></div>
                  <p className="text-[10px] font-black uppercase text-slate-500">Hon. Treasurer</p>
              </div>
              <div className="text-center w-40">
                  <div className="border-b-2 border-slate-400 mb-2"></div>
                  <p className="text-[10px] font-black uppercase text-slate-500">Hon. Secretary</p>
              </div>
              <div className="text-center w-40">
                  <div className="border-b-2 border-slate-400 mb-2 h-8 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-indigo-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest underline underline-offset-4 decoration-indigo-500 decoration-2">Statutory Auditor</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
