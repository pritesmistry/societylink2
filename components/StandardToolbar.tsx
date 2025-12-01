
import React, { useState } from 'react';
import { 
  Save, Edit3, Search, Calculator, Calendar, Bell, HelpCircle, 
  Printer, FileText, ChevronLeft, ChevronRight, X, CalendarRange 
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

const StandardToolbar: React.FC<StandardToolbarProps> = ({ 
  onSave, onModify, onSearch, onPrint, onPrev, onNext, onPeriodChange, className 
}) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  
  // Period State
  const [period, setPeriod] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  
  // Calendar State
  const [calDate, setCalDate] = useState(new Date());

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
      alert(`Period Filter Applied: ${period.from} to ${period.to}`); // Visual confirmation for now
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
    <div className={`bg-white border-b border-slate-200 p-2 mb-6 flex flex-wrap items-center gap-1 shadow-sm rounded-lg ${className} relative`}>
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

      <button onClick={() => alert("No reminders set")} className={btnClass} title="Reminders">
        <Bell size={iconSize} className="text-amber-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Reminder</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1"></div>

      <button onClick={onPrint || (() => window.print())} className={btnClass} title="Print">
        <Printer size={iconSize} className="text-slate-700 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Print</span>
      </button>

      <button onClick={() => alert("Standard Description Helper")} className={btnClass} title="Standard Description">
        <FileText size={iconSize} className="text-teal-600 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Std Desc</span>
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

      <button onClick={() => alert("Help Documentation")} className={`${btnClass} ml-auto`} title="Help">
        <HelpCircle size={iconSize} className="text-cyan-500 group-hover:scale-110 transition-transform" />
        <span className={labelClass}>Help</span>
      </button>

      {/* Select Period Popup */}
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

      {/* Simple Calculator Popup */}
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

      {/* Calendar Popup */}
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
    </div>
  );
};

export default StandardToolbar;
