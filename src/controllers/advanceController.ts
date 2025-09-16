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

    // Calculate net balance based on actual advances vs salary paid
    // CORRECT LOGIC: Net balance = total salary paid - base salary + total advances
    // This represents how much more salary needs to be paid (positive) or overpaid (negative)
    const baseSalary = user.salary || 0;
    const netBalance = totalSalaryPaid - baseSalary + totalAdvances;

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

    res.json({
      userId: user.id,
      userName: user.name,
      baseSalary: user.salary || 0,
      totalAdvances,
      totalSalaryPaid,
      netBalance,
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
    
    // CORRECT LOGIC: Advance is deducted from salary, not added to it
    const advanceAdjustment = totalAdvances; // This is the amount to recover from advance
    const netSalary = Math.max(0, baseSalary - totalAdvances); // Net payment = Salary - Advance

    res.json({
      userId: user.id,
      userName: user.name,
      baseSalary: user.salary || 0,
      totalAdvances,
      totalSalaryPaid,
      advanceAdjustment,
      netSalary,
      month
    });
  } catch (error) {
    console.error('Error calculating advance adjustment:', error);
    res.status(500).json({ error: 'Failed to calculate advance adjustment' });
  }
};
