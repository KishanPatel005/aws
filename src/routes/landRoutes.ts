import { Router } from 'express';
import { getAllLands, getLandById, createLand, updateLand, toggleLandStatus, deleteLand } from '../controllers/landController';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

router.get('/', getAllLands);
router.get('/:id', getLandById);
router.post('/', uploadMultiple, createLand);
router.put('/:id', uploadMultiple, updateLand);
router.patch('/:id/status', toggleLandStatus);
router.delete('/:id', deleteLand);

export default router;
