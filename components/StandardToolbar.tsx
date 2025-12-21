
import React, { useState, useEffect } from 'react';
import { 
  Save, Pencil, Search, Calculator, Calendar, Bell, CircleHelp, 
  Printer, FileText, ChevronLeft, ChevronRight, X, CalendarRange,
  Copy, Check, MessageCircle, FileSpreadsheet, FileText as FileIcon, FilePenLine,
  Trash2, PlusCircle, Share2, DownloadCloud, Keyboard, Scale, Lightbulb,
  Wallet, Landmark
} from 'lucide-react';

interface StandardToolbarProps {
  onNew?: () => void;
  onSave?: () => void;
  onModify?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onPrint?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onPeriodChange?: (startDate: string, endDate: string) => void;
  className?: string;
  balances?: { cash: number; bank: number };
}

const STANDARD_DESCRIPTIONS = {
    'Expenses': [
        "Being amount paid towards electricity charges for the month of...",
        "Being housekeeping charges paid to [Vendor] for the month of...",
        "Being security services charges paid for the month of...",
        "Being amount paid for water tanker charges vide Bill No...",
        "Being amount paid for lift maintenance AMC charges...",
        "Being reimbursement of petty cash expenses...",
        "Being audit fees paid for the financial year...",
        "Being amount paid for diesel purchase for DG set...",
        "Being repairs and maintenance charges paid for..."
    ],
    'Receipts (Income)': [
        "Being maintenance charges received for the period...",
        "Being transfer fees received from member...",
        "Being interest received on Fixed Deposit...",
        "Being rent received for mobile tower / hoarding...",
        "Being donation received for festival celebration...",
        "Being penalty charges received for late payment...",
        "Being hall booking charges received from..."
    ],
    'Billing & Journal': [
        "Being monthly maintenance bill raised for the month of...",
        "Being provision made for expenses payable...",
        "Being interest charged on arrears...",
        "Being sinking fund contribution charged...",
        "Being rectification entry passed for...",
        "Being depreciation charged on assets for the year..."
    ],
    'General': [
        "Being cash deposited into bank...",
        "Being cash withdrawn from bank for petty cash...",
        "Being amount transferred to Fixed Deposit...",
        "Being TDS deducted on payment to..."
    ]
};

const IMPORTANT_BYE_LAWS = [
    {
        category: "I. Membership & Charges",
        rules: [
            { title: "Service Charges", content: "Service charges shall be shared equally by all members, irrespective of the size of the flat." },
            { title: "Sinking Fund", content: "Contribution to the Sinking Fund shall be at the rate decided by the General Body, subject to a minimum of 0.25% per annum of the construction cost of each flat." },
            { title: "Non-Occupancy Charges", content: "Non-occupancy charges shall not exceed 10% of the service charges (excluding municipal taxes)." },
            { title: "Interest on Arrears", content: "Simple interest not exceeding 21% per annum may be levied on outstanding dues." }
        ]
    },
    {
        category: "II. Parking Rules",
        rules: [
            { title: "Allotment", content: "Parking spaces may be allotted by the committee on a first-come-first-served basis or by rotation if space is scarce." },
            { title: "Tenants", content: "If a member has rented out their flat, the tenant has the right to use the parking space allotted to that member." },
            { title: "Stickers", content: "All vehicles parked inside society premises must display a valid society sticker." }
        ]
    },
    {
        category: "III. Repairs & Renovations",
        rules: [
            { title: "Permission", content: "Members must obtain prior written permission from the Committee for any internal structural changes." },
            { title: "Timings", content: "Renovation work causing noise is permitted only between 9:00 AM and 6:00 PM. No work is allowed on Sundays and Public Holidays." },
            { title: "Debris", content: "It is the responsibility of the member to dispose of renovation debris outside the society premises at their own cost." }
        ]
    }
];

const SOCIETY_TIPS = [
    { title: "Nominee ≠ Owner", content: "A nominee is merely a trustee. Legal heirship depends on the Will or Succession laws." },
    { title: "Leakage Responsibility", content: "External walls/terrace are society's duty. Internal plumbing is member's responsibility." },
    { title: "Non-Occupancy Limit", content: "Societies cannot charge more than 10% of service charges as non-occupancy fees." }
];

