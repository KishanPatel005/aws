import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get advance summary for a user
export const getAdvanceSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { month } = req.query;

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, name: true, salary: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all advances for the user
    const advances = await prisma.expense.findMany({
      where: {
        toUserId: parseInt(userId),
        type: 'ADVANCE'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get salary payments for the user
    const salaryPayments = await prisma.expense.findMany({
      where: {
        toUserId: parseInt(userId),
        type: 'SALARY'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate total advances paid (only actual ADVANCE expenses)
    const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);

    // Calculate total salary paid
    const totalSalaryPaid = salaryPayments.reduce((sum, salary) => sum + salary.amount, 0);

    // SIMPLE LOGIC: 
    // - Remaining advance = Total advances - Total salary paid
    // - If remaining advance > 0: Employee owes money
    // - If remaining advance = 0: Balanced
    // - If remaining advance < 0: Overpaid (shouldn't happen in normal cases)
    const baseSalary = user.salary || 0;
    const remainingAdvance = Math.max(0, totalAdvances - totalSalaryPaid);
    const netBalance = remainingAdvance; // This is the remaining advance balance

    // Filter by month if provided
    let monthAdvances = advances;
    let monthSalary = salaryPayments;
    
    if (month) {
      monthAdvances = advances.filter(advance => 
        advance.createdAt.toISOString().includes(month as string)
      );
      monthSalary = salaryPayments.filter(salary => 
        salary.month === month
      );
    }

    // Format advance details for frontend
    const advanceDetails = advances.map(advance => ({
      month: advance.month || 'N/A',
      amount: advance.amount,
      date: advance.createdAt.toISOString().split('T')[0]
    }));

    // Calculate suggested amount (simple logic)
    const suggestedAmount = Math.max(0, baseSalary - remainingAdvance);

    res.json({
      userId: user.id,
      userName: user.name,
      baseSalary: user.salary || 0,
      totalAdvances,
      totalSalaryPaid,
      netBalance,
      remainingAdvance,
      suggestedAmount,
      advanceDetails,
      advances: monthAdvances,
      salaryPayments: monthSalary,
      monthFilter: month || null
    });
  } catch (error) {
    console.error('Error fetching advance summary:', error);
    res.status(500).json({ error: 'Failed to fetch advance summary' });
  }
};

// Get user salary and advance history
export const getUserFinancialHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { month } = req.query;

    let whereClause: any = {
      toUserId: parseInt(userId),
      type: { in: ['SALARY', 'ADVANCE'] }
    };

    // Filter by month if provided
    if (month) {
      whereClause.OR = [
        { month: month },
        { 
          AND: [
            { type: 'ADVANCE' },
            { createdAt: { gte: new Date(month + '-01') } }
          ]
        }
      ];
    }

    const history = await prisma.expense.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching user financial history:', error);
    res.status(500).json({ error: 'Failed to fetch user financial history' });
  }
};

// Calculate advance adjustment for salary booking
export const calculateAdvanceAdjustment = async (req: Request, res: Response) => {
  try {
    const { userId, month } = req.body;

    if (!userId || !month) {
      return res.status(400).json({
        error: 'User ID and month are required'
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all advances for the user up to the specified month
    const advances = await prisma.expense.findMany({
      where: {
        toUserId: parseInt(userId),
        type: 'ADVANCE',
        createdAt: { lte: new Date(month + '-31') }
      }
    });

    // Get all salary payments for the user up to the specified month
    const salaryPayments = await prisma.expense.findMany({
      where: {
        toUserId: parseInt(userId),
        type: 'SALARY',
        month: { lte: month }
      }
    });

    // Calculate totals
    const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);
    const totalSalaryPaid = salaryPayments.reduce((sum, salary) => sum + salary.amount, 0);
    const baseSalary = user.salary || 0;
    
    // SIMPLE LOGIC: 
    // - Remaining advance = Total advances - Total salary paid
    // - Net salary = Base salary - Remaining advance
    // - If remaining advance > base salary, then net salary = 0
    const remainingAdvance = Math.max(0, totalAdvances - totalSalaryPaid);
    const netSalary = Math.max(0, baseSalary - remainingAdvance);
    
    // Advance adjustment is the remaining advance that needs to be recovered
    const advanceAdjustment = remainingAdvance;

    res.json({
      userId: user.id,
      userName: user.name,
      baseSalary: user.salary || 0,
      totalAdvances,
      totalSalaryPaid,
      advanceAdjustment,
      netSalary,
      remainingAdvance,
      suggestedAmount: netSalary, // This is the amount that should be paid
      month
    });
  } catch (error) {
    console.error('Error calculating advance adjustment:', error);
    res.status(500).json({ error: 'Failed to calculate advance adjustment' });
  }
};
