import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Event types
const EVENT_TYPES = {
  ADVANCE_GIVEN: 'ADVANCE_GIVEN',
  SALARY_ACCRUAL: 'SALARY_ACCRUAL',
  SALARY_PAYMENT: 'SALARY_PAYMENT',
  ADVANCE_RECOVERY: 'ADVANCE_RECOVERY'
} as const;

// Helper function to get or create employee balance
async function getOrCreateEmployeeBalance(employeeId: number) {
  let balance = await prisma.employeeBalance.findUnique({
    where: { employeeId }
  });

  if (!balance) {
    balance = await prisma.employeeBalance.create({
      data: {
        employeeId,
        advanceBalance: 0,
        salaryDueBalance: 0
      }
    });
  }

  return balance;
}

// Helper function to update employee balance
async function updateEmployeeBalance(employeeId: number, salaryDueDelta: Decimal, advanceDelta: Decimal) {
  await prisma.employeeBalance.upsert({
    where: { employeeId },
    update: {
      advanceBalance: {
        increment: advanceDelta
      },
      salaryDueBalance: {
        increment: salaryDueDelta
      }
    },
    create: {
      employeeId,
      advanceBalance: advanceDelta,
      salaryDueBalance: salaryDueDelta
    }
  });
}

// Helper function to validate business rules
async function validateBusinessRules(employeeId: number, eventType: string, amount: Decimal, adjustment?: Decimal) {
  const balance = await getOrCreateEmployeeBalance(employeeId);
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { salary: true }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const monthlySalary = new Decimal(employee.salary || 0);
  const currentAdvanceBalance = new Decimal(balance.advanceBalance);
  const currentSalaryDueBalance = new Decimal(balance.salaryDueBalance);

  switch (eventType) {
    case EVENT_TYPES.ADVANCE_RECOVERY:
      if (!adjustment) {
        throw new Error('Adjustment amount is required for advance recovery');
      }
      
      // Rule: adjustment ≤ advance_old + new_advance_given
      if (adjustment.greaterThan(currentAdvanceBalance)) {
        throw new Error(`Adjustment amount (${adjustment}) cannot exceed current advance balance (${currentAdvanceBalance})`);
      }
      break;

    case EVENT_TYPES.SALARY_PAYMENT:
      const totalPayment = amount.plus(adjustment || 0);
      const totalSalaryDue = monthlySalary.plus(currentSalaryDueBalance);
      
      // Rule: cash_pay + adjustment ≤ gross_salary + salary_due_old
      if (totalPayment.greaterThan(totalSalaryDue)) {
        throw new Error(`Total payment (${totalPayment}) cannot exceed total salary due (${totalSalaryDue})`);
      }
      break;
  }
}

