import { Router } from 'express';
import { getAllBrokerageMappings, getBrokerageMappingById, createBrokerageMapping, updateBrokerageMapping, deleteBrokerageMapping } from '../controllers/brokerageMappingController';

const router = Router();

router.get('/', getAllBrokerageMappings);
router.get('/:id', getBrokerageMappingById);
router.post('/', createBrokerageMapping);
router.put('/:id', updateBrokerageMapping);
router.delete('/:id', deleteBrokerageMapping);

export default router;
