import { Router } from 'express';
import { 
  getAllLandBookings, 
  getLandBookingById, 
  createLandBooking, 
  updateLandBooking, 
  approveLandBooking, 
  rejectLandBooking, 
  deleteLandBooking 
} from '../controllers/landBookingController';

const router = Router();

router.get('/', getAllLandBookings);
router.get('/:id', getLandBookingById);
router.post('/', createLandBooking);
router.put('/:id', updateLandBooking);
router.post('/:id/approve', approveLandBooking);
router.post('/:id/reject', rejectLandBooking);
router.delete('/:id', deleteLandBooking);

export default router;
