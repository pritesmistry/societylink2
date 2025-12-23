
export enum PaymentStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  OVERDUE = 'Overdue'
}

export type MainAccountGroup = 'Assets' | 'Liabilities' | 'Income' | 'Expenses';

export interface AccountHead {
  id: string;
  name: string;
  mainGroup: MainAccountGroup;
  subGroup: string;
  societyId: string;
}

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Staff' | 'Accountant';
  permissions: Record<ViewState, boolean>;
}

export interface BillLayout {
  title: string;
  showSocietyAddress: boolean;
  showBankDetails: boolean;
  showFooterNote: boolean;
  colorTheme: string; 
  showLogoPlaceholder: boolean;
  logo?: string; 
  template?: 'MODERN' | 'CLASSIC' | 'MINIMAL' | 'SPLIT_RECEIPT' | 'LEDGER';
  columns: {
    description: boolean;
    type: boolean;
    rate: boolean;
    amount: boolean;
  };
}

export interface Society {
  id: string;
  name: string;
  address: string;
  registrationNumber: string;
  gstNumber?: string; 
  gstEnabled?: boolean; 
  gstPercentage?: number; 
  financialYear?: string; 
  contactEmail: string;
  contactPhone: string;
  bankDetails: string;
  upiId?: string; 
  processedBy: string;
  footerNote: string; 
  footerNotes?: string[]; 
  totalUnits?: number;
  billLayout?: BillLayout;
  billingHeads?: BillItem[];
}

export interface Resident {
  id: string;
  societyId: string;
  name: string;
  unitNumber: string; 
  contact: string;
  email: string;
  occupancyType: 'Owner' | 'Tenant';
  sqFt: number;
  openingBalance: number;
  membershipDate?: string;
  shareCertificateNumber?: string;
  shareDistinctiveFrom?: number;
  shareDistinctiveTo?: number;
  nomineeName?: string;
  nomineeRelation?: string;
  nominationDate?: string;
  whatsappNumber?: string;
}

export interface BillItem {
  id: string;
  description: string;
  type: 'Fixed' | 'SqFt';
  rate: number; 
  amount: number; 
}

export interface PaymentDetails {
  date: string;
  mode: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer';
  reference: string;
  remarks: string;
}

export interface Bill {
  id: string;
  societyId: string;
  residentId: string;
  residentName: string;
  unitNumber: string;
  items: BillItem[];
  interest: number; 
  gstAmount?: number; 
  totalAmount: number; 
  dueDate: string;
  status: PaymentStatus;
  generatedDate: string;
  billMonth?: string;
  paymentDetails?: PaymentDetails;
  customNotes?: string[]; 
}

export interface Expense {
  id: string;
  societyId: string;
  category: string; 
  amount: number;
  date: string;
  description: string;
  vendor: string;
  paymentMode?: 'Cash' | 'Cheque' | 'Online' | 'Journal' | 'Debit Note' | 'Credit Note';
  referenceNo?: string; 
  bankName?: string;
  mainGroup?: MainAccountGroup;
  accountHeadId?: string;
  accountHeadName?: string;
}

export interface Income {
    id: string;
    societyId: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    payer: string;
    mode: 'Bank Transfer' | 'Cheque' | 'Cash';
    referenceNo?: string;
    bankName?: string;
}

export interface Notice {
  id: string;
  societyId: string;
  title: string;
  content: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Maintenance' | 'Event' | 'General' | 'Emergency';
}

export interface MeetingMinutes {
    id: string;
    societyId: string;
    title: string;
    date: string;
    attendees: string;
    agenda: string;
    discussion: string;
    actionItems: string;
}

export type ViewState = 'DASHBOARD' | 'SOCIETIES' | 'RESIDENTS' | 'BILLING' | 'RECEIPTS' | 'INCOME' | 'EXPENSES' | 'VOUCHERS' | 'STATEMENTS' | 'BANK_RECONCILIATION' | 'STATUTORY_REGISTERS' | 'REPORTS' | 'MINUTES' | 'NOTICES' | 'TEMPLATES' | 'AI_INSIGHTS' | 'KNOWLEDGE_BASE' | 'SECURITY';
