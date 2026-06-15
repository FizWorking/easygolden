import { Request, Response, NextFunction } from 'express';
import { getToken, hasValidToken } from '../services/session';
import { AppError } from './errorHandler';

declare module 'express-session' {
  interface SessionData {
    qboSessionId?: string;
    companyInfo?: {
      id: string;
      name: string;
      email: string;
      country: string;
    };
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const sessionId = req.session?.qboSessionId;
  if (!sessionId || !hasValidToken(sessionId)) {
    throw new AppError(401, 'Not authenticated with QuickBooks. Please connect your account.');
  }
  next();
}

export function getSessionToken(req: Request) {
  const sessionId = req.session?.qboSessionId;
  if (!sessionId) return null;
  return getToken(sessionId) || null;
}
