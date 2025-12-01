
import React, { useState, useMemo } from 'react';
import { Resident, Society, Bill, Expense } from '../types';
import { Download, Book, FileText, UserCheck, Users, FileCheck, ClipboardCheck } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface StatutoryRegistersProps {
  residents: Resident[];
  activeSociety: Society;
  bills?: Bill[];
  expenses?: Expense[];
}

type RegisterType = 'I_REGISTER' | 'J_REGISTER' | 'SHARE_REGISTER' | 'NOMINATION_REGISTER' | 'AUDIT_REPORT' | 'O_FORM';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const StatutoryRegisters: React.FC<StatutoryRegistersProps> = ({ residents, activeSociety, bills = [], expenses = [] }) => {
  const [activeTab, setActiveTab] = useState<RegisterType>('I_REGISTER');

  // Filter only owners for registers usually
  const members = residents.filter(r => r.occupancyType === 'Owner');

  // Basic Financial Summary for Audit Report
  const auditSummary = useMemo(() => {
      const totalIncome = bills.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
      const surplus = totalIncome - totalExpense;
      return { totalIncome, totalExpense, surplus };
  }, [bills, expenses]);

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.remove('shadow-xl');

    const opt = {
      margin:       0.3,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        element.classList.add('shadow-xl');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSave={() => alert("Changes saved to register.")}
        onPrint={() => downloadPDF('register-container', `${activeTab}_${activeSociety.name}.pdf`)}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Statutory Registers & Audit</h2>
           <p className="text-sm text-slate-500 mt-1">Official society records (I, J, Share, Nomination, Audit, Form O).</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          <button 
            onClick={() => setActiveTab('I_REGISTER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'I_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Book size={16} /> "I" Register
          </button>
          <button 
            onClick={() => setActiveTab('J_REGISTER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'J_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Users size={16} /> "J" Register
          </button>
          <button 
            onClick={() => setActiveTab('SHARE_REGISTER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'SHARE_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <FileText size={16} /> Share Register
          </button>
          <button 
            onClick={() => setActiveTab('NOMINATION_REGISTER')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'NOMINATION_REGISTER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <UserCheck size={16} /> Nomination
          </button>
          <button 
            onClick={() => setActiveTab('AUDIT_REPORT')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'AUDIT_REPORT' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <FileCheck size={16} /> Audit Report
          </button>
          <button 
            onClick={() => setActiveTab('O_FORM')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'O_FORM' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <ClipboardCheck size={16} /> "O" Form
          </button>
      </div>

       <div className="flex justify-end">
          <button 
            onClick={() => downloadPDF('register-container', `${activeTab}_${activeSociety.name}.pdf`)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 shadow-sm"
          >
              <Download size={18} /> Download PDF
          </button>
       </div>

      <div className="bg-slate-200 p-4 md:p-8 rounded-xl overflow-auto flex justify-center border border-slate-300 min-h-[500px]">
         <div 
            id="register-container" 
            className="bg-white w-[297mm] min-h-[210mm] p-[10mm] shadow-xl text-slate-800"
         >
             {/* HEADER */}
             <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold uppercase">{activeSociety.name}</h1>
                <p className="text-sm text-slate-600">{activeSociety.address}</p>
                {activeSociety.registrationNumber && <p className="text-sm text-slate-500 mt-1">Reg No: {activeSociety.registrationNumber}</p>}
                <h2 className="text-lg font-bold mt-4 bg-slate-100 inline-block px-4 py-1 rounded border border-slate-300 uppercase">
                    {activeTab === 'I_REGISTER' ? 'Form I - Register of Members' : 
                     activeTab === 'J_REGISTER' ? 'Form J - List of Members' :
                     activeTab === 'SHARE_REGISTER' ? 'Share Register' :
                     activeTab === 'NOMINATION_REGISTER' ? 'Nomination Register' :
                     activeTab === 'AUDIT_REPORT' ? 'Statutory Audit Report (Draft)' :
                     'Form "O" - Rectification Report'}
                </h2>
             </div>

             {/* I REGISTER */}
             {activeTab === 'I_REGISTER' && (
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-xs">
                        <tr>
                            <th className="border border-slate-300 p-2">Sr No</th>
                            <th className="border border-slate-300 p-2 text-left">Full Name of Member</th>
                            <th className="border border-slate-300 p-2 text-left">Address (Unit)</th>
                            <th className="border border-slate-300 p-2">Date of Admission</th>
                            <th className="border border-slate-300 p-2">Share Cert No</th>
                            <th className="border border-slate-300 p-2">No of Shares</th>
                            <th className="border border-slate-300 p-2">Occupancy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((m, idx) => (
                            <tr key={m.id}>
                                <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                                <td className="border border-slate-300 p-2">{m.name}</td>
                                <td className="border border-slate-300 p-2">{m.unitNumber}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.membershipDate || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.shareCertificateNumber || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">
                                    {(m.shareDistinctiveTo && m.shareDistinctiveFrom) 
                                        ? (m.shareDistinctiveTo - m.shareDistinctiveFrom + 1) 
                                        : (m.shareCertificateNumber ? 5 : '-')}
                                </td>
                                <td className="border border-slate-300 p-2 text-center">{m.occupancyType}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}

             {/* J REGISTER */}
             {activeTab === 'J_REGISTER' && (
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-xs">
                        <tr>
                            <th className="border border-slate-300 p-2">Sr No</th>
                            <th className="border border-slate-300 p-2 text-left">Full Name</th>
                            <th className="border border-slate-300 p-2 text-left">Address / Flat No</th>
                            <th className="border border-slate-300 p-2">Class of Member</th>
                            <th className="border border-slate-300 p-2">Date of Membership</th>
                        </tr>
                    </thead>
                    <tbody>
                         {members.map((m, idx) => (
                            <tr key={m.id}>
                                <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                                <td className="border border-slate-300 p-2">{m.name}</td>
                                <td className="border border-slate-300 p-2">{m.unitNumber}</td>
                                <td className="border border-slate-300 p-2 text-center">Ordinary</td>
                                <td className="border border-slate-300 p-2 text-center">{m.membershipDate || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}

             {/* SHARE REGISTER */}
             {activeTab === 'SHARE_REGISTER' && (
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-xs">
                        <tr>
                            <th className="border border-slate-300 p-2">Cert No</th>
                            <th className="border border-slate-300 p-2 text-left">Member Name</th>
                            <th className="border border-slate-300 p-2 text-center">Date of Issue</th>
                            <th className="border border-slate-300 p-2 text-center">Dist No From</th>
                            <th className="border border-slate-300 p-2 text-center">Dist No To</th>
                            <th className="border border-slate-300 p-2 text-center">Total Shares</th>
                        </tr>
                    </thead>
                    <tbody>
                         {members.map((m) => (
                            <tr key={m.id}>
                                <td className="border border-slate-300 p-2 text-center font-bold">{m.shareCertificateNumber || '-'}</td>
                                <td className="border border-slate-300 p-2">{m.name}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.membershipDate || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.shareDistinctiveFrom || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.shareDistinctiveTo || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">
                                     {(m.shareDistinctiveTo && m.shareDistinctiveFrom) 
                                        ? (m.shareDistinctiveTo - m.shareDistinctiveFrom + 1) 
                                        : (m.shareCertificateNumber ? 5 : '-')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}

             {/* NOMINATION REGISTER */}
             {activeTab === 'NOMINATION_REGISTER' && (
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-xs">
                        <tr>
                            <th className="border border-slate-300 p-2">Sr No</th>
                            <th className="border border-slate-300 p-2 text-left">Member Name</th>
                            <th className="border border-slate-300 p-2 text-left">Nominee Name</th>
                            <th className="border border-slate-300 p-2 text-center">Relation</th>
                            <th className="border border-slate-300 p-2 text-center">Date of Nomination</th>
                            <th className="border border-slate-300 p-2 text-center">Share %</th>
                        </tr>
                    </thead>
                    <tbody>
                         {members.map((m, idx) => (
                            <tr key={m.id}>
                                <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                                <td className="border border-slate-300 p-2">{m.name}</td>
                                <td className="border border-slate-300 p-2">{m.nomineeName || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.nomineeRelation || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.nominationDate || '-'}</td>
                                <td className="border border-slate-300 p-2 text-center">{m.nomineeName ? '100%' : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}

             {/* AUDIT REPORT */}
             {activeTab === 'AUDIT_REPORT' && (
                 <div className="space-y-6">
                     <div className="bg-slate-50 p-4 border border-slate-200 rounded">
                         <h3 className="font-bold text-slate-800 mb-2 underline">Executive Summary for Auditor</h3>
                         <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                                 <p className="text-slate-500">Total Income</p>
                                 <p className="font-bold">₹ {auditSummary.totalIncome.toFixed(2)}</p>
                             </div>
                             <div>
                                 <p className="text-slate-500">Total Expenditure</p>
                                 <p className="font-bold">₹ {auditSummary.totalExpense.toFixed(2)}</p>
                             </div>
                             <div>
                                 <p className="text-slate-500">Net Surplus/Deficit</p>
                                 <p className={`font-bold ${auditSummary.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                     ₹ {auditSummary.surplus.toFixed(2)}
                                 </p>
                             </div>
                             <div>
                                 <p className="text-slate-500">Vouchers Count</p>
                                 <p className="font-bold">{expenses.length} Payments, {bills.length} Bills</p>
                             </div>
                         </div>
                     </div>

                     <div>
                        <h3 className="font-bold text-slate-800 mb-2">Audit Checklist & Compliance</h3>
                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <thead className="bg-slate-100 text-xs">
                                <tr>
                                    <th className="border border-slate-300 p-2 w-10">No</th>
                                    <th className="border border-slate-300 p-2 text-left">Particulars</th>
                                    <th className="border border-slate-300 p-2 w-24 text-center">Status</th>
                                    <th className="border border-slate-300 p-2 text-left">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-300 p-2 text-center">1</td>
                                    <td className="border border-slate-300 p-2">Adoption of Bye-Laws</td>
                                    <td className="border border-slate-300 p-2 text-center text-green-600 font-bold">YES</td>
                                    <td className="border border-slate-300 p-2">Standard Bye-laws adopted</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-300 p-2 text-center">2</td>
                                    <td className="border border-slate-300 p-2">AGM Conducted within time</td>
                                    <td className="border border-slate-300 p-2 text-center text-green-600 font-bold">YES</td>
                                    <td className="border border-slate-300 p-2">Held on 15th Sept 2023</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-300 p-2 text-center">3</td>
                                    <td className="border border-slate-300 p-2">Investment of Funds</td>
                                    <td className="border border-slate-300 p-2 text-center text-green-600 font-bold">YES</td>
                                    <td className="border border-slate-300 p-2">FDs in Co-op Bank</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-300 p-2 text-center">4</td>
                                    <td className="border border-slate-300 p-2">Register 'I' & 'J' maintained</td>
                                    <td className="border border-slate-300 p-2 text-center text-green-600 font-bold">YES</td>
                                    <td className="border border-slate-300 p-2">Updated till date</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-300 p-2 text-center">5</td>
                                    <td className="border border-slate-300 p-2">Previous Audit Rectification</td>
                                    <td className="border border-slate-300 p-2 text-center text-orange-500 font-bold">PENDING</td>
                                    <td className="border border-slate-300 p-2">Form O to be submitted</td>
                                </tr>
                            </tbody>
                        </table>
                     </div>

                     <div className="pt-8 flex justify-between">
                         <div className="text-center w-40 border-t border-slate-300 pt-2">
                             <p className="font-bold">Hon. Secretary</p>
                         </div>
                         <div className="text-center w-40 border-t border-slate-300 pt-2">
                             <p className="font-bold">Hon. Treasurer</p>
                         </div>
                         <div className="text-center w-40 border-t border-slate-300 pt-2">
                             <p className="font-bold">Auditor</p>
                         </div>
                     </div>
                 </div>
             )}

             {/* FORM O */}
             {activeTab === 'O_FORM' && (
                 <div className="space-y-6">
                     <p className="text-sm italic text-center mb-4">
                         [Under Section 82 and 87 of the Maharashtra Co-operative Societies Act, 1960]
                         <br/>
                         Report regarding Rectification of Defects pointed out by the Auditor
                     </p>
                     
                     <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead className="bg-slate-100 text-xs">
                            <tr>
                                <th className="border border-slate-300 p-3 w-16">Sr No</th>
                                <th className="border border-slate-300 p-3 w-32">Audit Para No.</th>
                                <th className="border border-slate-300 p-3">Objection / Remark in Audit Memo</th>
                                <th className="border border-slate-300 p-3">Explanation / Action Taken by Society</th>
                                <th className="border border-slate-300 p-3 w-40">Date of Rectification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Sample Rows for Template */}
                            <tr className="h-24 align-top">
                                <td className="border border-slate-300 p-2 text-center">1</td>
                                <td className="border border-slate-300 p-2 text-center">3(a)</td>
                                <td className="border border-slate-300 p-2">Fixed Asset Register not maintained.</td>
                                <td className="border border-slate-300 p-2">The register has now been purchased and updated with all assets including water pumps and lift equipment.</td>
                                <td className="border border-slate-300 p-2 text-center">10-Oct-2023</td>
                            </tr>
                            <tr className="h-24 align-top">
                                <td className="border border-slate-300 p-2 text-center">2</td>
                                <td className="border border-slate-300 p-2 text-center">5(b)</td>
                                <td className="border border-slate-300 p-2">Voucher No 105 missing signature of Treasurer.</td>
                                <td className="border border-slate-300 p-2">Signature obtained post-facto. Procedure tightened to ensure 2 signatories on all vouchers.</td>
                                <td className="border border-slate-300 p-2 text-center">12-Oct-2023</td>
                            </tr>
                            <tr className="h-24 align-top">
                                <td className="border border-slate-300 p-2 text-center">3</td>
                                <td className="border border-slate-300 p-2 text-center"></td>
                                <td className="border border-slate-300 p-2"></td>
                                <td className="border border-slate-300 p-2"></td>
                                <td className="border border-slate-300 p-2 text-center"></td>
                            </tr>
                            <tr className="h-24 align-top">
                                <td className="border border-slate-300 p-2 text-center">4</td>
                                <td className="border border-slate-300 p-2 text-center"></td>
                                <td className="border border-slate-300 p-2"></td>
                                <td className="border border-slate-300 p-2"></td>
                                <td className="border border-slate-300 p-2 text-center"></td>
                            </tr>
                        </tbody>
                     </table>

                     <div className="pt-8">
                         <p className="mb-8">We hereby certify that the defects pointed out by the Auditor have been rectified as above.</p>
                         <div className="flex justify-end gap-12">
                             <div className="text-center w-40 border-t border-slate-300 pt-2">
                                 <p className="font-bold">Hon. Secretary</p>
                             </div>
                             <div className="text-center w-40 border-t border-slate-300 pt-2">
                                 <p className="font-bold">Chairman</p>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default StatutoryRegisters;
