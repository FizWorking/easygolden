import axios from 'axios';
import type { ParsedTransaction, ImportResult, BatchResult, AuthStatus, TransactionType } from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export async function login(): Promise<string> {
  const { data } = await api.get<{ authUrl: string }>('/auth/login');
  window.location.href = data.authUrl;
  return data.authUrl;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const { data } = await api.get<AuthStatus>('/auth/status');
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getTransactionTypes(): Promise<TransactionType[]> {
  const { data } = await api.get<{ types: TransactionType[] }>('/transactions/types');
  return data.types;
}

export async function getTransactions(
  type: string,
  params?: { startDate?: string; endDate?: string }
): Promise<{ results: Record<string, unknown>[]; totalCount: number }> {
  const { data } = await api.get('/transactions', {
    params: { type, ...params },
  });
  return data;
}

export async function parseFile(file: File): Promise<{ transactions: ParsedTransaction[]; count: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/import/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function importTransactions(transactions: ParsedTransaction[]): Promise<ImportResult> {
  const { data } = await api.post<ImportResult>('/import/execute', { transactions });
  return data;
}

export async function exportTransactions(params: {
  types: string[];
  format: 'csv' | 'json';
  startDate?: string;
  endDate?: string;
}): Promise<Blob | { transactions: Record<string, unknown>[]; count: number }> {
  if (params.format === 'csv') {
    const { data } = await api.post('/export', params, {
      responseType: 'blob',
    });
    return data;
  }
  const { data } = await api.post('/export', params);
  return data;
}

export async function deleteTransactions(items: Array<{ type: string; id: string; syncToken: string }>): Promise<BatchResult> {
  const { data } = await api.post<BatchResult>('/transactions/delete', { items });
  return data;
}

export async function updateTransactions(
  items: Array<{ type: string; id: string; syncToken: string; data: Record<string, unknown> }>
): Promise<BatchResult> {
  const { data } = await api.put<BatchResult>('/transactions/update', { items });
  return data;
}
