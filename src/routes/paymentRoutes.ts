import { Router } from 'express';
import { getAllPayments, getPaymentById, createPayment, updatePayment, deletePayment } from '../controllers/paymentController';

const router = Router();

router.get('/', getAllPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;
