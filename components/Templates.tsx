
import React, { useState } from 'react';
import StandardToolbar from './StandardToolbar';
import { Copy, FileText, Check } from 'lucide-react';

interface TemplatesProps {
    balances?: { cash: number; bank: number };
}

const SAMPLE_TEMPLATES = {
    'CIRCULARS': [
        {
            title: 'Festival Celebration',
            content: "Dear Residents,\n\nWe are pleased to inform you that the society is organizing a celebration for [Festival Name] on [Date] at [Time].\n\nVenue: Community Hall\n\nAll members are requested to join us for the celebration followed by dinner.\n\nWarm Regards,\nSecretary"
        },
        {
            title: 'Water Tank Cleaning',
            content: "Dear Residents,\n\nThis is to inform you that the water tank cleaning is scheduled for [Date]. Water supply will be disrupted from [Start Time] to [End Time].\n\nPlease store sufficient water for your usage.\n\nRegards,\nMaintenance Team"
        }
    ],
    'NOTICES': [
        {
            title: 'AGM Notice',
            content: "NOTICE\n\nThe Annual General Meeting (AGM) of the society will be held on [Date] at [Time] in the Society Office.\n\nAgenda:\n1. Approval of Accounts\n2. Appointment of Auditor\n3. Any other matter with permission of Chair\n\nAll members are requested to attend.\n\nSecretary"
        },
        {
            title: 'Renovation Rules',
            content: "NOTICE\n\nMembers planning renovation work in their flats are requested to obtain prior NOC from the committee. Work is permitted only between 9 AM and 6 PM on weekdays.\n\nDebris must be cleared daily.\n\nSociety Manager"
        }
    ],
    'REMINDERS': [
        {
            title: 'Maintenance Due Payment',
            content: "Dear Member,\n\nThis is a gentle reminder that your maintenance bill for [Month] amounting to Rs. [Amount] is due. Please clear the dues by [Date] to avoid late payment interest.\n\nIgnore if already paid.\n\nTreasurer"
        },
        {
            title: 'Parking Sticker',
            content: "Dear Residents,\n\nPlease collect your new vehicle parking stickers from the society office before [Date]. Vehicles without stickers will not be allowed inside the premises after this date.\n\nSecurity In-charge"
        }
    ],
    'MINUTES': [
        {
             title: 'Annual General Meeting (AGM)',
             content: "MINUTES OF THE ANNUAL GENERAL MEETING\n\nHeld on: [Date]\nVenue: Society Premises\n\nPresent:\n- [Chairman Name] (Chairman)\n- [Secretary Name] (Secretary)\n- [Number] Members (Attendance sheet attached)\n\nPROCEEDINGS:\n\n1. Reading of Previous Minutes:\n   The minutes of the last AGM held on [Date] were read by the Secretary and confirmed unanimously.\n   Proposed by: [Name]\n   Seconded by: [Name]\n\n2. Adoption of Accounts:\n   The Audited Accounts for the year ended 31st March [Year] were presented. The Treasurer explained the key expenses. The accounts were adopted unanimously.\n\n3. Appointment of Auditor:\n   M/s [Auditor Name] were appointed as Statutory Auditors for the next Financial Year.\n\nVote of Thanks given by the Chairman."
        },
        {
             title: 'Managing Committee Meeting (MCM)',
             content: "MINUTES OF MANAGING COMMITTEE MEETING\n\nDate: [Date]\nTime: [Time]\n\nAttendees: [List of Committee Members]\n\nAGENDA ITEMS DISCUSSED:\n\n1. Review of Monthly Expenses:\n   - Expenses for [Month] totaling Rs. [Amount] were reviewed and approved.\n   - Security agency bill was passed for payment.\n\n2. Membership Transfer:\n   - Application from Mr. [Seller] to transfer Flat [No] to Mr. [Buyer] was reviewed.\n   - RESOLUTION: Transfer approved. Share certificate to be endorsed.\n\n3. Leakage Complaint:\n   - Complaint from Flat [No] regarding terrace leakage discussed.\n   - Decided to inspect with plumber on [Date].\n\nHon. Secretary"
        }
    ]
};

const Templates: React.FC<TemplatesProps> = ({ balances }) => {
  const [activeCategory, setActiveCategory] = useState<'CIRCULARS' | 'NOTICES' | 'REMINDERS' | 'MINUTES'>('CIRCULARS');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
             <div>
                <h2 className="text-xl font-semibold text-slate-800">Standard Templates</h2>
                <p className="text-sm text-slate-500 mt-1">Ready-to-use drafts for society communications.</p>
             </div>
        </div>

        <StandardToolbar 
            onSearch={() => {}} 
            onPrint={() => window.print()}
            balances={balances}
        />

        <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
            {Object.keys(SAMPLE_TEMPLATES).map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as any)}
                    className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SAMPLE_TEMPLATES[activeCategory].map((template, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <FileText size={18} className="text-indigo-600" />
                            {template.title}
                        </h3>
                        <button 
                            onClick={() => handleCopy(template.content, idx)}
                            className={`p-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${copiedIndex === idx ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                            {copiedIndex === idx ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed border border-slate-100 flex-1 overflow-auto max-h-96">
                        {template.content}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default Templates;
