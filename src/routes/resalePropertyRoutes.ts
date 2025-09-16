import { Router } from 'express';
import { 
  getAllResaleProperties, 
  getResalePropertyById, 
  createResaleProperty, 
  updateResaleProperty, 
  toggleResalePropertyStatus, 
  duplicateResaleProperty, 
  deleteResaleProperty 
} from '../controllers/resalePropertyController';
import { uploadResaleMultiple } from '../middleware/upload';

const router = Router();

router.get('/', getAllResaleProperties);
router.get('/:id', getResalePropertyById);
router.post('/', uploadResaleMultiple, createResaleProperty);
router.put('/:id', uploadResaleMultiple, updateResaleProperty);
router.patch('/:id/status', toggleResalePropertyStatus);
router.post('/:id/duplicate', duplicateResaleProperty);
router.delete('/:id', deleteResaleProperty);

export default router;
