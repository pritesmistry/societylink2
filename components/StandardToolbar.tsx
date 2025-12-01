
import React, { useState } from 'react';
import { 
  Save, Edit3, Search, Calculator, Calendar, Bell, HelpCircle, 
  Printer, FileText, ChevronLeft, ChevronRight, X 
} from 'lucide-react';

interface StandardToolbarProps {
  onSave?: () => void;
  onModify?: () => void;
  onSearch?: () => void;
  onPrint?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

const StandardToolbar: React.FC<StandardToolbarProps> = ({ 
  onSave, onModify, onSearch, onPrint, onPrev, onNext, className 
}) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');

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

  const btnClass = "p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors flex flex-col items-center gap-1 min-w-[60px]";
  const iconSize = 20;
  const labelClass = "text-[10px] font-medium uppercase tracking-wide";

  return (
    <div className={`bg-white border-b border-slate-200 p-2 mb-6 flex flex-wrap items-center gap-1 shadow-sm rounded-lg ${className}`}>
      <button onClick={onSave} className={btnClass} title="Save / Add New">
        <Save size={iconSize} />
        <span className={labelClass}>Save</span>
      </button>
      
      <button onClick={onModify} className={btnClass} title="Modify / Edit">
        <Edit3 size={iconSize} />
        <span className={labelClass}>Modify</span>
      </button>
      
      <button onClick={onSearch} className={btnClass} title="Search">
        <Search size={iconSize} />
        <span className={labelClass}>Search</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1"></div>

      <button onClick={() => setShowCalculator(!showCalculator)} className={btnClass} title="Calculator">
        <Calculator size={iconSize} />
        <span className={labelClass}>Calc</span>
      </button>
      
      <button onClick={() => alert("Calendar View coming soon")} className={btnClass} title="Calendar">
        <Calendar size={iconSize} />
        <span className={labelClass}>Calender</span>
      </button>

      <button onClick={() => alert("No reminders set")} className={btnClass} title="Reminders">
        <Bell size={iconSize} />
        <span className={labelClass}>Reminder</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1"></div>

      <button onClick={onPrint || (() => window.print())} className={btnClass} title="Print">
        <Printer size={iconSize} />
        <span className={labelClass}>Print</span>
      </button>

      <button onClick={() => alert("Standard Description Helper")} className={btnClass} title="Standard Description">
        <FileText size={iconSize} />
        <span className={labelClass}>Std Desc</span>
      </button>

      <div className="w-px h-10 bg-slate-200 mx-1"></div>

      <button onClick={onPrev} className={btnClass} title="Previous Record">
        <ChevronLeft size={iconSize} />
        <span className={labelClass}>Prev</span>
      </button>

      <button onClick={onNext} className={btnClass} title="Next Record">
        <ChevronRight size={iconSize} />
        <span className={labelClass}>Next</span>
      </button>

      <div className="flex-1"></div>

      <button onClick={() => alert("Help Documentation")} className={`${btnClass} ml-auto`} title="Help">
        <HelpCircle size={iconSize} />
        <span className={labelClass}>Help</span>
      </button>

      {/* Simple Calculator Popup */}
      {showCalculator && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 bg-slate-800 p-4 rounded-xl shadow-2xl text-white w-64">
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
                    className="bg-slate-600 hover:bg-slate-500 p-2 rounded text-lg font-bold"
                   >
                       {k}
                   </button>
               ))}
               <button onClick={() => handleCalc('C')} className="col-span-4 bg-red-500 hover:bg-red-600 p-2 rounded font-bold mt-1">Clear</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default StandardToolbar;
