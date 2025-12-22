
import React, { useState } from 'react';
import { Search, HelpCircle, ChevronDown, ChevronUp, Copy, Check, Info, BookOpen, Scale, Landmark, Users, Home } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface KnowledgeBaseProps {
  balances?: { cash: number; bank: number };
}

interface QAItem {
    question: string;
    answer: string;
}

interface QACategory {
    title: string;
    icon: React.ElementType;
    items: QAItem[];
}

const SOCIETY_QA_DATA: QACategory[] = [
    {
        title: "Membership & Rights",
        icon: Users,
        items: [
            {
                question: "Who can become a member of a Housing Society?",
                answer: "Any person who is competent to contract under the Indian Contract Act, 1872, or a firm, company, or local authority can become a member, provided they own a flat or interest in the society's property."
            },
            {
                question: "What is an Associate Member?",
                answer: "An Associate Member is a person who holds title to the property jointly with the original member but whose name does not stand first in the share certificate. They can attend meetings and vote only in the absence of the original member with a written consent."
            },
            {
                question: "Can a Society refuse membership to a purchaser?",
                answer: "A Society can refuse membership only on valid grounds mentioned in the Bye-laws (e.g., criminal background, non-payment of transfer premium). Refusal must be communicated within 15 days of the committee decision."
            }
        ]
    },
    {
        title: "Maintenance & Billing",
        icon: Landmark,
        items: [
            {
                question: "How is maintenance calculated for a flat?",
                answer: "As per Model Bye-laws, Service Charges (Housekeeping, Security, etc.) are shared equally by all flats. Expenses like Repairs, Sinking Fund, and Water Charges are usually shared based on the Square Footage (Area) of the flat."
            },
            {
                question: "What is the maximum interest rate a society can charge on arrears?",
                answer: "A Society can charge simple interest at a rate decided by the General Body, but it cannot exceed 21% per annum. Compounding interest (interest on interest) is generally prohibited."
            },
            {
                question: "Is it mandatory to pay Non-Occupancy Charges (NOC)?",
                answer: "Yes, if the flat is rented out or occupied by someone other than the member's immediate family. However, NOC cannot exceed 10% of the service charges (excluding taxes)."
            }
        ]
    },
    {
        title: "Repairs & Renovations",
        icon: Home,
        items: [
            {
                question: "Who is responsible for flat leakages?",
                answer: "Leakages from external walls, terrace, or common pipes are the Society's responsibility. Internal leakages originating from a member's bathroom, kitchen, or internal plumbing are that specific Member's responsibility to repair."
            },
            {
                question: "Can I make structural changes inside my flat?",
                answer: "No member can make structural changes (removing pillars, beams, or load-bearing walls) without prior written permission from the Managing Committee and the Municipal Corporation (BMC/Local Body)."
            }
        ]
    },
    {
        title: "Legal & Management",
        icon: Scale,
        items: [
            {
                question: "What is the minimum quorum for a General Body Meeting?",
                answer: "The quorum for a General Meeting is usually 2/3rds of the total members or 20 members, whichever is less. If there is no quorum, the meeting is adjourned and reconvened after 30 minutes, where no quorum is required."
            },
            {
                question: "How often should a Managing Committee meet?",
                answer: "The Managing Committee must meet at least once every month to discuss society affairs, approve expenses, and address member grievances."
            },
            {
                question: "Can a member inspect society records?",
                answer: "Yes. Every member has the right to inspect society books of accounts, minutes of meetings, and statutory registers during office hours by giving prior notice and paying nominal copying fees."
            }
        ]
    }
];

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ balances }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const toggleItem = (q: string) => {
        setExpandedItems(prev => 
            prev.includes(q) ? prev.filter(i => i !== q) : [...prev, q]
        );
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const filteredData = SOCIETY_QA_DATA.map(cat => ({
        ...cat,
        items: cat.items.filter(i => 
            i.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
            i.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <StandardToolbar balances={balances} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                        <BookOpen className="text-indigo-600" />
                        Society Q&A Folder
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Common legal and procedural questions for Co-op Housing Societies.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search questions or keywords..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {filteredData.length > 0 ? filteredData.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <cat.icon size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{cat.title}</h3>
                        </div>

                        <div className="space-y-3">
                            {cat.items.map((item, itemIdx) => {
                                const isExpanded = expandedItems.includes(item.question);
                                const isCopied = copiedText === item.answer;

                                return (
                                    <div key={itemIdx} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
                                        <button 
                                            onClick={() => toggleItem(item.question)}
                                            className="w-full flex justify-between items-center p-5 text-left group"
                                        >
                                            <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors pr-4">{item.question}</span>
                                            <div className="shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </button>
                                        
                                        {isExpanded && (
                                            <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-600 font-medium">
                                                    {item.answer}
                                                </div>
                                                <div className="mt-4 flex justify-end">
                                                    <button 
                                                        onClick={() => handleCopy(item.answer)}
                                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${isCopied ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                                                    >
                                                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                                        {isCopied ? 'COPIED TO CLIPBOARD' : 'COPY ANSWER'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <HelpCircle size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="font-bold text-slate-400">No matching questions found.</p>
                        <p className="text-xs text-slate-300 mt-1">Try a different keyword or category.</p>
                    </div>
                )}
            </div>

            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4 mt-8">
                <Info className="text-amber-600 shrink-0" size={24} />
                <div className="space-y-1">
                    <p className="text-sm font-black text-amber-900 uppercase">Legal Disclaimer</p>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        The information provided in this Q&A folder is based on the Model Bye-laws of Co-operative Housing Societies. Individual society bye-laws may vary. For critical legal matters or Section 101 recovery actions, please consult your society's official legal advisor or a Chartered Accountant.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBase;
