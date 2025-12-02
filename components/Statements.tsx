import React, { useState, useMemo } from 'react';
import { Bill, Expense, Resident, Society, PaymentStatus } from '../types';
import { Download, Search, Calendar, FileText, User, CreditCard, AlertCircle } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface StatementsProps {
  bills: Bill[];
  expenses: Expense[];
  residents: Resident[];
  activeSociety: Society;
  balances?: { cash: number; bank: number };
}

type StatementType = 'MEMBER_LEDGER' | 'BILL_REGISTER' | 'RECEIPT_REGISTER' | 'PAYMENT_VOUCHERS' | 'OUTSTANDING_STATEMENT';

interface LedgerData {
  resident: Resident;
  openingBalance: number;
  transactions: any[];
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const Statements: React.FC<StatementsProps> = ({ bills, expenses, residents, activeSociety, balances }) => {
  const [activeTab, setActiveTab] = useState<StatementType>('MEMBER_LEDGER');
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Outstanding Filters
  const [minOutstandingAmount, setMinOutstandingAmount] = useState<number>(5000);
  const [minMonthsDue, setMinMonthsDue] = useState<number>(3);

  // --- DATA PROCESSING LOGIC ---

  // 1. Member Ledger Logic
  const memberLedgerData = useMemo<LedgerData | null>(() => {
    if (!selectedResidentId) return null;
    
    const resident = residents.find(r => r.id === selectedResidentId);
    if (!resident) return null;

    const memberBills = bills.filter(b => b.residentId === selectedResidentId);
    
    // Convert Bills and Payments into a single chronological ledger
    const transactions: any[] = [];

    // Add Bills (Debit)
    memberBills.forEach(b => {
        transactions.push({
            date: b.generatedDate,
            type: 'BILL',
            ref: `Bill #${b.id}`,
            description: 'Maintenance Bill Generated',
            debit: b.totalAmount,
            credit: 0
        });

        // Add Payments (Credit)
        if (b.status === PaymentStatus.PAID && b.paymentDetails) {
            transactions.push({
                date: b.paymentDetails.date,
                type: 'PAYMENT',
                ref: `Rcpt #${b.id}`,
                description: `Pmt via ${b.paymentDetails.mode} (${b.paymentDetails.reference})`,
                debit: 0,
                credit: b.totalAmount
            });
        }
    });

    // Sort by Date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate Running Balance
    let balance = resident.openingBalance; 
    // If we assume opening balance is Debit (Receivable from member)
    const ledgerWithBalance = transactions.map(t => {
        balance = balance + t.debit - t.credit;
        return { ...t, balance };
    });

    return { resident, openingBalance: resident.openingBalance, transactions: ledgerWithBalance };
  }, [selectedResidentId, bills, residents]);


  // 2. Monthly Bill Register (Statement of Bills)
  const monthlyBillRegister = useMemo(() => {
     return bills.filter(b => b.generatedDate.startsWith(selectedMonth));
  }, [bills, selectedMonth]);

  // Extract unique billing heads for bifurcation
  const billHeads = useMemo(() => {
    const heads = new Set<string>();
    monthlyBillRegister.forEach(b => {
        b.items.forEach(i => heads.add(i.description));
    });
    return Array.from(heads).sort();
  }, [monthlyBillRegister]);


  // 3. Monthly Receipt Register (Statement of Receipts)
  const monthlyReceiptRegister = useMemo(() => {
    return bills.filter(b => 
        b.status === PaymentStatus.PAID && 
        b.paymentDetails && 
        b.paymentDetails.date.startsWith(selectedMonth)
    );
  }, [bills, selectedMonth]);


  // 4. Monthly Expense Register (Payment Vouchers)
  const monthlyExpenseRegister = useMemo(() => {
      return expenses.filter(e => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  // 5. Outstanding Statement Logic
  const outstandingData = useMemo(() => {
      return residents.map(r => {
          const unpaidBills = bills.filter(b => b.residentId === r.id && b.status !== PaymentStatus.PAID);
          const pendingAmount = unpaidBills.reduce((sum, b) => sum + b.totalAmount, 0);
          const totalDue = r.openingBalance + pendingAmount;
          
          // Estimate months due
          let estMonths = unpaidBills.length;
          
          // Try to account for opening balance in months estimate
          // Calculate average bill amount for this user to guess how many months the opening balance represents
          const allUserBills = bills.filter(b => b.residentId === r.id);
          const avgBill = allUserBills.length > 0 
              ? allUserBills.reduce((s,b)=>s+b.totalAmount,0) / allUserBills.length 
              : 0;
              
          if (r.openingBalance > 0 && avgBill > 0) {
              estMonths += Math.ceil(r.openingBalance / avgBill);
          } else if (r.openingBalance > 0 && estMonths === 0) {
              estMonths = 1; // Default to 1 if there is opening balance but no bill history
          }

          return {
              ...r,
              pendingAmount,
              totalDue,
              estMonths,
              billCount: unpaidBills.length
          };
      })
      .filter(r => r.totalDue >= minOutstandingAmount && r.estMonths >= minMonthsDue)
      .sort((a,b) => b.totalDue - a.totalDue);
  }, [residents, bills, minOutstandingAmount, minMonthsDue]);


  // --- DOWNLOAD PDF ---
  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Temporarily remove shadow for printing
    element.classList.remove('shadow-xl');

    const opt = {
      margin:       0.3,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: (activeTab === 'MEMBER_LEDGER' || activeTab === 'PAYMENT_VOUCHERS' || activeTab === 'OUTSTANDING_STATEMENT') ? 'portrait' : 'landscape' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        element.classList.add('shadow-xl');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSearch={() => alert("Search not available here")}
        onPrint={() => downloadPDF('statement-container', `Statement_${activeTab}.pdf`)}
        balances={balances}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Statements & Registers</h2>
           <p className="text-sm text-slate-500 mt-1">Detailed financial reports and ledgers.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          <button 
            onClick={() => setActiveTab('MEMBER_LEDGER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'MEMBER_LEDGER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              Statement of Member
          </button>
          <button 
            onClick={() => setActiveTab('BILL_REGISTER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'BILL_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              Bill Register (Bifurcated)
          </button>
          <button 
            onClick={() => setActiveTab('RECEIPT_REGISTER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'RECEIPT_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              Receipt Register
          </button>
          <button 
            onClick={() => setActiveTab('PAYMENT_VOUCHERS')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'PAYMENT_VOUCHERS' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              Payment Vouchers
          </button>
          <button 
            onClick={() => setActiveTab('OUTSTANDING_STATEMENT')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'OUTSTANDING_STATEMENT' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <AlertCircle size={14} /> Outstanding Statement
          </button>
      </div>

      {/* --- CONTROLS --- */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          {activeTab === 'MEMBER_LEDGER' ? (
              <div className="w-full md:w-1/3">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Select Member</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedResidentId}
                    onChange={e => setSelectedResidentId(e.target.value)}
                  >
                      <option value="">-- Select Member --</option>
                      {residents.map(r => (
                          <option key={r.id} value={r.id}>{r.unitNumber} - {r.name}</option>
                      ))}
                  </select>
              </div>
          ) : activeTab === 'OUTSTANDING_STATEMENT' ? (
              <>
                <div className="w-full md:w-1/4">
                    <label className="block text-sm font-bold text-slate-700 mb-1">More than Amount (₹)</label>
                    <input 
                        type="number" 
                        min="0"
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={minOutstandingAmount}
                        onChange={e => setMinOutstandingAmount(Number(e.target.value))}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="block text-sm font-bold text-slate-700 mb-1">More than Months</label>
                    <input 
                        type="number" 
                        min="0"
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={minMonthsDue}
                        onChange={e => setMinMonthsDue(Number(e.target.value))}
                    />
                </div>
              </>
          ) : (
              <div className="w-full md:w-1/4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Select Month</label>
                  <input 
                    type="month"
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  />
              </div>
          )}
          
          <div className="flex-1"></div>
          
          <button 
            onClick={() => downloadPDF('statement-container', `Statement_${activeTab}.pdf`)}
            disabled={activeTab === 'MEMBER_LEDGER' && !selectedResidentId}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <Download size={18} /> Download Statement
          </button>
      </div>

      {/* --- REPORT VIEW CONTAINER --- */}
      <div className="bg-slate-200 p-4 md:p-8 rounded-xl overflow-auto flex justify-center border border-slate-300 min-h-[500px]">
         <div 
            id="statement-container" 
            className={`bg-white min-h-[297mm] p-[10mm] shadow-xl text-slate-800 ${(activeTab === 'MEMBER_LEDGER' || activeTab === 'PAYMENT_VOUCHERS' || activeTab === 'OUTSTANDING_STATEMENT') ? 'w-[210mm]' : 'w-[297mm]'}`}
         >
             {/* HEADER */}
             <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold uppercase">{activeSociety.name}</h1>
                <p className="text-sm text-slate-600">{activeSociety.address}</p>
                <h2 className="text-lg font-bold mt-4 bg-slate-100 inline-block px-4 py-1 rounded border border-slate-300 uppercase">
                    {activeTab === 'MEMBER_LEDGER' ? 'Statement of Account (Member Ledger)' : 
                     activeTab === 'BILL_REGISTER' ? `Bill Register (Bifurcated) - ${selectedMonth}` :
                     activeTab === 'RECEIPT_REGISTER' ? `Receipt Register - ${selectedMonth}` :
                     activeTab === 'OUTSTANDING_STATEMENT' ? 'Statement of Outstanding Dues' :
                     `Payment Voucher Register - ${selectedMonth}`}
                </h2>
                {activeTab === 'OUTSTANDING_STATEMENT' && (
                    <p className="text-sm text-slate-500 mt-2 italic">
                        Criteria: Dues &gt; ₹{minOutstandingAmount} AND Pending for &gt; {minMonthsDue} Months
                    </p>
                )}
             </div>

             {/* 1. MEMBER LEDGER VIEW */}
             {activeTab === 'MEMBER_LEDGER' && (
                 selectedResidentId && memberLedgerData ? (
                     <>
                        <div className="flex justify-between mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Member Name</p>
                                <p className="font-bold text-lg">{memberLedgerData.resident.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-bold">Unit No</p>
                                <p className="font-bold text-lg">{memberLedgerData.resident.unitNumber}</p>
                            </div>
                        </div>

                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 p-2 text-left">Date</th>
                                    <th className="border border-slate-300 p-2 text-left">Particulars</th>
                                    <th className="border border-slate-300 p-2 text-left">Ref No</th>
                                    <th className="border border-slate-300 p-2 text-right">Debit (₹)</th>
                                    <th className="border border-slate-300 p-2 text-right">Credit (₹)</th>
                                    <th className="border border-slate-300 p-2 text-right">Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-slate-50 font-medium">
                                    <td className="border border-slate-300 p-2">-</td>
                                    <td className="border border-slate-300 p-2">Opening Balance</td>
                                    <td className="border border-slate-300 p-2">-</td>
                                    <td className="border border-slate-300 p-2 text-right">{memberLedgerData.openingBalance > 0 ? memberLedgerData.openingBalance.toFixed(2) : '-'}</td>
                                    <td className="border border-slate-300 p-2 text-right">-</td>
                                    <td className="border border-slate-300 p-2 text-right">{memberLedgerData.openingBalance.toFixed(2)}</td>
                                </tr>
                                {memberLedgerData.transactions.map((t, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-slate-300 p-2">{t.date}</td>
                                        <td className="border border-slate-300 p-2">{t.description}</td>
                                        <td className="border border-slate-300 p-2">{t.ref}</td>
                                        <td className="border border-slate-300 p-2 text-right text-red-700">{t.debit > 0 ? t.debit.toFixed(2) : '-'}</td>
                                        <td className="border border-slate-300 p-2 text-right text-green-700">{t.credit > 0 ? t.credit.toFixed(2) : '-'}</td>
                                        <td className="border border-slate-300 p-2 text-right font-semibold">{t.balance.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </>
                 ) : (
                     <div className="text-center py-10 text-slate-400">Please select a member to view ledger.</div>
                 )
             )}

             {/* 2. BILL REGISTER VIEW (BIFURCATED) */}
             {activeTab === 'BILL_REGISTER' && (
                 <>
                    <table className="w-full text-xs border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left whitespace-nowrap">Bill Date</th>
                                <th className="border border-slate-300 p-2 text-left">Bill No</th>
                                <th className="border border-slate-300 p-2 text-left">Unit</th>
                                <th className="border border-slate-300 p-2 text-left">Name</th>
                                {billHeads.map(head => (
                                    <th key={head} className="border border-slate-300 p-2 text-right bg-indigo-50/50">{head}</th>
                                ))}
                                <th className="border border-slate-300 p-2 text-right">Int.</th>
                                <th className="border border-slate-300 p-2 text-right bg-slate-200">Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyBillRegister.length > 0 ? monthlyBillRegister.map((b, idx) => (
                                <tr key={idx}>
                                    <td className="border border-slate-300 p-2 whitespace-nowrap">{b.generatedDate}</td>
                                    <td className="border border-slate-300 p-2">{b.id}</td>
                                    <td className="border border-slate-300 p-2">{b.unitNumber}</td>
                                    <td className="border border-slate-300 p-2 truncate max-w-[100px]">{b.residentName}</td>
                                    {billHeads.map(head => {
                                        const item = b.items.find(i => i.description === head);
                                        return (
                                            <td key={head} className="border border-slate-300 p-2 text-right text-slate-600">
                                                {item ? item.amount.toFixed(2) : '-'}
                                            </td>
                                        );
                                    })}
                                    <td className="border border-slate-300 p-2 text-right text-orange-600">
                                        {b.interest > 0 ? b.interest.toFixed(2) : '-'}
                                    </td>
                                    <td className="border border-slate-300 p-2 text-right font-bold bg-slate-50">
                                        {b.totalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6 + billHeads.length} className="p-4 text-center text-slate-500">No bills found for {selectedMonth}</td></tr>
                            )}
                        </tbody>
                        <tfoot>
                             <tr className="bg-slate-100 font-bold">
                                 <td colSpan={4} className="border border-slate-300 p-2 text-right uppercase">Totals</td>
                                 {billHeads.map(head => {
                                     const total = monthlyBillRegister.reduce((sum, b) => {
                                          const item = b.items.find(i => i.description === head);
                                          return sum + (item ? item.amount : 0);
                                     }, 0);
                                     return <td key={head} className="border border-slate-300 p-2 text-right">{total.toFixed(2)}</td>
                                 })}
                                 <td className="border border-slate-300 p-2 text-right">
                                     {monthlyBillRegister.reduce((sum, b) => sum + b.interest, 0).toFixed(2)}
                                 </td>
                                 <td className="border border-slate-300 p-2 text-right text-indigo-700">
                                     ₹{monthlyBillRegister.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
                                 </td>
                             </tr>
                        </tfoot>
                    </table>
                 </>
             )}

             {/* 3. RECEIPT REGISTER VIEW */}
             {activeTab === 'RECEIPT_REGISTER' && (
                 <>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left">Rcpt Date</th>
                                <th className="border border-slate-300 p-2 text-left">Rcpt No</th>
                                <th className="border border-slate-300 p-2 text-left">Unit No</th>
                                <th className="border border-slate-300 p-2 text-left">Member Name</th>
                                <th className="border border-slate-300 p-2 text-left">Mode / Ref</th>
                                <th className="border border-slate-300 p-2 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyReceiptRegister.length > 0 ? monthlyReceiptRegister.map((b, idx) => (
                                <tr key={idx}>
                                    <td className="border border-slate-300 p-2">{b.paymentDetails?.date}</td>
                                    <td className="border border-slate-300 p-2">RCP-{b.id}</td>
                                    <td className="border border-slate-300 p-2">{b.unitNumber}</td>
                                    <td className="border border-slate-300 p-2">{b.residentName}</td>
                                    <td className="border border-slate-300 p-2 text-xs">
                                        {b.paymentDetails?.mode}<br/>{b.paymentDetails?.reference}
                                    </td>
                                    <td className="border border-slate-300 p-2 text-right">{b.totalAmount.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-4 text-center text-slate-500">No receipts found for {selectedMonth}</td></tr>
                            )}
                        </tbody>
                        <tfoot>
                             <tr className="bg-slate-100 font-bold">
                                 <td colSpan={5} className="border border-slate-300 p-2 text-right">Total Collection</td>
                                 <td className="border border-slate-300 p-2 text-right">
                                     ₹{monthlyReceiptRegister.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
                                 </td>
                             </tr>
                        </tfoot>
                    </table>
                 </>
             )}

             {/* 4. EXPENSE / PAYMENT VOUCHER REGISTER VIEW */}
             {activeTab === 'PAYMENT_VOUCHERS' && (
                 <>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left">Date</th>
                                <th className="border border-slate-300 p-2 text-left">Voucher ID</th>
                                <th className="border border-slate-300 p-2 text-left">Vendor / Payee</th>
                                <th className="border border-slate-300 p-2 text-left">Category</th>
                                <th className="border border-slate-300 p-2 text-left">Mode</th>
                                <th className="border border-slate-300 p-2 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyExpenseRegister.length > 0 ? monthlyExpenseRegister.map((e, idx) => (
                                <tr key={idx}>
                                    <td className="border border-slate-300 p-2">{e.date}</td>
                                    <td className="border border-slate-300 p-2 text-xs">{e.id}</td>
                                    <td className="border border-slate-300 p-2">{e.vendor}</td>
                                    <td className="border border-slate-300 p-2">{e.category}</td>
                                    <td className="border border-slate-300 p-2 text-xs">{e.paymentMode}</td>
                                    <td className="border border-slate-300 p-2 text-right">{e.amount.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-4 text-center text-slate-500">No vouchers found for {selectedMonth}</td></tr>
                            )}
                        </tbody>
                        <tfoot>
                             <tr className="bg-slate-100 font-bold">
                                 <td colSpan={5} className="border border-slate-300 p-2 text-right">Total Payments</td>
                                 <td className="border border-slate-300 p-2 text-right">
                                     ₹{monthlyExpenseRegister.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                                 </td>
                             </tr>
                        </tfoot>
                    </table>
                 </>
             )}

             {/* 5. OUTSTANDING STATEMENT VIEW */}
             {activeTab === 'OUTSTANDING_STATEMENT' && (
                 <>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left">Unit No</th>
                                <th className="border border-slate-300 p-2 text-left">Member Name</th>
                                <th className="border border-slate-300 p-2 text-center">Unpaid Bills</th>
                                <th className="border border-slate-300 p-2 text-center">Est. Months</th>
                                <th className="border border-slate-300 p-2 text-right">Pending Amount</th>
                                <th className="border border-slate-300 p-2 text-right">Opening Bal</th>
                                <th className="border border-slate-300 p-2 text-right font-bold">Total Due (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outstandingData.length > 0 ? outstandingData.map((r, idx) => (
                                <tr key={idx}>
                                    <td className="border border-slate-300 p-2 font-bold">{r.unitNumber}</td>
                                    <td className="border border-slate-300 p-2">{r.name}</td>
                                    <td className="border border-slate-300 p-2 text-center">{r.billCount}</td>
                                    <td className="border border-slate-300 p-2 text-center text-red-600 font-bold">{r.estMonths}</td>
                                    <td className="border border-slate-300 p-2 text-right">{r.pendingAmount.toFixed(2)}</td>
                                    <td className="border border-slate-300 p-2 text-right text-slate-500">{r.openingBalance.toFixed(2)}</td>
                                    <td className="border border-slate-300 p-2 text-right font-bold text-red-700 bg-red-50">
                                        {r.totalDue.toFixed(2)}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No members match the outstanding criteria.</td></tr>
                            )}
                        </tbody>
                        <tfoot>
                             <tr className="bg-slate-100 font-bold">
                                 <td colSpan={6} className="border border-slate-300 p-2 text-right">Total Outstanding</td>
                                 <td className="border border-slate-300 p-2 text-right text-red-700">
                                     ₹{outstandingData.reduce((sum, r) => sum + r.totalDue, 0).toFixed(2)}
                                 </td>
                             </tr>
                        </tfoot>
                    </table>
                 </>
             )}
         </div>
      </div>
    </div>
  );
};

export default Statements;