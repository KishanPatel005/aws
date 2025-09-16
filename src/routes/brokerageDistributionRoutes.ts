import { Router } from 'express';
import { getAllBrokerageDistributions, getBrokerageDistributionById, createBrokerageDistribution, updateBrokerageDistribution, deleteBrokerageDistribution } from '../controllers/brokerageDistributionController';

const router = Router();

router.get('/', getAllBrokerageDistributions);
router.get('/:id', getBrokerageDistributionById);
router.post('/', createBrokerageDistribution);
router.put('/:id', updateBrokerageDistribution);
router.delete('/:id', deleteBrokerageDistribution);

export default router;
