
import React, { useState, useMemo, useRef } from 'react';
import { Bill, Expense, PaymentStatus, Society } from '../types';
import { Landmark, Upload, Download, CheckCircle, AlertCircle, ArrowLeftRight, CalendarRange, Sparkles, Loader2, Wand2, Check, RefreshCcw, Info } from 'lucide-react';
import StandardToolbar from './StandardToolbar';
import { analyzeBankReconciliation } from '../services/geminiService';

interface BankReconciliationProps {
  bills: Bill[];
  expenses: Expense[];
  activeSociety: Society;
  balances?: { cash: number; bank: number };
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
}

interface AiInsights {
    suggestedMatches: { systemId: string; bankId: string; reason: string; confidence: string }[];
    anomalies: { id: string; source: string; note: string }[];
    summary: string;
}

const BankReconciliation: React.FC<BankReconciliationProps> = ({ bills, expenses, activeSociety, balances }) => {
  // Default to current month range
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd });
  const [bankStatement, setBankStatement] = useState<BankTransaction[]>([]);
  const [reconciledSystemIds, setReconciledSystemIds] = useState<Set<string>>(new Set());
  const [reconciledBankIds, setReconciledBankIds] = useState<Set<string>>(new Set());
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePeriodChange = (start: string, end: string) => {
      setDateRange({ start, end });
  };

  // --- 1. SYSTEM TRANSACTIONS (Cash Book) ---
  const systemTransactions = useMemo(() => {
    const txns: any[] = [];

    // Receipts (Money In / Debit in Cash Book / Credit in Bank)
    bills.filter(b => 
      b.status === PaymentStatus.PAID && 
      b.paymentDetails && 
      b.paymentDetails.date >= dateRange.start && 
      b.paymentDetails.date <= dateRange.end
    ).forEach(b => {
      txns.push({
        id: `SYS-RCP-${b.id}`,
        date: b.paymentDetails!.date,
        description: `Receipt #${b.id} - ${b.residentName}`,
        amount: b.totalAmount,
        type: 'RECEIPT' // Bank Credit
      });
    });

    // Expenses (Money Out / Credit in Cash Book / Debit in Bank)
    expenses.filter(e => 
      e.date >= dateRange.start && 
      e.date <= dateRange.end &&
      e.paymentMode !== 'Cash' // Only Bank expenses usually
    ).forEach(e => {
      txns.push({
        id: `SYS-EXP-${e.id}`,
        date: e.date,
        description: `Exp: ${e.vendor} (${e.category})`,
        amount: e.amount,
        type: 'PAYMENT' // Bank Debit
      });
    });

    return txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bills, expenses, dateRange]);


  // --- 2. CALCULATIONS ---
  const systemBalance = useMemo(() => {
    const receipts = systemTransactions.filter(t => t.type === 'RECEIPT').reduce((acc, t) => acc + t.amount, 0);
    const payments = systemTransactions.filter(t => t.type === 'PAYMENT').reduce((acc, t) => acc + t.amount, 0);
    return receipts - payments;
  }, [systemTransactions]);

  const bankBalance = useMemo(() => {
    const credits = bankStatement.reduce((acc, t) => acc + t.credit, 0);
    const debits = bankStatement.reduce((acc, t) => acc + t.debit, 0);
    return credits - debits;
  }, [bankStatement]);

  // Unreconciled Items
  const unpresentedCheques = systemTransactions
    .filter(t => t.type === 'PAYMENT' && !reconciledSystemIds.has(t.id))
    .reduce((acc, t) => acc + t.amount, 0);

  const unclearedDeposits = systemTransactions
    .filter(t => t.type === 'RECEIPT' && !reconciledSystemIds.has(t.id))
    .reduce((acc, t) => acc + t.amount, 0);

  // --- 3. HANDLERS ---
  const toggleSystemRecon = (id: string) => {
    const newSet = new Set(reconciledSystemIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setReconciledSystemIds(newSet);
  };

  const toggleBankRecon = (id: string) => {
    const newSet = new Set(reconciledBankIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setReconciledBankIds(newSet);
  };

  const handleSmartReconcile = async () => {
      if (bankStatement.length === 0) {
          alert("Please import a bank statement first.");
          return;
      }
      setIsAiLoading(true);
      try {
          const result = await analyzeBankReconciliation(systemTransactions, bankStatement);
          setAiInsights(result);
      } catch (err) {
          alert("AI Reconciliation failed. Please check your connection.");
      } finally {
          setIsAiLoading(false);
      }
  };

  const applyAiMatches = () => {
      if (!aiInsights) return;
      const newSys = new Set(reconciledSystemIds);
      const newBank = new Set(reconciledBankIds);
      
      aiInsights.suggestedMatches.forEach(match => {
          newSys.add(match.systemId);
          newBank.add(match.bankId);
      });
      
      setReconciledSystemIds(newSys);
      setReconciledBankIds(newBank);
      setAiInsights(null); // Clear insights after applying
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r\n|\n/);
      const newTxns: BankTransaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [date, desc, debit, credit] = line.split(',');
        
        newTxns.push({
          id: `BANK-${i}-${Date.now()}`,
          date: date?.trim(),
          description: desc?.trim(),
          debit: parseFloat(debit) || 0,
          credit: parseFloat(credit) || 0
        });
      }
      setBankStatement(newTxns);
      setAiInsights(null); // Reset AI when data changes
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const content = "Date,Description,Debit,Credit\n2023-10-01,Cheque Deposit,0,5000\n2023-10-05,Electricity Bill,1200,0";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bank_statement_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        balances={balances}
        onPeriodChange={handlePeriodChange}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Landmark className="text-indigo-600" />
              Bank Reconciliation
          </h2>
          <p className="text-sm text-slate-500 mt-1">Match system transactions with bank statements.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-2 text-sm text-slate-600 font-medium">
                <CalendarRange size={16} className="text-indigo-500" />
                <span>{dateRange.start}</span>
                <span className="text-slate-400">to</span>
                <span>{dateRange.end}</span>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

            <div className="flex gap-2">
                <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileUpload} />
                <button 
                    onClick={downloadTemplate}
                    className="bg-white text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 hover:bg-slate-50"
                >
                    <Download size={14} /> Template
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-900 shadow-sm"
                >
                    <Upload size={14} /> Import Statement
                </button>
                <button 
                    onClick={handleSmartReconcile}
                    disabled={isAiLoading || bankStatement.length === 0}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95"
                >
                    {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Smart AI Reconcile
                </button>
            </div>
        </div>
      </div>

      {/* --- AI INSIGHTS OVERLAY/BANNER --- */}
      {aiInsights && (
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles size={100} />
              </div>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                  <div className="flex-1">
                      <h3 className="text-xl font-black flex items-center gap-2 mb-2">
                          <Wand2 size={24} />
                          AI Analysis Complete
                      </h3>
                      <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl">{aiInsights.summary}</p>
                      
                      <div className="flex flex-wrap gap-4 mt-4">
                          <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/20">
                              <span className="text-xs font-bold uppercase opacity-60 block">Suggested Matches</span>
                              <span className="text-lg font-black">{aiInsights.suggestedMatches.length}</span>
                          </div>
                          <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/20">
                              <span className="text-xs font-bold uppercase opacity-60 block">Flagged Anomalies</span>
                              <span className="text-lg font-black text-amber-300">{aiInsights.anomalies.length}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex gap-3 shrink-0">
                      <button 
                        onClick={() => setAiInsights(null)}
                        className="px-4 py-2 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 transition-colors"
                      >
                          Dismiss
                      </button>
                      <button 
                        onClick={applyAiMatches}
                        className="px-6 py-2 bg-white text-indigo-700 rounded-xl font-black text-sm shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2"
                      >
                          <Check size={18} />
                          Apply All Suggestions
                      </button>
                  </div>
              </div>

              {aiInsights.anomalies.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiInsights.anomalies.map((anom, idx) => (
                          <div key={idx} className="bg-red-500/20 p-3 rounded-xl border border-red-400/30 flex items-start gap-3">
                              <AlertCircle size={18} className="text-red-300 shrink-0 mt-0.5" />
                              <div>
                                  <span className="text-[10px] font-black uppercase text-red-200">Issue in {anom.source}</span>
                                  <p className="text-xs font-medium text-white">{anom.note}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* --- SUMMARY CARD --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <RefreshCcw size={18} className="text-indigo-600" />
              Reconciliation Dashboard
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-slate-500 mb-1 font-bold uppercase text-[10px]">System Balance</p>
                 <p className="text-xl font-black text-slate-800">₹{systemBalance.toLocaleString()}</p>
                 <p className="text-[10px] text-slate-400 mt-1">Cash Book Net (Bank Mode Only)</p>
             </div>
             
             <div className="flex flex-col justify-center items-center text-slate-300">
                 <ArrowLeftRight size={24} />
             </div>

             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-slate-500 mb-1 font-bold uppercase text-[10px]">Unreconciled Items</p>
                 <div className="flex justify-between items-center mb-1">
                     <span className="text-xs">Unpresented Chq:</span>
                     <span className="font-bold text-red-600">+₹{unpresentedCheques.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                     <span className="text-xs">Uncleared Dep:</span>
                     <span className="font-bold text-red-600">-₹{unclearedDeposits.toLocaleString()}</span>
                 </div>
             </div>

             <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner">
                 <p className="text-indigo-600 font-black mb-1 uppercase text-[10px]">Final Reconciled Balance</p>
                 <p className="text-2xl font-black text-indigo-900">
                     ₹{(systemBalance + unpresentedCheques - unclearedDeposits).toLocaleString()}
                 </p>
                 {bankStatement.length > 0 && (
                     <div className="mt-2 pt-2 border-t border-indigo-200 flex justify-between items-center">
                         <span className="text-[10px] font-bold uppercase opacity-60">Actual Bank Value:</span>
                         <span className={`font-black text-sm ${Math.abs(bankBalance - (systemBalance + unpresentedCheques - unclearedDeposits)) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                             ₹{bankBalance.toLocaleString()}
                         </span>
                     </div>
                 )}
             </div>
          </div>
      </div>

      {/* --- DUAL VIEW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
          
          {/* LEFT: SYSTEM TRANSACTIONS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h4 className="font-black text-slate-700 flex items-center gap-2 uppercase tracking-tighter">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      System Cash Book
                  </h4>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase">Period Data</span>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-white sticky top-0 z-10 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                          <tr>
                              <th className="p-4 w-8"></th>
                              <th className="p-4">Date</th>
                              <th className="p-4">Particulars</th>
                              <th className="p-4 text-right">Amount</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {systemTransactions.map(txn => {
                              const isReconciled = reconciledSystemIds.has(txn.id);
                              const aiMatched = aiInsights?.suggestedMatches.some(m => m.systemId === txn.id);
                              return (
                                  <tr key={txn.id} className={`hover:bg-slate-50 transition-colors group ${isReconciled ? 'bg-green-50/40' : (aiMatched ? 'bg-indigo-50/50 border-l-4 border-l-indigo-400' : '')}`}>
                                      <td className="p-4">
                                          <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                checked={isReconciled}
                                                onChange={() => toggleSystemRecon(txn.id)}
                                                className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all hover:scale-110" 
                                            />
                                            {aiMatched && !isReconciled && (
                                                <div className="absolute -top-1 -right-1">
                                                    <Sparkles size={10} className="text-indigo-600 animate-pulse" fill="currentColor" />
                                                </div>
                                            )}
                                          </div>
                                      </td>
                                      <td className="p-4 text-slate-500 whitespace-nowrap font-medium text-xs">{txn.date}</td>
                                      <td className="p-4">
                                          <div className="font-bold text-slate-800 text-xs">{txn.description}</div>
                                          <div className="text-[10px] text-slate-400 font-mono">{txn.id}</div>
                                      </td>
                                      <td className={`p-4 text-right font-black ${txn.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}`}>
                                          {txn.type === 'RECEIPT' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                      </td>
                                  </tr>
                              );
                          })}
                          {systemTransactions.length === 0 && (
                              <tr><td colSpan={4} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                                  <Info size={32} className="mb-2 opacity-20" />
                                  <p className="font-bold">No system transactions found.</p>
                                  <p className="text-xs">Adjust your date range or log some expenses/receipts.</p>
                              </td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* RIGHT: BANK STATEMENT */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h4 className="font-black text-slate-700 flex items-center gap-2 uppercase tracking-tighter">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      Imported Bank Statement
                  </h4>
                  {bankStatement.length > 0 && (
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase">
                          {reconciledBankIds.size} / {bankStatement.length} Matches
                      </span>
                  )}
              </div>
              <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                  {bankStatement.length > 0 ? (
                      <table className="w-full text-sm text-left">
                          <thead className="bg-white sticky top-0 z-10 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                              <tr>
                                  <th className="p-4 w-8"></th>
                                  <th className="p-4">Date</th>
                                  <th className="p-4">Description</th>
                                  <th className="p-4 text-right">Debit</th>
                                  <th className="p-4 text-right">Credit</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {bankStatement.map(txn => {
                                  const isReconciled = reconciledBankIds.has(txn.id);
                                  const aiMatched = aiInsights?.suggestedMatches.some(m => m.bankId === txn.id);
                                  return (
                                      <tr key={txn.id} className={`hover:bg-slate-50 transition-colors group ${isReconciled ? 'bg-green-50/40' : (aiMatched ? 'bg-indigo-50/50 border-r-4 border-r-indigo-400' : '')}`}>
                                          <td className="p-4">
                                              <input 
                                                type="checkbox" 
                                                checked={isReconciled}
                                                onChange={() => toggleBankRecon(txn.id)}
                                                className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all hover:scale-110" 
                                              />
                                          </td>
                                          <td className="p-4 text-slate-500 whitespace-nowrap font-medium text-xs">{txn.date}</td>
                                          <td className="p-4">
                                              <div className="font-bold text-slate-800 text-xs line-clamp-1" title={txn.description}>{txn.description}</div>
                                          </td>
                                          <td className="p-4 text-right text-red-600 font-black">
                                              {txn.debit > 0 ? `₹${txn.debit.toLocaleString()}` : '-'}
                                          </td>
                                          <td className="p-4 text-right text-green-600 font-black">
                                              {txn.credit > 0 ? `₹${txn.credit.toLocaleString()}` : '-'}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 text-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                              <Upload size={32} className="text-slate-300" />
                          </div>
                          <p className="font-bold text-slate-600 mb-1">No statement imported</p>
                          <p className="text-xs text-slate-400 mb-8 max-w-[200px]">Import a bank CSV to start reconciling transactions with your books.</p>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                          >
                            <Upload size={16} /> Import Now
                          </button>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default BankReconciliation;
