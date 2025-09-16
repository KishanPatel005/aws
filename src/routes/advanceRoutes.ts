import { Router } from 'express';
import {
  getAdvanceSummary,
  getUserFinancialHistory,
  calculateAdvanceAdjustment
} from '../controllers/advanceController';

const router = Router();

// GET /api/advances/summary/:userId - Get advance summary for a user
router.get('/summary/:userId', getAdvanceSummary);

// GET /api/advances/history/:userId - Get user financial history
router.get('/history/:userId', getUserFinancialHistory);

// POST /api/advances/calculate - Calculate advance adjustment for salary booking
router.post('/calculate', calculateAdvanceAdjustment);

export default router;
