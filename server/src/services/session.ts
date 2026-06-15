import { QBOToken } from '../types';

const tokenStore = new Map<string, QBOToken>();

export function storeToken(sessionId: string, token: QBOToken): void {
  tokenStore.set(sessionId, token);
}

export function getToken(sessionId: string): QBOToken | undefined {
  return tokenStore.get(sessionId);
}

export function clearToken(sessionId: string): void {
  tokenStore.delete(sessionId);
}

export function hasValidToken(sessionId: string): boolean {
  const token = tokenStore.get(sessionId);
  if (!token) return false;
  return new Date() < token.expiresAt;
}
