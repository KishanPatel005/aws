import express from 'express';
import { 
  createLedgerEntry, 
  getEmployeeBalances, 
  getEmployeeLedger, 
  getAccounts, 
  createAccount, 
  processSalary, 
  giveAdvance, 
  getSalarySummary,
  getSalaryCalculation
} from '../controllers/ledgerController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Ledger entries
router.post('/entries', createLedgerEntry);
router.get('/entries/employee/:employeeId', getEmployeeLedger);

// Employee balances
router.get('/balances', getEmployeeBalances);

// Accounts
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);

// Salary processing
router.post('/salary/process', processSalary);
router.get('/salary/calculation/:employeeId', getSalaryCalculation);
router.get('/salary/summary/:monthRef', getSalarySummary);

// Advance management
router.post('/advance/give', giveAdvance);

export default router;
