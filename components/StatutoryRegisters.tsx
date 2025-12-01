
import React, { useState } from 'react';
import { Resident, Society } from '../types';
import { Download, Book, FileText, UserCheck, Users } from 'lucide-react';

interface StatutoryRegistersProps {
  residents: Resident[];
  activeSociety: Society;
}

type RegisterType = 'I_REGISTER' | 'J_REGISTER' | 'SHARE_REGISTER' | 'NOMINATION_REGISTER';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const StatutoryRegisters: React.FC<StatutoryRegistersProps> = ({ residents, activeSociety }) => {
  const [activeTab, setActiveTab] = useState<RegisterType>('I_REGISTER');

  // Filter only owners for registers usually
  const members = residents.filter(r => r.occupancyType === 'Owner');

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Statutory Registers</h2>
           <p className="text-sm text-slate-500 mt-1">Official society records (I, J, Share, Nomination).</p>
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
              <UserCheck size={16} /> Nomination Register
          </button>
      </div>

       <div className="flex justify-end">
          <button 
            onClick={() => downloadPDF('register-container', `${activeTab}_${activeSociety.name}.pdf`)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 shadow-sm"
          >
              <Download size={18} /> Download Register
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
                <h2 className="text-lg font-bold mt-4 bg-slate-100 inline-block px-4 py-1 rounded border border-slate-300 uppercase">
                    {activeTab === 'I_REGISTER' ? 'Form I - Register of Members' : 
                     activeTab === 'J_REGISTER' ? 'Form J - List of Members' :
                     activeTab === 'SHARE_REGISTER' ? 'Share Register' :
                     'Nomination Register'}
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
         </div>
      </div>
    </div>
  );
};

export default StatutoryRegisters;
