
import { Bill, Expense, Notice, PaymentStatus, Resident, Society, MeetingMinutes, Income } from './types';

const DEFAULT_BILL_LAYOUT = {
  title: 'MAINTENANCE BILL',
  showSocietyAddress: true,
  showBankDetails: true,
  showFooterNote: true,
  colorTheme: '#4f46e5', // Indigo-600
  showLogoPlaceholder: true,
  columns: {
    description: true,
    type: true,
    rate: true,
    amount: true
  }
};

export const MOCK_SOCIETIES: Society[] = [
  {
    id: '1',
    name: 'Green Valley Heights',
    address: '123 Park Avenue, Metro City, ST 54321',
    registrationNumber: 'REG-2024-001',
    contactEmail: 'admin@greenvalley.com',
    contactPhone: '+1 555-0101',
    bankDetails: 'Bank: Metro City Bank\nAC: 1234567890\nIFSC: MCB001\nBranch: Park Ave',
    processedBy: 'John Doe (Secretary)',
    footerNote: 'Please pay before the due date to avoid late fees.',
    billLayout: DEFAULT_BILL_LAYOUT
  },
  {
    id: '2',
    name: 'Sunrise Apartments',
    address: '45 Ocean Drive, Bay Area, ST 98765',
    registrationNumber: 'REG-2024-088',
    contactEmail: 'manager@sunriseapts.com',
    contactPhone: '+1 555-0202',
    bankDetails: 'Bank: Ocean View Bank\nAC: 9876543210\nIFSC: OVB099\nBranch: Bay Area',
    processedBy: 'Jane Smith (Manager)',
    footerNote: 'Thank you for being a valued resident.',
    billLayout: { ...DEFAULT_BILL_LAYOUT, colorTheme: '#0891b2' } // Cyan-600
  }
];

export const MOCK_RESIDENTS: Resident[] = [
  { 
    id: '1', societyId: '1', name: 'Alice Johnson', unitNumber: 'A-101', contact: '+1234567890', email: 'alice@example.com', occupancyType: 'Owner',
    sqFt: 1200, openingBalance: 0,
    membershipDate: '2020-01-15', shareCertificateNumber: '001', shareDistinctiveFrom: 1, shareDistinctiveTo: 5, nomineeName: 'Bob Johnson', nomineeRelation: 'Spouse', nominationDate: '2020-02-01'
  },
  { 
    id: '2', societyId: '1', name: 'Bob Smith', unitNumber: 'A-102', contact: '+1234567891', email: 'bob@example.com', occupancyType: 'Tenant',
    sqFt: 1200, openingBalance: 500
  },
  { 
    id: '3', societyId: '1', name: 'Charlie Brown', unitNumber: 'B-201', contact: '+1234567892', email: 'charlie@example.com', occupancyType: 'Owner',
    sqFt: 1500, openingBalance: 0,
    membershipDate: '2020-03-10', shareCertificateNumber: '002', shareDistinctiveFrom: 6, shareDistinctiveTo: 10, nomineeName: 'Sally Brown', nomineeRelation: 'Sister', nominationDate: '2020-03-20'
  },
  { 
    id: '4', societyId: '1', name: 'Diana Prince', unitNumber: 'B-202', contact: '+1234567893', email: 'diana@example.com', occupancyType: 'Owner',
    sqFt: 1500, openingBalance: 0,
    membershipDate: '2021-06-01', shareCertificateNumber: '003', shareDistinctiveFrom: 11, shareDistinctiveTo: 15
  },
  { 
    id: '5', societyId: '1', name: 'Evan Wright', unitNumber: 'C-301', contact: '+1234567894', email: 'evan@example.com', occupancyType: 'Tenant',
    sqFt: 950, openingBalance: 0 
  },
  // Society 2 Residents
  { 
    id: '6', societyId: '2', name: 'Frank Castle', unitNumber: '101', contact: '+1987654321', email: 'frank@example.com', occupancyType: 'Owner',
    sqFt: 2000, openingBalance: 1000
  },
];

