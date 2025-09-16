import { Router } from 'express';
import { getAllInventory, getInventoryById, createInventory, updateInventory, deleteInventory } from '../controllers/inventoryController';

const router = Router();

router.get('/', getAllInventory);
router.get('/:id', getInventoryById);
router.post('/', createInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;
