
import React, { useState, useMemo, useRef } from 'react';
import { Bill, Expense, PaymentStatus, Society } from '../types';
import { Landmark, Upload, Download, CheckCircle, AlertCircle, ArrowLeftRight } from 'lucide-react';

interface BankReconciliationProps {
  bills: Bill[];
  expenses: Expense[];
  activeSociety: Society;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
}

const BankReconciliation: React.FC<BankReconciliationProps> = ({ bills, expenses, activeSociety }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bankStatement, setBankStatement] = useState<BankTransaction[]>([]);
  const [reconciledSystemIds, setReconciledSystemIds] = useState<Set<string>>(new Set());
  const [reconciledBankIds, setReconciledBankIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. SYSTEM TRANSACTIONS (Cash Book) ---
  const systemTransactions = useMemo(() => {
    const txns = [];

    // Receipts (Money In / Debit in Cash Book / Credit in Bank)
    bills.filter(b => 
      b.status === PaymentStatus.PAID && 
      b.paymentDetails && 
      b.paymentDetails.date.startsWith(selectedMonth)
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
      e.date.startsWith(selectedMonth)
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
  }, [bills, expenses, selectedMonth]);


  // --- 2. CALCULATIONS ---
  const systemBalance = useMemo(() => {
    // Ideally this should include opening balance, but for this month view:
    const receipts = systemTransactions.filter(t => t.type === 'RECEIPT').reduce((acc, t) => acc + t.amount, 0);
    const payments = systemTransactions.filter(t => t.type === 'PAYMENT').reduce((acc, t) => acc + t.amount, 0);
    return receipts - payments;
  }, [systemTransactions]);

  const bankBalance = useMemo(() => {
    // Calculated from imported CSV
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r\n|\n/);
      const newTxns: BankTransaction[] = [];

      // Skip header, assuming CSV: Date, Description, Debit, Credit
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Bank Reconciliation</h2>
          <p className="text-sm text-slate-500 mt-1">Match system transactions with bank statements.</p>
        </div>
        <div className="flex gap-4 items-center">
            <input 
                type="month" 
                className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
            />
            <div className="flex gap-2">
                <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileUpload} />
                <button 
                    onClick={downloadTemplate}
                    className="bg-white text-slate-600 px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2 hover:bg-slate-50"
                >
                    <Download size={16} /> Template
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
                >
                    <Upload size={16} /> Import Statement
                </button>
            </div>
        </div>
      </div>

      {/* --- SUMMARY CARD --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Landmark className="text-indigo-600" />
              Reconciliation Summary ({selectedMonth})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
             <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                 <p className="text-slate-500 mb-1">Net System Balance</p>
                 <p className="text-lg font-bold text-slate-800">₹{systemBalance.toFixed(2)}</p>
                 <p className="text-xs text-slate-400 mt-1">(Receipts - Expenses)</p>
             </div>
             
             <div className="flex flex-col justify-center items-center text-slate-400">
                 <ArrowLeftRight size={20} />
             </div>

             <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                 <p className="text-slate-500 mb-1">Adjustments</p>
                 <div className="flex justify-between">
                     <span>Unpresented Chq:</span>
                     <span className="font-bold text-red-600">+₹{unpresentedCheques.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                     <span>Uncleared Dep:</span>
                     <span className="font-bold text-red-600">-₹{unclearedDeposits.toFixed(2)}</span>
                 </div>
             </div>

             <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                 <p className="text-indigo-600 font-bold mb-1">Expected Bank Balance</p>
                 <p className="text-xl font-bold text-indigo-900">
                     ₹{(systemBalance + unpresentedCheques - unclearedDeposits).toFixed(2)}
                 </p>
                 {bankStatement.length > 0 && (
                     <div className="mt-2 pt-2 border-t border-indigo-200 text-xs flex justify-between">
                         <span>Actual Statement:</span>
                         <span className={`font-bold ${Math.abs(bankBalance - (systemBalance + unpresentedCheques - unclearedDeposits)) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                             ₹{bankBalance.toFixed(2)}
                         </span>
                     </div>
                 )}
             </div>
          </div>
      </div>

      {/* --- DUAL VIEW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
          
          {/* LEFT: SYSTEM TRANSACTIONS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      System Transactions (Cash Book)
                  </h4>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 text-xs uppercase">
                          <tr>
                              <th className="p-3 w-8"></th>
                              <th className="p-3">Date</th>
                              <th className="p-3">Particulars</th>
                              <th className="p-3 text-right">Amount</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {systemTransactions.map(txn => {
                              const isReconciled = reconciledSystemIds.has(txn.id);
                              return (
                                  <tr key={txn.id} className={`hover:bg-slate-50 ${isReconciled ? 'bg-green-50/50' : ''}`}>
                                      <td className="p-3">
                                          <input 
                                            type="checkbox" 
                                            checked={isReconciled}
                                            onChange={() => toggleSystemRecon(txn.id)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                          />
                                      </td>
                                      <td className="p-3 text-slate-600 whitespace-nowrap">{txn.date}</td>
                                      <td className="p-3 text-slate-800">
                                          <div className="font-medium">{txn.description}</div>
                                          <div className="text-xs text-slate-400">{txn.id}</div>
                                      </td>
                                      <td className={`p-3 text-right font-medium ${txn.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}`}>
                                          {txn.type === 'RECEIPT' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                                      </td>
                                  </tr>
                              );
                          })}
                          {systemTransactions.length === 0 && (
                              <tr><td colSpan={4} className="p-8 text-center text-slate-400">No system transactions for this month.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* RIGHT: BANK STATEMENT */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      Bank Statement (Imported)
                  </h4>
                  {bankStatement.length > 0 && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                          {reconciledBankIds.size} / {bankStatement.length} matched
                      </span>
                  )}
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                  {bankStatement.length > 0 ? (
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 text-xs uppercase">
                              <tr>
                                  <th className="p-3 w-8"></th>
                                  <th className="p-3">Date</th>
                                  <th className="p-3">Description</th>
                                  <th className="p-3 text-right">Debit</th>
                                  <th className="p-3 text-right">Credit</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {bankStatement.map(txn => {
                                  const isReconciled = reconciledBankIds.has(txn.id);
                                  return (
                                      <tr key={txn.id} className={`hover:bg-slate-50 ${isReconciled ? 'bg-green-50/50' : ''}`}>
                                          <td className="p-3">
                                              <input 
                                                type="checkbox" 
                                                checked={isReconciled}
                                                onChange={() => toggleBankRecon(txn.id)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                              />
                                          </td>
                                          <td className="p-3 text-slate-600 whitespace-nowrap">{txn.date}</td>
                                          <td className="p-3 text-slate-800">{txn.description}</td>
                                          <td className="p-3 text-right text-red-600 font-mono">
                                              {txn.debit > 0 ? `₹${txn.debit.toFixed(2)}` : '-'}
                                          </td>
                                          <td className="p-3 text-right text-green-600 font-mono">
                                              {txn.credit > 0 ? `₹${txn.credit.toFixed(2)}` : '-'}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                          <Upload size={48} className="mb-4 text-slate-200" />
                          <p className="mb-2">No bank statement loaded.</p>
                          <p className="text-sm">Import a CSV file to begin reconciliation.</p>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default BankReconciliation;
