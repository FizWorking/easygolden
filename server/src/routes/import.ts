import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, getSessionToken } from '../middleware/auth';
import { parseCSV, parseExcel, parsePDF, parseImage } from '../services/fileParser';
import { quickbooksService } from '../services/quickbooks';
import { AppError } from '../middleware/errorHandler';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, `Unsupported file type: ${file.mimetype}`));
    }
  },
});

const router = Router();

router.use(requireAuth);

router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No file uploaded');

  const { buffer, mimetype, originalname } = req.file;
  let transactions;

  switch (mimetype) {
    case 'text/csv':
    case 'application/vnd.ms-excel':
      transactions = parseCSV(buffer.toString('utf-8'), originalname);
      break;
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      transactions = await parseExcel(buffer, originalname);
      break;
    case 'application/pdf':
      transactions = await parsePDF(buffer, originalname);
      break;
    case 'image/jpeg':
    case 'image/png':
    case 'image/jpg':
      transactions = await parseImage(buffer, originalname);
      break;
    case 'text/plain':
      transactions = parseCSV(buffer.toString('utf-8'), originalname);
      break;
    default:
      throw new AppError(400, `Unhandled file type: ${mimetype}`);
  }

  res.json({ transactions, count: transactions.length });
});

router.post('/execute', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { transactions } = req.body;
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    throw new AppError(400, 'No transactions provided');
  }

  const result = await quickbooksService.batchImport(token, transactions);
  res.json(result);
});

export default router;
