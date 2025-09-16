import { Router } from 'express';
import { 
  getAllResaleBookings, 
  getResaleBookingById, 
  createResaleBooking, 
  updateResaleBooking, 
  approveResaleBooking, 
  deleteResaleBooking 
} from '../controllers/resaleBookingController';

const router = Router();

router.get('/', getAllResaleBookings);
router.get('/:id', getResaleBookingById);
router.post('/', createResaleBooking);
router.put('/:id', updateResaleBooking);
router.post('/:id/approve', approveResaleBooking);
router.delete('/:id', deleteResaleBooking);

export default router;
