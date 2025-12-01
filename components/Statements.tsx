import React, { useState, useMemo } from 'react';
import { Bill, Expense, Resident, Society, PaymentStatus } from '../types';
import { Download, Search, Calendar, FileText, User, CreditCard } from 'lucide-react';

interface StatementsProps {
  bills: Bill[];
  expenses: Expense[];
  residents: Resident[];
  activeSociety: Society;
}

type StatementType = 'MEMBER_LEDGER' | 'BILL_REGISTER' | 'RECEIPT_REGISTER' | 'PAYMENT_VOUCHERS';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const Statements: React.FC<StatementsProps> = ({ bills, expenses, residents, activeSociety }) => {
  const [activeTab, setActiveTab] = useState<StatementType>('MEMBER_LEDGER');
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // --- DATA PROCESSING LOGIC ---

  // 1. Member Ledger Logic
  const memberLedgerData = useMemo(() => {
    if (!selectedResidentId) return [];
    
    const resident = residents.find(r => r.id === selectedResidentId);
    if (!resident) return [];

    const memberBills = bills.filter(b => b.residentId === selectedResidentId);
    
    // Convert Bills and Payments into a single chronological ledger
    const transactions = [];

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
      jsPDF:        { unit: 'in', format: 'a4', orientation: activeTab === 'MEMBER_LEDGER' ? 'portrait' : 'landscape' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        element.classList.add('shadow-xl');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
              Bill Register
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
            className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-xl text-slate-800"
         >
             {/* HEADER */}
             <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold uppercase">{activeSociety.name}</h1>
                <p className="text-sm text-slate-600">{activeSociety.address}</p>
                <h2 className="text-lg font-bold mt-4 bg-slate-100 inline-block px-4 py-1 rounded border border-slate-300 uppercase">
                    {activeTab === 'MEMBER_LEDGER' ? 'Statement of Account (Member Ledger)' : 
                     activeTab === 'BILL_REGISTER' ? `Bill Register - ${selectedMonth}` :
                     activeTab === 'RECEIPT_REGISTER' ? `Receipt Register - ${selectedMonth}` :
                     `Payment Voucher Register - ${selectedMonth}`}
                </h2>
             </div>

             {/* 1. MEMBER LEDGER VIEW */}
             {activeTab === 'MEMBER_LEDGER' && (
                 selectedResidentId && memberLedgerData.resident ? (
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

             {/* 2. BILL REGISTER VIEW */}
             {activeTab === 'BILL_REGISTER' && (
                 <>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left">Bill Date</th>
                                <th className="border border-slate-300 p-2 text-left">Bill No</th>
                                <th className="border border-slate-300 p-2 text-left">Unit No</th>
                                <th className="border border-slate-300 p-2 text-left">Member Name</th>
                                <th className="border border-slate-300 p-2 text-right">Bill Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyBillRegister.length > 0 ? monthlyBillRegister.map((b, idx) => (
                                <tr key={idx}>
                                    <td className="border border-slate-300 p-2">{b.generatedDate}</td>
                                    <td className="border border-slate-300 p-2">{b.id}</td>
                                    <td className="border border-slate-300 p-2">{b.unitNumber}</td>
                                    <td className="border border-slate-300 p-2">{b.residentName}</td>
                                    <td className="border border-slate-300 p-2 text-right">{b.totalAmount.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="p-4 text-center text-slate-500">No bills found for {selectedMonth}</td></tr>
                            )}
                        </tbody>
                        <tfoot>
                             <tr className="bg-slate-100 font-bold">
                                 <td colSpan={4} className="border border-slate-300 p-2 text-right">Total Billing</td>
                                 <td className="border border-slate-300 p-2 text-right">
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
                                <th className="border border-slate-300 p-2 text-left">Payee / Vendor</th>
                                <th className="border border-slate-300 p-2 text-left">Category</th>
                                <th className="border border-slate-300 p-2 text-left">Description</th>
                                <th className="border border-slate-300 p-2 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyExpenseRegister.length > 0 ? monthlyExpenseRegister.map((e, idx) => (
                                <tr key={idx}>
                                    <td className="border border-slate-300 p-2">{e.date}</td>
                                    <td className="border border-slate-300 p-2">{e.id}</td>
                                    <td className="border border-slate-300 p-2">{e.vendor}</td>
                                    <td className="border border-slate-300 p-2">{e.category}</td>
                                    <td className="border border-slate-300 p-2">{e.description}</td>
                                    <td className="border border-slate-300 p-2 text-right">{e.amount.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-4 text-center text-slate-500">No expense vouchers found for {selectedMonth}</td></tr>
                            )}
                        </tbody>
                        <tfoot>
                             <tr className="bg-slate-100 font-bold">
                                 <td colSpan={5} className="border border-slate-300 p-2 text-right">Total Expenses</td>
                                 <td className="border border-slate-300 p-2 text-right">
                                     ₹{monthlyExpenseRegister.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
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