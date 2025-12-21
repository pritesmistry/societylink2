
import React, { useState, useMemo } from 'react';
import { Bill, Expense, Resident, Society, PaymentStatus } from '../types';
import { Download, Search, Calendar, FileText, User, CreditCard, AlertCircle, Users, PencilLine } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface StatementsProps {
  bills: Bill[];
  expenses: Expense[];
  residents: Resident[];
  activeSociety: Society;
  balances?: { cash: number; bank: number };
}

type StatementType = 'MEMBER_LEDGER' | 'BILL_REGISTER' | 'RECEIPT_REGISTER' | 'PAYMENT_VOUCHERS' | 'OUTSTANDING_STATEMENT' | 'MEMBER_LIST';

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
    const transactions: any[] = [];

    memberBills.forEach(b => {
        transactions.push({
            date: b.generatedDate,
            type: 'BILL',
            ref: `Bill #${b.id}`,
            description: 'Maintenance Bill Generated',
            debit: b.totalAmount,
            credit: 0
        });

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

    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let balance = resident.openingBalance; 
    const ledgerWithBalance = transactions.map(t => {
        balance = balance + t.debit - t.credit;
        return { ...t, balance };
    });

    return { resident, openingBalance: resident.openingBalance, transactions: ledgerWithBalance };
  }, [selectedResidentId, bills, residents]);


  // 2. Monthly Bill Register
  const monthlyBillRegister = useMemo(() => {
     return bills.filter(b => b.generatedDate.startsWith(selectedMonth));
  }, [bills, selectedMonth]);

  const billHeads = useMemo(() => {
    const heads = new Set<string>();
    monthlyBillRegister.forEach(b => {
        b.items.forEach(i => heads.add(i.description));
    });
    return Array.from(heads).sort();
  }, [monthlyBillRegister]);


  // 3. Monthly Receipt Register
  const monthlyReceiptRegister = useMemo(() => {
    return bills.filter(b => 
        b.status === PaymentStatus.PAID && 
        b.paymentDetails && 
        b.paymentDetails.date.startsWith(selectedMonth)
    );
  }, [bills, selectedMonth]);


  // 4. Monthly Expense Register
  const monthlyExpenseRegister = useMemo(() => {
      return expenses.filter(e => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  // 5. Outstanding Statement Logic
  const outstandingData = useMemo(() => {
      return residents.map(r => {
          const unpaidBills = bills.filter(b => b.residentId === r.id && b.status !== PaymentStatus.PAID);
          const pendingAmount = unpaidBills.reduce((sum, b) => sum + b.totalAmount, 0);
          const totalDue = r.openingBalance + pendingAmount;
          
          const allUserBills = bills.filter(b => b.residentId === r.id);
          const avgBill = allUserBills.length > 0 
              ? allUserBills.reduce((s,b)=>s+b.totalAmount,0) / allUserBills.length 
              : 0;
              
          let estMonths = unpaidBills.length;
          if (r.openingBalance > 0 && avgBill > 0) {
              estMonths += Math.ceil(r.openingBalance / avgBill);
          } else if (r.openingBalance > 0 && estMonths === 0) {
              estMonths = 1;
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
    
    element.classList.remove('shadow-xl');

    const opt = {
      margin:       0.3,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: (activeTab === 'MEMBER_LEDGER' || activeTab === 'PAYMENT_VOUCHERS' || activeTab === 'OUTSTANDING_STATEMENT' || activeTab === 'MEMBER_LIST') ? 'portrait' : 'landscape' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        element.classList.add('shadow-xl');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSearch={() => alert("Search available within table using browser Ctrl+F")}
        onPrint={() => downloadPDF('statement-container', `Statement_${activeTab}.pdf`)}
        balances={balances}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Statements & Registers</h2>
           <p className="text-sm text-slate-500 mt-1">Detailed financial reports and member listings.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          <button 
            onClick={() => setActiveTab('MEMBER_LEDGER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'MEMBER_LEDGER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              Member Ledger
          </button>
          <button 
            onClick={() => setActiveTab('BILL_REGISTER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'BILL_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              Bill Register
          </button>
          <button 
            onClick={() => setActiveTab('RECEIPT_REGISTER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'RECEIPT_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              Receipt Register
          </button>
          <button 
            onClick={() => setActiveTab('OUTSTANDING_STATEMENT')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'OUTSTANDING_STATEMENT' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <AlertCircle size={14} /> Outstanding
          </button>
          <button 
            onClick={() => setActiveTab('MEMBER_LIST')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'MEMBER_LIST' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Users size={14} /> Member Signature List
          </button>
      </div>

      {/* --- CONTROLS --- */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          {activeTab === 'MEMBER_LEDGER' ? (
              <div className="w-full md:w-1/3">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Select Member</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
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
          ) : activeTab === 'MEMBER_LIST' ? (
             <div className="w-full md:w-1/4">
                <p className="text-sm text-slate-500 font-medium">Exporting total {residents.length} members.</p>
             </div>
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
            className="bg-slate-800 text-white px-6 py-2 rounded-lg font-black flex items-center gap-2 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
          >
              <Download size={18} /> Export Statement
          </button>
      </div>

      {/* --- REPORT VIEW CONTAINER --- */}
      <div className="bg-slate-200 p-4 md:p-8 rounded-2xl overflow-auto flex justify-center border border-slate-300 min-h-[500px] shadow-inner">
         <div 
            id="statement-container" 
            className={`bg-white min-h-[297mm] p-[15mm] shadow-xl text-slate-800 ${(activeTab === 'MEMBER_LEDGER' || activeTab === 'PAYMENT_VOUCHERS' || activeTab === 'OUTSTANDING_STATEMENT' || activeTab === 'MEMBER_LIST') ? 'w-[210mm]' : 'w-[297mm]'}`}
         >
             {/* HEADER */}
             <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{activeSociety.name}</h1>
                <p className="text-sm text-slate-500 font-medium">{activeSociety.address}</p>
                <h2 className="text-lg font-black mt-6 bg-slate-900 text-white inline-block px-8 py-1.5 rounded uppercase tracking-widest">
                    {activeTab === 'MEMBER_LEDGER' ? 'Member Ledger Statement' : 
                     activeTab === 'BILL_REGISTER' ? `Bill Register - ${selectedMonth}` :
                     activeTab === 'RECEIPT_REGISTER' ? `Receipt Register - ${selectedMonth}` :
                     activeTab === 'OUTSTANDING_STATEMENT' ? 'Outstanding Dues Statement' :
                     activeTab === 'MEMBER_LIST' ? 'Member Signature List' :
                     `Payment Voucher Register - ${selectedMonth}`}
                </h2>
                {activeTab === 'OUTSTANDING_STATEMENT' && (
                    <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-tighter">
                        Criteria: Dues > ₹{minOutstandingAmount} & Pending > {minMonthsDue} Months
                    </p>
                )}
             </div>

             {/* 1. MEMBER LEDGER VIEW */}
             {activeTab === 'MEMBER_LEDGER' && (
                 selectedResidentId && memberLedgerData ? (
                     <>
                        <div className="flex justify-between mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Member Account</p>
                                <p className="font-black text-xl text-indigo-900">{memberLedgerData.resident.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Unit Number</p>
                                <p className="font-black text-xl text-slate-800">{memberLedgerData.resident.unitNumber}</p>
                            </div>
                        </div>

                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="border border-slate-800 p-3 text-left">Date</th>
                                    <th className="border border-slate-800 p-3 text-left">Particulars</th>
                                    <th className="border border-slate-800 p-3 text-left">Ref No</th>
                                    <th className="border border-slate-800 p-3 text-right">Debit (₹)</th>
                                    <th className="border border-slate-800 p-3 text-right">Credit (₹)</th>
                                    <th className="border border-slate-800 p-3 text-right">Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-slate-50 font-bold text-slate-600">
                                    <td className="border border-slate-300 p-3 text-center">-</td>
                                    <td className="border border-slate-300 p-3 uppercase text-xs">Opening Balance / Arrears</td>
                                    <td className="border border-slate-300 p-3">-</td>
                                    <td className="border border-slate-300 p-3 text-right">{memberLedgerData.openingBalance > 0 ? memberLedgerData.openingBalance.toFixed(2) : '-'}</td>
                                    <td className="border border-slate-300 p-3 text-right">-</td>
                                    <td className="border border-slate-300 p-3 text-right font-black">{memberLedgerData.openingBalance.toFixed(2)}</td>
                                </tr>
                                {memberLedgerData.transactions.map((t, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="border border-slate-300 p-3 whitespace-nowrap font-medium">{t.date}</td>
                                        <td className="border border-slate-300 p-3 text-xs leading-relaxed">{t.description}</td>
                                        <td className="border border-slate-300 p-3 text-[10px] font-mono">{t.ref}</td>
                                        <td className="border border-slate-300 p-3 text-right text-red-600 font-bold">{t.debit > 0 ? t.debit.toFixed(2) : '-'}</td>
                                        <td className="border border-slate-300 p-3 text-right text-green-600 font-bold">{t.credit > 0 ? t.credit.toFixed(2) : '-'}</td>
                                        <td className="border border-slate-300 p-3 text-right font-black text-indigo-900">{t.balance.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </>
                 ) : (
                     <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                         <User size={48} className="mb-4 opacity-10" />
                         <p className="font-bold">Please select a member from the dropdown above.</p>
                     </div>
                 )
             )}

             {/* 2. BILL REGISTER VIEW */}
             {activeTab === 'BILL_REGISTER' && (
                 <>
                    <table className="w-full text-[10px] border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="border border-slate-800 p-2 text-left">Bill Date</th>
                                <th className="border border-slate-800 p-2 text-left">No.</th>
                                <th className="border border-slate-800 p-2 text-left">Unit</th>
                                <th className="border border-slate-800 p-2 text-left">Member Name</th>
                                {billHeads.map(head => (
                                    <th key={head} className="border border-slate-800 p-2 text-right">{head}</th>
                                ))}
                                <th className="border border-slate-800 p-2 text-right">Int.</th>
                                <th className="border border-slate-800 p-2 text-right bg-indigo-700">Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyBillRegister.length > 0 ? monthlyBillRegister.map((b, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="border border-slate-300 p-2 whitespace-nowrap font-medium">{b.generatedDate}</td>
                                    <td className="border border-slate-300 p-2 font-mono">{b.id}</td>
                                    <td className="border border-slate-300 p-2 font-black">{b.unitNumber}</td>
                                    <td className="border border-slate-300 p-2 truncate max-w-[120px] font-medium">{b.residentName}</td>
                                    {billHeads.map(head => {
                                        const item = b.items.find(i => i.description === head);
                                        return (
                                            <td key={head} className="border border-slate-300 p-2 text-right text-slate-600">
                                                {item ? item.amount.toFixed(2) : '-'}
                                            </td>
                                        );
                                    })}
                                    <td className="border border-slate-300 p-2 text-right text-red-600 font-bold">
                                        {b.interest > 0 ? b.interest.toFixed(2) : '-'}
                                    </td>
                                    <td className="border border-slate-300 p-2 text-right font-black bg-slate-50">
                                        {b.totalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6 + billHeads.length} className="p-10 text-center text-slate-400 italic">No billing records found for the selected period.</td></tr>
                            )}
                        </tbody>
                    </table>
                 </>
             )}

             {/* 6. MEMBER LIST (SIGNATURE LIST) */}
             {activeTab === 'MEMBER_LIST' && (
                 <div className="space-y-4">
                    <p className="text-xs text-slate-500 mb-4 font-medium italic">Official list of registered members for attendance or circular acknowledgement.</p>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="border border-slate-800 p-4 text-center w-16">Sr No</th>
                                <th className="border border-slate-800 p-4 text-center w-32">Flat No.</th>
                                <th className="border border-slate-800 p-4 text-left">Name of Members</th>
                                <th className="border border-slate-800 p-4 text-center w-48">Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                            {residents.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber)).map((r, idx) => (
                                <tr key={r.id} className="h-16">
                                    <td className="border border-slate-300 p-4 text-center text-slate-500 font-bold">{idx + 1}</td>
                                    <td className="border border-slate-300 p-4 text-center font-black text-slate-800">{r.unitNumber}</td>
                                    <td className="border border-slate-300 p-4 font-bold text-slate-700">{r.name}</td>
                                    <td className="border border-slate-300 p-4 relative">
                                        <div className="absolute bottom-2 left-4 right-4 border-b border-slate-200"></div>
                                    </td>
                                </tr>
                            ))}
                            {residents.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-slate-400">
                                        <Users size={48} className="mx-auto mb-4 opacity-10" />
                                        <p className="font-bold">No members registered in the system.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             )}

             {/* 3. RECEIPT REGISTER VIEW */}
             {activeTab === 'RECEIPT_REGISTER' && (
                 <>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="border border-slate-800 p-3 text-left">Date</th>
                                <th className="border border-slate-800 p-3 text-left">Rcpt No.</th>
                                <th className="border border-slate-800 p-3 text-center">Unit</th>
                                <th className="border border-slate-800 p-3 text-left">Member Name</th>
                                <th className="border border-slate-800 p-3 text-left">Mode / Reference</th>
                                <th className="border border-slate-800 p-3 text-right bg-indigo-700">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyReceiptRegister.length > 0 ? monthlyReceiptRegister.map((b, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="border border-slate-300 p-3 font-medium">{b.paymentDetails?.date}</td>
                                    <td className="border border-slate-300 p-3 font-mono">RCP-{b.id}</td>
                                    <td className="border border-slate-300 p-3 text-center font-black">{b.unitNumber}</td>
                                    <td className="border border-slate-300 p-3 font-bold">{b.residentName}</td>
                                    <td className="border border-slate-300 p-3 text-[10px] leading-tight">
                                        <span className="font-black text-indigo-700 uppercase">{b.paymentDetails?.mode}</span><br/>
                                        <span className="text-slate-400 font-mono">{b.paymentDetails?.reference}</span>
                                    </td>
                                    <td className="border border-slate-300 p-3 text-right font-black bg-slate-50">{b.totalAmount.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-10 text-center text-slate-400 italic">No receipts found for this period.</td></tr>
                            )}
                        </tbody>
                        {monthlyReceiptRegister.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-100 font-black">
                                    <td colSpan={5} className="border border-slate-300 p-3 text-right uppercase tracking-widest text-slate-500">Total Collection</td>
                                    <td className="border border-slate-300 p-3 text-right text-indigo-900 text-lg">
                                        ₹{monthlyReceiptRegister.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                 </>
             )}

             {/* 5. OUTSTANDING STATEMENT VIEW */}
             {activeTab === 'OUTSTANDING_STATEMENT' && (
                 <>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="border border-slate-800 p-3 text-center w-24">Flat No</th>
                                <th className="border border-slate-800 p-3 text-left">Member Name</th>
                                <th className="border border-slate-800 p-3 text-center w-20">Dues</th>
                                <th className="border border-slate-800 p-3 text-right w-32">Maintenance</th>
                                <th className="border border-slate-800 p-3 text-right w-32">Op. Bal</th>
                                <th className="border border-slate-800 p-3 text-right bg-red-700 w-32">Total Due (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outstandingData.length > 0 ? outstandingData.map((r, idx) => (
                                <tr key={idx} className="hover:bg-red-50 transition-colors">
                                    <td className="border border-slate-300 p-3 text-center font-black text-slate-800">{r.unitNumber}</td>
                                    <td className="border border-slate-300 p-3 font-bold text-slate-700">{r.name}</td>
                                    <td className="border border-slate-300 p-3 text-center">
                                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                            {r.estMonths} Months
                                        </span>
                                    </td>
                                    <td className="border border-slate-300 p-3 text-right font-medium text-slate-500">{r.pendingAmount.toFixed(2)}</td>
                                    <td className="border border-slate-300 p-3 text-right font-medium text-slate-500">{r.openingBalance.toFixed(2)}</td>
                                    <td className="border border-slate-300 p-3 text-right font-black text-red-900 bg-red-50/50">
                                        {r.totalDue.toFixed(2)}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-bold">No members match the outstanding criteria.</td></tr>
                            )}
                        </tbody>
                        {outstandingData.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-100 font-black">
                                    <td colSpan={5} className="border border-slate-300 p-3 text-right uppercase tracking-widest text-slate-500">Gross Outstanding</td>
                                    <td className="border border-slate-300 p-3 text-right text-red-700 text-lg">
                                        ₹{outstandingData.reduce((sum, r) => sum + r.totalDue, 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                 </>
             )}

             {/* SIGNATURES */}
             <div className="mt-20 grid grid-cols-2 gap-20 px-10">
                  <div className="text-center">
                      <div className="border-t-2 border-slate-900 pt-3">
                          <p className="font-black uppercase text-xs tracking-widest text-slate-800">Hon. Secretary / Treasurer</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Society Official Stamp</p>
                      </div>
                  </div>
                  <div className="text-center">
                      <div className="border-t-2 border-slate-900 pt-3">
                          <p className="font-black uppercase text-xs tracking-widest text-slate-800">Hon. Chairman</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Society Official Stamp</p>
                      </div>
                  </div>
             </div>

             <div className="mt-auto pt-10 text-[8px] text-slate-300 font-bold text-center uppercase tracking-widest">
                Generated by SocietyLink Enterprise OS • Confidential Document
             </div>
         </div>
      </div>
    </div>
  );
};

export default Statements;
