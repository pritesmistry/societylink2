
import React, { useState, useMemo } from 'react';
import { Resident, Society, Bill, Expense, Income } from '../types';
import { Download, Book, FileText, UserCheck, Users, FileCheck, ClipboardCheck, ScrollText, Landmark, CalendarClock, Building, FolderOpen, Printer, Copy, Check, Briefcase, Shield, Archive } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface StatutoryRegistersProps {
  residents: Resident[];
  activeSociety: Society;
  bills?: Bill[];
  expenses?: Expense[];
  incomes?: Income[];
}

type RegisterType = 'I_REGISTER' | 'J_REGISTER' | 'SHARE_REGISTER' | 'NOMINATION_REGISTER' | 'AUDIT_REPORT' | 'O_FORM' | 'RULES_REGULATIONS' | 'INCOME_TAX' | 'DUE_DATES' | 'CONVEYANCE_DEED' | 'SOCIETY_FORMS' | 'FIXED_DEPOSIT' | 'IMPORTANT_DOCUMENTS' | 'INSURANCE';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const StatutoryRegisters: React.FC<StatutoryRegistersProps> = ({ residents, activeSociety, bills = [], expenses = [], incomes = [] }) => {
  const [activeTab, setActiveTab] = useState<RegisterType>('I_REGISTER');
  const [selectedFormIndex, setSelectedFormIndex] = useState(0);
  const [copiedForm, setCopiedForm] = useState(false);

  // Filter only owners for registers usually
  const members = residents.filter(r => r.occupancyType === 'Owner');

  // Basic Financial Summary for Audit Report
  const auditSummary = useMemo(() => {
      const totalIncome = bills.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
      const surplus = totalIncome - totalExpense;
      return { totalIncome, totalExpense, surplus };
  }, [bills, expenses]);

  // Income Tax Computation Logic
  const taxComputation = useMemo(() => {
      // 1. Income from Members (Maintenance) -> Exempt under Principle of Mutuality
      const incomeFromMembers = bills.reduce((sum, b) => sum + b.totalAmount, 0);

      // 2. Income from Other Sources (Interest, Rent, Ads) -> Generally Taxable
      // Note: Interest from Co-op banks is deductible u/s 80P(2)(d), but for simplicity we list it here.
      const incomeFromOtherSources = incomes.reduce((sum, i) => sum + i.amount, 0);

      const grossTotalIncome = incomeFromOtherSources; // Only non-member income is taxable base usually

      // Standard Deduction (Section 80P - Flat deduction for general societies is 50,000 or specific 100% for co-op interest)
      // We will assume a standard deduction placeholder
      const deductions = 50000; 

      const netTaxableIncome = Math.max(0, grossTotalIncome - deductions);
      
      // Tax Rate approx 30% for societies + Cess
      const taxLiability = netTaxableIncome * 0.312; 

      return {
          incomeFromMembers,
          incomeFromOtherSources,
          grossTotalIncome,
          deductions,
          netTaxableIncome,
          taxLiability
      };
  }, [bills, incomes]);

  const STATUTORY_DEADLINES = [
    {
        title: "Finalization of Accounts",
        date: "15th May",
        description: "Books of accounts for the previous financial year (ending 31st March) must be finalized and handed over for audit.",
        act: "MCS Act Rule 61"
    },
    {
        title: "Statutory Audit Completion",
        date: "31st July",
        description: "The Statutory Audit must be completed and the report must be submitted by the Auditor.",
        act: "Section 81"
    },
    {
        title: "Income Tax Return (ITR)",
        date: "31st July (Non-Audit) / 30th Sep (Audit)",
        description: "Filing of Income Tax Return (ITR-5). If Tax Audit is applicable (Turnover > 1Cr), due date is Sep 30.",
        act: "Income Tax Act 1961"
    },
    {
        title: "Audit Report Submission",
        date: "31st August",
        description: "Submission of Audit Report to the Registrar (online uploading on portal).",
        act: "MCS Act"
    },
    {
        title: "Annual General Meeting (AGM)",
        date: "30th September",
        description: "Holding of Annual General Meeting is mandatory within 6 months of FY end.",
        act: "Section 75(1)"
    },
    {
        title: "Mandatory Annual Returns",
        date: "30th September",
        description: "Filing of Annual Returns (Form O) with the Registrar of Societies.",
        act: "Section 79"
    },
    {
        title: "TDS Returns (Quarterly)",
        date: "Quarterly (31st Jul/Oct/Jan/May)",
        description: "Filing of quarterly TDS returns (Form 24Q/26Q).",
        act: "Income Tax Act"
    }
  ];

  const SOCIETY_RULES = [
    {
        section: "1. General Discipline",
        rules: [
            "Members must ensure that their conduct does not cause nuisance, annoyance, or inconvenience to other residents.",
            "Loud music, shouting, or noise is strictly prohibited after 10:00 PM.",
            "Smoking and consumption of alcohol in common areas (terrace, garden, lobby) is strictly prohibited.",
            "Main gates and common doors must be kept closed for security reasons."
        ]
    },
    {
        section: "2. Parking Regulations",
        rules: [
            "Vehicles must be parked strictly in the allotted spaces only.",
            "Visitors' vehicles must be parked in the designated visitor parking area only.",
            "Vehicles should not obstruct the movement of other vehicles or emergency services.",
            "Washing of cars is permitted only in designated areas to avoid water stagnation."
        ]
    },
    {
        section: "3. Garbage Disposal",
        rules: [
            "Wet and dry waste must be segregated as per municipal guidelines.",
            "Garbage bags must be tied properly to prevent spillage and odor.",
            "Garbage must be kept outside the door only during specified collection timings.",
            "Construction debris, furniture, or e-waste must be removed by the member at their own cost."
        ]
    },
    {
        section: "4. Renovation & Interior Work",
        rules: [
            "Prior written permission from the Managing Committee is required for any internal structural changes.",
            "Work is permitted only between 9:00 AM and 6:00 PM on weekdays and Saturdays.",
            "No heavy work causing noise (drilling, hammering) is allowed on Sundays and Public Holidays.",
            "Workers must carry ID cards issued by the society."
        ]
    },
    {
        section: "5. Pet Policy",
        rules: [
            "Pets must be kept on a leash at all times in common areas.",
            "Pet owners are responsible for cleaning up after their pets immediately.",
            "Pets should not cause excessive noise or disturbance to neighbors.",
            "Pets are not allowed in the children's play area, swimming pool, or gym."
        ]
    },
    {
        section: "6. Maintenance Charges",
        rules: [
            "Maintenance bills must be paid by the due date to avoid interest/penalty.",
            "Non-payment of dues for more than 3 months may attract legal action and disconnection of essential services as per Bye-laws.",
            "Service charges are applicable equally to all flats, irrespective of size or usage."
        ]
    },
    {
        section: "7. Sub-letting / Tenancy",
        rules: [
            "Members must intimate the society 8 days before sub-letting the flat.",
            "A copy of the registered Leave & License agreement and Police Verification must be submitted.",
            "Non-occupancy charges will be applicable as per the Bye-laws (limited to 10% of service charges)."
        ]
    }
  ];

  const CONVEYANCE_STEPS = [
    { id: 1, title: 'GBM Resolution', status: 'Completed', date: '15-Aug-2023', desc: 'Resolution passed to apply for Deemed Conveyance.' },
    { id: 2, title: 'Document Collection', status: 'In Progress', date: '', desc: 'Collecting 7/12 extracts, Index-II, and other papers.' },
    { id: 3, title: 'Online Application', status: 'Pending', date: '', desc: 'Submission of proposal on Mahasahakar website.' },
    { id: 4, title: 'Hearing @ DDR', status: 'Pending', date: '', desc: 'Hearing before District Deputy Registrar.' },
    { id: 5, title: 'Deemed Conveyance Order', status: 'Pending', date: '', desc: 'Issuance of order and certificate by DDR.' },
    { id: 6, title: 'Adjudication', status: 'Pending', date: '', desc: 'Payment of Stamp Duty on the Conveyance Deed.' },
    { id: 7, title: 'Registration', status: 'Pending', date: '', desc: 'Registration of Deed at Sub-Registrar Office.' },
    { id: 8, title: 'Property Card Update', status: 'Pending', date: '', desc: 'Final name change in City Survey / 7-12 records.' },
  ];

  const REQUIRED_DOCUMENTS = [
    "Society Registration Certificate",
    "List of Members",
    "7/12 Extract and Village Form 6 (Mutation Entry)",
    "Plot Layout Copy (Approved)",
    "Commencement Certificate (CC)",
    "Occupation Certificate (OC)",
    "Index-II of all members",
    "Development Agreement Copy",
    "Architect Certificate regarding area",
    "Search Report of last 30 years"
  ];

  const FIXED_DEPOSITS = [
      { id: 1, bank: 'District Co-op Bank', fdrNo: 'FDR/2023/001', amount: 500000, rate: 7.5, date: '2023-01-15', maturity: '2024-01-15', status: 'Active' },
      { id: 2, bank: 'State Bank of India', fdrNo: 'SBI/FD/8899', amount: 200000, rate: 6.8, date: '2023-06-01', maturity: '2024-06-01', status: 'Active' },
      { id: 3, bank: 'HDFC Bank', fdrNo: 'HDFC/RN/556', amount: 150000, rate: 7.0, date: '2022-05-10', maturity: '2023-05-10', status: 'Matured' },
  ];

  const IMPORTANT_DOCUMENTS_LIST = [
      { id: 1, name: 'Registration Certificate', refNo: 'REG/2005/123', location: 'File A-1 (Locker)', date: '2005-06-15' },
      { id: 2, name: 'Original Plot Conveyance', refNo: 'DOC-998', location: 'Bank Locker', date: '2010-02-20' },
      { id: 3, name: 'BMC Approved Plans', refNo: 'PLAN-77', location: 'File B-3 (Office)', date: '2004-11-10' },
      { id: 4, name: 'Occupation Certificate (OC)', refNo: 'OC-221', location: 'File A-1 (Locker)', date: '2006-01-05' },
      { id: 5, name: 'Lift License', refNo: 'LIFT/23', location: 'File C-2 (Office)', date: '2023-04-01' },
  ];

  const INSURANCE_POLICIES = [
      { id: 1, type: 'Fire & Perils', provider: 'New India Assurance', policyNo: 'NIA/FIRE/23-24/001', sumInsured: 50000000, premium: 12500, expiry: '2024-03-31' },
      { id: 2, type: 'Public Liability', provider: 'ICICI Lombard', policyNo: 'IPL/PL/9988', sumInsured: 1000000, premium: 3500, expiry: '2024-05-15' },
      { id: 3, type: 'Director & Officer', provider: 'HDFC Ergo', policyNo: 'HE/DO/7766', sumInsured: 500000, premium: 5000, expiry: '2024-08-01' },
  ];

  const SOCIETY_FORMS_DATA = [
      {
          title: "Membership Application (Form 3)",
          description: "For new members to apply for membership in the society.",
          content: `FORM NO. 3
[Under Bye-law No. 19(A)(V)]

APPLICATION FOR MEMBERSHIP OF THE SOCIETY

To,
The Hon. Secretary,
${activeSociety.name}
${activeSociety.address}

Sir,

1. I, Shri/Smt [APPLICANT_NAME], hereby apply for membership of the [SOCIETY_NAME] Co-operative Housing Society Ltd.

2. I intend to purchase/hold the Flat No. [FLAT_NO] in the said society.

3. I have paid the entrance fee of Rs. 100/- and Share Capital of Rs. 500/-.

4. I agree to abide by the Bye-laws of the society and the amendments made therein from time to time.

5. I declare that I do not hold any other flat in this city in the area of operation of the society in my name or in the name of any member of my family.

6. The particulars furnished by me are true to the best of my knowledge and belief.

Yours faithfully,

(Signature of Applicant)
Place: _____________
Date: _____________`
      },
      {
          title: "Associate Membership (Form 5)",
          description: "For adding a joint holder (Associate Member) to a flat.",
          content: `FORM NO. 5
[Under Bye-law No. 19(B)]

APPLICATION FOR ASSOCIATE MEMBERSHIP

To,
The Hon. Secretary,
${activeSociety.name}
${activeSociety.address}

Sir,

I, Shri/Smt [ASSOCIATE_NAME], wish to be an Associate Member of the Society with Shri/Smt [ORIGINAL_MEMBER_NAME], who is a member of the society holding Flat No. [FLAT_NO].

I have no objection to the said member holding the shares and interest in the capital/property of the society.

I agree to abide by the Bye-laws of the society.

I am remitting herewith the entrance fee of Rs. 100/-.

Yours faithfully,

(Signature of Associate Member)

----------------------------------------------------

CONSENT OF THE ORIGINAL MEMBER

I, [ORIGINAL_MEMBER_NAME], a member of the society, recommend the application of Shri/Smt [ASSOCIATE_NAME] for Associate Membership.

(Signature of Original Member)
Date: _____________`
      },
      {
          title: "Nomination Form (Form 14)",
          description: "To nominate a person to inherit shares/interest after death.",
          content: `FORM NO. 14
[Under Bye-law No. 32]

FORM OF NOMINATION

To,
The Hon. Secretary,
${activeSociety.name}
${activeSociety.address}

Sir,

I, Shri/Smt [MEMBER_NAME], member of the society holding Flat No. [FLAT_NO] and Share Certificate No. [SHARE_CERT_NO], hereby nominate the person(s) mentioned below to whom my share and interest in the capital/property of the society shall be transferred in the event of my death.

1. Name of Nominee: _______________________________
   Relationship: ___________________________________
   Percentage of Share: ____________________________
   Address: ________________________________________

2. Name of Nominee: _______________________________
   Relationship: ___________________________________
   Percentage of Share: ____________________________
   Address: ________________________________________

Place: _____________
Date: _____________

(Signature of Member)

Witness 1: ________________ (Signature)
Witness 2: ________________ (Signature)`
      },
      {
          title: "Resignation / Termination (Form 21)",
          description: "Notice of resignation from membership of the society.",
          content: `FORM NO. 21
[Under Bye-law No. 27(a)]

LETTER OF RESIGNATION

To,
The Hon. Secretary,
${activeSociety.name}
${activeSociety.address}

Sir,

I, Shri/Smt [MEMBER_NAME], member of the society holding Flat No. [FLAT_NO], hereby give notice of my resignation from the membership of the society.

1. I have sold/transferred my flat to Shri/Smt [BUYER_NAME].
2. I request you to transfer my shares and interest in the capital/property of the society to the said transferee.
3. I declare that there are no dues pending against me payable to the society.
4. Please return my Share Certificate duly endorsed in the name of the transferee.

Thanking you,

Yours faithfully,

(Signature of Member)
Place: _____________
Date: _____________`
      },
      {
          title: "No Objection Certificate (NOC)",
          description: "Application for NOC to sell/transfer or mortgage flat.",
          content: `APPLICATION FOR NOC

To,
The Hon. Secretary,
${activeSociety.name}
${activeSociety.address}

Sub: Application for No Objection Certificate (NOC)

Sir,

I am the owner of Flat No. [FLAT_NO] in the society.

I intend to [SELL / MORTGAGE / RENT] my flat to Mr./Ms. [NAME_OF_PARTY].

I request the society to issue a No Objection Certificate (NOC) for the same. I confirm that I have paid all the dues of the society till date.

I enclose herewith:
1. Copy of Sale/Lease Agreement (Draft)
2. Copy of Loan Sanction Letter (if applicable)

Kindly issue the NOC at the earliest.

Yours faithfully,

(Signature of Member)
[MEMBER_NAME]
Date: _____________`
      }
  ];

  const handleCopyForm = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedForm(true);
      setTimeout(() => setCopiedForm(false), 2000);
  };

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.remove('shadow-xl');

    const opt = {
      margin:       0.3,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: (activeTab === 'RULES_REGULATIONS' || activeTab === 'INCOME_TAX' || activeTab === 'DUE_DATES' || activeTab === 'CONVEYANCE_DEED' || activeTab === 'SOCIETY_FORMS' || activeTab === 'IMPORTANT_DOCUMENTS' || activeTab === 'FIXED_DEPOSIT' || activeTab === 'INSURANCE') ? 'portrait' : 'landscape' }
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
           <h2 className="text-xl font-semibold text-slate-800">Statutory Registers & Compliance</h2>
           <p className="text-sm text-slate-500 mt-1">Official society records, Audit reports, and Tax filings.</p>
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
            onClick={() => setActiveTab('RULES_REGULATIONS')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'RULES_REGULATIONS' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <ScrollText size={16} /> Rules & Regulations
          </button>
          <button 
            onClick={() => setActiveTab('SOCIETY_FORMS')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'SOCIETY_FORMS' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <FolderOpen size={16} /> Society Forms
          </button>
          <button 
            onClick={() => setActiveTab('FIXED_DEPOSIT')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'FIXED_DEPOSIT' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Briefcase size={16} /> Fixed Deposit
          </button>
          <button 
            onClick={() => setActiveTab('IMPORTANT_DOCUMENTS')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'IMPORTANT_DOCUMENTS' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Archive size={16} /> Important Docs
          </button>
          <button 
            onClick={() => setActiveTab('INSURANCE')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'INSURANCE' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Shield size={16} /> Insurance
          </button>
          <button 
            onClick={() => setActiveTab('CONVEYANCE_DEED')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'CONVEYANCE_DEED' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Building size={16} /> Conveyance Deed
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
          <button 
            onClick={() => setActiveTab('INCOME_TAX')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'INCOME_TAX' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <Landmark size={16} /> Income Tax
          </button>
          <button 
            onClick={() => setActiveTab('DUE_DATES')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'DUE_DATES' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
              <CalendarClock size={16} /> Due Dates
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
            className={`bg-white p-[10mm] shadow-xl text-slate-800 ${activeTab === 'RULES_REGULATIONS' || activeTab === 'INCOME_TAX' || activeTab === 'DUE_DATES' || activeTab === 'CONVEYANCE_DEED' || activeTab === 'SOCIETY_FORMS' || activeTab === 'FIXED_DEPOSIT' || activeTab === 'IMPORTANT_DOCUMENTS' || activeTab === 'INSURANCE' ? 'w-[210mm]' : 'w-[297mm]'} min-h-[297mm]`}
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
                     activeTab === 'RULES_REGULATIONS' ? 'Society Rules & Regulations' :
                     activeTab === 'AUDIT_REPORT' ? 'Statutory Audit Report (Draft)' :
                     activeTab === 'INCOME_TAX' ? 'Income Tax Compliance Report' :
                     activeTab === 'DUE_DATES' ? 'Statutory Compliance Calendar' :
                     activeTab === 'CONVEYANCE_DEED' ? 'Conveyance Deed Status Tracker' :
                     activeTab === 'SOCIETY_FORMS' ? 'Standard Society Statutory Forms' :
                     activeTab === 'FIXED_DEPOSIT' ? 'Fixed Deposit Register' :
                     activeTab === 'IMPORTANT_DOCUMENTS' ? 'Important Documents Register' :
                     activeTab === 'INSURANCE' ? 'Insurance Policy Register' :
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

             {/* FIXED DEPOSIT REGISTER */}
             {activeTab === 'FIXED_DEPOSIT' && (
                 <table className="w-full text-sm border-collapse border border-slate-300">
                     <thead className="bg-slate-100 text-xs">
                         <tr>
                             <th className="border border-slate-300 p-2">Sr No</th>
                             <th className="border border-slate-300 p-2 text-left">Bank / Institution</th>
                             <th className="border border-slate-300 p-2 text-left">FDR Receipt No</th>
                             <th className="border border-slate-300 p-2 text-center">Date of Deposit</th>
                             <th className="border border-slate-300 p-2 text-center">Maturity Date</th>
                             <th className="border border-slate-300 p-2 text-center">Int. Rate (%)</th>
                             <th className="border border-slate-300 p-2 text-right">Principal Amount (₹)</th>
                             <th className="border border-slate-300 p-2 text-center">Status</th>
                         </tr>
                     </thead>
                     <tbody>
                         {FIXED_DEPOSITS.map((fd, idx) => (
                             <tr key={fd.id}>
                                 <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                                 <td className="border border-slate-300 p-2 font-medium">{fd.bank}</td>
                                 <td className="border border-slate-300 p-2 font-mono text-xs">{fd.fdrNo}</td>
                                 <td className="border border-slate-300 p-2 text-center">{fd.date}</td>
                                 <td className="border border-slate-300 p-2 text-center">{fd.maturity}</td>
                                 <td className="border border-slate-300 p-2 text-center">{fd.rate}%</td>
                                 <td className="border border-slate-300 p-2 text-right font-bold">{fd.amount.toLocaleString()}</td>
                                 <td className={`border border-slate-300 p-2 text-center text-xs font-bold ${fd.status === 'Active' ? 'text-green-600' : 'text-slate-400'}`}>
                                     {fd.status.toUpperCase()}
                                 </td>
                             </tr>
                         ))}
                         <tr className="bg-slate-50 font-bold">
                             <td colSpan={6} className="border border-slate-300 p-2 text-right">Total Deposits</td>
                             <td className="border border-slate-300 p-2 text-right">
                                 {FIXED_DEPOSITS.filter(f => f.status === 'Active').reduce((s, f) => s + f.amount, 0).toLocaleString()}
                             </td>
                             <td className="border border-slate-300 p-2"></td>
                         </tr>
                     </tbody>
                 </table>
             )}

             {/* IMPORTANT DOCUMENTS REGISTER */}
             {activeTab === 'IMPORTANT_DOCUMENTS' && (
                 <table className="w-full text-sm border-collapse border border-slate-300">
                     <thead className="bg-slate-100 text-xs">
                         <tr>
                             <th className="border border-slate-300 p-2">Sr No</th>
                             <th className="border border-slate-300 p-2 text-left">Document Name / Title</th>
                             <th className="border border-slate-300 p-2 text-left">Reference No / ID</th>
                             <th className="border border-slate-300 p-2 text-center">Date of Document</th>
                             <th className="border border-slate-300 p-2 text-left">Physical Location</th>
                             <th className="border border-slate-300 p-2 text-center">Check</th>
                         </tr>
                     </thead>
                     <tbody>
                         {IMPORTANT_DOCUMENTS_LIST.map((doc, idx) => (
                             <tr key={doc.id}>
                                 <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                                 <td className="border border-slate-300 p-2 font-medium">{doc.name}</td>
                                 <td className="border border-slate-300 p-2 font-mono text-xs">{doc.refNo}</td>
                                 <td className="border border-slate-300 p-2 text-center">{doc.date}</td>
                                 <td className="border border-slate-300 p-2 text-indigo-700 bg-indigo-50/30">{doc.location}</td>
                                 <td className="border border-slate-300 p-2 text-center text-green-600">Available</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             )}

             {/* INSURANCE REGISTER */}
             {activeTab === 'INSURANCE' && (
                 <table className="w-full text-sm border-collapse border border-slate-300">
                     <thead className="bg-slate-100 text-xs">
                         <tr>
                             <th className="border border-slate-300 p-2">Sr No</th>
                             <th className="border border-slate-300 p-2 text-left">Insurance Company</th>
                             <th className="border border-slate-300 p-2 text-left">Type of Policy</th>
                             <th className="border border-slate-300 p-2 text-left">Policy No</th>
                             <th className="border border-slate-300 p-2 text-right">Sum Insured (₹)</th>
                             <th className="border border-slate-300 p-2 text-right">Premium Paid (₹)</th>
                             <th className="border border-slate-300 p-2 text-center">Expiry Date</th>
                         </tr>
                     </thead>
                     <tbody>
                         {INSURANCE_POLICIES.map((pol, idx) => (
                             <tr key={pol.id}>
                                 <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                                 <td className="border border-slate-300 p-2">{pol.provider}</td>
                                 <td className="border border-slate-300 p-2 font-medium">{pol.type}</td>
                                 <td className="border border-slate-300 p-2 font-mono text-xs">{pol.policyNo}</td>
                                 <td className="border border-slate-300 p-2 text-right">{pol.sumInsured.toLocaleString()}</td>
                                 <td className="border border-slate-300 p-2 text-right">{pol.premium.toLocaleString()}</td>
                                 <td className="border border-slate-300 p-2 text-center text-red-600 font-bold">{pol.expiry}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             )}

             {/* RULES AND REGULATIONS */}
             {activeTab === 'RULES_REGULATIONS' && (
                 <div className="space-y-6">
                    <p className="text-sm italic text-center text-slate-500 mb-6">
                        These rules and regulations are approved by the Managing Committee and are binding on all members, residents, and visitors of the society.
                    </p>

                    {SOCIETY_RULES.map((section, idx) => (
                        <div key={idx} className="mb-6 break-inside-avoid">
                            <h3 className="font-bold text-slate-800 text-lg mb-2 border-b-2 border-slate-200 pb-1 flex items-center gap-2">
                                {section.section}
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {section.rules.map((rule, rIdx) => (
                                    <li key={rIdx} className="text-sm text-slate-700 leading-relaxed pl-1">
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="pt-8 mt-8 border-t border-slate-300 flex justify-between">
                         <div className="text-center w-40">
                             <div className="h-10 border-b border-slate-400"></div>
                             <p className="font-bold mt-1">Hon. Secretary</p>
                         </div>
                         <div className="text-center w-40">
                             <div className="h-10 border-b border-slate-400"></div>
                             <p className="font-bold mt-1">Chairman</p>
                         </div>
                     </div>
                 </div>
             )}

             {/* STATUTORY DUE DATES */}
             {activeTab === 'DUE_DATES' && (
                 <div className="space-y-6">
                     <p className="text-sm text-center text-slate-600 mb-6">
                         Mandatory compliance deadlines for Housing Societies under the MCS Act and Income Tax Act.
                     </p>
                     
                     <div className="grid grid-cols-1 gap-4">
                         {STATUTORY_DEADLINES.map((item, idx) => (
                             <div key={idx} className="flex border border-slate-200 rounded-lg overflow-hidden break-inside-avoid">
                                 <div className="w-32 bg-slate-100 flex flex-col items-center justify-center p-4 border-r border-slate-200">
                                     <span className="text-indigo-600 font-bold text-center leading-tight">{item.date}</span>
                                 </div>
                                 <div className="flex-1 p-4">
                                     <div className="flex justify-between items-start mb-1">
                                         <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                                         <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                             {item.act}
                                         </span>
                                     </div>
                                     <p className="text-sm text-slate-600">{item.description}</p>
                                 </div>
                             </div>
                         ))}
                     </div>

                     <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mt-8 text-sm text-indigo-800 break-inside-avoid">
                         <strong>Important Note:</strong> The Managing Committee is responsible for adhering to these dates. Failure to comply may attract penalties from the Registrar or Income Tax Department.
                     </div>
                 </div>
             )}

             {/* CONVEYANCE DEED */}
             {activeTab === 'CONVEYANCE_DEED' && (
                 <div className="space-y-6">
                    <div className="border border-slate-200 rounded p-4 bg-slate-50">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Property Details (Land Records)</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold">Land Survey No / CTS No</p>
                                <p className="font-bold text-slate-800">123 / 456A (Placeholder)</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold">Plot Area</p>
                                <p className="font-bold text-slate-800">2,500 Sq. Mtrs (Placeholder)</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold">Taluka / District</p>
                                <p className="font-bold text-slate-800">Andheri / Mumbai Suburban</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold">Original Land Owner</p>
                                <p className="font-bold text-slate-800">M/s Builders & Developers Ltd</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Status Tracker */}
                        <div>
                            <h3 className="font-bold text-slate-800 mb-3 text-lg">Process Status Tracker</h3>
                            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                                {CONVEYANCE_STEPS.map((step, idx) => (
                                    <div key={idx} className="ml-6 relative">
                                        <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${
                                            step.status === 'Completed' ? 'bg-green-500 border-green-500' :
                                            step.status === 'In Progress' ? 'bg-blue-500 border-blue-500' :
                                            'bg-white border-slate-300'
                                        }`}></div>
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold text-sm ${
                                                step.status === 'Completed' ? 'text-green-700' :
                                                step.status === 'In Progress' ? 'text-blue-700' : 'text-slate-400'
                                            }`}>{step.title}</h4>
                                            {step.date && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{step.date}</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Document Checklist */}
                        <div>
                            <h3 className="font-bold text-slate-800 mb-3 text-lg">Document Checklist</h3>
                            <div className="space-y-2">
                                {REQUIRED_DOCUMENTS.map((doc, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                                        <div className="mt-0.5 w-4 h-4 border-2 border-slate-300 rounded flex items-center justify-center shrink-0">
                                            {/* Simulate checked state visually for first 2 items */}
                                            {idx < 2 && <div className="w-2 h-2 bg-green-500 rounded-sm"></div>}
                                        </div>
                                        <span className="text-sm text-slate-700">{doc}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100">
                                Note: Deemed Conveyance application requires collecting all these documents. Legal consultation is recommended.
                            </div>
                        </div>
                    </div>
                 </div>
             )}

             {/* SOCIETY FORMS */}
             {activeTab === 'SOCIETY_FORMS' && (
                 <div className="h-full flex flex-col md:flex-row gap-6 break-inside-avoid">
                     {/* Sidebar List of Forms */}
                     <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-4 rounded-lg print:hidden">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FolderOpen size={18} /> Available Forms
                         </h3>
                         <div className="space-y-2">
                             {SOCIETY_FORMS_DATA.map((form, idx) => (
                                 <button
                                    key={idx}
                                    onClick={() => setSelectedFormIndex(idx)}
                                    className={`w-full text-left p-3 rounded-lg text-sm border transition-all ${
                                        selectedFormIndex === idx 
                                        ? 'bg-white border-indigo-500 shadow-md text-indigo-700 font-bold' 
                                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                                    }`}
                                 >
                                     <div className="flex justify-between items-center mb-1">
                                         <span>{form.title}</span>
                                     </div>
                                     <p className="text-xs text-slate-400 font-normal">{form.description}</p>
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Form Preview Area */}
                     <div className="w-full md:w-2/3">
                         <div className="flex justify-between items-center mb-4 print:hidden">
                             <h3 className="font-bold text-slate-800 text-lg">Form Preview</h3>
                             <div className="flex gap-2">
                                 <button 
                                    onClick={() => handleCopyForm(SOCIETY_FORMS_DATA[selectedFormIndex].content)}
                                    className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 border transition-colors ${copiedForm ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                 >
                                     {copiedForm ? <Check size={14} /> : <Copy size={14} />} {copiedForm ? 'Copied' : 'Copy Text'}
                                 </button>
                                 <button 
                                    onClick={() => window.print()}
                                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-indigo-700"
                                 >
                                     <Printer size={14} /> Print Form
                                 </button>
                             </div>
                         </div>
                         
                         <div className="border border-slate-300 p-8 rounded-lg bg-white shadow-sm min-h-[500px]">
                            <pre className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-sm">
                                {SOCIETY_FORMS_DATA[selectedFormIndex].content}
                            </pre>
                         </div>
                     </div>
                 </div>
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

             {/* INCOME TAX */}
             {activeTab === 'INCOME_TAX' && (
                 <div className="space-y-6">
                    <div className="border border-slate-200 rounded p-4 bg-slate-50 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase">Society PAN</p>
                            <p className="text-xl font-bold font-mono text-slate-800">ABCDE1234F</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase">TAN</p>
                            <p className="text-xl font-bold font-mono text-slate-800">MUM123456</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase">Status</p>
                            <p className="text-lg font-bold text-slate-800">AOP (Co-operative Society)</p>
                        </div>
                        <div>
                             <p className="text-sm font-bold text-slate-500 uppercase">FY / AY</p>
                             <p className="text-lg font-bold text-slate-800">2023-24 / 2024-25</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-slate-800 mb-2 border-b-2 border-slate-800 pb-1">Provisional Computation of Income</h3>
                            <table className="w-full text-sm border-collapse border border-slate-300">
                                <tbody>
                                    <tr>
                                        <td className="p-2 border border-slate-300 bg-slate-50 font-bold" colSpan={2}>I. Income from Business/Profession</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 border border-slate-300 pl-4">Contribution from Members (Exempt - Mutuality)</td>
                                        <td className="p-2 border border-slate-300 text-right text-slate-500">
                                            ({taxComputation.incomeFromMembers.toLocaleString()})
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 border border-slate-300 pl-4 font-bold">Net Business Income</td>
                                        <td className="p-2 border border-slate-300 text-right font-bold">NIL</td>
                                    </tr>
                                    
                                    <tr>
                                        <td className="p-2 border border-slate-300 bg-slate-50 font-bold" colSpan={2}>II. Income from Other Sources</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 border border-slate-300 pl-4">Interest / Rent / Other Non-member receipts</td>
                                        <td className="p-2 border border-slate-300 text-right">
                                            {taxComputation.incomeFromOtherSources.toLocaleString()}
                                        </td>
                                    </tr>
                                    
                                    <tr className="bg-slate-100">
                                        <td className="p-2 border border-slate-300 font-bold">Gross Total Income (I + II)</td>
                                        <td className="p-2 border border-slate-300 text-right font-bold">
                                            {taxComputation.grossTotalIncome.toLocaleString()}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td className="p-2 border border-slate-300 pl-4">Less: Deduction u/s 80P (Standard/Specific)</td>
                                        <td className="p-2 border border-slate-300 text-right text-red-600">
                                            -{taxComputation.deductions.toLocaleString()}
                                        </td>
                                    </tr>

                                    <tr className="bg-slate-200">
                                        <td className="p-2 border border-slate-300 font-bold">NET TAXABLE INCOME</td>
                                        <td className="p-2 border border-slate-300 text-right font-bold text-lg">
                                            {taxComputation.netTaxableIncome.toLocaleString()}
                                        </td>
                                    </tr>
                                     
                                     <tr>
                                        <td className="p-2 border border-slate-300 font-bold">Tax Payable (Approx @ 30% + Cess)</td>
                                        <td className="p-2 border border-slate-300 text-right font-bold text-lg text-red-700">
                                            {taxComputation.taxLiability.toFixed(0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div>
                             <h3 className="font-bold text-slate-800 mb-2 border-b-2 border-slate-800 pb-1">Compliance Checklist</h3>
                             <div className="space-y-4">
                                <div className="p-4 bg-white border border-slate-200 shadow-sm rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-700">TDS Return (Quarterly)</span>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Q2 Filed</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Due Date for Q3: 31st Jan 2024</p>
                                    <div className="w-full bg-slate-200 h-2 rounded-full mt-2">
                                        <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-white border border-slate-200 shadow-sm rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-700">Income Tax Return (ITR-5)</span>
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Due Sep 30</span>
                                    </div>
                                    <p className="text-xs text-slate-500">FY 2023-24 Return filing is pending.</p>
                                </div>

                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded text-sm text-indigo-800">
                                    <strong>Note on Mutuality:</strong> Contribution from members (Transfer fees, Maintenance) is exempt based on the "Concept of Mutuality". Income earned from third parties (Interest from Nationalized Banks, Rental from Mobile Towers) is fully taxable.
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="pt-8 flex justify-between">
                         <div className="text-center w-40 border-t border-slate-300 pt-2">
                             <p className="font-bold">Hon. Secretary</p>
                         </div>
                         <div className="text-center w-40 border-t border-slate-300 pt-2">
                             <p className="font-bold">Hon. Treasurer</p>
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