export const MOCK_BILLS: Bill[] = [
  { 
    id: 'B001', societyId: '1', residentId: '1', residentName: 'Alice Johnson', unitNumber: 'A-101', 
    totalAmount: 150, interest: 0,
    items: [{ id: '1', description: 'Maintenance', type: 'Fixed', rate: 150, amount: 150 }],
    dueDate: '2023-10-05', status: PaymentStatus.PAID, generatedDate: '2023-10-01',
    paymentDetails: { date: '2023-10-04', mode: 'UPI', reference: 'UPI-123456', remarks: 'Paid via GPay' }
  },
  { 
    id: 'B002', societyId: '1', residentId: '2', residentName: 'Bob Smith', unitNumber: 'A-102', 
    totalAmount: 150, interest: 0,
    items: [{ id: '1', description: 'Maintenance', type: 'Fixed', rate: 150, amount: 150 }],
    dueDate: '2023-10-05', status: PaymentStatus.PENDING, generatedDate: '2023-10-01' 
  },
  { 
    id: 'B003', societyId: '1', residentId: '3', residentName: 'Charlie Brown', unitNumber: 'B-201', 
    totalAmount: 175, interest: 25,
    items: [
      { id: '1', description: 'Maintenance', type: 'Fixed', rate: 150, amount: 150 },
    ],
    dueDate: '2023-10-05', status: PaymentStatus.OVERDUE, generatedDate: '2023-10-01' 
  },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'E001', societyId: '1', category: 'Utilities', amount: 450, date: '2023-10-02', description: 'Common Area Electricity Bill', vendor: 'City Power Co.', paymentMode: 'Online', referenceNo: 'TXN-9988' },
  { id: 'E002', societyId: '1', category: 'Maintenance', amount: 120, date: '2023-10-10', description: 'Lift Repair', vendor: 'Elevator Techs Inc.', paymentMode: 'Cheque', referenceNo: '001234', bankName: 'HDFC Bank' },
  { id: 'E003', societyId: '1', category: 'Cleaning', amount: 300, date: '2023-10-15', description: 'Monthly Cleaning Service', vendor: 'CleanSquad', paymentMode: 'Cash' },
  { id: 'E004', societyId: '1', category: 'Security', amount: 800, date: '2023-10-01', description: 'Security Guard Salary', vendor: 'SecureCorp', paymentMode: 'Online' },
  { id: 'E005', societyId: '1', category: 'Gardening', amount: 150, date: '2023-10-20', description: 'Landscaping and Tree Trimming', vendor: 'Green Thumbs', paymentMode: 'Cash' },
  // Society 2 Expenses
  { id: 'E006', societyId: '2', category: 'Maintenance', amount: 500, date: '2023-10-05', description: 'Pool Cleaning', vendor: 'AquaClean', paymentMode: 'Online' },
];

export const MOCK_INCOME: Income[] = [
    { id: 'I001', societyId: '1', category: 'Interest', amount: 1200, date: '2023-10-31', description: 'Quarterly FD Interest', payer: 'Metro City Bank', mode: 'Bank Transfer' },
    { id: 'I002', societyId: '1', category: 'Rent', amount: 5000, date: '2023-10-15', description: 'Terrace Mobile Tower Rent', payer: 'Telecom Ltd', mode: 'Cheque' },
];

export const MOCK_NOTICES: Notice[] = [
  { id: 'N001', societyId: '1', title: 'AGM Meeting', content: 'Annual General Meeting will be held on 25th Oct at the Community Hall.', date: '2023-10-10', priority: 'High', type: 'General' },
  { id: 'N002', societyId: '1', title: 'Water Tank Cleaning', content: 'Water supply will be disrupted on Tuesday 10AM-2PM for cleaning.', date: '2023-10-18', priority: 'Medium', type: 'Maintenance' },
];

export const MOCK_MINUTES: MeetingMinutes[] = [
    {
        id: 'M001',
        societyId: '1',
        title: 'Annual General Meeting 2023',
        date: '2023-09-15',
        attendees: 'John Doe, Alice Johnson, Charlie Brown, +40 others',
        agenda: '1. Review of Accounts\n2. Appointment of Auditor\n3. Lift Modernization',
        discussion: 'Accounts were approved unanimously. M/s Shah & Co appointed as auditors. Lift quotes reviewed, pending 3rd quote.',
        actionItems: '1. Secretary to get 3rd quote for lift.\n2. Treasurer to file tax returns.'
    }
];

export const EXPENSE_CATEGORIES = ['Utilities', 'Maintenance', 'Cleaning', 'Security', 'Gardening', 'Events', 'Repairs', 'Administrative'];
export const INCOME_CATEGORIES = ['Interest', 'Rent', 'Fine/Penalty', 'Donation', 'Transfer Fee', 'Scrap Sale', 'Miscellaneous', 'Hall Booking'];