const StandardToolbar: React.FC<StandardToolbarProps> = ({ 
  onNew, onSave, onModify, onDelete, onSearch, onPrint, onPrev, onNext, onPeriodChange, className, balances
}) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);
  const [showStdDesc, setShowStdDesc] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showByeLaws, setShowByeLaws] = useState(false);
  const [showTips, setShowTips] = useState(false);
  
  const [calcInput, setCalcInput] = useState('');
  const [copiedDescIndex, setCopiedDescIndex] = useState<string | null>(null);
  const [selectedLawCategory, setSelectedLawCategory] = useState<string>(IMPORTANT_BYE_LAWS[0].category);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  useEffect(() => {
    setCurrentTipIndex(Math.floor(Math.random() * SOCIETY_TIPS.length));
  }, []);

  const [reminderList, setReminderList] = useState<{id: number, text: string, date: string}[]>([
      { id: 1, text: 'Submit Monthly TDS Return', date: new Date().toISOString().split('T')[0] },
      { id: 2, text: 'Renew Lift AMC', date: '2023-11-01' }
  ]);
  const [newReminder, setNewReminder] = useState({ text: '', date: '' });

  const [waNumber, setWaNumber] = useState('');
  const [waMessage, setWaMessage] = useState('Here is the requested document from SocietyLink.');

  const [period, setPeriod] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  
  const [calDate, setCalDate] = useState(new Date());

  const handleCalc = (val: string) => {
      if (val === '=') {
          try {
              setCalcInput(eval(calcInput).toString());
          } catch {
              setCalcInput('Error');
          }
      } else if (val === 'C') {
          setCalcInput('');
      } else {
          setCalcInput(prev => prev + val);
      }
  };

  const handlePeriodApply = () => {
      if (onPeriodChange) {
          onPeriodChange(period.from, period.to);
      }
      setShowPeriod(false);
  };

  const handleCopyDesc = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedDescIndex(id);
      setTimeout(() => setCopiedDescIndex(null), 1500);
  };

  const addReminder = () => {
      if (newReminder.text) {
          setReminderList([...reminderList, { id: Date.now(), text: newReminder.text, date: newReminder.date || 'No Date' }]);
          setNewReminder({ text: '', date: '' });
      }
  };

  const deleteReminder = (id: number) => {
      setReminderList(reminderList.filter(r => r.id !== id));
  };

  const nextTip = () => {
      setCurrentTipIndex((prev) => (prev + 1) % SOCIETY_TIPS.length);
  };

  const prevTip = () => {
      setCurrentTipIndex((prev) => (prev - 1 + SOCIETY_TIPS.length) % SOCIETY_TIPS.length);
  };

  const handleExcelExport = () => {
      const table = document.querySelector('table');
      if (!table) {
          alert("No data table found on this screen to export.");
          return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
          const cols = row.querySelectorAll('th, td');
          const rowData: string[] = [];
          cols.forEach(col => rowData.push(`"${(col.textContent || '').replace(/"/g, '""')}"`));
          csvContent += rowData.join(",") + "\r\n";
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(calDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const btnClass = "p-2 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-indigo-600 transition-all flex flex-col items-center gap-1 min-w-[60px] group relative active:scale-95";
  const iconSize = 20; 
  const labelClass = "text-[10px] font-bold uppercase tracking-wider group-hover:text-indigo-600 text-slate-500 transition-colors";

  return (
    <div className={`bg-white border-b border-slate-200 p-2 mb-6 flex flex-wrap items-center gap-1 shadow-sm rounded-xl ${className} relative z-40`}>
      
      {onNew && (
        <button onClick={onNew} className={btnClass} title="Create New Record">
            <PlusCircle size={iconSize} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className={labelClass}>New</span>
        </button>
      )}

      {onModify && (
        <button onClick={onModify} className={btnClass} title="Modify / Edit Record">
            <Pencil size={iconSize} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <span className={labelClass}>Modify</span>
        </button>
      )}

      {onSave && (
        <button onClick={onSave} className={btnClass} title="Save Changes">
            <Save size={iconSize} className="text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className={labelClass}>Save</span>
        </button>
      )}

      {onDelete && (
        <button onClick={onDelete} className={btnClass} title="Delete Record">
            <Trash2 size={iconSize} className="text-rose-600 group-hover:scale-110 transition-transform" />
            <span className={labelClass}>Delete</span>
        </button>
      )}
      
      {onSearch && (
        <button onClick={onSearch} className={btnClass} title="Search Records">
            <Search size={iconSize} className="text-purple-600 group-hover:scale-110 transition-transform" />
            <span className={labelClass}>Search</span>
        </button>
      )}

      {onPeriodChange && (
        <button onClick={() => setShowPeriod(!showPeriod)} className={btnClass} title="Filter by Date Range">
            <CalendarRange size={iconSize} className="text-violet-600 group-hover:scale-110 transition-transform" />
            <span className={labelClass}>Period</span>
        </button>
      )}

      <div className="w-px h-10 bg-slate-200 mx-1 hidden md:block"></div>

      <button onClick={() => setShowCalculator(!showCalculator)} className={btnClass} title="Calculator">
        <Calculator size={iconSize} className="text-orange-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Calc</span>
      </button>
      
      <button onClick={() => setShowCalendar(!showCalendar)} className={btnClass} title="Monthly Calendar">
        <Calendar size={iconSize} className="text-rose-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Date</span>
      </button>

      <button onClick={() => setShowReminders(!showReminders)} className={btnClass} title="Tasks & Reminders">
        <Bell size={iconSize} className="text-amber-500 group-hover:scale-110 transition-transform" />
        {reminderList.length > 0 && (
             <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-red-600 rounded-full ring-2 ring-white"></span>
        )}
        <span className={labelClass}>Alerts</span>
      </button>

      <button onClick={() => setShowTips(!showTips)} className={btnClass} title="Societal Tips">
        <Lightbulb size={iconSize} className="text-yellow-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Tips</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1 hidden md:block"></div>

      {onPrint && (
        <button onClick={onPrint} className={btnClass} title="Download Report">
            <Printer size={iconSize} className="text-slate-700 group-hover:scale-110 transition-transform" />
            <span className={labelClass}>Print</span>
        </button>
      )}

      <button onClick={() => setShowStdDesc(!showStdDesc)} className={btnClass} title="Ledger Narrations">
        <FileText size={iconSize} className="text-teal-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Narration</span>
      </button>

      <button onClick={() => setShowByeLaws(!showByeLaws)} className={btnClass} title="Legal Bye-Laws">
        <Scale size={iconSize} className="text-pink-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Legal</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1 hidden md:block"></div>

      <div className="flex items-center gap-1 bg-slate-50 rounded-xl px-3 py-1 border border-slate-100">
          <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                  <Wallet size={12} className="text-green-600" />
                  <span className="text-[9px] font-black text-slate-400 uppercase">Cash</span>
                  <span className="text-[10px] font-bold text-slate-700">₹{balances?.cash.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                  <Landmark size={12} className="text-blue-600" />
                  <span className="text-[9px] font-black text-slate-400 uppercase">Bank</span>
                  <span className="text-[10px] font-bold text-slate-700">₹{balances?.bank.toLocaleString() || '0'}</span>
              </div>
          </div>
      </div>

      <div className="w-px h-10 bg-slate-200 mx-1 hidden md:block"></div>

      <button onClick={() => setShowWhatsApp(true)} className={btnClass} title="Share via WhatsApp">
        <MessageCircle size={iconSize} className="text-green-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Share</span>
      </button>

      <button onClick={handleExcelExport} className={btnClass} title="Export CSV">
        <FileSpreadsheet size={iconSize} className="text-emerald-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Excel</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1 hidden md:block"></div>

      <button onClick={onPrev} className={btnClass} title="Go Back">
        <ChevronLeft size={iconSize} className="text-indigo-400 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Prev</span>
      </button>

      <button onClick={onNext} className={btnClass} title="Go Next">
        <ChevronRight size={iconSize} className="text-indigo-400 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Next</span>
      </button>

      <div className="flex-1"></div>

      <button onClick={() => setShowHelp(true)} className={`${btnClass} ml-auto`} title="User Manual">
        <CircleHelp size={iconSize} className="text-cyan-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Help</span>
      </button>

      {/* --- POPUPS --- */}

      {showPeriod && (
         <div className="absolute top-20 left-16 z-50 bg-white p-4 rounded-xl shadow-2xl border border-slate-200 w-64 text-left animate-in slide-in-from-top-2">
             <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-slate-700">Select Filter Period</h4>
                 <button onClick={() => setShowPeriod(false)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
             </div>
             <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From</label>
                    <input type="date" value={period.from} onChange={(e) => setPeriod({...period, from: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
                    <input type="date" value={period.to} onChange={(e) => setPeriod({...period, to: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <button onClick={handlePeriodApply} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-black hover:bg-indigo-700 shadow-md">Apply Period</button>
            </div>
         </div>
      )}

      {showStdDesc && (
         <div className="absolute top-20 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 z-50 bg-white p-0 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg text-left overflow-hidden animate-in slide-in-from-top-2">
             <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                 <h4 className="font-bold text-slate-700 flex items-center gap-2">
                     <FileText size={18} className="text-teal-600"/> Ledger Narrations
                 </h4>
                 <button onClick={() => setShowStdDesc(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
             </div>
             <div className="max-h-[300px] overflow-y-auto p-4 space-y-6">
                 {Object.entries(STANDARD_DESCRIPTIONS).map(([category, items]) => (
                     <div key={category}>
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{category}</h5>
                         <div className="space-y-1">
                             {items.map((desc, idx) => {
                                 const uniqueId = `${category}-${idx}`;
                                 const isCopied = copiedDescIndex === uniqueId;
                                 return (
                                     <div key={idx} onClick={() => handleCopyDesc(desc, uniqueId)} className="group flex justify-between items-center gap-4 p-2 hover:bg-indigo-50 rounded-lg cursor-pointer border border-transparent hover:border-indigo-100 transition-all">
                                         <p className="text-xs text-slate-600 font-medium leading-relaxed truncate">{desc}</p>
                                         <button className={`shrink-0 p-1 rounded-md transition-colors ${isCopied ? 'text-green-600 bg-green-50' : 'text-slate-300 group-hover:text-indigo-600'}`}>
                                             {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                         </button>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 ))}
             </div>
             <div className="p-2 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold uppercase">Click any row to copy to clipboard</div>
         </div>
      )}

      {showCalculator && (
        <div className="absolute top-20 left-1/3 z-50 bg-slate-900 p-4 rounded-2xl shadow-2xl text-white w-64 border border-slate-700 animate-in zoom-in-95 duration-200">
           <div className="flex justify-between items-center mb-3">
               <span className="text-xs font-black uppercase tracking-widest opacity-60">Calculator</span>
               <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
           </div>
           <div className="bg-slate-800 text-white p-3 mb-4 rounded-xl text-right font-mono text-2xl h-14 flex items-center justify-end overflow-hidden border border-slate-700 shadow-inner">
               {calcInput || '0'}
           </div>
           <div className="grid grid-cols-4 gap-2">
               {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(k => (
                   <button key={k} onClick={() => handleCalc(k)} className={`p-3 rounded-xl text-lg font-black transition-all ${k === '=' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-800 hover:bg-slate-700'}`}>{k}</button>
               ))}
               <button onClick={() => handleCalc('C')} className="col-span-4 bg-rose-600 hover:bg-rose-700 p-3 rounded-xl font-black mt-1 transition-colors uppercase text-sm">Reset</button>
           </div>
        </div>
      )}

      {showHelp && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                 <div className="bg-indigo-600 text-white p-6 flex justify-between items-center">
                     <h3 className="text-xl font-black flex items-center gap-3">
                         <CircleHelp size={24} /> 
                         System Operations Guide
                     </h3>
                     <button onClick={() => setShowHelp(false)} className="text-indigo-200 hover:text-white transition-colors"><X size={24}/></button>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                         <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs border-b border-slate-100 pb-2">Record Actions</h4>
                         <ul className="space-y-3">
                             <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                 <div className="p-1.5 bg-emerald-50 rounded-lg"><PlusCircle size={16} className="text-emerald-600"/></div>
                                 <span>Add a new record in this tab</span>
                             </li>
                             <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                 <div className="p-1.5 bg-blue-50 rounded-lg"><Pencil size={16} className="text-blue-600"/></div>
                                 <span>Modify current settings/records</span>
                             </li>
                             <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                 <div className="p-1.5 bg-indigo-50 rounded-lg"><Save size={16} className="text-indigo-600"/></div>
                                 <span>Save pending changes</span>
                             </li>
                         </ul>
                     </div>
                     <div className="space-y-4">
                         <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs border-b border-slate-100 pb-2">Utility Functions</h4>
                         <ul className="space-y-3">
                             <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                 <div className="p-1.5 bg-purple-50 rounded-lg"><Search size={16} className="text-purple-600"/></div>
                                 <span>Search and filter the list below</span>
                             </li>
                             <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                 <div className="p-1.5 bg-slate-100 rounded-lg"><Printer size={16} className="text-slate-700"/></div>
                                 <span>Generate and download PDF reports</span>
                             </li>
                         </ul>
                     </div>
                 </div>
                 <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                     <button onClick={() => setShowHelp(false)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 active:scale-95 transition-all">Close Manual</button>
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};

export default StandardToolbar;
