import { Router, Request, Response } from 'express';
import { quickbooksService } from '../services/quickbooks';
import { requireAuth, getSessionToken } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/types', async (_req: Request, res: Response) => {
  const types = await quickbooksService.getTransactionTypes();
  res.json({ types });
});

router.get('/', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { type, startDate, endDate, maxResults } = req.query;
  const result = await quickbooksService.queryTransactions(token, (type as string) || 'Invoice', {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    maxResults: maxResults ? parseInt(maxResults as string, 10) : undefined,
  });

  res.json(result);
});

router.post('/import', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { transactions } = req.body;
  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'transactions array is required' });
  }

  const result = await quickbooksService.batchImport(token, transactions);
  res.json(result);
});

router.post('/delete', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const result = await quickbooksService.batchDelete(token, items);
  res.json(result);
});

router.put('/update', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const result = await quickbooksService.batchUpdate(token, items);
  res.json(result);
});

router.delete('/:type/:id', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { type, id } = req.params;
  const { syncToken } = req.query;

  if (!syncToken || typeof syncToken !== 'string') {
    return res.status(400).json({ error: 'syncToken is required' });
  }

  await quickbooksService.deleteTransaction(token, type, id, syncToken);
  res.json({ success: true });
});

export default router;
