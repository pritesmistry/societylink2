
import React, { useState, useEffect } from 'react';
import { 
  Save, Edit3, Search, Calculator, Calendar, Bell, HelpCircle, 
  Printer, FileText, ChevronLeft, ChevronRight, X, CalendarRange,
  Copy, Check, MessageCircle, FileSpreadsheet, File, FileEdit,
  Trash2, Plus, Share2, DownloadCloud, Keyboard, Scale, Lightbulb
} from 'lucide-react';

interface StandardToolbarProps {
  onSave?: () => void;
  onModify?: () => void;
  onSearch?: () => void;
  onPrint?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onPeriodChange?: (startDate: string, endDate: string) => void;
  className?: string;
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
    },
    {
        category: "IV. Sub-letting / Tenancy",
        rules: [
            { title: "Intimation", content: "A member must intimate the society 8 days before sub-letting the flat and submit a copy of the Leave and License agreement." },
            { title: "Police Verification", content: "Police Verification of the tenant is mandatory before they move in." },
            { title: "No NOC Fee", content: "The Society cannot charge any donation or heavy fee for issuing an NOC for sub-letting." }
        ]
    },
    {
        category: "V. General Body Meetings",
        rules: [
            { title: "AGM Timing", content: "The Annual General Meeting (AGM) must be held on or before 30th September each year." },
            { title: "Quorum", content: "The quorum for the General Meeting shall be 2/3rds of the total members or 20, whichever is less." },
            { title: "Voting", content: "Every member has one vote. In case of joint ownership, the person whose name stands first in the share certificate has the right to vote." }
        ]
    }
];

const SOCIETY_TIPS = [
    {
        title: "Nominee ≠ Owner",
        content: "A nominee is merely a trustee of the property after the death of a member. They do not automatically become the owner. The property must be transferred to the legal heirs as per the Will or Succession Law."
    },
    {
        title: "Leakage Responsibility",
        content: "If leakage originates from the external walls or terrace, it is the Society's responsibility to repair. If it originates from a flat (e.g., bathroom/kitchen pipes) damaging the flat below, it is the respective Member's responsibility."
    },
    {
        title: "Associate Member Rights",
        content: "An Associate Member (name appearing second on the share certificate) has no right to vote in the AGM unless the Original Member is absent and provides written consent."
    },
    {
        title: "Non-Occupancy Charges Limit",
        content: "Societies cannot charge Non-Occupancy Charges more than 10% of the service charges (excluding municipal taxes). Charging 'double maintenance' to tenants is illegal."
    },
    {
        title: "Parking is for Vehicles Only",
        content: "Stilt or open parking spaces allotted to members cannot be used for storage of household items, furniture, or construction debris. It creates a fire hazard."
    },
    {
        title: "Transfer Premium Cap",
        content: "The premium for the transfer of a flat (Transfer Fee) cannot exceed ₹25,000. Any demand for 'voluntary donations' for transferring membership is illegal."
    },
    {
        title: "Right to Information",
        content: "Every member has the right to inspect the books of accounts, minutes of meetings, and statutory registers of the society during office hours by paying a nominal copying fee."
    },
    {
        title: "Structural Changes",
        content: "Removal of pillars, beams, or load-bearing walls inside a flat is strictly prohibited and endangers the entire building structure. Always consult a structural engineer before renovation."
    }
];

