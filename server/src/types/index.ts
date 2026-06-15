export interface QBOConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export interface QBOToken {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: Date;
}

export interface ParsedTransaction {
  rowNumber: number;
  type: TransactionType;
  fields: Record<string, string>;
  errors: string[];
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

export interface ExportParams {
  types: TransactionType[];
  startDate?: string;
  endDate?: string;
  format: 'csv' | 'xlsx';
}

export interface BatchOperationResult {
  successCount: number;
  failureCount: number;
  results: Array<{
    id: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

export interface CompanyInfo {
  id: string;
  name: string;
  email: string;
  country: string;
}
