import { Router } from 'express';
import { getAllBuilders, getBuilderById, createBuilder, updateBuilder, deleteBuilder } from '../controllers/builderController';
import { uploadSingle, handleUploadError } from '../middleware/upload';

const router = Router();

router.get('/', getAllBuilders);
router.get('/:id', getBuilderById);
router.post('/', uploadSingle, handleUploadError, createBuilder);
router.put('/:id', uploadSingle, handleUploadError, updateBuilder);
router.delete('/:id', deleteBuilder);

export default router;
