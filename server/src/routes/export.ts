import { Router, Request, Response } from 'express';
import { requireAuth, getSessionToken } from '../middleware/auth';
import { quickbooksService } from '../services/quickbooks';
import { transactionsToCSV } from '../services/fileParser';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(requireAuth);

router.post('/', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { types, startDate, endDate, format } = req.body;
  if (!types || !Array.isArray(types) || types.length === 0) {
    throw new AppError(400, 'At least one transaction type is required');
  }

  const allResults: Record<string, unknown>[] = [];

  for (const type of types) {
    const { results } = await quickbooksService.queryTransactions(token, type, {
      startDate,
      endDate,
      maxResults: 10000,
    });
    allResults.push(...results.map((r: unknown) => ({ _type: type, ...(r as Record<string, unknown>) })));
  }

  if (format === 'csv') {
    const csv = transactionsToCSV(allResults);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=qbo-export-${Date.now()}.csv`);
    res.send(csv);
    return;
  }

  res.json({ transactions: allResults, count: allResults.length });
});

export default router;
