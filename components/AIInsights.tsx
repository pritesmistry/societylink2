
import React, { useState } from 'react';
import { Bill, Expense } from '../types';
import { analyzeFinancials } from '../services/geminiService';
import { BrainCircuit, Loader2, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIInsightsProps {
  bills: Bill[];
  expenses: Expense[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ bills, expenses }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalysis = async () => {
    setIsLoading(true);
    const result = await analyzeFinancials(expenses, bills);
    setAnalysis(result);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuit size={32} className="text-indigo-200" />
          <h2 className="text-2xl font-bold">Smart Financial Analyst</h2>
        </div>
        <p className="text-indigo-100 mb-6 max-w-2xl">
          Leverage Gemini 2.5 Flash to analyze your society's income and expenditure patterns. 
          Get actionable insights to improve financial health and reduce wastage.
        </p>
        <button 
          onClick={handleAnalysis}
          disabled={isLoading}
          className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-indigo-50 transition-colors flex items-center gap-2 disabled:opacity-80"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCcw size={18} />}
          {analysis ? 'Regenerate Analysis' : 'Analyze Financials'}
        </button>
      </div>

      {analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 prose prose-slate max-w-none animate-fade-in">
             {/* We use a simple rendering here, assuming the AI returns markdown. 
                 Since we don't have a markdown library installed in the prompt specs, 
                 we will display it as formatted whitespace text or basic html if simple.
                 Actually, the prompt doesn't forbid react-markdown, but to keep it 
                 simple with standard library constraints, we'll use whitespace-pre-line 
                 and simple styling. */}
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
                {analysis}
            </div>
        </div>
      )}

      {!analysis && !isLoading && (
        <div className="text-center py-12 text-slate-400">
          <p>Click the button above to generate an instant report.</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
