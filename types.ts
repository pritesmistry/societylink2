
export enum PaymentStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  OVERDUE = 'Overdue'
}

export interface BillLayout {
  title: string;
  showSocietyAddress: boolean;
  showBankDetails: boolean;
  showFooterNote: boolean;
  colorTheme: string; // Hex code
  showLogoPlaceholder: boolean;
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
  contactEmail: string;
  contactPhone: string;
  bankDetails: string;
  processedBy: string;
  footerNote: string;
  totalUnits?: number;
  billLayout?: BillLayout;
}

export interface Resident {
  id: string;
  societyId: string;
  name: string;
  unitNumber: string; // Flat No.
  contact: string;
  email: string;
  occupancyType: 'Owner' | 'Tenant';
  
  // Simplified Billing Fields
  sqFt: number;
  openingBalance: number;

  // Statutory Register Fields (Optional)
  membershipDate?: string;
  shareCertificateNumber?: string;
  shareDistinctiveFrom?: number;
  shareDistinctiveTo?: number;
  nomineeName?: string;
  nomineeRelation?: string;
  nominationDate?: string;
}

export interface BillItem {
  id: string;
  description: string;
  type: 'Fixed' | 'SqFt';
  rate: number; // Flat amount or Rate per SqFt
  amount: number; // Calculated Final Amount
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
  interest: number; // Late payment interest or penalty
  totalAmount: number; // Sum of items + interest
  
  dueDate: string;
  status: PaymentStatus;
  generatedDate: string;
  
  paymentDetails?: PaymentDetails;
}

export interface Expense {
  id: string;
  societyId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  // Voucher Details
  paymentMode?: 'Cash' | 'Cheque' | 'Online' | 'Journal';
  referenceNo?: string; // Cheque No or Txn ID
  bankName?: string;
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
    // Voucher Details
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

export type ViewState = 'DASHBOARD' | 'SOCIETIES' | 'RESIDENTS' | 'BILLING' | 'RECEIPTS' | 'INCOME' | 'RECEIPT_VOUCHERS' | 'EXPENSES' | 'VOUCHERS' | 'STATEMENTS' | 'BANK_RECONCILIATION' | 'STATUTORY_REGISTERS' | 'REPORTS' | 'MINUTES' | 'NOTICES' | 'AI_INSIGHTS';
