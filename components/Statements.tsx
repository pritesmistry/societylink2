
import React, { useState, useMemo } from 'react';
import { Bill, Expense, Resident, Society, PaymentStatus } from '../types';
import { Download, Search, Calendar, FileText, User, CreditCard, AlertCircle, Users, PencilLine, ClipboardList } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface StatementsProps {
  bills: Bill[];
  expenses: Expense[];
  residents: Resident[];
  activeSociety: Society;
  balances?: { cash: number; bank: number };
}

type StatementType = 'MEMBER_LEDGER' | 'BILL_REGISTER' | 'RECEIPT_REGISTER' | 'MONTHLY_OUTSTANDING' | 'OUTSTANDING_SUMMARY' | 'MEMBER_LIST';

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

  // Outstanding Summary Filters
  const [minOutstandingAmount, setMinOutstandingAmount] = useState<number>(1000);

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
            description: `Maintenance Bill - ${b.billMonth || 'General'}`,
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

  // 2. Monthly Outstanding Logic (Specific requested columns)
  const monthlyOutstandingData = useMemo(() => {
    return residents.map(r => {
        // Bills from this month (unpaid)
        const thisMonthBills = bills.filter(b => b.residentId === r.id && b.generatedDate.startsWith(selectedMonth));
        const currentBillAmount = thisMonthBills.reduce((s, b) => s + b.totalAmount, 0);

        // Arrears = Total Unpaid Bills (excl. this month) + Opening Balance
        const otherUnpaidBills = bills.filter(b => 
            b.residentId === r.id && 
            b.status !== PaymentStatus.PAID && 
            !b.generatedDate.startsWith(selectedMonth)
        );
        const arrearsAmount = r.openingBalance + otherUnpaidBills.reduce((s, b) => s + b.totalAmount, 0);

        // Total Outstanding
        const totalOutstanding = currentBillAmount + arrearsAmount;

        return {
            ...r,
            currentBillAmount,
            arrearsAmount,
            totalOutstanding
        };
    }).sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));
  }, [residents, bills, selectedMonth]);

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const opt = {
      margin: 0.3,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: (activeTab === 'BILL_REGISTER' || activeTab === 'RECEIPT_REGISTER') ? 'landscape' : 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onPrint={() => downloadPDF('statement-container', `Statement_${activeTab}.pdf`)}
        balances={balances}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Financial Reports & Registers</h2>
           <p className="text-sm text-slate-500 mt-1">Official society documentation and member accounts.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          <button onClick={() => setActiveTab('MEMBER_LEDGER')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'MEMBER_LEDGER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Member Ledger</button>
          <button onClick={() => setActiveTab('MONTHLY_OUTSTANDING')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'MONTHLY_OUTSTANDING' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><ClipboardList size={14}/> Monthly Outstanding</button>
          <button onClick={() => setActiveTab('BILL_REGISTER')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'BILL_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Bill Register</button>
          <button onClick={() => setActiveTab('RECEIPT_REGISTER')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'RECEIPT_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Receipt Register</button>
          <button onClick={() => setActiveTab('MEMBER_LIST')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'MEMBER_LIST' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Users size={14} /> Signature List</button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          {activeTab === 'MEMBER_LEDGER' ? (
              <div className="w-full md:w-1/3">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Select Society Member</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-lg outline-none font-bold text-slate-700" value={selectedResidentId} onChange={e => setSelectedResidentId(e.target.value)}>
                      <option value="">-- Choose Member --</option>
                      {residents.map(r => <option key={r.id} value={r.id}>{r.unitNumber} - {r.name}</option>)}
                  </select>
              </div>
          ) : (
              <div className="w-full md:w-1/4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Select Billing Month</label>
                  <input type="month" className="w-full p-2 border border-slate-200 rounded-lg font-bold outline-none" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
              </div>
          )}
          <div className="flex-1"></div>
          <button onClick={() => downloadPDF('statement-container', `Statement_${activeTab}.pdf`)} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"><Download size={16} /> Export Report</button>
      </div>

      <div className="bg-slate-200 p-4 md:p-8 rounded-2xl overflow-auto flex justify-center border border-slate-300 min-h-[600px] shadow-inner">
         <div id="statement-container" className={`bg-white min-h-[297mm] p-[15mm] shadow-xl text-slate-800 ${['BILL_REGISTER', 'RECEIPT_REGISTER'].includes(activeTab) ? 'w-[297mm]' : 'w-[210mm]'}`}>
             <div className="text-center border-b-4 border-slate-900 pb-4 mb-8">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{activeSociety.name}</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{activeSociety.address}</p>
                <h2 className="text-sm font-black mt-4 bg-slate-900 text-white inline-block px-10 py-2 rounded-full uppercase tracking-tighter">
                    {activeTab === 'MEMBER_LEDGER' ? 'Personal Ledger Statement' : 
                     activeTab === 'MONTHLY_OUTSTANDING' ? `Monthly Outstanding List - ${selectedMonth}` :
                     activeTab === 'BILL_REGISTER' ? `Bill Register - ${selectedMonth}` :
                     activeTab === 'RECEIPT_REGISTER' ? `Receipt Register - ${selectedMonth}` :
                     'Member Signature & Attendance List'}
                </h2>
             </div>

             {activeTab === 'MONTHLY_OUTSTANDING' && (
                 <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="border border-slate-800 p-3 text-center w-24">Flat No</th>
                            <th className="border border-slate-800 p-3 text-left">Member Name</th>
                            <th className="border border-slate-800 p-3 text-right">This Month Bill</th>
                            <th className="border border-slate-800 p-3 text-right">Arrears</th>
                            <th className="border border-slate-800 p-3 text-right bg-indigo-700">Total Outstanding</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthlyOutstandingData.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="border border-slate-300 p-3 text-center font-black text-slate-800">{r.unitNumber}</td>
                                <td className="border border-slate-300 p-3 font-bold text-slate-700">{r.name}</td>
                                <td className="border border-slate-300 p-3 text-right font-medium">₹ {r.currentBillAmount.toLocaleString()}</td>
                                <td className="border border-slate-300 p-3 text-right font-medium text-red-600">₹ {r.arrearsAmount.toLocaleString()}</td>
                                <td className="border border-slate-300 p-3 text-right font-black text-indigo-900 bg-slate-50">₹ {r.totalOutstanding.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black">
                        <tr>
                            <td colSpan={2} className="border border-slate-300 p-3 text-right uppercase tracking-widest text-slate-500">Gross Society Outstanding</td>
                            <td className="border border-slate-300 p-3 text-right">₹ {monthlyOutstandingData.reduce((s,r) => s + r.currentBillAmount, 0).toLocaleString()}</td>
                            <td className="border border-slate-300 p-3 text-right">₹ {monthlyOutstandingData.reduce((s,r) => s + r.arrearsAmount, 0).toLocaleString()}</td>
                            <td className="border border-slate-300 p-3 text-right text-indigo-900 text-lg">₹ {monthlyOutstandingData.reduce((s,r) => s + r.totalOutstanding, 0).toLocaleString()}</td>
                        </tr>
                    </tfoot>
                 </table>
             )}

             {activeTab === 'MEMBER_LIST' && (
                 <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="border border-slate-800 p-4 text-center w-16">Sr</th>
                            <th className="border border-slate-800 p-4 text-center w-32">Flat No.</th>
                            <th className="border border-slate-800 p-4 text-left">Name of Members</th>
                            <th className="border border-slate-800 p-4 text-center w-64">Signature</th>
                        </tr>
                    </thead>
                    <tbody>
                        {residents.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true })).map((r, idx) => (
                            <tr key={r.id} className="h-20">
                                <td className="border border-slate-300 p-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="border border-slate-300 p-4 text-center font-black text-slate-800">{r.unitNumber}</td>
                                <td className="border border-slate-300 p-4 font-bold text-slate-700">{r.name}</td>
                                <td className="border border-slate-300 p-4 relative">
                                    <div className="absolute bottom-4 left-6 right-6 border-b border-dashed border-slate-300"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             )}

             {activeTab === 'MEMBER_LEDGER' && (
                 selectedResidentId && memberLedgerData ? (
                    <>
                        <div className="flex justify-between mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Account Holder</p>
                                <p className="font-black text-2xl text-indigo-900">{memberLedgerData.resident.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Unit / Flat</p>
                                <p className="font-black text-2xl text-slate-800">{memberLedgerData.resident.unitNumber}</p>
                            </div>
                        </div>
                        <table className="w-full text-xs border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase tracking-tighter">
                                    <th className="border border-slate-800 p-3 text-left">Date</th>
                                    <th className="border border-slate-800 p-3 text-left">Particulars</th>
                                    <th className="border border-slate-800 p-3 text-right">Debit (₹)</th>
                                    <th className="border border-slate-800 p-3 text-right">Credit (₹)</th>
                                    <th className="border border-slate-800 p-3 text-right">Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-slate-50 font-black text-slate-500">
                                    <td className="border border-slate-300 p-3 text-center">-</td>
                                    <td className="border border-slate-300 p-3">OPENING BALANCE / ARREARS AS ON START</td>
                                    <td className="border border-slate-300 p-3 text-right">{memberLedgerData.openingBalance > 0 ? memberLedgerData.openingBalance.toFixed(2) : '-'}</td>
                                    <td className="border border-slate-300 p-3 text-right">-</td>
                                    <td className="border border-slate-300 p-3 text-right font-black text-slate-800">{memberLedgerData.openingBalance.toFixed(2)}</td>
                                </tr>
                                {memberLedgerData.transactions.map((t, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-slate-300 p-3 whitespace-nowrap">{t.date}</td>
                                        <td className="border border-slate-300 p-3">{t.description} <span className="text-[10px] text-slate-400 block font-mono">{t.ref}</span></td>
                                        <td className="border border-slate-300 p-3 text-right text-red-600 font-bold">{t.debit > 0 ? t.debit.toFixed(2) : '-'}</td>
                                        <td className="border border-slate-300 p-3 text-right text-green-600 font-bold">{t.credit > 0 ? t.credit.toFixed(2) : '-'}</td>
                                        <td className="border border-slate-300 p-3 text-right font-black text-indigo-900">{t.balance.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                 ) : <div className="text-center py-20 text-slate-400 font-bold">Please select a member to view ledger.</div>
             )}

             <div className="mt-20 flex justify-between px-10">
                  <div className="text-center w-40 border-t-2 border-slate-900 pt-3">
                      <p className="font-black uppercase text-[10px]">Treasurer / Secretary</p>
                  </div>
                  <div className="text-center w-40 border-t-2 border-slate-900 pt-3">
                      <p className="font-black uppercase text-[10px]">Chairman</p>
                  </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Statements;
