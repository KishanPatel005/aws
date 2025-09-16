import express from 'express';
import { getDashboardReports, searchDocuments, getReportBreakdown } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Dashboard reports - accessible to all authenticated users
router.get('/reports', authenticateToken, getDashboardReports);

// Search documents - accessible to all authenticated users
router.get('/documents/search', authenticateToken, searchDocuments);

// Get detailed breakdown for a specific report
router.get('/reports/:reportId/breakdown', authenticateToken, getReportBreakdown);

export default router;