const StandardToolbar: React.FC<StandardToolbarProps> = ({ 
  onSave, onModify, onSearch, onPrint, onPrev, onNext, onPeriodChange, className 
}) => {
  // Toggle States
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);
  const [showStdDesc, setShowStdDesc] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showByeLaws, setShowByeLaws] = useState(false);
  const [showTips, setShowTips] = useState(false);
  
  // Feature States
  const [calcInput, setCalcInput] = useState('');
  const [copiedDescIndex, setCopiedDescIndex] = useState<string | null>(null);
  const [selectedLawCategory, setSelectedLawCategory] = useState<string>(IMPORTANT_BYE_LAWS[0].category);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  // Initialize Tip Index randomly on mount
  useEffect(() => {
    setCurrentTipIndex(Math.floor(Math.random() * SOCIETY_TIPS.length));
  }, []);

  // Reminder State
  const [reminderList, setReminderList] = useState<{id: number, text: string, date: string}[]>([
      { id: 1, text: 'Submit Monthly TDS Return', date: new Date().toISOString().split('T')[0] },
      { id: 2, text: 'Renew Lift AMC', date: '2023-11-01' }
  ]);
  const [newReminder, setNewReminder] = useState({ text: '', date: '' });

  // WhatsApp State
  const [waNumber, setWaNumber] = useState('');
  const [waMessage, setWaMessage] = useState('Here is the requested document from SocietyLink.');

  // Period State
  const [period, setPeriod] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  
  // Calendar State
  const [calDate, setCalDate] = useState(new Date());

  // --- HANDLERS ---

  const handleCalc = (val: string) => {
      if (val === '=') {
          try {
              // eslint-disable-next-line no-eval
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

  // Reminder Logic
  const addReminder = () => {
      if (newReminder.text) {
          setReminderList([...reminderList, { id: Date.now(), text: newReminder.text, date: newReminder.date || 'No Date' }]);
          setNewReminder({ text: '', date: '' });
      }
  };

  const deleteReminder = (id: number) => {
      setReminderList(reminderList.filter(r => r.id !== id));
  };

  // Tips Logic
  const nextTip = () => {
      setCurrentTipIndex((prev) => (prev + 1) % SOCIETY_TIPS.length);
  };

  const prevTip = () => {
      setCurrentTipIndex((prev) => (prev - 1 + SOCIETY_TIPS.length) % SOCIETY_TIPS.length);
  };

  // Excel Export Logic (Table Scraper)
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

  // WhatsApp Logic
  const handleWhatsAppShare = () => {
      if (waNumber) {
          const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
          window.open(url, '_blank');
          setShowWhatsApp(false);
      }
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(calDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


  const btnClass = "p-2 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors flex flex-col items-center gap-1 min-w-[60px] group relative";
  const iconSize = 24; 
  const labelClass = "text-[10px] font-medium uppercase tracking-wide group-hover:text-indigo-600 text-slate-500";

  return (
    <div className={`bg-white border-b border-slate-200 p-2 mb-6 flex flex-wrap items-center gap-1 shadow-sm rounded-lg ${className} relative z-40`}>
      <button onClick={onSave} className={btnClass} title="Save / Add New">
        <Save size={iconSize} className="text-green-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Save</span>
      </button>
      
      <button onClick={onModify} className={btnClass} title="Modify / Edit">
        <Edit3 size={iconSize} className="text-blue-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Modify</span>
      </button>
      
      <button onClick={onSearch} className={btnClass} title="Search">
        <Search size={iconSize} className="text-purple-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Search</span>
      </button>

      <button onClick={() => setShowPeriod(!showPeriod)} className={btnClass} title="Select Period">
        <CalendarRange size={iconSize} className="text-violet-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Period</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1"></div>

      <button onClick={() => setShowCalculator(!showCalculator)} className={btnClass} title="Calculator">
        <Calculator size={iconSize} className="text-orange-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Calc</span>
      </button>
      
      <button onClick={() => setShowCalendar(!showCalendar)} className={btnClass} title="Calendar">
        <Calendar size={iconSize} className="text-rose-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Calendar</span>
      </button>

      <button onClick={() => setShowReminders(!showReminders)} className={btnClass} title="Reminders">
        <Bell size={iconSize} className="text-amber-500 group-hover:scale-110 transition-transform" />
        {reminderList.length > 0 && (
             <span className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
        <span className={labelClass}>Reminder</span>
      </button>

      <button onClick={() => setShowTips(!showTips)} className={btnClass} title="Tips of the Day">
        <Lightbulb size={iconSize} className="text-yellow-500 group-hover:scale-110 transition-transform" fill="currentColor" fillOpacity={0.2} />
        <span className={labelClass}>Tips</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1"></div>

      <button onClick={() => window.print()} className={btnClass} title="Print Page">
        <Printer size={iconSize} className="text-slate-700 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Print</span>
      </button>

      <button onClick={() => setShowStdDesc(!showStdDesc)} className={btnClass} title="Standard Description">
        <FileText size={iconSize} className="text-teal-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Std Desc</span>
      </button>

      <button onClick={() => setShowByeLaws(!showByeLaws)} className={btnClass} title="Model Bye-Laws">
        <Scale size={iconSize} className="text-pink-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Bye-Laws</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1"></div>

      {/* EXPORT BUTTONS */}
      <button onClick={() => setShowWhatsApp(true)} className={btnClass} title="WhatsApp">
        <MessageCircle size={iconSize} className="text-green-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>WhatsApp</span>
      </button>

      <button onClick={handleExcelExport} className={btnClass} title="Export Table to CSV">
        <FileSpreadsheet size={iconSize} className="text-emerald-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Excel</span>
      </button>

      <button onClick={onPrint || (() => window.print())} className={btnClass} title="Export PDF">
        <File size={iconSize} className="text-red-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>PDF</span>
      </button>

      <button onClick={() => alert("Word export requires .docx generation library. Please use PDF for now.")} className={btnClass} title="Word">
        <FileEdit size={iconSize} className="text-blue-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Word</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1"></div>

      <button onClick={onPrev} className={btnClass} title="Previous Record">
        <ChevronLeft size={iconSize} className="text-indigo-400 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Prev</span>
      </button>

      <button onClick={onNext} className={btnClass} title="Next Record">
        <ChevronRight size={iconSize} className="text-indigo-400 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Next</span>
      </button>

      <div className="flex-1"></div>

      <button onClick={() => setShowHelp(true)} className={`${btnClass} ml-auto`} title="Help">
        <HelpCircle size={iconSize} className="text-cyan-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Help</span>
      </button>


      {/* --- POPUPS --- */}

      {/* 1. Select Period Popup */}
      {showPeriod && (
         <div className="absolute top-20 left-16 z-50 bg-white p-4 rounded-xl shadow-2xl border border-slate-200 w-64 text-left">
             <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-slate-700">Select Period</h4>
                 <button onClick={() => setShowPeriod(false)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
             </div>
             <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From Date</label>
                    <input 
                        type="date" 
                        value={period.from} 
                        onChange={(e) => setPeriod({...period, from: e.target.value})}
                        className="w-full border border-slate-300 rounded p-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To Date</label>
                    <input 
                        type="date" 
                        value={period.to} 
                        onChange={(e) => setPeriod({...period, to: e.target.value})}
                        className="w-full border border-slate-300 rounded p-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                </div>
                <button 
                    onClick={handlePeriodApply} 
                    className="w-full bg-indigo-600 text-white rounded py-2 text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    Apply Filter
                </button>
            </div>
         </div>
      )}

      {/* 2. Standard Descriptions Popup */}
      {showStdDesc && (
         <div className="absolute top-20 right-0 md:right-auto md:left-1/2 md:-translate-x-1/4 z-50 bg-white p-0 rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg text-left overflow-hidden">
             <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                 <h4 className="font-bold text-slate-700 flex items-center gap-2">
                     <FileText size={18} className="text-teal-600"/> Standard Descriptions
                 </h4>
                 <button onClick={() => setShowStdDesc(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
             </div>
             <div className="max-h-[400px] overflow-y-auto p-4 space-y-6">
                 {Object.entries(STANDARD_DESCRIPTIONS).map(([category, items]) => (
                     <div key={category}>
                         <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{category}</h5>
                         <div className="space-y-2">
                             {items.map((desc, idx) => {
                                 const uniqueId = `${category}-${idx}`;
                                 const isCopied = copiedDescIndex === uniqueId;
                                 return (
                                     <div 
                                        key={idx} 
                                        onClick={() => handleCopyDesc(desc, uniqueId)}
                                        className="group flex justify-between items-start gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-100 transition-all"
                                     >
                                         <p className="text-sm text-slate-700 leading-relaxed">{desc}</p>
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
             <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
                 Click on any description to copy to clipboard
             </div>
         </div>
      )}

      {/* 3. Model Bye-Laws Popup */}
      {showByeLaws && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                 <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                     <h3 className="text-lg font-bold flex items-center gap-2">
                         <Scale size={20} className="text-pink-400" /> Important Model Bye-Laws
                     </h3>
                     <button onClick={() => setShowByeLaws(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                 </div>
                 
                 <div className="flex flex-1 overflow-hidden">
                     {/* Sidebar Categories */}
                     <div className="w-1/3 bg-slate-50 border-r border-slate-200 overflow-y-auto p-2">
                         {IMPORTANT_BYE_LAWS.map((item, idx) => (
                             <button
                                key={idx}
                                onClick={() => setSelectedLawCategory(item.category)}
                                className={`w-full text-left p-3 rounded-lg text-sm font-bold mb-1 transition-colors ${
                                    selectedLawCategory === item.category 
                                    ? 'bg-indigo-100 text-indigo-700' 
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                             >
                                 {item.category}
                             </button>
                         ))}
                     </div>
                     
                     {/* Content Area */}
                     <div className="flex-1 overflow-y-auto p-6 bg-white">
                         <h4 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">{selectedLawCategory}</h4>
                         <div className="space-y-6">
                             {IMPORTANT_BYE_LAWS.find(l => l.category === selectedLawCategory)?.rules.map((rule, idx) => (
                                 <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                     <h5 className="font-bold text-indigo-600 mb-2 flex items-center gap-2">
                                         {rule.title}
                                     </h5>
                                     <p className="text-slate-700 text-sm leading-relaxed text-justify">
                                         {rule.content}
                                     </p>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
                 
                 <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 shrink-0">
                     These are summarized extracts from standard Model Bye-laws. Refer to the official booklet for legal purposes.
                 </div>
             </div>
         </div>
      )}

      {/* 4. Simple Calculator Popup */}
      {showCalculator && (
        <div className="absolute top-20 left-1/3 z-50 bg-slate-800 p-4 rounded-xl shadow-2xl text-white w-64 border border-slate-700">
           <div className="flex justify-between mb-2">
               <span className="font-bold">Calculator</span>
               <button onClick={() => setShowCalculator(false)}><X size={16}/></button>
           </div>
           <div className="bg-slate-100 text-slate-900 p-2 mb-3 rounded text-right font-mono text-xl h-10 overflow-hidden">
               {calcInput || '0'}
           </div>
           <div className="grid grid-cols-4 gap-2">
               {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(k => (
                   <button 
                    key={k} 
                    onClick={() => handleCalc(k)}
                    className="bg-slate-600 hover:bg-slate-500 p-2 rounded text-lg font-bold transition-colors"
                   >
                       {k}
                   </button>
               ))}
               <button onClick={() => handleCalc('C')} className="col-span-4 bg-red-500 hover:bg-red-600 p-2 rounded font-bold mt-1 transition-colors">Clear</button>
           </div>
        </div>
      )}

      {/* 5. Calendar Popup */}
      {showCalendar && (
        <div className="absolute top-20 left-1/3 ml-16 z-50 bg-white p-4 rounded-xl shadow-2xl border border-slate-200 w-80 text-slate-800">
           <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
               <button onClick={() => setCalDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-600"><ChevronLeft size={20}/></button>
               <span className="font-bold text-lg">{monthNames[month]} {year}</span>
               <div className="flex gap-1 items-center">
                   <button onClick={() => setCalDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-600"><ChevronRight size={20}/></button>
                   <button onClick={() => setShowCalendar(false)} className="p-1 hover:bg-red-50 text-red-500 rounded ml-2"><X size={16}/></button>
               </div>
           </div>
           <div className="grid grid-cols-7 gap-1 text-center mb-2">
               {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                   <div key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</div>
               ))}
           </div>
           <div className="grid grid-cols-7 gap-1 text-center">
               {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
               {Array.from({ length: days }).map((_, i) => {
                   const day = i + 1;
                   const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                   return (
                       <div key={day} className={`text-sm w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-indigo-50 transition-colors ${isToday ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-700'}`}>
                           {day}
                       </div>
                   )
               })}
           </div>
           <div className="mt-4 text-center border-t border-slate-100 pt-3">
               <button onClick={() => setCalDate(new Date())} className="text-xs text-indigo-600 font-bold hover:underline">Jump to Today</button>
           </div>
        </div>
      )}

      {/* 6. Reminders Popup */}
      {showReminders && (
        <div className="absolute top-20 left-1/3 z-50 bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-80 text-left">
           <div className="flex justify-between items-center mb-4 border-b pb-2">
               <h4 className="font-bold text-slate-800 flex items-center gap-2">
                   <Bell size={18} className="text-amber-500" /> Reminders
               </h4>
               <button onClick={() => setShowReminders(false)}><X size={18} className="text-slate-400" /></button>
           </div>
           
           <div className="flex gap-2 mb-4">
               <input 
                   type="text" 
                   placeholder="Add new task..." 
                   className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-indigo-500"
                   value={newReminder.text}
                   onChange={e => setNewReminder({...newReminder, text: e.target.value})}
               />
               <button onClick={addReminder} className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-700">
                   <Plus size={18} />
               </button>
           </div>

           <div className="space-y-2 max-h-48 overflow-y-auto">
               {reminderList.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No pending reminders.</p>}
               {reminderList.map(r => (
                   <div key={r.id} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm group">
                       <div>
                           <p className="font-medium text-slate-700">{r.text}</p>
                           {r.date && <p className="text-xs text-slate-400">{r.date}</p>}
                       </div>
                       <button onClick={() => deleteReminder(r.id)} className="text-slate-300 hover:text-red-500">
                           <Trash2 size={14} />
                       </button>
                   </div>
               ))}
           </div>
        </div>
      )}

      {/* 7. WhatsApp Popup */}
      {showWhatsApp && (
         <div className="absolute top-20 right-20 z-50 bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-80 text-left">
             <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-green-600 flex items-center gap-2">
                     <MessageCircle size={20} /> Share via WhatsApp
                 </h4>
                 <button onClick={() => setShowWhatsApp(false)}><X size={18} className="text-slate-400" /></button>
             </div>
             <div className="space-y-3">
                 <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                     <input 
                        type="tel" 
                        placeholder="e.g. 919876543210"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        value={waNumber}
                        onChange={e => setWaNumber(e.target.value)}
                     />
                 </div>
                 <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                     <textarea 
                        rows={3}
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        value={waMessage}
                        onChange={e => setWaMessage(e.target.value)}
                     />
                 </div>
                 <button 
                    onClick={handleWhatsAppShare}
                    className="w-full bg-green-500 text-white py-2 rounded font-bold hover:bg-green-600 flex items-center justify-center gap-2"
                 >
                     <Share2 size={16} /> Send Message
                 </button>
             </div>
         </div>
      )}

       {/* 8. Tips of the Day Popup */}
       {showTips && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white p-0 rounded-xl shadow-2xl border border-amber-200 w-full max-w-md text-left overflow-hidden ring-4 ring-amber-50">
             <div className="bg-amber-100 p-4 flex justify-between items-center border-b border-amber-200">
                 <h4 className="font-bold text-amber-900 flex items-center gap-2">
                     <Lightbulb size={24} className="text-amber-600" fill="currentColor" /> 
                     Tip of the Day
                 </h4>
                 <button onClick={() => setShowTips(false)} className="text-amber-700 hover:text-amber-900"><X size={20}/></button>
             </div>
             
             <div className="p-6 text-center">
                 <h5 className="text-lg font-bold text-slate-800 mb-2">{SOCIETY_TIPS[currentTipIndex].title}</h5>
                 <p className="text-slate-600 text-sm leading-relaxed mb-6">
                     {SOCIETY_TIPS[currentTipIndex].content}
                 </p>
                 
                 <div className="flex justify-center gap-4">
                     <button onClick={prevTip} className="p-2 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-colors">
                         <ChevronLeft size={20} />
                     </button>
                     <span className="text-xs font-bold text-slate-400 py-2">
                         {currentTipIndex + 1} / {SOCIETY_TIPS.length}
                     </span>
                     <button onClick={nextTip} className="p-2 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-colors">
                         <ChevronRight size={20} />
                     </button>
                 </div>
             </div>
          </div>
       )}

      {/* 9. Help Popup */}
      {showHelp && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                 <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                     <h3 className="text-lg font-bold flex items-center gap-2">
                         <HelpCircle size={20} /> Help & Keyboard Shortcuts
                     </h3>
                     <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                 </div>
                 <div className="p-6 grid grid-cols-2 gap-8">
                     <div>
                         <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Toolbar Legend</h4>
                         <ul className="space-y-2 text-sm text-slate-600">
                             <li className="flex items-center gap-2"><Save size={16} className="text-green-600"/> Save current form / Add New</li>
                             <li className="flex items-center gap-2"><Edit3 size={16} className="text-blue-600"/> Modify settings or record</li>
                             <li className="flex items-center gap-2"><Search size={16} className="text-purple-600"/> Focus search bar</li>
                             <li className="flex items-center gap-2"><CalendarRange size={16} className="text-violet-600"/> Filter by Date Range</li>
                             <li className="flex items-center gap-2"><Scale size={16} className="text-pink-600"/> View Model Bye-Laws</li>
                             <li className="flex items-center gap-2"><Lightbulb size={16} className="text-amber-500"/> Important Society Tips</li>
                         </ul>
                     </div>
                     <div>
                         <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Shortcuts & Tips</h4>
                         <ul className="space-y-3 text-sm text-slate-600">
                             <li className="flex items-start gap-2">
                                 <Keyboard size={16} className="text-slate-400 mt-0.5"/>
                                 <span>Use <strong>Tab</strong> to navigate fields.</span>
                             </li>
                             <li className="flex items-start gap-2">
                                 <DownloadCloud size={16} className="text-slate-400 mt-0.5"/>
                                 <span><strong>PDF</strong> button downloads the specific report for the current section.</span>
                             </li>
                             <li className="flex items-start gap-2">
                                 <Printer size={16} className="text-slate-400 mt-0.5"/>
                                 <span><strong>Print</strong> opens the browser print dialog for the whole page.</span>
                             </li>
                         </ul>
                         <div className="mt-4 bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                             <strong>Note:</strong> Word export feature is currently in development. Please use PDF export for formal documents.
                         </div>
                     </div>
                 </div>
                 <div className="bg-slate-50 p-4 text-right">
                     <button onClick={() => setShowHelp(false)} className="px-6 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">Close</button>
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};

export default StandardToolbar;
