import express from 'express';
import { getDashboardReports, searchDocuments, getReportBreakdown, debugDocuments, cleanupStaleDocuments } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Dashboard reports - accessible to all authenticated users
router.get('/reports', authenticateToken, getDashboardReports);

// Search documents - accessible to all authenticated users
router.get('/documents/search', authenticateToken, searchDocuments);

// Get detailed breakdown for a specific report
router.get('/reports/:reportId/breakdown', authenticateToken, getReportBreakdown);

// Debug documents - check if files actually exist
router.get('/debug/documents', authenticateToken, debugDocuments);

// Clean up stale document references
router.post('/cleanup/documents', authenticateToken, cleanupStaleDocuments);

export default router;