// Create ledger entry
export const createLedgerEntry = async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      eventType,
      amount,
      accountFromId,
      monthRef,
      note,
      idempotencyKey
    } = req.body;

    const createdBy = req.user?.id;
    if (!createdBy) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Validate event type
    if (!Object.values(EVENT_TYPES).includes(eventType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid event type. Must be one of: ADVANCE_GIVEN, SALARY_ACCRUAL, SALARY_PAYMENT, ADVANCE_RECOVERY' 
      });
    }

    // Convert amount to Decimal
    const amountDecimal = new Decimal(amount);
    const adjustment = req.body.adjustment ? new Decimal(req.body.adjustment) : undefined;

    // Validate business rules
    await validateBusinessRules(employeeId, eventType, amountDecimal, adjustment);

    // Calculate deltas based on event type
    let salaryDueDelta = new Decimal(0);
    let advanceDelta = new Decimal(0);

    switch (eventType) {
      case EVENT_TYPES.ADVANCE_GIVEN:
        advanceDelta = amountDecimal;
        break;
      case EVENT_TYPES.SALARY_ACCRUAL:
        salaryDueDelta = amountDecimal;
        break;
      case EVENT_TYPES.SALARY_PAYMENT:
        salaryDueDelta = amountDecimal.negated();
        break;
      case EVENT_TYPES.ADVANCE_RECOVERY:
        if (!adjustment) {
          return res.status(400).json({ success: false, message: 'Adjustment amount is required for advance recovery' });
        }
        salaryDueDelta = adjustment.negated();
        advanceDelta = adjustment.negated();
        break;
    }

    // Create ledger entry in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check for idempotency
      if (idempotencyKey) {
        const existing = await tx.ledgerEntry.findUnique({
          where: { idempotencyKey }
        });
        if (existing) {
          return existing;
        }
      }

      // Create ledger entry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          employeeId,
          eventDate: new Date(),
          eventType,
          amount: amountDecimal,
          accountFromId,
          monthRef,
          note,
          createdBy,
          idempotencyKey,
          salaryDueDelta,
          advanceDelta
        },
        include: {
          employee: {
            select: { id: true, name: true, email: true }
          },
          accountFrom: {
            select: { id: true, name: true, type: true }
          },
          createdByUser: {
            select: { id: true, name: true }
          }
        }
      });

      // Update employee balance
      await updateEmployeeBalance(employeeId, salaryDueDelta, advanceDelta);

      return ledgerEntry;
    });

    res.json({
      success: true,
      data: result,
      message: 'Ledger entry created successfully'
    });

  } catch (error) {
    console.error('Error creating ledger entry:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create ledger entry'
    });
  }
};

// Get employee balances
export const getEmployeeBalances = async (req: Request, res: Response) => {
  try {
    const balances = await prisma.employeeBalance.findMany({
      include: {
        employee: {
          select: { id: true, name: true, email: true, salary: true }
        }
      },
      orderBy: {
        employee: { name: 'asc' }
      }
    });

    res.json({
      success: true,
      data: balances
    });

  } catch (error) {
    console.error('Error fetching employee balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee balances'
    });
  }
};

// Get ledger entries for an employee
export const getEmployeeLedger = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { monthRef, eventType, limit = 50, offset = 0 } = req.query;

    const where: any = { employeeId: parseInt(employeeId) };
    
    if (monthRef) {
      where.monthRef = monthRef;
    }
    
    if (eventType) {
      where.eventType = eventType;
    }

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        include: {
          accountFrom: {
            select: { id: true, name: true, type: true }
          },
          createdByUser: {
            select: { id: true, name: true }
          }
        },
        orderBy: { eventDate: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.ledgerEntry.count({ where })
    ]);

    res.json({
      success: true,
      data: entries,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Error fetching employee ledger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee ledger'
    });
  }
};

// Get accounts
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts'
    });
  }
};

// Create account
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { type, name } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Type and name are required'
      });
    }

    if (!['management', 'company'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "management" or "company"'
      });
    }

    const account = await prisma.account.create({
      data: { type, name }
    });

    res.json({
      success: true,
      data: account,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account'
    });
  }
};

