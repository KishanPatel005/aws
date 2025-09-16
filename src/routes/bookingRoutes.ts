import { Router } from 'express';
import { getAllBookings, getBookingById, createBooking, updateBooking, deleteBooking, approveBooking, getBookingDistributions } from '../controllers/bookingController';

const router = Router();

router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

// Approval routes
router.post('/:id/approve', approveBooking);
router.get('/:id/distributions', getBookingDistributions);

export default router;
