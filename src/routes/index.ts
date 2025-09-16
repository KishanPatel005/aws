import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import expenseRoutes from './expenseRoutes';
import advanceRoutes from './advanceRoutes';
import builderRoutes from './builderRoutes';
import projectRoutes from './projectRoutes';
import inventoryRoutes from './inventoryRoutes';
import bookingRoutes from './bookingRoutes';
import paymentRoutes from './paymentRoutes';
import brokerageMappingRoutes from './brokerageMappingRoutes';
import brokerageDistributionRoutes from './brokerageDistributionRoutes';
import landRoutes from './landRoutes';
import landBookingRoutes from './landBookingRoutes';
import resalePropertyRoutes from './resalePropertyRoutes';
import resaleBookingRoutes from './resaleBookingRoutes';
import dashboardRoutes from './dashboardRoutes';
import ledgerRoutes from './ledgerRoutes';

const router = Router();

// API info route
router.get('/', (req, res) => {
  res.json({
    message: 'Real Estate Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      expenses: '/api/expenses',
      advances: '/api/advances',
      builders: '/api/builders',
      projects: '/api/projects',
      inventory: '/api/inventory',
      bookings: '/api/bookings',
      payments: '/api/payments',
      brokerageMapping: '/api/brokerage/mapping',
      brokerageDistribution: '/api/brokerage/distribution',
      lands: '/api/lands',
      landBookings: '/api/land-bookings',
      resaleProperties: '/api/resale-properties',
      resaleBookings: '/api/resale-bookings',
      dashboard: '/api/dashboard',
      ledger: '/api/ledger'
    }
  });
});

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Expense routes
router.use('/expenses', expenseRoutes);

// Advance routes
router.use('/advances', advanceRoutes);

// Builder routes
router.use('/builders', builderRoutes);

// Project routes
router.use('/projects', projectRoutes);

// Inventory routes
router.use('/inventory', inventoryRoutes);

// Booking routes
router.use('/bookings', bookingRoutes);

// Payment routes
router.use('/payments', paymentRoutes);

// Brokerage routes
router.use('/brokerage/mapping', brokerageMappingRoutes);
router.use('/brokerage/distribution', brokerageDistributionRoutes);

// Land routes
router.use('/lands', landRoutes);
router.use('/land-bookings', landBookingRoutes);

// Resale routes
router.use('/resale-properties', resalePropertyRoutes);
router.use('/resale-bookings', resaleBookingRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Ledger routes
router.use('/ledger', ledgerRoutes);

export default router;