// Process salary for a month
export const processSalary = async (req: Request, res: Response) => {
  try {
    const { employeeId, monthRef, cashPayment, adjustment, note } = req.body;
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get employee details and current balance
    const [employee, currentBalance] = await Promise.all([
      prisma.user.findUnique({
        where: { id: employeeId },
        select: { salary: true, name: true }
      }),
      getOrCreateEmployeeBalance(employeeId)
    ]);

    if (!employee || !employee.salary) {
      return res.status(400).json({
        success: false,
        message: 'Employee not found or salary not set'
      });
    }

    const monthlySalary = new Decimal(employee.salary);
    const currentAdvanceBalance = new Decimal(currentBalance.advanceBalance);
    const currentSalaryDueBalance = new Decimal(currentBalance.salaryDueBalance);
    
    // Calculate suggested amounts
    const suggestedCashPayment = monthlySalary.minus(currentAdvanceBalance);
    const suggestedAdvanceRecovery = currentAdvanceBalance;
    const totalDue = monthlySalary.plus(currentSalaryDueBalance);

    // Use provided values or calculate automatically
    const cashPaymentDecimal = new Decimal(cashPayment || suggestedCashPayment);
    const adjustmentDecimal = new Decimal(adjustment || suggestedAdvanceRecovery);

    // Validate business rules
    await validateBusinessRules(employeeId, EVENT_TYPES.SALARY_PAYMENT, cashPaymentDecimal, adjustmentDecimal);

    // Create ledger entries in transaction
    const result = await prisma.$transaction(async (tx) => {
      const entries = [];

      // 1. Salary accrual entry
      const accrualEntry = await tx.ledgerEntry.create({
        data: {
          employeeId,
          eventDate: new Date(),
          eventType: EVENT_TYPES.SALARY_ACCRUAL,
          amount: monthlySalary,
          monthRef,
          note: `Salary accrual for ${monthRef}`,
          createdBy,
          salaryDueDelta: monthlySalary,
          advanceDelta: new Decimal(0)
        }
      });
      entries.push(accrualEntry);

      // 2. Advance recovery entry (if advance balance > 0)
      if (currentAdvanceBalance.greaterThan(0)) {
        const recoveryEntry = await tx.ledgerEntry.create({
          data: {
            employeeId,
            eventDate: new Date(),
            eventType: EVENT_TYPES.ADVANCE_RECOVERY,
            amount: adjustmentDecimal,
            monthRef,
            note: note || `Advance recovery for ${monthRef}`,
            createdBy,
            salaryDueDelta: adjustmentDecimal.negated(),
            advanceDelta: adjustmentDecimal.negated()
          }
        });
        entries.push(recoveryEntry);
      }

      // 3. Salary payment entry (if cash payment > 0)
      if (cashPaymentDecimal.greaterThan(0)) {
        const paymentEntry = await tx.ledgerEntry.create({
          data: {
            employeeId,
            eventDate: new Date(),
            eventType: EVENT_TYPES.SALARY_PAYMENT,
            amount: cashPaymentDecimal,
            monthRef,
            note: note || `Cash payment for ${monthRef}`,
            createdBy,
            salaryDueDelta: cashPaymentDecimal.negated(),
            advanceDelta: new Decimal(0)
          }
        });
        entries.push(paymentEntry);
      }

      // Update employee balance
      const totalSalaryDueDelta = monthlySalary.minus(cashPaymentDecimal).minus(adjustmentDecimal);
      const totalAdvanceDelta = adjustmentDecimal.negated();
      
      await updateEmployeeBalance(employeeId, totalSalaryDueDelta, totalAdvanceDelta);

      return {
        entries,
        summary: {
          monthlySalary: monthlySalary.toNumber(),
          currentAdvanceBalance: currentAdvanceBalance.toNumber(),
          currentSalaryDueBalance: currentSalaryDueBalance.toNumber(),
          suggestedCashPayment: suggestedCashPayment.toNumber(),
          suggestedAdvanceRecovery: suggestedAdvanceRecovery.toNumber(),
          totalDue: totalDue.toNumber(),
          cashPayment: cashPaymentDecimal.toNumber(),
          advanceRecovery: adjustmentDecimal.toNumber()
        }
      };
    });

    res.json({
      success: true,
      data: result,
      message: 'Salary processed successfully'
    });

  } catch (error) {
    console.error('Error processing salary:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process salary'
    });
  }
};

