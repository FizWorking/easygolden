export interface Transaction {
  id: string;
  type: TransactionType;
  syncToken: string;
  fields: Record<string, unknown>;
}

export type TransactionType =
  | 'Invoice'
  | 'Bill'
  | 'Expense'
  | 'Check'
  | 'JournalEntry'
  | 'SalesReceipt'
  | 'ReceivePayment'
  | 'BillPayment'
  | 'Estimate'
  | 'CreditMemo'
  | 'VendorCredit'
  | 'PurchaseOrder'
  | 'Deposit'
  | 'Transfer';

export interface ParsedTransaction {
  rowNumber: number;
  type: TransactionType;
  fields: Record<string, string>;
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: ImportError[];
  qboIds: string[];
}

export interface ImportError {
  row: number;
  message: string;
  type: string;
}

export interface BatchResult {
  successCount: number;
  failureCount: number;
  results: Array<{ id: string; status: string; error?: string }>;
}

export interface CompanyInfo {
  id: string;
  name: string;
  email: string;
  country: string;
}

export interface AuthStatus {
  connected: boolean;
  company: CompanyInfo | null;
}
