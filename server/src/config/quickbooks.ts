export const QBO_API_BASE = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com',
  production: 'https://quickbooks.api.intuit.com',
};

export const QBO_DISCOVERY_DOC = 'https://developer.api.intuit.com/.well-known/openid_sandbox_configuration';

export const TRANSACTION_ENDPOINTS: Record<string, string> = {
  Invoice: '/invoice',
  Bill: '/bill',
  Expense: '/purchase',
  Check: '/purchase',
  JournalEntry: '/journalentry',
  SalesReceipt: '/salesreceipt',
  ReceivePayment: '/payment',
  BillPayment: '/billpayment',
  Estimate: '/estimate',
  CreditMemo: '/creditmemo',
  VendorCredit: '/vendorcredit',
  PurchaseOrder: '/purchaseorder',
  Deposit: '/deposit',
  Transfer: '/transfer',
};

export const QBO_SCOPES = [
  'com.intuit.quickbooks.accounting',
  'com.intuit.quickbooks.payment',
  'openid',
  'profile',
  'email',
  'phone',
  'address',
].join(' ');
