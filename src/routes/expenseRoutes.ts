import { Router } from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController';

const router = Router();

// GET /api/expenses - Get all expenses
router.get('/', getAllExpenses);

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', getExpenseById);

// POST /api/expenses - Create new expense
router.post('/', createExpense);

// PUT /api/expenses/:id - Update expense
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', deleteExpense);

export default router;