// Give advance to employee
export const giveAdvance = async (req: Request, res: Response) => {
  try {
    const { employeeId, amount, accountFromId, note } = req.body;
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const amountDecimal = new Decimal(amount);

    // Create advance entry
    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.ledgerEntry.create({
        data: {
          employeeId,
          eventDate: new Date(),
          eventType: EVENT_TYPES.ADVANCE_GIVEN,
          amount: amountDecimal,
          accountFromId,
          monthRef: new Date().toISOString().slice(0, 7), // YYYY-MM format
          note: note || 'Advance given',
          createdBy,
          salaryDueDelta: new Decimal(0),
          advanceDelta: amountDecimal
        },
        include: {
          employee: {
            select: { id: true, name: true, email: true }
          },
          accountFrom: {
            select: { id: true, name: true, type: true }
          }
        }
      });

      // Update employee balance
      await updateEmployeeBalance(employeeId, new Decimal(0), amountDecimal);

      return entry;
    });

    res.json({
      success: true,
      data: result,
      message: 'Advance given successfully'
    });

  } catch (error) {
    console.error('Error giving advance:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to give advance'
    });
  }
};

// Get salary calculation suggestions for an employee
export const getSalaryCalculation = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { monthRef } = req.query;

    // Get employee details and current balance
    const [employee, currentBalance] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parseInt(employeeId) },
        select: { salary: true, name: true, email: true }
      }),
      getOrCreateEmployeeBalance(parseInt(employeeId))
    ]);

    if (!employee || !employee.salary) {
      return res.status(400).json({
        success: false,
        message: 'Employee not found or salary not set'
      });
    }

    const monthlySalary = new Decimal(employee.salary);
    const currentAdvanceBalance = new Decimal(currentBalance.advanceBalance);
    const currentSalaryDueBalance = new Decimal(currentBalance.salaryDueBalance);
    
    // Calculate suggested amounts
    const suggestedCashPayment = monthlySalary.minus(currentAdvanceBalance);
    const suggestedAdvanceRecovery = currentAdvanceBalance;
    const totalDue = monthlySalary.plus(currentSalaryDueBalance);

    // Check if this month's salary has already been processed
    const existingEntries = await prisma.ledgerEntry.findMany({
      where: {
        employeeId: parseInt(employeeId),
        monthRef: monthRef as string,
        eventType: EVENT_TYPES.SALARY_ACCRUAL
      }
    });

    const isProcessed = existingEntries.length > 0;

    res.json({
      success: true,
      data: {
        employee: {
          id: parseInt(employeeId),
          name: employee.name,
          email: employee.email,
          monthlySalary: monthlySalary.toNumber()
        },
        currentBalances: {
          advanceBalance: currentAdvanceBalance.toNumber(),
          salaryDueBalance: currentSalaryDueBalance.toNumber()
        },
        calculations: {
          monthlySalary: monthlySalary.toNumber(),
          suggestedCashPayment: suggestedCashPayment.toNumber(),
          suggestedAdvanceRecovery: suggestedAdvanceRecovery.toNumber(),
          totalDue: totalDue.toNumber(),
          netPayment: suggestedCashPayment.toNumber() // This is what should actually be paid
        },
        isProcessed,
        monthRef: monthRef as string
      }
    });

  } catch (error) {
    console.error('Error fetching salary calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary calculation'
    });
  }
};

// Get salary summary for a month
export const getSalarySummary = async (req: Request, res: Response) => {
  try {
    const { monthRef } = req.params;

    const summary = await prisma.ledgerEntry.groupBy({
      by: ['employeeId', 'eventType'],
      where: { monthRef },
      _sum: {
        salaryDueDelta: true,
        advanceDelta: true,
        amount: true
      }
    });

    // Get employee details
    const employeeIds = [...new Set(summary.map(s => s.employeeId))];
    const employees = await prisma.user.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true, email: true, salary: true }
    });

    const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

    const result = summary.map(item => ({
      employeeId: item.employeeId,
      employee: employeeMap.get(item.employeeId),
      eventType: item.eventType,
      totalAmount: item._sum.amount,
      salaryDueDelta: item._sum.salaryDueDelta,
      advanceDelta: item._sum.advanceDelta
    }));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching salary summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary summary'
    });
  }
};
