import { Router, Request, Response } from 'express';
import { config } from '../config';
import { quickbooksService } from '../services/quickbooks';
import { storeToken, clearToken } from '../services/session';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/login', (_req: Request, res: Response) => {
  const authUrl = quickbooksService.getAuthUrl();
  res.json({ authUrl });
});

router.get('/callback', async (req: Request, res: Response) => {
  const { code, error, realmId } = req.query;

  if (error) {
    throw new AppError(400, `QuickBooks auth error: ${error}`);
  }

  if (!code || typeof code !== 'string') {
    throw new AppError(400, 'No authorization code received');
  }

  const token = await quickbooksService.getTokenFromCode(code);
  if (realmId && typeof realmId === 'string') {
    token.realmId = realmId;
  }

  const sessionId = req.sessionID;
  storeToken(sessionId, token);
  req.session.qboSessionId = sessionId;

  const companyInfo = await quickbooksService.getCompanyInfo(token);
  req.session.companyInfo = companyInfo;

  res.redirect(`${config.frontendUrl}/dashboard`);
});

router.get('/status', (req: Request, res: Response) => {
  const sessionId = req.session?.qboSessionId;
  if (!sessionId) {
    res.json({ connected: false });
    return;
  }

  res.json({
    connected: true,
    company: req.session?.companyInfo || null,
  });
});

router.post('/logout', (req: Request, res: Response) => {
  const sessionId = req.session?.qboSessionId;
  if (sessionId) {
    clearToken(sessionId);
  }
  req.session.destroy(() => {});
  res.json({ success: true });
});

export default router;
