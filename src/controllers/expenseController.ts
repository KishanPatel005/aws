import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all expenses
export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

// Get expense by ID
export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

// Create new expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const { type, accountFrom, toUserId, month, amount, remarks, date } = req.body;

    // Validate required fields
    if (!type || !accountFrom || !amount || !date) {
      return res.status(400).json({
        error: 'Type, account from, amount, and date are required'
      });
    }

    // Validate expense type
    const validTypes = ['SALARY', 'ADVERTISEMENT', 'OFFICE', 'ADVANCE', 'WITHDRAWAL'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid expense type. Must be SALARY, ADVERTISEMENT, OFFICE, ADVANCE, or WITHDRAWAL'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number'
      });
    }

    // Validate toUserId if provided
    if (toUserId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(toUserId) }
      });

      if (!user) {
        return res.status(400).json({
          error: 'User not found'
        });
      }
    }

    // Validate month for salary type
    if (type === 'SALARY' && !month) {
      return res.status(400).json({
        error: 'Month is required for salary expenses'
      });
    }

    const expense = await prisma.expense.create({
      data: {
        type,
        accountFrom,
        toUserId: toUserId ? parseInt(toUserId) : null,
        month: month || null,
        amount: parseFloat(amount),
        remarks: remarks || null,
        date: new Date(date)
      },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

// Update expense
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, accountFrom, toUserId, month, amount, remarks, date } = req.body;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Validate expense type if provided
    if (type) {
      const validTypes = ['SALARY', 'ADVERTISEMENT', 'OFFICE', 'ADVANCE', 'WITHDRAWAL'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: 'Invalid expense type. Must be SALARY, ADVERTISEMENT, OFFICE, ADVANCE, or WITHDRAWAL'
        });
      }
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number'
      });
    }

    // Validate toUserId if provided
    if (toUserId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(toUserId) }
      });

      if (!user) {
        return res.status(400).json({
          error: 'User not found'
        });
      }
    }

    // Validate month for salary type
    if (type === 'SALARY' && !month) {
      return res.status(400).json({
        error: 'Month is required for salary expenses'
      });
    }

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        ...(type && { type }),
        ...(accountFrom && { accountFrom }),
        ...(toUserId !== undefined && { toUserId: toUserId ? parseInt(toUserId) : null }),
        ...(month !== undefined && { month: month || null }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(remarks !== undefined && { remarks: remarks || null }),
        ...(date && { date: new Date(date) })
      },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// Delete expense
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};
