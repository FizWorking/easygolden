import { ParsedTransaction, TransactionType } from '../types';

const VALID_TYPES: TransactionType[] = [
  'Invoice', 'Bill', 'Expense', 'Check', 'JournalEntry',
  'SalesReceipt', 'ReceivePayment', 'BillPayment', 'Estimate',
  'CreditMemo', 'VendorCredit', 'PurchaseOrder', 'Deposit', 'Transfer',
];

function detectTransactionType(headers: string[]): TransactionType {
  const headerStr = headers.map(h => h.toLowerCase()).join(' ');
  if (headerStr.includes('invoice') || headerStr.includes('inv')) return 'Invoice';
  if (headerStr.includes('bill') && !headerStr.includes('billpayment')) return 'Bill';
  if (headerStr.includes('expense') || (headerStr.includes('purchase') && !headerStr.includes('order'))) return 'Expense';
  if (headerStr.includes('check')) return 'Check';
  if (headerStr.includes('journal')) return 'JournalEntry';
  if (headerStr.includes('sales receipt') || headerStr.includes('sale receipt')) return 'SalesReceipt';
  if (headerStr.includes('payment') && (headerStr.includes('receive') || headerStr.includes('customer'))) return 'ReceivePayment';
  if (headerStr.includes('bill payment') || headerStr.includes('billpayment')) return 'BillPayment';
  if (headerStr.includes('estimate')) return 'Estimate';
  if (headerStr.includes('credit memo') || headerStr.includes('creditmemo')) return 'CreditMemo';
  if (headerStr.includes('vendor credit')) return 'VendorCredit';
  if (headerStr.includes('purchase order') || headerStr.includes('po')) return 'PurchaseOrder';
  if (headerStr.includes('deposit')) return 'Deposit';
  if (headerStr.includes('transfer')) return 'Transfer';
  return 'Invoice';
}

export function parseCSV(content: string, filename?: string): ParsedTransaction[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const type = detectTransactionType(headers);

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const fields: Record<string, string> = {};
    const errors: string[] = [];

    headers.forEach((header, idx) => {
      fields[header] = values[idx] || '';
    });

    if (Object.values(fields).every(v => !v)) continue;

    transactions.push({
      rowNumber: i + 1,
      type,
      fields,
      errors,
    });
  }

  return transactions;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function parseExcel(buffer: Buffer, filename?: string): Promise<ParsedTransaction[]> {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) throw new Error('No worksheet found in Excel file');

  const rows = worksheet.getRows(1, worksheet.rowCount) || [];
  if (rows.length < 2) throw new Error('Excel must have a header row and at least one data row');

  const headers = rows[0].values?.filter((v): v is string => v != null).map(String) || [];
  if (headers.length === 0) throw new Error('No headers found in Excel file');

  const type = detectTransactionType(headers);
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i].values?.filter((v): v is string => v != null).map(String) || [];
    if (values.length === 0 || values.every(v => !v)) continue;

    const fields: Record<string, string> = {};
    const errors: string[] = [];

    headers.forEach((header, idx) => {
      fields[header] = values[idx] || '';
    });

    transactions.push({
      rowNumber: i + 1,
      type,
      fields,
      errors,
    });
  }

  return transactions;
}

export async function parsePDF(buffer: Buffer, filename?: string): Promise<ParsedTransaction[]> {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  const text = data.text;

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('PDF has insufficient content to parse');

  const rows: string[][] = [];
  let currentRow: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\s*$/.test(trimmed)) {
      if (currentRow.length > 0) {
        rows.push([...currentRow]);
        currentRow = [];
      }
      continue;
    }
    const parts = trimmed.split(/\s{2,}|\t/).filter(p => p.trim());
    currentRow.push(...parts);
  }
  if (currentRow.length > 0) rows.push(currentRow);

  if (rows.length < 2) throw new Error('Could not identify structured data in PDF');

  const headers = rows[0];
  const type = detectTransactionType(headers);
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const fields: Record<string, string> = {};
    const errors: string[] = [];

    headers.forEach((header, idx) => {
      fields[header] = row[idx] || '';
    });

    transactions.push({
      rowNumber: i + 1,
      type,
      fields,
      errors,
    });
  }

  return transactions;
}

export async function parseImage(buffer: Buffer, filename?: string): Promise<ParsedTransaction[]> {
  const { createWorker } = require('tesseract.js');
  const worker = await createWorker('eng');
  const { data } = await worker.recognize(buffer);
  await worker.terminate();

  const text = data.text;
  return parsePDF(Buffer.from(text), filename);
}

export function transactionsToCSV(transactions: Record<string, unknown>[]): string {
  if (transactions.length === 0) return '';
  const headers = Object.keys(transactions[0]);
  const csvLines = [headers.join(',')];

  for (const tx of transactions) {
    const row = headers.map(h => {
      const val = String(tx[h] ?? '');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvLines.push(row.join(','));
  }

  return csvLines.join('\n');
}
